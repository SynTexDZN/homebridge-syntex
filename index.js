var http = require('http');
var url = require('url');
var path = require('path');
var store = require('json-fs-store');
var DeviceManager = require('./core/device-manager');
var HTMLQuery = require('./core/html-query');
var logger = require('./core/logger');
var conf;
var restart = true;

module.exports = function(homebridge)
{
    homebridge.registerPlatform("homebridge-syntex", "SynTex", SynTexPlatform);
};

function SynTexPlatform(log, config, api)
{
    try
    {
        this.cacheDirectory = config["cache_directory"] || "./SynTex/data";
        this.logDirectory = config["log_directory"] || "./SynTex/log";
        this.port = config["port"] || 1711;

        conf = store(api.user.storagePath());

        logger.create("SynTex", this.logDirectory, api.user.storagePath());

        getPluginConfig('SynTexWebHooks').then(function(config) {

            if(config != null)
            {
                DeviceManager.SETUP(api.user.storagePath(), logger, this.cacheDirectory, config.port);
            }

            restart = false;
            
        }.bind(this)).catch(function(e) {

            logger.err(e);
        });

        HTMLQuery.SETUP(logger);
    }
    catch(e)
    {
        logger.err(e);
    }
}

SynTexPlatform.prototype = {
    
    accessories : function(callback)
    {        
        try
        {
            var accessories = [];

            callback(accessories);
            
            var createServerCallback = (function(request, response)
            {
                try
                {
                    var urlParts = url.parse(request.url, true);
                    var urlParams = urlParts.query;
                    var urlPath = urlParts.pathname;

                    response.statusCode = 200;
                    response.setHeader('Content-Type', 'text/plain');
                    response.setHeader('Access-Control-Allow-Origin', '*');

                    if(urlPath == '/init')
                    {
                        if(urlParams.name && urlParams.type && urlParams.mac && urlParams.ip && urlParams.version && urlParams.refresh)
                        {
                            logger.log('info', 'Ein Gerät hat sich mit der Bridge verbunden! ( ' + urlParams.mac + ' | ' + urlParams.ip + ' )');

                            DeviceManager.initDevice(urlParams.mac, urlParams.ip, urlParams.name, urlParams.type, urlParams.version, urlParams.refresh, urlParams.buttons ? parseInt(urlParams.buttons) : 0).then(function(res) {

                                response.write(res[1]);
                                response.end();

                                if(res[0] == "Init")
                                {
                                    restart = true;

                                    const { exec } = require("child_process");

                                    logger.log('warn', "Die Homebridge wird neu gestartet ..");

                                    exec("sudo systemctl restart homebridge");
                                }
                                
                            }).catch(function(e) {

                                logger.err(e);
                            });
                        }
                    }
                    else if(urlPath == '/remove-device')
                    {
                        if(urlParams.mac && urlParams.type)
                        {
                            DeviceManager.removeDevice(urlParams.mac, urlParams.type).then(function(removed) {

                                response.write(removed ? 'Success' : 'Error');
                                response.end();

                                if(removed)
                                {
                                    logger.log('success', 'Das Gerät wurde entfernt! ( ' + urlParams.mac + ' )');

                                    restart = true;

                                    const { exec } = require("child_process");

                                    logger.log('warn', "Die Homebridge wird neu gestartet ..");

                                    exec("sudo systemctl restart homebridge");
                                }
                                else
                                {
                                    logger.log('error', 'Das Gerät konnte nicht entfernt werden! ( ' + urlParams.mac + ' )');
                                }
                                
                            }).catch(function(e) {

                                logger.err(e);
                            });
                        }
                        else
                        {
                            response.write("Error");
                            response.end();
                        }
                    }
                    else if(urlPath == '/init-switch')
                    {
                        if(urlParams.mac && urlParams.name)
                        {
                            DeviceManager.initSwitch(urlParams.mac, urlParams.name).then(function(res) {

                                response.write(res[1]);
                                response.end();

                                if(res[0] == "Success")
                                {
                                    restart = true;

                                    const { exec } = require("child_process");

                                    logger.log('warn', "Die Homebridge wird neu gestartet ..");

                                    exec("sudo systemctl restart homebridge");
                                }
                                
                            }).catch(function(e) {

                                logger.err(e);
                            });
                        }
                        else
                        {
                            response.write("Error");
                            response.end();
                        }
                    }
                    else if(urlPath == '/restart')
                    {
                        restart = true;

                        const { exec } = require("child_process");
                        
                        response.write('Success');
                        response.end();

                        logger.log('warn', "Die Homebridge wird neu gestartet ..");

                        exec("sudo systemctl restart homebridge");
                    }
                    else if(urlPath == '/check-restart')
                    {
                        response.write(restart.toString());
                        response.end();
                    }
                    else if(urlPath == '/check-name')
                    {
                        if(urlParams.name)
                        {
                            DeviceManager.checkName(urlParams.name).then(function(nameAvailable) {

                                response.write(nameAvailable ? 'Success' : 'Error');
                                response.end();
                            });
                        }
                    }
                    else if(urlPath == '/version')
                    {
                        var pjson = require('./package.json');

                        response.write(pjson.version);
                        response.end();
                    }
                    else if(urlPath == '/update')
                    {
                        var version = 'latest';

                        if(urlParams.version)
                        {
                            version = urlParams.version;
                        }

                        const { exec } = require("child_process");
                        
                        exec("sudo npm install homebridge-syntex@" + version + " -g", (error, stdout, stderr) => {

                            try
                            {
                                response.write(error || stderr.includes('ERR!') ? 'Error' : 'Success');
                                response.end();

                                if(error || stderr.includes('ERR!'))
                                {
                                    logger.log('warn', "Die Homebridge konnte nicht aktualisiert werden!");
                                }
                                else
                                {
                                    logger.log('success', "Die Homebridge wurde auf die Version '" + version + "' aktualisiert!");
                                    
                                    restart = true;

                                    logger.log('warn', "Die Homebridge wird neu gestartet ..");
                                    
                                    exec("sudo systemctl restart homebridge");
                                }
                            }
                            catch(e)
                            {
                                logger.err(e);
                            }
                        });
                    }
                    else
                    {
                        HTMLQuery.exists(urlPath.substring(1)).then(async function(relPath)
                        {            
                            if(!relPath)
                            {
                                
                            }
                            else
                            {
                                var data = await HTMLQuery.read(relPath);
                                var head = await HTMLQuery.read(__dirname + '/includes/head.html');
                                var mimeType = {
                                    ".html": "text/html; charset=utf-8",
                                    ".jpeg": "image/jpeg",
                                    ".jpg": "image/jpeg",
                                    ".png": "image/png",
                                    ".js": "text/javascript",
                                    ".css": "text/css",
                                    ".ttf": "font/ttf"
                                };

                                response.setHeader('Content-Type', mimeType[path.parse(relPath).ext] || 'text/html; charset=utf-8');

                                if(urlPath == '/device' && urlParams.mac)
                                {
                                    var device = await DeviceManager.getDevice(urlParams.mac);
                                    var webhookConfig = await getPluginConfig('SynTexWebHooks');
                                    var obj = {
                                        device: JSON.stringify(device),
                                        wPort: 1710
                                    };

                                    if(webhookConfig != null)
                                    {
                                        obj.wPort = webhookConfig.port;
                                    }

                                    response.write(HTMLQuery.sendValues(head + data, obj));
                                    response.end();
                                }
                                else if(urlPath == '/' || urlPath.startsWith('/index'))
                                {
                                    var date = new Date();
                                    var devices = await DeviceManager.getDevices();
                                    var restart = await findRestart(date);
                                    var bridgeErrors = await findErrors('SynTex', date);
                                    var webhookErrors = await findErrors('SynTexWebHooks', date);
                                    var obj = {
                                        devices: JSON.stringify(devices),
                                        restart: 'Keine Daten Vorhanden',
                                        errors: bridgeErrors + webhookErrors
                                    };

                                    if(restart != null)
                                    {
                                        var restartDate = new Date((restart[0].getMonth() + 1) + ' ' + restart[0].getDate() + ' ' + restart[0].getFullYear() + ' ' + restart[1].split(' >')[0]);
                                        obj.restart = formatTimestamp(date.getTime() / 1000 - restartDate.getTime() / 1000);
                                    }

                                    response.write(HTMLQuery.sendValues(head + data, obj));
                                    response.end();
                                }
                                else if(urlPath.startsWith('/settings'))
                                {
                                    var devices = await DeviceManager.getDevices();

                                    response.write(HTMLQuery.sendValue(head + data, 'devices', JSON.stringify(devices)));
                                    response.end();
                                }
                                else if(urlPath.startsWith('/setup') || urlPath.startsWith('/reconnect'))
                                {
                                    var ifaces = require('os').networkInterfaces();
                                    var address;

                                    for (var dev in ifaces)
                                    {
                                        var iface = ifaces[dev].filter(function(details)
                                        {
                                            return details.family === 'IPv4' && details.internal === false;
                                        });

                                        if(iface.length > 0) address = iface[0].address;
                                    }

                                    response.write(HTMLQuery.sendValue(head + data, 'bridge-ip', address));
                                    response.end();
                                }
                                else if(urlPath.startsWith('/bridge'))
                                {
                                    var pjson = require('./package.json');
                                    var ifaces = require('os').networkInterfaces();
                                    var address;

                                    for (var dev in ifaces)
                                    {
                                        var iface = ifaces[dev].filter(function(details)
                                        {
                                            return details.family === 'IPv4' && details.internal === false;
                                        });

                                        if(iface.length > 0) address = iface[0].address;
                                    }

                                    var webhookConfig = await getPluginConfig('SynTexWebHooks');
                                    var obj = {
                                        ip: address,
                                        version: pjson.version,
                                        wPort: 1710
                                    };

                                    if(webhookConfig != null)
                                    {
                                        obj.wPort = webhookConfig.port;
                                    }

                                    response.write(HTMLQuery.sendValues(head + data, obj));
                                    response.end();
                                }
                                else if(urlPath.startsWith('/log'))
                                {
                                    var d = new Date();
                                    var date = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
                                    var bridgeLogs = await logger.load('SynTex', date);
                                    var webhookLogs = await logger.load('SynTexWebHooks', date);
                                    var obj = {
                                        bLog: '[]',
                                        wLog: '[]'
                                    };

                                    if(bridgeLogs != null)
                                    {    
                                        obj.bLog = JSON.stringify(bridgeLogs.logs).replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'\"/g, ']"').replace(/\'\:/g, ']:');
                                    }

                                    if(webhookLogs != null)
                                    {    
                                        obj.wLog = JSON.stringify(webhookLogs.logs).replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'\"/g, ']"').replace(/\'\:/g, ']:');
                                    }

                                    response.write(HTMLQuery.sendValues(head + data, obj));
                                    response.end();
                                }
                                else if(urlPath.startsWith('/serverside/check-device') && urlParams.mac)
                                {
                                    var device = await DeviceManager.getDevice(urlParams.mac);

                                    response.write(HTMLQuery.sendValue(data, 'found', device ? device.type : 'Error'));
                                    response.end();
                                }
                                else if(urlPath.startsWith('/serverside/save-config') && request.method == 'POST')
                                {
                                    var post = '';

                                    request.on('data', function(data)
                                    {
                                        post += data;
                                    });

                                    request.on('end', async function()
                                    {
                                        var json = JSON.parse(post);
                                        
                                        if(await DeviceManager.setValues(json) == false)
                                        {
                                            logger.log('error', urlParams.mac + ".json konnte nicht aktualisiert werden!");
                                        }
                                        
                                        response.write(HTMLQuery.sendValue(data, 'result', 'Success')); 
                                        response.end();
                                    });
                                }
                                else if(path.parse(relPath).ext == '.html')
                                {
                                    response.write(head + data);
                                    response.end();
                                }
                                else
                                {
                                    response.write(data);
                                    response.end();
                                }
                            }
                            
                        }).catch(function(e) {

                            logger.err(e);
                        });
                    }
                }
                catch(e)
                {
                    logger.err(e);
                }
                
            }).bind(this);

            http.createServer(createServerCallback).listen(this.port, "0.0.0.0");
            
            logger.log('info', "Data Link Server läuft auf Port '" + this.port + "'");
        }
        catch(e)
        {
            logger.err(e);
        }
    }
}

async function findRestart(d)
{
    return new Promise(resolve => {

        var date = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();

        logger.find('SynTex', date, '[INFO] Data').then(function(restart) {

            if(restart != null)
            {
                resolve([d, restart[0]]);
            }
            else
            {
                var yesterday = new Date();
                yesterday.setDate(d.getDate() - 1);
                resolve(findRestart(yesterday));
            }

        }).catch(function(e) {

            logger.err(e);
        });
    });
}

async function findErrors(pluginName, d)
{
    return new Promise(resolve => {

        var date = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();

        logger.find(pluginName, date, '[ERROR]').then(function(errors) {

            if(errors != null)
            {
                resolve(errors.length);
            }
            else
            {
                resolve(0);
            }
            
        }).catch(function(e) {

            logger.err(e);
        });
    });
}

async function getPluginConfig(pluginName)
{
    return new Promise(resolve => {
        
        conf.load('config', (err, obj) => {    

            try
            {
                if(obj && !err)
                {                            
                    for(const i in obj.platforms)
                    {
                        if(obj.platforms[i].platform === pluginName)
                        {
                            resolve(obj.platforms[i]);
                        }
                    }
                }

                resolve(null);
            }
            catch(e)
            {
                logger.err(e);
            }
        });
    });
}

function formatTimestamp(timestamp)
{
    if(timestamp < 60)
    {
        return Math.round(timestamp) + ' s';
    }
    else if(timestamp < 60 * 60)
    {
        return Math.round(timestamp / 60) + ' m';
    }
    else if(timestamp < 60 * 60 * 24)
    {
        return Math.round(timestamp / 60 / 60) + ' h';
    }
    else if(timestamp < 60 * 60 * 24 * 7)
    {
        return Math.round(timestamp / 60 / 60 / 24) + ' T';
    }
    else if(timestamp < 60 * 60 * 24 * 30.5)
    {
        return Math.round(timestamp / 60 / 60 / 24 / 7) + 'W';
    }
    else if(timestamp < 60 * 60 * 24 * 365)
    {
        return Math.round(timestamp / 60 / 60 / 24 / 30.5) + 'M';
    }
    else
    {
        return '> 1 J';
    }
}