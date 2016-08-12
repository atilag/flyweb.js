"use strict";

var EventEmitter = require('events').EventEmitter;
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

var webSocket = require('ws');
var flyWebFetchEvent = require('./flywebfetchevent');
var flyWebWebSocketEvent = require('./flywebwebsocketevent');
var broadcast = require('./broadcast');
var url = require('url');

require('util').inherits(FlyWeb, EventEmitter);

const _DEFAULT_PORT=47114

function getRoutes(context, app, urlPath){
	var router = express.Router();
	router.get('/', function(req, res) {
  		res.render(urlPath);
	});
	return router;
}


function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

/**
 * FlyWeb object
 */
function FlyWeb() {
	if(!(this instanceof FlyWeb))
		return new FlyWeb();

	this.uiUrl = null;
}

FlyWeb.prototype.publishServer = function(name,fwOptions){
	if(!name){
		return Promise.reject('Invalid arguments, must provide a name for the FlyWeb service!');
	}
	return this._parseOptions(fwOptions)
		.then(fwOptions => {
			return Promise.all([ 
				this._initHttpServer(fwOptions),
				this._initBroadcast(name, fwOptions)
			]);
		}).then(server => {
			console.log("Server is being advertise");
			return Promise.resolve(server);
		});
}

FlyWeb.prototype._parseOptions = function(fwOptions){
	if(!fwOptions)
		return Promise.reject('Need a valid FlyWebPublishOptions object as parameter');

	this.uiUrl = {
		path: '/',
	};

	this.uiUrl = url.parse(fwOptions.uiUri);
	fwOptions.port = normalizePort(fwOptions.port) || _DEFAULT_PORT;

	return Promise.resolve(fwOptions);
}

FlyWeb.prototype._initHttpServer = function(fwOptions){
	var app = express();

	app.set('view engine', 'hbs');
	app.set('view engine', 'html');
	app.engine('html', require('hbs').__express);
	app.set('views', path.join(__dirname, 'views'));

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use('/', getRoutes(this, app, this.uiUrl.path));

	app.set('port', fwOptions.port);

	var server = http.createServer(app);
	var ws = new webSocket.Server({
		server: server,
		path: '/control'
	});

	var self = this;

	ws.on('connection', function(ws){
		console.log('Got a WebSocket connection');
		self.emit('websocket', flyWebWebSocketEvent(ws));
		ws.on('message', function(data){
			console.log('Got a WebSocket message');
		});
	});

	server.listen(fwOptions.port);
	server.on('error', function(error){
		console.log('HTTP Server error');
	});
	server.on('listening', function(){
		console.log('HTTP Server listening');
	});
	server.on('close', function(){
		console.log('HTTP Server closed');
	});

	return Promise.resolve(server);
}

FlyWeb.prototype._initBroadcast = function(name, fwOptions){
	var broadcaster = broadcast(name, fwOptions);
	broadcaster.start().then(() => {
		console.log('Broadcasting Flyweb service');
	});
}

module.exports = FlyWeb;
