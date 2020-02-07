var request = require('request');
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var DeviceManager = require('./core/device-manager');
var HTMLQuery = require('./core/html-query');

module.exports = function(homebridge)
{
    homebridge.registerPlatform("homebridge-syntex", "SynTex", SynTexPlatform);
};

var log;

function SynTexPlatform(slog, config, api)
{
    log = slog;

    this.cacheDirectory = config["cache_directory"] || "./SynTex/data";
    this.port = config["port"] || 1711;
    
    DeviceManager.SETUP(api.user.storagePath(), log, this.cacheDirectory);
    HTMLQuery.SETUP(log);
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
            var body = [];
            
            request.on('error', (function(err)
            {
                log('\x1b[31m%s\x1b[0m', "[ERROR]", "Reason: ", err);
                
            }).bind(this)).on('data', function(chunk)
            {
                body.push(chunk);
                
            }).on('end', (function()
            {
                body = Buffer.concat(body).toString();

                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                response.setHeader('Access-Control-Allow-Origin', 'http://syntex.local');
                
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
                                    log('\x1b[31m%s\x1b[0m', "[WARNING]", "Die Homebridge wird neu gestartet ..");
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
                                    log('\x1b[31m%s\x1b[0m', "[WARNING]", "Die Homebridge wird neu gestartet ..");
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
                else if(urlPath == '/ping')
                {
                    response.write("");
                    response.end();
                }
                else
                {
                    var pathname = path.join(__dirname, urlPath.substring(1));
                    
                    var noext = false;
                    
                    if(path.parse(urlPath).ext == '')
                    {
                        noext = true;
                    }
  
                    fs.exists(pathname, function(exist)
                    {
                        if(exist || noext)
                        {
                            if(exist && fs.statSync(pathname).isDirectory())
                            {
                                pathname += '/index.html';
                            }
                            else if(noext)
                            {
                                pathname += '.html';
                            }

                            fs.readFile(pathname, function(err, data)
                            {
                                if(err)
                                {
                                    response.statusCode = 500;
                                    response.end('Die Seite konnte nicht geladen werden: ' + err);
                                }
                                else
                                {
                                    fs.readFile(__dirname + '/includes/head.html', function(err, head)
                                    {                                        
                                        if(!head)
                                        {
                                            head = "";
                                        }
                                        
                                        var mimeType = {
                                            ".html": "text/html",
                                            ".jpeg": "image/jpeg",
                                            ".jpg": "image/jpeg",
                                            ".png": "image/png",
                                            ".js": "text/javascript",
                                            ".css": "text/css",
                                            ".ttf": "font/ttf"
                                        };

                                        log(urlPath);
                                        log(urlPath.startsWith('/index'));

                                        response.setHeader('Content-Type', mimeType[path.parse(urlPath).ext] || 'text/html; charset=utf-8');

                                        if(urlPath.startsWith('/devices/') && urlParams.mac)
                                        {
                                            DeviceManager.getDevice(urlParams.mac).then(function(res) {

                                                log(res);

                                                response.write(HTMLQuery.send(head + data, 'device', JSON.stringify(res)));
                                                response.end();
                                            });
                                        }
                                        else if(urlPath == '/' || urlPath.startsWith('/index') || urlPath.startsWith('/settings'))
                                        {
                                            DeviceManager.getDevices().then(function(res) {

                                                log(res);

                                                response.write(HTMLQuery.send(head + data, 'devices', JSON.stringify(res)));
                                                response.end();
                                            });
                                        }
                                        else if(path.parse(urlPath).ext == '.html')
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
                                }
                            });
                        }
                        else
                        {
                            response.statusCode = 404;
                            response.end('Die Seite ' + pathname + ' wurde nicht gefunden!');
                        }
                    });
                }
                
            }).bind(this));
            
        }).bind(this);

        http.createServer(createServerCallback).listen(this.port, "0.0.0.0");
           
        log('\x1b[33m%s\x1b[0m', "[INFO]", "Data Link Server läuft auf Port ", "'" + this.port + "'");
    }
}