var request = require('request');
var http = require('http');
var url = require('url');
var store = require('json-fs-store');
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
    this.cacheDirectory = config["cache_directory"] || "./.node-persist/storage";
    this.port = config["port"] || 1711;
    
    this.storage = store(this.cacheDirectory);    
    
    config = store(api.user.storagePath());
    log = slog;
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
                log("[ERROR] Reason: %s.", err);
                
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
                                response.write("Gerät wurde hinzugefügt!");
                                response.end();

                                const { exec } = require("child_process");

                                exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {
                                    console.log('Homebridge wird neu gestartet');
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
                        
                            if(res)
                            {
                                response.write("Gerät wurde gelöscht!");
                                response.end(); 

                                const { exec } = require("child_process");

                                exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {
                                    console.log('Homebridge wird neu gestartet');
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
            }).bind(this));
            
        }).bind(this);

        http.createServer(createServerCallback).listen(this.port, "0.0.0.0");
           
        log("Data Link Server läuft auf Port '%s'.", this.port);
    }
}

async function addDevice(mac, ip, type, name)
{
    return new Promise(resolve => {
        
        var response = false;
                    
        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                log('Config.json geladen!');

                obj.id = 'config';

                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        var platform = obj.platforms[i];

                        if(type == "relais" || type == "switch")
                        {
                            platform.switches[platform.switches.length] = {id: "switch" + (platform.switches.length + 1), mac: mac, name: name, on_url: "http://" + ip + "/switch?state=1", on_method: "GET", off_url: "http://" + ip + "/switch?state=0", off_method: "GET"};

                            response = true;
                        }
                        else
                        {
                            platform.sensors[platform.sensors.length] = {id: "sensor" + (platform.sensors.length + 1), mac: mac, name: name, type: type};

                            response = true;
                        }

                        if(type == "temperature")
                        {
                            platform.sensors[platform.sensors.length] = {id: "sensor" + (platform.sensors.length + 2), mac: mac, name: name + "H", type: "humidity"};
                        }

                        if(type == "light")
                        {
                            platform.sensors[platform.sensors.length] = {id: "sensor" + (platform.sensors.length + 2), mac: mac, name: name + "R", type: "rain"};
                        }
                    }
                }

                log('Neues Gerät wird der Config hinzugefügt');

                config.add(obj, (err) => {

                    log('Config.json aktualisiert!');

                    resolve(response);
                });    
                
                resolve(false);
            }
            else
            {
                log('[ERROR] Config konnte nicht geladen werden');

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
                log('Config.json geladen!');

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

                        log('Gerät wurde aus der Config entfernt');

                        config.add(obj, (err) => {

                            log('Config.json aktualisiert!');

                            resolve(response);
                        });
                        
                        resolve(false);
                    }
                }
            }
            else
            {
                log('[ERROR] Config konnte nicht geladen werden');

                resolve(false);
            }        
        });
    });
}