const axios = require('axios');

module.exports = class UpdateManager
{
	constructor(interval, config)
	{
		this.config = config;

		this.newestDeviceVersions = {};
		this.newestPluginVersions = {};

		this.fetchDeviceUpdates(interval * 1000);
		this.fetchPluginUpdates(interval * 1000);

		this.updateDeviceInterval = setInterval(() => this.fetchDeviceUpdates(interval * 500), interval * 1000);
		this.updatePluginInterval = setInterval(() => this.fetchPluginUpdates(interval * 500), interval * 1000);
	}

	fetchPluginUpdates(timeout)
	{
		return new Promise((callback) => {

			var plugins = {};
			var promiseArray = [];

			this.config.load('config', (err, obj) => {    

				var pl = { 'SynTex' : 'homebridge-syntex', 'SynTexWebHooks' : 'homebridge-syntex-webhooks', 'SynTexTuya' : 'homebridge-syntex-tuya', 'SynTexMagicHome' : 'homebridge-syntex-magichome' };
	
				if(obj && !err)
				{       
					for(const p in obj.platforms)
					{
						if(obj.platforms[p].platform != null && obj.platforms[p].platform != 'config' && pl[obj.platforms[p].platform] != null)
						{
							plugins[obj.platforms[p].platform] = pl[obj.platforms[p].platform];
						}
					}
				}

				for(const i in plugins)
				{
					const newPromise = new Promise((resolve) => axios.get('http://registry.npmjs.org/-/package/' + plugins[i] + '/dist-tags', { timeout }).then((response) => {

						this.newestPluginVersions[i] = response.data;

						resolve(true);

					}).catch((e) => { console.error(e); resolve(false) }));

					promiseArray.push(newPromise);
				}

				Promise.all(promiseArray).then(() => callback());
			});
		});
	}

	fetchDeviceUpdates(timeout)
	{
		return new Promise((resolve) => {

			axios.get('http://syntex.sytes.net/smarthome/check-version.php', { timeout }).then((response) => {

				var updates = response.data;

				for(const update in updates)
				{
					if(!updates[update].type.startsWith('SynTex'))
					{
						this.newestDeviceVersions[updates[update].type] = updates[update].version;
					}
				}

				resolve(true);

			}).catch((e) => { console.error(e); resolve(false) });
		});
	}

	getLatestVersions()
	{
		return { plugins : this.newestPluginVersions, devices : this.newestDeviceVersions } || { plugins : {}, devices : {} };
	}
}