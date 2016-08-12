
var EventEmitter = require('events').EventEmitter;
var flyWebPublishOptions = require('./flywebpublishoptions');

require('util').inherits(Broadcast, EventEmitter);


/**
 *
 */
 function Broadcast(name, fwOptions){
 	if(!(this instanceof Broadcast)){
 		return new Broadcast(name, fwOptions);
 	}

 	var transport;
 	if(fwOptions.transport == flyWebPublishOptions.ETHERNET){
 		transport = require('./transports/transport-ethernet');
 	}else if(fwOptions.transport == flyWebPublishOptions.BLUETOOTH){
 		transport = require('./transports/transport-bluetooth');
 	}else if(fwOptions.transport == flyWebPublishOptions.NFC){
 		//TODO:
 	}else{
 		transport = require('./transports/transport-ethernet');
 	}

	this._transport = transport(name, fwOptions);

}

Broadcast.prototype.start = function(){
	return this._transport.start();
}

Broadcast.prototype.stop = function(){
	return this._transport.stop();
}


module.exports = Broadcast;