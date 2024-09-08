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
                        for(const z in data[x][y])
                        {
                            if(this.data[x] == null)
                            {
                                this.data[x] = {};
                            }

                            if(this.data[x][y] == null)
                            {
                                this.data[x][y] = {};
                            }

                            if(this.data[x][y][z] == null)
                            {
                                this.data[x][y][z] = data[x][y][z];
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
				if(this.data[message.service.id] == null)
				{
					this.data[message.service.id] = {};
				}

				if(this.data[message.service.id][message.service.letters] == null)
				{
					this.data[message.service.id][message.service.letters] = {};
				}

				for(const x in message.state)
				{
                    if(this.data[message.service.id][message.service.letters][x] != message.state[x])
                    {
                        this.changed = true;
                    }

					this.data[message.service.id][message.service.letters][x] = message.state[x];
				}

				if(message.type == 'WRITE')
				{
					this.AutomationSystem.runAutomation(message.service, this.data[message.service.id][message.service.letters]);
				}
			}
		});
    }
}