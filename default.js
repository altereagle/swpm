$(function(){
    var doc = $(document);
    var bkg1 = $('#bkg1');  // Background image 1
    var bkg2 = $('#bkg2');  // Background image 2
    var bkg3 = $('#bkg3');  // Background image 3
    
    function fadeOutBkgs(){             // Fade Out Backgrounds
        bkg2.hide();
        bkg3.fadeOut(3000);
    }
    
    function fadeInBkgs(){              // Fade In backgrounds
        bkg2.fadeIn(3000,function(){
            bkg3.fadeIn(3000,function(){
                fadeOutBkgs();
            });    
        });
    }
    
    function animateBackground(){
        fadeInBkgs();                   // Initial Fade
        setInterval(fadeInBkgs, 9000);  // Interval Fade (after initial is complete)
    }
    
    function arrangeBackground() {
        var centerPosition = (doc.width()/2 - 1200/2)/2;
        var maxWidth = doc.width() - centerPosition;
        var images = [bkg1, bkg2, bkg3];
        
        for(var i=0; i < images.length; i++){
            images[i].width(maxWidth);
            images[i].css("left", centerPosition);
        }
    }
    
    function buildMenu(){
        var body = $('body');
        var backdrop = $('<div />');
        var menu = $('<div />');
        var menuOption = $('<span />');
        
        backdrop.attr('id', "backdrop");
        menu.attr('id', "mainMenu");
        menuOption.attr('id', "mainMenuOption");
        
        menuOption.html("Statewide Planning Map");
        menu.append(menuOption);
        body.append(backdrop);
        body.append(menu);
    }
    
    arrangeBackground();
    animateBackground();
    buildMenu();
});