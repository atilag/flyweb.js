"use strict";

var EventEmitter = require('events').EventEmitter;
var mdns = require('mdns');

require('util').inherits(TransportEthernet, EventEmitter);

/**
 * Ethernet transport channel will delegate the publishing to MDNS by default
 *
 */
function TransportEthernet(name, fwOptions){
	if(!(this instanceof TransportEthernet)){
		return new TransportEthernet(name, fwOptions);
	}

	this._lazyInitialized = false;
	this._serviceName = name;
	this._fwOptions = fwOptions;
}

TransportEthernet.prototype.start = function(){
	var init = Promise.resolve();
	if(this._lazyInitialized == false)
		init = this._init();

	return init.then(() => {
		try{
			var advertisement = mdns.createAdvertisement(mdns.tcp('flyweb'), this._fwOptions.port, {
	  			name: this._serviceName,
	  			txtRecord: {}
			});
		}catch(ex){
			return Promise.reject(x);
		}
		advertisement.start();
		return Promise.resolve();
	});
}

TransportEthernet.prototype._init = function(){
	return Promise.resolve();
}


module.exports = TransportEthernet;
