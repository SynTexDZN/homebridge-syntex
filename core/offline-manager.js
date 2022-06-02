const axios = require('axios');

module.exports = class OfflineManager
{
	constructor(logger)
	{
		this.devices = [];
		this.offline = [];

		this.connections = {};

		this.logger = logger;
	}

	setDevices(devices)
	{
		this.devices = devices;

		if(this.checkInterval == null)
		{
			this.checkInterval = setInterval(() => this.pingDevices(), 30000);

			this.pingDevices();
		}
	}

	getOfflineDevices()
	{
		return this.offline;
	}

	checkConnection(ip)
	{
		if(this.connections[ip] == null)
		{
			this.connections[ip] = 0;
		}

		axios.get('http://' + ip + '/', { timeout : 25000 }).then(() => {

			this.connections[ip] = 0;

			if(this.offline.includes(ip))
			{
				this.offline.splice(this.offline.indexOf(ip), 1);
			}

		}).catch(() => {

			if(this.connections[ip] < 2)
			{
				this.connections[ip]++;
			}
			else if(!this.offline.includes(ip))
			{
				this.offline.push(ip);
			}
		});
	}

	pingDevices()
	{
		for(const i in this.devices)
		{
			if(this.devices[i].ip != null)
			{
				this.checkConnection(this.devices[i].ip);
			}
		}
	}
}