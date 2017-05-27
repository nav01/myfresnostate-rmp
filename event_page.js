//Only one function performed.
//This is a workaround to not being able to make the http request from the content script
//due to myfresnostate using https while ratemyprofessor uses http.
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET",request.query, false);
    xhr.send();
    sendResponse({rawHtml: xhr.responseText})
  }
);