$(function(){
    var bkg2 = $('#bkg2');  // Background image 1
    var bkg3 = $('#bkg3');  // Background image 2
    
    function fadeOutBkgs(){             // Fade Out Backgrounds
        bkg3.fadeOut(3000,function(){
            bkg2.fadeOut(3000);
        });
    }
    
    function fadeInBkgs(){              // Fade In backgrounds
        bkg2.fadeIn(3000,function(){
            bkg3.fadeIn(3000,function(){
                fadeOutBkgs();
            });    
        });
    }
    
    fadeInBkgs();                       // Initial Fade
    setInterval(fadeInBkgs, 12000);     // Interval Fade (after initial is complete)
    
    function buildMenu(){
        var body = $('body');
        var backdrop = $('<div />');
        var menu = $('<div />');
        var menuOption = $('<span />');
        
        backdrop.attr('id', "backdrop");
        menu.attr('id', "mainMenu");
        menuOption.attr('id', "mainMenuOption");
        
        menuOption.html("Menu Option");
        menu.append(menuOption);
        body.append(backdrop);
        body.append(menu);
    }
    
    buildMenu();
});