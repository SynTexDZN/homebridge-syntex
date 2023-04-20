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

		if(window.location.hostname != 'syntex-cloud.com')
		{
			this.setSession('local');
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

		this.prepareStructure();
	}

	setClient(clientID)
	{
		if(clientID != null)
		{
			this.remote['client-id'] = clientID;

			try
			{
				localStorage.setItem('remote', JSON.stringify(this.remote));
			}
			catch(e)
			{
				console.error(e);
			}

			if(window.ServiceWorker != null)
			{
				window.ServiceWorker.sendMessage({ clientID });
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

			this.prepareStructure();

			if(window.ServiceWorker != null)
			{
				window.ServiceWorker.sendMessage({ sessionID });
			}
		}
	}

	resetSession()
	{
		this.remote = {};
		
		try
		{
			localStorage.removeItem('remote');
		}
		catch(e)
		{
			console.error(e);
		}

		if(window.ServiceWorker != null)
		{
			window.ServiceWorker.sendMessage({ sessionID : 'RESET' });
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
	}

	getItem(key)
	{
		if(this.checkStructure() == 'local' && key != 'notifications')
		{
			return this.data[this.remote['session-id']].bridges[this.remote['bridge-id']].data[key];
		}
		else if(this.checkStructure() != null)
		{
			return this.data[this.remote['session-id']].data[key];
		}

		return null;
	}

	setItem(key, value)
	{
		if(this.checkStructure() == 'local' && key != 'notifications')
		{
			this.data[this.remote['session-id']].bridges[this.remote['bridge-id']].data[key] = value;
		}
		else if(this.checkStructure() != null)
		{
			this.data[this.remote['session-id']].data[key] = value;
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
		if(this.checkStructure() == 'local' && key != 'notifications')
		{
			delete this.data[this.remote['session-id']].bridges[this.remote['bridge-id']].data[key];
		}
		else if(this.checkStructure() != null)
		{
			delete this.data[this.remote['session-id']].data[key];
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
				if(bridges[id].data == null)
				{
					bridges[id].data = {};
				}
			}

			if(this.data[this.remote['session-id']] == null)
			{
				this.data[this.remote['session-id']] = { data : {} };
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
			return this.data[this.remote['session-id']].bridges[this.remote['bridge-id']].data;
		}
		else if(this.checkStructure() == 'global')
		{
			return this.data[this.remote['session-id']].data;
		}

		return null;
	}

	checkSession()
	{
		return this.remote['session-id'] != null;
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
				if(sessionStorage.bridges instanceof Object && sessionStorage.bridges[this.remote['bridge-id']] instanceof Object && sessionStorage.bridges[this.remote['bridge-id']].data instanceof Object)
				{
					return 'local';
				}
			}
			else if(sessionStorage.data instanceof Object)
			{
				return 'global';
			}
		}

		return null;
	}

	prepareStructure()
	{
		if(this.checkSession() && this.data[this.remote['session-id']] == null)
		{
			this.data[this.remote['session-id']] = { data : {} };

			localStorage.setItem(this.remote['session-id'], JSON.stringify(this.data[this.remote['session-id']]));
		}
	}
}

window.Storage = new DataStorage();