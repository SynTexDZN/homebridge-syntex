var request = require('request');
var logger, temp = [], offline = [];

function checkConnection(url, mac)
{
    var theRequest = {
        method : 'GET',
        url : url,
        timeout : 30000
    };

    request(theRequest, (function(err, response, body)
    {
        var statusCode = response && response.statusCode ? response.statusCode : -1;

        logger.debug(statusCode);

        if(err || statusCode != 200)
        {
            if(!temp.includes(mac))
            {
                temp.push(mac);

                logger.debug("PUSH TEMP" + JSON.stringify(temp));
            }
            else if(!offline.includes(mac))
            {
                offline.push(mac);

                logger.debug("PUSH OFFLINE");
            }
        }
        else
        {
            if(temp.includes(mac))
            {
                temp.splice(temp.indexOf(mac), 1);

                logger.debug("REMOVE TEMP" + JSON.stringify(temp));
            }
            
            if(offline.includes(mac))
            {
                offline.splice(offline.indexOf(mac), 1);

                logger.debug("REMOVE OFFLINE");
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
            checkConnection('http://' + devices[i].ip + '/', devices[i].id);
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