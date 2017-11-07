#!/usr/bin/env nodejs

const assert = require('assert');
const mongo = require('mongodb').MongoClient;
const process = require('process');

const args = require('./options');
const users = require('./model/users');
const model = require('./model/model');
const server = require('./server/server');

const DB_URL = 'mongodb://localhost:27017/users';

const arg = args.options;

mongo.connect(DB_URL).
	then((db) => users.initUsers(db)).
	then(function(db) {
		const user_model = new model.Model(db);
		server.serve(arg, user_model);
	}).
	catch((error) => console.error(error));
