import { Expandable } from '/js/expandable-button.js';

class Init
{
    constructor()
    {
        window.Expandable = Expandable;

        this.plugins = {};

        this.bridge = { ip : {}, mac : {} };
        this.version = { current : {}, latest : {} };

        this.tag = Storage.getItem('betaPluginVersions') == true ? 'beta' : 'latest';

        Promise.all([this.loadBridgeData(), this.loadPluginData()]).then(() => {
            
            console.log('DATA', { bridge : this.bridge, plugins : this.plugins });

            this.renderGUI();
        
            window.Preloader.finish();
        });
    }

    loadBridgeData()
    {
        return new Promise((resolve) => {

            window.Query.complexFetch('/serverside/bridge', 5000, 2, {}, false).then((data) => {
    
                try
                {
                    this.bridge = JSON.parse(data);
    
                    resolve(true);
                }
                catch(e)
                {
                    console.error(e);
    
                    resolve(false);
                }
            });
        });
    }

    loadPluginData()
    {
        return new Promise((resolve) => {

            window.Query.complexFetch('/serverside/plugins', 5000, 2, {}, false).then((data) => {
    
                try
                {
                    this.plugins = JSON.parse(data);
    
                    resolve(true);
                }
                catch(e)
                {
                    console.error(e);
    
                    resolve(false);
                }
            });
        });
    }

    renderGUI()
    {
        var removedUpdate = false, hasUpdate = false;

        if(this.bridge.id != null)
        {
            document.getElementById('bridge-id').innerHTML = this.bridge.id;
        }

        document.getElementById('bridge-ip').innerHTML = (this.bridge.ip.lan || '-') + '<br>' + (this.bridge.ip.wlan || '-');

        if(this.bridge.mac.lan != null && this.bridge.mac.wlan != null)
        {
            document.getElementById('bridge-mac').innerHTML = this.bridge.mac.lan.toUpperCase() + '<br>' + this.bridge.mac.wlan.toUpperCase();
        }
        else if(this.bridge.mac.lan != 'null')
        {
            document.getElementById('bridge-mac').innerHTML = '-<br>' + this.bridge.mac.lan.toUpperCase();
        }
        else if(this.bridge.mac.wlan != null)
        {
            document.getElementById('bridge-mac').innerHTML = this.bridge.mac.wlan.toUpperCase() + '<br>-';
        }

        if(Storage.getItem('expertMode') == true)
        {
            document.getElementById('expert-mode').style.display = 'initial';
        }

        for(const id in this.plugins)
        {
            var title = this.plugins[id].name != 'SynTex' ? this.plugins[id].name.replace('SynTex', 'SynTex ') : 'SynTex';
            var newestVersion = '%general.connection_error%';

            if(this.plugins[id].versions[this.tag] != null || this.plugins[id].versions['latest'] != null)
            {
                newestVersion = window.Essentials.versionCount(this.plugins[id].versions[this.tag]) > window.Essentials.versionCount(this.plugins[id].versions['latest']) ? this.plugins[id].versions[this.tag] : this.plugins[id].versions['latest'];

                this.version.latest[id] = newestVersion;
            }

            if(this.plugins[id].versions['current'] != null)
            {
                this.version.current[id] = this.plugins[id].versions['current'];
            }
            
            if(document.getElementById(id) == null)
            {
                var container = document.createElement('div'),
                    expandable = document.createElement('button'),
                    head = document.createElement('div'),
                    status = document.createElement('div'),
                    content = document.createElement('div'),
                    version = document.createElement('div'),
                    latest = document.createElement('div');

                container.id = id;

                expandable.className = 'plugin-container';

                head.innerHTML = title;
                head.style.display = 'flex';
                head.style.justifyContent = 'space-between';

                status.id = 'update-status-' + id;
                status.className = 'update-status loading-loop';

                version.id = 'version-' + id;
                version.className = 'loading-loop expandable-hidden';
                version.innerHTML = '%bridge.version%: </b>' + this.version.current[id];
                
                latest.id = 'latest-version-' + id;
                latest.className = 'loading-loop expandable-hidden';
                latest.innerHTML = '%bridge.latest_version%: </b>' + this.version.latest[id];

                content.appendChild(version);
                content.appendChild(latest);

                head.appendChild(status);

                expandable.appendChild(head);
                expandable.appendChild(content);

                container.appendChild(expandable);

                document.getElementById(id == 'npm' || id == 'homebridge' ? 'core-plugins' : 'plugins').appendChild(container);

                Expandable.createExpandableButton(container.children[0]);
            }
            else
            {
                document.getElementById('version-' + id).innerHTML = '<b>%bridge.version%: </b>' + this.version.current[id];
                document.getElementById('latest-version-' + id).innerHTML = '<b>%bridge.latest_version%: </b>' + this.version.latest[id];
            }

            if(this.version.current[id] != null && this.version.latest[id] != null && window.Essentials.versionCount(this.version.latest[id]) > window.Essentials.versionCount(this.version.current[id]))
            {
                if(document.getElementById('update-btn-' + id) == null)
                {
                    var updateButton = document.createElement('input');

                    updateButton.setAttribute('type', 'button');
                    updateButton.setAttribute('value', title + ' %bridge.update% ( v' + this.version.latest[id] + ' )');
                    updateButton.setAttribute('id', 'update-btn-' + id);
                    updateButton.setAttribute('style', 'margin-bottom: 20px');

                    updateButton.onclick = () => {

                        if(!window.Running.updateQuery.includes(id + '@' + this.version.latest[id]))
                        {
                            window.Running.updateQuery.push(id + '@' + this.version.latest[id]);
                        }
                        else
                        {
                            window.Running.updateQuery.splice(window.Running.updateQuery.indexOf(id + '@' + this.version.latest[id]), 1);
                        }

                        document.getElementById('update-query-btn').innerHTML = window.Running.updateQuery.length + ' %devices.update_all%';
                    };

                    window.PageManager.addFooter(updateButton);
                }
                else
                {
                    document.getElementById('update-btn-' + id).value = title + ' %bridge.update% ( v' + this.version.latest[id] + ' )';
                }

                document.getElementById('update-status-' + id).innerHTML = '%bridge.update_available%';
                document.getElementById('update-status-' + id).style.background = 'hsl(280, 95%, 60%)';
                document.getElementById('update-status-' + id).classList.add('shine');

                hasUpdate = true;
            }
            else
            {
                if(document.getElementById('update-btn-' + id) != null)
                {
                    window.PageManager.removeFooter('update-btn-' + id);

                    removedUpdate = true;
                }

                if(this.version.current[id] == null || this.version.latest[id] == null)
                {
                    document.getElementById('update-status-' + id).innerHTML = '%bridge.update_error%';
                    document.getElementById('update-status-' + id).style.background = 'hsl(350, 95%, 60%)';
                }
                else
                {
                    document.getElementById('update-status-' + id).innerHTML = '%bridge.up_to_date%';
                    document.getElementById('update-status-' + id).style.background = 'hsl(165, 85%, 50%)';
                }

                document.getElementById('update-status-' + id).classList.remove('shine');
            }
        }

        if(hasUpdate && document.getElementById('update-query-btn') == null)
        {
            var updateQuery = document.createElement('button');

            updateQuery.id = 'update-query-btn';
            updateQuery.innerHTML = '0 %devices.update_all%';

            updateQuery.style.marginBottom = '20px';

            updateQuery.setAttribute('type', 'button');

            updateQuery.onclick = () => window.Running.updatePlugins(updateQuery);

            window.PageManager.addFooter(updateQuery);
        }

        if(removedUpdate)
        {
            setTimeout(() => window.PageManager.showFooter(), 600);
        }
        else
        {
            window.PageManager.showFooter();
        }
    }
}

window.Init = new Init();