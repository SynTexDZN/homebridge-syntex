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

        storage.load('automations', (err, obj) => {  

            if(!obj || err)
            {
                obj = { id : 'automations', automations : [ automation ] };
            }
            else
            {
                obj.automations[obj.automations.length] = JSON.parse(automation);
            }

            logger.debug(obj);

            storage.add(obj, (err) => {

                if(err)
                {
                    logger.log('error', 'bridge', 'Bridge', automation + '.json konnte nicht aktualisiert werden! ' + err);

                    resolve(false);
                }
                else
                {
                    logger.log('success', 'bridge', 'Bridge', 'Hintergrundprozesse wurden erfolgreich aktualisiert');

                    resolve(true);
                }
            });
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
    createAutomation
};