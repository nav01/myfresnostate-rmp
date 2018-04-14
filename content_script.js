//TODO CLEAR STORAGE WHEN NEAR FULL
function RatingsViewController(iframeBody){
    var R = {
        init: function(){
            R._func.injectCSS();
            R._func.loadHTML();
            R._func.bindEventHandlers();
        }
    };
    R._vars = {
        $iframeBody: $(iframeBody),
        currentlyLoadingRating: {}, //To prevent click spamming.
        html: {},
        ratingsCache: {},
    }
    R._cls = {
        CLOSE_RATING: '.close-rating',
        COLLAPSE_RATING_ARROW: '.collapse-rating-arrow',
        DIFFICULTY_RATING: '.difficulty-rating',
        EXPAND_RATING_ARROW: '.expand-rating-arrow',
        FORMATTING: 'formatting', //jquery argument
        FORMATTING_MULTI_RATING: 'formatting-multi-rating', //jquery argument
        INSTRUCTOR_DEPARTMENT: '.instructor-department',
        INSTRUCTOR_NAME: '.instructor-name',
        INSTRUCTOR_NAME_SELECTOR: 'span[id ^= "MTG_INSTR$"]',
        LOADING_CONTAINER: '.loading-container',
        OVERALL_RATING: '.overall-rating',
        RATING: '.rating',
        RATING_CONTAINER: '.rating-container',
        RATING_HEADER: '.rating-header',
        RATING_TABLE: '.rating-table',
        RATING_VISIBILITY: '.rating-visibility',
        RATINGS_COUNT: '.ratings-count',
    }
    R._str = {
        INSTRUCTOR_PLACEHOLDER: 'Staff',
        MULTIPLE_RATING_HTML: 'multipleRatingHtml',
        NO_RATING_HTML: 'noRatingHtml',
        RATING_HTML: 'ratingHtml',
        SINGLE_RATING_HTML: 'singleRatingHtml',
        CHROME_RUNTIME_ERROR_ALERT: 'An unexpected error occurred while getting rating.  Try again.',
        FAILED_TO_OBTAIN_RATING: 'Failed to obtain rating from ratemyprofessors, try again.  If issue persists, check http://www.ratemyprofessors.com to see whether the site is down.',
        FAILED_TO_OBTAIN_FILE: 'Failed to load a necessary extension file. Try reloading the page.  If issue persists, reinstall extension.',
        //chrome messages
        MSG_RATING: 'rating',
        MSG_OPTIONS_UPDATE_FREQUENCY: 'options.updateFrequency',
    }
    R._file = {
        MULTIPLE_RATING_HTML: 'multiple-ratings.html',
        NO_RATING_HTML: 'no-rating.html',
        RATING_CSS: 'rating.css',
        RATING_HTML: 'rating.html',
        SINGLE_RATING_HTML: 'single-rating.html',
    }
    R._func = {
        bindEventHandlers: function(){
            let e = R._eventHandlers;
            for (var i = 0; i < e.length; i++)
                e[i].$element.on(e[i].event, e[i].selector, e[i].handler);
        },
        setHTML: function(fileName, propertyToSet) {
            //Load HTML from file.
            let xhr = new XMLHttpRequest();
            xhr.open('GET', chrome.runtime.getURL(fileName), true);
            xhr.onload = function() {
                R._vars.html[propertyToSet] = xhr.responseText;
            }
            xhr.onerror = function() {
                alert(R._str.FAILED_TO_OBTAIN_FILE);
            }
            xhr.send();
        },
        injectCSS: function() {
            //Inject extension css into the iframe.
            let cssLink = document.createElement('link');
            cssLink.href = chrome.runtime.getURL(R._file.RATING_CSS);
            cssLink.rel = 'stylesheet';
            cssLink.type = 'text/css';
            R._vars.$iframeBody.append($(cssLink));
        },
        loadHTML: function() {
            //Load all html resources needed.
            R._func.setHTML(R._file.RATING_HTML, R._str.RATING_HTML);
            R._func.setHTML(R._file.SINGLE_RATING_HTML, R._str.SINGLE_RATING_HTML);
            R._func.setHTML(R._file.MULTIPLE_RATING_HTML, R._str.MULTIPLE_RATING_HTML);
            R._func.setHTML(R._file.NO_RATING_HTML, R._str.NO_RATING_HTML);
        },
        newLoadingRatingDiv: function(instructorName, x, y) {
            //Create new div with loading animation immediately on instructor click for user feedback.
            let $newNode = $($.parseHTML(R._vars.html[R._str.RATING_HTML]));
            $newNode.find(R._cls.INSTRUCTOR_NAME).text(instructorName);
            $newNode.css({
                position: 'absolute',
                left: x,
                top: y
            });
            R._vars.ratingsCache[instructorName] = $newNode;
            R._vars.$iframeBody.append($newNode);
        },
        updateLoadingRatingDiv: function(instructorName, ratings) {
            //Update div after ratings are obtained from storage/ratemyprofessor.
            let $node = R._vars.ratingsCache[instructorName];
            let $rating = $node.find(R._cls.RATING);
            let $loading = $node.find(R._cls.LOADING_CONTAINER);
            if (ratings) {
                if (ratings.length == 1) { //If only one rating exists, use single rating view.
                    let $singleRatingNode = $($.parseHTML(R._vars.html[R._str.SINGLE_RATING_HTML]));
                    $singleRatingNode.find(R._cls.INSTRUCTOR_DEPARTMENT).text(ratings[0].department);
                    $singleRatingNode.find(R._cls.RATINGS_COUNT).text(ratings[0].ratingsCount);
                    $singleRatingNode.find(R._cls.RATINGS_COUNT).attr('href',ratings[0].link);
                    $singleRatingNode.find(R._cls.OVERALL_RATING).text(ratings[0].overallRating);
                    $singleRatingNode.find(R._cls.DIFFICULTY_RATING).text(ratings[0].difficultyRating);
                    $rating.append($singleRatingNode);
                    $rating.show();
                    $loading.hide();
                    
                } else { //If multiple instructors found, use multi rating view.
                    let $multiRatingNode = $($.parseHTML(R._vars.html[R._str.MULTIPLE_RATING_HTML]));
                    for (var i = 0; i < ratings.length; i++){
                        $multiRatingNode.append($(
                            `<tr>
                                <td>${ratings[i].department}</td>
                                <td><a href=${ratings[i].link} target="_blank">${ratings[i].ratingsCount}</a></td>
                                <td>${ratings[i].overallRating}</td>
                                <td>${ratings[i].difficultyRating}</td>
                            </tr>`
                        ));
                    }
                    $rating.append($multiRatingNode);
                    $node.removeClass(R._cls.FORMATTING);
                    $node.addClass(R._cls.FORMATTING_MULTI_RATING);
                    $rating.show();
                    $loading.hide();
                }
            } else { //Zero ratings
                $rating.append($($.parseHTML(R._vars.html[R._str.NO_RATING_HTML])));
                $rating.show();
                $loading.hide();
            }
        },
        handleChromeRuntimeError: function(instructorName, error) {
            if (error) {
                R._vars.ratingsCache[instructorName].remove();
                delete R._vars.ratingsCache[instructorName];
                alert(R._str.CHROME_RUNTIME_ERROR_ALERT);
                return true;
            }
            return false;
        },
        displayRating: function(instructorName, x, y) {
            let $ratingDiv = R._vars.ratingsCache[instructorName];
            if ($ratingDiv) { //Cached during this session.
                $ratingDiv.css({
                    position: 'absolute',
                    left: x,
                    top: y
                })
                $ratingDiv.show();
            } else {
                R._func.newLoadingRatingDiv(instructorName, x, y);
                chrome.storage.local.get(instructorName, function(result) {//Rating stored locally?
                    if (R._func.handleChromeRuntimeError(instructorName, chrome.runtime.lastError))
                        return;
                    chrome.runtime.sendMessage({msg: R._str.MSG_OPTIONS_UPDATE_FREQUENCY}, function(response) {
                        if (!jQuery.isEmptyObject(result) && Date.now() - result[instructorName].date - response.updateFrequency < 0) {
                            R._func.updateLoadingRatingDiv(instructorName, result[instructorName].ratings);
                        } else if (!R._vars.currentlyLoadingRating[instructorName]) {
                            R._vars.currentlyLoadingRating[instructorName] = true;
                            chrome.runtime.sendMessage({msg: R._str.MSG_RATING, instructorName}, function(response) { //Get rating from ratemyprofessor.
                                if (R._func.handleChromeRuntimeError(instructorName, chrome.runtime.lastError))
                                    return;
                                if (response.success) {
                                    delete R._vars.currentlyLoadingRating[instructorName];
                                    chrome.storage.local.set({[instructorName]: {ratings: response.ratings, date: Date.now()}});
                                    R._func.updateLoadingRatingDiv(instructorName, response.ratings);
                                } else {
                                    R._vars.ratingsCache[instructorName].remove();
                                    delete R._vars.currentlyLoadingRating[instructorName];
                                    delete R._vars.ratingsCache[instructorName];
                                    alert(R._str.FAILED_TO_OBTAIN_RATING);
                                }
                            });
                        }
                    });
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
            selector: R._cls.INSTRUCTOR_NAME_SELECTOR,
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
    $(iframe).on('load', function() {
        let ratingsViewController = RatingsViewController(iframe.contentDocument.body);
        ratingsViewController.init();
    });
});
