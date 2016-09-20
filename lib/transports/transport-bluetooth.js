"use strict";

var EventEmitter = require('events').EventEmitter;
var gattService = require('../flywebgattservice')();
var btServer = new (require('bluetooth-serial-port')).BluetoothSerialPortServer();
var net = require('net');

// TODO: Secure Sockets in the SocketBridge for HTTPS

function TransportBluetooth(name, fwOptions){
	if(!(this instanceof TransportBluetooth)){
		return new TransportBluetooth(name, fwOptions);
	}

	this._lazyInitialized = false;
	this._serviceName = name;
	this._fwOptions = fwOptions;
	this._socketBridge = {};
}

require('util').inherits(TransportBluetooth, EventEmitter);

TransportBluetooth.prototype.start = function(){
	var init = Promise.resolve();
	if(this._lazyInitialized == false)
		init = this._init();

	return init.then(() => {
		return gattService.startAdvertising(this._serviceName, this._fwOptions);
	});
}

TransportBluetooth.prototype._init = function(){
	gattService.on('error', this._errorHandler(this));
	gattService.on('transfer', this._createRfcommServerSocketHandler(this));
	gattService.on('connection', this._startSocketBridge(this));
	gattService.on('disconnect', this._disconnectHandler(this));
	return Promise.resolve();
}

TransportBluetooth.prototype._createRfcommServerSocketHandler = function(self){
	return function(callback, resultSuccess, resultError){
		//1.- Get a random name (Mac Adress not a solution anymore)
		//2.- Create an RFCOMM server socket, listening with the random name
		//3.- Send the random name back to the client (as Trasnfer is a charactersitic with response)
		//4.- Wait for the client to connect (few secs)

		// TODO: While figuring out a way to solve the problem of sending the proper information
		// to the client, to they can directly connect to our RFCOMM socket. I'll set a fixed UUUID and
		// listening channel.
		const RFCOMM_SOCKET_UUID = 'f6537d4f-49b6-425b-8407-195b66823cfc';
		const RFCOMM_SOCKET_CHANNEL = 1;

		var self = this;
		btServer.listen(RFCOMM_SOCKET_UUID, RFCOMM_SOCKET_CHANNEL, function(clientAddress){
			console.log('Client ' + clientAddress + ' connected!');
		}, function(error){
			self.emit('error', error);
		});

		callback(resultSuccess);
	}
}

TransportBluetooth.prototype._startSocketBridge = function(self){
	return function(clientAddress){
		var client = new net.Socket();
		client.connect(self._fwOptions.port, function(){
			console.log('Connected to the HTTP server, now starting the Bluetooth <-> HTTP bridge...');
			self._socketBridge = SocketBridge(client, btServer);
			self._socketBridge.on('error', self._errorHandler(self));
			self._socketBridge.start();
		});

		client.on('error', self._errorHandler(self));
	}
}

TransportBluetooth.prototype._disconnectHandler = function(self){
	return function(){
		console.log('Disconnected from Bluetooth!, closing the SocketBridge...');
		self._socketBridge.stop();
	}
}

TransportBluetooth.prototype._errorHandler = function(self){
	return function(error){
		console.error(error);
		gattService.stopAdvertising();
		self._socketBridge.stop();
	}	
}

/**
 * A bridge to communicate Bluetooth sockets with TCP sockets
 *
 */
function SocketBridge(tcpEndpoint, bluetoothEndpoint){
	if(!(this instanceof SocketBridge)){
		return new SocketBridge(tcpEndpoint, bluetoothEndpoint);
	}

	this._tcpEndpoint  = tcpEndpoint;
	this._bluetoothEndpoint = bluetoothEndpoint;
}

require('util').inherits(SocketBridge, EventEmitter);

SocketBridge.prototype.start = function(){

	// TCP bridging
	var self = this;

	this._tcpEndpoint.on('data', function(data){
		console.log("Bridge: data: TCP ---> Bluetooth");
		self._bluetoothEndpoint.write(new Buffer(data, 'utf8'), function(err, bytesWritten){
			if(err){
				self.emit('error', err);
			}
		});
	});

	this._tcpEndpoint.on('close', function(){
		console.log("Bridge: close: TCP");
		self._bluetoothEndpoint.close();
	});

	this._tcpEndpoint.on('error', this._errorHandler(this));

	// Bluetooth bridging

	this._bluetoothEndpoint.on('data', function(data){
		console.log("Bridge: data: Bluetooth ---> TCP");
		self._tcpEndpoint.write(data);
	});

	this._bluetoothEndpoint.on('close', function(){
		console.log("Bridge: close: Bluetooth");
		self._tcpEndpoint.close();
	});

	this._bluetoothEndpoint.on('error', this._errorHandler(this));

	console.log('Bluetooth <-> HTTP bridge started');
}

SocketBridge.prototype.stop = function(){
	this._bluetoothEndpoint.close();
	this._tcpEndpoint.end();
	this._bluetoothEndpoint.removeAllListeners('data');
	this._bluetoothEndpoint.removeAllListeners('close');
	this._bluetoothEndpoint.removeAllListeners('error');
	this._tcpEndpoint.removeAllListeners('data');
	this._tcpEndpoint.removeAllListeners('close');
	this._tcpEndpoint.removeAllListeners('error');
}

SocketBridge.prototype._errorHandler = function(self){
	return function(error){
		self.emit('error', error);
	}
}

SocketBridge.prototype.send2Tcp = function(data){
	return this._tcpEndpoint.write(data);
}

SocketBridge.prototype.send2Bt = function(data){
	return this._bluetoothEndpoint.write(data);
}


module.exports = TransportBluetooth;
