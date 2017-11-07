const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;

const USERS = 'users';
const DEFAULT_USERS = './usersinfo';
const DEFAULT_INDEXES = { name: 'text' };

function Users(db) {
	this.db = db;
	this.users = db.collection(USERS);
}

Users.prototype.newUser = function(id, newUser, pwd) {
	newUser["pw"] = pwd;
	return this.users.findAndModify(
		{_id: id},
		[],
		{$setOnInsert: newUser},
		{new: true, upsert: true}
	).
	then(function(results) {
		return new Promise( function (resolve, reject) {
			if(results !== undefined) {
				resolve(results.lastErrorObject.upserted);
			} else {
				reject(new Error(`Error while searching for id:${id}`));
			}
		});
	});
}

Users.prototype.find = function(id) {
	const searchSpec = { _id: id };
	return this.users.find(searchSpec).toArray().
	then(function(users) {
		return new Promise(function(resolve, reject) {
			if (users.length === 1) {
				resolve(users[0]);
			} else {
				reject(new Error(`No such user id:${id}`));
			}
		});
	});
}

function initUsers(db, users=null) {
	return new Promise(function (resolve, reject) {
		if (users == null) {
			users = require(DEFAULT_USERS);
		}
		const collection = db.collection(USERS);
		collection.deleteMany({}, function(error, result) {
			if (error !== null)
				reject(error);
			collection.createIndex(DEFAULT_INDEXES);
			collection.insertMany(users, function(error, result){
				if (error !== null)
					reject(error);
				if (result.insertedCount !== users.length) {
					reject(Error(`Insert count ${result.insertedCount} !== ` + `${users.length}`));
				}
				resolve(db);
			});
		});
	});
}

module.exports = {
	Users: Users,
	initUsers: initUsers
};
