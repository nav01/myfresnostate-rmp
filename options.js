class Options {
    //Meant to be a singleton so no problem with declaring 'constants' inside
    //due to javascript not allowing class level constants in the typical way.
    constructor() {
        //Days in ms. [0, 1, 7, 14, 30, 90, 180]
        this._VALID_FREQUENCIES = [8.64e+7, 6.048e+8, 1.21e+9, 2.592e+9, 7.776e+9, 1.555e+10]
        this._DEFAULTS = {updateFrequency: this._VALID_FREQUENCIES[1]};
    }
        
    init() {
        return new Promise(function(resolve, reject) {
            chrome.storage.local.get(this._DEFAULTS, function(result) {
                this.updateFrequency = result.updateFrequency;
                resolve(this);
            }.bind(this))
        }.bind(this));
    }
    
    set(options) {
        for (const [key, value] of Object.entries(options)) {
            if (key == 'updateFrequency')
                if (value in this._VALID_FREQUENCIES)
                    this[key] = value;
            else 
                this[key] = value;
        }
        chrome.storage.local.set(options);
    }
}

var options_loaded = new Options().init();

chrome.runtime.onMessage.addListener (
    function(request, sender, sendResponse) {
        if (request.msg == 'options.updateFrequency')
            options_loaded.then(function(options) {
                sendResponse({updateFrequency: options.updateFrequency});
            });
        return true;
  }
);