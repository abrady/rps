// request pattern: http://{{config.host}}/asdf/qwer
// req: method=GET httpVersion=1.1 url=/asdf/qwer headers=[object Object]
// req: method=GET httpVersion=1.1 url=/favicon.ico headers=[object Object]

// "cookie": "fbs_224658110883993=\"access_token=224658110883993%7C2.AQDb6wR1yZvD1JCY.3600.1305795600.1-827884427%7Cc7sxBeGBSI3emGkVdDNKBuqY-HY&expires=1305795600&secret=AQCTzmT3i4WGUUXy&session_key=2.AQDb6wR1yZvD1JCY.3600.1305795600.1-827884427&sig=2bc606f1ac15e543d1c9044e649238d9&uid=827884427\"""
// js: escape == urlencode, unescape == urldecode

config = require('./config'); // exporting to global scope
g_graph_url = 'graph.'+config.fb_domain_modifier+'facebook.com';

var comm = require('./lib/comm');
var fs = require('fs');
var http = require('http');
var https = require('https');
var sys = require("sys");
var url = require("url");

var util = require('./util');
var log = require('./util/log');
log.level = log.INFO;

// process.on('uncaughtException', function(err) {
//   console.log(err);
// });

function str_from_req(req)
{
  return "req: method="+req.method+" httpVersion="+req.httpVersion
    +" url="+req.url+"\nheaders="+util.dir(req.headers) +"\nbody="+req.body;
}


function dict_from_keyvals_str(str, delim) {
  var res = [];
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
  log.info('graph_get:' + g_graph_url + path);
  data = '';
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
      log.info('og_score_set:'+score+':'+d);
      res.end ('og_score_set:'+score+':'+d);
    }
  );
}

function og_score_delete_all(access_token)
{
  // https://graph.facebook.com/[config.app_id]/games.scores?
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
  var split = pathname.split('/')
    var command = split[1];
  log.debug('pathname is '+pathname+' root is ' + command);

  // all servable files live in the client/ or engine/ directories
  if(-1 < ['client','engine'].indexOf(command)){
    log.info('sending ' + pathname);
    comm.sendFile(req, res, pathname);
    return;
  }
  else if('cheevo_grant' == command) {
    // TODO: check list of available cheevos
    log.info('cheevo_update');
    var cheevo = params.cheevo;
    var value = params.value || 100;
    var cheevo_url = escape(config.host+'/client/cheevo/' + cheevo + '.shtml');
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
  else if('score_get_users' == command) {
    // https://graph.facebook.com/me/games.scores?
    // log.info('score_get: ' + params.users);
    // var params = params_from_url(req.url);
    // og_score_get_users(res,JSON.parse(unescape(params.users)),params.access_token);
    res.end('');
    return;
  }
  else if('/favicon.ico' == pathname) {
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

