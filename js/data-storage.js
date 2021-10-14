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

			this.data['local'] = { settings : {} };
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
		if(sessionID != null)
		{
			this.session = sessionID;

			localStorage.setItem('active-user', sessionID);
		}
	}

	setBridge(bridgeID, bridgePassword)
	{
		if(bridgeID != null)
		{
			this.bridge = bridgeID;

			localStorage.setItem('bridge-id', bridgeID);
		}

		if(bridgePassword != null)
		{
			localStorage.setItem('bridge-password', bridgePassword);
		}
	}

	getItem(key)
	{
		if(this.checkStructure() == 'local')
		{
			return this.data[this.session].bridges[this.bridge].settings[key];
		}
		else if(this.checkStructure() == 'global')
		{
			return this.data[this.session].settings[key];
		}

		return null;
	}

	setItem(key, value)
	{
		if(this.checkStructure() == 'local')
		{
			this.data[this.session].bridges[this.bridge].settings[key] = value;
		}
		else if(this.checkStructure() == 'global')
		{
			this.data[this.session].settings[key] = value;
		}

		if(this.checkStructure() != null)
		{
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
		if(this.checkSession())
		{
			return this.data[this.session].bridges;
		}

		return null;
	}

	setBridges(bridges)
	{
		if(this.session != null)
		{
			for(const id in bridges)
			{
				if(bridges[id].settings == null)
				{
					bridges[id].settings = {};
				}
			}

			if(this.data[this.session] == null)
			{
				this.data[this.session] = { settings : {} };
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

	getSettings()
	{
		if(this.checkStructure() == 'local')
		{
			return this.data[this.session].bridges[this.bridge].settings;
		}
		else if(this.checkStructure() == 'global')
		{
			return this.data[this.session].settings;
		}

		return null;
	}

	checkSession()
	{
		return this.session != null && this.data[this.session] != null;
	}

	checkBridge()
	{
		return this.bridge != null;
	}

	checkStructure()
	{
		if(this.checkSession())
		{
			var sessionStorage = this.data[this.session];

			if(this.checkBridge())
			{
				if(typeof sessionStorage.bridges == 'object' && typeof sessionStorage.bridges[this.bridge] == 'object' && typeof sessionStorage.bridges[this.bridge].settings == 'object')
				{
					return 'local';
				}
			}
			else if(typeof sessionStorage.settings == 'object')
			{
				return 'global';
			}
		}

		return null;
	}
}

window.Storage = new DataStorage();