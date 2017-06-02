function Ratings(){
    var ratingsCache = {};
    
    this.getRating = function(instructorName){
        if(instructorName in ratingsCache){
            console.log(ratingsCache[instructorName]);
        } else {
            instructorQuery = instructorName.replace(" ","+");
            //There is no official api for ratemyprofessor so it has to be done through unnofficial means.
            //This has the overhead of receiving an entire html webpage as a response, but it's the best
            //that can be done.  Caching results can help alleviate this.
            var query = `http://www.ratemyprofessors.com/search.jsp?query=${instructorQuery}+california+state+university+fresno`;
            
            chrome.runtime.sendMessage(({query: query}), function(response) {
                ratingsCache[instructorName] = response.ratings;
                console.log(response.ratings);
            });
        }
    }
}

//Class information lies in an iframe, but fortunately it is from the same domain so 
//it can be manipulated.
var iframeId = 'ptifrmtgtframe';
var iFrame = document.getElementById(iframeId);
var ratings = new Ratings();

$(iFrame).on("load", function () {
    iframeContents = $(iFrame).contents();
    //The instructor names lie in a span tag with an id pattern of MTG_INSTR$#
    //where # is the order the class appears in the search results.
    var instructorElementIds = "span[id*='MTG_INSTR$']";
    $(iframeContents).on('mouseover',instructorElementIds, function() {
        //console.log($(this).text());
        ratings.getRating($(this).text());
    });
});