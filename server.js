// request pattern: http://abrady.xen.prgmr.com/asdf/qwer
// req: method=GET httpVersion=1.1 url=/asdf/qwer headers=[object Object]
// req: method=GET httpVersion=1.1 url=/favicon.ico headers=[object Object]

// "cookie": "fbs_224658110883993=\"access_token=224658110883993%7C2.AQDb6wR1yZvD1JCY.3600.1305795600.1-827884427%7Cc7sxBeGBSI3emGkVdDNKBuqY-HY&expires=1305795600&secret=AQCTzmT3i4WGUUXy&session_key=2.AQDb6wR1yZvD1JCY.3600.1305795600.1-827884427&sig=2bc606f1ac15e543d1c9044e649238d9&uid=827884427\"""
// js: escape == urlencode, unescape == urldecode

var hashlib = require("./lib/hashlib/build/default/hashlib");
var sys = require("sys");
var url = require("url");
var http = require('http');
var comm = require('./lib/comm');
var util = require('./util');
var rps = null;

var app_id =  '224658110883993';
var app_secret = 'd37dfe315494b6959a59a8571c7a8f51';


process.on('uncaughtException', function(err) {
  console.log(err);
});

function str_from_req(req)
{
    return "req: method="+req.method+" httpVersion="+req.httpVersion+" url="+req.url+"\nheaders="+util.dir(req.headers) +"\nbody="+req.body;
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
    var c = cookie.split('fbs_'+app_id+'="')[1];
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

// post_handler(
//     req, 
//     function(request_data) 
//     {
//         var a = request_data.split('=');
//         var name = a[0];
//         var vals = a[1].split('.');
//         if(name != 'signed_request')
//             throw 'key must be signed_requst, not ' + name;
//         var sha = vals[0];
//         var base64encoded_req = vals[1];
//         var b = new Buffer(base64encoded_req,'base64');
//         var req_str = b.toString();
//         var req = JSON.parse(req_str);
//         // TODO: check the sha
//         if(!req.token) {
//             url = 'https://www.facebook.com/dialog/oauth?client_id='+app_id+'&redirect_uri=YOUR_CANVAS_PAGE';
//             body = http.STATUS_CODES[302] + '. Redirecting to ';
//         }
//     });

function req_handler(req, res) 
{
//    sys.debug(str_from_req(req))
    var parse = url.parse(req.url);
    var pathname = parse.pathname;
    if (pathname.length <= 1) {
        pathname = '/client/index.shtml';
    }
    var split = pathname.split('/')
    var command = split[1];
//    sys.debug('pathname is '+pathname+' root is ' + command);
    if(-1 < ['client','engine'].indexOf(command)){
        sys.debug('sending ' + pathname);
        comm.sendFile(req, res, pathname);
        return;
    }
    else if('cheevo_update' == command) {
        sys.debug(str_from_req(req))
        sys.debug('cheevo_update');
        post_handler(
            req,
            function(body) {
                // creating: https://graph.facebook.com/me/games.achieves?achievement=<cheevo_url>&access_token=<tok>&client_secret=<secret>
				debugger;
                var fb_info = fbinfo_from_cookie(req.headers.cookie);
                var params = params_from_url(req.url);
                var cheevo = params.cheevo || 'test_cheevo';
                var value = params.value || 100;
                var cheevo_url = encode('https://abrady.xen.prgmr.com/cheevo/' + cheevo);
                var path = '/games.achieves?achievement='+cheevo_url+'&access_token='+fb_info.token+'&client_secret='+app_secret;
				sys.debug('posting cheevo to ' + path);
                https.get(
                    { host: 'graph.facebook.com', path: path }, 
                    function(res) {
						console.log("statusCode: ", res.statusCode);
						console.log("headers: ", res.headers);
						res.on(
                            'data',
                            function(d) {
								sys.debug('graph data:'+d);
							}
                        );
					}
                ).on(
                    'error', 
                    function(e) {
						console.error(e);
					}
                );
            });
        return;
    }
    sys.debug('unkown command pathname is '+pathname+' root is ' + command);   
}

http.createServer(
    req_handler
).listen(80);

console.log('HTTP Server running');

// curl -k https://localhost:8000/
var https = require('https');
var fs = require('fs');

var options = {    
  key: fs.readFileSync('conf/server.key'),
  cert: fs.readFileSync('conf/server.crt')
};

https.createServer(options, req_handler).listen(443);

console.log('HTTPS Server running');

