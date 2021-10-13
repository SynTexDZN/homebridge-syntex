class DataStorage
{
	constructor()
	{
		this.data = {};

		if(localStorage.getItem('active-user') != null)
		{
			this.activeUser = localStorage.getItem('active-user');
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
		this.activeUser = sessionID;

		if(this.data[sessionID] == null)
		{
			this.data[sessionID] = {};
		}

		localStorage.setItem('active-user', sessionID);
	}

	getItem(key)
	{
		var data = this.data[this.activeUser];

		if(data != null)
		{
			return data[key];
		}

		return null;
	}

	setItem(key, value)
	{
		var data = this.data[this.activeUser];

		if(data != null)
		{
			data[key] = value;

			try
			{
				localStorage.setItem(this.activeUser, JSON.stringify(data));

				return true;
			}
			catch(e)
			{
				console.error(e);
			}
		}

		return false;
	}
}

window.Storage = new DataStorage();