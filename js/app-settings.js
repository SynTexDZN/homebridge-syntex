class AppSettingsManager
{
	constructor()
	{
		try
		{
			this.settings = Storage.getItem('app-settings') || {};
		}
		catch(e)
		{
			console.error(e);
		}
	}

	getItem(key)
	{
		if(this.settings[this.getBridgeID()] != null)
		{
			return this.settings[this.getBridgeID()][key];
		}

		return null;
	}

	setItem(key, value)
	{
		if(this.settings[this.getBridgeID()] == null)
		{
			this.settings[this.getBridgeID()] = {};
		}

		this.settings[this.getBridgeID()][key] = value;

		Storage.setItem('app-settings', this.settings);
	}

	getSettings()
	{
		return this.settings[this.getBridgeID()];
	}

	getBridgeID()
	{
		return localStorage.getItem('bridge-id') || window.location.hostname;
	}
}

export let AppSettings = new AppSettingsManager();