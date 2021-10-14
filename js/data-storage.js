class DataStorage
{
	constructor()
	{
		this.data = {};

		if(localStorage.getItem('active-user') != null)
		{
			this.session = localStorage.getItem('active-user');
		}

		if(localStorage.getItem('bridge-id') != null)
		{
			this.bridge = localStorage.getItem('bridge-id');
		}

		if(window.location.protocol == 'http:')
		{
			this.setSession('local');
		}

		for(var i = 0; i < localStorage.length; i++)
		{
			var key = localStorage.key(i);

			if(key != 'active-user' && key != 'bridge-id' && key != 'bridge-password')
			{
				try
				{
					this.data[key] = JSON.parse(localStorage.getItem(key));
				}
				catch(e)
				{
					this.data[key] = localStorage.getItem(key);
				}
			}
		}
	}

	setSession(sessionID)
	{
		this.session = sessionID;

		localStorage.setItem('active-user', sessionID);
	}

	setBridge(bridgeID, bridgePassword)
	{
		this.bridge = bridgeID;

		localStorage.setItem('bridge-id', bridgeID);
		localStorage.setItem('bridge-password', bridgePassword);
	}

	getItem(key)
	{
		var sessionStorage = this.data[this.session];

		if(sessionStorage != null)
		{
			var bridgeStorage = sessionStorage.bridges[this.bridge];

			if(bridgeStorage != null)
			{
				return bridgeStorage.settings[key];
			}
		}

		return null;
	}

	setItem(key, value)
	{
		if(this.session != null && this.data[this.session] != null)
		{
			if(this.bridge != null)
			{
				console.log(this.data[this.session].bridges[this.bridge]);

				if(this.data[this.session].bridges[this.bridge] != null && this.data[this.session].bridges[this.bridge].settings != null)
				{
					this.data[this.session].bridges[this.bridge].settings[key] = value;
				}
			}
			else
			{
				this.data[this.session][key] = value;
			}

			try
			{
				localStorage.setItem(this.session, JSON.stringify(this.data[this.session]));

				return true;
			}
			catch(e)
			{
				console.error(e);
			}
		}

		return false;
	}

	setBridges(bridges)
	{
		if(this.session != null)
		{
			for(const id in bridges)
			{
				if(bridges.settings == null)
				{
					bridges[id].settings = {};s
				}
			}

			if(this.data[this.session] == null)
			{
				this.data[this.session] = {};
			}

			this.data[this.session].bridges = bridges;

			try
			{
				localStorage.setItem(this.session, JSON.stringify(this.data[this.session]));

				return true;
			}
			catch(e)
			{
				console.error(e);
			}
		}

		return false;
	}

	getBridges()
	{
		if(this.session != null && this.data[this.session] != null)
		{
			return this.data[this.session].bridges;
		}

		return null;
	}
}

window.Storage = new DataStorage();