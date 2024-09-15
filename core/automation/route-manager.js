module.exports = class RouteManager
{
	constructor(platform)
	{
		this.plugins = [];

		this.logger = platform.logger;
		this.files = platform.files;

		if(platform.api.user.storagePath() != null)
		{
			this.files.readFile(platform.api.user.storagePath() + '/config.json').then((data) => {

				if(data != null && data.platforms != null)
				{
					for(const platform of data.platforms)
					{
						if(platform.platform != 'SynTex' && platform.baseDirectory != null && (platform.port != null || (platform.options != null && platform.options.port != null)))
						{
							this.plugins.push({ name : platform.platform, port : (platform.port || platform.options.port) });
						}
					}
				}
				
			}).catch(() => {});
		}
	}

	getPort(pluginName)
	{
		if(pluginName != null)
		{
			for(const plugin of this.plugins)
			{
				if(plugin.name == pluginName)
				{
					return plugin.port;
				}
			}
		}

		return null;
	}
}