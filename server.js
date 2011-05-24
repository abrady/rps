// request pattern: http://abrady.xen.prgmr.com/asdf/qwer
// req: method=GET httpVersion=1.1 url=/asdf/qwer headers=[object Object]
// req: method=GET httpVersion=1.1 url=/favicon.ico headers=[object Object]

// "cookie": "fbs_224658110883993=\"access_token=224658110883993%7C2.AQDb6wR1yZvD1JCY.3600.1305795600.1-827884427%7Cc7sxBeGBSI3emGkVdDNKBuqY-HY&expires=1305795600&secret=AQCTzmT3i4WGUUXy&session_key=2.AQDb6wR1yZvD1JCY.3600.1305795600.1-827884427&sig=2bc606f1ac15e543d1c9044e649238d9&uid=827884427\"""
// js: escape == urlencode, unescape == urldecode
//var hashlib = require("./lib/hashlib/build/default/hashlib");
var sys = require("sys");
var url = require("url");
var http = require('http');
var comm = require('./lib/comm');
var util = require('./util');
var rps = null;
var config = require('./config');

process.on('uncaughtException', function(err) {
  console.log(err);
});

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
    var c = cookie.split('fbs_'+config.app_id+'="');
    if(c.length != 2 || c[0].length != 0)
        return null;
    var d = c.substring(0,c.length-1);
    var e = d.split('&');
    return dict_from_keyvals_str(e,'=');
}

// url=/cheevo_update?cheevo=&score=
function params_from_url(url)
{
    var a = url.split('?')
    if(a.length <= 0)
        return null;
    var b = a[1].split('&')
    return dict_from_keyvals_str(b,'=');
}


// signed_request=ht5LfzRGGug4CxR2eGTJJ80mTDj9-FjtxXj8_51hR48.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTMwNTc1NTcyOCwidXNlciI6eyJjb3VudHJ5IjoidXMiLCJsb2NhbGUiOiJlbl9VUyIsImFnZSI6eyJtaW4iOjIxfX19
function post_handler(request, callback) {
    var body = '';

    if (request.method == 'POST')  {
        request.addListener('data', function(chunk)	{
                                body+= chunk;
                            });

        request.addListener('end', function()	{
                                sys.debug(body);
                                callback(body);
                            });
    };
}

var user_info = [];

// use this to query data from open graph
function graph_get(path,end_cb) {
//    sys.debug('graph_get:' + path);
    data = '';
    https.get(
        {
            host: 'graph.dev.facebook.com',
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
    sys.debug('graph_post:' + path + ' body: ' + body);
    var data = '';
    var graph_req = https.request(
        {
            host: 'graph.facebook.com',
            method: 'POST',
            path: path
        },
        function(res) {
			res.on(
                'data',
                function(d) {
					sys.debug('graph data:'+d);
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
			sys.debug('og_action_get:'+d);
            res.end  ('og_action_get:'+d);
		}
    );
}

function og_action_create(res, action_name, object_name, access_token)
{
    // curl -F 'access_token=224658110883993|2.AQBXJXLB4afinN9o.3600.1305936000.0-827884427|E9Fg6j9zpTSlhiSwyYb1_aqc454' \
    //  -F 'to=http://example.com/' \
    //     'https://graph.dev.facebook.com/me/superfbrps:paper_covers_rock'
    var body = 'to='+escape(config.base_url)+'/client/og/'+object_name+'.shtml'+'&'
        + 'access_token='+escape(access_token);

    graph_post(
        '/me/superfbrps:'+action_name,
        body,
        function(d) {
			sys.debug('og_action_create:'+action_name+':'+d);
            res.end  ('og_action_create:'+action_name+':'+d);
		}
    );
}

// function og_action_delete(action_id, access_token)
// {
//     // curl -X DELETE \
//     //  -F 'access_token=224658110883993|2.AQBXJXLB4afinN9o.3600.1305936000.0-827884427|E9Fg6j9zpTSlhiSwyYb1_aqc454' \
//     //     'https://graph.dev.facebook.com/{id_from_create_call}'
// }

function og_score_set(res, score, access_token, app_secret)
{
    // https://graph.facebook.com/me/games.scores?
    var body =
        'score='+escape(score)
            + '&access_token='+escape(access_token)
            + '&client_secret='+app_secret;

    graph_post(
        '/me/games.scores?',
        body,
        function(d) {
			sys.debug('og_score_set:'+score+':'+d);
            res.end  ('og_score_set:'+score+':'+d);
		}
    );
}

function og_score_delete_all(access_token)
{
    // https://graph.facebook.com/[config.app_id]/games.scores?
}

function req_handler(req, res)
{
    sys.debug(str_from_req(req))
    var fb_info = fbinfo_from_cookie(req.headers.cookie);
    var index_fname = '/client/index.shtml';
    var parse = url.parse(req.url);
    var pathname = parse.pathname;
    sys.debug(pathname);
    if (pathname.length <= 1) {
        pathname = index_fname;
    }
    var split = pathname.split('/')
    var command = split[1];
    sys.debug('pathname is '+pathname+' root is ' + command);

    // all servable files live in the client/ or engine/ directories
    if(-1 < ['client','engine'].indexOf(command)){
        sys.debug('sending ' + pathname);
        comm.sendFile(req, res, pathname);
        return;
    }
    else if('cheevo_grant' == command) {
        // TODO: check list of available cheevos
        sys.debug('cheevo_update');

        var params = params_from_url(req.url);
        var cheevo = params.cheevo;
        var value = params.value || 100;
        var cheevo_url = escape('abrady.xen.prgmr.com/client/cheevo/' + cheevo + '.shtml');
        var path = '/me/games.achieves?';
        var body = 'achievement='+cheevo_url+'&access_token='+escape(fb_info.access_token)+'&client_secret='+config.app_secret;
        var graph_req = graph_post(
            path,
            body,
            function(d) {
				sys.debug('og achieves response:'+d);
                res.end('og achieves response: '+cheevo+' response: '+d);
			}
        );
        return;
    }
    else if('cheevo_get' == command) {
        graph_get(
            '/me/games.achieves?access_token='+escape(fb_info.access_token),
            function (data) {
                res.end(data);
            }
        );
        return;
    }
    else if('action_grant' == command) {
        // TODO: check list of available actions
        sys.debug('action_grant');
        var params = params_from_url(req.url);
        og_action_create(res,params.action,params.object,fb_info.access_token);
        return;
    }
    else if('action_get' == command) {
        // TODO: check list of available actions
        sys.debug('action_get');
        var params = params_from_url(req.url);
        og_action_get(res,params.action,fb_info.access_token);
        return;
    }
    else if('score_set' == command) {
        // https://graph.facebook.com/me/games.scores?
        sys.debug('score_set');
        var params = params_from_url(req.url);
        og_score_set(res,params.score,params.access_token,config.app_secret);
        return;
    }
    sys.debug('unkown command pathname is '+pathname+' root is ' + command);
}

var port = 8081;

http.createServer(
  req_handler
).listen(port);
console.log('HTTP Server running on port' + port);

// curl -k https://localhost:8000/
var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('conf/server.key'),
  cert: fs.readFileSync('conf/server.crt')
};

https.createServer(options, req_handler).listen(port+1);
console.log('HTTPS Server running:' + (port+1));

