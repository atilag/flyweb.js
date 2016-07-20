// FlyWeb Bluetooth Service
// Por ahoa solo vamos a exponer estos atributos:
// * Nombre del servicio 
// * Path (www.loquesea.com/el/path/a/la/web.html), que es el landing page de los clientes que quieren conectar



var EventEmitter = require('events').EventEmitter;
var util = require('util');
var bleno = require('bleno');
var FwPublishOptions = require('./flywebpublishoptions');

require('util').inherits(FlyWebGattService, EventEmitter);


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

	//TODO: EXplain
	this.setMaxListeners(1);
	
	const SERVICE_UUID = '9d8a89cc-7b88-4190-b446-1be7eb41ff8a';
	const CHARACTERISTIC_METADATA_UUID = '837b12ea-21ba-4562-a0a7-ed0d9febae23';
	const CHARACTERISTIC_TRANSFER_UUID = '0fc6744e-0e84-41b7-b198-2a36dfd7b248';
	this._lazyInitialized = false;
	this._primaryService = null;
	this._canAdvertise = false;

}

FlyWebGattService.prototype._init = function(name, fwOptions){

	bleno.on('stateChange', this._blenoStateChangeHandler);
	bleno.on('advertisingStart', this._blenoAdvertisingStartHandler);

	let metadataValue = new Buffer(name + fwOptions.uiUri);
	let metadataCharacteristic = new bleno.Characteristic({
	    uuid: CHARACTERISTIC_METADATA_UUID, // or 'fff1' for 16-bit
	    properties: [ read ], // can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
	    //secure: [ ], // enable security for properties, can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
	    value: metadataValue, // optional static value, must be of type Buffer - for read only characteristics
	    //descriptors: [
	        // see Descriptor for data type
	    //],
	    onReadRequest: this._readMetadataHandler, // optional read request handler, function(offset, callback) { ... }
	    onWriteRequest: null, // optional write request handler, function(data, offset, withoutResponse, callback) { ...}
	    onSubscribe: null, // optional notify/indicate subscribe handler, function(maxValueSize, updateValueCallback) { ...}
	    onUnsubscribe: null, // optional notify/indicate unsubscribe handler, function() { ...}
	    onNotify: null // optional notify sent handler, function() { ...}
	    onIndicate: null // optional indicate confirmation received handler, function() { ...}
	});

	let transferCharacteristic = new bleno.Characteristic({
		uuid: CHARACTERISTIC_TRANSFER_UUID, // or 'fff1' for 16-bit
	    properties: [ write ], // can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
	    //secure: [ ], // enable security for properties, can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
	    //value: metadataValue, // optional static value, must be of type Buffer - for read only characteristics
	    //descriptors: [
	        // see Descriptor for data type
	    //],
	    onReadRequest: null, // optional read request handler, function(offset, callback) { ... }
	    onWriteRequest: this._writeTransferHandler, // optional write request handler, function(data, offset, withoutResponse, callback) { ...}
	    onSubscribe: null, // optional notify/indicate subscribe handler, function(maxValueSize, updateValueCallback) { ...}
	    onUnsubscribe: null, // optional notify/indicate unsubscribe handler, function() { ...}
	    onNotify: null // optional notify sent handler, function() { ...}
	    onIndicate: null // optional indicate confirmation received handler, function() { ...}
	});

	this._primaryService = new bleno.PrimaryService({
	    uuid: SERVICE_UUID, // or 'fff0' for 16-bit
	    characteristics: [
	    	metadataCharacteristic,
	    	transferCharacteristic,
	        // see Characteristic for data type
	    ]
	});

	this._lazyInitialized = true;
	return Promise.resolve();

}


FlyWebGattService.prototype._writeTransferHandler = function(data, offset, withoutResponse, callback){	
	//TODO:
	this.emit('transfer', callback, bleno.Characteristic.RESULT_SUCCESS, bleno.Characteristic.RESULT_UNLIKELY_ERROR)
	//callback(bleno.Characteristic.RESULT_UNLIKELY_ERROR); 
}

FlyWebGattService.prototype._readMetadataHanlder = function(offset, callback){
	// TODO: The only usefull metadata for BT about the FlyWeb service, is the name (so far)
	callback(bleno.Characteristic.RESULT_SUCCESS, name);

}

FlyWebGattService.prototype._blenoStateChangeHandler = function(state){
	if (state === 'poweredOn'){
		console.log("bleno: stateChanged -> poweredOn!");
		this._canAdvertise = true;
	}else{
		console.log("bleno: stateChanged -> poweredOff!");
		this._canAdvertise = false;
		this.stopAdvertising();
	}
}


FlyWebGattService.prototype._blenoAdvertisingStartHandler = function (error){
	console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
	if (!error) {
		bleno.setServices([this._primaryService], function(error){
	  		console.log('setServices: '  + (error ? 'error ' + error : 'success'));
	  		if(!error){
	  			this.emit('advertising');
	  		}else{
	  			this.emit('error', 'FlyWebGattService: setServices() error!');
	  		}
		});
	}else{
		this.emit('error', 'FlyWebGattService: Cannot start advertising!!');
	}
}

FlyWebGattService.prototype.startAdvertising = function(name, fwOptions){
	if(!name)
		return Promise.reject('Invalid arguments. Cannot initialize without the name of the service');
	if(this._canAdvertise == false)
		return Promise.reject('Bluetooth interface is not ready!');
	
	var init = Promise.resolve();
	if(!this._lazyInitialized){
		init = this._init(name, fwOptions);
	}

	return init.then(() => {
		bleno.startAdvertising(name, SERVICE_UUID);
		return Promise.resolve();
	});
}

FlyWebGattService.prototype.stopAdvertising = function(){
	bleno.stopAdvertising();
}


module.exports = FlyWebGattService;