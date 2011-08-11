// request pattern: http://{{config.host}}/asdf/qwer
// req: method=GET httpVersion=1.1 url=/asdf/qwer headers=[object Object]
// req: method=GET httpVersion=1.1 url=/favicon.ico headers=[object Object]

// "cookie": "fbs_224658110883993=\"access_token=224658110883993%7C2.AQDb6wR1yZvD1JCY.3600.1305795600.1-827884427%7Cc7sxBeGBSI3emGkVdDNKBuqY-HY&expires=1305795600&secret=AQCTzmT3i4WGUUXy&session_key=2.AQDb6wR1yZvD1JCY.3600.1305795600.1-827884427&sig=2bc606f1ac15e543d1c9044e649238d9&uid=827884427\"""
// js: escape == urlencode, unescape == urldecode

config = require('./config'); // exporting to global scope
g_graph_url = 'graph.'+config.fb_domain_modifier+'facebook.com';

var comm  = require('./lib/comm');
//var db    = require('./server/db'); TODO(abrady)
var fs    = require('fs');
var http  = require('http');
var https = require('https');
var log   = require('./util/log');
var sys   = require("sys");
var url   = require("url");
var util  = require('./util');
log.level = log.INFO; // DEBUG

function str_from_req(req)
{
  return "req: method="+req.method+" httpVersion="+req.httpVersion
    +" url="+req.url+"\nheaders="+util.dir(req.headers) +"\nbody="+req.body;
}


function dict_from_keyvals_str(str, delim) {
  var res = {};
  for(var i = 0; i < str.length; ++i) {
    var tmp = str[i].split(delim);
    res[tmp[0]] = unescape(tmp[1]);
  }
  return res;
}

function fbinfo_from_cookie(cookie) {
  if(!cookie)
    return null;
  log.debug(cookie);
  var regex = new RegExp('fbs_'+config.app_id+'="(.*?)"');
  var m = cookie.match(regex);
  if(!m)
    return null;
  var split_params = m[1].split('&');
  var params = dict_from_keyvals_str(split_params,'=');
  return params;
}

// take a full url, and get the query string, and parse it.
function params_from_url(url)
{
  var a = url.split('?') // query string is at a[1]
  if(a.length <= 1)
    return null;
  var b = a[1].split('&')
  return dict_from_keyvals_str(b,'=');
}

// use this to query data from open graph
function graph_get(path,end_cb) {
  if (path[0] != '/') {
    path = '/' + path;
  }
  log.info('graph_get:' + g_graph_url + path);
  var data = '';
  https.get(
    {
      host: g_graph_url,
        path: path
        },
    function(res) {
      res.on(
        'data',
        function(d) {
          data += d;
        }
      );
      res.on(
        'end',
        function ()
        {
          end_cb(data);
        }
      );
    }
  ).on(
    'error',
    function(e) {
      console.error(e);
    }
  );
}

function graph_post(path, body, end_cb) {
  log.info('graph_post:' + g_graph_url + path + ' body: ' + body);
  var data = '';
  var graph_req = https.request(
    {
      host: g_graph_url,
        method: 'POST',
        path: path
        },
    function(res) {
      res.on(
        'data',
        function(d) {
          log.info('graph data:'+d);
          data += d;
        }
      );
      res.on(
        'end',
        function ()
        {
          end_cb(data);
        }
      );
    }
  )
    graph_req.on(
      'error',
      function(e) {
        console.error(e);
      }
    );
  graph_req.end(body);
}

function graph_delete(path,end_cb) {
  log.info('graph_delete:' + g_graph_url + path);
  var data = '';
  var graph_req = https.request(
    {
      host: g_graph_url,
        method: 'DELETE',
        path: path
        },
    function(res) {
      res.on(
        'data',
        function(d) {
          log.info('graph data:'+d);
          data += d;
        }
      );
      res.on(
        'end',
        function ()
        {
          end_cb(data);
        }
      );
    }
  )
  graph_req.on(
    'error',
    function(e) {
      console.error(e);
    }
  );
  graph_req.end();
}

function og_action_get(res, action_name, access_token)
{
  //    curl 'https://graph.dev.facebook.com/me/superfbrps:paper_covers_rock?access_token=224658110883993%7C2.AQBXJXLB4afinN9o.3600.1305936000.0-827884427%7CE9Fg6j9zpTSlhiSwyYb1_aqc454'
  graph_get(
    '/me/superfbrps:'+action_name+'?access_token='+escape(access_token),
    function(d) {
      log.info('og_action_get:'+d);
      res.end  ('og_action_get:'+d);
    }
  );
}

function og_action_create(res, action_name, object_name, access_token)
{
  // curl -F 'access_token=224658110883993|2.AQBXJXLB4afinN9o.3600.1305936000.0-827884427|E9Fg6j9zpTSlhiSwyYb1_aqc454' \
  //  -F 'to=http://example.com/' \
  //     'https://graph.dev.facebook.com/me/superfbrps:paper_covers_rock'
  var body = 'to='+config.host+'/client/og/'+object_name+'.shtml'+'&'
    + 'access_token='+escape(access_token);

  graph_post(
    '/me/superfbrps:'+action_name,
    body,
    function(d) {
      log.info('og_action_create:'+action_name+':'+d);
      res.end  ('og_action_create:'+action_name+':'+d);
    }
  );
}

function og_score_set(res, score, access_token)
{
  // https://graph.facebook.com/me/games.scores?
  var body =
    'score='+escape(score)
    + '&access_token='+escape(access_token)
    + '&client_secret='+config.app_secret;

  graph_post(
    '/me/games.scores?',
    body,
    function(d) {
      log.info('og_score_set:'+score+':'+d);
      res.end ('og_score_set:'+score+':'+d);
    }
  );
}

function og_app_access_token(rec_cb) {
  // https://graph.facebook.com/oauth/access_token? client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET& grant_type=client_credentials
  graph_get(
    '/oauth/access_token?client_id='+config.app_id+'&client_secret='+config.app_secret+'&grant_type=client_credentials',
    function(d) {
      log.info('app access token:'+d);
      var s = d.split('=');
      if (s.length == 2) {
        var access_token = s[1];
        log.info('og_app_access_token: ' + access_token);
        rec_cb(access_token);
      } else {
        log.err('og_app_access_token, unparsable data: '+d );
      }
    }
  )
}

function og_scores_erase_all(res, access_token)
{
  og_app_access_token(
    function (access_token) {
      var url = '/'+config.app_id+'/games.scores?'
        + 'access_token='+escape(access_token)
        + '&client_secret='+config.app_secret;
      graph_delete(
        url,
        function(d) {
          log.info('og_score_erase_all:'+d);
          res.end ('og_score_erase_all:'+d);
        }
      );
    }
  );
}

function og_scores_get_all(res, access_token)
{
  var url = '/'+config.app_id+'/games.scores?'
    + 'access_token='+escape(access_token)
    + '&client_secret='+config.app_secret;
  graph_get(
    url,
    function(d) {
      log.info('og_score_get_all:'+d);
      res.end (d);
    }
  );
}

function og_score_get_users(res, users, access_token)
{
  // https://graph.facebook.com/me/games.scores?
  var users_body = {};
  var body;

  for(var i = 0; i < users.length; ++i) {
    users_body.id = users[i];
  }

  body =
    'data:' + '[ ' + JSON.stringify(user_body) + ']'
    + '&access_token='+escape(access_token)
    + '&client_secret='+config.app_secret;

  graph_get(
    '/me/games.scores?',
    body,
    function(d) {
      log.info('og_score_get_users:'+score+':'+d);
      res.end ('og_score_get_users:'+score+':'+d);
    }
  );
}

function req_handler(req, res)
{
  log.debug(str_from_req(req))
    var fb_info = fbinfo_from_cookie(req.headers.cookie);
  log.debug('access_token='+(fb_info ? fb_info.access_token : "none"));
  var parse = url.parse(req.url);
  var pathname = parse.pathname;
  var params = params_from_url(req.url);
  log.debug('request: '+pathname);


  // if no path specified, default to index.shtml
  if (pathname.length <= 1) {
    pathname = '/client/index.shtml';
  }
  var split = pathname.split('/');
  var command = split[1];
  log.debug('pathname is '+pathname+' root is ' + command);

  // all servable files live in the client/ or engine/ directories
  if(-1 < ['client','engine'].indexOf(command)){
    log.info('sending ' + pathname);
    var options = {
      log : ''
    };
    if(params) {
      options.log += 'url params: ' + JSON.stringify(params) + '\n';

      // check for request link
      // http://apps.facebook.com/superfbrps/?request_ids=10150335656109428&ref=notif&notif_t=app_request
      if(false && params.request_ids) {
        for(var i = 0; i < params.request_ids.length; ++i) {
          // get the associated request object.
          graph_get(
            res.request_ids[i],
            function(data) {
              var obj = JSON.parse(data);

            }
          );
        }
        return;
      }
    }
    comm.sendFile(req, res, pathname, options);
    return;
  }
  else if('cheevo_grant' == command) {
    // TODO: check list of available cheevos
    log.info('cheevo_update');
    var cheevo = params.cheevo;
    var value = params.value || 100;
    var cheevo_url = escape('abrady.xen.prgmr.com/client/cheevo/' + cheevo + '.shtml');
    var path = '/me/games.achieves?';
    var body = 'achievement='+cheevo_url+'&access_token='+escape(fb_info.access_token)+'&client_secret='+config.app_secret;
    var graph_req = graph_post(
      path,
      body,
      function(d) {
        log.info('og achieves response:'+d);
        res.end('og achieves response: '+cheevo+' response: '+d);
      }
    );
    return;
  }
  else if('graph_get' == command) {
    graph_get(
      params.graph_path+'?access_token='+escape(fb_info.access_token),
      function (data) {
        res.end(data);
      }
    );
    return;
  }
  else if('graph_delete' == command) {
    graph_delete(
      params.graph_path+'?access_token='+escape(fb_info.access_token),
      function (data) {
        res.end(data);
      }
    );
    return;
  }
  else if('action_grant' == command) {
    // TODO: check list of available actions
    log.info('action_grant');
    og_action_create(res,params.action,params.object,fb_info.access_token);
    return;
  }
  else if('action_get' == command) {
    // TODO: check list of available actions
    log.info('action_get');
    og_action_get(res,params.action,fb_info.access_token);
    return;
  }
  else if('score_set' == command) {
    // https://graph.facebook.com/me/games.scores?
    log.info('score_set');
    og_score_set(res,params.score,params.access_token);
    return;
  }
  else if('scores_erase_all' == command) {
    log.info(command);
    og_scores_erase_all(res,params.access_token);
    return;
  }
  else if('scores_get_all' == command) {
    log.info(command);
    og_scores_get_all(res,params.access_token);
    return;
  }
  else if('score_get_users' == command) {
    // https://graph.facebook.com/me/games.scores?
    // log.info('score_get: ' + params.users);
    // var params = params_from_url(req.url);
    // og_score_get_users(res,JSON.parse(unescape(params.users)),params.access_token);
    res.end('');
    return;
  }
  else if('request_add_ids') {
    if (params) {
      log.debug('request_add_ids ' + params.res);
      if (params.res) {
        res = JSON.parse(unescape(params.res));
        for(var i = 0; i < res.request_ids.length; ++i) {
          db.request_add(res.request_ids[i],null);
        }
      }
    } else {
      log.debug('request_add_ids: no params');
    }
  } else if('/favicon.ico' == pathname) {
    res.end();
    return;
  }
  else {
    log.info('unkown command pathname is '+pathname+' root is ' + command);
  }
}

// ========================================
// Start the servers

log.info("Running app " + config.app_name + " id " + config.app_id);
log.info("connecting to graph url " + g_graph_url);
http.createServer(
  req_handler
).listen(config.http_port);
log.info('HTTP Server running on port' + config.http_port);

// curl -k https://localhost:8000/
var options = {
  key: fs.readFileSync('conf/server.key'),
  cert: fs.readFileSync('conf/server.crt')
};

https.createServer(options, req_handler).listen(config.https_port);
log.info('HTTPS Server running:' + (config.https_port));

