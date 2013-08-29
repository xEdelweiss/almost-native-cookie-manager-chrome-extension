var removeCookie = function(cookie) {
    console.log(cookie);

    chrome.cookies.remove({
        url: cookie.url,
        name: cookie.name,
        storeId: cookie.storeId,
    });
}

var createCookie = function(cookie) {
    chrome.tabs.query({"status":"complete","windowId":chrome.windows.WINDOW_ID_CURRENT,"active":true}, function(tab){
        if (!cookie.url) {
            cookie.url = tab[0].url;
        }
        chrome.cookies.set(cookie);
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
    switch(message.type) {
        case "log":
            console.log(message.obj);
            break;
        case "getCookies":
            getCookies(function(cookies){
                sendResponse(cookies);
            });
            break;
        case "clearCookies":
            getCookies(function(cookies){
                for (i in cookies) {
                    removeCookie(cookies[i]);
                }
                sendResponse(true);
            });
            break;
        case "createCookie":
            createCookie(message.cookie);
            sendResponse(true);
            break;
        case "removeCookie":
            removeCookie(message.cookie);
            sendResponse(true);
            break;
    }
    return true;
}

chrome.runtime.onMessage.addListener(onMessageListener);