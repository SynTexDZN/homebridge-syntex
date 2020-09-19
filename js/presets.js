var presets = [
    {
        id : 'SynTex',
        name : 'SynTex Real Device',
        getResetURL : function(device) { return 'http://' + device.ip + '/reset' },
        getRestartURL : function(device) { return 'http://' + device.ip + '/restart' },
        getReconnectURL : function(device) { return 'http://' + device.ip + '/restart' },
        getUpdateURL : function(device) { return 'http://' + device.ip + '/update' },
        getVersionURL : function(device) { return 'http://' + device.ip + '/version' },
        getPingURL : function(device) { return 'http://' + device.ip + '/' }
    },
    {
        id : 'SynTexWebHooks',
        name : 'SynTex Virtual Device',
        getResetURL : function(device) { return '/serverside/remove-device?mac=' + device.mac },
        getRestartURL : function() { return null },
        getReconnectURL : function() { return null },
        getUpdateURL : function() { return null },
        getVersionURL : function() { return null },
        getPingURL : function() { return null }
    },
    {
        id : 'SynTexMagicHome',
        name : 'SynTex MagicHome Device',
        getResetURL : function() { return null },
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