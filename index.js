let DeviceManager = require('./core/device-manager'), PluginManager = require('./core/plugin-manager'), Automation = require('./core/automation'), OfflineManager = require('./core/offline-manager'), UpdateManager = require('./core/update-manager'), HTMLQuery = require('./core/html-query'), logger = require('syntex-logger'), WebServer = require('syntex-webserver');

const fs = require('fs'), store = require('json-fs-store'), request = require('request');

var restart = true, updating = false;

const pluginID = 'homebridge-syntex';
const pluginName = 'SynTex';

module.exports = (homebridge) => homebridge.registerPlatform(pluginID, pluginName, SynTexPlatform);

class SynTexPlatform
{
	constructor(log, config, api)
	{
		this.cacheDirectory = config['cacheDirectory'] || './SynTex/data';
		this.logDirectory = config['logDirectory'];
		this.automationDirectory = config['automationDirectory'];
		this.port = config['port'] || 1711;
		this.debug = config['debug'] || false;
		this.language = config['language'] || 'en';

		this.config = store(api.user.storagePath());

		this.logger = new logger(pluginName, this.logDirectory, this.debug, this.language);
		this.WebServer = new WebServer('SynTex Bridge', this.logger, this.port, true);

		this.WebServer.setHead(__dirname + '/includes/head.html');

		HTMLQuery = new HTMLQuery(this.logger);
		
		Automation.SETUP(this.logger, this.automationDirectory);

		PluginManager = new PluginManager(this.config, this.logger, 600);

		this.getPluginConfig('SynTexWebHooks').then((config) => {

			DeviceManager = new DeviceManager(api.user.storagePath(), this.logger, this.cacheDirectory, config.port);

			DeviceManager.getDevices().then((devices) => {

				if(devices != null)
				{
					OfflineManager = new OfflineManager(this.logger, devices);
				}

				UpdateManager = new UpdateManager(600, this.config);

				this.initWebServer();

				restart = false;

				DeviceManager.setBridgeStorage('restart', new Date());
			});
		});

		const { exec } = require('child_process');

		exec('sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 1711', (error, stdout, stderr) => {

			exec('sudo iptables -t nat -A PREROUTING -i wlan0 -p tcp --dport 80 -j REDIRECT --to-port 1711', (error, stdout, stderr) => {

				if(error || stderr.includes('ERR!'))
				{
					this.logger.log('error', 'bridge', 'Bridge', '%port_redirection_error%!');
				}
				else
				{
					this.logger.log('warn', 'bridge', 'Bridge', '%port_redirection_success% [80]');
				}
			});
		});

		exec('cat /sys/class/net/wlan0/address', (error, stdout, stderr) => {

			if(stdout)
			{
				var theRequest = {
					method : 'GET',
					url : 'http://syntex.sytes.net/smarthome/init-bridge.php?plugin=SynTex&mac=' + stdout + '&version=' + require('./package.json').version,
					timeout : 10000
				};

				request(theRequest, () => {});
			}
		});
	}

	initWebServer()
	{
		this.WebServer.addPage('/serverside/remove-device', async (response, urlParams) => {

			if(urlParams.id != null)
			{
				response.write(await DeviceManager.removeFromSettingsStorage(urlParams.id) ? 'Success' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/init', (response, urlParams) => {
	
			if(urlParams.name != null && urlParams.id != null && urlParams.ip != null && urlParams.version != null && urlParams.buttons != null)
			{
				DeviceManager.initDevice(urlParams.id, urlParams.ip, urlParams.name, urlParams.version, urlParams.buttons, urlParams.services != null ? urlParams.services : '[]').then((res) => {

					if(res[0] != 'Error')
					{
						try
						{
							this.logger.log('info', urlParams.id, JSON.parse(res[1]).name, '[' + JSON.parse(res[1]).name + '] %accessory_connected%! ( ' + urlParams.id + ' | ' +  urlParams.ip + ' )');
						}
						catch(e)
						{
							this.logger.log('error', 'bridge', 'Bridge', 'Name %json_parse_error%! ( ' + res[1] + ') ' + e);
						}
					}

					response.write(res[1]);
					response.end();

					if(res[0] == 'Init')
					{
						restart = true;

						const { exec } = require('child_process');

						this.logger.log('warn', 'bridge', 'Bridge', '%restart_homebridge% ..');

						exec('sudo systemctl restart homebridge');
					}
					
				}).catch((e) => this.logger.err(e));
			}
		});

		this.WebServer.addPage('/serverside/init-accessory', (response, urlParams, content, postJSON) => {

			if(postJSON != null && postJSON.id != null && postJSON.name != null && postJSON.services != null)
			{
				DeviceManager.initAccessory(postJSON.id, postJSON.name, postJSON.services).then((res) => {

					response.write(res[1]);
					response.end();

					if(res[0] == 'Success')
					{
						restart = true;

						const { exec } = require('child_process');

						this.logger.log('warn', 'bridge', 'Bridge', '%restart_homebridge% ..');

						exec('sudo systemctl restart homebridge');
					}
					
				}).catch((e) => this.logger.err(e));
			}
			else
			{
				response.write('Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/restart', (response) => {

			restart = true;

			const { exec } = require('child_process');
			
			response.write('Success');
			response.end();

			this.logger.log('warn', 'bridge', 'Bridge', '%restart_homebridge% ..');

			exec('sudo systemctl restart homebridge');
		});

		this.WebServer.addPage('/serverside/check-restart', (response) => {

			response.write(restart.toString());
			response.end();
		});

		this.WebServer.addPage('/serverside/check-name', (response, urlParams) => {

			if(urlParams.name != null)
			{
				var nameAvailable = DeviceManager.checkName(urlParams.name);

				response.write(nameAvailable ? 'Success' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/version', async (response, urlParams, content) => {

			const pJSON = require('./package.json');

			response.write(pJSON.version);
			response.end();
		});

		this.WebServer.addPage('/serverside/update', (response, urlParams) => {

			if(urlParams.status != null)
			{
				response.write(updating.toString());
				response.end();
			}
			else
			{
				var updateID = urlParams.plugin != null ? urlParams.plugin : pluginID;
				var version = urlParams.version != null ? urlParams.version : 'latest';

				updating = true;

				const { exec } = require('child_process');
				
				exec('sudo npm install ' + updateID + '@' + version + ' -g', (error, stdout, stderr) => {

					if(error || (stderr && stderr.includes('ERR!')))
					{
						this.logger.log('error', 'bridge', 'Bridge', '%bridge_update_error%! ' + (error || stderr));
					}
					else
					{
						this.logger.log('success', 'bridge', 'Bridge', '%bridge_update_success[0]% [' + version + '] %bridge_update_success[1]%!');
						
						restart = true;

						this.logger.log('warn', 'bridge', 'Bridge', '%restart_homebridge% ..');
						
						exec('sudo systemctl restart homebridge');
					}

					updating = false;
				});

				response.write('Success');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/activity', async (response, urlParams) => {

			var result = {};

			if(urlParams.id != null)
			{
				var activity = await this.logger.load('SynTexWebHooks', urlParams.id);

				if(activity != null)
				{
					activity = activity.concat(await this.logger.load('SynTexMagicHome', urlParams.id));
				}
				else
				{
					activity = await this.logger.load('SynTexMagicHome', urlParams.id);
				}

				if(activity != null)
				{
					activity = activity.concat(await this.logger.load('SynTexTuya', urlParams.id));
				}
				else
				{
					activity = await this.logger.load('SynTexTuya', urlParams.id);
				}

				if(activity != null)
				{
					var a = {};

					for(const plugin in activity)
					{
						for(const i in activity[plugin])
						{
							a[i] = { update : [], success : [] };

							for(const j in activity[plugin][i])
							{
								if(activity[plugin][i][j].l == 'Update' || activity[plugin][i][j].l == 'Success')
								{
									var value = activity[plugin][i][j].m.split('[')[2].split(']')[0];

									a[i][activity[plugin][i][j].l.toLowerCase()].push({ t : activity[plugin][i][j].t, v : value, s : activity[plugin][i][j].s });
								}
							}
						}

						result = a;
					}
				}
			}

			response.write(JSON.stringify(result));
			response.end();
		});

		this.WebServer.addPage('/serverside/log', (response, urlParams) => {

			fs.readdir(this.logDirectory, async (err, files) => {

				var obj = {};

				for(var i = 0; i < files.length; i++)
				{
					var file = files[i].split('.')[0];
					
					obj[file] = '[]';

					var logs = await this.logger.load(file, null);

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

						logList.sort((a, b) => {

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

		this.WebServer.addPage('/serverside/syslog', (response, urlParams) => {

			fs.readFile('/var/log/syslog', (err, data) => {

				if(data && !err)
				{
					data = data.toString();

					response.write(data);
				}
				else
				{
					response.write('Error');

					this.logger.log('error', 'bridge', 'Bridge', 'Syslog %read_error%! ' + err);
				}

				response.end();
			});
		});

		this.WebServer.addPage('/serverside/time', (response) => {

			response.write('' + (new Date().getTime() / 1000 + 3601));
			response.end();
		});

		this.WebServer.addPage('/serverside/offline-devices', (response) => {

			response.write(JSON.stringify(OfflineManager.getOfflineDevices()));
			response.end();
		});

		this.WebServer.addPage('/serverside/check-device', async (response, urlParams) => {

			if(urlParams.id != null)
			{
				var device = await DeviceManager.getDevice(urlParams.id);

				response.write(device ? 'Success' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/save-config', async (response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				response.write(await DeviceManager.setValues(postJSON) ? 'Success' : 'Error'); 
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/automation', async (response) => {

			response.write(JSON.stringify(await Automation.loadAutomation())); 
			response.end();
		});

		this.WebServer.addPage('/serverside/create-automation', async (response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				response.write(await Automation.createAutomation(postJSON) ? 'Success' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/modify-automation', async (response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				response.write(await Automation.modifyAutomation(postJSON) ? 'Success' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/remove-automation', async (response, urlParams) => {

			if(urlParams.id != null)
			{
				response.write(urlParams.id ? await Automation.removeAutomation(urlParams.id) ? 'Success' : 'Error' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/reload-accessories', async (response, urlParams) => {

			DeviceManager.reloadAccessories();

			response.write('Success');
			response.end();
		});

		this.WebServer.addPage('/serverside/plugins', async (response, urlParams) => {

			if(urlParams.reload != null)
			{
				await PluginManager.reloadUpdates();
			}

			response.write(JSON.stringify(PluginManager.getPlugins()));
			response.end();
		});

		this.WebServer.addPage('/serverside/update-config', async (response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				this.config.add(postJSON, (err) => {

					if(err)
					{
						this.logger.log('error', 'bridge', 'Bridge', 'Config.json %update_error%! ' + err);
					}
					else
					{
						DeviceManager.reloadAccessories();
					}
	
					response.write(err ? 'Error' : 'Success');
					response.end();
				});
			}
		});

		this.WebServer.addPage('/device', async (response, urlParams, content) => {

			if(urlParams.id != null)
			{
				await DeviceManager.reloadAccessories();

				response.write(HTMLQuery.sendValue(content, 'device', JSON.stringify(DeviceManager.getAccessory(urlParams.id))));
				response.end();
			}
		});

		this.WebServer.addPage(['/', '/index'], async (response, urlParams, content) => {

			var bridgeData = await DeviceManager.getBridgeStorage();

			await DeviceManager.reloadAccessories();

			var obj = {
				devices: JSON.stringify(DeviceManager.getAccessories()),
				updates: JSON.stringify(UpdateManager.getLatestVersions()),
				restart: '-'
			};
			
			if(bridgeData != null && bridgeData.restart != null)
			{
				obj.restart = bridgeData.restart;
			}
			
			response.write(HTMLQuery.sendValues(content, obj));
			response.end();
		});

		this.WebServer.addPage('/settings', async (response, urlParams, content) => {

			var devices = await DeviceManager.getDevices();

			response.write(HTMLQuery.sendValue(content, 'devices', JSON.stringify(devices)));
			response.end();
		});

		this.WebServer.addPage(['/setup', '/connect'], (response, urlParams, content) => {

			const ifaces = require('os').networkInterfaces();

			var address = null;

			for(var dev in ifaces)
			{
				var iface = ifaces[dev].filter((details) => {

					return details.family === 'IPv4' && details.internal === false;
				});

				if(iface.length > 0) address = iface[0].address;
			}

			response.write(HTMLQuery.sendValue(content, 'bridge-ip', address));
			response.end();
		});

		this.WebServer.addPage(['/bridge', '/debug/workaround/bridge'], async (response, urlParams, content) => {

			var obj = {
				tag: 'latest',
				ip: null,
				wlanMac: null,
				ethernetMac: null
			};

			var bridgeData = await DeviceManager.getBridgeStorage();

			if(bridgeData != null && bridgeData.tag != null)
			{
				obj.tag = bridgeData.tag;
			}

			const ifaces = require('os').networkInterfaces();

			for(var dev in ifaces)
			{
				var iface = ifaces[dev].filter((details) => {

					return details.family === 'IPv4' && details.internal === false;
				});

				if(iface.length > 0) obj.ip = iface[0].address;
			}

			const { exec } = require('child_process');

			exec('cat /sys/class/net/wlan0/address', (error, wMac, stderr) => {

				if(wMac)
				{
					obj.wlanMac = wMac.replace(/\s/g, '');
				}
				
				exec('cat /sys/class/net/eth0/address', (error, eMac, stderr) => {

					if(eMac)
					{
						obj.ethernetMac = eMac.replace(/\s/g, '');
					}
					
					response.write(HTMLQuery.sendValues(content, obj));
					response.end();
				});
			});
		});

		this.WebServer.addPage('/crossover', (response, urlParams, content) => {

			var obj = [];
			var t = this.getPluginConfig('SynTexTuya');

			if(t != null)
			{
				obj.push({ name : 'SynTex Tuya' });
			}

			var t = this.getPluginConfig('SynTexMagicHome');

			if(t != null)
			{
				obj.push({ name : 'SynTex MagicHome' });
			}

			response.write(HTMLQuery.sendValues(content, { crossoverPlugins : JSON.stringify(obj) }));
			response.end();
		});

		this.WebServer.addPage(['/automation/', '/automation/modify'], async (response, urlParams, content) => {

			response.write(HTMLQuery.sendValue(content, 'accessories', JSON.stringify(DeviceManager.getAccessories())));
			response.end();
		});

		this.WebServer.addPage('/debug/', (response, urlParams, content) => {

			fs.readdir(__dirname + '/debug/workaround/', async (err, files) => {

				var obj = {
					workaround: JSON.stringify(files)
				};
	
				response.write(HTMLQuery.sendValues(content, obj));
				response.end();
			});
		});

		this.WebServer.addPage('/debug/beta', async (response, urlParams, content) => {

			var obj = {
				updates: JSON.stringify(UpdateManager.getLatestVersions()),
				tag: 'latest'
			};

			var bridgeData = await DeviceManager.getBridgeStorage();

			if(bridgeData != null && bridgeData.tag != null)
			{
				obj.tag = bridgeData.tag;
			}

			response.write(HTMLQuery.sendValues(content, obj));
			response.end();
		});

		this.WebServer.addPage('/debug/config', async (response, urlParams, content) => {

			this.config.load('config', (err, json) => {    

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

		this.WebServer.addPage('/serverside/beta', async (response, urlParams, content) => {

			if(urlParams.enable != null)
			{
				DeviceManager.setBridgeStorage('tag', urlParams.enable == 'true' ? 'beta' : 'latest');

				response.write('Success');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/command', async (response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				const { exec } = require('child_process');
				
				exec(postJSON, (error, stdout, stderr) => {

					if(error || stderr)
					{
						response.write(stderr || error);
					}
					else
					{
						response.write(stdout);
					}

					response.end();
				});
			}
		});
	}

	getPluginConfig(pluginName)
	{
		return new Promise(resolve => {
			
			this.config.load('config', (err, obj) => {    

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
					this.logger.err(e);
				}
			});
		});
	}
}