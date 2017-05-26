//Class information lies in an iframe, but fortunately it is from the same domain so 
//it can be manipulated.
var iframeId = 'ptifrmtgtframe';
//The instructor names lie in a span tag with an id pattern of MTG_INSTR$#
//where # is the order the class appears in the search results.
var instructorElementIds = "span[id*='MTG_INSTR$']";
var iFrame = document.getElementById(iframeId);

$(iFrame).on("load", function () {
    iframeContents = $(iFrame).contents();
    $(iframeContents).on('mouseover',instructorElementIds, function() {
        console.log($(this).text());
    });
});