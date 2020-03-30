var http = require('http');
var url = require('url');
var path = require('path');
var store = require('json-fs-store');
var DeviceManager = require('./core/device-manager');
var HTMLQuery = require('./core/html-query');
var logger = require('./logger');
var conf;
var restart = true;

module.exports = function(homebridge)
{
    homebridge.registerPlatform("homebridge-syntex", "SynTex", SynTexPlatform);
};

function SynTexPlatform(log, config, api)
{
    this.cacheDirectory = config["cache_directory"] || "./SynTex/data";
    this.logDirectory = config["log_directory"] || "./SynTex/log";
    this.port = config["port"] || 1711;

    conf = store(api.user.storagePath());

    logger.create("SynTex", this.logDirectory, api.user.storagePath());

    var cacheDirectory = this.cacheDirectory;
    
    getPluginConfig('SynTexWebHooks').then(function(res) {

        if(res != null)
        {
            DeviceManager.SETUP(api.user.storagePath(), logger, cacheDirectory, res.port);
        }

        restart = false;
    });

    HTMLQuery.SETUP(logger);
}

SynTexPlatform.prototype = {
    
    accessories : function(callback)
    {        
        var accessories = [];
        
        callback(accessories);
        
        var createServerCallback = (function(request, response)
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
                    DeviceManager.initDevice(urlParams.mac, urlParams.ip, urlParams.name, urlParams.type, urlParams.version, urlParams.refresh).then(function(res) {

                        response.write(res[1]);
                        response.end();

                        if(res[0] == "Init")
                        {
                            restart = true;

                            const { exec } = require("child_process");

                            exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {
                                
                                logger.log('warn', "Die Homebridge wird neu gestartet ..");
                            });
                        }
                    });
                }
            }
            else if(urlPath == '/remove-device')
            {
                if(urlParams.mac && urlParams.type)
                {
                    DeviceManager.removeDevice(urlParams.mac, urlParams.type).then(function(res) {

                        if(res)
                        {
                            logger.log('success', "Das Gerät wurde entfernt! (" + urlParams.mac + ")");

                            response.write("Success");
                            response.end();

                            restart = true;

                            const { exec } = require("child_process");

                            exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {
                                logger.log('warn', "Die Homebridge wird neu gestartet ..");
                            });
                        }
                        else
                        {
                            logger.log('error', "Das Gerät konnte nicht entfernt werden! (" + urlParams.mac + ")");

                            response.write("Error");
                            response.end();
                        }
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
                
                exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {

                    logger.log('warn', "Die Homebridge wird neu gestartet ..");
                });
            }
            else if(urlPath == '/check-restart')
            {
                response.write(restart.toString());
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

                    if(error || stderr.includes('ERR!'))
                    {
                        response.write('Error');
                        response.end();
                        
                        logger.log('warn', "Die Homebridge konnte nicht aktualisiert werden!");
                    }
                    else
                    {
                        response.write('Success');
                        response.end();
                        
                        logger.log('success', "Die Homebridge wurde auf die Version '" + version + "' aktualisiert!");
                        
                        restart = true;
                        
                        exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {

                            logger.log('warn', "Die Homebridge wird neu gestartet ..");
                        });
                    }
                });
            }
            else
            {
                HTMLQuery.exists(urlPath.substring(1)).then(function(relPath)
                {                  
                    if(!relPath)
                    {
                        
                    }
                    else
                    {
                        HTMLQuery.read(relPath).then(function(data)
                        {
                            HTMLQuery.read(__dirname + '/includes/head.html').then(function(head)
                            {
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
                                    DeviceManager.getDevice(urlParams.mac).then(function(res) {

                                        getPluginConfig('SynTexWebHooks').then(function(res2) {

                                            var obj = {
                                                device: JSON.stringify(res),
                                                wPort: 1710
                                            };

                                            if(res2 != null)
                                            {
                                                obj.wPort = res2.port;
                                            }

                                            response.write(HTMLQuery.sendValues(head + data, obj));
                                            response.end();
                                        });
                                    });
                                }
                                else if(urlPath == '/' || urlPath.startsWith('/index'))
                                {
                                    DeviceManager.getDevices().then(function(res) {

                                        var date = new Date();

                                        findRestart(date).then(function(res2) {

                                            var obj = {
                                                devices: JSON.stringify(res),
                                                restart: 'Keine Daten Vorhanden'
                                            };

                                            if(res2 != null)
                                            {
                                                if(res2[0].getDate() < date.getDate())
                                                {
                                                    obj.restart = res2[0].getDate() + "." + (res2[0].getMonth() + 1) + "." + res2[0].getFullYear() + ' • ' + res2[1].split(' >')[0];
                                                }
                                                else
                                                {
                                                    obj.restart = res2[1].split(' >')[0].split(':')[0] + ":" + res2[1].split(' >')[0].split(':')[1];
                                                }
                                            }

                                            response.write(HTMLQuery.sendValues(head + data, obj));
                                            response.end();
                                        });
                                    });
                                }
                                else if(urlPath.startsWith('/settings'))
                                {
                                    DeviceManager.getDevices().then(function(res) {

                                        response.write(HTMLQuery.sendValue(head + data, 'devices', JSON.stringify(res)));
                                        response.end();
                                    });
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

                                    getPluginConfig('SynTexWebHooks').then(function(res2) {

                                        var webhookPort = 1710;

                                        if(res2 != null)
                                        {
                                            webhookPort = res2.port;
                                        }

                                        var date = new Date();

                                        findRestart(date).then(function(res) {

                                            var obj = {
                                                ip: address,
                                                version: pjson.version,
                                                wPort: webhookPort,
                                                restart: 'Keine Daten Vorhanden'
                                            };

                                            if(res != null)
                                            {
                                                obj.restart = formatTimestamp(date.getTime() - res[0].getTime());
                                                /*
                                                if(res[0].getDate() < date.getDate())
                                                {
                                                    obj.restart = '( ' + res[0].getDate() + "." + (res[0].getMonth() + 1) + "." + res[0].getFullYear() + ' ) ' + res[1].split(' >')[0];
                                                }
                                                else
                                                {
                                                    obj.restart = '( Heute ) ' + res[1].split(' >')[0];
                                                }
                                                */
                                            }

                                            response.write(HTMLQuery.sendValues(head + data, obj));
                                            response.end();
                                        });
                                    });
                                }
                                else if(urlPath.startsWith('/log'))
                                {
                                    var d = new Date();

                                    var date = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();

                                    logger.load('SynTex', date).then(function(res) {  

                                        if(res != null)
                                        {    
                                            logger.load('SynTexWebHooks', date).then(function(res2) {   

                                                var obj = {
                                                    bLog: JSON.stringify(res.logs).replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'\"/g, ']"').replace(/\'\:/g, ']:'),
                                                    wLog: '[]'
                                                };

                                                if(res2 != null)
                                                {    
                                                    obj.wLog = JSON.stringify(res2.logs).replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'\"/g, ']"').replace(/\'\:/g, ']:');
                                                }

                                                response.write(HTMLQuery.sendValues(head + data, obj));
                                                response.end();
                                            });
                                        }
                                        else
                                        {
                                            logger.load('SynTexWebHooks', date).then(function(res2) {  

                                                var obj = {
                                                    bLog: '[]',
                                                    wLog: '[]'
                                                };

                                                if(res2 != null)
                                                {    
                                                    obj.wLog = JSON.stringify(res2.logs).replace(/\s\'/g, ' [').replace(/\'\s/g, '] ').replace(/\'\"/g, ']"').replace(/\'\:/g, ']:');
                                                }

                                                response.write(HTMLQuery.sendValues(head + data, obj));
                                                response.end();
                                            });
                                        }
                                    });
                                }
                                else if(urlPath.startsWith('/serverside/check-device') && urlParams.mac)
                                {
                                    DeviceManager.getDevice(urlParams.mac).then(function(res) {

                                        if(!res)
                                        {
                                            response.write(HTMLQuery.sendValue(data, 'found', 'Error'));
                                        }
                                        else
                                        {
                                            response.write(HTMLQuery.sendValue(data, 'found', res.type)); 
                                        }

                                        response.end();
                                    });
                                }
                                else if(urlPath.startsWith('/serverside/save-config') && request.method == 'POST')
                                {
                                    var post = '';

                                    request.on('data', function(data)
                                    {
                                        post += data;
                                    });

                                    request.on('end', function()
                                    {
                                        var json = JSON.parse(post);
                                        
                                        DeviceManager.setValues(json).then(function(res)
                                        {
                                            if(!res)
                                            {
                                                logger.log('error', urlParams.mac + ".json konnte nicht aktualisiert werden!" + err);
                                            }
                                        });
                                        
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
                            });
                        });
                    }
                });
            }
            
        }).bind(this);

        http.createServer(createServerCallback).listen(this.port, "0.0.0.0");
           
        logger.log('info', "Data Link Server läuft auf Port " + "'" + this.port + "'");
    }
}

async function findRestart(d)
{
    return new Promise(resolve => {

        var date = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();

        logger.find('SynTex', date, '[INFO] Data').then(function(res) {

            if(res != null)
            {
                resolve([d, res]);
            }
            else
            {
                var yesterday = new Date();
                yesterday.setDate(d.getDate() - 1);
                resolve(findRestart(yesterday));
            }
        });
    });
}

async function getPluginConfig(pluginName)
{
    return new Promise(resolve => {
        
        conf.load('config', (err, obj) => {    

            if(obj && !err)
            {                            
                obj.id = 'config';

                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === pluginName)
                    {
                        resolve(obj.platforms[i]);
                    }
                }

                resolve(null);
            }

            if(err || !obj)
            {
                resolve(null);
            }
        });
    });
}

function formatTimestamp(timestamp)
{
    if(timestamp < 60)
    {
        return timestamp + ' sek';
    }
    else if(timestamp < 60 * 60)
    {
        return round(timestamp / 60) + ' min';
    }
    else if(timestamp < 60 * 60 * 24)
    {
        return round(timestamp / 60 / 60) + ' h';
    }
    else if(timestamp < 60 * 60 * 24 * 7)
    {
        return round(timestamp / 60 / 60 / 24) + ' Tag';
    }
    else if(timestamp < 60 * 60 * 24 * idate('t'))
    {
        return round(timestamp / 60 / 60 / 24 / 7) + 'Woche';
    }
    else if(timestamp < 60 * 60 * 24 * 365)
    {
        return round(timestamp / 60 / 60 / 24 / idate('t')) + 'Monat';
    }
    else
    {
        return '> 1 Jahr';
    }
}