var store = require('json-fs-store');
var logger, storage;

async function loadAutomations()
{
    return new Promise(resolve => {

        storage.load(mac, (err, obj) => {  

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

async function SETUP(log, storagePath)
{
    logger = log;
    storage = store(storagePath);
}

module.exports = {
    SETUP,
    loadAutomations
};