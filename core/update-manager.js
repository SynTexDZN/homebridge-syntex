const request = require('request');

module.exports = class UpdateManager
{
    constructor(interval)
    {
        this.newestDeviceVersions = {};
        this.newestPluginVersions = {};

        this.fetchDeviceUpdates(interval * 1000);

        var plugins = { 'homebridge-syntex' : 'SynTex', 'homebridge-syntex-webhooks' : 'SynTexWebHooks', 'homebridge-syntex-tuya' : 'SynTexTuya', 'homebridge-syntex-magichome' : 'SynTexMagicHome' };

        for(const i in plugins)
        {
            this.fetchPluginUpdates({  id : i, name : plugins[i] }, interval * 1000);
        }

        this.updateDeviceInterval = setInterval(() => this.fetchDeviceUpdates(interval * 500), interval * 1000);
        this.updatePluginInterval = setInterval(() => {

            for(const i in plugins)
            {
                this.fetchPluginUpdates({  id : i, name : plugins[i] }, interval * 500);
            }

        }, interval * 1000);
    }

    fetchPluginUpdates(plugin, timeout)
    {
        var theRequest = {
            method : 'GET',
            url : 'http://registry.npmjs.org/-/package/' + plugin.id + '/dist-tags',
            timeout : timeout
        };

        request(theRequest, (error, response, body) => {

            try
            {
                this.newestPluginVersions[plugin.name] = JSON.parse(body);
            }
            catch(e)
            {
                console.error(e);
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
                console.error(e);
            }
        });
    }

    getLatestVersions()
    {
        return { plugins : this.newestPluginVersions, devices : this.newestDeviceVersions } || { plugins : {}, devices : {} };
    }
}