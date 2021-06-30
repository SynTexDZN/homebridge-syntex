const axios = require('axios');

module.exports = class UpdateManager
{
	constructor(interval, config)
	{
		this.config = config;
		this.newestDeviceVersions = {};

		this.fetchDeviceUpdates(interval * 1000);

		this.updateDeviceInterval = setInterval(() => this.fetchDeviceUpdates(interval * 500), interval * 1000);
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
		return this.newestDeviceVersions || {};
	}
}