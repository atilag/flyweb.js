// Test with a raw HTTP server implementation (no expressjs or whatever fancy wrapper)

var assert = require('chai').assert;
var FlyWeb = require('../lib/flyweb.raw');
var FlyWebPublishOptions = require('../lib/flywebpublishoptions');

var fw = FlyWeb();

fw.on('fetch', function(event){
	console.log('test.js: fetch!!');
	if(event.request.url == '/'){
		fw.fetch('client/index.html').then((responseBody) => {
			return event.respondWith(responseBody);
		}).then( () => {
			console.log('Response sent!!!');
		}).catch( ex => {
			console.error(ex);
		});
	}


});

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

//var fwOptions = FlyWebPublishOptions();
//fwOptions.uiUri = 'test.html';
//fw.publishServer('TestJuan', fwOptions)
fw.publishServer('TestJuan').then(server => {
	console.log("Server published");
}).catch(ex => {
	console.error(ex);
});
