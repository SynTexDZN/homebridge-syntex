module.exports = class DeviceManager
{
	constructor(platform, PluginManager)
	{
		this.data = [];

		this.platform = platform;

		this.PluginManager = PluginManager;

		this.logger = platform.logger;
		this.files = platform.files;

		this.ActivityManager = platform.ActivityManager;
		this.RequestManager = platform.RequestManager;
		this.WebServer = platform.WebServer;

		this.loadAccessories();

		this.initWebServer();
	}

	loadAccessories()
	{
		const readBridge = () => {

			return new Promise((resolve) => {

				this.RequestManager.fetch('http://localhost:51826/accessories', { verbose : true }).then((response) => {

					var accessories = [];

					if(response.data instanceof Object && response.data.accessories != null)
					{
						for(const i in response.data.accessories)
						{
							var accessory = {}, isBridge = false;
	
							accessory.aid = response.data.accessories[i].aid;
	
							for(const j in response.data.accessories[i].services)
							{
								if(response.data.accessories[i].services[j].type == 'A2')
								{
									isBridge = true;
								}
								
								for(const k in response.data.accessories[i].services[j].characteristics)
								{
									if(response.data.accessories[i].services[j].type == '3E' && response.data.accessories[i].services[j].characteristics[k].type == '30')
									{
										accessory.id = response.data.accessories[i].services[j].characteristics[k].value;
									}
								}
							}
	
							if(!isBridge)
							{
								accessories.push(accessory);
							}
						}
					}

					resolve(accessories);
				});
			});
		};

		const readConfig = () => {

			return new Promise((resolve) => {

				this.files.readFile(this.platform.api.user.storagePath() + '/config.json').then((data) => {

					var accessories = [];

					if(data instanceof Object && data.platforms != null)
					{
						for(const platform of data.platforms)
						{
							if(platform.accessories != null)
							{
								for(const i in platform.accessories)
								{
									var accessory = {};
		
									accessory.id = platform.accessories[i].id;
									accessory.name = platform.accessories[i].name;
									
									accessory.services = [];
		
									for(const j in platform.accessories[i].services)
									{
										var service = {};
		
										service.name = platform.accessories[i].services[j].name;
										service.type = platform.accessories[i].services[j].type;
		
										accessory.services.push(service);
									}
		
									accessory.services = this.addLetters(accessory.services);

									for(const service of accessory.services)
									{
										this.ActivityManager._getState({ id : accessory.id, letters : service.letters }).then((state) => {
					
											service.state = state;
										});
									}
		
									accessory.plugin = { alias : platform.platform };
		
									accessory.config = JSON.parse(JSON.stringify(platform.accessories[i]));
		
									accessories.push(accessory);
								}
							}
						}
					}

					resolve(accessories);
				});
			});
		};

		readBridge().then((bridgeAccessories) => readConfig().then((configAccessories) => {
			
			for(const bridgeAccessory of bridgeAccessories)
			{
				for(const configAccessory of configAccessories)
				{
					if(bridgeAccessory.id == configAccessory.id)
					{
						for(const x in configAccessory)
						{
							bridgeAccessory[x] = configAccessory[x];
						}
					}
				}
			}

			this.data = bridgeAccessories;
		}));
	}

	initWebServer()
	{
		this.WebServer.addPage('/serverside/device-manager-new', async (request, response) => {

			response.end(JSON.stringify(this.data));
		});
	}

	getAccessories()
	{
		return this.data;
	}

	addLetters(services)
	{
		var typeCounter = {};

		for(const service of services)
		{
			if(typeCounter[service.type] != null)
			{
				typeCounter[service.type]++;
			}
			else
			{
				typeCounter[service.type] = 0;
			}

			if(service.type == 'relais')
			{
				service.orginalLetters = this.ActivityManager.TypeManager.typeToLetter(service.type) + typeCounter[service.type];

				if(typeCounter['outlet'] != null)
				{
					typeCounter['outlet']++;
				}
				else
				{
					typeCounter['outlet'] = 0;
				}

				service.letters = this.ActivityManager.TypeManager.typeToLetter('outlet') + typeCounter['outlet'];
			}
			else
			{
				service.letters = this.ActivityManager.TypeManager.typeToLetter(service.type) + typeCounter[service.type];
			}
		}

		return services;
	}
}