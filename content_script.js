function RatingsViewController(iframeBody){
    var R = {
        init: function(){
            R._func.injectCSS();
            R._func.loadHTML();
            R._func.bindEventHandlers();
        }
    };
    R.INSTRUCTOR_NAME_SELECTOR = 'span[id ^= "MTG_INSTR$"]';
    R._vars = {
        html: {},
        $iframeBody: $(iframeBody),
        ratingsCache: {},
    }
    R._cls = {
        EXPAND_RATING_ARROW: '.expand-rating-arrow',
        COLLAPSE_RATING_ARROW: '.collapse-rating-arrow',
        CLOSE_RATING: '.close-rating',
        RATING_HEADER: '.rating-header',
        RATING_VISIBILITY: '.rating-visibility',
        INSTRUCTOR_NAME: '.instructor-name',
        RATING_CONTAINER: '.rating-container',
        RATING_TABLE: '.rating-table',
        RATING_EXISTS: '.rating',
        INSTRUCTOR_DEPARTMENT: '.instructor-department',
        RATINGS_COUNT: '.ratings-count',
        DIFFICULTY_RATING: '.difficulty-rating',
        OVERALL_RATING: '.overall-rating',
    }
    R._str = {
        RATING_HTML: 'ratingHtml',
        NO_RATING_HTML: 'noRatingHtml',
        MULTIPLE_RATING_HTML: 'multipleRatingHtml',
        RATING_CSS: 'rating.css',
        INSTRUCTOR_PLACEHOLDER: 'Staff',
    }
    R._file = {
        RATING_HTML: 'rating.html',
        NO_RATING_HTML: 'no-rating.html',
        MULTIPLE_RATING_HTML: 'multiple-ratings.html',
    }
    R._func = {
        bindEventHandlers: function(){
            let e = R._eventHandlers;
            for (var i = 0; i < e.length; i++)
                e[i].$element.on(e[i].event, e[i].selector, e[i].handler);
        },
        setHTML: function(fileName, propertyToSet) {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', chrome.runtime.getURL(fileName), true);
            xhr.onload = function() {
                R._vars.html[propertyToSet] = xhr.responseText;
            }
            xhr.send();
        },
        injectCSS: function() {
            let cssLink = document.createElement('link');
            cssLink.href = chrome.runtime.getURL(R._str.RATING_CSS);
            cssLink.rel = 'stylesheet';
            cssLink.type = 'text/css';
            R._vars.$iframeBody.append($(cssLink));
        },
        loadHTML: function() {
            R._func.setHTML(R._file.RATING_HTML, R._str.RATING_HTML);
            R._func.setHTML(R._file.NO_RATING_HTML, R._str.NO_RATING_HTML);
            R._func.setHTML(R._file.MULTIPLE_RATING_HTML, R._str.MULTIPLE_RATING_HTML);
        },
        displayRating: function(instructorName, x, y) {
            let $ratingDiv = R._vars.ratingsCache[instructorName];
            if ($ratingDiv) {
                $ratingDiv.css({
                    position:'absolute',
                    left:x,
                    top:y
                })
                $ratingDiv.show();
            } else {
                chrome.runtime.sendMessage({instructorName}, function(response) {
                    let $newNode = undefined;
                    let rating = response.ratings;
                    if (rating) {
                        if (rating.length == 1) { //If only one rating exists, use single rating view.
                            $newNode = $($.parseHTML(R._vars.html[R._str.RATING_HTML]));
                            let $ratingSubContainer = $newNode.find(R._cls.RATING_EXISTS);
                            $ratingSubContainer.find(R._cls.INSTRUCTOR_DEPARTMENT).text(rating[0].department);
                            $ratingSubContainer.find(R._cls.RATINGS_COUNT).text(rating[0].ratingsCount);
                            $ratingSubContainer.find(R._cls.RATINGS_COUNT).attr('href',rating[0].link);
                            $ratingSubContainer.find(R._cls.OVERALL_RATING).text(rating[0].overallRating);
                            $ratingSubContainer.find(R._cls.DIFFICULTY_RATING).text(rating[0].difficultyRating);
                        } else { //If multiple instructors found, use multi rating view.
                            $newNode = $($.parseHTML(R._vars.html[R._str.MULTIPLE_RATING_HTML]));
                            let $ratingTable = $newNode.find(R._cls.RATING_TABLE);
                            for (var i = 0; i < rating.length; i++){
                                $ratingTable.append($(
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
                        $newNode = $($.parseHTML(R._vars.html[R._str.NO_RATING_HTML]));
                    }
                    $newNode.find(R._cls.INSTRUCTOR_NAME).text(instructorName);
                    $newNode.css({
                            position: 'absolute',
                            left:x,
                            top:y
                    });
                    R._vars.ratingsCache[instructorName] = $newNode;
                    R._vars.$iframeBody.append($newNode);
                    $newNode.show();
                });
            }         
        },
        hRatingDrag: function(e) {
            //Allows dragging of the rating container by the instructor name label.
            window.my_dragging = {};
            my_dragging.pageX0 = e.pageX;
            my_dragging.pageY0 = e.pageY;
            my_dragging.elem = $(this).closest(R._cls.RATING_CONTAINER);
            my_dragging.offset0 = $(my_dragging.elem).offset();
            function handle_dragging(e) {
                let left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
                let top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
                $(my_dragging.elem)
                .offset({top: top, left: left});
            }
            function handle_mouseup(e) {
                R._vars.$iframeBody
                .off('mousemove', handle_dragging)
                .off('mouseup', handle_mouseup);
            }
            R._vars.$iframeBody
            .on('mouseup', handle_mouseup)
            .on('mousemove', handle_dragging);
        },
    }
    R._eventHandlers = [
        {
            $element: R._vars.$iframeBody,
            event: 'mousedown',
            selector: R.INSTRUCTOR_NAME_SELECTOR,
            handler: function(e) {
                if (e.which == 1) {
                    let instructorName = $(this).text();
                    if (instructorName != R._str.INSTRUCTOR_PLACEHOLDER)
                        R._func.displayRating(instructorName, e.pageX + 50, e.pageY);
                }
            },
        },
        {
            $element: R._vars.$iframeBody,
            event: 'click',
            selector: R._cls.EXPAND_RATING_ARROW,
            handler: function() {
                $(this).hide();
                $(this).siblings(R._cls.COLLAPSE_RATING_ARROW).css({display: 'inline-block'});
                $(this).closest(R._cls.RATING_HEADER).siblings(R._cls.RATING_VISIBILITY).show();
            },
        },
        {
            $element: R._vars.$iframeBody,
            event: 'click',
            selector: R._cls.COLLAPSE_RATING_ARROW,
            handler: function() {
                $(this).hide();
                $(this).siblings(R._cls.EXPAND_RATING_ARROW).css({display: 'inline-block'});
                $(this).closest(R._cls.RATING_HEADER).siblings(R._cls.RATING_VISIBILITY).hide();
            },
        },
        {
            $element: R._vars.$iframeBody,
            event: 'click',
            selector: R._cls.CLOSE_RATING,
            handler: function() {
                $(this).closest(R._cls.RATING_CONTAINER).hide();
            },
        },
        {
            $element: R._vars.$iframeBody,
            event: 'mousedown',
            selector: R._cls.INSTRUCTOR_NAME,
            handler: R._func.hRatingDrag,
        },
    ]
    
    return R;
}

$(document).ready(function() {
  const IFRAME_ID = 'ptifrmtgtframe';
  let iframe = document.getElementById(IFRAME_ID);
  $(iframe).on('load', function () {
    let ratingsViewController = RatingsViewController(iframe.contentDocument.body);
    /*
        The website appears to use iframes to load content so the url stays the same and so 
        this script runs on any page because that's the only thing that can be whitelisted in 
        manifest.json.  To try to alleviate that issue, there's a check to see if an instructor
        name element can be found before initializing the rating view controller.
    */
    if ($(ratingsViewController.INSTRUCTOR_NAME_SELECTOR))
        ratingsViewController.init();
  });
});
