const axios = require('axios');

var accessories, configOBJ = null;

module.exports = class DeviceManager
{
	constructor(platform, PluginManager)
	{
		this.platform = platform;

		this.logger = platform.logger;
		this.files = platform.files;

		this.PluginManager = PluginManager;

		this.reloading = false;

		this.reloadConfig().then((success) => {

			if(success)
			{
				this.reloadAccessories();
			}
		});
	}

	setWebHooksPort(webHooksPort)
	{
		this.webHooksPort = webHooksPort;
	}

	initDevice(id, ip, name, version, events, services)
	{
		return new Promise(async (resolve) => {
			
			var device = await this.getDevice(id);

			name = name.replace(new RegExp('%', 'g'), ' ');

			if(device != null)
			{
				var needToSave = this.setConfigValues('SynTexWebHooks', id, { version, ip });

				if(needToSave)
				{
					this.saveAccessories();
				}

				var obj = {
					name : this.getConfigValue(id, 'name') || name,
					active : device['active'] || 1,
					interval : device['interval'] || 10000,
					led : device['led'] || 0,
					port : this.webHooksPort || 1710
				};

				resolve(['Success', JSON.stringify(obj)]);
			}
			else if(checkID(name))
			{
				if(configOBJ != null)
				{
					try
					{
						services = JSON.parse(services) || [];
						events = JSON.parse(events) || [];

						if(services.length > 0)
						{
							while(!checkID(id))
							{
								this.removeFromConfig(id);
							}

							addToConfig(id, ip, name, services, events.length);

							this.saveAccessories().then((success) => {

								if(success)
								{
									var device = {
										id: id,
										ip: ip,
										name: name,
										active: 1,
										interval: 10000,
										led: 1
									};

									this.files.writeFile('devices/' + id + '.json', device).then((response) => {

										if(response.success)
										{
											this.logger.log('success', id, name, '[' + name + '] %accessory_add%! ( ' + id + ' )');

											this.reloadAccessories();

											var obj = {
												name : name, 
												active : 1,
												interval : 10000,
												led : 1,
												port : this.webHooksPort
											};

											resolve(['Init', JSON.stringify(obj)]);
										}
										else
										{
											resolve(['Error', '']);
										}
									});
								}
								else
								{
									resolve(['Error', '']);
								}
							});
						}
						else
						{
							this.logger.log('error', 'bridge', 'Bridge', '%no_services%!');

							resolve(['Error', 'Keine Services!']);
						}
					}
					catch(e)
					{
						this.logger.log('error', 'bridge', 'Bridge', 'Services / Events %json_parse_error%! ( ' + services + ' )', e);
					}
				}
				else
				{
					this.logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');

					resolve(['Error', 'Fehler beim Lesen!']);
				}
			}
			else
			{
				resolve(['Error', 'Name ist bereits Vergeben!']);
			}
		});
	}

	initAccessory(id, name, services)
	{
		return new Promise((resolve) => {
			
			if(!checkID(id))
			{
				resolve(['Error', 'ID ist bereits Vergeben!']);          
			}
			else if(configOBJ != null)
			{
				addToConfig(id, null, name, services, 0);

				this.saveAccessories().then((success) => {

					if(success)
					{
						this.logger.log('success', id, name, '[' + name + '] %accessory_add%! ( ' + id + ' )');

						this.reloadAccessories();

						resolve(['Success', 'Success']);
					}
					else
					{
						resolve(['Error', 'Fehler beim Erstellen!']);
					}
				});
			}
			else
			{
				this.logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');

				resolve(['Error', 'Fehler beim Erstellen!']);
			}
		});
	}

	getDevice(id)
	{
		return new Promise(resolve => {
			
			this.files.readFile('devices/' + id + '.json').then((data) => resolve(data));
		});
	}

	getDevices()
	{
		return new Promise((resolve) => {
			
			this.files.readDirectory('devices').then((data) => resolve(data));
		});
	}

	getAccessory(id)
	{
		if(id != null)
		{
			for(var i = 0; i < accessories.length; i++)
			{
				if(accessories[i].id == id)
				{
					return accessories[i];
				}
			}
		}

		return null;
	}

	getService(id, iid)
	{
		if(id != null && iid != null)
		{
			var services = this.getServices(id);

			for(const i in services)
			{
				if(services[i].iid['value'] == iid)
				{
					return services[i];
				}
			}
		}

		return null;
	}

	getServices(id)
	{
		var services = [];

		if(id != null)
		{
			var accessory = this.getAccessory(id);

			if(accessory != null && accessory.services != null && Array.isArray(accessory.services))
			{
				for(const i in accessory.services)
				{
					if(accessory.services[i].iid != null && accessory.services[i].iid instanceof Object)
					{
						services.push(accessory.services[i]);
					}
				}
			}
		}

		return services;
	}

	getAccessories()
	{
		return accessories;
	}

	setValue(id, param, value)
	{
		return new Promise(resolve => {

			this.files.readFile('devices/' + id + '.json').then((data) => {

				if(data != null)
				{
					data[param] = value;

					this.files.writeFile('devices/' + id + '.json', data).then((response) => {

						if(response.success)
						{
							this.reloadAccessories();
						}

						resolve(response.success);
					});
				}
				else
				{
					resolve(false);
				}
			});
		});
	}

	setValues(values)
	{
		return new Promise(async (resolve) => {

			if(values.id != null && values.plugin != null)
			{
				var needToSave = false;

				if(values.name != null && values.plugin.startsWith('SynTex'))
				{
					needToSave = this.setConfigValue(values.plugin, values.id, 'name', values.name);
				}

				if(needToSave)
				{
					await this.saveAccessories();
				}

				this.files.readFile('devices/' + values.id + '.json').then((data) => {

					if(data != null)
					{
						for(const i in values)
						{
							if(i != 'id' && i != 'plugin' && (i != 'name' || !values.plugin.startsWith('SynTex')))
							{
								data[i] = values[i];
							}
						}    
					}
					else
					{
						data = { id : values.id };
						
						for(const i in values)
						{
							if(i != 'id' && i != 'plugin' && (i != 'name' || !values.plugin.startsWith('SynTex')))
							{
								data[i] = values[i];
							}
						}
					}

					this.files.writeFile('devices/' + values.id + '.json', data).then((response) => {

						this.reloadAccessories();

						resolve(response.success);
					});
				});
			}
		});
	}

	setConfigValue(plugin, id, key, value)
	{
		var needToSave = false;

		if(plugin == 'SynTex')
		{
			plugin = 'SynTexWebHooks';
		}

		if(configOBJ != null && configOBJ.platforms != null)
		{
			for(const i in configOBJ.platforms)
			{
				if(configOBJ.platforms[i].platform == plugin && configOBJ.platforms[i].accessories != null)
				{
					for(var j = 0; j < configOBJ.platforms[i].accessories.length; j++)
					{
						if(configOBJ.platforms[i].accessories[j].id == id && value != configOBJ.platforms[i].accessories[j][key])
						{
							configOBJ.platforms[i].accessories[j][key] = value;

							needToSave = true;
						}	
					}
				}
			}
		}
		else
		{
			this.logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');
		}

		return needToSave;
	}

	setConfigValues(plugin, id, values)
	{
		var needToSave = false;

		for(const key in values)
		{
			if(this.setConfigValue(plugin, id, key, values[key]))
			{
				needToSave = true;
			}
		}

		return needToSave;
	}

	getConfigValue(id, key)
	{
		if(configOBJ != null && configOBJ.platforms != null)
		{
			for(const i in configOBJ.platforms)
			{
				if(configOBJ.platforms[i].platform === 'SynTexWebHooks' && configOBJ.platforms[i].accessories != null)
				{
					for(var j = 0; j < configOBJ.platforms[i].accessories.length; j++)
					{
						if(configOBJ.platforms[i].accessories[j].id == id && configOBJ.platforms[i].accessories[j][key] != null)
						{
							return configOBJ.platforms[i].accessories[j][key];
						}	
					}
				}
			}
		}
		else
		{
			this.logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');
		}

		return null;
	}

	getBridgePort()
	{
		if(configOBJ != null && configOBJ.bridge != null && configOBJ.bridge.port != null)
		{
			return configOBJ.bridge.port;
		}
		else
		{
			return null;
		}
	}

	reloadAccessories()
	{
		return new Promise(async (resolve) => {

			if(!this.reloading)
			{
				this.reloading = true;

				accessories = [];

				var bridgeAccessories = await this.getBridgeAccessories();

				if(bridgeAccessories != null)
				{
					accessories.push.apply(accessories, bridgeAccessories);
				}

				var storageAccessories = await this.getDevices();

				if(storageAccessories != null)
				{
					if(accessories.length > 0)
					{
						for(const i in accessories)
						{
							for(const j in storageAccessories)
							{
								if(storageAccessories[j].id == accessories[i].id)
								{
									for(const x in storageAccessories[j])
									{
										if(x != 'id' && x != 'version' && x != 'ip' && (x != 'name' || !accessories[i].plugin.alias.startsWith('SynTex')))
										{
											accessories[i][x] = storageAccessories[j][x];
										}
									}
								}
							}
						}
					}
					else
					{
						accessories.push.apply(accessories, storageAccessories);
					}
				}

				if(configOBJ != null && configOBJ.platforms != null)
				{
					for(const i in configOBJ.platforms)
					{
						if(configOBJ.platforms[i].platform != null && configOBJ.platforms[i].accessories != null && configOBJ.platforms[i].platform.startsWith('SynTex'))
						{
							for(const j in configOBJ.platforms[i].accessories)
							{
								for(const k in accessories)
								{
									if(accessories[k].id == configOBJ.platforms[i].accessories[j].id)
									{
										for(const x in configOBJ.platforms[i].accessories[j])
										{
											if(x != 'id' && x != 'plugin' && x != 'services')
											{
												accessories[k][x] = configOBJ.platforms[i].accessories[j][x];
											}
											else if(x == 'plugin')
											{
												accessories[k].plugin = { alias : configOBJ.platforms[i].accessories[j][x] };
											}
										}

										accessories[k].services = convertServices(accessories[k].services, configOBJ.platforms[i].accessories[j].services);
									}
								}
							}
						}
					}
				}

				// OPTIMIZE: Check if Accessory is Deleted

				var plugins = this.PluginManager.getPlugins();

				for(const i in accessories)
				{
					if(accessories[i].plugin != null)
					{
						for(const id in plugins)
						{
							if(plugins[id].alias == accessories[i].plugin.alias)
							{
								accessories[i].plugin.id = id;
								accessories[i].plugin.name = plugins[id].name;

								if(plugins[id].config != null)
								{
									accessories[i].plugin.port = plugins[id].config.port;
								}
							}
						}

						if(accessories[i].plugin.alias == 'SynTexWebHooks' && accessories[i].ip != null)
						{
							accessories[i].plugin.alias = 'SynTex';
						}

						if(accessories[i].plugin.alias == 'SynTexMagicHome')
						{
							if(accessories[i].type == 'light')
							{
								accessories[i].spectrum = 'HSL'; 
							}
						}

						if(accessories[i].plugin.alias == 'SynTexWebHooks' || accessories[i].plugin.alias == 'SynTexMagicHome' || accessories[i].plugin.alias == 'SynTexTuya' || accessories[i].plugin.alias == 'SynTexKNX')
						{
							accessories[i].version = '0.0.0';
						}
					}
				}

				this.reloading = false;

				resolve();
			}
			else
			{
				resolve();
			}
		});
	}

	saveAccessories()
	{
		return new Promise(resolve => {

			this.files.writeFile(this.platform.api.user.storagePath() + '/config.json', configOBJ).then((response) => {

				if(response.success)
				{
					this.reloadAccessories();
				}

				resolve(response.success);
			});
		});
	}

	removeFromConfig(id)
	{
		for(const i in configOBJ.platforms)
		{
			if(configOBJ.platforms[i].platform === 'SynTexWebHooks')
			{
				for(const j in configOBJ.platforms[i].accessories)
				{
					if(configOBJ.platforms[i].accessories[j].id == id)
					{
						configOBJ.platforms[i].accessories.splice(j, 1);
					}
				}
			}
		}
	}

	removeFromSettingsStorage(id)
	{
		return new Promise(resolve => {

			this.files.deleteFile('devices/' + id + '.json').then((success) => {

				if(!success)
				{
					this.logger.log('error', 'bridge', 'Bridge', '%accessory_remove_settings_error%!');
				}

				this.reloadConfig().then((success) => {

					if(success)
					{
						this.reloadAccessories();
					}
				});

				resolve(success);
			});
		});
	}

	getBridgeAccessories()
	{
		return new Promise((resolve) => {

			var characteristics = {
				'A2' : { name : 'bridge', type : {} },
				'43' : { name : 'led', type : { value : '25', hue : '13', saturation : '2F', brightness : '8' } },
				'47' : { name : 'outlet', type : { value : '25' } },
				'49' : { name : 'switch', type : { value : '25' } },
				'80' : { name : 'contact', type : { value : '6A' } },
				'82' : { name : 'humidity', type : { value : '10' } },
				'83' : { name : 'rain', type : { value : '70' } },
				'84' : { name : 'light', type : { value : '6B' } },
				'85' : { name : 'motion', type : { value : '22' } },
				'86' : { name : 'occupancy', type : { value : '71' } },
				'89' : { name : 'statelessswitch', type : { value : '73' } },
				'8A' : { name : 'temperature', type : { value : '11' } },
				'8D' : { name : 'airquality', type: { value : '95' } },
				'87' : { name : 'smoke', type: { value : '76' } }/*,
				'7E' : { name : 'security', type: { value : '' } },
				'41' : { name : 'garagedoor', type: { value : '' } },
				'45' : { name : 'lock', type: { value : '' } }*/
			};

			var accessoryCharacteristics = {
				'30' : 'id',
				'23' : 'name',
				'52' : 'version',
				'20' : 'plugin'
			};

			axios.get('http://localhost:' + (this.getBridgePort() || '51826') + '/accessories').then((response) => {

				var accessoryArray = [];
				var accessoryJSON = response.data.accessories;

				for(const i in accessoryJSON)
				{
					accessoryArray[i] = { aid : accessoryJSON[i].aid, services : [] };

					for(const j in accessoryJSON[i].services)
					{
						var type, service = { iid : {}, format : {} };

						if(characteristics[accessoryJSON[i].services[j].type] != null)
						{
							type = characteristics[accessoryJSON[i].services[j].type].name;
						}

						for(const k in accessoryJSON[i].services[j].characteristics)
						{
							var characteristic = accessoryJSON[i].services[j].characteristics[k];
							var letters = characteristic.type;

							if(accessoryJSON[i].services[j].type == '3E' && accessoryCharacteristics[letters] != null)
							{
								if(accessoryCharacteristics[letters] == 'plugin')
								{
									accessoryArray[i].plugin = { alias : characteristic.value };
								}
								else
								{
									accessoryArray[i][accessoryCharacteristics[letters]] = characteristic.value;
								}
							}
							else if(characteristics[accessoryJSON[i].services[j].type] != null)
							{
								if(characteristics[accessoryJSON[i].services[j].type].name == 'led')
								{
									if(letters == '13' || letters == '2F')
									{
										type = 'rgb';
									}
									else if(letters == '8' && type != 'rgb')
									{
										type = 'dimmer';
									}
								}

								for(const l in characteristics[accessoryJSON[i].services[j].type].type)
								{
									if(characteristics[accessoryJSON[i].services[j].type].type[l] == letters)
									{
										service.iid[l] = characteristic.iid;
										service.format[l] = characteristic.format;

										if(characteristic.minValue == 0 && characteristic.maxValue == 1)
										{
											service.format[l] = 'bool';
										}
									}
								}
							}
							else
							{
								type = 'unsupported';
							}

							if(letters == '23')
							{
								service.name = characteristic.value;
							}
						}

						if(accessoryJSON[i].services[j].type != '3E')
						{
							service.type = type;

							if(service.type != null)
							{
								accessoryArray[i].services.push(service);
							}
						}
					}

					accessoryArray[i].services = getLetters(accessoryArray[i].services);
				}

				resolve(accessoryArray);

			}).catch((e) => { this.logger.err(e); resolve(null) });
		});
	}

	reloadConfig()
	{
		return new Promise(resolve => {

			this.files.readFile(this.platform.api.user.storagePath() + '/config.json').then((config) => {

				if(config != null)
				{
					configOBJ = config;
				}

				resolve(config != null);
			});
		});
	}
}

function checkID(id)
{
	for(const i in accessories)
	{
		if(accessories[i].id == id)
		{
			return false;
		}
	}

	return true;
}

function addToConfig(id, ip, name, services, buttons)
{
	for(const i in configOBJ.platforms)
	{
		if(configOBJ.platforms[i].platform === 'SynTexWebHooks')
		{
			var accessories = configOBJ.platforms[i].accessories;
			var index = accessories.length;

			accessories[index] = { id : id, name : name, services : services };

			if(services.includes('relais') || services.includes('statelessswitch') || services.includes('rgb') || services.includes('rgbw') || services.includes('rgbww') || services.includes('rgbcw'))
			{
				for(var j = 0; j < services.length; j++)
				{
					var type = services[j];

					if(type == 'relais' || type == 'rgb' || type == 'rgbw' || type == 'rgbww' || type == 'rgbcw')
					{
						accessories[index]['services'][j] = { type : accessories[index]['services'][j], requests : [] };
					}

					if(type == 'relais')
					{
						accessories[index]['services'][j]['requests'].push({ trigger : 'on', method : 'GET', url : 'http://' + ip + '/relais?value=true' });
						accessories[index]['services'][j]['requests'].push({ trigger : 'off', method : 'GET', url : 'http://' + ip + '/relais?value=false' });
					}
					
					if(type == 'rgb' || type == 'rgbw' || type == 'rgbww' || type == 'rgbcw')
					{
						accessories[index]['services'][j]['requests'].push({ trigger : 'color', method : 'GET', url : 'http://' + ip + '/color' });
					}

					if(type == 'statelessswitch')
					{
						accessories[index]['services'][j]['buttons'] = buttons;
					}
				}
			}
		}
	}
}

function convertServices(orginal, additional)
{
	var services = [];

	if(Array.isArray(additional))
	{
		for(const i in additional)
		{
			if(additional[i] instanceof Object)
			{
				services.push(additional[i]);
			}
			else
			{
				services.push({ type : additional[i] });
			}	
		}
	}
	else if(additional instanceof Object)
	{
		services.push(additional);
	}
	else
	{
		services.push({ type : additional });
	}

	services = getLetters(services);

	for(const i in services)
	{
		for(const x in orginal)
		{
			if(services[i].letters == orginal[x].letters)
			{
				for(const y in orginal[x])
				{
					if(y != 'type')
					{
						services[i][y] = orginal[x][y];
					}
				}

				if(services[i].orginalLetters != null)
				{
					services[i].letters = services[i].orginalLetters;

					delete services[i].orginalLetters;
				}
			}
		}
	}

	return services;
}

function getLetters(services)
{
	var typeCounter = {};

	for(const i in services)
	{
		if(typeCounter[services[i].type] != null)
		{
			typeCounter[services[i].type]++;
		}
		else
		{
			typeCounter[services[i].type] = 0;
		}

		if(services[i].type == 'relais')
		{
			services[i].orginalLetters = typeToLetter(services[i].type) + typeCounter[services[i].type];

			if(typeCounter['outlet'] != null)
			{
				typeCounter['outlet']++;
			}
			else
			{
				typeCounter['outlet'] = 0;
			}

			services[i].letters = typeToLetter('outlet') + typeCounter['outlet'];
		}
		else
		{
			services[i].letters = typeToLetter(services[i].type) + typeCounter[services[i].type];
		}
	}

	return services;
}

function typeToLetter(type)
{
	var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet', 'led', 'dimmer'];
	var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

	return letters[types.indexOf(type.toLowerCase())];
}