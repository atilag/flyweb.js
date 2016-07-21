// Test

var assert = require('chai').assert;
var FlyWeb = require('../lib/flyweb');
var FlyWebPublishOptions = require('../lib/flywebpublishoptions');

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
				console.log(ex);
			}
		});
	});
});

var fwOptions = FlyWebPublishOptions();
fwOptions.uiUri = 'index.html';
fwOptions.transport = FlyWebPublishOptions.ETHERNET;
fw.publishServer('FlyWebTestETH', fwOptions).then(server => {
	console.log("Server published");
}).catch(ex => {
	console.error(ex);
});
