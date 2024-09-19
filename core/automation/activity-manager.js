const AutomationSystem = require('./automation-system'), RouteManager = require('./route-manager'), TypeManager = require('./type-manager');;

module.exports = class ActivityManager
{
	constructor(platform)
	{
		this.data = {};

		this.EventManager = platform.EventManager;
		this.RequestManager = platform.RequestManager;

		this.TypeManager = new TypeManager(platform);
		this.RouteManager = new RouteManager(platform);
		this.AutomationSystem = new AutomationSystem(platform, this);

		this.initSocket();
	}

	initSocket()
	{
		this.EventManager.setInputStream('stateUpdate', { source : this, external : true }, (message) => {

			if(message.service != null && message.state != null)
			{
				this.updateState(message.service.id, message.service.letters, message.state);
			}
		});

		this.EventManager.setInputStream('runAutomation', { source : this, external : true }, (message) => {

			if(message.service != null && message.state != null)
			{
				this.AutomationSystem.runAutomation(message.service, message.state);
			}
		});
	}

	updateState(id, letters, state)
	{
		this._prepareStructure(id, letters);

		for(const x in state)
		{
			this.data[id][letters].state[x] = state[x];
		}
	}

	updateAutomation(id, letters, automation)
	{
		this._prepareStructure(id, letters);

		this.data[id][letters].automation.push({ time : new Date().getTime(), id : automation.id });
	}

	_getState(id, letters, options)
	{
		return new Promise((resolve) => {

			var state = this.getState(id, letters);

			if(state != null && options.bridge == null)
			{
				resolve(state);
			}
			else if(options.port != null || options.plugin != null)
			{
				var url = 'http://' + (options.bridge || '127.0.0.1') + ':' + (options.port || this.RouteManager.getPort(options.plugin)) + '/devices?id=' + id + '&type=' + this.TypeManager.letterToType(letters[0]) + '&counter=' + letters.slice(1);

				this.RequestManager.fetch(url, { timeout : 10000 }).then((response) => {

					if(response.data instanceof Object)
					{
						this.updateState(id, letters, response.data);
					}
				
					resolve(response.data);
				});
			}
			else
			{
				resolve(null);
			}
		});
	}

	getState(id, letters)
	{
		if(this.data[id] != null && this.data[id][letters] != null && this.data[id][letters].state != null)
		{
			return this.data[id][letters].state;
		}

		return null;
	}

	_prepareStructure(id, letters)
	{
		if(this.data[id] == null)
		{
			this.data[id] = {};
		}

		if(this.data[id][letters] == null)
		{
			this.data[id][letters] = {};
		}

		if(this.data[id][letters].state == null)
		{
			this.data[id][letters].state = {};
		}

		if(this.data[id][letters].history == null)
		{
			this.data[id][letters].history = [];
		}

		if(this.data[id][letters].automation == null)
		{
			this.data[id][letters].automation = [];
		}
	}
}