var Gatt = require('../lib/flywebgattservice');

var flyWebGattService = Gatt();

flyWebGattService.startAdvertising('FlyWeb',  {uiUri: 'index.html'}).then( () => {
	console.log("Advertsing the service!!");

}).catch(error => {
	console.log(error.stack);
	console.log(error.fileName);
	console.log(error.lineNumber);
	console.log(error);
});

