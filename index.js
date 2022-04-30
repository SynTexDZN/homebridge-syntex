let DeviceManager = require('./core/device-manager'), PluginManager = require('./core/plugin-manager'), Automation = require('./core/automation'), OfflineManager = require('./core/offline-manager'), UpdateManager = require('./core/update-manager'), HTMLQuery = require('./core/html-query'), Logger = require('syntex-logger'), WebServer = require('syntex-webserver'), FileManager = require('syntex-filesystem');

const { Buffer } = require('buffer'), WebSocket = require('ws'), md5 = require('md5');

const fs = require('fs'), axios = require('axios'), path = require('path');

const pluginID = 'homebridge-syntex';
const pluginName = 'SynTex';
const pluginVersion = require('./package.json').version;

module.exports = (homebridge) => homebridge.registerPlatform(pluginID, pluginName, SynTexPlatform);

class SynTexPlatform
{
	constructor(log, config, api)
	{
		if(config == null || api == null)
		{
			console.log('Keine Config gefunden, das Plugin wird deaktiviert!');

			return;
		}

		this.options = {};

		this.restart = true;
		this.updating = false;

		this.api = api;

		this.pluginID = pluginID;
		this.pluginName = pluginName;
		this.pluginVersion = pluginVersion;

		if(config['options'] != null)
		{
			this.options = config['options'];
		}

		this.port = this.options['port'] || 1711;
		this.language = this.options['language'] || 'en';
		this.debug = this.options['debug'] || false;
		this.remote = this.options['remote'] || false;
		this.password = this.options['password'] || '';

		this.logger = new Logger(pluginName, this.debug, this.language);

		if(config['baseDirectory'] != null)
		{
			try
			{
				fs.accessSync(config['baseDirectory'], fs.constants.W_OK);

				this.baseDirectory = config['baseDirectory'];

				this.logger.setLogDirectory(path.join(this.baseDirectory, 'log'));
			}
			catch(e)
			{
				this.logger.log('error', 'bridge', 'Bridge', '%directory_permission_error% [' + config['baseDirectory'] + ']', '%visit_github_for_support%: https://github.com/SynTexDZN/homebridge-syntex#troubleshooting', e);
			}
		}

		if(this.logger != null && this.baseDirectory != null)
		{
			this.files = new FileManager(this.baseDirectory, this.logger, ['automation', 'log']);

			HTMLQuery = new HTMLQuery(this.logger);
			Automation = new Automation(this.logger, this.files);
			PluginManager = new PluginManager(this, 600);
			OfflineManager = new OfflineManager(this.logger);
			DeviceManager = new DeviceManager(this, PluginManager, OfflineManager);
			UpdateManager = new UpdateManager(this.logger, 600);

			this.WebServer = new WebServer(this, { languageDirectory : __dirname + '/languages', filesystem :  true });
			
			this.WebServer.setHead(__dirname + '/includes/head.html');
			this.WebServer.setFooter(__dirname + '/includes/footer.html');

			this.getPluginConfig('SynTexWebHooks').then((config) => {

				DeviceManager.setWebHooksPort(config.options.port);

				this.initWebServer();

				this.files.writeFile('info.json', { restart : new Date().getTime() });
			});

			this.files.readFile(this.api.user.storagePath() + '/config.json').then((config) => {

				if(config != null && config.bridge != null)
				{
					if(config.bridge.name != null)
					{
						this.bridgeName = config.bridge.name;
					}

					if(config.bridge.username != null)
					{
						this.getSetupCode(config.bridge.username);
					}
				}

				if(this.baseDirectory != null)
				{
					this.generateID().then((bridgeInit) => {
						
						setTimeout(() => this.getBridgeID().then((bridgeID) => {

							if(bridgeID != null)
							{
								this.connectBridge(bridgeID, bridgeInit);
							}

						}), bridgeInit ? 3000 : 0);
					});
				}
			});

			const { exec } = require('child_process');

			exec('sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 1711', (ethError, ethStdOut, ethStdErr) => {

				if(ethError || ethStdErr.includes('ERR!'))
				{
					this.logger.log('warn', 'bridge', 'Bridge', 'LAN %port_redirection_error%!', ethError);
				}
				else
				{
					this.logger.log('info', 'bridge', 'Bridge', 'LAN %port_redirection_success% [80]');
				}

				exec('sudo iptables -t nat -A PREROUTING -i wlan0 -p tcp --dport 80 -j REDIRECT --to-port 1711', (wlanError, wlanStdOut, wlanStdErr) => {

					if(wlanError || wlanStdErr.includes('ERR!'))
					{
						this.logger.log('warn', 'bridge', 'Bridge', 'WLAN %port_redirection_error%!', wlanError);
					}
					else
					{
						this.logger.log('info', 'bridge', 'Bridge', 'WLAN %port_redirection_success% [80]');
					}
				});
			});
		}
		else
		{
			throw new Error('Minimal parameters not configurated. Please check the README! https://github.com/SynTexDZN/homebridge-syntex/blob/master/README.md');
		}
	}

	generateID()
	{
		return new Promise((resolve) => {

			this.getBridgeID().then((bridgeID) => {

				if(bridgeID != null)
				{
					resolve(false);
				}
				else
				{
					this.setBridgeID(new Date().getTime().toString(16)).then((success) => resolve(success));
				}
			});
		});
	}

	connectBridge(bridgeID, initBridge)
	{
		var url = 'http://syntex.sytes.net:8800/init-bridge?id=' + bridgeID + '&plugin=' + pluginName + '&version=' + pluginVersion + '&name=' + this.bridgeName;

		if(initBridge)
		{
			url += '&init=true';
		}

		axios.get(url).then((data) => {

			if(data != null && data.data != null)
			{
				this.bridgeID = data.data;

				if(data.data != this.bridgeID)
				{
					setTimeout(() => this.setBridgeID(this.bridgeID), 10000);
				}

				if(this.remote)
				{
					this.initWebSocket();
				}
			}
			else
			{
				setTimeout(() => this.connectBridge(bridgeID, initBridge), 30000);
			}

		}).catch((e) => {

			this.logger.err(e);

			setTimeout(() => this.connectBridge(bridgeID, initBridge), 30000);
		});
	}

	getSetupCode(username)
	{
		if(username != null)
		{
			this.files.readFile(path.join(this.api.user.storagePath(), 'persist', 'AccessoryInfo.' + username.split(':').join('') + '.json')).then((data) => {

				if(data != null)
				{
					if(data.pincode != null && data.category != null && data.setupID != null)
					{
						const buffer = Buffer.alloc(8);

						var valueLow = parseInt(data.pincode.replace(/-/g, ''), 10),
							valueHigh = data.category >> 1;

						valueLow |= 1 << 28;

						buffer.writeUInt32BE(valueLow, 4);

						if(data.category & 1)
						{
							buffer[4] = buffer[4] | 1 << 7;
						}

						buffer.writeUInt32BE(valueHigh, 0);

						let encodedPayload = (buffer.readUInt32BE(4) + (buffer.readUInt32BE(0) * Math.pow(2, 32))).toString(36).toUpperCase();
						
						if(encodedPayload.length !== 9)
						{
							for(let i = 0; i <= 9 - encodedPayload.length; i++)
							{
								encodedPayload = '0' + encodedPayload;
							}
						}

						this.pairingCode = 'X-HM://' + encodedPayload + data.setupID;
					}
				}
			});
		}
	}

	initWebSocket()
	{
		const isAlive = () => {

			clearTimeout(this.pingTimeout);

			this.pingTimeout = setTimeout(() => this.WebSocket.terminate(), 30000 + 1000);
		};

		const sendResponse = (path, response) => {

			this.WebSocket.send(JSON.stringify({ path, status : response.status, data : response.data }));
		};

		try
		{
			this.logger.debug('%remote_link_connecting% ..');

			this.WebSocket = new WebSocket('ws://syntex.sytes.net:8080/?id=' + this.bridgeID, { handshakeTimeout : 30000 });

			this.WebSocket.on('ping', () => isAlive());

			this.WebSocket.on('error', (e) => this.logger.err(e));

			this.WebSocket.on('open', () => {
				
				this.WebSocket.connected = true;

				isAlive();
				
				this.logger.log('success', 'bridge', 'Bridge', '%remote_link_connected%!');
			});

			this.WebSocket.on('close', () => {
				
				clearTimeout(this.pingTimeout);
				
				setTimeout(() => this.initWebSocket(), 3000);

				if(this.WebSocket.connected)
				{
					this.logger.log('warn', 'bridge', 'Bridge', '%remote_link_disconnected%!');
				}
				else
				{
					this.logger.log('error', 'bridge', 'Bridge', '%remote_link_connection_error%!');
				}

				this.WebSocket.connected = false;
			}); 

			this.WebSocket.on('message', (message) => {
				
				try
				{
					message = JSON.parse(message);

					if(this.password == '' || message.password == md5(this.password))
					{
						if(message.post != null)
						{
							axios.post('http://127.0.0.1:' + (message.port || this.port) + message.path, message.post).then((response) => sendResponse(message.path, response)).catch((error) => sendResponse(message.path, error.response));
						}
						else
						{
							axios.get('http://127.0.0.1:' + (message.port || this.port) + message.path).then((response) => sendResponse(message.path, response)).catch((error) => sendResponse(message.path, error.response));
						}
					}
					else
					{
						this.WebSocket.send(JSON.stringify({ path : message.path, status : 401, data : '' }));
					}
				}
				catch(e)
				{
					console.log(e);
				}
			});

			isAlive();
		}
		catch(e)
		{
			this.logger.err(e);

			setTimeout(() => this.initWebSocket(), 3000);
		}
	}

	initWebServer()
	{
		this.WebServer.addPage('/serverside/info', async (request, response) => {

			var infos = {
				name : this.bridgeName
			};

			response.write(JSON.stringify(infos));
			response.end();
		});

		this.WebServer.addPage('/serverside/init', (request, response, urlParams) => {
	
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
							this.logger.log('error', 'bridge', 'Bridge', 'Name %json_parse_error%! ( ' + res[1] + ')', e);
						}
					}

					response.write(res[1]);
					response.end();

					if(res[0] == 'Init')
					{
						this.restart = true;

						const { exec } = require('child_process');

						this.logger.log('warn', 'bridge', 'Bridge', '%restart_homebridge% ..');

						exec('sudo systemctl restart homebridge');
					}
					
				}).catch((e) => this.logger.err(e));
			}
		});

		this.WebServer.addPage('/serverside/init-accessory', (request, response, urlParams, content, postJSON) => {

			if(postJSON != null && postJSON.id != null && postJSON.name != null && postJSON.services != null)
			{
				DeviceManager.initAccessory(postJSON.id, postJSON.name, postJSON.services).then((res) => {

					response.write(res[1]);
					response.end();

					if(res[0] == 'Success')
					{
						this.restart = true;

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

		this.WebServer.addPage('/serverside/restart', (request, response) => {

			this.restart = true;

			const { exec } = require('child_process');
			
			response.write('Success');
			response.end();

			this.logger.log('warn', 'bridge', 'Bridge', '%restart_homebridge% ..');

			exec('sudo systemctl restart homebridge');
		});

		this.WebServer.addPage('/serverside/check-restart', (request, response) => {

			response.write(this.restart.toString());
			response.end();
		});

		this.WebServer.addPage('/serverside/version', async (request, response) => {

			const pJSON = require('./package.json');

			response.write(pJSON.version);
			response.end();
		});

		this.WebServer.addPage('/serverside/update', (request, response, urlParams) => {

			if(urlParams.status != null)
			{
				response.write(this.updating.toString());
				response.end();
			}
			else
			{
				var updateID = urlParams.plugin != null ? urlParams.plugin : pluginID;
				var version = urlParams.version != null ? urlParams.version : 'latest';

				this.updating = true;

				const { exec } = require('child_process');
				
				exec('sudo npm install ' + updateID + '@' + version + ' -g', (error, stdout, stderr) => {

					if(error || (stderr && stderr.includes('ERR!')))
					{
						this.logger.log('error', 'bridge', 'Bridge', '%bridge_update_error%!', (error || stderr));
					}
					else
					{
						this.logger.log('success', 'bridge', 'Bridge', '[' + updateID + '] %plugin_update_success[0]% [' + version + '] %plugin_update_success[1]%!');
						
						this.restart = true;

						this.logger.log('warn', 'bridge', 'Bridge', '%restart_homebridge% ..');
						
						exec('sudo systemctl restart homebridge');
					}

					this.updating = false;
				});

				response.write('Success');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/activity', async (request, response, urlParams) => {

			var result = {};

			if(urlParams.id != null)
			{
				var plugins = ['SynTexWebHooks', 'SynTexMagicHome', 'SynTexTuya', 'SynTexKNX'], activity = [];

				for(const p in plugins)
				{
					var a = await this.logger.load(plugins[p], urlParams.id);

					if(a != null)
					{
						activity = activity.concat(a);
					}
				}

				activity = activity.reverse();

				if(activity != null)
				{
					for(const i in activity)
					{
						if(activity[i].split('[').length > 6)
						{
							try
							{
								var time = activity[i].split('[')[1].split(']')[0];
								var letters = activity[i].split('[')[3].split(']')[0];
								var level = activity[i].split('[')[4].split(']')[0];
								var value = activity[i].split('[')[6].split(']')[0];

								if(time != null && letters != null && level != null && value != null)
								{
									if(result[letters] == null)
									{
										result[letters] = { update : [], success : [] };
									}

									if(level == 'Update' || level == 'Success')
									{
										result[letters][level.toLowerCase()].push({ t : time, v : value });
									}
								}
							}
							catch(e)
							{
								this.logger.log('error', 'bridge', 'Bridge', 'Log [' + activity[i] + '] %parse_error%!', e);
							}
						}
					}
				}
			}

			response.write(JSON.stringify(result));
			response.end();
		});

		this.WebServer.addPage('/serverside/log', (request, response) => {

			if(this.logger.logDirectory != null)
			{
				fs.readdir(this.logger.logDirectory, async (err, files) => {

					var obj = {};
	
					for(var i = 0; i < files.length; i++)
					{
						var file = files[i].split('.')[0];
						
						obj[file] = '[]';
	
						var logs = await this.logger.load(file, null);
	
						if(logs != null)
						{
							obj[file] = JSON.stringify(logs);
						}
					}
	
					response.write(JSON.stringify(obj));
					response.end();
				});
			}
			else
			{
				response.write('{}');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/syslog', (request, response) => {

			this.files.readFile('/var/log/syslog').then((data) => response.end(data != null ? data : 'Error'));
		});

		this.WebServer.addPage('/serverside/time', (request, response) => {

			var date = new Date();

			response.write('' + (date.getTime() / 1000 + -(date.getTimezoneOffset()) * 60 + 1));
			response.end();
		});

		this.WebServer.addPage('/serverside/offline-devices', (request, response) => {

			response.write(JSON.stringify(OfflineManager.getOfflineDevices()));
			response.end();
		});

		this.WebServer.addPage('/serverside/check-device', async (request, response, urlParams) => {

			if(urlParams.id != null)
			{
				var device = await DeviceManager.getConfigAccessory(urlParams.id);

				response.write(device != null ? 'Success' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/save-config', async (request, response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				response.write(await DeviceManager.setAccessoryValues(postJSON) ? 'Success' : 'Error'); 
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/automation', async (request, response) => {

			response.write(JSON.stringify(await Automation.loadAutomation())); 
			response.end();
		});

		this.WebServer.addPage('/serverside/create-automation', async (request, response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				response.write(await Automation.createAutomation(postJSON) ? 'Success' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/modify-automation', async (request, response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				response.write(await Automation.modifyAutomation(postJSON) ? 'Success' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/remove-automation', async (request, response, urlParams) => {

			if(urlParams.id != null)
			{
				response.write(urlParams.id ? await Automation.removeAutomation(urlParams.id) ? 'Success' : 'Error' : 'Error');
				response.end();
			}
		});

		this.WebServer.addPage('/serverside/reload-accessories', async (request, response) => {

			DeviceManager.reloadAccessories().then(() => response.end('Success'));
		});

		this.WebServer.addPage('/serverside/plugins', async (request, response, urlParams) => {

			if(urlParams.reload != null)
			{
				await PluginManager.reloadUpdates();
			}

			response.write(JSON.stringify(PluginManager.getPlugins()));
			response.end();
		});

		this.WebServer.addPage('/serverside/update-config', async (request, response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				DeviceManager.config = postJSON;

				DeviceManager.writeConfig().then((success) => response.end(success ? 'Success' : 'Error'));
			}
			else
			{
				response.end('Error');
			}
		});

		this.WebServer.addPage('/device', async (request, response, urlParams, content) => {

			response.write(HTMLQuery.sendValue(content, 'device', JSON.stringify(DeviceManager.getAccessory(urlParams.id))));
			response.end();
		});

		this.WebServer.addPage(['/', '/index', '/debug/workaround/', '/debug/workaround/index'], async (request, response, urlParams, content) => {

			var bridgeData = await this.files.readFile('info.json');

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

		this.WebServer.addPage(['/connect'], (request, response, urlParams, content) => {

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

		this.WebServer.addPage(['/bridge', '/debug/workaround/bridge'], async (request, response, urlParams, content) => {

			var obj = {
				bridgeID : null,
				bridgeIP : null,
				wlanMac : null,
				ethernetMac : null
			};

			if(this.bridgeID != null)
			{
				obj.bridgeID = this.bridgeID;
			}

			const ifaces = require('os').networkInterfaces();

			for(var dev in ifaces)
			{
				var iface = ifaces[dev].filter((details) => {

					return details.family === 'IPv4' && details.internal === false;
				});

				if(iface.length > 0) obj.bridgeIP = iface[0].address;
			}

			const { exec } = require('child_process');

			exec('cat /sys/class/net/wlan0/address', (error, wMac) => {

				if(wMac != null)
				{
					obj.wlanMac = wMac.replace(/\s/g, '');
				}
				
				exec('cat /sys/class/net/eth0/address', (error, eMac) => {

					if(eMac != null)
					{
						obj.ethernetMac = eMac.replace(/\s/g, '');
					}
					
					response.write(HTMLQuery.sendValues(content, obj));
					response.end();
				});
			});
		});

		this.WebServer.addPage('/crossover', (request, response, urlParams, content) => {

			var obj = [];
			var t = this.getPluginConfig('SynTexTuya');

			if(t != null)
			{
				obj.push({ name : 'SynTex Tuya' });
			}

			t = this.getPluginConfig('SynTexMagicHome');

			if(t != null)
			{
				obj.push({ name : 'SynTex MagicHome' });
			}

			response.write(HTMLQuery.sendValues(content, { crossoverPlugins : JSON.stringify(obj) }));
			response.end();
		});

		this.WebServer.addPage(['/automation/', '/automation/modify'], async (request, response, urlParams, content) => {

			response.write(HTMLQuery.sendValue(content, 'accessories', JSON.stringify(DeviceManager.getAccessories())));
			response.end();
		});

		this.WebServer.addPage('/debug/', (request, response, urlParams, content) => {

			fs.readdir(__dirname + '/debug/workaround/', async (err, files) => {

				var obj = {
					workaround: JSON.stringify(files)
				};
	
				response.write(HTMLQuery.sendValues(content, obj));
				response.end();
			});
		});

		this.WebServer.addPage('/debug/config', async (request, response, urlParams, content) => {

			this.files.readFile(this.api.user.storagePath() + '/config.json').then((config) => {

				if(config != null)
				{
					var obj = {
						configJSON: JSON.stringify(config)
					};

					response.write(HTMLQuery.sendValues(content, obj));
					response.end();
				}
			});
		});

		this.WebServer.addPage('/serverside/command', async (request, response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				const { exec } = require('child_process');
				
				exec(postJSON, (error, stdout, stderr) => {

					if(stderr || error)
					{
						response.write(stderr || error);
					}
					else
					{
						response.write(stdout != '' ? stdout : 'Success');
					}

					response.end();
				});
			}
		});

		this.WebServer.addPage('/serverside/characteristics', async (request, response, urlParams) => {

			var accessory = DeviceManager.getAccessory(urlParams.id);

			if(accessory != null && accessory.aid != null)
			{
				var promiseArray = [], states = {};
				
				if(urlParams.value != null)
				{
					var service = DeviceManager.getService(urlParams.id, urlParams.iid);

					if(service != null && service.iid != null && service.format != null)
					{
						var characteristics = ['value', 'hue', 'saturation', 'brightness'];

						for(const i in characteristics)
						{
							if(urlParams[characteristics[i]] != null)
							{
								try
								{
									states[characteristics[i]] = JSON.parse(urlParams[characteristics[i]]);
								}
								catch(e)
								{
									this.logger.log('error', 'bridge', 'Bridge', 'Characteristic [' + characteristics[i] + '] %parse_error%!', e);
								}
							}
						}

						for(const i in states)
						{
							var aid = accessory.aid, iid = service.iid[i], value = states[i];

							const newPromise = new Promise((resolve) => axios.put('http://localhost:51826/characteristics', { characteristics : [{ aid, iid, value }]}, { headers : { Authorization : '369-17-420' }}).then((res) => {

								resolve(res.data == '');

							}).catch((e) => { this.logger.log('error', 'bridge', 'Bridge', 'Characteristic [' + i + '] %update_error%!', e); resolve(false) }));

							promiseArray.push(newPromise);
						}

						Promise.all(promiseArray).then((result) => {

							response.write(result.includes(false) ? 'Error' : 'Success');
							response.end();
						});
					}
					else
					{
						response.write('Error');
						response.end();
					}
				}
				else
				{
					var services = DeviceManager.getServices(urlParams.id), typeCounter = {};

					for(const i in services)
					{
						if(typeCounter[services[i].type] == null)
						{
							typeCounter[services[i].type] = 0;
						}
						else
						{
							typeCounter[services[i].type]++;
						}

						var letters = typeToLetter(services[i].type) + typeCounter[services[i].type];

						for(const j in services[i].iid)
						{
							const newPromise = new Promise((resolve) => axios.get('http://localhost:51826/characteristics?id=' + accessory.aid + '.' + services[i].iid[j]).then(function (res) {

								if(res.data != null
								&& res.data.characteristics != null
								&& res.data.characteristics[0] != null
								&& res.data.characteristics[0].value != null)
								{
									var key = this.j == 'state' ? 'value' : this.j;

									if(states[this.letters] == null)
									{
										states[this.letters] = {};
									}

									if(services[i].format[j] == 'bool' || services[i].format[j] == 'boolean')
									{
										if(res.data.characteristics[0].value == 1)
										{
											states[this.letters][key] = true;
										}
										else if(res.data.characteristics[0].value == 0)
										{
											states[this.letters][key] = false;
										}
									}
									else
									{
										states[this.letters][key] = res.data.characteristics[0].value;
									}
								}

								resolve();

							}.bind({ letters, j })).catch((e) => this.logger.log('error', urlParams.id, letters, 'Characteristic %of% [' + (services[i].name || accessory.name) + '] %read_error%!', e.stack)));

							promiseArray.push(newPromise);
						}
					}

					Promise.all(promiseArray).then(() => {

						response.write(JSON.stringify(states));
						response.end();
					});
				}
			}
			else
			{
				response.write('Error');
				response.end();
			}
		});

		this.WebServer.addPage(['/debug/workaround/qr'], async (request, response, urlParams, content) => {

			response.write(HTMLQuery.sendValue(content, 'pairingCode', this.pairingCode));
			response.end();
		});

		this.WebServer.addPage(['/serverside/config'], async (request, response, urlParams, content, postJSON) => {

			if(postJSON != null)
			{
				this.setPluginConfig('SynTex', postJSON).then((success) => {

					response.write(success ? 'Success' : 'Error');
					response.end();
				});
			}
			else
			{
				this.getPluginConfig('SynTex').then((config) => {

					response.write(JSON.stringify(config));
					response.end();
				});
			}
		});
	}

	getPluginConfig(pluginName)
	{
		return new Promise((resolve) => {
			
			this.files.readFile(this.api.user.storagePath() + '/config.json').then((config) => {

				var found = false;

				if(config != null && config.platforms != null)
				{
					for(const i in config.platforms)
					{
						if(config.platforms[i].platform == pluginName)
						{
							found = true;

							resolve(config.platforms[i]);
						}
					}
				}

				if(!found)
				{
					resolve(null);
				}
			});
		});
	}

	setPluginConfig(pluginName, additionalConfig)
	{
		return new Promise((resolve) => {
			
			this.files.readFile(this.api.user.storagePath() + '/config.json').then((config) => {

				var found = false;

				if(config != null && config.platforms != null)
				{
					for(const i in config.platforms)
					{
						if(config.platforms[i].platform == pluginName)
						{
							found = true;

							for(const x in additionalConfig)
							{
								config.platforms[i][x] = additionalConfig[x];
							}

							this.files.writeFile(this.api.user.storagePath() + '/config.json', config).then((response) => {

								resolve(response.success);
							});
						}
					}
				}
				
				if(!found)
				{
					resolve(false);
				}
			});
		});
	}

	getBridgeID()
	{
		return new Promise((resolve) => {
			
			this.files.readFile('config.json').then((data) => {
				
				if(data != null && data.bridgeID != null)
				{
					resolve(data.bridgeID);
				}
				else
				{
					resolve(null);
				}
			});
		});
	}

	setBridgeID(bridgeID)
	{
		return new Promise((resolve) => {
			
			this.files.writeFile('config.json', { bridgeID }).then((response) => {
				
				if(!response.success)
				{
					this.logger.log('error', 'bridge', 'Bridge', '[bridgeID] %update_error%!');
				}

				resolve(response.success);
			});
		});
	}
}

function typeToLetter(type)
{
	var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet', 'led', 'dimmer'];
	var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

	return letters[types.indexOf(type.toLowerCase())];
}