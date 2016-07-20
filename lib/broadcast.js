
var EventEmitter = require('events').EventEmitter;
var flyWebPublishOptions = require('./flywebpublishoptions');

require('util').inherits(Broadcast, EventEmitter);


/**
 *
 */
 function Broadcast(name, fwOptions){
 	if(!(this instanceof Broadcast)){
 		return new Broadcast(name, transport);
 	}

 	if(transport == flyWebPublishOptions.ETHERNET){
 		//TODO:
 	}else if(transport == flyWebPublishOptions.BLUETOOTH){
 		this._transport = require('transports/transport-bluetooth')(name, fwOptions);
 	}else if(transport == flyWebPublishOptions.NFC){
 		//TODO:
 	}
}

Broadcast.prototype.start = function(){
	return this._transport.start();
}

Broadcast.prototype.stop = function(){
	return this._transport.stop();
}


module.exports = Broadcast;