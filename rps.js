fs = require('fs');
http = require('http');
path = require('path');
url = require('url');
comm = require('./lib/comm');

var fb_app_info={id:224658110883993,secret:d37dfe315494b6959a59a8571c7a8f51};


function index(req, response) {
    var parse = url.parse(req.url);
    var pathname = parse.pathname;
    if (pathname.length <= 1) {
        pathname = html_root;
    }
    var split = pathname.split('/');
    response.end(res);
}


exports.index = index;