const request = require('request');

module.exports = class UpdateManager
{
    constructor(interval)
    {
        this.newestDeviceVersions = {};
        this.newestPluginVersions = {};

        this.fetchDeviceUpdates(interval * 1000);

        var plugins = ['homebridge-syntex', 'homebridge-syntex-webhooks', 'homebridge-syntex-tuya', 'homebridge-syntex-magichome'];

        for(const i in plugins)
        {
            this.fetchPluginUpdates(plugins[i], interval * 1000);
        }

        this.updateDeviceInterval = setInterval(() => this.fetchDeviceUpdates(interval * 500), interval * 1000);
        this.updatePluginInterval = setInterval(() => {

            for(const i in plugins)
            {
                this.fetchPluginUpdates(plugins[i], interval * 500);
            }

        }, interval * 1000);
    }

    fetchPluginUpdates(pluginID, timeout)
    {
        var theRequest = {
            method : 'GET',
            url : 'http://registry.npmjs.org/-/package/' + pluginID + '/dist-tags',
            timeout : timeout
        };

        request(theRequest, (error, response, body) => {

            try
            {
                this.newestPluginVersions[pluginID] = JSON.parse(body);
            }
            catch(e)
            {
                console.log(e);
            }
        });
    }

    fetchDeviceUpdates(timeout)
    {
        var theRequest = {
            method : 'GET',
            url : 'http://syntex.sytes.net/smarthome/check-version.php',
            timeout : timeout
        };

        request(theRequest, (error, response, body) => {

            try
            {
                var updates = JSON.parse(body);

                for(const update in updates)
                {
                    if(!updates[update].type.startsWith('SynTex'))
                    {
                        this.newestDeviceVersions[updates[update].type] = updates[update].version;
                    }
                }
            }
            catch(e)
            {
                console.log(e);
            }
        });
    }

    getLatestVersions()
    {
        return { plugins : this.newestPluginVersions, devices : this.newestDeviceVersions } || { plugins : {}, devices : {} };
    }
}