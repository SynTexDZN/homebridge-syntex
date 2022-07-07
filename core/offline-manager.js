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

	checkConnection(device)
	{
		if(this.connections[device.ip] == null)
		{
			this.connections[device.ip] = 0;
		}

		axios.get('http://' + device.ip + '/', { timeout : 25000 }).then(() => {

			this.connections[device.ip] = 0;

			if(this.offline.includes(device.ip))
			{
				this.offline.splice(this.offline.indexOf(device.ip), 1);
			}

		}).catch(() => {

			if(this.connections[device.ip] < 2)
			{
				this.connections[device.ip]++;
			}
			else if(!this.offline.includes(device.ip))
			{
				this.offline.push(device.ip);
			}
		});
	}

	pingDevices()
	{
		for(const i in this.devices)
		{
			if(this.devices[i].ip != null)
			{
				this.checkConnection(this.devices[i]);
			}
		}
	}
}