var store = require('json-fs-store');
var config, storage, dataStorage, log;
    
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
                                    log('\x1b[31m%s\x1b[0m', "[ERROR]", "Config.json konnte nicht aktualisiert werden!", err);

                                    resolve(false);
                                }
                                else
                                {
                                    storage.remove(mac, (err) => {
                                        
                                        if(err)
                                        {
                                            log('\x1b[31m%s\x1b[0m', "[ERROR]", "Das Gerät konnte nicht aus der Settings Storage entfernt werden!", err);
                                            
                                            resolve(false);
                                        }
                                        else
                                        {
                                            dataStorage.remove(mac, (err) => {
                                        
                                                if(err)
                                                {
                                                    log('\x1b[31m%s\x1b[0m', "[ERROR]", "Das Gerät konnte nicht aus der Data Storage entfernt werden!", err);

                                                    resolve(false);
                                                }
                                                else
                                                {
                                                    log('\x1b[32m%s\x1b[0m', "[SUCCESS]", "Gerät wurde aus dem System entfernt ( " + mac + " )");

                                                    resolve(true);
                                                }
                                            });
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

async function initDevice(mac, ip, name, type, version, refresh)
{
    return new Promise(resolve => {
        
        exists(mac).then(async function(res)
        {
            if(res)
            {
                var dbName = await getValue(mac, 'name');
                var dbInterval = await getValue(mac, 'refresh');
                var dbLED = await getValue(mac, 'led');
                var dbSceneControl = await getValue(mac, 'scenecontrol');
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

                resolve(['Success', '{"name": "' + dbName + '", "interval": "' + dbInterval + '", "led": "' + dbLED + '", "scenecontrol": "' + dbSceneControl + '"}']);
            }
            else
            {
                checkName(name).then(function(res)
                {
                    if(res)
                    {
                        var device = {
                            id: mac,
                            ip: ip,
                            name: name,
                            type: type,
                            version: version,
                            refresh: refresh,
                            led: 1,
                            scenecontrol: 0
                        };

                        storage.add(device, (err) => {

                            if(err)
                            {
                                log('\x1b[31m%s\x1b[0m', "[ERROR]", mac + ".json konnte nicht aktualisiert werden!", err);

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

                                                if(type == "relais" || type == "switch")
                                                {
                                                    platform.switches[platform.switches.length] = {mac: mac, name: name, on_url: "http://" + ip + "/switch?state=true", on_method: "GET", off_url: "http://" + ip + "/switch?state=false", off_method: "GET"};
                                                }
                                                else
                                                {
                                                    platform.sensors[platform.sensors.length] = {mac: mac, name: name, type: type};
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

                                                resolve(['Error', '']);
                                            }
                                            else
                                            {
                                                log('\x1b[32m%s\x1b[0m', "[SUCCESS]", "Neues Gerät wurde dem System hinzugefügt ( " + mac + " )");

                                                resolve(['Init', '{"name": "' + name + '", "interval": "' + refresh + '", "led": "1", "scenecontrol": "0"}']);
                                            }
                                        });    
                                    }

                                    if(err || !obj)
                                    {
                                        log('\x1b[31m%s\x1b[0m', "[ERROR]", "Config.json konnte nicht geladen werden!");

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
                });
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
                        log('\x1b[31m%s\x1b[0m', "[ERROR]", mac + ".json konnte nicht aktualisiert werden!", err);

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

function SETUP(configPath, slog, storagePath)
{
    config = store(configPath);
    storage = store(storagePath);
    dataStorage = store(storagePath.replace('/data', '/'));
    log = slog;
};

module.exports = {
    SETUP,
    getValue,
    getDevice,
    getDevices,
    setValue,
    exists,
    initDevice,
    removeDevice,
    checkName
};