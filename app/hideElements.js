// Hide SWPM Elements
(function($){
    if(!$) return;  // This module requires jQuery
    $(function(){   // Runs when DOM is ready
		var hideToc = $('<button />')
			.attr('id','hideToc')
			.html('Hide Table')
			.css({
				zIndex: 9,
				position: 'absolute',
				bottom: 10,
				right: 10
			})
			.click(function(){
				// TODO: close tableDiv instead of TOC
				var tableDiv = $('#tableDiv');
				var tocVisible = tableDiv.is(':visible');
				
				if(tocVisible){
					tableDiv.fadeOut(function(){
						$('#outerDiv').animate({
							height: ($(document).innerHeight()-15) + "px"
						});
						$('#tableDiv').animate({
							bottom: "-" + ($(this).height()-40) + "px"
						});
						$('#readoutDiv').animate({
							bottom: "20px"
						});
					});
					$(this).html('Show Table')
				} else {
					$('#readoutDiv').animate({
						bottom: "252px"
					});
					$('#outerDiv').animate({
						height: ($(document).innerHeight()- $('#tableDiv').height() - 15) + "px"
					});
					$('#tableDiv').animate({
						bottom: ($(this).height()+ 15) + "px"
					},function(){
						tableDiv.fadeIn(function(){
							resizeRootElements()
							setTimeout(resizeRootElements,500)
						});
					});
					$(this).html('Hide Table')
				}
			})
			.appendTo($('#outerDiv'));
	});
}(jQuery));