"use strict";

var EventEmitter = require('events').EventEmitter;
var http = require('http');

var webSocket = require('ws');
var url = require('url');
var flyWebFetchEvent = require('./flywebfetchevent');
var flyWebWebSocketEvent = require('./flywebwebsocketevent');
var fs = require('fs');

require('util').inherits(FlyWeb, EventEmitter);


/**
 * FlyWeb object
 */
function FlyWeb() {
	if(!(this instanceof FlyWeb)){
		return new FlyWeb();
	}

	EventEmitter.call(this);
	this.uiUrl = null;
}

/**
 * FlyWeb "private" methods
 */
 FlyWeb.prototype._parseOptions = function(fwOptions){
	if(!fwOptions)
		return Promise.resolve();

	this.uiUrl = url.parse(fwOptions.uiUri);
	return Promise.resolve();
}

FlyWeb.prototype._initHttpServer = function(){
	const PORT = 6666;
	var self = this;
	var server = http.createServer(function(req, res){
		self.emit('fetch', flyWebFetchEvent(req, res));
	});

	var ws = new webSocket.Server({
		server: server,
		path: '/control'
	});

	ws.on('connection', function(ws){
		console.log('Got a WebSocket connection');
		self.emit('websocket', flyWebWebSocketEvent(req,res,ws));
		/*ws.on('message', function(data){
			console.log('Got a WebSocket message');
		});*/
	});

	server.listen(PORT);
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


FlyWeb.prototype._initTransport = function(){
	return Promise.resolve();
}


/**
 * FlyWeb "public" methods
 */
FlyWeb.prototype.publishServer = function(name, fwOptions){
	if(!name){
		return Promise.reject('Invalid arguments, must provide a name for the FlyWeb service!');
	}

	var self = this;
	return this._parseOptions(fwOptions)
		.then(() => {
			return Promise.all([ 
				this._initHttpServer(),
				this._initTransport() 
			]);
		}).then(() => {
			console.log("Server is being advertise");
			return Promise.resolve();
		});
}

FlyWeb.prototype.fetch = function(clientUrl){
	var pathname = url.parse(clientUrl).pathname;
	// TODO: Promisify ? Async readFile ?
	var data;
	try{
		data = fs.readFileSync(pathname, 'utf8');
	}catch(ex){
		return Promise.reject('Cannot fetch de URL: ' + pathname + 'Error: ' + ex);
	}
	return Promise.resolve(data);
}

module.exports = FlyWeb;
