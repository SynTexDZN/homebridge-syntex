var DeviceManager = require('./core/device-manager'), Automations = require('./core/automations'), HTMLQuery = require('./core/html-query'), logger = require('./core/logger');
var http = require('http'), url = require('url'), path = require('path');
var store = require('json-fs-store');
const { isRegExp } = require('util');
const automations = require('./core/automations');
var conf, restart = true;

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

        HTMLQuery.SETUP(logger);

        getPluginConfig('SynTexWebHooks').then(function(config) {

            if(config != null)
            {
                DeviceManager.SETUP(api.user.storagePath(), logger, this.cacheDirectory, config);
            }

            Automations.SETUP(logger, config.cacheDirectory);

            restart = false;

            DeviceManager.setBridgeStorage('restart', new Date());
            
        }.bind(this)).catch(function(e) {

            logger.err(e);
        });
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
            
            var createServerCallback = (async function(request, response)
            {
                try
                {
                    var urlParts = url.parse(request.url, true);
                    var urlParams = urlParts.query;
                    var urlPath = urlParts.pathname;

                    response.statusCode = 200;
                    response.setHeader('Content-Type', 'text/plain');
                    response.setHeader('Access-Control-Allow-Origin', '*');

                    if(urlPath.startsWith('/serverside'))
                    {
                        urlPath = urlPath.split('/serverside')[1];

                        if(urlPath == '/init')
                        {
                            if(urlParams.name && urlParams.type && urlParams.mac && urlParams.ip && urlParams.version && urlParams.refresh && urlParams.buttons)
                            {
                                DeviceManager.initDevice(urlParams.mac, urlParams.ip, urlParams.name, urlParams.type, urlParams.version, urlParams.refresh, urlParams.buttons).then(function(res) {

                                    logger.log('info', urlParams.mac, JSON.parse(res[1]).name, '[' + JSON.parse(res[1]).name + '] hat sich mit der Bridge verbunden! ( ' + urlParams.mac + ' | ' +  urlParams.ip + ' )');

                                    response.write(res[1]);
                                    response.end();

                                    if(res[0] == "Init")
                                    {
                                        restart = true;

                                        const { exec } = require("child_process");

                                        logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');

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
                                        logger.log('success', urlParams.mac, '', 'Ein Gerät wurde entfernt! ( ' + urlParams.mac + ' )');

                                        restart = true;

                                        const { exec } = require("child_process");

                                        logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');

                                        exec("sudo systemctl restart homebridge");
                                    }
                                    else
                                    {
                                        logger.log('error', 'bridge', 'Bridge', 'Das Gerät konnte nicht entfernt werden! ( ' + urlParams.mac + ' )');
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

                                        logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');

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

                            logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');

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
                                        logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge konnte nicht aktualisiert werden! ' + (error || stderr));
                                    }
                                    else
                                    {
                                        logger.log('success', 'bridge', 'Bridge', 'Die Homebridge wurde auf die Version [' + version + '] aktualisiert!');
                                        
                                        restart = true;

                                        logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');
                                        
                                        exec("sudo systemctl restart homebridge");
                                    }
                                }
                                catch(e)
                                {
                                    logger.err(e);
                                }
                            });
                        }
                        else if(urlPath == '/activity')
                        {
                            var result = {};

                            if(urlParams.mac)
                            {
                                var activity = await logger.load('SynTexWebHooks', urlParams.mac);

                                if(activity != null)
                                {
                                    var a = { update : [], success : [] };

                                    for(var i = 0; i < activity.length; i++)
                                    {
                                        if(activity[i].l == 'Update' || activity[i].l == 'Success')
                                        {
                                            var value = activity[i].m.split('[')[2].split(']')[0];
                                            var name = activity[i].m.split('[')[1].split(']')[0];

                                            a[activity[i].l.toLowerCase()].push({ t : activity[i].t, v : value, n : name });
                                        }
                                    }

                                    result = a;
                                }
                            }

                            response.write(JSON.stringify(result));
                            response.end();
                        }
                        else if(urlPath == '/log')
                        {
                            var bridgeLogs = await logger.load('SynTex', null);
                            var webhookLogs = await logger.load('SynTexWebHooks', null);
                            var obj = {
                                bLog: '[]',
                                wLog: '[]'
                            };

                            if(bridgeLogs != null)
                            {    
                                for(var i = 0; i < bridgeLogs.length; i++)
                                {
                                    bridgeLogs[i].m = bridgeLogs[i].m.replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'/g, '').replace(/\"/g, '');
                                }

                                obj.bLog = JSON.stringify(bridgeLogs);
                            }

                            if(webhookLogs != null)
                            {    
                                for(var i = 0; i < webhookLogs.length; i++)
                                {
                                    webhookLogs[i].m = webhookLogs[i].m.replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'/g, '').replace(/\"/g, '');
                                }

                                obj.wLog = JSON.stringify(webhookLogs);
                            }

                            response.write(JSON.stringify(obj));
                            response.end();
                        }
                        else if(urlPath == '/time')
                        {
                            response.write('' + (new Date().getTime() / 1000 + 7201));
                            response.end();
                        }
                        else if(urlPath == '/check-device' && urlParams.mac)
                        {
                            var device = await DeviceManager.getDevice(urlParams.mac);

                            response.write(device ? device.type : 'Error');
                            response.end();
                        }
                        else if(urlPath == '/save-config' && request.method == 'POST')
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
                                    logger.log('error', 'bridge', 'Bridge', urlParams.mac + ".json konnte nicht aktualisiert werden!");
                                }
                                
                                response.write('Success'); 
                                response.end();
                            });
                        }
                        else if(urlPath == '/automations')
                        {
                            response.write(JSON.stringify(await Automations.loadAutomations())); 
                            response.end();
                        }
                    }
                    else
                    {
                        HTMLQuery.exists(urlPath.substring(1)).then(async function(relPath)
                        {            
                            if(!relPath)
                            {
                                var data = await HTMLQuery.read(path.join(__dirname, '/notfound.html'));
                                var head = await HTMLQuery.read(__dirname + '/includes/head.html');

                                response.setHeader('Content-Type', 'text/html; charset=utf-8');
                                response.write(HTMLQuery.sendValues(head + data, obj));
                                response.end();
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
                                        accessory: JSON.stringify(await DeviceManager.getAccessory(urlParams.mac)),
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
                                    var devices = await DeviceManager.getDevices();
                                    var bridgeData = await DeviceManager.getBridgeStorage();
                                    var obj = {
                                        devices: JSON.stringify(devices),
                                        restart: '-'
                                    };
                                    
                                    if(bridgeData != null && bridgeData.restart)
                                    {
                                        var restartDate = new Date(bridgeData.restart);
                                        obj.restart = formatTimestamp(new Date().getTime() / 1000 - restartDate.getTime() / 1000);
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

                                    for(var dev in ifaces)
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

                                    for(var dev in ifaces)
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
            
            logger.log('info', 'bridge', 'Bridge', 'Data Link Server läuft auf Port [' + this.port + ']');
        }
        catch(e)
        {
            logger.err(e);
        }
    }
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