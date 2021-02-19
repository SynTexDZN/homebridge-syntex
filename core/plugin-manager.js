const fs = require('fs'), request = require('request'), path = require('path');

module.exports = class PluginManager
{
	constructor(updateInterval)
	{
        this.plugins = {};

        this.nodePath = path.resolve(__dirname, '../..',);

        fs.readdir(this.nodePath, async (err, plugins) => {

            if(!err && plugins)
            {
                for(const plugin in plugins)
                {
                    if(plugins[plugin].startsWith('homebridge') && plugins[plugin] != 'homebridge')
                    {
                        this.plugins[plugins[plugin]] = { versions : {} };

                        this.getName(plugins[plugin]);
                        this.getPackageData(plugins[plugin]);
                        this.fetchUpdate(plugins[plugin], updateInterval * 1000);

                        this.updateInterval = setInterval(() => this.fetchUpdate(plugins[plugin], updateInterval * 500), updateInterval * 1000);
                    }
                }
            }
        });
    }

    getPackageData(pluginID)
    {
        return new Promise((resolve) => {

            fs.readFile(this.nodePath + '/' + pluginID + '/package.json', (err, data) => {

                if(!err && data)
                {
                    try
                    {
                        data = JSON.parse(data.toString());

                        if(data.displayName != null)
                        {
                            this.plugins[pluginID].name = data.displayName;
                        }

                        if(data.version != null)
                        {
                            this.plugins[pluginID].versions['current'] = data.version;
                        }
                    }
                    catch(e)
                    {
                        console.error(e);
                    }
                }

                resolve();
            });
        });
    }

    getName(pluginID)
    {
        var displayName = pluginID;

        if(displayName.includes('-'))
        {
            var parts = displayName.split('-');

            displayName = '';

            for(const i in parts)
            {
                if(displayName != '')
                {
                    displayName += ' ';
                }

                if(parts[i] != 'homebridge')
                {
                    displayName += parts[i][0].toUpperCase() + parts[i].substring(1);
                }
            }

            displayName = displayName.replace('Magichome', 'MagicHome');
            displayName = displayName.replace('Webhooks', 'WebHooks');
            displayName = displayName.replace('Homeconnect', 'HomeConnect');
            displayName = displayName.replace('Videodoorbell', 'VideoDoorbell');
        }
        else
        {
            displayName = displayName[0].toUpperCase() + displayName.substring(1);
        }

        this.plugins[pluginID].name = displayName;
    }

    fetchUpdate(pluginID, timeout)
    {
        return new Promise((resolve) => {

            var theRequest = {
                method : 'GET',
                url : 'http://registry.npmjs.org/-/package/' + pluginID + '/dist-tags',
                timeout : timeout
            };

            request(theRequest, (error, response, body) => {

                try
                {
                    body = JSON.parse(body);

                    if(body instanceof Object)
                    {
                        for(const tag in body)
                        {
                            this.plugins[pluginID].versions[tag] = body[tag];
                        }
                    }
                }
                catch(e)
                {
                    console.error(e);
                }

                resolve();
            });
        });
    }

    reloadUpdates()
    {
        return new Promise((resolve) => {

            var promiseArray = [];

            for(const pluginID in this.plugins)
            {
                promiseArray.push(this.fetchUpdate(pluginID, 10000));
            }

            Promise.all(promiseArray).then(() => resolve());
        });
    }

    getPlugins()
    {
        return this.plugins;
    }
}