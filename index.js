var request = require('request');
var http = require('http');
var https = require('https');
var url = require('url');
var auth = require('http-auth');
var store = require('json-fs-store');
var Service, Characteristic;

module.exports = function(homebridge)
{
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerPlatform("homebridge-syntex", "SynTex", SynTexPlatform);
};

function SynTexPlatform(log, config, api)
{
    this.configPath = api.user.storagePath();
    this.config = store(this.configPath);
    this.cacheDirectory = config["cache_directory"] || "./.node-persist/storage";
    this.storage = store(this.cacheDirectory);
    this.log = log;
    
    //this.autoConfig = config["autoConfig"] || true;
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
                this.log("[ERROR] Reason: %s.", err);
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
                    var error = true;
                    
                    if(urlParams.name && urlParams.type && urlParams.mac && urlParams.ip)
                    {
                        config.load('config', (err, obj) => {    
          
                            if(obj)
                            {                            
                                this.log('Config.json geladen!');

                                obj.id = 'config';

                                for(const i in obj.platforms)
                                {
                                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                                    {
                                        var platform = obj.platforms[i];

                                        if(urlParams.type == "relais" || urlParams.type == "switch")
                                        {
                                            platform.switches[platform.switches.length] = {id: "switch" + (platform.switches.length + 1), mac: urlParams.mac, name: urlParams.name, on_url: "http://" + urlParams.ip + "/switch?state=1", on_method: "GET", off_url: "http://" + urlParams.ip + "/switch?state=0", off_method: "GET"};
                                            
                                            response.write((String)(platform.switches.length));
                                            response.end(); 
                                        }
                                        else
                                        {
                                            platform.sensors[platform.sensors.length] = {id: "sensor" + (platform.sensors.length + 1), mac: urlParams.mac, name: urlParams.name, type: urlParams.type};
                                            
                                            response.write((String)(platform.sensors.length));
                                            response.end(); 
                                        }

                                        if(urlParams.type == "temperature")
                                        {
                                            platform.sensors[platform.sensors.length] = {id: "sensor" + (platform.sensors.length + 2), mac: urlParams.mac, name: urlParams.name + "H", type: "humidity"};
                                        }
                                        
                                        if(urlParams.type == "light")
                                        {
                                            platform.sensors[platform.sensors.length] = {id: "sensor" + (platform.sensors.length + 2), mac: urlParams.mac, name: urlParams.name + "R", type: "rain"};
                                        }
                                        
                                        error = false;
                                    }
                                }

                                this.log('Neues Gerät wird der Config hinzugefügt');

                                config.add(obj, (err) => {

                                    this.log('Config.json aktualisiert!');
                                });
                            }
                            else
                            {
                                this.log('[ERROR] Config konnte nicht geladen werden');
                            }
                            
                            if(error)
                            {
                                response.write('Error');
                                response.end(); 
                            }
                        });
                        
                        const { exec } = require("child_process");

                        exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {
                            console.log('Homebridge wird neu gestartet');
                        });
                    }
                }
                else if(urlPath == '/remove-device')
                {
                    var error = true;
                    
                    if(urlParams.mac)
                    {
                        config.load('config', (err, obj) => {    
          
                            if(obj)
                            {                            
                                this.log('Config.json geladen!');

                                obj.id = 'config';

                                for(const i in obj.platforms)
                                {
                                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                                    {
                                        var platform = obj.platforms[i];
                                        
                                        if(urlParams.type == "relais" || urlParams.type == "switch")
                                        {
                                            for(const i in platform.switches)
                                            {
                                                if(platform.switches[i].mac === urlParams.mac)
                                                {
                                                    platform.switches.splice(i, 1);

                                                    error = false;

                                                    response.write("Success");
                                                    response.end(); 
                                                }
                                            }
                                        }
                                        else
                                        {
                                            for(const i in platform.sensors)
                                            {
                                                if(platform.sensors[i].mac === urlParams.mac)
                                                {
                                                    platform.sensors.splice(i, 1);

                                                    error = false;

                                                    response.write("Success");
                                                    response.end(); 
                                                }
                                            }
                                        }
                                        
                                        if(error)
                                        {
                                            response.write("Error");
                                            response.end();
                                        }
                                        
                                        this.log('Gerät wurde aus der Config entfernt');

                                        config.add(obj, (err) => {

                                            this.log('Config.json aktualisiert!');
                                        });
                                        
                                        const { exec } = require("child_process");

                                        exec("sudo systemctl restart homebridge", (error, stdout, stderr) => {
                                            console.log('Homebridge wird neu gestartet');
                                        });
                                    }
                                }
                                
                                if(error)
                                {
                                    response.write("Error");
                                    response.end();
                                }
                            }
                            else
                            {
                                this.log('[ERROR] Config konnte nicht geladen werden');
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
                else if(urlPath == '/ping')
                {
                    this.log(this.configPath);
                    
                    response.write("");
                    response.end();
                }
                else
                {
                    // Index
                    
                    this.log("Index wurde aufgerufen!");
                    response.write("Hallo Welt!");
                    response.end();                    
                }
            }).bind(this));
        }).bind(this);

        http.createServer(createServerCallback).listen(this.port, "0.0.0.0");
           
        this.log("Data Link Server läuft auf Port '%s'.", this.port);
    }
}