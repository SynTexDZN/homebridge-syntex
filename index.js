var request = require('request');
var http = require('http');
var url = require('url');
var store = require('json-fs-store');
var fs = require('fs');
var Service, Characteristic;

module.exports = function(homebridge)
{
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerPlatform("homebridge-syntex", "SynTex", SynTexPlatform);
};

var log;
var config;

function SynTexPlatform(slog, sconfig, api)
{
    config = store(api.user.storagePath());
    log = slog;

    this.port = config["port"] || 1711;
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
                
                if(urlPath == '/add-device')
                {
                    if(urlParams.name && urlParams.type && urlParams.mac && urlParams.ip)
                    {
                        addDevice(urlParams.mac, urlParams.ip, urlParams.type, urlParams.name).then(function(res) {
                            
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
                                response.write("Das Gerät konnte nicht hinzugefügt werden!");
                                response.end();
                            }
                        });
                    }
                }
                else if(urlPath == '/remove-device')
                {
                    if(urlParams.mac && urlParams.type)
                    {
                        removeDevice(urlParams.mac, urlParams.type).then(function(res) {
                        
                            log('\x1b[31m%s\x1b[0m', "[INFO]", "RES: " + res);
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
                else if(urlPath == '/test')
                {
                    let pathname = path.join(__dirname, "index.php");

                    fs.exists(pathname, function (exist) {
                        if(!exist) {
                            // if the file is not found, return 404
                            res.statusCode = 404;
                            res.end(`File ${pathname} not found!`);
                            return;
                        }

                        // if is a directory, then look for index.html
                        if (fs.statSync(pathname).isDirectory()) {
                            pathname += '/index.html';
                        }

                        // read file from file system
                        fs.readFile(pathname, function(err, data){
                            if(err){
                                res.statusCode = 500;
                                res.end(`Error getting the file: ${err}.`);
                            } else {
                                // based on the URL path, extract the file extention. e.g. .js, .doc, ...
                                const ext = path.parse(pathname).ext;
                                // if the file is found, set Content-type and send data
                                response.setHeader('Content-type', 'text/plain');
                                response.end(data);
                            }
                        });
                    });
                }
                else if(urlPath == '/ping')
                {
                    response.write("");
                    response.end();
                }
            }).bind(this));
            
        }).bind(this);

        http.createServer(createServerCallback).listen(this.port, "0.0.0.0");
           
        log('\x1b[33m%s\x1b[0m', "[INFO]", "Data Link Server läuft auf Port ", "'" + this.port + "'");
    }
}

async function addDevice(mac, ip, type, name)
{
    return new Promise(resolve => {
        
        var response = false;
                    
        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                obj.id = 'config';

                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        var platform = obj.platforms[i];

                        if(type == "relais" || type == "switch")
                        {
                            platform.switches[platform.switches.length] = {mac: mac, name: name, on_url: "http://" + ip + "/switch?state=true", on_method: "GET", off_url: "http://" + ip + "/switch?state=false", off_method: "GET"};

                            response = true;
                        }
                        else
                        {
                            platform.sensors[platform.sensors.length] = {mac: mac, name: name, type: type};

                            response = true;
                        }

                        if(type == "temperature")
                        {
                            platform.sensors[platform.sensors.length] = {mac: mac, name: name + "H", type: "humidity"};
                        }

                        if(type == "light")
                        {
                            platform.sensors[platform.sensors.length] = {mac: mac, name: name + "R", type: "rain"};
                        }
                    }
                }

                config.add(obj, (err) => {
                    
                    if(err)
                    {
                        log('\x1b[31m%s\x1b[0m', "[ERROR]", "Config.json konnte nicht aktualisiert werden!");

                        resolve(false);
                    }
                    else
                    {
                        log('\x1b[32m%s\x1b[0m', "[SUCCESS]", "Neues Gerät wurde der Config hinzugefügt ( " + this.mac + " )");
                        
                        resolve(response);
                    }
                });    
            }
            
            if(err || !obj)
            {
                log('\x1b[31m%s\x1b[0m', "[ERROR]", "Config.json konnte nicht geladen werden!");
                
                resolve(false);
            }
        });
    });
}

async function removeDevice(mac, type)
{
    return new Promise(resolve => {
        
        var response = false;

        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                obj.id = 'config';

                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        var platform = obj.platforms[i];

                        if(type == "relais" || type == "switch")
                        {
                            for(const i in platform.switches)
                            {
                                if(platform.switches[i].mac === mac)
                                {
                                    platform.switches.splice(i, 1);

                                    response = true;
                                }
                            }
                        }
                        else
                        {
                            for(const i in platform.sensors)
                            {
                                if(platform.sensors[i].mac === mac)
                                {
                                    platform.sensors.splice(i, 1);

                                    response = true;
                                }
                            }
                        }

                        if(response)
                        {
                            config.add(obj, (err) => {

                                if(err)
                                {
                                    log('\x1b[31m%s\x1b[0m', "[ERROR]", "Config.json konnte nicht aktualisiert werden!");

                                    resolve(false);
                                }
                                else
                                {
                                    log('\x1b[32m%s\x1b[0m', "[SUCCESS]", "Gerät wurde aus der Config entfernt ( " + mac + " )");

                                    resolve(true);
                                }
                            });
                        }
                        else
                        {
                            resolve(false);
                        }
                    }
                }
            }
            
            if(err || !obj)
            {
                log('\x1b[31m%s\x1b[0m', "[ERROR]", "Config.json konnte nicht geladen werden!");
                
                resolve(false);
            }    
        });
    });
}