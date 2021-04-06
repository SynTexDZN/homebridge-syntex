const axios = require('axios');

var temp = [], offline = [];

module.exports = class OfflineManager
{
	constructor(logger, devices)
	{
		this.logger = logger;

		pingDevices(devices);
	}

	getOfflineDevices()
	{
		return offline;
	}
}

function checkConnection(ip)
{
	axios.get('http://' + ip + '/', { timeout : 25000 }).then(() => {

		if(temp.includes(ip))
		{
			temp.splice(temp.indexOf(ip), 1);
		}
		
		if(offline.includes(ip))
		{
			offline.splice(offline.indexOf(ip), 1);
		}		

	}).catch(() => {

		if(!temp.includes(ip))
		{
			temp.push(ip);
		}
		else if(!offline.includes(ip))
		{
			offline.push(ip);
		}
	});
}

function pingDevices(devices)
{
	for(var i = 0; i < devices.length; i++)
	{
		if(devices[i].ip != undefined)
		{
			checkConnection(devices[i].ip);
		}
	}

	setTimeout(() => pingDevices(devices), 30000);
}