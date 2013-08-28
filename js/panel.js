$(function(){

    // menus

    var mainMenu = [
        {
            text: 'Refresh',
            action: refreshCookies,
        },
        {divider: true},
        {
            text: '<s>Add cookie</s>',
            action: function(e){
                e.preventDefault();
                showModal('add_cookie_modal');
            }
        },
        {
            text: 'Clear cookies',
            action: clearCookies,
        },
        {divider: true},
        {
            text: '<s>About..</s>',
            action: function(e){
                e.preventDefault();
                alert('Do Something');
            }
        },
    ];

    var cookieMenu = [
        {
            text: '<s>Edit cookie</s>',
            action: function(e){
                e.preventDefault();
                cancelActiveModal();
                // alert('Do Something');
            }
        },
        {
            text: 'Remove cookie',
            action: removeActiveCookie,
        },
    ];

    // functions

    function log(what)
    {
        chrome.runtime.sendMessage({
            type: 'log',
            obj: what
        });
    }

    function showModal(id)
    {
        $('#overlay').fadeIn(50);
        $('#'+id).fadeIn(50).addClass('active');
    }

    function cancelActiveModal()
    {
        if ($('.modal.active').length > 0 && confirm('This will close active popup. Continue?')) {
            $('.modal.active').find('.cancel').trigger('click');
        } else {
            return;
        }
    }

    function showNoCookies()
    {
        $('#cookies').hide();
        $('#no_cookies').show();
    }

    function showCookiesTable()
    {
        $('#cookies').show();
        $('#no_cookies').hide();
    }

    function toggleActiveRow()
    {
        $('tr.cookie').removeClass('active');
        $(this).addClass('active');
    }

    function removeActiveCookie(e)
    {
        log('remove');

        var row = $('tr.active').first();
        var cookie = {
            name: row.find('.name').text(),
            storeId: row.find('.storeId').text(),
        };

        chrome.runtime.sendMessage({
            type: 'removeCookie',
            cookie: cookie,
        }, function(resp){
            refreshCookies();
        });

        e.preventDefault();
    }

    function clearCookies(e)
    {
        log('clear');

        chrome.runtime.sendMessage({
            type: 'clearCookies',
        }, function(resp){
            showNoCookies();
        });

        e.preventDefault();
    }

    function refreshCookies(e)
    {
        log('refresh');

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

                row.removeClass().addClass('cookie');

                $('#cookies').append(row);
            }

            if (cookies.length == 0) {
                showNoCookies();
            } else {
                showCookiesTable();
            }
        });

        e.preventDefault();
    }

    // magic

    $('table').on('click', 'tr.cookie', toggleActiveRow);
    $('table').on('contextmenu', 'tr.cookie', toggleActiveRow);

    $('.modal button.cancel').click(function(e){
        $(this).closest('.modal').fadeOut(50);
        $('#overlay').fadeOut(50);

        e.preventDefault();
    });

    context.init({
        fadeSpeed: 50,
        filter: function ($obj){},
        above: 'auto',
        preventDoubleContext: true,
        compress: true
    });

    context.attach('body', mainMenu);
    context.attach('tr.cookie', cookieMenu);

    // @todo disable context menu on overlay

    refreshCookies();

});