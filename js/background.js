var removeCookie = function(cookie) {
    console.log(cookie);

    chrome.tabs.query({"status":"complete","windowId":chrome.windows.WINDOW_ID_CURRENT,"active":true}, function(tab){
        chrome.cookies.remove({
            url: tab[0].url,
            name: cookie.name,
            storeId: cookie.storeId,
        });
    });
}

var getCookies = function(callback) {
    chrome.tabs.query({"status":"complete","windowId":chrome.windows.WINDOW_ID_CURRENT,"active":true}, function(tab){
        chrome.cookies.getAll({"url":tab[0].url},function (cookies){
            callback(cookies);
        });
    });
}

var onMessageListener = function(message, sender, sendResponse) {
    console.log(message);

    switch(message.type) {
        case "log":
            console.log(message.obj);
            break;
        case "getCookies":
            getCookies(function(cookies){
                sendResponse(cookies);
            });
            // chrome.tabs.query({"status":"complete","windowId":chrome.windows.WINDOW_ID_CURRENT,"active":true}, function(tab){
            //     chrome.cookies.getAll({"url":tab[0].url},function (cookies){
            //         sendResponse(cookies);
            //     });
            // });
            break;
        case "clearCookies":
            getCookies(function(cookies){
                for (i in cookies) {
                    removeCookie(cookies[i]);
                }
                sendResponse(true);
            });
            break;
        case "removeCookie":
            removeCookie(message.cookie);
            sendResponse(true);
            break;
    }
    return true;
}
chrome.runtime.onMessage.addListener(onMessageListener);