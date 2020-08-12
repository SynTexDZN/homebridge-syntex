var request = require('request');
var logger, offline = [];

function checkConnection(url, mac)
{
    var theRequest = {
        method : 'GET',
        url : url,
        timeout : 60000
    };

    request(theRequest, (function(err, response, body)
    {
        var statusCode = response && response.statusCode ? response.statusCode : -1;

        if(!err && statusCode == 200)
        {
            if(!offline.includes(mac))
            {
                offline.push(mac);
            }
        }
        else if(offline.includes(mac))
        {
            offline.splice(offline.indexOf(mac), 1);
        }
        
    }));
}

function pingDevices(devices)
{
    for(var i = 0; i < devices.length; i++)
    {
        if(devices[i].ip != undefined)
        {
            checkConnection('http://' + devices[i].ip + '/', devices[i].id);
        }
    }

    setTimeout(function()
    {
        pingDevices(devices);
    }, 60000);
}

function getOfflineDevices()
{
    return offline;
}

function SETUP(log, devices)
{
    logger = log;

    pingDevices(devices);
}

module.exports = {
    SETUP,
    getOfflineDevices
};