var store = require('json-fs-store');
var logger, storage;

function loadAutomations()
{
    return new Promise(resolve => {

        storage.load('automations', (err, obj) => {  

            if(!obj || err)
            {
                resolve([]);
            }
            else
            {
                resolve(obj.automations);
            }
        });
    });
}

function createAutomation(automation)
{
    return new Promise(resolve => {

        automation = JSON.parse(automation);

        if(isValid(automation))
        {
            storage.load('automations', (err, obj) => {  

                if(!obj || err)
                {
                    obj = { id : 'automations', automations : [ automation ] };
                }
                else
                {
                    obj.automations[obj.automations.length] = automation;
                }
    
                storage.add(obj, (err) => {
    
                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', 'Automations.json konnte nicht aktualisiert werden! ' + err);
    
                        resolve(false);
                    }
                    else
                    {
                        logger.log('success', 'bridge', 'Bridge', 'Hintergrundprozesse wurden erfolgreich aktualisiert!');
    
                        resolve(true);
                    }
                });
            });
        }
        else
        {
            resolve(false);
        }
    });
}

function removeAutomation(id)
{
    return new Promise(resolve => {

        storage.load('automations', (err, obj) => {  

            console.log(obj);

            if(!obj || err)
            {
                resolve(false);
            }
            else
            {
                for(var i = 0; i < obj.automations.length; i++)
                {
                    if(obj.automations[i].id == id)
                    {
                        obj.automations.splice(i, 1);
                    }
                }

                storage.add(obj, (err) => {
    
                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', 'Automations.json konnte nicht aktualisiert werden! ' + err);
    
                        resolve(false);
                    }
                    else
                    {
                        logger.log('success', 'bridge', 'Bridge', 'Hintergrundprozess [' + id + '] wurde erfolgreich entfernt!');
    
                        resolve(true);
                    }
                });
            }
        });
    });
}

function isValid(automation)
{
    if(automation.id && automation.name && automation.active && automation.trigger && automation.result)
    {
        var valid = { trigger : false, condition : false, result : false };

        for(var i = 0; i < automation.trigger.length; i++)
        {
            if(automation.trigger[i].mac && automation.trigger[i].name && automation.trigger[i].letters && automation.trigger[i].value && automation.trigger[i].operation)
            {
                valid.trigger = true;
            }
            else
            {
                return false;
            }
        }

        if(automation.condition)
        {
            for(var i = 0; i < automation.condition.length; i++)
            {
                if(automation.condition[i].mac && automation.condition[i].name && automation.condition[i].letters && automation.condition[i].value && automation.condition[i].operation)
                {
                    valid.condition = true;
                }
                else
                {
                    return false;
                }
            }
        }

        for(var i = 0; i < automation.result.length; i++)
        {
            if(automation.result[i].mac && automation.result[i].name && automation.result[i].letters && automation.result[i].value && automation.result[i].operation)
            {
                valid.result = true;
            }
            else if(automation.result[i].url)
            {
                valid.result = true;
            }
            else
            {
                return false;
            }
        }

        return valid.trigger && valid.result ? true : false;
    }
    else
    {
        return false;
    }
}

function modifyAutomation(automation)
{
    return new Promise(resolve => {

        automation = JSON.parse(automation);

        if(isValid(automation))
        {
            storage.load('automations', (err, obj) => {  

                if(!obj || err)
                {
                    resolve(false);
                }
                else
                {
                    for(var i = 0; i < obj.automations.length; i++)
                    {
                        if(obj.automations[i].id == automation.id)
                        {
                            obj.automations[i] = automation;
                        }
                    }

                    storage.add(obj, (err) => {
        
                        if(err)
                        {
                            logger.log('error', 'bridge', 'Bridge', 'Automations.json konnte nicht aktualisiert werden! ' + err);
        
                            resolve(false);
                        }
                        else
                        {
                            logger.log('success', 'bridge', 'Bridge', 'Hintergrundprozess [' + automation.id + '] wurde erfolgreich aktualisiert!');
        
                            resolve(true);
                        }
                    });
                }
            });
        }
        else
        {
            resolve(false);
        }
    });
}

function SETUP(log, storagePath)
{
    logger = log;
    storage = store(storagePath);
}

module.exports = {
    SETUP,
    loadAutomations,
    createAutomation,
    removeAutomation,
    modifyAutomation
};