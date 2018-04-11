function OptionsHandler(options) {
    let o = {
            _options: options,
            bindEventHandlers: function() {
                let e = o._eventHandlers;
                for (var i = 0; i < e.length; i++)
                    e[i].element.addEventListener(e[i].event, e[i].handler);
            },
            _id: {
                RATING_UPDATE_FREQUENCY: 'rating-update-frequency',
                SAVE: 'save-options',
            },
    }
    o._eventHandlers = [
            {
                element: document,
                event: 'DOMContentLoaded',
                handler: function() {
                    document.getElementById(o._id.RATING_UPDATE_FREQUENCY).value = o._options.updateFrequency.toExponential();
                }
            },
            {
                element: document.getElementById(o._id.SAVE),
                event: 'click',
                handler: function () {
                    let e = document.getElementById(o._id.RATING_UPDATE_FREQUENCY);
                    let updateFrequency = Number(e.options[e.selectedIndex].value);
                    o._options.set({updateFrequency});
                }
            },
    ]
    
    return o;
}

let options_loaded = chrome.extension.getBackgroundPage().options_loaded;
options_loaded.then(function(options) {
    let optionsHandler = OptionsHandler(options);
    optionsHandler.bindEventHandlers();
});