"use strict";

// FlyWeb Bluetooth Service
// Por ahoa solo vamos a exponer estos atributos:
// * Nombre del servicio 
// * Path (www.loquesea.com/el/path/a/la/web.html), que es el landing page de los clientes que quieren conectar

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var bleno = require('bleno');

const SERVICE_UUID = '9d8a89cc-7b88-4190-b446-1be7eb41ff8a';
const CHARACTERISTIC_METADATA_UUID = '837b12ea-21ba-4562-a0a7-ed0d9febae23';
const CHARACTERISTIC_TRANSFER_UUID = '0fc6744e-0e84-41b7-b198-2a36dfd7b248';

/**
 * FlyWeb GATT Service
 * 
 * Events:
 * 'advertising' -> The Service is being advertised.
 * 'transfer', callback, ok, bad -> Called when a client wants to initiate a RFCOMM communication.
 *                                  We need to call callback with ok or bad to notify de client 
 *                                  that the process went good or not.
 * 'error', mesg -> Somethig wrong happened, msg has the details.
 *
 */
function FlyWebGattService(){
	if(!(this instanceof FlyWebGattService))
		return new FlyWebGattService();

	this._lazyInitialized = false;
	this._primaryService = null;
	this._initPromise = null;
	this._outsideResolve = null;
	this._outsideReject = null;
	this._name = 'FlyWeb.js';
}

util.inherits(FlyWebGattService, EventEmitter);

FlyWebGattService.prototype._init = function(fwOptions){
	try{

		bleno.on('stateChange', this._blenoStateChangeHandler(this));
		bleno.on('advertisingStart', this._blenoAdvertisingStartHandler(this));
		bleno.on('accept', this._blenoAcceptHandler(this));
		bleno.on('disconnect', this._blenoDisconnectHandler(this));
		bleno.on('servicesSet', this._blenoServicesSetHandler(this));

		var self = this;

		var metadataValue = Buffer.from(this._name + ':' + fwOptions.uiUri);
		var metadataCharacteristic = new bleno.Characteristic({
		    uuid: CHARACTERISTIC_METADATA_UUID, // or 'fff1' for 16-bit
		    properties: [ 'read' ], // can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
		    //secure: [ ], // enable security for properties, can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
		    value: metadataValue, // optional static value, must be of type Buffer - for read only characteristics
		    //descriptors: [
		        // see Descriptor for data type
		    //],
		    onReadRequest: self._readMetadataHandler(self), // optional read request handler, function(offset, callback) { ... }
		    onWriteRequest: null, // optional write request handler, function(data, offset, withoutResponse, callback) { ...}
		    onSubscribe: null, // optional notify/indicate subscribe handler, function(maxValueSize, updateValueCallback) { ...}
		    onUnsubscribe: null, // optional notify/indicate unsubscribe handler, function() { ...}
		    onNotify: null, // optional notify sent handler, function() { ...}
		    onIndicate: null, // optional indicate confirmation received handler, function() { ...}
		});

		var transferCharacteristic = new bleno.Characteristic({
			uuid: CHARACTERISTIC_TRANSFER_UUID, // or 'fff1' for 16-bit
		    properties: [ 'write' ], // can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
		    //secure: [ ], // enable security for properties, can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
		    //value: metadataValue, // optional static value, must be of type Buffer - for read only characteristics
		    //descriptors: [
		        // see Descriptor for data type
		    //],
		    onReadRequest: null, // optional read request handler, function(offset, callback) { ... }
		    onWriteRequest: self._writeTransferHandler(self), // optional write request handler, function(data, offset, withoutResponse, callback) { ...}
		    onSubscribe: null, // optional notify/indicate subscribe handler, function(maxValueSize, updateValueCallback) { ...}
		    onUnsubscribe: null, // optional notify/indicate unsubscribe handler, function() { ...}
		    onNotify: null, // optional notify sent handler, function() { ...}
		    onIndicate: null, // optional indicate confirmation received handler, function() { ...}
		});

		this._primaryService = new bleno.PrimaryService({
		    uuid: SERVICE_UUID, // or 'xxxx' for 16-bit
		    characteristics: [
		    	metadataCharacteristic,
		    	transferCharacteristic,
		        // see Characteristic for data type
		    ]
		});
	}catch(error){
		return Promise.reject(error);
	}

	this._lazyInitialized = true;
	return Promise.resolve();
}


FlyWebGattService.prototype._writeTransferHandler = function(self){
	return function(data, offset, withoutResponse, callback){
		//TODO:
		self.emit('transfer', callback, bleno.Characteristic.RESULT_SUCCESS, bleno.Characteristic.RESULT_UNLIKELY_ERROR);
		//callback(bleno.Characteristic.RESULT_UNLIKELY_ERROR); 
	}
}

FlyWebGattService.prototype._readMetadataHandler = function(self){
	return function(offset, callback){
		// TODO: The only usefull metadata for BT about the FlyWeb service, is the name (so far)
		callback(bleno.Characteristic.RESULT_SUCCESS, self._name);
	}
}

FlyWebGattService.prototype._blenoStateChangeHandler = function(self){
	return function(state){
		if(state === 'poweredOn'){
			console.log("bleno: stateChanged -> poweredOn!");
			self._initPromise.then(() => {
				console.log('Bluetooth is advertising the service');
				bleno.setServices(self._primaryService);
			}).catch(error => {
				self._outsideReject(error);
			});
		}else{
			console.log("bleno: stateChanged -> poweredOff!");
			self.stopAdvertising();
		}
	}
}


FlyWebGattService.prototype._blenoAdvertisingStartHandler = function (self){
	return function(error){	
		console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
		if(error){
			self._outsideReject('FlyWebGattService: Cannot start advertising!!: error: ' + error);
			return;
		}
		self._outsideResolve();	
	}
}


FlyWebGattService.prototype._blenoServicesSetHandler = function(self){
	return function(error){
		console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
		if(error){
			self._outsideReject('FlyWebGattService: Cannot set services!!: error: ' + error);
			return;
		}
		bleno.startAdvertising(self._name, [SERVICE_UUID]);	
  	}
}

FlyWebGattService.prototype.startAdvertising = function(name, fwOptions){
	if(!name)
		return Promise.reject('Invalid arguments. Name of the service needed');

	if(!fwOptions.uiUri)
		return Promise.reject('Invalid arguments. Second argument must have a .uiUri property pointing to the User Interface for the client');

	console.log('Bluetooth is about to advertise the service');
	this._name = name;
	var self = this;
	return new Promise(function(resolve, reject){
		self._initPromise = Promise.resolve();
		if(self._lazyInitialized == false){
			self._initPromise = self._init(fwOptions);
		}

		self._outsideResolve = resolve;
		self._outsideReject = reject;
	});
}


FlyWebGattService.prototype.stopAdvertising = function(){
	bleno.stopAdvertising();
}

FlyWebGattService.prototype._blenoAcceptHandler = function(self){
	return function (clientAddress){
		self.emit("connection", clientAddress);
	}
}

FlyWebGattService.prototype._blenoDisconnectHandler = function(self){
	return function (){
		self.emit("disconnect");
	}
}



module.exports = FlyWebGattService;