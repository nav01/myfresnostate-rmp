function RatingsViewController(iframeBody){
    //HTML class and id constants.
    const EXPAND_RATING_ARROW = ".expand-rating-arrow";
    const COLLAPSE_RATING_ARROW = ".collapse-rating-arrow";
    const CLOSE_RATING = ".close-rating";
    const RATING_HEADER = ".rating-header";
    const RATING_VISIBILITY = ".rating-visibility";
    const INSTRUCTOR_NAME = ".instructor-name";
    const RATING_CONTAINER = ".rating-container";
    const RATING_TABLE = ".rating-table";
    
    const RATING_HTML = "ratingHtml";
    const NO_RATING_HTML = "noRatingHtml";
    const MULTIPLE_RATING_HTML = "multipleRatingHtml";
    var html = {};
    var iframeBody = iframeBody;
    var ratingDivs = {}; //Cache divs for performance.
      
    var setHtml = function(fileName,propertyToSet) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET",chrome.runtime.getURL(fileName), true);
        xhr.onload = function() {
            html[propertyToSet] = xhr.responseText;
        }
        xhr.send();
    }
    
    //Inject the styling into the iframe.
    let cssLink = document.createElement("link");
    cssLink.href = chrome.runtime.getURL("rating.css"); 
    cssLink.rel = "stylesheet"; 
    cssLink.type = "text/css"; 
    $(iframeBody).append(cssLink);
    //Collect the html for the three different rating cases once and parse as needed to create new nodes.
    setHtml("rating.html",RATING_HTML);
    setHtml("no-rating.html", NO_RATING_HTML);
    setHtml("multiple-ratings.html", MULTIPLE_RATING_HTML);
    
    $(iframeBody).on('click',EXPAND_RATING_ARROW, function(){
        $(this).hide();
        $(this).siblings(COLLAPSE_RATING_ARROW).css({display:'inline-block'});
        $(this).closest(RATING_HEADER).siblings(RATING_VISIBILITY).show();
    });
    $(iframeBody).on('click',COLLAPSE_RATING_ARROW, function(){
        $(this).hide();
        $(this).siblings(EXPAND_RATING_ARROW).css({display:'inline-block'});
        $(this).closest(RATING_HEADER).siblings(RATING_VISIBILITY).hide();
    });
    $(iframeBody).on('click',CLOSE_RATING, function(){
        $(this).closest(RATING_CONTAINER).hide();
    });
    $(iframeBody).on('mousedown', INSTRUCTOR_NAME, function(event) {
        //Allows dragging of the rating container by the instructor name label.
        window.my_dragging = {};
        my_dragging.pageX0 = event.pageX;
        my_dragging.pageY0 = event.pageY;
        my_dragging.elem = $(this).closest(RATING_CONTAINER);
        my_dragging.offset0 = $(my_dragging.elem).offset();
        function handle_dragging(e){
            let left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
            let top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
            $(my_dragging.elem)
            .offset({top: top, left: left});
        }
        function handle_mouseup(e){
            $(iframeBody)
            .off('mousemove', handle_dragging)
            .off('mouseup', handle_mouseup);
        }
        $(iframeBody)
        .on('mouseup', handle_mouseup)
        .on('mousemove', handle_dragging);
    });
    
    this.displayRating = function(instructorName, x, y) {
        let ratingDiv = ratingDivs[instructorName];
        if(ratingDiv){
            $(ratingDiv).css({
                position:'absolute',
                left:x,
                top:y
            })
            $(ratingDiv).show();
        } else {
            instructorParameter = instructorName.replace(" ","+");
            //There is no official api for ratemyprofessor so it has to be done through unnofficial means.
            //This has the overhead of receiving an entire html webpage as a response, but it's the best
            //that can be done.  Caching results can help alleviate this. Storing results on local storage may be better.
            let request = `http://www.ratemyprofessors.com/search.jsp?query=${instructorParameter}+california+state+university+fresno`;
            
            chrome.runtime.sendMessage(({rating: true, request}), function(response) {
                //HTML classes and ids
                const RATING_EXISTS = ".rating";
                const INSTRUCTOR_DEPARTMENT = ".instructor-department";
                const RATINGS_COUNT = ".ratings-count";
                const DIFFICULTY_RATING = ".difficulty-rating";
                const OVERALL_RATING = ".overall-rating";
                let newNode = undefined;
                let rating = response.ratings;
                if(rating) {
                    if(rating.length == 1){ //If only one rating exists, use single rating view.
                        newNode = $.parseHTML(html[RATING_HTML]);
                        let ratingSubContainer = $(newNode).find(RATING_EXISTS);
                        $(ratingSubContainer).find(INSTRUCTOR_DEPARTMENT).text(rating[0].department);
                        $(ratingSubContainer).find(RATINGS_COUNT).text(rating[0].ratingsCount);
                        $(ratingSubContainer).find(RATINGS_COUNT).attr('href',rating[0].link);
                        $(ratingSubContainer).find(OVERALL_RATING).text(rating[0].overallRating);
                        $(ratingSubContainer).find(DIFFICULTY_RATING).text(rating[0].difficultyRating);
                    } else { //If multiple instructors found, use multi rating view.
                        newNode = $.parseHTML(html[MULTIPLE_RATING_HTML]);
                        let ratingTable = $(newNode).find(RATING_TABLE);
                        for(var i = 0; i < rating.length; i++){
                            $(ratingTable).append($(
                                `<tr>
                                    <td>${rating[i].department}</td>
                                    <td><a href=${rating[i].link} target="_blank">${rating[i].ratingsCount}</a></td>
                                    <td>${rating[i].overallRating}</td>
                                    <td>${rating[i].difficultyRating}</td>
                                </tr>`
                            ));
                        }
                    }
                } else { //If zero ratings, use no rating view.
                    newNode = $.parseHTML(html[NO_RATING_HTML]);
                }
                $(newNode).find(INSTRUCTOR_NAME).text(instructorName);
                $(newNode).css({
                        position:'absolute',
                        left:x,
                        top:y
                });
                ratingDivs[instructorName] = newNode;
                iframeBody.append(newNode);
                $(newNode).show();
            });
        }
    }
}

/*TODO: 
    Same Iframe id used across multiple pages that aren't important to the extension so initialization
occurs more than it needs to.  Figure out how to only have it load on results page.
*/
$(document).ready(function() {
    const INSTRUCTOR_PLACEHOLDER = "Staff";
    const iframeId = 'ptifrmtgtframe';
    let iframe = document.getElementById(iframeId);
    $(iframe).on("load", function () {
        let iframeContents = $(iframe).contents();
        let iframeBody = $(iframeContents).find('body');
        let ratingsViewController = new RatingsViewController(iframeBody);
        //The instructor names lie in a span tag with an id pattern of MTG_INSTR$#
        //where # is the order the class appears in the search results.
        let instructorElementIds = "span[id*='MTG_INSTR$']";
        /* Wanted to use a click handler but the page's javascript was interfering
        with it and not triggering it.  There doesn't seem to be a clean solution to
        rebinding handler order so mouseover will have to do for now. */
        $(iframe.contentDocument).hoverIntent({
           over: function(event) {
                let instructorName = $(this).text();
                if(instructorName != INSTRUCTOR_PLACEHOLDER){
                    ratingsViewController.displayRating(instructorName,event.pageX+50,event.pageY);
                }
           },
           selector: instructorElementIds
        });
        
    });
});
