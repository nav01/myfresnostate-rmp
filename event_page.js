
//Returns an array of links, or undefined if there are no results.
function extractLinks(doc){
    const RESULT_LIST_CONTAINER_ID = "#searchResultsBox";
    const INSTRUCTOR_ITEM_CLASS = ".listing.PROFESSOR";
    const RESULT_COUNT_CLASS = ".result-count";
    const NO_RESULTS = "Your search didn't return any results."
    
    var resultsList = $(doc).find(RESULT_LIST_CONTAINER_ID).find(INSTRUCTOR_ITEM_CLASS);
    if($(resultsList).find(RESULT_COUNT_CLASS).text().trim() == NO_RESULTS){
        console.log("y tho");
        return undefined;
    }
    var ratingLinks = [];
    $(resultsList).find('a').each(function() {
        ratingLinks.push("http://www.ratemyprofessors.com" + $(this).attr('href'));
    });
    return ratingLinks;
}
//Gets the ratings from the links obtained by the extractLinks function. (Recursive)
//Sends an array of objects back to the content script.
function getRatings(links, sendResponse, ratings = []){
    const RATING_CONTAINER_CLASS = ".left-breakdown";
    const OVERALL_RATING_CONTAINER_CLASS = ".breakdown-container.quality";
    const DIFFICULTY_RATING_CONTAINER_CLASS = ".breakdown-section.difficulty";
    const RATING_CLASS = ".grade";
    //If the body tag has the .show_professor class, then there are ratings, otherwise, go to the next link.
    //An instructor page can exist even though there are no ratings so this is necessary in order to not return empty values.
    //Note: leave out the dot prefix because the JQuery hasClass() method is used.
    const RATINGS_CLASS = "show_professor";
    
    if(links.length == 0){
        if(ratings.length == 0){
            sendResponse({results: undefined});
        } else {
            sendResponse({ratings:ratings});
        }
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET",links.pop(),true);
    xhr.onload = function() {
        parser = new DOMParser();
        ratingPage = parser.parseFromString(xhr.responseText,"text/html");
        if($(ratingPage.body).hasClass(RATINGS_CLASS)){
            var overallRating = $(ratingPage).find(RATING_CONTAINER_CLASS).find(OVERALL_RATING_CONTAINER_CLASS).find(RATING_CLASS).text().trim();
            var difficultyRating = $(ratingPage).find(RATING_CONTAINER_CLASS).find(DIFFICULTY_RATING_CONTAINER_CLASS).find(RATING_CLASS).text().trim();
            ratings.push({overall: overallRating, difficulty: difficultyRating});
        }
        getRatings(links, sendResponse, ratings);
    }
    xhr.send();
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET",request.query, true);
    xhr.onload = function(){
        var ratingLinks = extractLinks($.parseHTML(xhr.responseText, undefined));
        if(ratingLinks == undefined) {
            sendResponse({results: undefined});
            return;
        }
        getRatings(ratingLinks,sendResponse);
    }
    xhr.send();
    return true;
  }
);