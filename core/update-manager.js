module.exports = class UpdateManager
{
	constructor(platform, interval)
	{
		this.newestDeviceVersions = {};
		
		this.logger = platform.logger;

		this.RequestManager = platform.RequestManager;

		this.fetchDeviceUpdates(interval * 1000);

		this.updateDeviceInterval = setInterval(() => this.fetchDeviceUpdates(interval * 500), interval * 1000);
	}

	fetchDeviceUpdates(timeout)
	{
		return new Promise((resolve) => {

			this.RequestManager.fetch('http://syntex-cloud.com:8888/check-version', { timeout }).then((response) => {

				if(Array.isArray(response.data))
				{
					for(const update in response.data)
					{
						if(!response.data[update].type.startsWith('SynTex'))
						{
							this.newestDeviceVersions[response.data[update].type] = response.data[update].version;
						}
					}

					resolve(true);
				}
				else
				{
					this.logger.log('error', 'bridge', 'Bridge', '%device_versions_read_error%!', response.error || '');
				
					resolve(false);
				}
			});
		});
	}

	getLatestVersions()
	{
		return this.newestDeviceVersions || {};
	}
}