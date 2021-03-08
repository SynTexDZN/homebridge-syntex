let AliasManager = require('./alias-manager');

const fs = require('fs'), request = require('request'), path = require('path');

module.exports = class PluginManager
{
	constructor(config, logger, updateInterval)
	{
        this.plugins = {};

        this.config = config;
        this.logger = logger;

        this.nodePath = path.resolve(__dirname, '../..',);

        AliasManager = new AliasManager(this.config, this.logger);

        fs.readdir(this.nodePath, async (err, plugins) => {

            if(!err && plugins)
            {
                await AliasManager.loadAlias();

                for(const id in plugins)
                {
                    if(plugins[id].startsWith('homebridge') || plugins[id] == 'npm')
                    {
                        this.plugins[plugins[id]] = { versions : {} };

                        if(plugins[id] != 'homebridge' && plugins[id] != 'npm')
                        {
                            this.getName(plugins[id]);
                            this.getAlias(plugins[id]).then((pluginName) => this.getConfig(plugins[id], pluginName));
                        }
                        else if(plugins[id] == 'npm')
                        {
                            this.plugins[plugins[id]].name = 'NPM';
                            this.plugins[plugins[id]].alias = 'NPM';
                        }
                        else if(plugins[id] == 'homebridge')
                        {
                            this.plugins[plugins[id]].name = 'HomeBridge';
                            this.plugins[plugins[id]].alias = 'HomeBridge';
                        }

                        this.getPackageData(plugins[id]);
                        this.fetchUpdate(plugins[id], updateInterval * 1000);

                        this.updateInterval = setInterval(() => this.fetchUpdate(plugins[id], updateInterval * 500), updateInterval * 1000);
                    }
                }
            }
            else
            {
                this.logger.log('error', 'bridge', 'Bridge', 'Node Path %read_error%! ' + err);
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

                            this.plugins[pluginID].name = this.plugins[pluginID].name.replace('Syntex', 'SynTex');
                            this.plugins[pluginID].name = this.plugins[pluginID].name.replace('Homebridge', 'HomeBridge');
                            this.plugins[pluginID].name = this.plugins[pluginID].name.replace('Magichome', 'MagicHome');
                            this.plugins[pluginID].name = this.plugins[pluginID].name.replace('Webhooks', 'WebHooks');
                            this.plugins[pluginID].name = this.plugins[pluginID].name.replace('Homeconnect', 'HomeConnect');
                            this.plugins[pluginID].name = this.plugins[pluginID].name.replace('Videodoorbell', 'VideoDoorbell');
                        }

                        if(data.version != null)
                        {
                            this.plugins[pluginID].versions['current'] = data.version;
                        }
                    }
                    catch(e)
                    {
                        this.logger.log('error', 'bridge', 'Bridge', this.nodePath + '/' + pluginID + '/package.json %json_parse_error%! ' + e);
                    }
                }
                else
                {
                    this.logger.log('error', 'bridge', 'Bridge', this.nodePath + '/' + pluginID + '/package.json %read_error%! ' + err);
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
        }
        else
        {
            displayName = displayName[0].toUpperCase() + displayName.substring(1);
        }

        displayName = displayName.replace('Syntex', 'SynTex');
        displayName = displayName.replace('Homebridge', 'HomeBridge');
        displayName = displayName.replace('Magichome', 'MagicHome');
        displayName = displayName.replace('Webhooks', 'WebHooks');
        displayName = displayName.replace('Homeconnect', 'HomeConnect');
        displayName = displayName.replace('Videodoorbell', 'VideoDoorbell');

        this.plugins[pluginID].name = displayName;
    }

    getConfig(pluginID, pluginName)
    {
        this.config.load('config', (err, config) => {    

            if(!err && config)
            {
                for(const i in config.platforms)
                {
                    if(config.platforms[i].platform == pluginName)
                    {
                        this.plugins[pluginID].config = config.platforms[i];
                    }
                }

                for(const i in config.accessories)
                {
                    if(config.accessories[i].accessory == pluginName)
                    {
                        this.plugins[pluginID].config = config.accessories[i];
                    }
                }
            }
            else
            {
                this.logger.log('error', 'bridge', 'Bridge', 'Config.json %read_error%! ' + err);
            }
        });
    }

    getAlias(pluginID)
    {
        return new Promise((resolve) => {

            AliasManager.getAlias(pluginID, (pluginName) => {

                this.plugins[pluginID].alias = pluginName;

                resolve(pluginName);
            });
        });
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
                    this.logger.log('error', 'bridge', 'Bridge', 'Plugin Update %json_parse_error%! ( ' + body + ') ' + e);
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