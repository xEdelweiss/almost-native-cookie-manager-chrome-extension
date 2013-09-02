chrome.devtools.panels.create(
    "Cookies",
    "icon32.png",
    "panel.html",

    /**
     * @author http://stackoverflow.com/users/1793477/sudarshan
     * @see    http://stackoverflow.com/questions/14265880/content-script-to-devtools-js-to-my-new-panel
     *
     * @todo   think about it
     */
    function(extensionPanel) {
        var _window; // Going to hold the reference to panel.html's `window`

        var data = [];
        var port = chrome.extension.connect({name:"ancm"});
        port.onMessage.addListener(function(msg) {
            // Write information to the panel, if exists.
            // If we don't have a panel reference (yet), queue the data.
            if (_window) {
                _window.portReceiver(msg);
            } else {
                data.push(msg);
            }
        });

        extensionPanel.onShown.addListener(function tmp(panelWindow) {
            extensionPanel.onShown.removeListener(tmp); // Run once only
            _window = panelWindow;

            // Release queued data
            var msg;
            while (msg = data.shift())
                _window.portReceiver(msg);
            // Just to show that it's easy to talk to pass a message back:
            _window.request = function(msg) {
                port.postMessage(msg);
            };
        });
    }
);