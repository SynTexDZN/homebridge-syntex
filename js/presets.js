var presets = [
	{
		id : 'SynTex',
		name : 'SynTex Real Device',
		getResetURL : function(device, params) { return 'http://' + device.ip + '/reset?type=' + params.type },
		getRestartURL : function(device) { return 'http://' + device.ip + '/restart' },
		getReconnectURL : function(device) { return 'http://' + device.ip + '/restart' },
		getUpdateURL : function(device, params) { return 'http://' + device.ip + '/update?type=' + params.type },
		getVersionURL : function(device) { return 'http://' + device.ip + '/version' },
		getPingURL : function(device) { return 'http://' + device.ip + '/' }
	},
	{
		id : 'SynTexWebHooks',
		name : 'SynTex Virtual Device',
		getResetURL : function(device, params) { return params.url + '/devices?id=' + device.id + '&remove=CONFIRM' },
		getRestartURL : function() { return null },
		getReconnectURL : function() { return null },
		getUpdateURL : function() { return null },
		getVersionURL : function() { return null },
		getPingURL : function() { return null }
	},
	{
		id : 'SynTexMagicHome',
		name : 'SynTex MagicHome Device',
		getResetURL : function(device, params) { return params.url + '/devices?id=' + device.id + '&remove=CONFIRM' },
		getRestartURL : function() { return null },
		getReconnectURL : function() { return null },
		getUpdateURL : function() { return null },
		getVersionURL : function() { return null },
		getPingURL : function() { return null }
	},
	{
		id : 'SynTexTuya',
		name : 'SynTex Tuya Device',
		getResetURL : function(device, params) { return params.url + '/devices?id=' + device.id + '&remove=CONFIRM' },
		getRestartURL : function() { return null },
		getReconnectURL : function() { return null },
		getUpdateURL : function() { return null },
		getVersionURL : function() { return null },
		getPingURL : function() { return null }
	}
];

function getPreset(id)
{
	for(var i = 0; i < presets.length; i++)
	{
		if(presets[i].id == id)
		{
			return presets[i];
		}
	}
}

export let Presets = { getPreset };