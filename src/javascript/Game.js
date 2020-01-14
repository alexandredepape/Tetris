
function Grid(rows, columns) {
	this.rows = rows + 2;
	this.columns = columns;
	this.effectiveRows = rows;
}
function Canvas(grid, canvasName, player) {
	this.player = player
	this.canvasName = canvasName;
	this.grid = grid;
	this.canvas = $("#" + player).find("." + this.canvasName)[0];
	this.strokeWidth = 5 / 100 * this.canvas.height / this.grid.effectiveRows;
	this.size = this.canvas.height / this.grid.effectiveRows;
	this.ctx = this.canvas.getContext('2d');
	this.backgroundColor = $("." + this.canvasName).css("background-color");
}
function Game() {
	this.gameGrid = new Grid(20, 10);
	this.previewGrid = new Grid(3, 5);
	this.gameCanvas = new Canvas(this.gameGrid, "gamecanvas", "player1");
	this.previewCanvas = new Canvas(this.previewGrid, "previewcanvas", "player1");
}
function Piece(color, blocks, choppedPiece) {
	if (typeof Piece.number == 'undefined') {
		Piece.number = 0;
	}
	this.number = Piece.number;
	Piece.number++;
	this.color = color;
	this.blocks = blocks;
	if (!choppedPiece) {
		this.centerBlock = new Block("CENTER", 0);
		this.blocks.push(this.centerBlock);
	}
	this.blocks.forEach(function (block) {
		block.piece = this;
	}, this);
}
function Block(direction, distance) {
	this.direction = direction;
	this.distance = distance;
}

function Index(row, column) {
	this.row = row;
	this.column = column;
}
Canvas.prototype = {
	constructor: Canvas,

	drawSquare: function (index, color) {
		if (index.row >= this.grid.rows - this.grid.effectiveRows) {
			this.ctx.fillStyle = color;
			this.ctx.globalAlpha = 1;
			this.ctx.fillRect(this.size * index.column + this.strokeWidth / 2, this.size * (index.row - (this.grid.rows - this.grid.effectiveRows)) + this.strokeWidth / 2, this.size - this.strokeWidth, this.size - this.strokeWidth);
		}
	},

	clearSquare: function (index) {
		if (index.row >= this.grid.rows - this.grid.effectiveRows) {
			this.ctx.fillStyle = this.backgroundColor;
			this.ctx.globalAlpha = 1;
			this.ctx.fillRect(this.size * index.column, this.size * (index.row - (this.grid.rows - this.grid.effectiveRows)), this.size, this.size);
		}
	},

	drawGhostSquare: function (index, color) {
		this.ctx.fillStyle = color;
		this.ctx.globalAlpha = 0.3;
		this.ctx.fillRect(this.size * index.column + this.strokeWidth / 2, this.size * (index.row - (this.grid.rows - this.grid.effectiveRows)) + this.strokeWidth / 2, this.size - this.strokeWidth, this.size - this.strokeWidth);
	},

	clearGhostSquare: function (index) {
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = this.backgroundColor;
		this.ctx.fillRect(this.size * index.column, this.size * (index.row - (this.grid.rows - this.grid.effectiveRows)), this.size, this.size);
	},

	drawPreviewSquare: function (index, color) {
		this.ctx.fillStyle = color;
		this.ctx.globalAlpha = 1;
		this.ctx.fillRect(this.size * index.column + this.strokeWidth / 2, this.size * index.row + this.strokeWidth / 2, this.size - this.strokeWidth, this.size - this.strokeWidth);
	},

	clearPreviewSquare: function (index) {
		this.ctx.fillStyle = this.backgroundColor;
		this.ctx.globalAlpha = 1;
		this.ctx.fillRect(this.size * index.column, this.size * index.row, this.size, this.size);
	},
};
Game.prototype = {
	constructor: Game,

	init: function () {
		this.running = true;
		this.paused = false;
		this.piecesPlaced = [];
		this.blocksCleared = [];
		this.blocksPlaced = this.create2DArray(this.gameGrid.rows, this.gameGrid.columns);
		this.level = 0;
		this.lines = 0;
		this.score = 0;
		this.lastRender = 0;
		this.linesScoring = {
			1: 40,
			2: 100,
			3: 300,
			4: 1200
		};
		this.keyMap = {
			39: "right",
			37: "left",
			38: "up",
			40: "down",
			83: "stop",
			32: "space",
			80: "p"
		};
		this.pressedKeys = new Map();
		this.actionPerformed = new Map();
	},

	create2DArray: function (rows, columns) {
		var arr = [];
		for (var i = 0; i < rows; i++) {
			arr[i] = new Array(columns).fill(null);
		}
		return arr;
	},

	getState: function () {
		let state = {};
		state.score = this.score;
		state.level = this.level;
		state.lines = this.lines;
		let blocks = [];
		this.piecesPlaced.forEach(piece => {
			piece.blocks.forEach(block => {
				blocks.push({
					"index": block.index,
					"color": piece.color
				});
			}, piece);
		});
		state.blocksCleared = this.blocksCleared;
		this.blocksCleared = [];
		state.blocks = blocks;
		state.currentPiece = this.currentPiece.getBlocks();
		state.nextPiece = this.nextPiece.getBlocks();
		return state;
	},

	run: function () {
		console.log("run");
		this.init();
		this.nextPiece = this.getNewPiece();
		this.newPiece();
		this.lastRender = performance.now();
		window.requestAnimationFrame(() => this.loop(performance.now()));
	},

	newPiece: function () {
		this.addPieceToGame();
		this.drawGhost(this.currentPiece);
		this.nextPiece = this.getNewPiece();
		this.nextPiece.place(new Index(0, 2));
		this.drawPreview();
	},
	clearPreview: function () {
		this.nextPiece.blocks.forEach(block => {
			this.previewCanvas.clearPreviewSquare(block.index);
		});
	},

	drawPreview: function () {
		this.nextPiece.blocks.forEach(block => {
			this.previewCanvas.drawPreviewSquare(block.index, block.piece.color);
		});
	},

	addPieceToGame: function () {
		if (this.nextPiece.centerBlock.index != null) {
			this.clearPreview();
		}
		this.currentPiece = this.nextPiece;
		this.currentPiece.place(new Index(0, this.gameGrid.columns / 2));
		this.running = this.canMove(this.currentPiece, "DOWN");
		this.drawPiece(this.currentPiece);
	},

	drawGhost: function (piece) {
		let currentPiecePosition = piece.centerBlock.index;
		this.moveToBottom(piece);
		piece.blocks.forEach(function (block) {
			this.gameCanvas.drawGhostSquare(block.index, block.piece.color);
		}, this);
		this.deleteBlocks(piece);
		piece.place(currentPiecePosition);

	},

	clearGhost: function (piece) {
		let currentPiecePosition = piece.centerBlock.index;
		this.moveToBottom(piece);
		piece.blocks.forEach(function (block) {
			this.gameCanvas.clearGhostSquare(block.index);
		}, this);
		this.deleteBlocks(piece);
		piece.place(currentPiecePosition);
	},

	drawPiece: function (piece) {
		piece.blocks.forEach(function (block) {
			this.gameCanvas.drawSquare(block.index, block.piece.color);
		}, this);
	},

	clearPiece: function (piece) {
		piece.blocks.forEach(function (block) {
			this.gameCanvas.clearSquare(block.index);
		}, this);
	},

	update: function () {
		if (this.canMove(this.currentPiece, "DOWN")) {
			this.clearPiece(this.currentPiece);
			this.moveCurrentPiece("DOWN");
			this.drawPiece(this.currentPiece);
		} else {
			this.setBlocks(this.currentPiece);
			this.checkCompletedRow();
			this.newPiece();
		}
	},

	canMove: function (piece, direction) {
		let collision = false;
		piece.blocks.forEach(block => {
			if (this.collisionInDirection(block, direction, block.index, 1)) {
				collision = true;
			}
		}, this);
		return !collision;
	},

	collisionInDirection: function (block, direction, index, distance) {
		let indexCollision = Direction.getIndexInDirection(direction, index, distance);
		return !this.validIndex(indexCollision) || (this.getBlock(indexCollision) !== null && !block.piece.equals(this.getBlock(indexCollision).piece));
	},

	moveCurrentPiece: function (direction) {
		if (this.canMove(this.currentPiece, direction)) {
			this.currentPiece.move(direction);
		}
	},

	validIndex: function (indexCollision) {
		return (indexCollision.column < this.gameGrid.columns &&
			indexCollision.column >= 0 &&
			indexCollision.row < this.gameGrid.rows &&
			indexCollision.row >= 0);
	},

	getBlock: function (index) {
		return this.blocksPlaced[index.row][index.column];
	},

	checkCompletedRow: function () {
		let completedRows = [];
		let completedRow;
		let emptyRow;
		let row = this.gameGrid.rows - 1;
		do {
			completedRow = true;
			emptyRow = true;
			for (let col = 0; col < this.gameGrid.columns; col++) {
				if (this.getBlock(new Index(row, col)) != null) {
					emptyRow = false;
				} else {
					completedRow = false;
				}
			}
			if (completedRow) {
				completedRows.push(row);
			}
			row--;
		}
		while (!emptyRow && row >= 0);
		if (completedRows.length > 0) {
			this.setScore(completedRows.length);
			completedRows.forEach(function (rowCleared) {
				this.clearRow(rowCleared);
			}, this);
			this.cascade();
			this.checkCompletedRow();
		}
	},

	setScore: function (lines) {
		this.score += this.linesScoring[lines] * (this.level + 1);
		$("#player1").find(".score").text("SCORE: " + this.score);
		this.setLines(lines);
		this.setLevel();

	},

	setLines: function (lines) {
		this.lines += lines;
		$("#player1").find(".lines").text("LINE: " + this.lines);
	},

	setLevel: function () {
		this.level = Math.floor(this.lines / 5);
		$("#player1").find(".level").text("LVL: " + this.level);
	},

	clearRow: function (row) {
		let piecesCleared = new Set();
		for (let i = 0; i < this.gameGrid.columns; i++) {
			let blockToClear = this.getBlock(new Index(row, i));
			this.removePart(blockToClear);
			this.piecesPlaced = this.piecesPlaced.filter(piece => !piece.equals(blockToClear.piece));
			piecesCleared.add(blockToClear.piece);
			this.gameCanvas.clearSquare(blockToClear.index, document.getElementById('canvas'));
			this.blocksCleared.push(blockToClear.index);
		}
		this.addChoppedPieces(piecesCleared);
	},

	removePart: function (blockToRemove) {
		this.blocksPlaced[blockToRemove.index.row][blockToRemove.index.column] = null;
		blockToRemove.piece.blocks = blockToRemove.piece.blocks.filter(b => !b.index.equals(blockToRemove.index));
	},

	cascade: function () {
		let piecesCanMove = true;
		//this.piecesPlaced.forEach(piece => this.clearPiece(piece), this);
		while (piecesCanMove) {
			let numberOfPiecesMoved = 0;
			this.piecesPlaced.forEach(piece => {
				if (this.canMove(piece, "DOWN")) {
					this.clearPiece(piece);
					piece.blocks.forEach(block => {
						this.blocksCleared.push(block.index);
					});
					this.deleteBlocks(piece);
					this.moveToBottom(piece);
					this.setBlocks(piece);
					this.drawPiece(piece);
					numberOfPiecesMoved++;
				}
			}, this);
			piecesCanMove = (numberOfPiecesMoved !== 0);
		}
		//this.piecesPlaced.forEach(piece => this.drawPiece(piece), this);
	},

	addChoppedPieces(piecesCleared) {
		piecesCleared.forEach(pieceCleared => {
			pieceCleared.getChoppedPieces().forEach(choppedPiece => this.piecesPlaced.push(choppedPiece));
		}, this);
	},

	checkInput: function () {
		if (this.pressedKeys.get("space") || this.pressedKeys.get("left") || this.pressedKeys.get("right") || this.pressedKeys.get("up") || this.pressedKeys.get("down")) {

			if (this.pressedKeys.get("left") && !this.actionPerformed.get("left")) {
				this.clearPiece(this.currentPiece);
				this.clearGhost(this.currentPiece);
				this.moveCurrentPiece("LEFT");
				this.drawGhost(this.currentPiece);
				this.drawPiece(this.currentPiece);
				this.actionPerformed.set("left", true);
			}
			if (this.pressedKeys.get("right") && !this.actionPerformed.get("right")) {
				this.clearPiece(this.currentPiece);
				this.clearGhost(this.currentPiece);
				this.moveCurrentPiece("RIGHT");
				this.drawGhost(this.currentPiece);
				this.drawPiece(this.currentPiece);
				this.actionPerformed.set("right", true);
			}
			if (this.pressedKeys.get("up") && !this.actionPerformed.get("up")) {
				this.clearPiece(this.currentPiece);
				this.clearGhost(this.currentPiece);
				this.rotate();
				this.drawGhost(this.currentPiece);
				this.drawPiece(this.currentPiece);
				this.actionPerformed.set("up", true);
			}
			if (this.pressedKeys.get("down")) {
				if (this.canMove(this.currentPiece, "DOWN")) {
					this.clearPiece(this.currentPiece);
					this.moveCurrentPiece("DOWN");
					this.drawPiece(this.currentPiece);
				} else {
					this.setBlocks(this.currentPiece);
					this.drawPiece(this.currentPiece);
					this.checkCompletedRow();
					this.newPiece();
				}
			}
			if (this.pressedKeys.get("space") && !this.actionPerformed.get("space")) {
				this.clearPiece(this.currentPiece);
				this.clearGhost(this.currentPiece);
				this.moveAndCreateNewPiece();
				this.drawGhost(this.currentPiece);
				this.actionPerformed.set("space", true);
			}
		}
		if (this.pressedKeys.get("p") && !this.actionPerformed.get("p")) {
			this.pauseGame();
			this.actionPerformed.set("p", true);
		}
	},
	pauseGame: function () {
		console.log("this.paused", this.paused);
		this.paused = !this.paused;
		console.log("this.paused", this.paused);
	},

	rotate: function () {
		if (this.canRotate(this.currentPiece)) {
			this.currentPiece.rotate();
		}
	},

	canRotate: function (piece) {
		let collision = false;
		piece.blocks.forEach(function (block) {
			if (this.collisionInDirection(block, Direction.getDirectionAfterRotation(block.direction), piece.centerBlock.index, block.distance)) {
				collision = true;
			}
		}, this);
		return !collision;
	},

	moveAndCreateNewPiece: function () {
		this.moveToBottom(this.currentPiece);
		this.drawPiece(this.currentPiece);
		this.setBlocks(this.currentPiece);
		this.checkCompletedRow();
		this.newPiece();
	},

	moveToBottom: function (piece) {
		while (this.canMove(piece, "DOWN")) {
			piece.move("DOWN");
		}
	},

	setBlocks: function (piece) {
		this.piecesPlaced.push(this.currentPiece);
		console.log("setBlocks");
		piece.blocks.forEach(block => this.blocksPlaced[block.index.row][block.index.column] = block);
	},

	deleteBlocks: function (piece) {
		piece.blocks.forEach(block => this.blocksPlaced[block.index.row][block.index.column] = null);
	},

	loop: function (now) {
		this.progress = now - this.lastRender;
		if (this.running) {
			this.checkInput();
			if (!this.paused && this.progress >= 100 + ((400 * ((100 - this.level * 5) / 100)) >= 0 ? (400 * ((100 - this.level * 5) / 100)) : 0)) {
				this.update();
				this.lastRender = now;
			}
		}
		window.requestAnimationFrame(() => this.loop(performance.now()));
	},

	getNewPiece: function () {
		let rand = Math.floor(Math.random() * 7);
		switch (rand) {
			case 0:
				//yellow
				return new Piece("#EBE25E", [new Block("LEFT", 1), new Block("DOWN", 1), new Block("RIGHT", 1)], false);
			case 1:
				return new Piece("#5FB4EF", [new Block("LEFT", 1), new Block("RIGHT", 1), new Block("RIGHT", 2)], false);
			case 2:
				return new Piece("#FA6F61", [new Block("LEFT", 1), new Block("DOWN", 1), new Block("DOWN_RIGHT", 1)], false);
			case 3:
				return new Piece("#A0F097", [new Block("LEFT", 1), new Block("RIGHT", 1), new Block("DOWN_LEFT", 1)], false);
			case 4:
				//cyan
				return new Piece("#7AEFDB", [new Block("RIGHT", 1), new Block("DOWN", 1), new Block("DOWN_LEFT", 1)], false);
			case 5:
				//orange
				return new Piece("#F3AE48", [new Block("LEFT", 1), new Block("RIGHT", 1), new Block("DOWN_RIGHT", 1)], false);
			case 6:
				//violet
				return new Piece("#F59CE4", [new Block("LEFT", 1), new Block("DOWN", 1), new Block("DOWN_LEFT", 1)], false);
		}

	}
};
Piece.prototype = {
	constructor: Piece,

	equals: function (piece) {
		return this.number === piece.number;
	},

	getBlocks: function () {
		let blocks = [];
		this.blocks.forEach(block => {
			blocks.push({ "index": block.index, "color": this.color });
		});
		return blocks;
	},

	mapToJson: function (map) {
		return JSON.stringify(map);
	},

	place: function (centerIndex) {
		this.blocks.forEach(block => {
			block.index = Direction.getIndexInDirection(block.direction, centerIndex, block.distance);
		});
	},

	move: function (direction) {
		this.blocks.forEach(block => {
			block.index = Direction.getIndexInDirection(direction, block.index, 1);
		});
	},

	rotate: function () {
		this.blocks.forEach(function (block) {
			block.direction = Direction.getDirectionAfterRotation(block.direction);
			block.index = Direction.getIndexInDirection(block.direction, this.centerBlock.index, block.distance);
		}, this);
	},

	getChoppedPieces() {
		let choppedPieces = [];
		let availableBlocks = this.blocks.slice();
		this.blocks.forEach(function (block) {
			if (availableBlocks.some(b => b.index.equals(block.index))) {
				let connectedBlocks = [];
				connectedBlocks.push(block);
				this.seekConnectedParts(block, connectedBlocks);
				choppedPieces.push(new Piece(this.color, connectedBlocks, true));
				connectedBlocks.forEach(connectedBlock => {
					availableBlocks = availableBlocks.filter(b => !b.index.equals(connectedBlock.index));
				});
			}
		}, this);
		return choppedPieces;
	},

	seekConnectedParts: function (block, connectedBlocks) {
		Direction.getCardinalDirections().forEach(direction => {
			let index = Direction.getIndexInDirection(direction, block.index, 1);
			if (this.blocks.some(b => b.index.equals(index)) && !connectedBlocks.some(b => b.index.equals(index))) {
				connectedBlocks.push(this.blocks.find(block => block.index.equals(index)));
				this.seekConnectedParts(this.blocks.find(block => block.index.equals(index)), connectedBlocks);
			}
		}, this);
	}
};
let Direction = {
	getIndexInDirection: function (direction, index, distance) {
		switch (direction) {
			case "RIGHT":
				return new Index(index.row, index.column + distance);
			case "UP_LEFT":
				return new Index(index.row - distance, index.column - distance);
			case "UP_RIGHT":
				return new Index(index.row - distance, index.column + distance);
			case "DOWN_LEFT":
				return new Index(index.row + distance, index.column - distance);
			case "DOWN_RIGHT":
				return new Index(index.row + distance, index.column + distance);
			case "DOWN":
				return new Index(index.row + distance, index.column);
			case "LEFT":
				return new Index(index.row, index.column - distance);
			case "UP":
				return new Index(index.row - distance, index.column);
			case "CENTER":
				return index;
		}
	},

	getDirectionAfterRotation: function (direction) {
		let map = new Map();
		map.set("UP", "RIGHT");
		map.set("UP_RIGHT", "DOWN_RIGHT");
		map.set("RIGHT", "DOWN");
		map.set("DOWN_RIGHT", "DOWN_LEFT");
		map.set("DOWN", "LEFT");
		map.set("DOWN_LEFT", "UP_LEFT");
		map.set("LEFT", "UP");
		map.set("UP_LEFT", "UP_RIGHT");
		map.set("CENTER", "CENTER");
		return map.get(direction);
	},

	getCardinalDirections: function () {
		let cardinalDirection = [];
		cardinalDirection.push("UP");
		cardinalDirection.push("DOWN");
		cardinalDirection.push("RIGHT");
		cardinalDirection.push("LEFT");
		return cardinalDirection;
	}

};
Index.prototype = {
	constructor: Index,

	equals: function (index) {
		return ((this.row === index.row) && (this.column === index.column));
	}
};
Block.prototype = {
	constructor: Block
};