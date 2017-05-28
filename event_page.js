//Extracts the links to the instructor rating details from the ratemyprofessor search results.
function extractLinks(doc){
    const resultListContainerId = "#searchResultsBox";
    const instructorItemClass = ".listing.PROFESSOR";
    var resultsList = $(doc).find(resultListContainerId).find(instructorItemClass);
    var ratingLinks = [];
    $(resultsList).find('a').each(function() {
        ratingLinks.push("http://www.ratemyprofessors.com" + $(this).attr('href'));
    });
    return ratingLinks;
}
//Gets the ratings from the links obtained by the extractLinks function.
function getRatings(links){
    const ratingContainerClass = ".left-breakdown";
    const overallRatingContainerClass = ".breakdown-container.quality";
    const difficultyRatingContainerClass = ".breakdown-section.difficulty";
    const ratingClass = ".grade";
    var ratings = [];
    for(var i = 0; i < links.length; i++){
        let xhr = new XMLHttpRequest();
        xhr.open("GET",links[0],false);
        xhr.send();
        ratingPage = $.parseHTML(xhr.responseText,undefined);
        let overallRating = $(ratingPage).find(ratingContainerClass).find(overallRatingContainerClass).find(ratingClass).text().trim();
        let difficultyRating = $(ratingPage).find(ratingContainerClass).find(difficultyRatingContainerClass).find(ratingClass).text().trim();
        ratings.push({overall: overallRating, difficulty: difficultyRating});
    }
    return ratings;
}

//Only one function performed.
//This is a workaround to not being able to make the http request from the content script
//due to myfresnostate using https while ratemyprofessor uses http.
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET",request.query, false);
    xhr.send();
    //TODO: Evaluate performance.  Is this faster than regexp on the original string?
    var ratingLinks = extractLinks($.parseHTML(xhr.responseText, undefined));
    var ratings = getRatings(ratingLinks);
    sendResponse({ratings: ratings});
  }
);