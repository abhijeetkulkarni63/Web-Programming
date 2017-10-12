const express = require('express');
const bodyParser = require('body-parser');

const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const SEE_OTHER = 303;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

function serve(port, model) {
	const app = express();
	app.locals.model = model;
	app.locals.port = port;
	setupRoutes(app);
	app.listen(port, function() {
		console.log(`Listening on port ${port}`);
	});
}

function setupRoutes(app) {
	app.use('/users/:id', bodyParser.json());
	app.put('/users/:id', newUser(app));
	app.get('/users/:id', getUsers(app));
	app.delete('/users/:id', deleteUser(app));
	app.post('/users/:id', updateUser(app));
}

function requestUrl(request) {
	const port = request.app.locals.port;
	return `${request.protocol}://${request.hostname}:${port}${request.originalUrl}`;
}

module.exports = {
	serve: serve
}

function getUsers(app) {
	return function(request, response) {
    	const id = request.params.id;
    	if (typeof id === 'undefined') {
      		response.sendStatus(BAD_REQUEST);
    	} else {
      		request.app.locals.model.users.find(id).
				then((results) => response.json(results)).
				catch((err) => {
	  				console.error(err);
	  				response.sendStatus(NOT_FOUND);
				});
    	}
	};
}

function newUser(app) {
	return function(request, response) {
		const id = request.params.id;
		const newUser = request.body;
		if(newUser.hasOwnProperty("_id")) {
			if(!(id == newUser._id)) {
				console.error("Id in request should match id in JSON object.");
				response.sendStatus(BAD_REQUEST);
				return;
			}
		}
		if(typeof id === 'undefined') {
			response.sendStatus(BAD_REQUEST);
		} else {
			request.app.locals.model.users.newUser(id, newUser).
			then(function(upsertedCount) {
				if(upsertedCount > 0) {
					response.append('Location', requestUrl(request));
					response.sendStatus(CREATED);
				} else {
					response.sendStatus(NO_CONTENT);
				}
			}).
			catch((error) => {
				console.error(error);
				response.sendStatus(SERVER_ERROR);
			});
		}
	};
}

function deleteUser(app) {
	return function(request, response) {
		const id = request.params.id;
		if (typeof id === 'undefined') {
			response.sendStatus(BAD_REQUEST);
		} else {
			request.app.locals.model.users.deleteUser(id).
			then(() => response.end()).
			catch((error) => {
				console.error(error);
				response.sendStatus(NOT_FOUND);
			});
		}
	};
}

function updateUser(app) {
	return function(request, response) {
		const id = request.params.id;
		const newUser = request.body;
		if(newUser.hasOwnProperty("_id")) {
			if(!(id == newUser._id)) {
				console.error("Id in request should match id in JSON object.");
				response.sendStatus(BAD_REQUEST);
				return;
			}
		}
		if(typeof id === 'undefined' || 
			typeof newUser.name === 'undefined') {
			response.sendStatus(BAD_REQUEST);
		} else {
			request.app.locals.model.users.updateUser(id, newUser).
			then(() => {
				response.append('Location', requestUrl(request));
				response.sendStatus(SEE_OTHER);	
			}).
			catch((error) => {
				console.error(error);
				response.sendStatus(NOT_FOUND);
			});
		}
	}
}