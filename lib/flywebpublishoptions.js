const ETHERNET = 1;
const BLUETOOTH = 2
const NFC = 3

function FlyWebPublishOptions() {
	if(!(this instanceof FlyWebPublishOptions))
		return new FlyWebPublishOptions();
	
	this.uiUrl = null;
	this.transport = BLUETOOTH;
}

module.exports = FlyWebPublishOptions;
