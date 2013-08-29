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
                    var cookie = cookies[i];
                    cookie.url = getUrlForCookie(cookie);
                    removeCookie(cookie);
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

/**
 * @todo copy-paste (!)
 *
 * @author http://stackoverflow.com/users/612202/dan-lee
 * @see    http://stackoverflow.com/a/13230227
 */
function getUrlForCookie(cookie) {
    var url = '';
    // get prefix, like https://www.
    url += cookie.secure ? 'https://' : 'http://';
    url += cookie.domain.charAt(0) == '.' ? 'www' : '';

    // append domain and path
    url += cookie.domain;
    url += cookie.path;

    return url;
}

chrome.runtime.onMessage.addListener(onMessageListener);