module.exports = class RouteManager
{
	constructor(logger, files, configPath)
	{
		this.plugins = [];

		this.logger = logger;
		this.files = files;

		if(configPath != null)
		{
			this.files.readFile(configPath + '/config.json').then((data) => {

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