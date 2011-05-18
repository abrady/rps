// request pattern: http://abrady.xen.prgmr.com/asdf/qwer
// req: method=GET httpVersion=1.1 url=/asdf/qwer headers=[object Object]
// req: method=GET httpVersion=1.1 url=/favicon.ico headers=[object Object]


var http = require('http');
var rps = null;

process.on('uncaughtException', function(err) {
  console.log(err);
});

function rps_handler(req, res) 
{
    console.log("req: method="+req.method+" httpVersion="+req.httpVersion+" url="+req.url+" headers="+req.headers);
    if (req.url == '/rps/') 
    {
        if(!rps)
            rps = require('./rps.js');
        rps.index(req,res);
    }
    else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Unknown url '+req.url+'\n');
    }
}

http.createServer(
    rps_handler
).listen(80);

console.log('HTTP Server running');

// curl -k https://localhost:8000/
var https = require('https');
var fs = require('fs');

var options = {    
  key: fs.readFileSync('conf/server.key'),
  cert: fs.readFileSync('conf/server.crt')
};

https.createServer(options, rps_handler).listen(443);

console.log('HTTPS Server running');

