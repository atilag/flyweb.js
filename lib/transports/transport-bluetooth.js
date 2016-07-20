var EventEmitter = require('events').EventEmitter;
var gattService = require('../flywebgattservice');
var rfcomm = new /*puaj!!*/ (require('bleutooth-serial-port')).BluetoothSerialPort();

require('util').inherits(TransportBluetooth, EventEmitter);


function _errorHandler(error){
	console.log('FlyWeb GATT Service error: ' + error);
}


function TransportBluetooth(name, fwOptions){
	if(!(this instanceof TransportBluetooth)){
		return new TransportBluetooth(name, fwOptions);
	}

	this._lazyInitialized = false;
	this._serviceName = name;
	this._fwOptions = fwOptions;
}

TransportBluetooth.prototype.start = function(){
	var init = Promise.resolve();
	if(this._lazyInitialized == false)
		init = this._init();

	return init.then(() => {
		return gattService.startAdvertising(this._serviceName, this._fwOptions);
	})
}

TransportBluetooth.prototype._init = function(){
	//TODO: Start the socket proxy here?
	gattService.on('error', _errorHandler);
	gattService.on('transfer', this._createRfcommServerSocket);
}

TransportBluetooth.prototype._createRfcommServerSocket = function(){
	//1.- Get a random name (Mac Adress not a solution anymore)
	//2.- Create an RFCOMM server socket, listening with the random name
	//3.- Send the random name back to the client (as Trasnfer is a charactersitic with response)
	//4.- Wait for the client to connect (few secs)
	
}


module.export = TransportBluetooth;
