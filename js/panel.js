$(function(){

    // menus

    var menus = {
        main: [
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
        ],
        cookie: [
            {
                text: '<s>Edit cookie</s>',
                action: function(e){
                    e.preventDefault();
                    showModal('edit_cookie_modal'); // @todo think about it & DRY
                }
            },
            {
                text: 'Remove cookie',
                action: removeActiveCookie,
            },
        ],
    }

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
        cancelActiveModal();

        $('#overlay').fadeIn(50);
        $('#'+id).fadeIn(50).addClass('active');
    }

    function cancelActiveModal()
    {
        if ($('.modal.active').length > 0) {
            $('.modal.active').addClass('focused');
            setTimeout(function(){
                $('.modal.active').removeClass('focused');
            }, 600);
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

    function highlightRow()
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

    $('table').on('click', 'tr.cookie', highlightRow);
    $('table').on('contextmenu', 'tr.cookie', highlightRow);

    $('.modal button.cancel').click(function(e){
        $(this).closest('.modal').fadeOut(50).removeClass('active');
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

    context.attach('body', menus.main);
    context.attach('tr.cookie', menus.cookie);

    // @todo disable context menu on overlay

    refreshCookies();

});