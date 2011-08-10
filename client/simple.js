var fb_logged_in = false;

function debug_log(str) {
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

function on_cheevos_recv(data) {
  var root = document.getElementById('cheevos');
  var l = document.createElement('ul');

      // <div id="cheevos" class="section">
      //   <h4>Your Achievements:</h4>
      //   <!-- <h4>Your Achievements:</h4> -->
      // </div>

  return; // not seeing the value here.

  all_cheevos = JSON.parse(data);
  window.cheevos = [];
  for (var i = 0; i < all_cheevos.data.length; i++) {
    var c = all_cheevos.data[i].achievement;
    var li = document.createElement('li');    
    l.appendChild(li);
    if (i > 5) {
      li.innerHTML = '...';
      break;
    }
    li.innerHTML = c.title
  }
  root.appendChild(l);
}

function on_scores_recv(data) {
  var root = document.getElementById('cheevos');
  var l = document.createElement('ul');

  // doesn't work right now
  return;
  
  debug_log(data);
  friend_scores = JSON.parse(data);
}

function graph_get(graph_path, recv_cb) {
  xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
  {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
    {
      recv_cb(xmlhttp.responseText);
    }
  }
  xmlhttp.open("GET",'graph_get?graph_path='+graph_path,true);
  xmlhttp.send();  
}

function graph_delete(graph_path, recv_cb) {
  xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
  {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
    {
      recv_cb(xmlhttp.responseText);
    }
  }
  xmlhttp.open("GET",'graph_delete?graph_path='+graph_path,true);
  xmlhttp.send();  
}

// generic command sender, response is logged
// res is of form([true,false],response text)
function server_send_cmd(cmd,args, res) {
  debug_log("request send response: " + JSON.stringify(res));
  xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
  {
    if (xmlhttp.readyState==4)
    {
      debug_log(xmlhttp.status +', '+ xmlhttp.responseText);
      if (res) {
        res(xmlhttp.status==200, xmlhttp.responseText)
      }
    }
  }
  
  xmlhttp.open("GET",'request_add_ids?res='+escape(cheevo),true);
  xmlhttp.send();
}

function on_loggged_in() {
  fb_logged_in = true;
  debug_log('access_token: ' + FB._session.access_token);

  var rps = document.getElementById('rps_pre_login');
  rps.hidden = true;

  rps = document.getElementById('rps_body_root');
  rps.hidden = false;

  graph_get('/me/games.achieves', on_cheevos_recv);
  graph_get('/me/games.scores', on_scores_recv);
 
  FB.api('/me/apprequests', requests_show_pending); 
}

function login_respose_validate(perms_string, response){
  if (!response.session) {
    return false;
  }
  var perms = perms_string.split(',');
  for(var i = 0; i < perms.length; ++i) {
    var k = perms[i];
    if (-1 == response.perms.indexOf(k))
      return false;
  }
  return true;
}

if (fb_app_id) {
  var permissions = 'publish_stream,publish_actions';
  FB.getLoginStatus(
    function(response) {
      if (login_respose_validate(permissions,response)) {
        on_loggged_in();
        console.log('logged in');
      } else {
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
          {perms:permissions} 
        );
      }
    }
  );
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

    xmlhttp.open("GET",'cheevo_grant?cheevo='+escape(cheevo),true);
    xmlhttp.send();
}

function cheevo_delete(cheevo) {
  var rm = 'http://'+window.location.hostname+'/client/cheevo/' + cheevo + '.shtml';
  debug_log("removing cheevo " + rm);
  FB.api('/me/achievements','delete',{achievement:rm,client_secret:app_secret},request_cleared);
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

function score_keyup_listener(e) {
    var keychar = String.fromCharCode(e.keyCode);
    if (keychar != '\r') { // check for newline
        var numcheck = /\d/;
        return numcheck.test(keychar);
    }
  score_set();
}

function score_set() {
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

function scores_erase_all() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            debug_log(xmlhttp.responseText);
        }
    }
    var score_elt = document.getElementById('score_value');
    xmlhttp.open("GET",'scores_erase_all?access_token='+escape(FB._session.access_token));
    xmlhttp.send();
    score_elt.value = '';
    return false;
}


// <div class="section">
// <h4>Test Mouse</h4>
// <button id="test_mouse_button" onmouseover="mouseover_test(this)" onmouseout="mouseout_test(this)">Test Mouse</button>
// </div>
// function mouseover_test(n) {
//   n.innerHTML = "Over";
// }

// function mouseout_test(n) {
//   n.innerHTML = "Zzap";
// }

function ogobj_del(fbid, section) {
  debug_log("removing " + fbid + " from section " + section);
  FB.api('/' + fbid, 'DELETE', request_cleared);
  var d = document.getElementById(fbid);
  if (d)
    d.parentNode.removeChild(d);
}
function ogobj_del_funcgen(fbid,section) {
  return function () {
    ogobj_del(fbid,section);
  }
}

function requests_show_pending(obj) {
  debug_log("got pending pending requests: " + obj.data.length);
  var root = document.getElementById('pending_requests');
  for(var i = 0; i < obj.data.length; ++i) {
    var e = document.createElement('div');
    var o = obj.data[i];
    var btn_del = document.createElement('button');
    var txt = document.createElement('div');
    btn_del.innerHTML = "X";
    btn_del.style.setProperty('float','left');
    btn_del.onclick = ogobj_del_funcgen(o.id, "requests");
    e.appendChild(btn_del);

    txt.style.setProperty('font-size', '11px');
    txt.innerHTML = "From " + (o.from ? o.from.name : "(no name)") + ", message: " + o.message;
    e.appendChild(txt);

    var li = document.createElement('li');
    li.appendChild(e);
    li.setAttribute("id",o.id);
    root.appendChild(li);
  }
}

function request_cleared(res) {
  debug_log("cleared request " + JSON.stringify(res));
}

function requests_clear_handler(res) {
  var ids = [];
  for (var i=0, l=res.data.length; i<l; i++) {
    debug_log("deleting " + res.data[i].id);
//    FB.api('/' + res.data[i].id, 'DELETE', request_cleared);
  }
}

// called when the FB graph gets back. 
// Looks like:
// {"request_ids":["220693671295002", ...]}"
function requests_sent_handler(res) {
  var req_ids = JSON.stringify(res);
  debug_log("request send response: " + req_ids);
  server_send_cmd('request_add_ids', req_ids, null);
}