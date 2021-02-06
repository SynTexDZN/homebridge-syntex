const store = require('json-fs-store'), request = require('request');

var config, storage, logger, webhookPort, accessories, deviceManager;
var configOBJ = null;

module.exports = class DeviceManager
{
	constructor(configPath, slog, storagePath, port)
	{
		config = store(configPath);
		storage = store(storagePath);
		logger = slog;
		webhookPort = port;

		this.reloading = false;

		reloadConfig().then((success) => {

			if(success)
			{
				this.reloadAccessories();
			}
		});

		deviceManager = this;
	}

	initDevice(id, ip, name, version, events, services)
	{
		const self = this;

		return new Promise(async (resolve) => {
			
			var device = await self.getDevice(id);

			name = name.replace(new RegExp('%', 'g'), ' ');

			if(device != null)
			{
				if(ip != device['ip'])
				{
					self.setValue(id, 'ip', ip);
				}

				if(configOBJ != null)
				{
					var needToSave = false;

					for(const i in configOBJ.platforms)
					{
						if(configOBJ.platforms[i].platform === 'SynTexWebHooks')
						{
							for(var j = 0; j < configOBJ.platforms[i].accessories.length; j++)
							{
								if(configOBJ.platforms[i].accessories[j].id == id && version != configOBJ.platforms[i].accessories[j].version)
								{
									configOBJ.platforms[i].accessories[j].version = version;

									needToSave = true;
								}	
							}
						}
					}

					if(needToSave)
					{
						this.saveAccessories();
					}
				}
				else
				{
					logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%!');

					resolve(['Error', '']);
				}

				resolve(['Success', '{"name": "' + (device['name'] || name) + '", "active": "' + device['active'] + '", "interval": "' + (device['interval'] || 10000) + '", "led": "' + device['led'] + '", "port": "' + (webhookPort || 1710) + '"}']);
			}
			else if(self.checkName(name))
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

									storage.add(device, (err) => {

										if(err)
										{
											logger.log('error', 'bridge', 'Bridge', id + '.json %update_error%! ' + err);

											resolve(['Error', '']);
										}
										else
										{
											logger.log('success', id, name, '[' + name + '] %accessory_add%! ( ' + id + ' )');

											this.reloadAccessories();

											resolve(['Init', '{"name": "' + name + '", "active": "1", "interval": "10000", "led": "1", "port": "' + webhookPort + '"}']);
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

							resolve(['Error', '']);
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

					resolve(['Error', '']);
				}
			}
			else
			{
				resolve(['Error', 'Name ist bereits Vergeben!']);
			}
		});
	}

	initSwitch(id, name)
	{
		const self = this;

		return new Promise((resolve) => {
			
			if(!checkID(id))
			{
				resolve(['Error', 'ID ist bereits Vergeben!']);          
			}
			else if(!self.checkName(name))
			{
				resolve(['Error', 'Name ist bereits Vergeben!']);
			}
			else
			{
				if(configOBJ != null)
				{
					addToConfig(id, null, name, 'switch', 0);

					this.saveAccessories().then((success) => {

						if(success)
						{
							var device = { id: id, name: name, active: 1 };

							storage.add(device, (err) => {

								if(err)
								{
									logger.log('error', 'bridge', 'Bridge', id + '.json %update_error%! ' + err);

									resolve(['Error', 'Fehler beim Erstellen!']);
								}
								else
								{
									logger.log('success', id, name, '[' + name + '] %accessory_add%! ( ' + id + ' )');

									this.reloadAccessories();

									resolve(['Success', 'Success']);
								}
							});
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
			}
		});
	}

	checkName(name)
	{
		for(const i in accessories)
		{
			if(accessories[i].name == name)
			{
				return false;
			}
		}

		return true;
	}

	getValue(id, param)
	{
		return new Promise(resolve => {
			
			storage.load(id, (err, obj) => {  

				resolve(!obj || err ? null : obj[param]);
			});
		});
	}

	getDevice(id)
	{
		return new Promise(resolve => {
			
			storage.load(id, (err, obj) => {  
				
				resolve(!obj || err ? null : obj);
			});
		});
	}

	getDevices()
	{
		return new Promise(resolve => {
			
			storage.list((err, objs) => {  

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
			
			storage.load(id, (err, obj) => {  

				if(!obj || err)
				{
					resolve(false);
				}
				else
				{
					obj[param] = value;
					
					storage.add(obj, (err) => {

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
		return new Promise(resolve => {
			
			storage.load(values.id, (err, obj) => {  

				if(!obj || err)
				{
					obj = { id : values.id };
					
					for(const i in values)
					{
						if(i != 'id')
						{
							obj[i] = values[i];
						}
					}
				}
				else
				{
					for(const i in values)
					{
						if(i != 'id')
						{
							obj[i] = values[i];
						}
					}                
				}

				storage.add(obj, (err) => {

					if(err)
					{
						logger.log('error', 'bridge', 'Bridge', values.id + '.json %update_error%! ' + err);
					}
					else
					{
						this.reloadAccessories();
					}

					resolve(err ? false : true);
				});
			});
		});
	}

	getBridgeStorage()
	{
		return new Promise(resolve => {
			
			storage.load('Bridge', (err, obj) => {  

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
			
			storage.load('Bridge', (err, obj) => {  

				if(!obj || err)
				{
					obj = { id : 'Bridge', data : { [key] : value } };
				}
				else
				{
					obj.data[key] = value;              
				}

				storage.add(obj, (err) => {

					if(err)
					{
						logger.log('error', 'bridge', 'Bridge', 'Bridge.json %update_error%! ' + err);
					}

					resolve(err ? false : true);
				});
			});
		});
	}

	reloadAccessories()
	{
		return new Promise(async (resolve) => {

			if(!this.reloading)
			{
				this.reloading = true;

				var plugins = ['SynTexWebHooks', 'SynTexMagicHome', 'SynTexTuya'];
				var devices = await deviceManager.getDevices();

				accessories = [];

				var promiseArray = [];

				for(const i in configOBJ.platforms)
				{
					if(plugins.includes(configOBJ.platforms[i].platform) && configOBJ.platforms[i].port != null)
					{
						var theRequest = {
							method : 'GET',
							url : 'http://localhost:' + configOBJ.platforms[i].port + '/accessories',
							timeout : 10000
						};
		
						const newPromise = new Promise((callback) => request(theRequest, (err, response, body) => {

							try
							{
								accessories.push.apply(accessories, JSON.parse(body));
							}
							catch(e)
							{

							}

							callback();
						}));

						promiseArray.push(newPromise);
					}
				}

				Promise.all(promiseArray).then(() => {

					for(var j = 0; j < accessories.length; j++)
					{
						for(const k in devices)
						{
							if(devices[k].id == accessories[j].id)
							{
								for(var l = 0; l < Object.keys(devices[k]).length; l++)
								{
									accessories[j][Object.keys(devices[k])[l]] = devices[k][Object.keys(devices[k])[l]];
								}
							}
						}

						if(accessories[j].plugin == null)
						{
							accessories[j].plugin = configOBJ.platforms[i].platform;
						}

						if(accessories[j].plugin == 'SynTexWebHooks' && accessories[j].ip)
						{
							accessories[j].plugin = 'SynTex';
						}

						if(accessories[j].plugin == 'SynTexMagicHome')
						{
							if(accessories[j].type == 'light')
							{
								accessories[j].spectrum = 'HSL'; 
							}
						}

						if(accessories[j].plugin == 'SynTexMagicHome' || accessories[j].plugin == 'SynTexTuya' || accessories[j].plugin == 'SynTexWebHooks')
						{
							accessories[j].version = '99.99.99';
						}
					}

					this.reloading = false;

					resolve();
				});
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

			storage.remove(id, (err) => {
									
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