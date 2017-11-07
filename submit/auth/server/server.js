const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const sha256 = require('sha256');
const jwt = require('jsonwebtoken');

const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const SEE_OTHER = 303;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

function serve(args, model) {
	const app = express();
	const KEY_PATH = `${args.sslDir}/key.pem`;
	const CERT_PATH = `${args.sslDir}/cert.pem`;
	app.locals.model = model;
	app.locals.port = args.port;
	app.locals.authTimeout = args.authTimeout;
	app.locals.sslDir = args.sslDir;
	setupRoutes(app);
	https.createServer({
		key: fs.readFileSync(KEY_PATH),
		cert: fs.readFileSync(CERT_PATH),
	}, app).listen(args.port, function() {
		console.log(`Listening on port ${args.port}`);
	});
}

function setupRoutes(app) {
	app.use('/users/:id', bodyParser.json());
	app.put('/users/:id', newUser(app));
	app.get('/users/:id', getUsers(app));
	app.put('/users/:id/auth', loginUser(app));
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
		try {
			const token = (request.headers.authorization).replace('Bearer ', '');
			var decoded = jwt.verify(token, id);
		} catch(err) {
			response.status(UNAUTHORIZED);
			response.send({ "status": "ERROR_UNAUTHORIZED", "info": `/users/${id} requires a bearer authorization header`});
			return;
		}
    		if (typeof id === 'undefined') {
      			response.sendStatus(BAD_REQUEST);
    		} else {
      			request.app.locals.model.users.find(id).
				then((results) => response.json(results)).
				catch((err) => {
	  				response.status(NOT_FOUND);
					response.send({ "status": "ERROR_NOT_FOUND", "info": `User ${id} not found` });
				});
    		}
	};
}

function newUser(app) {
	return function(request, response) {
		const id = request.params.id;
		const pw = request.query.pw;
		const hashPwd = sha256(pw);
		const newUser = request.body;
		if(newUser.hasOwnProperty("_id")) {
			if(!(id == newUser._id)) {
				response.status(BAD_REQUEST).send("Id in request should match id in JSON object.");
				return;
			}
		}
		if(typeof id === 'undefined') {
			response.sendStatus(BAD_REQUEST);
		} else {
			request.app.locals.model.users.newUser(id, newUser, hashPwd).
				then(function(result) {
					if(result !== undefined) {
						response.append('Location', `${request.protocol}://${request.hostname}:${request.app.locals.port}/users/${id}`);
						var token = jwt.sign({id}, id, {expiresIn:`${request.app.locals.authTimeout}s`});
						response.status(CREATED);
						response.send({ "status": "CREATED", "authToken": token });
					} else {
						response.append('Location', `${request.protocol}://${request.hostname}:${request.app.locals.port}/users/${id}`);
						response.status(SEE_OTHER);
						response.send({ "status": "EXISTS", "info": "User " + id + " already exists" });
					}
				}).
				catch((error) => {
					console.error(error);
					response.sendStatus(SERVER_ERROR);
				});
		}
	};
}

function loginUser(app) {
	return function(request, response) {
		const id = request.params.id;
		const body = request.body;
		if(body.pw === undefined ) {
			response.status(UNAUTHORIZED);
			response.send({ "status": "ERROR_AUTHORIZED", "info": `/users/${id}/auth requires a valid 'pw' password query parameter` });
		} else {
			request.app.locals.model.users.find(id).
				then(function (result) {
					const hashpwd = sha256(body.pw);
					if(result.pw === hashpwd) {
						response.status(OK);
						var token = jwt.sign({id}, id, {expiresIn:`${request.app.locals.authTimeout}s`});
						response.send({ "status": "OK", "authToken": token });
					} else {
						response.status(NOT_FOUND);
						response.send({ "status": "ERROR_NOT_FOUND", "info": `User ${id} not found` });
					}
				}).
				catch( (error) => {
					response.status(NOT_FOUND);
					response.send({ "status": "ERROR_NOT_FOUND", "info": `User ${id} not found` });
				});
		}
	}
}
