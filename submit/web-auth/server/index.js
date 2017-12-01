#!/usr/bin/env nodejs

'use strict';

const express = require('express');
const mustache = require('mustache');
const bodyparser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const https = require('https');

const options = require('./options').options;

function setupRoutes(app) {
  app.use('/', bodyparser.json());
  app.use('/', bodyparser.urlencoded({ extended: false }));
  app.get('/', function(request, response) {
    if(app.locals.authToken === undefined) {
      response.redirect('/login.html');
    } else {
      response.redirect('/account.html');
    }
  });
  app.post('/login', login(app));
  app.post('/register', register(app));
  app.get('/login.html', function(request, response) {
    if(app.locals.authToken === undefined) {
      response.send(doMustache(app, 'login', {
        email: undefined
      }));
    } else {
      response.redirect('/account.html');
    }
  });
  app.get('/registration.html', function(request, response) {
    if(app.locals.authToken === undefined) {
      response.send(doMustache(app, 'registration', {
        errorMsg: undefined
      }));
    } else {
      response.redirect('/account.html');
    }
  });
  app.get('/account.html', displayProfile(app));
  app.get('/logout', logout(app));
}

function login(app) {
  return function(request, response) {
    if(app.locals.authToken === undefined) {
      if(validateLoginForm(request, response, app)) {
        let email = request.body.email;
        app.locals.email = email;
        let password = request.body.password;
        const axios_instance = axios.create({
          baseURL: app.locals.wsURL,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        });
        axios_instance.put(`/users/${email}/auth`, {
          pw: password
        })
        .then(function(res) {
          app.locals.authToken = res.data.authToken;
          response.redirect('/account.html');
        })
        .catch(function(err) {
          let errorView = {
            email: app.locals.email,
            errorMsg: err.response.data.info
          };
          response.send(doMustache(app, 'login', errorView));
        });
      }
    } else {
      response.redirect('/account.html');
    }
  };
}

function register(app) {
  return function(request, response) {
    if(app.locals.authToken === undefined) {
      if(validateRegistrationForm(request, response, app)) {
        let fname = request.body.fname;
        let lname = request.body.lname;
        let email = request.body.email;
        let pwd = request.body.pw;
        let cpw = request.body.cpw;
        if (pwd === cpw) {
          app.locals.email = email;
          const axios_instance = axios.create({
            baseURL: app.locals.wsURL,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false
            })
          });
          axios_instance.put(`/users/${email}?pw=${pwd}`, {
            firstname: fname,
            lastname: lname
          })
          .then(function(res) {
            app.locals.authToken = res.data.authToken;
            response.redirect('/account.html');
          })
          .catch(function(err) {
            let errorView = {
              fname: fname,
              lname: lname,
              email: email,
              errorMsg: `User ${email} already exists`
            };
            response.send(doMustache(app, 'registration', errorView));
          });
        } else {
          let errorView = {
            fname: fname,
            lname: lname,
            email: email,
            errorMsg: 'Passwords do not match'
          };
          response.send(doMustache(app, 'registration', errorView));
        }
      }
    } else {
      response.redirect('/account.html');
    }
  };
}

function displayProfile(app) {
  return function(request, response) {
    if(app.locals.authToken === undefined) {
      response.redirect('/login.html');
    } else {
      const axios_instance = axios.create({
        baseURL: app.locals.wsURL,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      });
      axios_instance.get(`/users/${app.locals.email}`, {
        headers: {
          'authorization': `Bearer ${app.locals.authToken}`
        }
      })
      .then(function(res) {
        let view = {
          firstname: res.data.firstname,
          lastname: res.data.lastname,
          email: app.locals.email
        };
        response.send(doMustache(app, 'account', view));
      })
      .catch(function(err) {
        let errorView = {
          email: app.locals.email,
          errorMsg: err.response.data.info
        };
        response.send(doMustache(app, 'login', errorView));
      });
    }
  };
}

function logout(app) {
  return function(request, response) {
    app.locals.email = undefined;
    app.locals.authToken = undefined;
    response.redirect('/login.html');
  }
}

function validateLoginForm(request, response, app) {
  let email = request.body.email;
  let password = request.body.password;
  if(email == false || password == false) {
    let errorView = {
      email: email,
      errorMsg: 'Enter Both Email ID and password.'
    };
    response.send(doMustache(app, 'login', errorView));
    return false;
  }
  if((/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(email)) {
    return true;
  } else {
    let errorView = {
      email: email,
      errorMsg: 'Invalid Email Address.'
    };
    response.send(doMustache(app, 'login', errorView));
    return false;
  }
  return true;
}

function validateRegistrationForm(request, response, app) {
  let fname = request.body.fname;
  let lname = request.body.lname;
  let email = request.body.email;
  let pwd = request.body.pw;
  let cpw = request.body.cpw;
  if(fname == false || lname == false || email == false || pwd == false || cpw == false) {
    let errorView = {
      fname: fname,
      lname: lname,
      email: email,
      errorMsg: 'Enter all fields.'
    };
    response.send(doMustache(app, 'registration', errorView));
    return false;
  }
  if((/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(email)) {

  } else {
    let errorView = {
      fname: fname,
      lname: lname,
      email: email,
      errorMsg: 'Invalid Email Address.'
    };
    response.send(doMustache(app, 'registration', errorView));
    return false;
  }
  if(pwd.length >= 8) {
    if((/\w+/).test(pwd) === true) {
      if((/\d+/).test(pwd) === true) {
        if((/\s+/).test(pwd) === false) {
          return true;
        }
      }
    }
  }
  let errorView = {
    fname: fname,
    lname: lname,
    email: email,
    errorMsg: 'The password should consist of at least 8 characters none of which is a whitespace character and at least one of which is a digit.'
  };
  response.send(doMustache(app, 'registration', errorView));
  return false;
}

const TEMPLATES_DIR = 'templates';
function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
      String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}

function doMustache(app, templateId, view) {
  return mustache.render(app.templates[templateId], view);
}

function startup() {
  const port = options.port;
  const app = express();
  app.locals.wsURL = options.ws_url;
  app.locals.authToken = undefined;
  setupRoutes(app);
  setupTemplates(app);
  https.createServer({
    key: fs.readFileSync(`${options.sslDir}/key.pem`),
    cert: fs.readFileSync(`${options.sslDir}/cert.pem`)
  }, app).listen(port, function() {
    console.log(`Listening on port ${port}`);
  });
}

startup();
