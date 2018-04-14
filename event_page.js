//Returns an array of link/department pairs stored in an object, or undefined if there are no results.
function extractLinks(doc){
    const RESULT_LIST_CONTAINER_ID = '#searchResultsBox';
    const INSTRUCTOR_NAME_CLASS = '.main';
    const INSTRUCTOR_ITEM_CLASS = '.listing.PROFESSOR';
    const RESULT_COUNT_CLASS = '.result-count';
    const NO_RESULTS = "Your search didn't return any results.";
    //The search doesn't let you narrow by department so it has to be extracted from the
    //search results or rating page.  The department helps the user  in the case of multiple instructors 
    //with the same name.  Not helpful in the case that the two same named professors are in the same department,
    //but helpful in the school-wide case, which is a lot more likely.
    const INSTRUCTOR_DEPARTMENT_CLASS = '.sub';
    
    var resultsList = $(doc).find(RESULT_LIST_CONTAINER_ID).find(INSTRUCTOR_ITEM_CLASS);
    if ($(resultsList).find(RESULT_COUNT_CLASS).text().trim() == NO_RESULTS)
        return null;
    var ratingLinks = [];
    $(resultsList).find('a').each(function() {
        //The subheading that contains the department is in the form: "School_Name, Department"
        var department = $(this).find(INSTRUCTOR_DEPARTMENT_CLASS).text().split(',')[1].trim();
        ratingLinks.push({link: 'http://www.ratemyprofessors.com' + $(this).attr('href'), department});
    });
    return ratingLinks;
}

//Gets the ratings from the links obtained by the extractLinks function. (Recursive)
//Sends an array of objects back to the content script.
function getRatings(links, sendResponse, ratings = []) {
    const RATING_CONTAINER_CLASS = '.left-breakdown';
    const OVERALL_RATING_CONTAINER_CLASS = '.breakdown-container.quality';
    const DIFFICULTY_RATING_CONTAINER_CLASS = '.breakdown-section.difficulty';
    const RATING_CLASS = '.grade';
    const NUMBER_OF_RATINGS_CLASS = '.table-toggle.rating-count.active';
    //If the body tag has the .show_professor class, then there are ratings, otherwise, go to the next link.
    //An instructor page can exist even though there are no ratings so this is necessary in order to not return empty values.
    //Note: leave out the dot prefix because the JQuery hasClass() method is used.
    const RATINGS_EXIST_CLASS = 'show_professor';
 
    if (links.length == 0) { //Recursion termination condition.
        if (ratings.length == 0) {
            sendResponse({success: true, ratings: null});
        } else {
            sendResponse({success: true, ratings});
        }
        return;
    }
    var xhr = new XMLHttpRequest();
    var link = links.pop();
    xhr.open("GET", link.link, true);
    xhr.onload = function() {
        //Parses the rating page and extracts rating information then makes a recursive call on the outer method to process the remaining links.
        var parser = new DOMParser(); //Jquery parser ignores body so DOMParser is used instead.
        var ratingPage = parser.parseFromString(xhr.responseText, 'text/html');
        if ($(ratingPage.body).hasClass(RATINGS_EXIST_CLASS)) {
            var overallRating = $(ratingPage).find(RATING_CONTAINER_CLASS).find(OVERALL_RATING_CONTAINER_CLASS).find(RATING_CLASS).text().trim();
            var difficultyRating = $(ratingPage).find(RATING_CONTAINER_CLASS).find(DIFFICULTY_RATING_CONTAINER_CLASS).find(RATING_CLASS).text().trim();
            var ratingsCount = $(ratingPage).find(NUMBER_OF_RATINGS_CLASS).text().trim();
            ratings.push({link: link.link, department: link.department, ratingsCount, overallRating, difficultyRating});
        }
        getRatings(links, sendResponse, ratings);
    }
    xhr.send();
}

chrome.runtime.onMessage.addListener (
    function(request, sender, sendResponse) {
        if (request.msg == 'rating') {
            const UNIVERSITY_PARAMETER = '+california+state+university+fresno';
            const RMP = 'http://www.ratemyprofessors.com/search.jsp?query='
            let instructorParameter = request.instructorName.replace(/\s+/g, '+');
            let query = RMP + instructorParameter + UNIVERSITY_PARAMETER;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', query, true);
            xhr.onload = function() {
                var ratingLinks = extractLinks($.parseHTML(xhr.responseText, undefined));
                if (!ratingLinks) {
                    sendResponse({success: true, ratings: null});
                    return;
                }
                getRatings(ratingLinks, sendResponse);
            }
            xhr.onerror = function() {
                sendResponse({success: false});
            };
            xhr.send();
            return true;
        }
  }
);