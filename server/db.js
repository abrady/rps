GLOBAL.DEBUG = true;

var log = require('../util/log');
log.level = log.DEBUG;
var sys = require("sys");
var debug = require('util').debug;
var inspect = require('util').inspect;
var test = require("assert");

var Db = require('mongodb').Db,
  Connection = require('mongodb').Connection,
  Server = require('mongodb').Server,
  BSON = require('mongodb').BSONNative;

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

log.info("Connecting to " + host + ":" + port);
var db_obj = new Db('node-mongo-examples', new Server(host, port, {}), {native_parser:false});
var db  = null;
var rps_reqs = 'rps_reqs';
var rps_reqs_collection = null;


function collection_test(coll) {
  log.debug('adding test data to collection');
  coll.insert({'name':'Aaron Brady', '_id':12345})
  coll.insert({'name':'Bobby McGee', '_id':67890})
}

db_obj.open(
  function(err, db_opened) {
    db = db_opened;

    // creating every time is okay.
    db.createCollection(
      rps_reqs,
      function(err, collection) {
        rps_reqs_collection = collection;
        collection_test(collection);
        exports.rps_reqs_collection = rps_reqs_collection;
      }
    );
  }
);

exports.request_insert = function(req_id,game_state) {
  log.info("inserting req_id:" + req_id);
  if (!rps_reqs_collection) {
    log.err('request_add: collection not loaded yet');
    return;
  }

  rps_reqs_collection.insert(
    {_id:req_id,'game_state':game_state}, 
    {safe:true}, 
    function(err,doc) {
      if (err) {
        log.err("error occurred adding req '" + req_id + ' ' + err);
      }
    }
  );
}

// return game state for the passed id
exports.request_get = function(req_id, callback) {
  log.debug("inserting req_id:" + req_id);
  if (!rps_reqs_collection) {
    log.err('request_add: collection not loaded yet');
    return;
  }
  rps_reqs_collection.findOne(
    {_id:req_id},
    function(err, game_state) {
      if(err) {
        log.err("error fetching request " + req_id);
        return;
      }
      log.debug("fetched data for req_id:" + req_id);
      callback(game_state);
    }
  );
}

exports.request_remove = function(req_id) {
  log.info("removing req_id:" + req_id);
  if (!rps_reqs_collection) {
    log.err('request_add: collection not loaded yet');
    return;
  }
  rps_reqs_collection.remove(
    {'_id':req_id},
    {safe:true},
    function(err,count) {
      if (err) {
        log.err("couldn't remove request " + req_id + " error: " + err);
      } else {
        log.info("removed " + count + " records for id " + req_id);
      }
    }
  );
}