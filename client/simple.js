var fb_logged_in = false;

FB.init({
            appId  : fb_app_id,
            status : true, // check login status
            cookie : true, // enable cookies to allow the server to access the session
        });

function on_cheevos_recv(data) 
{
    var root = document.getElementById('cheevos');
    var l = document.createElement('ul');

    all_cheevos = JSON.parse(xmlhttp.responseText);
    window.cheevos = [];
    for (var i in all_cheevos.data) {
        var c = all_cheevos.data[i].achievement
        var li = document.createElement('li');
        li.innerHTML = c.title
        l.appendChild(li);
    }
    root.appendChild(l);
}

function on_loggged_in()
{
    var root = document.getElementById('fb-root');
    fb_logged_in = true;
    var div = document.createElement('div');
    //     Score:       <input type="text" name="score" />\
    var markup = '<form name="input" action="cheevo_update" method="get">\
    Achievement: <input type="text" name="cheevo" />\
        <input type="submit" value="Submit" />\
    </form>';
    div.innerHTML = markup;
    root.appendChild(div);
    
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function()
    {   
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            on_cheevos_recv(xmlhttp.responseText);
        }
    }
    xmlhttp.open("GET","cheevo_get?access_token="+FB._session.access_token,true);
//    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
//    xmlhttp.send("access_token="+FB.access_token);
    xmlhttp.send();
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
