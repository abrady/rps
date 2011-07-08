var fb_logged_in = false;

function debug_log(str)
{
    var div = document.getElementById('debug_log');
    if (div)
        div.innerHTML += '<span>'+str+"</span><br>";
    if(console)
        console.log(str);
}

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
  debug_log('access_token: ' + FB._session.access_token);

  var rps = document.getElementById('rps_pre_login');
  rps.hidden = true;

  rps = document.getElementById('rps_body_root');
  rps.hidden = false;

  xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
  {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
    {
      on_cheevos_recv(xmlhttp.responseText);
    }
  }
  xmlhttp.open("GET",'cheevo_get',true);
  xmlhttp.send();

  score_get_mine();
}

if (fb_app_id) {
  debug_log("getting login status");
  FB.getLoginStatus(
    function(response) {
      if (response.session) {
        on_loggged_in();
        debug_log('logged in');
      } else {
        debug_log("calling FB.login");
        fb_logged_in = false;
        FB.login(
          function(response) {
            if (response.session) {
              on_loggged_in();
            } else {
              debug_log('failed to log in');
              fb_logged_in = false;
            }
          },
          {perms:''}  // read_stream,publish_stream
        );
      }
    }
  );
}
debug_log("done calling function.");

function cheevo_grant(cheevo) {
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            debug_log(xmlhttp.responseText);
        }
    }

    xmlhttp.open("GET",'cheevo_grant?cheevo='+escape(cheevo),true);
    xmlhttp.send();
}

function action_grant(action,obj_name) {
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            debug_log(xmlhttp.responseText);
        }
    }

    xmlhttp.open("GET",'action_grant?action='+escape(action)+'&object='+obj_name,true);
    xmlhttp.send();
}

function score_enter_listener(e) {
    var keychar = String.fromCharCode(e.keyCode);
    if (keychar != '\r') { // check for newline
        var numcheck = /\d/;
        return numcheck.test(keychar);
    }

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            debug_log(xmlhttp.responseText);
        }
    }
    var score_elt = document.getElementById('score_value');
    xmlhttp.open("GET",'score_set?score='+escape(score_elt.value)+'&access_token='+escape(FB._session.access_token));
    xmlhttp.send();
    score_elt.value = '';
    return false;
}

function score_get_mine() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
  {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
    {
      debug_log(xmlhttp.responseText);
    }
  }
  var score_elt = document.getElementById('score_value');
  var users = ['4'];
  xmlhttp.open("GET",'score_get_users?users='+escape(JSON.stringify(users))+'access_token='+escape(FB._session.access_token));
  xmlhttp.send();
  score_elt.value = '';
  return false;
}

function mouseover_test(n) {
  n.innerHTML = "Over";
}

function mouseout_test(n) {
  n.innerHTML = "Zzap";
}

function requests_pending_show(obj) {
  debug_log("pending requests: " + JSON.stringify(obj));
}

function requests_clear(res) {
  debug_log("cleared request " + res);
}

function requests_clear_handler(res) {
  var ids = [];
  for (var i=0, l=res.data.length; i<l; i++) {
    debug_log("deleting " + res.data[i].id);
//    FB.api('/' + res.data[i].id, 'DELETE', requests_clear);
  }
}
