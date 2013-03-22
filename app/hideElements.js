// Hide SWPM Elements
(function($){
    if(!$) return;  // This module requires jQuery
    $(function(){   // Runs when DOM is ready
		var hideToc = $('<button />')
			.attr('id','hideToc')
			.html('Hide Table of Contents')
			.css({
				zIndex: 9,
				position: 'absolute',
				top: 10,
				right: 110
			})
			.click(function(){
				var tocDiv = $('#tocDiv');
				var tocVisible = tocDiv.is(':visible');
				
				if(tocVisible){
					tocDiv.fadeOut(function(){
						$('#outerDiv').animate({
							left: "10px",
							width: ($(document).innerWidth()-40) + "px"
						});
						$('#tableDiv').animate({
							left: "10px",
							width: ($(document).innerWidth()-40) + "px"
						});
						$('#navTree').animate({
							left: "20px"
						});
						$('#readoutDiv').animate({
							left: "20px"
						});
						$('#linkOut').animate({
							right: "35px"
						});
						$('#hideToc').animate({
							right: "130px"
						});
					});
					$(this).html('Show Table of Contents')
				} else {
					$('#navTree').animate({
							left: "285px"
					});
					$('#readoutDiv').animate({
							left: "285px"
					});
					$('#linkOut').animate({
							right: "15px"
						});
						$('#hideToc').animate({
							right: "110px"
						});
					$('#outerDiv').animate({
						left: "277px",
						width: ($(document).width()- 285) + "px"
					});
					$('#tableDiv').animate({
						left: "277px",
						width: ($(document).width()- 285) + "px"
					},function(){
						tocDiv.fadeIn(function(){
							resizeRootElements()
							setTimeout(resizeRootElements,500)
						});
					});
						// resize innerdiv
						// resize tabe (if visible)
					$(this).html('Hide Table of Contents')
				}
			})
			.appendTo($('body'));
	});
}(jQuery));