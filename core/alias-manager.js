const path = require('path');

const EventEmitter = require('events').EventEmitter;

let aliasManager, pluginAlias, callbacks = {}, alias = {};

const HomebridgeApiMock = {

	registerPlatform(pluginIdentifier, platformName)
	{
		if(typeof platformName === 'function')
		{
			platformName = pluginIdentifier;
			pluginAlias = platformName;
		}
		else
		{
			pluginAlias = platformName;
		}

		alias[this.id] = pluginAlias;
		callbacks[this.id](pluginAlias);

		aliasManager.setAlias();
	},
	registerAccessory(pluginIdentifier, accessoryName)
	{
		if(typeof accessoryName === 'function')
		{
			accessoryName = pluginIdentifier;
			pluginAlias = accessoryName;
		}
		else
		{
			pluginAlias = accessoryName;
		}

		alias[this.id] = pluginAlias;
		callbacks[this.id](pluginAlias);

		aliasManager.setAlias();
	},
	version: 2.5,
	serverVersion: '1.2.3',
	on: () => { /** mock */ },
	emit: () => { /** mock */ },
	hap: {
		Characteristic: new class Characteristic extends EventEmitter
		{
			constructor()
			{
				super();

				return new Proxy(this, {
					get() {
						return {
							UUID: '0000003E-0000-1000-8000-0026BB765291',
						};
					}
				});
			}
		},
		Service: {},
		AccessoryLoader: {},
		Accessory: {},
		Bridge: {},
		uuid: {
			generate: () => { /** mock */ }
		}
	},
	platformAccessory() {
		return {
			addService() { /** mock */ },
			getService() { /** mock */ },
			removeService() { /** mock */ },
			context() { /** mock */ },
			services() { /** mock */ }
		};
	},
	registerPlatformAccessories() { /** mock */ },
	unregisterPlatformAccessories() { /** mock */ },
	publishExternalAccessories() { /** mock */ },
	updatePlatformAccessories() { /** mock */ },
	user: {
		configPath()
		{
			return path.join(process.cwd(), 'config.json');
		},
		storagePath()
		{
			return process.cwd();
		},
		cachedAccessoryPath()
		{
			return path.join(process.cwd(), 'accessories');
		},
		persistPath()
		{
			return path.join(process.cwd(), 'persist');
		}
	}
};

module.exports = class AliasExtractor
{
	constructor(platform)
	{
		this.logger = platform.logger;
		this.files = platform.files;

		aliasManager = this;
	}

	loadAlias()
	{
		return new Promise((resolve) => {

			this.files.readFile('alias.json').then((data) => {

				if(data != null)
				{
					alias = data;
				}

				resolve();
			});
		});
	}

	getAlias(pluginID, callback)
	{
		if(alias[pluginID] == null)
		{
			callbacks[pluginID] = callback;

			try
			{
				const pluginModules = require(pluginID);

				let pluginInitializer;

				if(typeof pluginModules === 'function')
				{
					pluginInitializer = pluginModules;
				}
				else if(pluginModules && typeof pluginModules.default === 'function')
				{
					pluginInitializer = pluginModules.default;
				}
				else
				{
					throw new Error(`Plugin ${pluginID} does not export a initializer function from main.`);
				}

				HomebridgeApiMock.id = pluginID;

				pluginInitializer(HomebridgeApiMock);

				setTimeout(() => process.exit(1), 2500);
			}
			catch(e)
			{
				this.logger.err(e);

				process.exit(1);
			}
		}
		else
		{
			callback(alias[pluginID]);
		}
	}

	setAlias()
	{
		this.files.writeFile('alias.json', alias);
	}
}