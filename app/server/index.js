let Bridge = require("./bridge.js");

module.exports = class App
{
	constructor(platform)
	{
		this.bridge = new Bridge(platform);
	}
}