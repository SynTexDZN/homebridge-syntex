const request = require('request');

module.exports = class UpdateManager
{
    constructor(interval)
    {
        this.fetchUpdates();

        this.updateInterval = setInterval(() => this.fetchUpdates(), interval * 1000);
    }

    fetchUpdates()
    {
        var theRequest = {
            method : 'GET',
            url : 'http://syntex.sytes.net/smarthome/check-version.php',
            timeout : interval * 500
        };

        request(theRequest, (error, response, body) => {

            try
            {
                var updates = JSON.parse(body);
                var updateOBJ = {
                    plugins : {},
                    devices : {}
                };

                for(const update in updates)
                {
                    updateOBJ[updates[update].type.startsWith('SynTex') ? 'plugins' : 'devices'][updates[update].type] = updates[update].version;
                }

                this.newestVersions = updateOBJ;
            }
            catch(e)
            {
                console.log(e);
            }
        });
    }

    getLatestVersions()
    {
        return this.newestVersions || [];
    }
}