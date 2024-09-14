const AutomationSystem = require('./automation-system'), SocketManager = require('./socket-manager');

module.exports = class StateManager
{
	constructor(platform)
	{
        this.data = {};

        this.changed = false;

        this.files = platform.files;
        this.logger = platform.logger;

        this.EventManager = platform.EventManager;
        this.WebServer = platform.WebServer;

        this.HistoryManager = new HistoryManager(this);

        this.AutomationSystem = new AutomationSystem(platform);
        this.SocketManager = new SocketManager(platform);

        this.initSocket();

        this.loadData().then(() => {

            setInterval(() => {

                if(this.changed)
                {
                    this.files.writeFile('cache/accessories.json', this.data);

                    this.changed = false;
                }

            }, 10000);
        });
    }

    loadData()
	{
		return new Promise((resolve) => {

			this.files.readFile('cache/accessories.json').then((data) => {

				for(const x in data)
                {
                    for(const y in data[x])
                    {
                        if(data[x][y].state != null)
                        {
                            for(const z in data[x][y].state)
                            {
                                if(this.data[x] == null)
                                {
                                    this.data[x] = {};
                                }
    
                                if(this.data[x][y] == null)
                                {
                                    this.data[x][y] = { state : {} };
                                }
    
                                if(this.data[x][y].state[z] == null)
                                {
                                    this.data[x][y].state[z] = data[x][y].state[z];
                                }
                            }  
                        }
                    }
                }

                resolve();
            });
        });
    }

    initSocket()
    {
		this.EventManager.setInputStream('stateUpdate', { source : this, external : true }, (message) => {

			if(message.service != null && message.state != null)
			{
				this.updateState(message.service.id, message.service.letters, message.service.name, message.state, message.type);
			}
		});

        this.WebServer.addSocket('/devices', 'getState', (ws, params) => {

            var response = { state : {}, history : [], automation : [] };

            if(this.data[params.id] != null && this.data[params.id][params.letters] != null)
            {
                response = this.data[params.id][params.letters];
            }

            this.SocketManager.addSocket(ws, params.id, params.letters);

            ws.send(JSON.stringify(response));
        });
    }

    updateState(id, letters, name, state, type)
    {
        this._prepareStructure(id, letters);

        if(this._hasStateChanged(id, letters, state))
        {
            for(const x in state)
            {
                this.data[id][letters].state[x] = state[x];
            }

            if(type == 'WRITE')
            {
                this.data[id][letters].time = new Date().getTime();

                this.HistoryManager.updateCycle(id, letters, this.data[id][letters].state);

                this.AutomationSystem.runAutomation({ id, letters, name }, this.data[id][letters].state);
            }

            this.SocketManager.updateSockets(id, letters, this.data[id][letters]);

            this.changed = true;
        }
    }

    _prepareStructure(id, letters)
    {
        if(this.data[id] == null)
        {
            this.data[id] = {};
        }

        if(this.data[id][letters] == null)
        {
            this.data[id][letters] = { state : {}, history : [], automation : [] };
        }
    }

    _hasStateChanged(id, letters, state)
    {
        for(const x in state)
        {
            if(this.data[id][letters].state[x] != state[x])
            {
                return true;
            }
        }

        return false;
    }
}

class HistoryManager
{
    constructor(StateManager)
    {
        this.data = StateManager.data;
    }

    updateCycle(id, letters, state)
    {
        var time = this.getCurrentCycle(), latestCycle = this.getCycle(id, letters, time);

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
}