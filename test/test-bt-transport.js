"use strict";

// Test

var assert = require('chai').assert;
var FlyWeb = require('../lib/flyweb');
var FlyWebPublishOptions = require('../lib/flywebpublishoptions');
//var noble = require('noble'); TODO <--- ESTO ESTABA ENTRANDO EN CONFLICTO CON BLENO!!!!! Unknown peripheral 2345234523452 connected! :(

var fw = FlyWeb();

fw.on('websocket', function(event){
	console.log('test.js: webscoket!');
	event.accept().then( ws => {
		ws.on('message', data => {
			console.log('test.js: Date received via websocket: ' + data);
			try{ 
				console.log("test.js: Sending back data to the client");
				ws.send(data);
			}catch(ex){
				console.log(ex.stack);
				console.log(ex);
			}
		});
	});
});

var fwOptions = FlyWebPublishOptions();
fwOptions.uiUri = 'index.html';
fwOptions.transport = FlyWebPublishOptions.BLUETOOTH;

fw.publishServer('FlyWebTestBT', fwOptions).then(server => {
	console.log("Server published");
}).catch(ex => {
	console.log(ex.stack);
	console.log(ex.fileName);
	console.log(ex.fileNumber);
	console.log(ex);
});
