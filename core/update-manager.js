const request = require('request');

module.exports = class UpdateManager
{
    constructor(interval)
    {
        this.newestDeviceVersions = {};
        this.newestPluginVersions = {};

        this.fetchDeviceUpdates(interval * 1000);
        this.fetchPluginUpdates(interval * 1000);

        this.updateDeviceInterval = setInterval(() => this.fetchDeviceUpdates(interval * 500), interval * 1000);
        this.updatePluginInterval = setInterval(() => this.fetchPluginUpdates(interval * 500), interval * 1000);
    }

    fetchPluginUpdates(timeout)
    {
        return new Promise((callback) => {

            var plugins = { 'homebridge-syntex' : 'SynTex', 'homebridge-syntex-webhooks' : 'SynTexWebHooks', 'homebridge-syntex-tuya' : 'SynTexTuya', 'homebridge-syntex-magichome' : 'SynTexMagicHome' };
            var promiseArray = [];

            for(const i in plugins)
            {
                console.log(0, i, plugins[i]);
                
                var theRequest = {
                    method : 'GET',
                    url : 'http://registry.npmjs.org/-/package/' + i + '/dist-tags',
                    timeout : timeout
                };

                const newPromise = new Promise((resolve) => request(theRequest, (error, response, body) => {

                    console.log(1, i, plugins[i]);

                    try
                    {
                        this.newestPluginVersions[plugins[i]] = JSON.parse(body);
                    }
                    catch(e)
                    {
                        console.error(e);
                    }

                    resolve();
                })); 
                    
                promiseArray.push(newPromise);
            }

            Promise.all(promiseArray).then(() => callback());
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