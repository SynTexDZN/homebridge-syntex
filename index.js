var http = require('http');
var url = require('url');
var path = require('path');
var DeviceManager = require('./core/device-manager');
var HTMLQuery = require('./core/html-query');
var logger = require('./logger');

module.exports = function(homebridge)
{
    homebridge.registerPlatform("homebridge-syntex", "SynTex", SynTexPlatform);
};

function SynTexPlatform(log, config, api)
{
    this.cacheDirectory = config["cache_directory"] || "./SynTex/data";
    this.logDirectory = config["log_directory"] || "./SynTex/log";
    this.port = config["port"] || 1711;

    logger.create("SynTex", this.logDirectory);
    
    DeviceManager.SETUP(api.user.storagePath(), logger, this.cacheDirectory);
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
            //var body = [];
            
            //body = Buffer.concat(body).toString();

            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Access-Control-Allow-Origin', 'http://syntex.local:8000');

            if(urlPath == '/init')
            {
                if(urlParams.name && urlParams.type && urlParams.mac && urlParams.ip && urlParams.version && urlParams.refresh)
                {
                    DeviceManager.initDevice(urlParams.mac, urlParams.ip, urlParams.name, urlParams.type, urlParams.version, urlParams.refresh).then(function(res) {

                        response.write(res[1]);
                        response.end();

                        if(res[0] == "Init")
                        {
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
                            response.write("Success");
                            response.end(); 

                            const { exec } = require("child_process");

                            exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {
                                logger.log('warn', "Die Homebridge wird neu gestartet ..");
                            });
                        }
                        else
                        {
                            response.write("Das Gerät konnte nicht entfernt werden!");
                            response.end();
                        }
                    });
                }
            }
            else if(urlPath == '/restart')
            {
                const { exec } = require("child_process");
                
                response.write('Success');
                response.end();
                
                exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {

                    logger.log('warn', "Die Homebridge wird neu gestartet ..");
                });
            }
            else if(urlPath == '/update')
            {
                const { exec } = require("child_process");
                
                exec("sudo npm install homebridge-syntex@latest -g", (error, stdout, stderr) => {

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
                        
                        logger.log('success', "Die Homebridge wurde aktualisiert!");
                        
                        exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {

                            logger.log('warn', "Die Homebridge wird neu gestartet ..");
                        });
                    }
                });
            }
            else if(urlPath == '/ping')
            {
                response.write("");
                response.end();
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

                                        response.write(HTMLQuery.sendValue(head + data, 'device', JSON.stringify(res)));
                                        response.end();
                                    });
                                }
                                else if(urlPath == '/' || urlPath.startsWith('/index') || urlPath.startsWith('/settings'))
                                {
                                    DeviceManager.getDevices().then(function(res) {

                                        response.write(HTMLQuery.sendValue(head + data, 'devices', JSON.stringify(res)));
                                        response.end();
                                    });
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
                                    
                                    var obj = {
                                        ip: address,
                                        version: pjson.version
                                    };

                                    response.write(HTMLQuery.sendValues(head + data, obj));
                                    response.end();
                                }
                                else if(urlPath.startsWith('/log'))
                                {
                                    var d = new Date();

                                    var date = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();

                                    logger.logs.load(date, (err, device) => {    

                                        if(device && !err)
                                        {    
                                            var obj = {
                                                log: JSON.stringify(device.logs).replace(" '", ' [').replace("' ", '] ').replace(/\'\"/g, '] ')
                                            };
                                        }
                            
                                        if(err || !device)
                                        {
                                            var obj = {
                                                log: []
                                            };
                                        }

                                        response.write(HTMLQuery.sendValues(head + data, obj));
                                        response.end();
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
                                    /*
                                    DeviceManager.setValue(urlParams.mac).then(function(res) {

                                        response.write(HTMLQuery.sendValue(data, 'result', res)); 
                                        response.end();
                                    });
                                    */
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