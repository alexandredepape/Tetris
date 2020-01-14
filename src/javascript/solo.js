const soloGame = new Game();
soloGame.run();
$(window).keydown(function(event) {
	soloGame.pressedKeys.set(soloGame.keyMap[event.keyCode], true);
});
$(window).keyup(function(event) {
	soloGame.actionPerformed.delete(soloGame.keyMap[event.keyCode]);
	soloGame.pressedKeys.delete(soloGame.keyMap[event.keyCode]);

});