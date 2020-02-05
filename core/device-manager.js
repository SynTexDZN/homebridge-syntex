var store = require('json-fs-store');
var config, log;

module.exports.addDevice = (mac, ip, type, name) =>
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
                        log('\x1b[31m%s\x1b[0m', "[ERROR]", "Config.json konnte nicht aktualisiert werden!", err);

                        resolve(false);
                    }
                    else
                    {
                        log('\x1b[32m%s\x1b[0m', "[SUCCESS]", "Neues Gerät wurde der Config hinzugefügt ( " + mac + " )");

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
    
module.exports.removeDevice = (mac, type) =>
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
                                    log('\x1b[31m%s\x1b[0m', "[ERROR]", "Config.json konnte nicht aktualisiert werden!", err);

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

module.exports.checkName = (name) =>
{
    return new Promise(resolve => {
        
        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                obj.id = 'config';

                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        var platform = obj.platforms[i];
                        
                        for(const i in platform.switches)
                        {
                            if(platform.sensors[i].name === name)
                            {
                                resolve(false);
                            }
                        }
                        
                        for(const i in platform.sensors)
                        {
                            if(platform.sensors[i].name === name)
                            {
                                resolve(false);
                            }
                        }
                        
                        resolve(true);
                    }
                }
            }
            
            resolve(false);
        });
    });
}

module.exports.SETUP = (path, slog) =>
{
    config = store(path);
    log = slog;
};