"use strict";

function FlyWebWebSocketEvent(webSocket){
	if(!(this instanceof FlyWebWebSocketEvent))
		return new FlyWebWebSocketEvent( webSocket);
	this.webSocket = webSocket;
}

FlyWebWebSocketEvent.prototype.respondWith = function(responseObject){
	//TODO:
	return Promise.resolve();
}

FlyWebWebSocketEvent.prototype.accept = function(protocol){
	return Promise.resolve(this.webSocket);
}

module.exports = FlyWebWebSocketEvent