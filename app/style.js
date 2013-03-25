// jQuery Styles
(function($){
    if(!$) return;  // This module requires jQuery
    $(function(){   // Runs when DOM is ready

        function isSelected(selector){
            return $(selector).attr('class') == 'selected'; // Checks if the element has the class selected
        }

        function makeSelected(oldElementSelector, newElementSelector){
            $(oldElementSelector + '.selected')
                .removeClass('selected')
                .addClass('notselected');       // Remove any other selected classes.
            $(newElementSelector)
                .addClass('selected')           // Add selected class to this element.
                .removeClass('notselected');    // Remove not selected class from this element.
        }

        var toggleSelectedTab = function(selector){ // Expects a CSS selector as an argument
            $(selector).click(function(){           // When the element element is clicked...
                if(isSelected(this)) return;        // Return if element is already selected
                makeSelected(selector, this);       // Select this element;
            });
        };

        var toggleSelectedBasemap = function(selector){     // Expects a CSS selector as an argument
            $(selector).hover(function(){                   // When the element is hovered over...
                $(this).css({backgroundColor: '#6699CC'});  // Change the background color to blue...
            },function(){
                $(selector +'.notselected')
                    .css({backgroundColor: '#fff'});        // Then change it back to white if it is not selected.
            });

            $(selector).click(function(){                   // If the element is clicked
                if(isSelected(this)) return;                // Return if element is already selected

                makeSelected(selector, this);               // Select this element;

                $(selector + '.notselected')
                    .css({backgroundColor: '#fff'});        // Set all not selected element backgrounds to white
                $(selector + '.selected')
                    .css({backgroundColor: '#6699CC'});     // Set all selected element backgrounds to blue
            });
        };

        toggleSelectedTab('#tableOps > .tabs');                             // Make table options tabs selectable
        toggleSelectedTab('#tabsContainer > .tabs');                        // Make table Bottom tabs selectable
        toggleSelectedBasemap('#prjMaps > .tocTables > tbody > tr > td');   // Make basemaps selectable
    });
}(jQuery));