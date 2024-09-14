const AutomationSystem = require('./automation-system');

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

        this.AutomationSystem = new AutomationSystem(platform);

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
    }

    updateState(id, letters, name, state, type)
    {
        this._prepareStructure(id, letters);

        for(const x in state)
        {
            this.data[id][letters].state[x] = state[x];
        }

        if(type == 'WRITE')
        {
            this.data[id][letters].time = new Date().getTime();

            this.AutomationSystem.runAutomation({ id, letters, name }, this.data[id][letters].state);
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
            this.data[id][letters] = { state : {}, history : [], automation : [] };
        }
    }
}