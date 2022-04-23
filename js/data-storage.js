class DataStorage
{
	constructor()
	{
		this.data = {};
		this.remote = {};

		if(localStorage.getItem('remote') != null)
		{
			try
			{
				this.remote = JSON.parse(localStorage.getItem('remote'));
			}
			catch(e)
			{
				console.error(e);
			}
		}

		if(window.location.protocol == 'http:')
		{
			this.setSession('local');

			this.data['local'] = { settings : {} };
		}

		for(var i = 0; i < localStorage.length; i++)
		{
			var key = localStorage.key(i);

			if(key != 'remote')
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
			this.remote['session-id'] = sessionID;

			try
			{
				localStorage.setItem('remote', JSON.stringify(this.remote));
			}
			catch(e)
			{
				console.error(e);
			}
		}
	}

	resetSession()
	{
		delete this.remote['session-id'];
		delete this.remote['last-bridge-id'];
		
		try
		{
			localStorage.setItem('remote', JSON.stringify(this.remote));
		}
		catch(e)
		{
			console.error(e);
		}
	}

	setBridge(bridgeID, bridgePassword)
	{
		if(bridgeID != null)
		{
			this.remote['bridge-id'] = bridgeID;
			this.remote['last-bridge-id'] = bridgeID;
		}

		if(bridgePassword != null)
		{
			this.remote['bridge-password'] = bridgePassword;
		}

		try
		{
			localStorage.setItem('remote', JSON.stringify(this.remote));
		}
		catch(e)
		{
			console.error(e);
		}
	}

	getRemote(key)
	{
		return this.remote[key];
	}

	resetRemote()
	{
		delete this.remote['bridge-id'];
		delete this.remote['bridge-password'];

		try
		{
			localStorage.setItem('remote', JSON.stringify(this.remote));
		}
		catch(e)
		{
			console.error(e);
		}

		if(navigator.serviceWorker.controller != null)
		{
			navigator.serviceWorker.controller.postMessage({ resetRemote : true });
		}
	}

	getItem(key)
	{
		if(this.checkStructure() == 'local')
		{
			return this.data[this.remote['session-id']].bridges[this.remote['bridge-id']].settings[key];
		}
		else if(this.checkStructure() == 'global')
		{
			return this.data[this.remote['session-id']].settings[key];
		}

		return null;
	}

	setItem(key, value)
	{
		if(this.checkStructure() == 'local')
		{
			this.data[this.remote['session-id']].bridges[this.remote['bridge-id']].settings[key] = value;
		}
		else if(this.checkStructure() == 'global')
		{
			this.data[this.remote['session-id']].settings[key] = value;
		}

		if(this.checkStructure() != null)
		{
			try
			{
				localStorage.setItem(this.remote['session-id'], JSON.stringify(this.data[this.remote['session-id']]));

				return true;
			}
			catch(e)
			{
				console.error(e);
			}
		}

		return false;
	}

	removeItem(key)
	{
		if(this.checkStructure() == 'local')
		{
			delete this.data[this.remote['session-id']].bridges[this.remote['bridge-id']].settings[key];
		}
		else if(this.checkStructure() == 'global')
		{
			delete this.data[this.remote['session-id']].settings[key];
		}

		if(this.checkStructure() != null)
		{
			try
			{
				localStorage.setItem(this.remote['session-id'], JSON.stringify(this.data[this.remote['session-id']]));

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
			return this.data[this.remote['session-id']].bridges;
		}

		return null;
	}

	setBridges(bridges)
	{
		if(this.remote['session-id'] != null)
		{
			for(const id in bridges)
			{
				if(bridges[id].settings == null)
				{
					bridges[id].settings = {};
				}
			}

			if(this.data[this.remote['session-id']] == null)
			{
				this.data[this.remote['session-id']] = { settings : {} };
			}

			this.data[this.remote['session-id']].bridges = bridges;

			try
			{
				localStorage.setItem(this.remote['session-id'], JSON.stringify(this.data[this.remote['session-id']]));

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
			return this.data[this.remote['session-id']].bridges[this.remote['bridge-id']].settings;
		}
		else if(this.checkStructure() == 'global')
		{
			return this.data[this.remote['session-id']].settings;
		}

		return null;
	}

	checkSession()
	{
		return this.remote['session-id'] != null && this.data[this.remote['session-id']] != null;
	}

	checkBridge()
	{
		return this.remote['bridge-id'] != null;
	}

	checkStructure()
	{
		if(this.checkSession())
		{
			var sessionStorage = this.data[this.remote['session-id']];

			if(this.checkBridge())
			{
				if(sessionStorage.bridges instanceof Object && sessionStorage.bridges[this.remote['bridge-id']] instanceof Object && sessionStorage.bridges[this.remote['bridge-id']].settings instanceof Object)
				{
					return 'local';
				}
			}
			else if(sessionStorage.settings instanceof Object)
			{
				return 'global';
			}
		}

		return null;
	}
}

window.Storage = new DataStorage();