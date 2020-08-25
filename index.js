var DeviceManager = require('./core/device-manager'), Automations = require('./core/automations'), OfflineManager = require('./core/offline-manager'), HTMLQuery = require('./core/html-query'), logger = require('./core/logger');
var http = require('http'), url = require('url'), path = require('path'), fs = require('fs');
var store = require('json-fs-store');
const { isRegExp } = require('util');
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

        getPluginConfig('SynTexWebHooks').then(async function(config) {

            if(config != null)
            {
                DeviceManager.SETUP(api.user.storagePath(), logger, this.cacheDirectory, config);
            }

            var devices = await DeviceManager.getDevices();

            Automations.SETUP(logger, config.cache_directory);
            OfflineManager.SETUP(logger, devices);

            restart = false;

            DeviceManager.setBridgeStorage('restart', new Date());

            const { exec } = require("child_process");

            exec("sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 1711", (error, stdout, stderr) => {

                if(error || stderr.includes('ERR!'))
                {
                    logger.log('error', 'bridge', 'Bridge', 'Umleitung der Bridge Website Fehlgeschlagen!');
                }
                else
                {
                    logger.log('warn', 'bridge', 'Bridge', 'Umleitung der Bridge Website zu Port [80]');
                }
            });
            
            
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
                                DeviceManager.initDevice(urlParams.mac, urlParams.ip, urlParams.name, urlParams.type, urlParams.version, urlParams.refresh, urlParams.buttons, urlParams.services != undefined ? urlParams.services : '').then(function(res) {

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
                            if(urlParams.mac)
                            {
                                DeviceManager.removeDevice(urlParams.mac).then(function(removed) {

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

                                            a[activity[i].l.toLowerCase()].push({ t : activity[i].t, v : value, s : activity[i].s });
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
                            fs.readdir(this.logDirectory, async function(err, files)
                            {
                                var obj = {};

                                for(var i = 0; i < files.length; i++)
                                {
                                    var file = files[i].split('.')[0];
                                    
                                    obj[file] = '[]';

                                    var logs = await logger.load(file, null);

                                    if(logs != null)
                                    {
                                        var logList = [];

                                        for(const j in logs)
                                        {
                                            for(const k in logs[j])
                                            {
                                                for(const l in logs[j][k])
                                                {
                                                    logList[logList.length] = { t : logs[j][k][l].t, l : logs[j][k][l].l, m : logs[j][k][l].m.replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'/g, '').replace(/\"/g, '') };
                                                }
                                            }
                                        }

                                        console.log(logList.length);

                                        /*
                                        for(var j = 0; j < logs.length; j++)
                                        {
                                            logs[j].m = logs[j].m.replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'/g, '').replace(/\"/g, '');
                                        }
                                        */
                                        obj[file] = JSON.stringify(logList);
                                    }
                                }

                                response.write(JSON.stringify(obj));
                                response.end();
                            });
                        }
                        else if(urlPath == '/time')
                        {
                            response.write('' + (new Date().getTime() / 1000 + 7201));
                            response.end();
                        }
                        else if(urlPath == '/offline-devices')
                        {
                            response.write(JSON.stringify(OfflineManager.getOfflineDevices()));
                            response.end();
                        }
                        else if(urlPath == '/check-device' && urlParams.mac)
                        {
                            var device = await DeviceManager.getDevice(urlParams.mac);

                            response.write(device ? 'Success' : 'Error');
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
                                
                                response.write(await DeviceManager.setValues(json) ? 'Success' : 'Error'); 
                                response.end();
                            });
                        }
                        else if(urlPath == '/automations')
                        {
                            response.write(JSON.stringify(await Automations.loadAutomations())); 
                            response.end();
                        }
                        else if(urlPath == '/create-automations' && request.method == 'POST')
                        {
                            var post = '';

                            request.on('data', function(data)
                            {
                                post += data;
                            });

                            request.on('end', async function()
                            {                                
                                response.write(await Automations.createAutomation(post) ? 'Success' : 'Error'); 
                                response.end();
                            });
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
                                    var accessory = await DeviceManager.getAccessory(urlParams.mac);
                                    var all = { ...accessory };
                                    var device = await DeviceManager.getDevice(urlParams.mac);

                                    if(device != null)
                                    {
                                        for(var k = 0; k < Object.keys(device).length; k++)
                                        {
                                            all[Object.keys(device)[k]] = device[Object.keys(device)[k]];
                                        }
                                    }

                                    var webhookConfig = await getPluginConfig('SynTexWebHooks');
                                    var obj = {
                                        device: JSON.stringify(all),
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
                                    var all = [];
                                    var accessories = await DeviceManager.getAccessories();
                                    var devices = await DeviceManager.getDevices();
                                    var bridgeData = await DeviceManager.getBridgeStorage();

                                    all.push.apply(all, accessories);

                                    var magicHome = await getPluginConfig('MagicHome-Platform');

                                    if(magicHome != null)
                                    {
                                        for(var i = 0; i < magicHome.lights.length; i++)
                                        {
                                            if(magicHome.lights[i].setup == 'RGB' || magicHome.lights[i].setup == 'RGBW' || magicHome.lights[i].setup == 'RGBWW' || magicHome.lights[i].setup == 'RGBCW')
                                            {
                                                var type = magicHome.lights[i].setup == 'RGBW' || magicHome.lights[i].setup == 'RGBWW' ? 'rgb' :  magicHome.lights[i].setup.toLowerCase();
                                                all.push({ ip : magicHome.lights[i].ip, name : magicHome.lights[i].name, services : type, version : '99.99.99' });
                                            }
                                        }
                                    }

                                    for(var i = 0; i < all.length; i++)
                                    {
                                        for(var j = 0; j < devices.length; j++)
                                        {
                                            if(all[i].mac == devices[j].id)
                                            {
                                                for(var k = 0; k < Object.keys(devices[j]).length; k++)
                                                {
                                                    all[i][Object.keys(devices[j])[k]] = devices[j][Object.keys(devices[j])[k]];
                                                }
                                            }
                                        }
                                    }
                                    
                                    var obj = {
                                        devices: JSON.stringify(all),
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
                                else if(urlPath.startsWith('/crossover'))
                                {
                                    var obj = [];
                                    var t = getPluginConfig('SynTexTuya');

                                    if(t != null)
                                    {
                                        obj.push({ name : 'SynTex Tuya' });
                                    }

                                    var t = getPluginConfig('MagicHome-Platform');

                                    if(t != null)
                                    {
                                        obj.push({ name : 'MagicHome Platform' });
                                    }

                                    response.write(HTMLQuery.sendValues(head + data, { crossoverPlugins : JSON.stringify(obj) }));
                                    response.end();
                                }
                                else if(urlPath.startsWith('/automations'))
                                {
                                    var obj = {
                                        accessories: JSON.stringify(await DeviceManager.getAccessories())
                                    };

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