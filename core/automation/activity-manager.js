const AutomationSystem = require('./automation-system'), RouteManager = require('./route-manager'), TypeManager = require('./type-manager');;

module.exports = class ActivityManager
{
	constructor(platform)
	{
		this.EventManager = platform.EventManager;
		this.RequestManager = platform.RequestManager;

		this.TypeManager = new TypeManager(platform);
		this.RouteManager = new RouteManager(platform);
		this.AutomationSystem = new AutomationSystem(platform, this);

		this.initSocket();
	}

	initSocket()
	{
		this.EventManager.setInputStream('runAutomation', { source : this, external : true }, (message) => {

			if(message.service != null && message.state != null)
			{
				this.AutomationSystem.runAutomation(message.service, message.state);
			}
		});
	}

	updateAutomation(id, letters, automation)
	{

	}

	_getState(id, letters, options)
	{
		return new Promise((resolve) => {

			if(id != null && letters != null && (options.port != null || options.plugin != null))
			{
				var url = 'http://' + (options.bridge || '127.0.0.1') + ':' + (options.port || this.RouteManager.getPort(options.plugin)) + '/devices?id=' + id + '&type=' + this.TypeManager.letterToType(letters[0]) + '&counter=' + letters.slice(1);

				this.RequestManager.fetch(url, { timeout : 10000 }).then((response) => {

					resolve(response.data);
				});
			}
			else
			{
				resolve(null);
			}
		});
	}
}