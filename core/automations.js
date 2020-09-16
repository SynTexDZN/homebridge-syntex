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
                        logger.log('success', 'bridge', 'Bridge', 'Hintergrundprozesse wurden erfolgreich aktualisiert');
    
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
                for(var i = 0; i < obj.length; i++)
                {
                    console.log(id, obj[i].id);

                    if(obj[i].id == id)
                    {
                        obj.splice(i, 1);

                        resolve(true);
                    }
                }
                
                resolve(false);
            }
        });
    });
}

function isValid(automation)
{
    if(automation.id && automation.name && automation.active && automation.trigger && automation.result)
    {
        var valid = true;

        for(var i = 0; i < automation.trigger.length; i++)
        {
            if(!automation.trigger[i].mac || !automation.trigger[i].name || !automation.trigger[i].letters || !automation.trigger[i].value || !automation.trigger[i].operation)
            {
                valid = false;
            }
        }

        if(automation.condition)
        {
            for(var i = 0; i < automation.condition.length; i++)
            {
                if(!automation.condition[i].mac || !automation.condition[i].name || !automation.condition[i].letters || !automation.condition[i].value || !automation.condition[i].operation)
                {
                    valid = false;
                }
            }
        }

        for(var i = 0; i < automation.result.length; i++)
        {
            if(!automation.result[i].mac || !automation.result[i].name || !automation.result[i].letters || !automation.result[i].value || !automation.result[i].operation)
            {
                valid = false;
            }
        }

        return valid;
    }
    else
    {
        return false;
    }
}

function modifyAutomation(automation)
{
    return new Promise(resolve => {

        storage.load('automations', (err, obj) => {  

            if(!obj || err)
            {
                resolve(false);
            }
            else
            {
                for(var i = 0; i < obj.length; i++)
                {
                    if(obj[i].id == id)
                    {
                        obj[i] = JSON.parse(automation);

                        resolve(true);
                    }
                }
                
                resolve(false);
            }
        });
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