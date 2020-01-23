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
    this.configPath = api.user.storagePath();
    config = store(this.configPath);
    
    this.cacheDirectory = config["cache_directory"] || "./.node-persist/storage";
    this.storage = store(this.cacheDirectory);
    
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
                        var res = addDevice(urlParams.mac, urlParams.ip, urlParams.type, urlParams.name);
                        
                        if(res != 0)
                        {
                            response.write((String)(res));
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
                    }
                }
                else if(urlPath == '/remove-device')
                {
                    if(urlParams.mac && urlParams.type)
                    {
                        if(removeDevice(urlParams.mac, urlParams.type))
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

function addDevice(mac, ip, type, name)
{
    var response = 0;
                    
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

                        response = platform.switches.length;
                    }
                    else
                    {
                        platform.sensors[platform.sensors.length] = {id: "sensor" + (platform.sensors.length + 1), mac: mac, name: name, type: type};

                        response = platform.sensors.length;
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
            });
        }
        else
        {
            log('[ERROR] Config konnte nicht geladen werden');
        }

        return response;
    });
}

function removeDevice(mac, type)
{
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
                    });
                }
            }
        }
        else
        {
            log('[ERROR] Config konnte nicht geladen werden');
        }
        
        return response;
    });
}