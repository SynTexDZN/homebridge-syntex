const store = require('json-fs-store');
var config, storage, dataStorage, logger, webhookPort, accessories, deviceManager;
var configOBJ = null;

module.exports = class DeviceManager
{
    constructor(configPath, slog, storagePath, wConf)
    {
        config = store(configPath);
        storage = store(storagePath);
        dataStorage = store(wConf.cache_directory);
        logger = slog;
        webhookPort = wConf.port;

        reloadConfig().then((success) => {

            if(success)
            {
                reloadAccessories();
            }
        });

        deviceManager = this;
    }

    removeDevice(mac)
    {
        return new Promise((resolve) => {

            if(configOBJ != null)
            {
                while(!checkMac(mac))
                {
                    removeFromConfig(mac);
                }

                saveAccessories().then(async (success) => {

                    if(success)
                    {
                        await removeFromSettingsStorage(mac);
                        await removeFromDataStorage(mac);
                    }

                    resolve(success);
                });
            }
            else
            {
                logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden! ' + err);
        
                resolve(false);
            }
        });
    }

    initDevice(mac, ip, name, version, events, services)
    {
        const self = this;

        return new Promise(async function(resolve) {
            
            var eventButton = checkEventButton(mac);
            var device = await self.getDevice(mac);

            name = name.replace(new RegExp('%', 'g'), ' ');

            if(device != null)
            {
                if(ip != device['ip'])
                {
                    self.setValue(mac, 'ip', ip);
                }

                if(configOBJ != null)
                {
                    for(const i in configOBJ.platforms)
                    {
                        if(configOBJ.platforms[i].platform === 'SynTexWebHooks')
                        {
                            for(var j = 0; j < configOBJ.platforms[i].accessories.length; j++)
                            {
                                if(configOBJ.platforms[i].accessories[j].mac == mac && version != configOBJ.platforms[i].accessories[j].version)
                                {
                                    configOBJ.platforms[i].accessories[j].version = version;

                                    saveAccessories(); 
                                }
                            }
                        }
                    }
                }
                else
                {
                    logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden!');

                    resolve(['Error', '']);
                }

                var status = 'Success';

                if(!eventButton && device['events'] != null && (device['events'] || []).length > 0 && await createEventButton(mac, device['name'], (device['events'] || []).length))
                {
                    status = 'Init';
                }

                resolve([status, '{"name": "' + (device['name'] || name) + '", "active": "' + device['active'] + '", "interval": "' + (device['interval'] || 10000) + '", "led": "' + device['led'] + '", "port": "' + (webhookPort || 1710) + '"}']);
            }
            else if(self.checkName(name))
            {
                if(configOBJ != null)
                {
                    while(!checkMac(mac))
                    {
                        removeFromConfig(mac);
                    }

                    addToConfig(mac, ip, name, JSON.parse(services), JSON.parse(events).length);

                    saveAccessories().then(async (success) => {

                        if(success)
                        {
                            var device = {
                                id: mac,
                                ip: ip,
                                name: name,
                                active: 1,
                                interval: 10000,
                                led: 1
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

                                    resolve(['Init', '{"name": "' + name + '", "active": "1", "interval": "10000", "led": "1", "port": "' + webhookPort + '"}']);
                                }
                            });
                        }
                        else
                        {
                            resolve(['Error', '']);
                        }
                    });
                }
                else
                {
                    logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden! ' + err);

                    resolve(['Error', '']);
                }
            }
            else
            {
                resolve(['Error', 'Name ist bereits Vergeben!']);
            }
        });
    }

    initSwitch(mac, name)
    {
        const self = this;

        return new Promise(function(resolve) {
            
            if(!checkMac(mac))
            {
                resolve(['Error', 'Mac ist bereits Vergeben!']);          
            }
            else if(!self.checkName(name))
            {
                resolve(['Error', 'Name ist bereits Vergeben!']);
            }
            else
            {
                if(configOBJ != null)
                {
                    addToConfig(mac, null, name, 'switch', 0);

                    saveAccessories().then((success) => {

                        if(success)
                        {
                            var device = { id: mac, name: name, active: 1 };

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
                        else
                        {
                            resolve(['Error', 'Fehler beim Erstellen!']);
                        }
                    });
                }
                else
                {
                    logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht geladen werden! ' + err);

                    resolve(['Error', 'Fehler beim Erstellen!']);
                }
            }
        });
    }

    checkName(name)
    {
        for(const i in accessories)
        {
            if(accessories[i].name == name)
            {
                return false;
            }
        }

        return true;
    }

    getValue(mac, param)
    {
        return new Promise(resolve => {
            
            storage.load(mac, (err, obj) => {  

                resolve(!obj || err ? null : obj[param]);
            });
        });
    }

    getDevice(mac)
    {
        return new Promise(resolve => {
            
            storage.load(mac, (err, obj) => {  
                
                resolve(!obj || err ? null : obj);
            });
        });
    }

    getDevices()
    {
        return new Promise(resolve => {
            
            storage.list((err, objs) => {  

                resolve(!objs || err ? null : objs);
            });
        });
    }

    getAccessory(mac)
    {
        for(var i = 0; i < accessories.length; i++)
        {
            if(accessories[i].mac == mac)
            {
                return accessories[i];
            }
        }

        return null;
    }

    getAccessories()
    {
        return accessories;
    }

    setValue(mac, param, value)
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
                        else
                        {
                            reloadAccessories();
                        }

                        resolve(err ? false : true);
                    });
                }
            });
        });
    }

    setValues(values)
    {
        return new Promise(resolve => {
            
            storage.load(values.mac, (err, obj) => {  

                if(!obj || err)
                {
                    obj = { id : values.mac };
                    
                    for(const i in values)
                    {
                        if(i != 'mac')
                        {
                            obj[i] = values[i];
                        }
                    }
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
                }

                storage.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', values.mac + '.json konnte nicht aktualisiert werden! ' + err);
                    }
                    else
                    {
                        reloadAccessories();
                    }

                    resolve(err ? false : true);
                });
            });
        });
    }

    getBridgeStorage()
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

    setBridgeStorage(key, value)
    {
        return new Promise(resolve => {
            
            storage.load('Bridge', (err, obj) => {  

                if(!obj || err)
                {
                    obj = { id : 'Bridge', data : { [key] : value } };
                }
                else
                {
                    obj.data[key] = value;              
                }

                storage.add(obj, (err) => {

                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', 'Bridge.json konnte nicht aktualisiert werden! ' + err);
                    }

                    resolve(err ? false : true);
                });
            });
        });
    }
}

function saveAccessories()
{
    return new Promise(resolve => {

        config.add(configOBJ, function(err) {

            if(err)
            {
                logger.log('error', 'bridge', 'Bridge', 'Config.json konnte nicht aktualisiert werden! ' + err);
            }
            else
            {
                reloadAccessories();
            }

            resolve(err ? false : true);
        });
    });
}

async function reloadAccessories()
{
    accessories = [];

    var plugins = ['SynTexWebHooks', 'SynTexMagicHome'];
    var devices = await deviceManager.getDevices();

    for(const i in configOBJ.platforms)
    {
        if(plugins.includes(configOBJ.platforms[i].platform) && configOBJ.platforms[i].accessories != null)
        {
            accessories = accessories.concat(configOBJ.platforms[i].accessories);

            for(var j = 0; j < accessories.length; j++)
            {
                for(const k in devices)
                {
                    if(devices[k].id == accessories[j].mac)
                    {
                        for(var l = 0; l < Object.keys(devices[j]).length; l++)
                        {
                            accessories[j][Object.keys(devices[k])[l]] = devices[k][Object.keys(devices[k])[l]];
                        }
                    }
                }

                if(accessories[j].plugin == null)
                {
                    accessories[j].plugin = configOBJ.platforms[i].platform;
                }

                if(accessories[j].plugin == 'SynTexWebHooks' && accessories[j].ip)
                {
                    accessories[j].plugin = 'SynTex';
                }

                if(accessories[j].plugin == 'SynTexMagicHome')
                {
                    if(accessories[j].type == "light")
                    {
                        accessories[j].spectrum = 'HSL'; 
                    }

                    if(accessories[j].version == null)
                    {
                        accessories[j].version = '99.99.99';
                    }
                }
            }
        }
    }
}

function reloadConfig()
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
                configOBJ = obj;

                resolve(true);
            }
        });
    });
}

function createEventButton(mac, name, buttons)
{
    return new Promise(resolve => {

        for(const i in configOBJ.platforms)
        {
            if(configOBJ.platforms[i].platform === 'SynTexWebHooks')
            {
                configOBJ.platforms[i].accessories[configOBJ.platforms[i].accessories.length] = { mac : mac, name : name + ' Events', services : 'statelessswitch', buttons : buttons };
            }
        }

        saveAccessories().then((success) => {

            if(success)
            {
                logger.log('success', mac, name, '[' + name + '] wurde dem System hinzugefügt! ( ' + mac + ' )');
            }

            resolve(success ? true : false);
        });    
    });
}

function checkMac(mac)
{
    for(const i in accessories)
    {
        if(accessories[i].mac == mac)
        {
            return false;
        }
    }

    return true;
}

function checkEventButton(mac)
{
    for(const j in accessories)
    {
        if(accessories[j].mac === mac && accessories[j].services.includes('statelessswitch'))
        {
            return true;
        }
    }

    return false;
}

function addToConfig(mac, ip, name, services, buttons)
{
    for(const i in configOBJ.platforms)
    {
        if(configOBJ.platforms[i].platform === 'SynTexWebHooks')
        {
            var accessories = configOBJ.platforms[i].accessories;
            var index = accessories.length;

            accessories[index] = { mac : mac, name : name, services : services };

            if(services.includes('relais') || services.includes('rgb') || services.includes('rgbw') || services.includes('rgbww') || services.includes('rgbcw'))
            {
                accessories[index]['requests'] = [];
            }

            if(services.includes('relais'))
            {
                accessories[index]['requests'].push({ trigger : 'on', method : 'GET', url : 'http://' + ip + '/relais?value=true' });
                accessories[index]['requests'].push({ trigger : 'off', method : 'GET', url : 'http://' + ip + '/relais?value=false' });
            }
            
            if(services.includes('rgb') || services.includes('rgbw') || services.includes('rgbww') || services.includes('rgbcw'))
            {
                accessories[index]['requests'].push({ trigger : 'color', method : 'GET', url : 'http://' + ip + '/color' });
            }
            
            if(services.includes('statelessswitch'))
            {
                accessories[index]['buttons'] = buttons;
            }
        }
    }
}

function removeFromDataStorage(mac)
{
    return new Promise(function(resolve) {

        dataStorage.list((err, objs) => {  

            if(objs && !err)
            {
                for(var i = 0; i < objs.length; i++)
                {
                    if(objs[i].id.startsWith(mac))
                    {
                        dataStorage.remove(objs[i].id, (err) => {});
                    }
                }
            }

            resolve();
        });
    });
}

function removeFromConfig(mac)
{
    for(const i in configOBJ.platforms)
    {
        if(configOBJ.platforms[i].platform === 'SynTexWebHooks')
        {
            for(const j in configOBJ.platforms[i].accessories)
            {
                if(configOBJ.platforms[i].accessories[j].mac == mac)
                {
                    configOBJ.platforms[i].accessories.splice(j, 1);
                }
            }
        }
    }

    reloadAccessories();
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