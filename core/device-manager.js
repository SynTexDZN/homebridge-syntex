var store = require('json-fs-store');
var config, storage, dataStorage, logger, accessories;
    
function removeDevice(mac)
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
                            logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht aktualisiert werden! ' + err);
        
                            resolve(false);
                        }
                        else
                        {
                            if(await removeFromSettingsStorage(mac))
                            {
                                await removeFromDataStorage(mac);

                                resolve(true);
                            }
                            else
                            {
                                resolve(false);
                            }
                        }
                    });
                }
                else if(await removeFromSettingsStorage(mac))
                {
                    await removeFromDataStorage(mac);

                    resolve(true);
                }
                else
                {
                    await removeFromDataStorage(mac);

                    resolve(true);
                }
            }
            else
            {
                logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden! ' + err);
        
                resolve(false);
            }
        });
    });
}

function existsInConfig(obj, mac)
{
    return new Promise(resolve => {

        for(const i in obj.platforms)
        {
            if(obj.platforms[i].platform === 'SynTexWebHooks')
            {
                for(const j in obj.platforms[i].accessories)
                {
                    if(obj.platforms[i].accessories[j].mac === mac)
                    {
                        resolve(true);
                    }
                }
            }
        }

        resolve(false);
    });
}

function removeFromConfig(obj, mac)
{
    return new Promise(resolve => {

        for(const i in obj.platforms)
        {
            if(obj.platforms[i].platform === 'SynTexWebHooks')
            {
                for(const j in obj.platforms[i].accessories)
                {
                    if(obj.platforms[i].accessories[j].mac === mac)
                    {
                        obj.platforms[i].accessories.splice(j, 1);
                    }
                }
            }
        }

        resolve(obj);
    });
}

function removeFromSettingsStorage(mac)
{
    return new Promise(resolve => {

        storage.remove(mac, (err) => {
                                
            if(err)
            {
                logger.log('error', 'bridge', 'Bridge', 'Das Gerät konnte nicht aus der Settings Storage entfernt werden! ' + err);
            }

            resolve(err ? false : true);
        });
    });
}

function removeFromDataStorage(mac)
{
    return new Promise(async function(resolve) {

        dataStorage.list((err, objs) => {  

            if(objs && !err)
            {
                for(var i = 0; i < objs.length; i++)
                {
                    if(objs[i].id.startsWith(mac))
                    {
                        dataStorage.remove(objs[i], (err) => {});
                    }
                }
            }

            resolve();
        });
    });
}

function initDevice(mac, ip, name, type, version, interval, events, services)
{
    return new Promise(async function(resolve) {
        
        var eventButton = await checkEventButton(mac);
        var device = await getDevice(mac);

        name = name.replace(new RegExp('%', 'g'), ' ');

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

            resolve([status, '{"name": "' + (device['name'] || name) + '", "active": "' + device['active'] + '", "interval": "' + (device['interval'] || interval) + '", "led": "' + device['led'] + '", "port": "' + (webhookPort || 1710) + '", "events": ' + ('[' + device['events'] + ']' || events) + '}']);
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

                    configObj = await addToConfig(configObj || obj, mac, ip, name, services, JSON.parse(events).length);

                    config.add(configObj, async function(err) {

                        if(err)
                        {
                            logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht aktualisiert werden! ' + err);

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
                                events: JSON.parse(events)
                            };

                            storage.add(device, (err) => {

                                if(err)
                                {
                                    logger.log('error', 'bridge', 'Bridge', mac + '.json konnte nicht erstellt werden! ' + err);

                                    resolve(['Error', '']);
                                }
                                else
                                {
                                    logger.log('success', mac, name, '[' + name + '] wurde dem System hinzugefügt! ( ' + mac + ' )');

                                    resolve(['Init', '{"name": "' + name + '", "active": "1", "interval": "' + interval + '", "led": "1", "port": "' + webhookPort + '", "events": ' + events + '}']);
                                }
                            });
                        }
                    });
                }
                else
                {
                    logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden! ' + err);

                    resolve(['Error', '']);
                }
            });
        }
        else
        {
            resolve(['Error', 'Name ist bereits Vergeben!']);
        }
    });
}

function initSwitch(mac, name)
{
    return new Promise(async function(resolve) {
        
        if(!await checkMac(mac))
        {
            resolve(['Error', 'Mac ist bereits Vergeben!']);          
        }
        else if(!await checkName(name))
        {
            resolve(['Error', 'Name ist bereits Vergeben!']);
        }
        else
        {
            config.load('config', async function(err, obj) {

                if(obj && !err)
                {
                    var configObj = await addToConfig(obj, mac, null, name, 'switch', 0);

                    config.add(configObj, async function(err) {

                        if(err)
                        {
                            logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht aktualisiert werden! ' + err);

                            resolve(['Error', 'Fehler beim Erstellen!']);
                        }
                        else
                        {
                            var device = { id: mac, name: name, type: 'switch', active: 1 };

                            storage.add(device, (err) => {

                                if(err)
                                {
                                    logger.log('error', 'bridge', 'Bridge', mac + '.json konnte nicht erstellt werden! ' + err);

                                    resolve(['Error', 'Fehler beim Erstellen!']);
                                }
                                else
                                {
                                    logger.log('success', mac, name, '[' + name + '] wurde dem System hinzugefügt! ( ' + mac + ' )');

                                    resolve(['Success', 'Success']);
                                }
                            });
                        }
                    });
                }
                else
                {
                    logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden! ' + err);

                    resolve(['Error', 'Fehler beim Erstellen!']);
                }
            });
        }
    });
}

function addToConfig(obj, mac, ip, name, services, buttons)
{
    return new Promise(async function(resolve) {

        for(const i in obj.platforms)
        {
            if(obj.platforms[i].platform === 'SynTexWebHooks')
            {
                var accessories = obj.platforms[i].accessories;
                var index = accessories.length;

                accessories[index] = { mac : mac, name : name, services : JSON.parse(services) };

                if(services.includes('relais'))
                {
                    accessories[index]['on_url'] = 'http://' + ip + '/relais?value=true';
                    accessories[index]['on_method'] = 'GET';
                    accessories[index]['off_url'] = 'http://' + ip + '/relais?value=false';
                    accessories[index]['off_method'] = 'GET';
                }
                else if(services.includes('rgb') || services.includes('rgbw') || services.includes('rgbww') || services.includes('rgbcw'))
                {
                    accessories[index]['url'] = 'http://' + ip + '/color';
                }
                else if(services.includes('statelessswitch'))
                {
                    accessories[index]['buttons'] = buttons;
                }
            }
        }

        resolve(obj);
    });
}

function checkName(name)
{
    return new Promise(resolve => {
        
        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        for(const j in obj.platforms[i].accessories)
                        {
                            if(obj.platforms[i].accessories[j].name === name)
                            {
                                resolve(false);
                            }
                        }
                    }
                }
            }
            
            resolve(true);
        });
    });
}

function checkMac(mac)
{
    return new Promise(resolve => {
        
        config.load('config', (err, obj) => {    

            if(obj)
            {                            
                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        for(const j in obj.platforms[i].accessories)
                        {
                            if(obj.platforms[i].accessories[j].mac === mac)
                            {
                                resolve(false);
                            }
                        }
                    }
                }
            }
            
            resolve(true);
        });
    });
}

function getValue(mac, param)
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

function getDevice(mac)
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

function getDevices()
{
    return new Promise(resolve => {
        
        storage.list((err, objs) => {  

            if(!objs || err)
            {
                resolve(null);
            }
            else
            {
                resolve(objs);
            }
        });
    });
}

function getAccessory(mac)
{
    return new Promise(resolve => {
        
        for(var i = 0; i < accessories.length; i++)
        {
            if(accessories[i].mac == mac)
            {
                resolve(accessories[i]);
            }
        }

        resolve(null);
    });
}

function getAccessories()
{
    return new Promise(resolve => {
        
        resolve(accessories);
    });
}

function setValue(mac, param, value)
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
                        logger.log('error', 'bridge', 'Bridge', mac + '.json konnte nicht aktualisiert werden! ' + err);
                    }

                    resolve(err ? false : true);
                });
            }
        });
    });
}

function setValues(values)
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
                        logger.log('error', 'bridge', 'Bridge', values.mac + '.json konnte nicht aktualisiert werden! ' + err);
                    }

                    resolve(err ? false : true);
                });
            }
        });
    });
}

function checkEventButton(mac)
{
    return new Promise(resolve => {

        config.load('config', (err, obj) => {    

            if(!obj || err)
            {
                logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden!');

                resolve(false);
            }
            else
            {                            
                var found = false;

                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        for(const j in obj.platforms[i].accessories)
                        {
                            if(obj.platforms[i].accessories[j].mac === mac && obj.platforms[i].accessories[j].services.includes('statelessswitch'))
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

function createEventButton(mac, name, buttons)
{
    return new Promise(resolve => {

        config.load('config', (err, obj) => {    

            if(!obj || err)
            {
                logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden!');

                resolve(false);
            }
            else
            {                            
                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === 'SynTexWebHooks')
                    {
                        obj.platforms[i].accessories[obj.platforms[i].accessories.length] = { mac : mac, name : name + ' Events', services : 'statelessswitch', buttons : buttons };
                    }
                }

                config.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht aktualisiert werden! ' + err);
                    }
                    else
                    {
                        logger.log('success', mac, name, '[' + name + '] wurde dem System hinzugefügt! ( ' + mac + ' )');
                    }

                    resolve(err ? false : true);
                });    
            }
        });
    });
}

function getBridgeStorage()
{
    return new Promise(resolve => {
        
        storage.load('Bridge', (err, obj) => {  

            if(!obj || err)
            {
                resolve(null);
            }
            else
            {
                resolve(obj.data);
            }
        });
    });
}

function setBridgeStorage(key, value)
{
    return new Promise(resolve => {
        
        storage.load('Bridge', (err, obj) => {  

            if(!obj || err)
            {
                var entry = { id : 'Bridge', data : { [key] : value } };

                storage.add(entry, (err) => {

                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', 'Bridge.json konnte nicht aktualisiert werden! ' + err);
                    }

                    resolve(err ? false : true);
                });
            }
            else
            {
                obj.data[key] = value;              
                
                storage.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', 'Bridge.json konnte nicht aktualisiert werden! ' + err);
                    }

                    resolve(err ? false : true);
                });
            }
        });
    });
}

function SETUP(configPath, slog, storagePath, wConf)
{
    config = store(configPath);
    storage = store(storagePath);
    dataStorage = store(storagePath.replace('/data', '/'));
    logger = slog;
    webhookPort = wConf.port;
    accessories = wConf.accessories;
};

module.exports = {
    SETUP,
    getValue,
    getDevice,
    getDevices,
    getAccessory,
    getAccessories,
    setValue,
    setValues,
    initDevice,
    initSwitch,
    checkName,
    removeDevice,
    getBridgeStorage,
    setBridgeStorage
};