class AppSettingsManager
{
	constructor()
	{
		try
		{
			this.settings = JSON.parse(localStorage.getItem('app-settings')) || {};
		}
		catch(e)
		{
			console.error(e);
		}
	}

	getItem(key)
	{
		return this.settings[key];
	}

	setItem(key, value)
	{
		this.settings[key] = value;

		localStorage.setItem('app-settings', JSON.stringify(this.settings));
	}

	getSettings()
	{
		return this.settings;
	}
}

export let AppSettings = new AppSettingsManager();