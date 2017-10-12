const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;

const USERS = 'users';
const DEFAULT_USERS = './usersinfo';
const DEFAULT_INDEXES = { name: 'text' };

function Users(db) {
	this.db = db;
	this.users = db.collection(USERS);
}

Users.prototype.newUser = function(id, newUser) {
	return this.users.replaceOne({_id: id}, newUser, {upsert: true}).
	then(function(results) {
		return new Promise((resolve, reject) => {
			if(results.upsertedCount > 0) {
				resolve(results.upsertedCount);	
			} else if (results.upsertedCount === 0) {
				resolve(results.upsertedCount);
			} else {
				reject(new Error(`Cannot create user with id:${id}`));
			}
		});
	});
}

Users.prototype.deleteUser = function(id) {
	return this.users.deleteOne({ _id: id }).
	then(function(results) {
		return new Promise(function(resolve, reject){
			if(results.deletedCount === 1) {
				resolve();
			} else {
				reject(new Error(`No such user id:${id}`));
			}
		});
	});
}

Users.prototype.updateUser = function(id, newUser) {
	const oldUser = { _id: id };
	return this.users.replaceOne(oldUser, newUser).
	then(function(result){
		return new Promise(function(resolve, reject){
			if(result.modifiedCount !== 1) {
				reject(new Error(`Updated ${result.modifiedCount} user/s`));
			} else {
				resolve();
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
