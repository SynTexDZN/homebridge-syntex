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
                resolve(obj);
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
    loadAutomations
};