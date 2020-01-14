const soloGame = new Game();

let gameGrid = new Grid(20, 10);
let previewGrid = new Grid(3, 5);
let blocksPlaced = soloGame.create2DArray(gameGrid.rows, gameGrid.columns);
let previewCanvas = new Canvas(previewGrid, "previewcanvas", "player2");
let gameCanvas = new Canvas(gameGrid, "gamecanvas", "player2");
let currentPiece;
let nextPiece;
$(window).keydown(function(event) {
	soloGame.pressedKeys.set(soloGame.keyMap[event.keyCode], true);
});
$(window).keyup(function(event) {
	soloGame.actionPerformed.delete(soloGame.keyMap[event.keyCode]);
	soloGame.pressedKeys.delete(soloGame.keyMap[event.keyCode]);

});

var websocket = new WebSocket("ws://109.128.87.139:8080/play/", "duo");
//var websocket = new WebSocket("ws://localhost:8080/play/", "duo");
websocket.onopen = function () {
	console.log("Opened!");
};

websocket.onmessage = function (evt) {
	console.log("message");
	var message = JSON.parse(evt.data);
	switch (message.task) {
		case "start":
		soloGame.run();
		break;
		case "getState":
		let state = JSON.stringify(soloGame.getState());
		websocket.send(state);
		break;
		case "updateState":
		if (JSON.parse(message.state) !== null) {
			updateState(JSON.parse(message.state));
		}
		break;
	}
};
function updateState (state) {
	console.log("state", state);
	
	if (currentPiece != null) {
		currentPiece.forEach(block => {
			gameCanvas.clearSquare(block.index);
		});
		state.currentPiece.forEach(block => {
			gameCanvas.drawSquare(block.index, block.color);
		});
		
	}
	if (currentPiece != null) {
		nextPiece.forEach(block => {
			previewCanvas.clearPreviewSquare(block.index);
		});
		
		state.nextPiece.forEach(block => {
			previewCanvas.drawPreviewSquare(block.index, block.color);
		});
		
	}
	state.blocksCleared.forEach(index => {
		gameCanvas.clearSquare(index);
	});
	state.blocks.forEach(block => {
		if (blocksPlaced[block.index.row][block.index.column] != block.color) {
			gameCanvas.drawSquare(block.index, block.color);
		}
	});
	currentPiece = state.currentPiece;
	nextPiece = state.nextPiece;
	$("#player2").find(".score").text("SCORE: " + state.score);
	$("#player2").find(".level").text("LVL: " + state.level);
	$("#player2").find(".lines").text("LINE: " + state.lines);
}
websocket.onclose = function () {
	console.log("Closed!");
};

websocket.onerror = function (err) {
	console.log("Error: " + err);
};