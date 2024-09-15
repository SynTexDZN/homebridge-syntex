const AutomationSystem = require('./automation-system'), RouteManager = require('./route-manager');

module.exports = class ActivityManager
{
	constructor(platform)
	{
		this.EventManager = platform.EventManager;

		this.AutomationSystem = new AutomationSystem(platform, this);
		this.RouteManager = new RouteManager(platform);

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
}