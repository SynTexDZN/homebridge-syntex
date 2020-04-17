var store = require('json-fs-store');
var config, storage, dataStorage, logger;
    
async function removeDevice(mac, type)
{
    return new Promise(resolve => {

        config.load('config', (err, obj) => {    

            if(obj)
            {                       
                var configRemoved = false;

                obj.id = 'config';

                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        var platform = obj.platforms[i];
                        var configContainer = [platform.sensors, platform.switches, platform.lights, platform.statelessswitches];

                        for(const i in configContainer)
                        {
                            for(const j in configContainer[i])
                            {
                                if(configContainer[i][j].mac === mac)
                                {
                                    configContainer[i].splice(j, 1);

                                    configRemoved = true;
                                }
                            }
                        }

                        if(type == 'temperature' || type == 'light')
                        {
                            for(const i in platform.sensors)
                            {
                                if(platform.sensors[i].mac === mac)
                                {
                                    platform.sensors.splice(i, 1);
                                }
                            }
                        }
                    }
                }

                if(configRemoved)
                {
                    config.add(obj, (err) => {

                        if(err)
                        {
                            logger.log('error', "Config.json konnte nicht aktualisiert werden!" + err);

                            resolve(false);
                        }
                        else
                        {
                            storage.remove(mac, (err) => {
                                
                                if(err)
                                {
                                    logger.log('error', "Das Gerät konnte nicht aus der Settings Storage entfernt werden!" + err);
                                    
                                    resolve(false);
                                }
                                else
                                {
                                    if(type == 'temperature')
                                    {
                                        dataStorage.remove(mac + '-T', (err) => {

                                            dataStorage.remove(mac + '-H', (err) => {
                                
                                                logger.log('success', "Gerät wurde aus dem System entfernt ( " + mac + " )");
        
                                                resolve(true);
                                            });
                                        });
                                    }
                                    else if(type == 'light')
                                    {
                                        dataStorage.remove(mac + '-L', (err) => {

                                            dataStorage.remove(mac + '-R', (err) => {
                                
                                                logger.log('success', "Gerät wurde aus dem System entfernt ( " + mac + " )");
        
                                                resolve(true);
                                            });
                                        });
                                    }
                                    else
                                    {
                                        dataStorage.remove(mac, (err) => {
                                
                                            logger.log('success', "Gerät wurde aus dem System entfernt ( " + mac + " )");
    
                                            resolve(true);
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                else
                {
                    resolve(false);
                }
            }

            if(err || !obj)
            {
                logger.log('error', "Config.json konnte nicht geladen werden!");

                resolve(false);
            }    
        });
    });
}

async function checkName(name)
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

async function initDevice(mac, ip, name, type, version, interval, events)
{
    return new Promise(async function(resolve) {
        
        var res = await exists(mac);
        var eventButton = await checkEventButton(mac);

        if(res)
        {
            var dbName = await getValue(mac, 'name');
            var dbInterval = (await getValue(mac, 'interval') || 0);
            var dbLED = (await getValue(mac, 'led') || 1);
            var dbEvents = (await getValue(mac, 'events') || []);
            var dbIP = await getValue(mac, 'ip');
            var dbVersion = await getValue(mac, 'version');

            if(ip != dbIP)
            {
                setValue(mac, 'ip', ip);
            }

            if(version != dbVersion)
            {
                setValue(mac, 'version', version);
            }

            if(dbEvents && !eventButton && dbEvents.length != 0)
            {
                var created = await createEventButton(mac, dbName, dbEvents.length);

                if(created)
                {
                    resolve(['Init', '{"name": "' + dbName + '", "interval": "' + dbInterval + '", "led": "' + dbLED + '", "events": [' + dbEvents + '], "port": "' + webhookPort + '"}']);
                }
            }

            resolve(['Success', '{"name": "' + dbName + '", "interval": "' + dbInterval + '", "led": "' + dbLED + '", "events": [' + dbEvents + '], "port": "' + webhookPort + '"}']);
        }
        else
        {
            var duplicate = await checkName(name);

            if(duplicate)
            {
                var device = {
                    id: mac,
                    ip: ip,
                    name: name,
                    type: type,
                    version: version,
                    interval: parseInt(interval),
                    led: 1,
                    events: []
                };

                storage.add(device, (err) => {

                    if(err)
                    {
                        logger.log('error', mac + ".json konnte nicht aktualisiert werden!" + err);

                        resolve(['Error', '']);
                    }
                    else
                    {
                        config.load('config', (err, obj) => {    

                            if(obj)
                            {                            
                                obj.id = 'config';

                                for(const i in obj.platforms)
                                {
                                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                                    {
                                        var platform = obj.platforms[i];

                                        if(type == "relais")
                                        {
                                            platform.switches[platform.switches.length] = {mac: mac, name: name, type: type, on_url: "http://" + ip + "/switch?state=true", on_method: "GET", off_url: "http://" + ip + "/switch?state=false", off_method: "GET"};
                                        }
                                        else if(type == "rgb" || type == "rgbw")
                                        {
                                            platform.lights[platform.lights.length] = {mac: mac, name: name, type: type, url: "http://" + ip + "/color"};
                                        }
                                        else if(type != "switch")
                                        {
                                            platform.sensors[platform.sensors.length] = {mac: mac, name: name, type: type};
                                        }

                                        if(type == "temperature")
                                        {
                                            platform.sensors[platform.sensors.length] = {mac: mac, name: name + "-H", type: "humidity"};
                                        }

                                        if(type == "light")
                                        {
                                            platform.sensors[platform.sensors.length] = {mac: mac, name: name + "-R", type: "rain"};
                                        }

                                        if((type == "light" || type == "temperature" || type == "switch") && !eventButton)
                                        {
                                            platform.statelessswitches[platform.statelessswitches.length] = {mac: mac, name: name, buttons: 0};
                                        }
                                    }
                                }

                                config.add(obj, (err) => {

                                    if(err)
                                    {
                                        logger.log('error', "Config.json konnte nicht aktualisiert werden!" + err);

                                        resolve(['Error', '']);
                                    }
                                    else
                                    {
                                        logger.log('success', "Neues Gerät wurde dem System hinzugefügt ( " + mac + " )");

                                        resolve(['Init', '{"name": "' + name + '", "interval": "' + interval + '", "led": "1", "events": [], "port": "' + webhookPort + '"}']);
                                    }
                                });    
                            }

                            if(err || !obj)
                            {
                                logger.log('error', "Config.json konnte nicht geladen werden!");

                                resolve(['Error', '']);
                            }
                        });
                    }
                });
            }
            else
            {
                resolve(['Error', 'Der Name ist bereits vergeben!']);
            }
        }
    });
}

async function exists(mac)
{
    return new Promise(resolve => {
        
        storage.load(mac, (err, obj) => {  

            if(obj)
            {
                resolve(true);
            }
            else
            {
                resolve(false);
            }
        });
    });
}

async function getValue(mac, param)
{
    return new Promise(resolve => {
        
        storage.load(mac, (err, obj) => {  

            resolve(obj[param]);
        });
    });
}

async function getDevice(mac)
{
    return new Promise(resolve => {
        
        storage.load(mac, (err, obj) => {  
            
            if(!obj || err)
            {
                resolve(false);
            }
            else
            {
                resolve(obj);
            }
        });
    });
}

async function getDevices()
{
    return new Promise(resolve => {
        
        storage.list((err, objs) => {  

            if(!objs || err)
            {
                resolve(false);
            }
            else
            {
                objs.sort((a, b) => (a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0));
                
                resolve(objs);
            }
        });
    });
}

async function setValue(mac, param, value)
{
    return new Promise(resolve => {
        
        storage.load(mac, (err, obj) => {  

            if(obj && !err)
            {
                obj[param] = value;
                
                storage.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', mac + ".json konnte nicht aktualisiert werden!" + err);

                        resolve(false);
                    }
                    else
                    {
                        resolve(true);
                    }
                });
            }
        });
    });
}

async function setValues(values)
{
    return new Promise(resolve => {
        
        storage.load(values.mac, (err, obj) => {  

            if(obj && !err)
            {
                for(const i in values)
                {
                    if(i != 'mac')
                    {
                        obj[i] = values[i];
                    }
                }                
                
                storage.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', mac + ".json konnte nicht aktualisiert werden!" + err);

                        resolve(false);
                    }
                    else
                    {
                        resolve(true);
                    }
                });
            }
        });
    });
}

async function checkEventButton(mac)
{
    return new Promise(resolve => {

        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                obj.id = 'config';

                var found = false;

                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        for(const j in obj.platforms[i].statelessswitches)
                        {
                            if(obj.platforms[i].statelessswitches[j].mac === mac)
                            {
                                found = true;
                            }
                        }
                    }
                }

                resolve(found ? true : false);
            }

            if(err || !obj)
            {
                logger.log('error', "Config.json konnte nicht geladen werden!");

                resolve(false);
            }
        });
    });
}

async function createEventButton(mac, name, buttons)
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

                        platform.statelessswitches[platform.statelessswitches.length] = {mac: mac, name: name + ' Events', buttons: buttons};
                    }
                }

                config.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', "Config.json konnte nicht aktualisiert werden!" + err);

                        resolve(false);
                    }
                    else
                    {
                        logger.log('success', "Neues Gerät wurde dem System hinzugefügt ( " + mac + " )");

                        resolve(true);
                    }
                });    
            }

            if(err || !obj)
            {
                logger.log('error', "Config.json konnte nicht geladen werden!");

                resolve(false);
            }
        });
    });
}

function SETUP(configPath, slog, storagePath, wPort)
{
    config = store(configPath);
    storage = store(storagePath);
    dataStorage = store(storagePath.replace('/data', '/'));
    logger = slog;
    webhookPort = wPort;

    console.log(configPath);
    console.log(slog);
    console.log(storagePath);
    console.log(wPort);
};

module.exports = {
    SETUP,
    getValue,
    getDevice,
    getDevices,
    setValue,
    setValues,
    exists,
    initDevice,
    removeDevice,
    checkName
};