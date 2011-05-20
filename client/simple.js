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
//    root.appendChild(l);
}

function on_loggged_in()
{
    fb_logged_in = true;
    
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

function debug_log(str)
{
    var div = document.getElementById('debug_log');
    if (div)
        div.innerHTML += '<pre>'+str+"</pre><br>";
    if(console)
        console.log(str);
}

function cheevo_grant(cheevo) {
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function()
    {   
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            debug_log(xmlhttp.responseText);
        }
    }

    xmlhttp.open("GET","cheevo_grant?access_token="+FB._session.access_token+'&cheevo='+escape(cheevo),true);
    xmlhttp.send();   
}

function action_grant(action) {
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function()
    {   
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            debug_log(xmlhttp.responseText);
        }
    }

    xmlhttp.open("GET","action_grant?access_token="+FB._session.access_token+'&action='+escape(action),true);
    xmlhttp.send();   
}