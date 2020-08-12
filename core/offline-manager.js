var request = require('request');
var logger, temp = [], offline = [];

function checkConnection(ip)
{
    var theRequest = {
        method : 'GET',
        url : 'http://' + ip + '/',
        timeout : 30000
    };

    request(theRequest, (function(err, response, body)
    {
        var statusCode = response && response.statusCode ? response.statusCode : -1;

        logger.debug(statusCode);

        if(err || statusCode != 200)
        {
            if(!temp.includes(ip))
            {
                temp.push(ip);
            }
            else if(!offline.includes(ip))
            {
                offline.push(ip);
            }
        }
        else
        {
            if(temp.includes(ip))
            {
                temp.splice(temp.indexOf(ip), 1);
            }
            
            if(offline.includes(ip))
            {
                offline.splice(offline.indexOf(ip), 1);
            }
        }
    }));
}

function pingDevices(devices)
{
    for(var i = 0; i < devices.length; i++)
    {
        if(devices[i].ip != undefined)
        {
            checkConnection(devices[i].ip);
        }
    }

    setTimeout(function()
    {
        pingDevices(devices);
    }, 30000);
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