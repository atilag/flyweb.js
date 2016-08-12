"use strict";

const _DEFAULT_PORT=47114

function FlyWebPublishOptions() {
	if(!(this instanceof FlyWebPublishOptions))
		return new FlyWebPublishOptions();

	this.uiUrl = null;
	this.transport = FlyWebPublishOptions.BLUETOOTH;
	this.port = _DEFAULT_PORT;
}

FlyWebPublishOptions.ETHERNET = 1;
FlyWebPublishOptions.BLUETOOTH = 2;
FlyWebPublishOptions.NFC = 3;


module.exports = FlyWebPublishOptions;
