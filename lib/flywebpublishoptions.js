function FlyWebPublishOptions() {
	if(!(this instanceof FlyWebPublishOptions))
		return new FlyWebPublishOptions();
	
	this.uiUrl = null;
}

module.exports = FlyWebPublishOptions;
