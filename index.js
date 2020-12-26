let DeviceManager = require('./core/device-manager'), Automations = require('./core/automations'), OfflineManager = require('./core/offline-manager'), HTMLQuery = require('./core/html-query'), logger = require('syntex-logger'), WebServer = require('./core/webserver');
const fs = require('fs'), store = require('json-fs-store'), request = require('request');
var conf, restart = true;

module.exports = function(homebridge)
{
	homebridge.registerPlatform('homebridge-syntex', 'SynTex', SynTexPlatform);
};

function SynTexPlatform(log, config, api)
{
	try
	{
		this.cacheDirectory = config['cache_directory'] || './SynTex/data';
		this.logDirectory = config['log_directory'] || './SynTex/log';
		this.port = config['port'] || 1711;
		this.debug = config['debug'] || false;

		conf = store(api.user.storagePath());

		logger = new logger('SynTex', this.logDirectory, this.debug);
		WebServer = new WebServer('SynTex Bridge', logger, this.port, true);

		WebServer.setHead(__dirname + '/includes/head.html');

		HTMLQuery.SETUP(logger);

		getPluginConfig('SynTexWebHooks').then(function(config) {

			if(config != null)
			{
				DeviceManager = new DeviceManager(api.user.storagePath(), logger, this.cacheDirectory, config);
				Automations.SETUP(logger, config.cache_directory);
			}

			DeviceManager.getDevices().then(function(devices)
			{
				if(devices != null)
				{
					OfflineManager.SETUP(logger, devices);
				}
			});

			restart = false;

			DeviceManager.setBridgeStorage('restart', new Date());

			const { exec } = require('child_process');

			exec('sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 1711', (error, stdout, stderr) => {

				exec('sudo iptables -t nat -A PREROUTING -i wlan0 -p tcp --dport 80 -j REDIRECT --to-port 1711', (error, stdout, stderr) => {

					if(error || stderr.includes('ERR!'))
					{
						logger.log('error', 'bridge', 'Bridge', 'Umleitung der Bridge Website Fehlgeschlagen!');
					}
					else
					{
						logger.log('warn', 'bridge', 'Bridge', 'Umleitung der Bridge Website zu Port [80]');
					}
				});
			});

			exec('cat /sys/class/net/wlan0/address', (error, stdout, stderr) => {

				if(stdout)
				{
					var theRequest = {
						method : 'GET',
						url : 'http://syntex.sytes.net/smarthome/init-bridge.php?plugin=SynTex&mac=' + stdout,
						timeout : 10000
					};

					request(theRequest, () => {});
				}
			});
			
		}.bind(this)).catch(function(e) {

			logger.err(e);
		});
	}
	catch(e)
	{
		logger.err(e);
	}
}

SynTexPlatform.prototype = {
	
	accessories : function(callback)
	{        
		try
		{
			var accessories = [];

			callback(accessories);

			WebServer.addPage('/serverside/init', (response, urlParams) => {
	
				if(urlParams.name != null && urlParams.id != null && urlParams.ip != null && urlParams.version != null && urlParams.buttons != null)
				{
					DeviceManager.initDevice(urlParams.id, urlParams.ip, urlParams.name, urlParams.version, urlParams.buttons, urlParams.services != null ? urlParams.services : '[]').then(function(res) {

						if(res[0] != 'Error')
						{
							logger.log('info', urlParams.id, JSON.parse(res[1]).name, '[' + JSON.parse(res[1]).name + '] hat sich mit der Bridge verbunden! ( ' + urlParams.id + ' | ' +  urlParams.ip + ' )');
						}

						response.write(res[1]);
						response.end();

						if(res[0] == 'Init')
						{
							restart = true;

							const { exec } = require('child_process');

							logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');

							exec('sudo systemctl restart homebridge');
						}
						
					}).catch(function(e) {

						logger.err(e);
					});
				}
			});

			WebServer.addPage('/serverside/remove-device', (response, urlParams) => {

				if(urlParams.id != null)
				{
					DeviceManager.removeDevice(urlParams.id).then(function(removed) {

						response.write(removed ? 'Success' : 'Error');
						response.end();

						if(removed)
						{
							logger.log('success', urlParams.id, '', 'Ein Gerät wurde entfernt! ( ' + urlParams.id + ' )');

							restart = true;

							const { exec } = require('child_process');

							logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');

							exec('sudo systemctl restart homebridge');
						}
						else
						{
							logger.log('error', 'bridge', 'Bridge', 'Das Gerät konnte nicht entfernt werden! ( ' + urlParams.id + ' )');
						}
						
					}).catch(function(e) {

						logger.err(e);
					});
				}
				else
				{
					response.write('Error');
					response.end();
				}
			});

			WebServer.addPage('/serverside/init-switch', (response, urlParams) => {

				if(urlParams.id != null && urlParams.name != null)
				{
					DeviceManager.initSwitch(urlParams.id, urlParams.name).then(function(res) {

						response.write(res[1]);
						response.end();

						if(res[0] == 'Success')
						{
							restart = true;

							const { exec } = require('child_process');

							logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');

							exec('sudo systemctl restart homebridge');
						}
						
					}).catch(function(e) {

						logger.err(e);
					});
				}
				else
				{
					response.write('Error');
					response.end();
				}
			});

			WebServer.addPage('/serverside/restart', (response) => {

				restart = true;

				const { exec } = require('child_process');
				
				response.write('Success');
				response.end();

				logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');

				exec('sudo systemctl restart homebridge');
			});

			WebServer.addPage('/serverside/check-restart', (response) => {

				response.write(restart.toString());
				response.end();
			});

			WebServer.addPage('/serverside/check-name', (response, urlParams) => {

				if(urlParams.name != null)
				{
					var nameAvailable = DeviceManager.checkName(urlParams.name);

					response.write(nameAvailable ? 'Success' : 'Error');
					response.end();
				}
			});

			WebServer.addPage('/serverside/version', async (response, urlParams, content) => {

				const pJSON = require('./package.json');

				response.write(pJSON.version);
				response.end();
			});

			WebServer.addPage('/serverside/update', (response, urlParams) => {

				var version = 'latest';

				if(urlParams.version != null)
				{
					version = urlParams.version;
				}

				const { exec } = require('child_process');
				
				exec('sudo npm install homebridge-syntex@' + version + ' -g', (error, stdout, stderr) => {

					try
					{
						response.write(error || stderr.includes('ERR!') ? 'Error' : 'Success');
						response.end();

						if(error || stderr.includes('ERR!'))
						{
							logger.log('error', 'bridge', 'Bridge', 'Die SynTex Bridge konnte nicht aktualisiert werden! ' + (error || stderr));
						}
						else
						{
							logger.log('success', 'bridge', 'Bridge', 'Die SynTex Bridge wurde auf die Version [' + version + '] aktualisiert!');
							
							restart = true;

							logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');
							
							exec('sudo systemctl restart homebridge');
						}
					}
					catch(e)
					{
						logger.err(e);
					}
				});
			});

			WebServer.addPage('/serverside/activity', async (response, urlParams) => {

				var result = {};

				if(urlParams.id != null)
				{
					var activity = await logger.load('SynTexWebHooks', urlParams.id);

					if(activity != null)
					{
						activity = activity.concat(await logger.load('SynTexMagicHome', urlParams.id));
					}
					else
					{
						activity = await logger.load('SynTexMagicHome', urlParams.id);
					}

					if(activity != null)
					{
						var a = {};

						for(const i in activity[0])
						{
							a[i] = { update : [], success : [] };

							for(const j in activity[0][i])
							{
								if(activity[0][i][j].l == 'Update' || activity[0][i][j].l == 'Success')
								{
									var value = activity[0][i][j].m.split('[')[2].split(']')[0];

									a[i][activity[0][i][j].l.toLowerCase()].push({ t : activity[0][i][j].t, v : value, s : activity[0][i][j].s });
								}
							}
						}

						result = a;
					}
				}

				response.write(JSON.stringify(result));
				response.end();
			});

			WebServer.addPage('/serverside/log', (response, urlParams) => {

				fs.readdir(this.logDirectory, async function(err, files)
				{
					var obj = {};

					for(var i = 0; i < files.length; i++)
					{
						var file = files[i].split('.')[0];
						
						obj[file] = '[]';

						var logs = await logger.load(file, null);

						if(logs != null)
						{
							var logList = [];

							for(const j in logs)
							{
								if(urlParams.id == null || urlParams.id == j)
								{
									for(const k in logs[j])
									{
										for(const l in logs[j][k])
										{
											logList[logList.length] = { t : logs[j][k][l].t, l : logs[j][k][l].l, m : logs[j][k][l].m.replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'/g, '').replace(/\"/g, '') };
										}
									}
								}
							}

							logList.sort(function(a, b) {

								var keyA = new Date(a.t), keyB = new Date(b.t);
								
								if (keyA < keyB) return 1;
								if (keyA > keyB) return -1;
								
								return 0;
							});

							obj[file] = JSON.stringify(logList);
						}
					}

					response.write(JSON.stringify(obj));
					response.end();
				});
			});

			WebServer.addPage('/serverside/time', (response) => {

				response.write('' + (new Date().getTime() / 1000 + 3601));
				response.end();
			});

			WebServer.addPage('/serverside/offline-devices', (response) => {

				response.write(JSON.stringify(OfflineManager.getOfflineDevices()));
				response.end();
			});

			WebServer.addPage('/serverside/check-device', async (response, urlParams) => {

				if(urlParams.id != null)
				{
					var device = await DeviceManager.getDevice(urlParams.id);

					response.write(device ? 'Success' : 'Error');
					response.end();
				}
			});

			WebServer.addPage('/serverside/save-config', async (response, urlParams, content, postJSON) => {

				if(postJSON != null)
				{
					response.write(await DeviceManager.setValues(postJSON) ? 'Success' : 'Error'); 
					response.end();
				}
			});

			WebServer.addPage('/serverside/automations', async (response) => {

				response.write(JSON.stringify(await Automations.loadAutomations())); 
				response.end();
			});

			WebServer.addPage('/serverside/create-automation', async (response, urlParams, content, postJSON) => {

				if(postJSON != null)
				{
					response.write(await Automations.createAutomation(postJSON) ? 'Success' : 'Error');
					response.end();
				}
			});

			WebServer.addPage('/serverside/modify-automation', async (response, urlParams, content, postJSON) => {

				if(postJSON != null)
				{
					response.write(await Automations.modifyAutomation(postJSON) ? 'Success' : 'Error');
					response.end();
				}
			});

			WebServer.addPage('/serverside/remove-automation', async (response, urlParams) => {

				if(urlParams.id != null)
				{
					response.write(urlParams.id ? await Automations.removeAutomation(urlParams.id) ? 'Success' : 'Error' : 'Error');
					response.end();
				}
			});

			WebServer.addPage('/serverside/plugins', (response) => {

				conf.load('config', (err, obj) => {    

					var plugins = [];

					if(obj && !err)
					{       
						for(const i in obj.platforms)
						{
							if(obj.platforms[i].platform != null && obj.platforms[i].platform != 'config' && obj.platforms[i].port != null)
							{
								plugins.push({ id : obj.platforms[i].platform, port : obj.platforms[i].port });
							}
						}
					}
	
					response.write(JSON.stringify(plugins));
					response.end();
				});
			});

			WebServer.addPage('/device', async (response, urlParams, content) => {

				if(urlParams.id != null)
				{
					var webhookConfig = await getPluginConfig('SynTexWebHooks');
					var magicHomeConfig = await getPluginConfig('SynTexMagicHome');
					var obj = {
						device: JSON.stringify(DeviceManager.getAccessory(urlParams.id)),
						wPort: 1710,
						mPort: 1712
					};

					if(webhookConfig != null)
					{
						obj.wPort = webhookConfig.port;
					}

					if(magicHomeConfig != null)
					{
						obj.mPort = magicHomeConfig.port;
					}

					response.write(HTMLQuery.sendValues(content, obj));
					response.end();
				}
			});

			WebServer.addPage(['/', '/index'], async (response, urlParams, content) => {

				var bridgeData = await DeviceManager.getBridgeStorage();

				var obj = {
					devices: JSON.stringify(DeviceManager.getAccessories()),
					restart: '-'
				};
				
				if(bridgeData != null && bridgeData.restart != null)
				{
					obj.restart = formatTimestamp(new Date().getTime() / 1000 - new Date(bridgeData.restart).getTime() / 1000);
				}
				
				response.write(HTMLQuery.sendValues(content, obj));
				response.end();
			});

			WebServer.addPage('/settings', async (response, urlParams, content) => {

				var devices = await DeviceManager.getDevices();

				response.write(HTMLQuery.sendValue(content, 'devices', JSON.stringify(devices)));
				response.end();
			});

			WebServer.addPage(['/setup', '/reconnect'], (response, urlParams, content) => {

				const ifaces = require('os').networkInterfaces();
				var address;

				for(var dev in ifaces)
				{
					var iface = ifaces[dev].filter(function(details)
					{
						return details.family === 'IPv4' && details.internal === false;
					});

					if(iface.length > 0) address = iface[0].address;
				}

				response.write(HTMLQuery.sendValue(content, 'bridge-ip', address));
				response.end();
			});

			WebServer.addPage('/bridge', async (response, urlParams, content) => {

				const pJSON = require('./package.json');
				const ifaces = require('os').networkInterfaces();
				var address;

				for(var dev in ifaces)
				{
					var iface = ifaces[dev].filter(function(details)
					{
						return details.family === 'IPv4' && details.internal === false;
					});

					if(iface.length > 0) address = iface[0].address;
				}

				var webhookConfig = await getPluginConfig('SynTexWebHooks');
				var obj = {
					ip: address,
					version: pJSON.version,
					wPort: 1710
				};

				if(webhookConfig != null)
				{
					obj.wPort = webhookConfig.port;
				}

				response.write(HTMLQuery.sendValues(content, obj));
				response.end();
			});

			WebServer.addPage('/crossover', (response, urlParams, content) => {

				var obj = [];
				var t = getPluginConfig('SynTexTuya');

				if(t != null)
				{
					obj.push({ name : 'SynTex Tuya' });
				}

				var t = getPluginConfig('SynTexMagicHome');

				if(t != null)
				{
					obj.push({ name : 'SynTex MagicHome' });
				}

				response.write(HTMLQuery.sendValues(content, { crossoverPlugins : JSON.stringify(obj) }));
				response.end();
			});

			WebServer.addPage(['/automation', '/automations'], async (response, urlParams, content) => {

				var webhookConfig = await getPluginConfig('SynTexWebHooks');
				var obj = {
					accessories: JSON.stringify(DeviceManager.getAccessories()),
					wPort: 1710
				};

				if(webhookConfig != null)
				{
					obj.wPort = webhookConfig.port;
				}

				response.write(HTMLQuery.sendValues(content, obj));
				response.end();
			});

			WebServer.addPage('/debug', async (response, urlParams, content) => {

				conf.load('config', (err, json) => {    

					if(json && !err)
					{
						var obj = {
							configJSON: JSON.stringify(json)
						};

						response.write(HTMLQuery.sendValues(content, obj));
						response.end();
					}
				});
			});

			/*
			if(!relPath)
			{
				var data = await HTMLQuery.read(path.join(__dirname, '/notfound.html'));
				var head = await HTMLQuery.read(__dirname + '/includes/head.html');

				response.setHeader('Content-Type', 'text/html; charset=utf-8');
				response.write(HTMLQuery.sendValues(head + data, obj));
				response.end();
			}
			
			if(path.parse(relPath).ext == '.html')
			{
				response.write(head + data);
				response.end();
			}
			else
			{
				response.write(data);
				response.end();
			}
			*/
		}
		catch(e)
		{
			logger.err(e);
		}
	}
}

function getPluginConfig(pluginName)
{
	return new Promise(resolve => {
		
		conf.load('config', (err, obj) => {    

			try
			{
				if(obj && !err)
				{       
					for(const i in obj.platforms)
					{
						if(obj.platforms[i].platform === pluginName)
						{
							resolve(obj.platforms[i]);
						}
					}
				}

				resolve(null);
			}
			catch(e)
			{
				logger.err(e);
			}
		});
	});
}

function formatTimestamp(timestamp)
{
	if(timestamp < 60)
	{
		return Math.round(timestamp) + ' s';
	}
	else if(timestamp < 60 * 60)
	{
		return Math.round(timestamp / 60) + ' m';
	}
	else if(timestamp < 60 * 60 * 24)
	{
		return Math.round(timestamp / 60 / 60) + ' h';
	}
	else if(timestamp < 60 * 60 * 24 * 7)
	{
		return Math.round(timestamp / 60 / 60 / 24) + ' T';
	}
	else if(timestamp < 60 * 60 * 24 * 30.5)
	{
		return Math.round(timestamp / 60 / 60 / 24 / 7) + 'W';
	}
	else if(timestamp < 60 * 60 * 24 * 365)
	{
		return Math.round(timestamp / 60 / 60 / 24 / 30.5) + 'M';
	}
	else
	{
		return '> 1 J';
	}
}