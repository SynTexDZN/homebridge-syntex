class AppSettingsManager
{
	constructor()
	{
		try
		{
			this.id = localStorage.getItem('bridge-id') || window.location.hostname;
			this.allSettings = JSON.parse(localStorage.getItem('app-settings')) || {};
			this.settings = this.allSettings[this.id] || {};
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

		this.allSettings[this.id] = this.settings;

		localStorage.setItem('app-settings', JSON.stringify(this.allSettings));
	}

	getSettings()
	{
		return this.settings;
	}
}

export let AppSettings = new AppSettingsManager();