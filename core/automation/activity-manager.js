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

	_getState(block)
	{
		return new Promise((resolve) => {

			if(block.id != null && block.letters != null)
			{
				var state = this.getState(block.id, block.letters);

				if(state != null && block.bridge == null)
				{
					resolve(state);
				}
				else if(block.port != null || block.plugin != null)
				{
					var url = 'http://' + (block.bridge || '127.0.0.1') + ':' + (block.port || this.RouteManager.getPort(block.plugin)) + '/devices?id=' + block.id + '&type=' + this.TypeManager.letterToType(block.letters[0]) + '&counter=' + block.letters.slice(1);

					this.RequestManager.fetch(url, { timeout : 10000 }).then((response) => {

						if(response.data instanceof Object)
						{
							this.updateState(block.id, block.letters, response.data);
						}
						else
						{
							this.logger.log('error', block.id, block.letters, '%read_state[0]% [' + block.id + ':' + block.letters + '] %read_error%!');
						}
					
						resolve(response.data);
					});
				}
				else
				{
					resolve(null);
				}
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