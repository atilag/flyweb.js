
function FlyWebFetchEvent(request, response){
	if(!(this instanceof FlyWebFetchEvent))
		return new FlyWebFetchEvent(request, response);

	this.request = request;
	this.response = response;
}

FlyWebFetchEvent.prototype._respondWith = function(responseBody){
	this.response.statusCode = 200;
	this.response.setHeader('Content-Type', 'application/json');

	var response = {
		headers: this.request.headers,
		method: this.request.method,
		url: this.request.url,
		body: responseBody
	};

	this.response.end(JSON.stringify(response));
	return Promise.resolve();
}

FlyWebFetchEvent.prototype.respondWith = function(responseBody){
	this.response.statusCode = 200;
	//TODO: So tricky... _headers :P
	this.response._headers = this.request.headers;
	this.response.end(responseBody);
	return Promise.resolve();
}

module.exports = FlyWebFetchEvent