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
	
							accessory.services = [];
	
							for(const j in response.data.accessories[i].services)
							{
								var service = {}, serviceLetters = response.data.accessories[i].services[j].type;

								var stateCharacteristics = {
									'A2' : { name : 'bridge', type : {} },
									'40' : { name : 'fan', type : { value : '25', speed : '29', direction : '28' } },
									'43' : { name : 'led', type : { value : '25', hue : '13', saturation : '2F', brightness : '8' } },
									'47' : { name : 'outlet', type : { value : '25' } },
									'49' : { name : 'switch', type : { value : '25' } },
									'4A' : { name : 'thermostat', type : { value : '11', target : '35', state : 'F', mode : '33' } },
									'80' : { name : 'contact', type : { value : '6A' } },
									'82' : { name : 'humidity', type : { value : '10' } },
									'83' : { name : 'rain', type : { value : '70' } },
									'84' : { name : 'light', type : { value : '6B' } },
									'85' : { name : 'motion', type : { value : '22' } },
									'86' : { name : 'occupancy', type : { value : '71' } },
									'87' : { name : 'smoke', type: { value : '76' } },
									'89' : { name : 'statelessswitch', type : { value : '73' } },
									'8A' : { name : 'temperature', type : { value : '11' } },
									'8C' : { name : 'blind', type: { value : '7C' } },
									'8D' : { name : 'airquality', type: { value : '95' } }
								};

								if(stateCharacteristics[serviceLetters] != null)
								{
									service.type = stateCharacteristics[serviceLetters].name;

									if(service.type == 'bridge')
									{
										isBridge = true;
									}
								}

								for(const k in response.data.accessories[i].services[j].characteristics)
								{
									var characteristic = response.data.accessories[i].services[j].characteristics[k], characteristicLetters = characteristic.type;

									var accessoryCharacteristics = {
										'30' : 'id',
										'23' : 'name',
										'52' : 'version',
										'20' : 'plugin'
									};

									var serviceCharacteristics = {
										'62' : 'online'
									};

									if(serviceLetters == '3E' && accessoryCharacteristics[characteristicLetters] != null)
									{
										accessory[accessoryCharacteristics[characteristicLetters]] = characteristic.value;
									}
									else if(serviceCharacteristics[characteristicLetters] != null)
									{
										service[serviceCharacteristics[characteristicLetters]] = characteristic.value;
									}
									else if(stateCharacteristics[serviceLetters] != null)
									{
										if(stateCharacteristics[serviceLetters].name == 'led')
										{
											if(characteristicLetters == '8')
											{
												service.type = 'dimmer';
											}
											
											if(characteristicLetters == '13' || characteristicLetters == '2F')
											{
												service.type = 'rgb';
											}
										}
										
										for(const l in stateCharacteristics[serviceLetters].type)
										{
											if(stateCharacteristics[serviceLetters].type[l] == characteristicLetters)
											{
												if(service.state == null)
												{
													service.state = {};
												}

												service.state[l] = characteristic.value;
											}
										}
									}
								}
	
								accessory.services.push(service);
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
									
									accessory.plugin = platform.platform;
		
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

		const addPluginData = () => {

			var plugins = this.PluginManager.getPlugins();

			for(const accessory of this.data)
			{
				if(accessory.plugin != null)
				{
					var found = false;

					for(const id in plugins)
					{
						var plugin = plugins[id];

						if(plugin.alias == accessory.plugin)
						{
							accessory.plugin = { id, name : plugin.name };

							if(plugin.config != null && plugin.config.options != null && plugin.config.options.port != null)
							{
								accessory.plugin.port = plugin.config.options.port;
							}

							found = true;
						}
					}

					if(!found)
					{
						accessory.plugin = { alias : accessory.plugin };
					}
				}
			}
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
							if(x == 'services')
							{
								for(const y in configAccessory.services)
								{
									for(const z in configAccessory.services[y])
									{
										bridgeAccessory.services[y][z] = configAccessory.services[y][z];
									}
								}
							}
							else
							{
								bridgeAccessory[x] = configAccessory[x];
							}
						}
					}
				}
			}

			this.data = bridgeAccessories;

			addPluginData();
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