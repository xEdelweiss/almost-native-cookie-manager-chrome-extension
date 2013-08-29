$(function(){

    // @todo move to file
    jQuery.fn.serializeObject = function() {
      var arrayData, objectData;
      arrayData = this.serializeArray();
      objectData = {};

      $.each(arrayData, function() {
        var value;

        if (this.value != null) {
          value = this.value;
        } else {
          value = '';
        }

        if (objectData[this.name] != null) {
          if (!objectData[this.name].push) {
            objectData[this.name] = [objectData[this.name]];
          }

          objectData[this.name].push(value);
        } else {
          objectData[this.name] = value;
        }
      });

      return objectData;
    };

    // menus

    var menus = {
        main: [
            {
                text: 'Refresh',
                action: refreshCookies,
            },
            {divider: true},
            {
                text: 'Add cookie',
                action: function(e){
                    e.preventDefault();
                    showEditCookie();
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

                    var row = $('tr.active').first();
                    var cookie = getCookieFromRow(row);
                    showEditCookie(cookie);
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

    function getCookieFromRow(row) {
        return JSON.parse(row.attr('data-cookie'));
    }

    function createCookie(cookie) {
        chrome.runtime.sendMessage({
            type: 'createCookie',
            cookie: cookie,
        }, function(resp){
            refreshCookies();
        });
    }

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
                // log(data);
            } else {
                data.name = '';
                data.value = '';
                data.session = true;
                data.storeId = '';
                data.httpOnly = false;
                data.expirationDate = '';

                // log(data);
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

            $('#overlay').fadeIn(50);
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

    function highlightRow()
    {
        $('tr.cookie').removeClass('active');
        $(this).addClass('active');
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

    function removeActiveCookie(e)
    {
        var row = $('tr.active').first();
        var cookie = getCookieFromRow(row);

        removeCookie(cookie);

        e.preventDefault();
    }

    function clearCookies(e)
    {
        chrome.runtime.sendMessage({
            type: 'clearCookies',
        }, function(resp){
            showNoCookies();
        });

        e.preventDefault();
    }

    function refreshCookies(e)
    {
        // log('refresh');

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
                showNoCookies();
            } else {
                showCookiesTable();
            }
        });

        e.preventDefault();
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

    // magic

    $('table').on('click', 'tr.cookie', highlightRow);
    $('table').on('contextmenu', 'tr.cookie', highlightRow);

    $('.modal button.cancel').click(function(e){
        $(this).closest('.modal').fadeOut(50).removeClass('active');
        $('#overlay').fadeOut(50);

        e.preventDefault();
    });

    $('#edit-cookie button.submit').click(function(e){
        e.preventDefault();

        var form = $(this).closest('form');
        var cookie = form.serializeObject();

        var findByName = function(name) {
            return form.find('[name="'+name+'"]');
        }

        var errors = [];

        if (!cookie.session && !cookie.expirationDate) {
            errors.push('expirationDate');
        }

        for (i in errors) {
            focusObject(findByName(errors[i]));
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
        $('#overlay').fadeOut(50);
    });

    $('#edit-cookie-session').change(function(){
        $('#edit-cookie-datetime').prop('disabled', $('#edit-cookie-session').prop('checked'));
    }).trigger('change');

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