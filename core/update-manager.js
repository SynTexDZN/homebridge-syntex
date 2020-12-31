const request = require('request');

module.exports = class UpdateManager
{
    constructor(interval)
    {
        this.updateInterval = setInterval(() => {

            this.fetchUpdates();

        }, interval * 1000);
    }

    fetchUpdates()
    {
        var theRequest = {
            method : 'GET',
            url : 'http://syntex.sytes.net/smarthome/check-version.php',
            timeout : 10000
        };

        request(theRequest, (error, response, body) => {

            try
            {
                var updates = JSON.parse(body);
                var updateOBJ = {
                    plugins : [],
                    devices : []
                };

                for(const update in updates)
                {
                    if(updates[update].type.startsWith('SynTex'))
                    {
                        updateOBJ['plugins'].push(updates[update]);
                    }
                    else
                    {
                        updateOBJ['devices'].push(updates[update]);
                    }
                }

                this.newestVersions = updateOBJ;
            }
            catch(e)
            {
                logger.err(e);
            }
        });
    }

    getNewestVersions()
    {
        return this.newestVersions || [];
    }
}