const AutomationSystem = require('./automation-system'), RouteManager = require('./route-manager'), TypeManager = require('./type-manager'), SocketManager = require('./socket-manager');

module.exports = class ActivityManager
{
	constructor(platform)
	{
		this.data = {};
		this.history = {};
		this.virtual = {};

		this.logger = platform.logger;

		this.EventManager = platform.EventManager;
		this.RequestManager = platform.RequestManager;
		this.WebServer = platform.WebServer;

		this.TypeManager = new TypeManager(platform);
		this.RouteManager = new RouteManager(platform);
		this.AutomationSystem = new AutomationSystem(platform, this);
		this.HistoryManager = new HistoryManager(platform, this);
		this.VirtualManager = new VirtualManager(platform, this);
		this.SocketManager = new SocketManager(platform);

		this.initSocket();
	}

	initSocket()
	{
		this.EventManager.setInputStream('stateUpdate', { source : this, external : true, verbose : false }, (message) => {

			if(message.service != null && message.state != null)
			{
				this.updateState(message.service.id, message.service.letters, message.state, message.type);

				if(message.virtual && message.type == 'WRITE')
				{
					this.VirtualManager.setState(message.service.id, message.service.letters, message.state);
				}
			}
		});

		this.EventManager.setInputStream('runAutomation', { source : this, external : true, verbose : false }, (message) => {

			if(message.service != null && message.state != null)
			{
				this.AutomationSystem.checkAutomation(message.service, message.state);
			}
		});

		this.WebServer.addSocket('/devices', 'getActivity', (ws, params) => {

			var response = { state : {}, history : [], automation : [] };

			if(this.data[params.id] != null && this.data[params.id][params.letters] != null)
			{
				response.state = this.data[params.id][params.letters];
			}

			if(this.virtual[params.id] != null && this.virtual[params.id][params.letters] != null)
			{
				response.state = this.virtual[params.id][params.letters];
			}

			if(this.history[params.id] != null && this.history[params.id][params.letters] != null)
			{
				response.time = this.history[params.id][params.letters].time;
				response.history = this.history[params.id][params.letters].history;
			}

			this.SocketManager.addSocket(ws, params.id, params.letters);

			ws.send(JSON.stringify(response));
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

			this.SocketManager.updateSockets(id, letters, { state : this.data[id][letters] });
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
	constructor(platform, ActivityManager)
	{
		this.changed = false;

		this.files = platform.files;

		this.data = ActivityManager.history;

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

class VirtualManager
{
	constructor(platform, ActivityManager)
	{
		this.changed = false;

		this.data = ActivityManager.virtual;

		this.files = platform.files;

		this.loadData().then(() => {

			setInterval(() => {

				if(this.changed)
				{
					this.files.writeFile('cache/virtual.json', this.data);

					this.changed = false;
				}

			}, 10000);
		});
	}

	loadData()
	{
		return new Promise((resolve) => {

			this.files.readFile('cache/virtual.json').then((data) => {

				for(const id in data)
				{
					for(const letters in data[id])
					{
						this._prepareStructure(id, letters);

						for(const x in data[id][letters])
						{
							this.data[id][letters][x] = data[id][letters][x];
						}
					}
				}

				resolve();
			});
		});
	}

	setState(id, letters, state)
	{
		this._prepareStructure(id, letters);

		for(const x in state)
		{
			this.data[id][letters][x] = state[x];
		}

		this.changed = true;
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
}