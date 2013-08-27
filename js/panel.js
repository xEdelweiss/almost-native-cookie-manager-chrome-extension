// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

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
                alert('Do Something');
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
                alert('Do Something');
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

    function dump(obj) {
        var out = "";
        if(obj && typeof(obj) == "object"){
            for (var i in obj) {
                out += i + ": " + obj[i] + "\n";
            }
        } else {
            out = obj;
        }
        $('#cookies').html('<pre>'+out+'</pre>');
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

    context.init({
        fadeSpeed: 100,
        filter: function ($obj){},
        above: 'auto',
        preventDoubleContext: true,
        compress: true
    });

    context.attach('body', mainMenu);
    context.attach('tr.cookie', cookieMenu);

    refreshCookies();

});