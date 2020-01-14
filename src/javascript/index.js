$("#soloButton").on('click', function(event) {
	console.log("hey you");
	window.location.href = "../html/solo.html";
});
$("#duoButton").on('click', function(event) {
	console.log("hey you");
	window.location.href = "../html/duo.html";
});
$(window).resize(function(event) {
	resizeMenu();
})
