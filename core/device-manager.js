var store = require('json-fs-store');
var config, storage, dataStorage, logger;
    
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

                        if(type == "relais")
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
                        else if(type == "switch")
                        {
                            for(const i in platform.statelessswitches)
                            {
                                if(platform.statelessswitches[i].mac === mac)
                                {
                                    platform.statelessswitches.splice(i, 1);

                                    response = true;
                                }
                            }
                        }
                        else if(type == "rgb" || type == "rgbw")
                        {
                            for(const i in platform.lights)
                            {
                                if(platform.lights[i].mac === mac)
                                {
                                    platform.lights.splice(i, 1);

                                    response = true;
                                }
                            }
                        }
                        else
                        {
                            if(type == 'temperature')
                            {
                                for(const i in platform.sensors)
                                {
                                    if(platform.sensors[i].mac === mac && platform.sensors[i].type === 'humidity')
                                    {
                                        platform.sensors.splice(i, 1);
                                    }
                                }
                            }
                            else if(type == 'light')
                            {
                                for(const i in platform.sensors)
                                {
                                    if(platform.sensors[i].mac === mac && platform.sensors[i].type === 'rain')
                                    {
                                        platform.sensors.splice(i, 1);
                                    }
                                }
                            }

                            for(const i in platform.sensors)
                            {
                                if(platform.sensors[i].mac === mac)
                                {
                                    platform.sensors.splice(i, 1);

                                    response = true;
                                }
                            }
                        }
                    }
                }

                if(response)
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

async function initDevice(mac, ip, name, type, version, interval, buttons)
{
    return new Promise(resolve => {
        
        exists(mac).then(async function(res)
        {
            if(res)
            {
                var dbName = await getValue(mac, 'name');
                var dbInterval = await getValue(mac, 'interval');
                var dbLED = await getValue(mac, 'led');
                var dbButtons = await getValue(mac, 'buttons');
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

                resolve(['Success', '{"name": "' + dbName + '", "interval": "' + dbInterval + '", "led": "' + dbLED + '", "buttons": ' + dbButtons + ', "port": "' + webhookPort + '"}']);
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
                        interval: interval,
                        led: 1,
                        buttons: []
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

                                            if(buttons.length != 0)
                                            {
                                                platform.statelessswitches[platform.statelessswitches.length] = {mac: mac, name: name, buttons: buttons.length};
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

                                            resolve(['Init', '{"name": "' + name + '", "interval": "' + interval + '", "led": "1", "buttons": [], "port": "' + webhookPort + '"}']);
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