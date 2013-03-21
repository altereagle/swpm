// Style
$(function(){

	$('.notselected').hover(function(){
		$(this).css({backgroundColor: '#6699CC'});
	},function(){
		$(this).css({backgroundColor: '#fff'});
	});
	
	$('.tabs ').click(function(){
		var isSelected = $(this).attr('class') == 'selected';
		if(isSelected) return;
		$('.selected').removeClass('selected');
		$(this).addClass('selected');
		$(this).removeClass('notselected');
	});
});