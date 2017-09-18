'use strict';

const assert = require('assert');
const mongo = require('mongodb').MongoClient;


//used to build a mapper function for the update op.  Returns a
//function F = arg => body.  Subsequently, the invocation,
//F.call(null, value) can be used to map value to its updated value.
function newMapper(arg, body) {
  	return new (Function.prototype.bind.call(Function, Function, arg, body));
}

//print msg on stderr and exit.
function error(msg) {
  	console.error(msg);
  	process.exit(1);
}

//export error() so that it can be used externally.
module.exports.error = error;


//auxiliary functions; break up your code into small functions with
//well-defined responsibilities.

//perform op on mongo db specified by url.
function dbOp(url, op) {
  //op = operation_object
	const jsonOp = JSON.parse(op);
  	const operation_name = jsonOp.op;
  	const collection_name = jsonOp.collection;
  	const args = jsonOp.args;
	const fn = jsonOp.fn;
  	mongo.connect(url).then(function(db) {
    		if(operation_name === 'create') {
      			db.collection(collection_name).insert(args).then(function(result) {
				db.close();
      			});
    		}
    		if(operation_name === 'read') {
      			if(args === undefined) {
        			db.collection(collection_name).find({}).toArray().then(function(docs) {
					console.log(docs);
					db.close();
        			});
      			} else {
        			db.collection(collection_name).find(args).toArray().then(function(docs) {
					console.log(docs);
					db.close();
        			});
      			}
    		}
    		if(operation_name === 'update') {
			let mapper = newMapper(fn[0], fn[1]);
			if(args !== undefined) {
				let findPromise = db.collection(collection_name).find(args).toArray().then(function(docs) {
					for(var i=0; i<docs.length; i++) {
						delete docs[i]['_id'];
						db.collection(collection_name).update(docs[i], mapper.call(null, docs[i])).then(function(result) {
							
						});
					}
					db.close();
				});
			} else {
				let findPromise = db.collection(collection_name).find({}).toArray().then(function(docs) {
					for(var i=0; i<docs.length; i++) {
						delete docs[i]['_id'];
						db.collection(collection_name).update(docs[i], mapper.call(null, docs[i])).then(function(result) {
							
						});
					}
					db.close();
				});
			}
		}
	    	if(operation_name === 'delete') {
			if(args === undefined) {
				db.collection(collection_name).deleteMany({}).then(function(result) {
					db.close();
				});
			} else {
				db.collection(collection_name).deleteMany(args).then(function(result) {
					db.close();
				});
			}
    		}
  	});
}

//make main dbOp() function available externally
module.exports.dbOp = dbOp;
