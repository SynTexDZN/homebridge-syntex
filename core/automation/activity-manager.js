const AutomationSystem = require('./automation-system'), RouteManager = require('./route-manager'), TypeManager = require('./type-manager');

module.exports = class ActivityManager
{
	constructor(platform)
	{
		this.data = {};
		this.history = {};

		this.logger = platform.logger;

		this.EventManager = platform.EventManager;
		this.RequestManager = platform.RequestManager;

		this.TypeManager = new TypeManager(platform);
		this.RouteManager = new RouteManager(platform);
		this.AutomationSystem = new AutomationSystem(platform, this);
		this.HistoryManager = new HistoryManager(platform, this);

		this.initSocket();
	}

	initSocket()
	{
		this.EventManager.setInputStream('stateUpdate', { source : this, external : true, verbose : false }, (message) => {

			if(message.service != null && message.state != null)
			{
				this.updateState(message.service.id, message.service.letters, message.state, message.type);
			}
		});

		this.EventManager.setInputStream('runAutomation', { source : this, external : true, verbose : false }, (message) => {

			if(message.service != null && message.state != null)
			{
				this.AutomationSystem.checkAutomation(message.service, message.state);
			}
		});
	}

	updateState(id, letters, state, type)
	{
		this._prepareStructure(id, letters);

		if(this._hasStateChanged(id, letters, state))
		{
			for(const x in state)
			{
				this.data[id][letters][x] = state[x];
			}

			if(type == 'WRITE')
			{
				this.HistoryManager.updateCycle(id, letters, this.data[id][letters]);
			}
		}
	}

	updateAutomation(id, letters, automation)
	{
		/*
		this._prepareStructure(id, letters);

		this.data[id][letters].automation.push({ time : new Date().getTime(), id : automation.id });
		*/
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

							resolve(response.data);
						}
						else
						{
							this.logger.log('error', block.id, block.letters, '%read_state[0]% [' + block.name + '] %read_error%! (' + block.id + ':' + block.letters + ')');
						
							resolve(null);
						}
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
		if(this.data[id] != null && this.data[id][letters] != null)
		{
			return this.data[id][letters];
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
	}

	_hasStateChanged(id, letters, state)
	{
		for(const x in state)
		{
			if(this.data[id][letters][x] != state[x])
			{
				return true;
			}
		}

		return false;
	}
}

class HistoryManager
{
	constructor(platform, StateManager)
	{
		this.changed = false;

		this.files = platform.files;

		this.data = StateManager.history;

		this.loadData().then(() => {

			setInterval(() => {

				if(this.changed)
				{
					this.files.writeFile('cache/history.json', this.data);

					this.changed = false;
				}

			}, 10000);
		});
	}

	loadData()
	{
		return new Promise((resolve) => {

			this.files.readFile('cache/history.json').then((data) => {

				for(const x in data)
				{
					for(const y in data[x])
					{
						this._prepareStructure(x, y);
						
						if(data[x][y].time != null)
						{
							this.data[x][y].time = data[x][y].time;
						}

						if(data[x][y].history != null)
						{
							this.data[x][y].history = data[x][y].history;
						}
					}
				}

				resolve();
			});
		});
	}

	updateCycle(id, letters, state)
	{
		this._prepareStructure(id, letters);
		
		var time = this.getCurrentCycle(), latestCycle = this.getCycle(id, letters, time);

		this.data[id][letters].time = new Date().getTime();

		if(latestCycle == null)
		{
			latestCycle = { time, state : {}};

			this.data[id][letters].history.push(latestCycle);
		}

		for(const x in state)
		{
			if(latestCycle.state[x] == null)
			{
				latestCycle.state[x] = {};
			}

			latestCycle.state[x].latest = state[x];

			if(latestCycle.state[x].min == null || latestCycle.state[x].min < state[x])
			{
				latestCycle.state[x].min = state[x];
			}

			if(latestCycle.state[x].max == null || latestCycle.state[x].max > state[x])
			{
				latestCycle.state[x].max = state[x];
			}
		}

		this.changed = true;
	}

	getCurrentCycle()
	{
		var date = new Date(new Date().getTime());

		date.setSeconds(0);
		date.setMilliseconds(0);

		return date.getTime();
	}

	getCycle(id, letters, time)
	{
		for(const entry of this.data[id][letters].history)
		{
			if(entry.time == time)
			{
				return entry;
			}
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
			this.data[id][letters] = { history : [] };
		}
	}
}