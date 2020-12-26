const store = require('json-fs-store');
var prefix, logs, logger, debugLevel = 'success', allLogs = {}, ready = false;

module.exports = class Logger
{
	constructor(pluginName, logDirectory, debug)
	{
		prefix = pluginName;
		logs = store(logDirectory);
		logger = this;

		if(debug)
		{
			debugLevel = 'debug';
		}

		allLogs.id = pluginName;

		logs.load(pluginName, (err, obj) => {    

			if(obj && !err)
			{
				for(const id in obj)
				{
					if(id != 'id')
					{
						for(const letters in obj[id])
						{
							if(allLogs[id] == null)
							{
								allLogs[id] = {};
							}

							if(allLogs[id][letters] == null)
							{
								allLogs[id][letters] = [];
							}

							allLogs[id][letters] = obj[id][letters].concat(allLogs[id][letters]);
						}
					}
				}

				removeExpired();

				logs.add(allLogs, (err) => {

					if(err)
					{
						logger.log('error', 'bridge', 'Bridge', prefix + '.json konnte nicht aktualisiert werden! ' + err); // REMOVE?
					}

					ready = true;
				});
			}
			else
			{
				ready = true;
			}
		});
	}

	log(level, id, letters, message)
	{
		var levels = ['debug', 'success', 'update', 'read', 'info', 'warn', 'error'];

		if(levels.indexOf(level) >= levels.indexOf(debugLevel))
		{
			if(typeof message !== 'string')
			{
				message = JSON.stringify(message);
			};

			var color = '';

			if(level == 'success')
			{
				color = '\x1b[92m';
			}
			else if(level == 'update')
			{
				color = '\x1b[96m';
			}
			else if(level == 'read')
			{
				color = '\x1b[36m';
			}
			else if(level == 'info')
			{
				color = '\x1b[93m';
			}
			else if(level == 'warn')
			{
				color = '\x1b[93m';
			}
			else if(level == 'debug')
			{
				color = '\x1b[35m';
			}
			else
			{
				color = '\x1b[31m';
			}

			console.log('[' + prefix + '] ' + color + '[' + level.toUpperCase() + '] \x1b[0m' + message);

			saveLog(level[0].toUpperCase() + level.substring(1), id, letters, Math.round(new Date().getTime() / 1000), message);
		}
	}

	err(error)
	{
		var s = (error.stack.split('\n')[1].split('\n')[0].match(/\//g) || []).length;
		
		this.log('error', 'bridge', 'Bridge', 'Code Fehler: ' + error.message + ' ( [' + error.stack.split('\n')[1].split('\n')[0].split('/')[s].split(':')[0] + '] bei Zeile [' + error.stack.split('\n')[1].split('\n')[0].split('/')[s].split(':')[1] + '] )');
	
		console.log(error);
	}

	debug(message)
	{
		this.log('debug', 'bridge', 'Bridge', message);
	}

	load(pluginName, group)
	{
		return new Promise((resolve) => {
			
			logs.load(pluginName, (err, obj) => {    

				if(obj && !err)
				{    
					var l = [];

					for(const i in obj)
					{
						if(i != 'id' && (group == null || group == i))
						{
							l.push(obj[i]);
						}
					}

					resolve(l);
				}
				else
				{
					resolve(null);
				}
			});
		});
	}

	list()
	{
		return new Promise((resolve) => {

			logs.list((err, objects) => {

				if(!objects || err)
				{
					resolve([]);
				}
				else
				{
					resolve(objects);
				}
			});
		});
	}
}

function saveLog(level, id, letters, time, message)
{
	if(allLogs[id] == null)
	{
		allLogs[id] = {};
	}

	if(allLogs[id][letters] == null)
	{
		allLogs[id][letters] = [];
	}

	removeExpired();

	allLogs[id][letters].push({ t : time, l : level, m : message });

	if(ready)
	{
		logs.add(allLogs, (err) => {

			if(err)
			{
				logger.log('error', 'bridge', 'Bridge', prefix + '.json konnte nicht aktualisiert werden! ' + err); // REMOVE?
			}
		});
	}
}

function removeExpired()
{
	for(const i in allLogs)
	{
		if(i != 'id')
		{
			for(const j in allLogs[i])
			{
				for(var k = 1; k < allLogs[i][j].length + 1; k++)
				{
					var time = allLogs[i][j][allLogs[i][j].length - k].t;

					if(new Date() - new Date(time * 1000) > 86400000)
					{
						allLogs[i][j].splice(allLogs[i][j].length - k, 1);
					}
				}
			}
		}
	}
}