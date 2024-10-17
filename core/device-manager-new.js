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
		this.WebServer = platform.WebServer;

		this.loadAccessories();

		this.initWebServer();
	}

	loadAccessories()
	{
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

		readConfig().then((data) => {

			this.data = data;
		});
	}

	initWebServer()
	{
		this.WebServer.addPage('/serverside/device-manager-new', async (request, response) => {

			response.end(JSON.stringify(this.data));
		});
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