fs = require('fs');
http = require('http');
path = require('path');
url = require('url');
Comm = require('./lib/comm');

var fb_app_info={id:224658110883993,secret:d37dfe315494b6959a59a8571c7a8f51};


function index(req, response) {
    res = '<head>head!</head>'
        +'<body>'
        +  '<h1>Hello World!</h1>'
        +'</body>';
    response.writeHead(200, {
                           'Content-Length': res.length,
                           'Content-Type'  : 'text/html'
                       });
    response.end(res);
}


exports.index = index;