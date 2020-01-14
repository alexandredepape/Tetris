resizeElements();

$(window).resize(function(event) {
	resizeElements();
});

function resizeElements () {
	$(".gamecanvas").height($(window).height() * 0.8);
	$(".gamecanvas").width($(".gamecanvas").height()/2);
	$(".previewcanvas").height($(".gamecanvas").height()/20*3);
	$(".previewcanvas").width($(".gamecanvas").width()/10*5);
	$(".score").width($(".gamecanvas").width()/10*5);
}

