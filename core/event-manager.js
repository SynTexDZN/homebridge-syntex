module.exports = class EventManager
{
	constructor(platform)
	{
		this.pluginName = platform.pluginName;
        this.logger = platform.logger;
        
		process.setMaxListeners(512);
    }

    setInputStream(stream, options, callback)
	{
		process.on(stream, (filter, message) => {
			
			var receiver = filter.receiver != null ? JSON.stringify(filter.receiver) : null,
				destination = options.destination != null ? JSON.stringify(options.destination) : null;

			if(options.external == true || this.pluginName == filter.pluginName)
			{
				if((filter.sender == null || filter.sender != options.source)
				&& (receiver == null || receiver == destination))
				{
					this.logger.debug('<<< [' + filter.pluginName + '] ' + stream + (receiver != null ? ' [' + receiver + '] ' : ' ') + JSON.stringify(message));
					
					callback(message);
				}
			}
		});
	}

	setOutputStream(stream, options, message)
	{
		var receiver = options.receiver != null ? JSON.stringify(options.receiver) : null;

        this.logger.debug('>>> [' + this.pluginName + '] ' + stream + (receiver != null ? ' [' + receiver + '] ' : ' ') + JSON.stringify(message));

		process.emit(stream, { ...options, pluginName : this.pluginName }, message);
	}
}