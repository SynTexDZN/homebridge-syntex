import { Expandable } from '/js/expandable-button.js';

class Init
{
    constructor()
    {
        window.Expandable = Expandable;

        this.bridgeID = '<%bridgeID%>';
        this.bridgeIP = '<%bridgeIP%>';
        this.wlanMac = '<%wlanMac%>';
        this.ethernetMac = '<%ethernetMac%>';

        this.plugins = {};
        this.versions = {};
        this.latestVersions = {};

        this.tag = Storage.getItem('betaPluginVersions') == true ? 'beta' : 'latest';

        if(this.bridgeID != 'null')
        {
            document.getElementById('bridge-id').innerHTML = this.bridgeID;
        }

        if(this.bridgeIP != 'null')
        {
            document.getElementById('bridge-ip').innerHTML = this.bridgeIP;
        }

        if(this.wlanMac != 'null' && this.ethernetMac != 'null')
        {
            document.getElementById('bridge-mac').innerHTML = this.wlanMac.toUpperCase() + '<br>' + this.ethernetMac.toUpperCase();
        }
        else if(this.wlanMac != 'null')
        {
            document.getElementById('bridge-mac').innerHTML = this.wlanMac.toUpperCase() + '<br>-';
        }
        else if(this.ethernetMac != 'null')
        {
            document.getElementById('bridge-mac').innerHTML = '-<br>' + this.ethernetMac.toUpperCase();
        }

        if(Storage.getItem('expertMode') == true)
        {
            document.getElementById('expert-mode').style.display = 'initial';
        }

        this.loadPluginData().then(() => this.renderGUI());
    }

    loadPluginData()
    {
        return new Promise((resolve) => {

            window.Query.complexFetch('/serverside/plugins', 5000, 2, {}, false).then((p) => {
    
                try
                {
                    this.plugins = JSON.parse(p);
    
                    resolve(true);
                }
                catch(e)
                {
                    console.error(e);
    
                    resolve(false);
                }
    
                console.log('PLUGINS', this.plugins);
            });
        });
    }

    renderGUI()
    {
        var removedUpdate = false, hasUpdate = false

        for(const id in this.plugins)
        {
            var title = this.plugins[id].name != 'SynTex' ? this.plugins[id].name.replace('SynTex', 'SynTex ') : 'SynTex';
            var newestVersion = '%general.connection_error%';

            if(this.plugins[id].versions[this.tag] != null || this.plugins[id].versions['latest'] != null)
            {
                newestVersion = window.Essentials.versionCount(this.plugins[id].versions[this.tag]) > window.Essentials.versionCount(this.plugins[id].versions['latest']) ? this.plugins[id].versions[this.tag] : this.plugins[id].versions['latest'];

                this.latestVersions[id] = newestVersion;
            }

            if(this.plugins[id].versions['current'] != null)
            {
                this.versions[id] = this.plugins[id].versions['current'];
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
                version.innerHTML = '%bridge.version%: </b>' + this.versions[id];
                
                latest.id = 'latest-version-' + id;
                latest.className = 'loading-loop expandable-hidden';
                latest.innerHTML = '%bridge.latest_version%: </b>' + this.latestVersions[id];

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
                document.getElementById('version-' + id).innerHTML = '<b>%bridge.version%: </b>' + this.versions[id];
                document.getElementById('latest-version-' + id).innerHTML = '<b>%bridge.latest_version%: </b>' + this.latestVersions[id];
            }

            if(this.versions[id] != null && this.latestVersions[id] != null && window.Essentials.versionCount(this.latestVersions[id]) > window.Essentials.versionCount(this.versions[id]))
            {
                if(document.getElementById('update-btn-' + id) == null)
                {
                    var updateButton = document.createElement('input');

                    updateButton.setAttribute('type', 'button');
                    updateButton.setAttribute('value', title + ' %bridge.update% ( v' + this.latestVersions[id] + ' )');
                    updateButton.setAttribute('id', 'update-btn-' + id);
                    updateButton.setAttribute('style', 'margin-bottom: 20px');

                    updateButton.onclick = () => {

                        if(!window.Running.updateQuery.includes(id + '@' + this.latestVersions[id]))
                        {
                            window.Running.updateQuery.push(id + '@' + this.latestVersions[id]);
                        }
                        else
                        {
                            window.Running.updateQuery.splice(window.Running.updateQuery.indexOf(id + '@' + this.latestVersions[id]), 1);
                        }

                        document.getElementById('update-query-btn').innerHTML = window.Running.updateQuery.length + ' %devices.update_all%';
                    };

                    window.PageManager.addFooter(updateButton);
                }
                else
                {
                    document.getElementById('update-btn-' + id).value = title + ' %bridge.update% ( v' + this.latestVersions[id] + ' )';
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

                if(this.versions[id] == null || this.latestVersions[id] == null)
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

        window.Preloader.finish();
    }
}

window.Init = new Init();