var fb_logged_in = false;

FB.init({
            appId  : fb_app_id,
            status : true, // check login status
            cookie : true, // enable cookies to allow the server to access the session
        });

function on_loggged_in()
{
    fb_logged_in = true;
    var div = document.createElement('div');
    var markup = '<form name="input" action="cheevo_update" method="get">\
    Achievement: <input type="text" name="cheevo" />\
    Score:       <input type="text" name="score" />\
        <input type="submit" value="Submit" />\
    </form>';
    div.innerHTML = markup;
    
    var root = document.getElementById('fb-root')
    root.appendChild(div);
}

if (fb_app_id) {
    FB.getLoginStatus(
        function(response) {
            if (response.session) {
                on_loggged_in();
                console.log('logged in');
            } else {
                fb_logged_in = false;
                FB.login(
                    function(response) {
                        if (response.session) {
                            on_loggged_in();
                        } else {
                            fb_logged_in = false;
                        }
                    }, 
                    {perms:''}  // read_stream,publish_stream
                );
            }
        }
    );
}
