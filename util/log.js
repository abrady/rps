var ut = require('./util');

exports.level = 0;

function sev_msg(lvl) {
  var sev = ['ERROR','WARN','INFO','DEBUG'];
  return (ut.inRange(lvl,sev) ? sev[lvl] : String(lvl));
}

function log(lvl, msg) {
  (lvl <= exports.level)
    && console.log(ut.sprintf('[%s]\t%s', sev_msg(lvl), msg));
}

exports.ERR   = 0;
exports.WARN  = 1;
exports.INFO  = 2;
exports.DEBUG = 3;
exports.log   = log;
exports.debug = function (msg) { log(exports.DEBUG, msg); };
exports.info  = function (msg) { log(exports.INFO, msg); };
exports.warn  = function (msg) { log(exports.WARN, msg); };
exports.err   = function (msg) { log(exports.ERR, msg); };
