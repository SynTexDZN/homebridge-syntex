const axios = require('axios');

module.exports = class UpdateManager
{
	constructor(logger, interval)
	{
		this.newestDeviceVersions = {};
		
		this.logger = logger;

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

			}).catch((e) => { this.logger.log('error', 'bridge', 'Bridge', '%device_versions_read_error%!', e); resolve(false) });
		});
	}

	getLatestVersions()
	{
		return this.newestDeviceVersions || {};
	}
}