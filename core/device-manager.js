const store = require('json-fs-store'), axios = require('axios');

var config, logger, accessories;
var configOBJ = null;

module.exports = class DeviceManager
{
	constructor(configPath, Logger, storagePath, webHooksPort)
	{
		config = store(configPath);
		logger = Logger;

		this.storage = store(storagePath);
		this.webHooksPort = webHooksPort;

		this.reloading = false;

		reloadConfig().then((success) => {

			if(success)
			{
				this.reloadAccessories();
			}
		});
	}

	initDevice(id, ip, name, version, events, services)
	{
		return new Promise(async (resolve) => {
			
			var device = await this.getDevice(id);

			name = name.replace(new RegExp('%', 'g'), ' ');

			if(device != null)
			{
				var needToSave = this.setConfigValues(id, { version, ip });

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
						services = JSON.parse(services);
						events = JSON.parse(events);

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

									this.storage.add(device, (err) => {

										if(err)
										{
											logger.log('error', 'bridge', 'Bridge', id + '.json %update_error%! ' + err);

											resolve(['Error', '']);
										}
										else
										{
											logger.log('success', id, name, '[' + name + '] %accessory_add%! ( ' + id + ' )');

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
							logger.log('error', 'bridge', 'Bridge', '%no_services%!');

							resolve(['Error', 'Keine Services!']);
						}
					}
					catch(e)
					{
						logger.log('error', 'bridge', 'Bridge', 'Services / Events %json_parse_error%! ( ' + services + ') ' + error);
					}
				}
				else
				{
					logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');

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
						logger.log('success', id, name, '[' + name + '] %accessory_add%! ( ' + id + ' )');

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
				logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');

				resolve(['Error', 'Fehler beim Erstellen!']);
			}
		});
	}

	getDevice(id)
	{
		return new Promise(resolve => {
			
			this.storage.load(id, (err, obj) => {  
				
				resolve(!obj || err ? null : obj);
			});
		});
	}

	getDevices()
	{
		return new Promise(resolve => {
			
			this.storage.list((err, objs) => {  

				resolve(!objs || err ? null : objs);
			});
		});
	}

	getAccessory(id)
	{
		for(var i = 0; i < accessories.length; i++)
		{
			if(accessories[i].id == id)
			{
				return accessories[i];
			}
		}

		return null;
	}

	getAccessories()
	{
		return accessories;
	}

	setValue(id, param, value)
	{
		return new Promise(resolve => {
			
			this.storage.load(id, (err, obj) => {  

				if(!obj || err)
				{
					resolve(false);
				}
				else
				{
					obj[param] = value;
					
					this.storage.add(obj, (err) => {

						if(err)
						{
							logger.log('error', 'bridge', 'Bridge', id + '.json %update_error%! ' + err);
						}
						else
						{
							this.reloadAccessories();
						}

						resolve(err ? false : true);
					});
				}
			});
		});
	}

	setValues(values)
	{
		return new Promise(async (resolve) => {

			if(values.id != null)
			{
				var needToSave = false;

				if(values.name != null)
				{
					needToSave = this.setConfigValue(values.id, 'name', values.name);
				}

				if(needToSave)
				{
					await this.saveAccessories();
				}
				
				this.storage.load(values.id, (err, obj) => {  

					if(!obj || err)
					{
						obj = { id : values.id };
						
						for(const i in values)
						{
							if(i != 'id' && i != 'name')
							{
								obj[i] = values[i];
							}
						}
					}
					else
					{
						for(const i in values)
						{
							if(i != 'id' && i != 'name')
							{
								obj[i] = values[i];
							}
						}                
					}

					this.storage.add(obj, (err) => {

						if(err)
						{
							logger.log('error', 'bridge', 'Bridge', values.id + '.json %update_error%! ' + err);
						}
						
						this.reloadAccessories();

						resolve(err ? false : true);
					});
				});
			}
		});
	}

	setConfigValue(id, key, value)
	{
		var needToSave = false;

		if(configOBJ != null && configOBJ.platforms != null)
		{
			for(const i in configOBJ.platforms)
			{
				if(configOBJ.platforms[i].platform === 'SynTexWebHooks' && configOBJ.platforms[i].accessories != null)
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
			logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');
		}

		return needToSave;
	}

	setConfigValues(id, values)
	{
		var needToSave = false;

		for(const key in values)
		{
			if(this.setConfigValue(id, key, values[key]))
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
			logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');
		}

		return null;
	}

	getBridgeStorage()
	{
		return new Promise(resolve => {
			
			this.storage.load('Bridge', (err, obj) => {  

				if(!obj || err)
				{
					resolve(null);
				}
				else
				{
					resolve(obj.data);
				}
			});
		});
	}

	setBridgeStorage(key, value)
	{
		return new Promise(resolve => {
			
			this.storage.load('Bridge', (err, obj) => {  

				if(!obj || err)
				{
					obj = { id : 'Bridge', data : { [key] : value } };
				}
				else
				{
					obj.data[key] = value;              
				}

				this.storage.add(obj, (err) => {

					if(err)
					{
						logger.log('error', 'bridge', 'Bridge', 'Bridge.json %update_error%! ' + err);
					}

					resolve(err ? false : true);
				});
			});
		});
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
										if(x != 'id')
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
											if(x != 'id')
											{
												accessories[k][x] = configOBJ.platforms[i].accessories[j][x];
											}
										}
									}
								}
							}
						}
					}
				}

				// OPTIMIZE: Check if Accessory is Deleted

				for(const i in accessories)
				{
					if(accessories[i].plugin != null)
					{
						if(accessories[i].plugin == 'SynTexWebHooks' && accessories[i].ip != null)
						{
							accessories[i].plugin = 'SynTex';
						}

						if(accessories[i].plugin == 'SynTexMagicHome')
						{
							if(accessories[i].type == 'light')
							{
								accessories[i].spectrum = 'HSL'; 
							}
						}

						if(accessories[i].plugin == 'SynTexMagicHome' || accessories[i].plugin == 'SynTexTuya' || accessories[i].plugin == 'SynTexWebHooks')
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

			config.add(configOBJ, (err) => {

				if(err)
				{
					logger.log('error', 'bridge', 'Bridge', 'Config.json %update_error%! ' + err);
				}
				else
				{
					this.reloadAccessories();
				}

				resolve(err ? false : true);
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

			this.storage.remove(id, (err) => {
									
				if(err)
				{
					logger.log('error', 'bridge', 'Bridge', '%accessory_remove_settings_error%! ' + err);
				}

				reloadConfig().then((success) => {

					if(success)
					{
						this.reloadAccessories();
					}
				});

				resolve(err && err.code != 'ENOENT' ? false : true);
			});
		});
	}

	getBridgeAccessories()
	{
		return new Promise((resolve) => {

			var characteristics = {
				'A2' : 'bridge',
				'43' : 'led',
				'47' : 'outlet',
				'49' : 'switch',
				'80' : 'contact',
				'82' : 'humidity',
				'83' : 'rain',
				'84' : 'light',
				'85' : 'motion',
				'86' : 'occupancy',
				'89' : 'statelessswitch',
				'8A' : 'temperature'/*,
				'8D' : 'airquality',
				'7E' : 'security',
				'41' : 'garagedoor',
				'45' : 'lock'*/
			};

			axios.get('http://localhost:' + (this.getBridgePort() || '51826') + '/accessories').then((response) => {

				var accessoryArray = [];
				var accessoryJSON = response.data.accessories;

				for(const i in accessoryJSON)
				{
					accessoryArray[i] = { services : [] };

					for(const j in accessoryJSON[i].services)
					{
						if(accessoryJSON[i].services[j].type == '3E')
						{
							for(const k in accessoryJSON[i].services[j].characteristics)
							{
								if(accessoryJSON[i].services[j].characteristics[k].type == '30')
								{
									accessoryArray[i].id = accessoryJSON[i].services[j].characteristics[k].value;
								}

								if(accessoryJSON[i].services[j].characteristics[k].type == '23')
								{
									accessoryArray[i].name = accessoryJSON[i].services[j].characteristics[k].value;
								}

								if(accessoryJSON[i].services[j].characteristics[k].type == '52')
								{
									accessoryArray[i].version = accessoryJSON[i].services[j].characteristics[k].value;
								}

								if(accessoryJSON[i].services[j].characteristics[k].type == '20')
								{
									accessoryArray[i].plugin = accessoryJSON[i].services[j].characteristics[k].value;
								}
							}
						}
						else
						{
							if(characteristics[accessoryJSON[i].services[j].type] != null)
							{
								if(characteristics[accessoryJSON[i].services[j].type] == 'led')
								{
									var type = 'led';

									for(const k in accessoryJSON[i].services[j].characteristics)
									{
										if(accessoryJSON[i].services[j].characteristics[k].type == '13' || accessoryJSON[i].services[j].characteristics[k].type == '2F')
										{
											type = 'rgb';
										}

										if(accessoryJSON[i].services[j].characteristics[k].type == '8' && type != 'rgb')
										{
											type = 'dimmer';
										}
									}

									accessoryArray[i].services.push(type);
								}
								else
								{
									accessoryArray[i].services.push(characteristics[accessoryJSON[i].services[j].type]);
								}
							}
							else
							{
								accessoryArray[i].services.push('unsupported');
							}
						}
					}
				}

				resolve(accessoryArray);

			}).catch((e) => { logger.err(e); resolve(null) });
		});
	}
}

function reloadConfig()
{
	return new Promise(resolve => {

		config.load('config', (err, obj) => {    

			if(!obj || err)
			{
				logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%! ' + err);

				resolve(false);
			}
			else
			{
				configOBJ = obj;

				resolve(true);
			}
		});
	});
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