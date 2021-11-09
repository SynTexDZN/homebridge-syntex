class PresetManager
{
	constructor()
	{
		this.presets = {
			SynTex : {
				name : 'SynTex Real Device',
				getResetURL : (device, params) => { return 'http://' + device.ip + '/reset?type=' + params.type },
				getRestartURL : (device) => { return 'http://' + device.ip + '/restart' },
				getReconnectURL : (device) => { return 'http://' + device.ip + '/restart' },
				getUpdateURL : (device, params) => { return 'http://' + device.ip + '/update?type=' + params.type },
				getVersionURL : (device) => { return 'http://' + device.ip + '/version' },
				getPingURL : (device) => { return 'http://' + device.ip + '/' }
			},
			SynTexWebHooks : {
				name : 'SynTex Virtual Device',
				getResetURL : (device, params) => { return params.url + '/devices?id=' + device.id + '&remove=CONFIRM' },
				getRestartURL : () => { return null },
				getReconnectURL : () => { return null },
				getUpdateURL : () => { return null },
				getVersionURL : () => { return null },
				getPingURL : () => { return null }
			},
			SynTexMagicHome : {
				name : 'SynTex MagicHome Device',
				getResetURL : (device, params) => { return params.url + '/devices?id=' + device.id + '&remove=CONFIRM' },
				getRestartURL : () => { return null },
				getReconnectURL : () => { return null },
				getUpdateURL : () => { return null },
				getVersionURL : () => { return null },
				getPingURL : () => { return null }
			},
			SynTexTuya : {
				name : 'SynTex Tuya Device',
				getResetURL : (device, params) => { return params.url + '/devices?id=' + device.id + '&remove=CONFIRM' },
				getRestartURL : () => { return null },
				getReconnectURL : () => { return null },
				getUpdateURL : () => { return null },
				getVersionURL : () => { return null },
				getPingURL : () => { return null }
			},
			SynTexKNX : {
				name : 'SynTex KNX Device',
				getResetURL : (device, params) => { return params.url + '/devices?id=' + device.id + '&remove=CONFIRM' },
				getRestartURL : () => { return null },
				getReconnectURL : () => { return null },
				getUpdateURL : () => { return null },
				getVersionURL : () => { return null },
				getPingURL : () => { return null }
			}
		};
	}

	getPreset(id)
	{
		return this.presets[id];
	}
}

export let Presets = new PresetManager();