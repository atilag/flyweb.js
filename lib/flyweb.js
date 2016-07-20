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

function getRoutes(context, app, urlPath){
	var router = express.Router();
	router.get('/', function(req, res) {
  		res.render(urlPath);
	});
	return router;
}

FlyWeb.prototype._parseOptions = function(fwOptions){
	this.uiUrl = {
		path: '/'
	};

	if(!fwOptions)
		return Promise.resolve();

	this.uiUrl = url.parse(fwOptions.uiUri);
	return Promise.resolve();
}

FlyWeb.prototype._initHttpServer = function(){
	const PORT = 6666;
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


	//TODO
	app.set('port', PORT);

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

FlyWeb.prototype._initBroadcast = function(name, fwOptions){
	
	var broadcaster = broadcast(name, fwOptions.transport);
	boradcaster.start().then( () => {
		console.log('Broadcasting Flyweb service');
	});
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
		.then(() => {
			return Promise.all([ 
				this._initHttpServer(fwOptions),
				this._initBroadcast(name, fwOptions) 
			]);
		}).then(() => {
			console.log("Server is being advertise");
			return Promise.resolve();
		});
}

module.exports = FlyWeb;
