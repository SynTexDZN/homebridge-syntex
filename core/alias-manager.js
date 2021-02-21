const path = require('path');
const EventEmitter = require('events').EventEmitter;

let pluginAlias;
let pluginType;

let callbacks = {}, alias = { id : 'alias' }, storage;

const HomebridgeApiMock = {

	registerPlatform(pluginIdentifier, platformName, constructor)
	{
		pluginType = 'platform';

		if(typeof platformName === 'function')
		{
			constructor = platformName;
			platformName = pluginIdentifier;
			pluginAlias = platformName;
		}
		else
		{
			pluginAlias = platformName;
		}

		alias[this.id] = pluginAlias;
		callbacks[this.id](pluginAlias);

		setAlias();
	},
	registerAccessory(pluginIdentifier, accessoryName, constructor)
	{
		pluginType = 'accessory';

		if(typeof accessoryName === 'function')
		{
			constructor = accessoryName;
			accessoryName = pluginIdentifier;
			pluginAlias = accessoryName;
		}
		else
		{
			pluginAlias = accessoryName;
		}

		alias[this.id] = pluginAlias;
		callbacks[this.id](pluginAlias);

		setAlias();
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

//setTimeout(() => process.exit(1), 2500);

module.exports = class AliasExtractor
{
	constructor(Storage)
	{
		storage = Storage;
		
		//setTimeout(() => process.exit(1), 2500);
	}

	loadAlias()
	{
		return new Promise((resolve) => {

			storage.load('alias', (err, json) => {

				if(!err && json)
				{
					alias = json;
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

				//process.exit();
				setTimeout(() => process.exit(1), 2500);
			}
			catch(e)
			{
				console.error(e);

				process.exit(1);
			}
		}
		else
		{
			console.log('ALIAS BEREITS IM CACHE', pluginID);

			callback(alias[pluginID]);
		}
	}
}

function setAlias()
{
	alias.id = 'alias';

	storage.add(alias, (err) => {

		if(err)
		{
			console.error(err);
		}
		else
		{
			console.log('ALIAS IM CACHE GESPEICHERT', alias);
		}
	});
}