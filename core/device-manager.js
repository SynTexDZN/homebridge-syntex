var store = require('json-fs-store');
var config, storage, dataStorage, logger;
    
async function removeDevice(mac, type)
{
    return new Promise(resolve => {

        config.load('config', async function(err, obj) {

            if(obj && !err)
            {
                var configObj = null;

                while(await existsInConfig(obj, mac))
                {
                    configObj = await removeFromConfig(obj, mac);
                }

                if(configObj != null)
                {
                    config.add(configObj, async function(err) {

                        if(err)
                        {
                            logger.log('error', "Config.json konnte nicht aktualisiert werden! " + err);
        
                            resolve(false);
                        }
                        else
                        {
                            if(await removeFromSettingsStorage(mac))
                            {
                                await removeFromDataStorage(mac, type);

                                resolve(true);
                            }
                            else
                            {
                                resolve(false);
                            }
                        }
                    });
                }
                else
                {
                    if(await removeFromSettingsStorage(mac))
                    {
                        await removeFromDataStorage(mac, type);

                        resolve(true);
                    }
                    else
                    {
                        resolve(false);
                    }
                }
            }
            else
            {
                logger.log('error', "Config.json konnte nicht geladen werden! " + err);
        
                resolve(false);
            }
        });
    });
}

async function existsInConfig(obj, mac)
{
    return new Promise(resolve => {

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
                            resolve(true);
                        }
                    }
                }
            }
        }

        resolve(false);
    });
}

async function removeFromConfig(obj, mac)
{
    return new Promise(resolve => {

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
                        }
                    }
                }
            }
        }

        resolve(obj);
    });
}

async function removeFromSettingsStorage(mac)
{
    return new Promise(resolve => {

        storage.remove(mac, (err) => {
                                
            if(err)
            {
                logger.log('error', "Das Gerät konnte nicht aus der Settings Storage entfernt werden! " + err);
            }

            resolve(err ? false : true);
        });
    });
}

async function removeFromDataStorage(mac, type)
{
    return new Promise(resolve => {

        if(type == 'temperature')
        {
            dataStorage.remove(mac + '-T', (err) => {

                dataStorage.remove(mac + '-H', (err) => {

                    resolve();
                });
            });
        }
        else if(type == 'light')
        {
            dataStorage.remove(mac + '-L', (err) => {

                dataStorage.remove(mac + '-R', (err) => {

                    resolve();
                });
            });
        }
        else
        {
            dataStorage.remove(mac, (err) => {

                resolve();
            });
        }
    });
}

async function initDevice(mac, ip, name, type, version, interval, events)
{
    return new Promise(async function(resolve) {
        
        var eventButton = await checkEventButton(mac);
        var device = await getDevice(mac);

        if(device != null)
        {
            if(ip != device['ip'])
            {
                setValue(mac, 'ip', ip);
            }

            if(version != device['version'])
            {
                setValue(mac, 'version', version);
            }

            var status = 'Success';

            if(!eventButton && device['events'] && (device['events'] || []).length != 0 && await createEventButton(mac, device['name'], (device['events'] || []).length))
            {
                status = 'Init';
            }

            resolve([status, '{"name": "' + (device['name'] || name) + '", "active": "' + (device['active'] || 1) + '", "interval": "' + (device['interval'] || interval) + '", "led": "' + (device['led'] || 1) + '", "port": "' + (webhookPort || 1710) + '", "events": [' + (device['events'] || events) + ']}']);
        }
        else if(await checkName(name))
        {
            config.load('config', async function(err, obj) {

                if(obj && !err)
                {
                    var configObj = null;

                    while(await existsInConfig(obj, mac))
                    {
                        configObj = await removeFromConfig(obj, mac);
                    }

                    configObj = await addToConfig(configObj || obj, mac, ip, name, type);

                    config.add(configObj, async function(err) {

                        if(err)
                        {
                            logger.log('error', "Config.json konnte nicht aktualisiert werden! " + err);

                            resolve(['Error', '']);
                        }
                        else
                        {
                            var device = {
                                id: mac,
                                ip: ip,
                                name: name,
                                type: type,
                                version: version,
                                active: 1,
                                interval: parseInt(interval),
                                led: 1,
                                events: []
                            };

                            storage.add(device, (err) => {

                                if(err)
                                {
                                    logger.log('error', mac + ".json konnte nicht erstellt werden! " + err);

                                    resolve(['Error', '']);
                                }
                                else
                                {
                                    logger.log('success', "Neues Gerät wurde dem System hinzugefügt ( " + mac + " )");

                                    resolve(['Init', '{"name": "' + name + '", "active": "1", "interval": "' + interval + '", "led": "1", "port": "' + webhookPort + '", "events": []}']);
                                }
                            });
                        }
                    });
                }
                else
                {
                    logger.log('error', "Config.json konnte nicht geladen werden! " + err);

                    resolve(['Error', '']);
                }
            });
        }
        else
        {
            resolve(['Error', 'Der Name ist bereits vergeben!']);
        }
    });
}

async function initSwitch(mac, name)
{
    return new Promise(async function(resolve) {
        
        if(!await checkName(name))
        {
            resolve(['Error', 'Name ist bereits Vergeben!']);
        }
        else if(!await checkMac(mac))
        {
            resolve(['Error', 'Mac ist bereits Vergeben!']);          
        }
        else
        {
            config.load('config', async function(err, obj) {

                if(obj && !err)
                {
                    var configObj = await addToConfig(obj, mac, null, name, 'switch');

                    config.add(configObj, async function(err) {

                        if(err)
                        {
                            logger.log('error', "Config.json konnte nicht aktualisiert werden! " + err);

                            resolve(['Error', '']);
                        }
                        else
                        {
                            var device = {
                                id: mac,
                                name: name,
                                type: 'switch',
                                active: 1
                            };

                            storage.add(device, (err) => {

                                if(err)
                                {
                                    logger.log('error', mac + ".json konnte nicht erstellt werden! " + err);

                                    resolve(['Error', 'Fehler beim Erstellen!']);
                                }
                                else
                                {
                                    logger.log('success', "Neues Gerät wurde dem System hinzugefügt ( " + mac + " )");

                                    resolve(['Success', '']);
                                }
                            });
                        }
                    });
                }
                else
                {
                    logger.log('error', "Config.json konnte nicht geladen werden! " + err);

                    resolve(['Error', 'Fehler beim Erstellen!']);
                }
            });
        }
    });
}

async function addToConfig(obj, mac, ip, name, type)
{
    return new Promise(resolve => {

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
                else if(type != "switch" && type != "statelessswitch")
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

                if((type == "light" || type == "temperature" || type == "statelessswitch") && !eventButton)
                {
                    platform.statelessswitches[platform.statelessswitches.length] = {mac: mac, name: name, buttons: 0};
                }
            }
        }

        resolve(obj);
    });
}

async function checkName(name)
{
    return new Promise(resolve => {
        
        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        var configContainer = [obj.platforms[i].sensors, obj.platforms[i].switches, obj.platforms[i].lights, obj.platforms[i].statelessswitches];

                        for(const i in configContainer)
                        {
                            for(const j in configContainer[i])
                            {
                                if(configContainer[i][j].name === name)
                                {
                                    resolve(false);
                                }
                            }
                        }
                    }
                }
            }
            
            resolve(true);
        });
    });
}

async function checkMac(mac)
{
    return new Promise(resolve => {
        
        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        var configContainer = [obj.platforms[i].sensors, obj.platforms[i].switches, obj.platforms[i].lights, obj.platforms[i].statelessswitches];

                        for(const i in configContainer)
                        {
                            for(const j in configContainer[i])
                            {
                                if(configContainer[i][j].mac === mac)
                                {
                                    resolve(false);
                                }
                            }
                        }
                    }
                }
            }
            
            resolve(true);
        });
    });
}

async function getValue(mac, param)
{
    return new Promise(resolve => {
        
        storage.load(mac, (err, obj) => {  

            if(!obj || err)
            {
                resolve(null);
            }
            else
            {
                resolve(obj[param]);
            }
        });
    });
}

async function getDevice(mac)
{
    return new Promise(resolve => {
        
        storage.load(mac, (err, obj) => {  
            
            if(!obj || err)
            {
                resolve(null);
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
                resolve(null);
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

            if(!obj || err)
            {
                resolve(false);
            }
            else
            {
                obj[param] = value;
                
                storage.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', mac + ".json konnte nicht aktualisiert werden! " + err);
                    }

                    resolve(err ? false : true);
                });
            }
        });
    });
}

async function setValues(values)
{
    return new Promise(resolve => {
        
        storage.load(values.mac, (err, obj) => {  

            if(!obj || err)
            {
                resolve(false);
            }
            else
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
                        logger.log('error', values.mac + ".json konnte nicht aktualisiert werden! " + err);
                    }

                    resolve(err ? false : true);
                });
            }
        });
    });
}

async function checkEventButton(mac)
{
    return new Promise(resolve => {

        config.load('config', (err, obj) => {    

            if(!obj || err)
            {
                logger.log('error', "Config.json konnte nicht geladen werden!");

                resolve(false);
            }
            else
            {                            
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
        });
    });
}

async function createEventButton(mac, name, buttons)
{
    return new Promise(resolve => {

        config.load('config', (err, obj) => {    

            if(!obj || err)
            {
                logger.log('error', "Config.json konnte nicht geladen werden!");

                resolve(false);
            }
            else
            {                            
                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        obj.platforms[i].statelessswitches[obj.platforms[i].statelessswitches.length] = {mac: mac, name: name + ' Events', buttons: buttons};
                    }
                }

                config.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', "Config.json konnte nicht aktualisiert werden! " + err);
                    }
                    else
                    {
                        logger.log('success', "Neues Gerät wurde dem System hinzugefügt ( " + mac + " )");
                    }

                    resolve(err ? false : true);
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
};

module.exports = {
    SETUP,
    getValue,
    getDevice,
    getDevices,
    setValue,
    setValues,
    initDevice,
    initSwitch,
    removeDevice
};