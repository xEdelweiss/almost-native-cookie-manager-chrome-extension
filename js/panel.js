$(function(){

    // port
    window.portReceiver = function(message) {
        switch(message.type) {
            case "tabUpdated":
                refreshCookies();
                break;
        }
    }

    // menus

    var menus = {
        main: [
            {
                text: 'Refresh',
                action: function(e){
                    e.preventDefault();
                    refreshCookies();
                },
            },
            {divider: true},
            {
                text: 'Add cookie..',
                action: function(e){
                    e.preventDefault();
                    showEditCookie();
                }
            },
            {
                text: 'Clear cookies',
                action: function(e){
                    e.preventDefault();
                    clearCookies();
                },
            },
            {divider: true},
            {
                text: '<s>About..</s>',
                action: function(e){
                    e.preventDefault();
                    // action!
                }
            },
        ],
        cookie: [
            {
                text: 'Edit cookie..',
                action: function(e){
                    e.preventDefault();

                    var cookie = getHighlightedCookie();
                    showEditCookie(cookie);
                }
            },
            {
                text: 'Remove cookie',
                action: function(e){
                    e.preventDefault();

                    var cookie = getHighlightedCookie();
                    removeCookie(cookie);
                },
            },
        ],
    }

    // background function wrappers

    function log(what)
    {
        chrome.runtime.sendMessage({
            type: 'log',
            obj: what
        });
    }

    function createCookie(cookie) {
        chrome.runtime.sendMessage({
            type: 'createCookie',
            cookie: cookie,
        }, function(resp){
            refreshCookies();
        });
    }

    function removeCookie(cookie) {
        cookie.url = getUrlForCookie(cookie);

        chrome.runtime.sendMessage({
            type: 'removeCookie',
            cookie: cookie,
        }, function(resp){
            refreshCookies();
        });
    }

    function clearCookies()
    {
        chrome.runtime.sendMessage({
            type: 'clearCookies',
        }, function(resp){
            refreshCookies();
        });
    }

    function getHighlightedCookie() {
        var row = $('tr.active').first();
        return JSON.parse(row.attr('data-cookie'));
    }

    // functions

    function showEditCookie(cookie)
    {
        if (modalActive()) {
            return;
        }

        chrome.runtime.sendMessage({
                type: 'getPageInfo'
        }, function(pageInfo) {

            var modal = $('#edit-cookie');
            var form = modal.find('form');

            form.removeAttr('data-cookie');
            form.find('[name="urlDecode"]').prop('checked', false);

            // prepare data

            var data = {};

            if (cookie) {
                data = cookie;
            } else {
                data.name = '';
                data.value = '';
                data.session = true;
                data.storeId = '';
                data.httpOnly = false;
                data.expirationDate = '';
            }

            data.urlDecode = false;

            // fill fields

            if (typeof cookie == 'undefined') {
                data.domain = pageInfo.domain;
                data.path = pageInfo.path;
                data.secure = pageInfo.secure;
            }

            if (data.expirationDate) {
                var d = new Date(data.expirationDate*1000);
                data.expirationDate = d.getFullYear()+'-'+('0' + (d.getMonth()+1)).slice(-2)+'-'+('0' + d.getDate()).slice(-2)+'T'+('0' + d.getHours()).slice(-2)+':'+('0' + d.getMinutes()).slice(-2); // i hate js
            }

            form.find('[name="expirationDate"]').val(data.expirationDate);
            form.find('[name="session"]').prop('checked', data.session ? data.session : false).trigger('change');

            form.find('[name="name"]').val(data.name);
            form.find('[name="value"]').val(data.value);
            form.find('[name="domain"]').val(data.domain);
            form.find('[name="path"]').val(data.path);
            form.find('[name="storeId"]').val(data.storeId);
            form.find('[name="secure"]').prop('checked', data.secure);
            form.find('[name="httpOnly"]').prop('checked', data.httpOnly);

            if (cookie) {
                form.attr('data-cookie', JSON.stringify(cookie));
                form.find('button.submit').text('Update');
            } else {
                form.find('button.submit').text('Add');
            }

            modal.fadeIn(50).addClass('active');
        });
    }

    function focusObject(obj) {
        $(obj).addClass('focused');
        setTimeout(function(){
            $(obj).removeClass('focused');
        }, 600);
    }

    function modalActive()
    {
        if ($('.modal.active').length > 0) {
            focusObject($('.modal.active'));
            return true;
        }

        return false;
    }

    function refreshCookies()
    {
        chrome.runtime.sendMessage({
            type: 'getCookies'
        }, function(cookies){
            $('tr.cookie').remove();

            for(i in cookies) {
                var cookie = cookies[i];

                var row = $('tr.new').clone();

                row.find('.name').text(cookie.name);
                row.find('.value').text(cookie.value);
                row.find('.domain').text(cookie.domain);
                row.find('.path').text(cookie.path);
                row.find('.storeId').text(cookie.storeId);
                row.find('.secure').text(cookie.secure ? 'yes' : 'no');
                row.find('.http').text(cookie.httpOnly ? 'yes' : 'no');
                row.find('.host').text(cookie.hostOnly ? 'yes' : 'no')
                row.find('.size').text((cookie.name+cookie.value).length);
                if (cookie.session) {
                    row.find('.expiration').text('Session');
                } else {
                    row.find('.expiration').text((new Date(cookie.expirationDate*1000)).toLocaleString())
                }

                row.attr('data-cookie', JSON.stringify(cookie));
                row.removeClass().addClass('cookie');

                $('#cookies').append(row);
            }

            if (cookies.length == 0) {
                $('#cookies').hide();
                $('#no_cookies').show();
            } else {
                $('#cookies').show();
                $('#no_cookies').hide();
            }
        });
    }

    /**
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

    // events

    $('table').on('click contextmenu', 'tr.cookie', function(e){
        $('tr.cookie').removeClass('active');
        $(this).addClass('active');
    });

    $('.modal button.cancel').click(function(e){
        e.preventDefault();

        $(this).closest('.modal').fadeOut(50).removeClass('active');
    });

    $('#edit-cookie button.submit').click(function(e){
        e.preventDefault();

        var form = $(this).closest('form');
        var cookie = form.serializeObject();
        var errors = [];

        if (!cookie.session && !cookie.expirationDate) {
            errors.push('expirationDate');
        }

        for (i in errors) {
            var element = form.find('[name="'+errors[i]+'"]');
            focusObject(element);
        }

        if (errors.length > 0) {
            return;
        }

        if (cookie.session) {
            delete cookie.expirationDate;
            delete cookie.session;
        } else {
            var tmpDate = new Date(cookie.expirationDate);
            cookie.expirationDate = (tmpDate.getTime() + tmpDate.getTimezoneOffset()*60*1000)/1000;
        }

        if (cookie.httpOnly) {
            cookie.httpOnly = true;
        }

        if (cookie.secure) {
            cookie.secure = true;
        }

        if (cookie.urlDecode) {
            cookie.value = decodeURIComponent(cookie.value);
            delete cookie.urlDecode;
        }

        if (cookie.domain && cookie.path) {
            cookie.url = getUrlForCookie(cookie);
        }

        if (form.attr('data-cookie')) {
            oldCookie = JSON.parse(form.attr('data-cookie'));
            removeCookie(oldCookie);
        }

        createCookie(cookie);

        $(this).closest('.modal').fadeOut(50).removeClass('active');
    });

    $('[name="session"]').change(function(){
        $(this).closest('form').find('[name="expirationDate"]').prop('disabled', $(this).prop('checked'));
    });

    // inits

    context.init({
        fadeSpeed: 50,
        filter: function ($obj){},
        above: 'auto',
        preventDoubleContext: true,
        compress: true
    });

    setTimeout(function(){ // to prevent same id for both menus
        context.attach('body', menus.main);
    }, 200);
    context.attach('tr.cookie', menus.cookie);

    refreshCookies();
});