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

        Promise.all([

            window.Query.loadData({ url : '/serverside/bridge', key : 'bridge', reference : this }),
            window.Query.loadData({ url : '/serverside/plugins', key : 'plugins', reference : this })

        ]).then(() => {
            
            console.log('DATA', { bridge : this.bridge, plugins : this.plugins });

            for(const id in this.plugins)
            {
                var tag = this.tag;

                if(this.plugins[id].versions[tag] == null)
                {
                    tag = 'latest';
                }

                if(this.plugins[id].versions.current != null)
                {
                    this.version.current[id] = this.plugins[id].versions.current;
                }

                if(this.plugins[id].versions[tag] != null)
                {
                    this.version.latest[id] = this.plugins[id].versions[tag];
                }
            }

            this.renderGUINew();
        
            window.Preloader.finish();
        });
    }

    renderGUINew()
    {
        const renderWidgets = () => {

            document.getElementById('bridge-id').innerHTML = this.bridge.id || '-';
            document.getElementById('bridge-ip').innerHTML = (this.bridge.ip.lan || '-') + '<br>' + (this.bridge.ip.wlan || '-');
            document.getElementById('bridge-mac').innerHTML = (this.bridge.mac.lan || '-').toUpperCase() + '<br>' + (this.bridge.mac.wlan || '-').toUpperCase();
        };

        const renderPlugins = () => {

            for(const id in this.plugins)
            {
                var type = id == 'npm' || id == 'homebridge' ? 'core-plugins' : 'plugins',
                    name = this.plugins[id].name.replace('SynTex', 'SynTex ').trim();

                var container = document.createElement('button'),
                    head = document.createElement('div'),
                    status = document.createElement('div'),
                    content = document.createElement('div'),
                    current = document.createElement('div'),
                    latest = document.createElement('div');

                if(document.getElementById(id) != null)
                {
                    container = document.getElementById(id);
                    head = container.children[0];
                    status = head.getElementsByClassName('update-status');
                    content = container.children[1];
                    current = content.children[0];
                    latest = content.children[1];
                }
                else
                {
                    container.id = id;
                    container.className = 'plugin';

                    head.innerHTML = name;
                    head.className = 'head';

                    status.className = 'update-status';

                    status.onclick = (e) => {

                        if(e.target.classList.contains('available'))
                        {
                            if(!window.Running.updateQuery.includes(id + '@' + this.version.latest[id]))
                            {
                                window.Running.updateQuery.push(id + '@' + this.version.latest[id]);

                                e.target.innerHTML = '%general.waiting%';

                                e.target.style.backgroundColor = 'hsl(200, 85%, 55%)';
                            }
                            else
                            {
                                window.Running.updateQuery.splice(window.Running.updateQuery.indexOf(id + '@' + this.version.latest[id]), 1);

                                e.target.innerHTML = '%bridge.update_available%';

                                e.target.style.backgroundColor = 'hsl(280, 95%, 60%)';
                            }
                        }
    
                        document.getElementById('update-query').innerHTML = '(' + window.Running.updateQuery.length + ') %devices.update_all%';
                    };

                    current.id = id + '-current';
                    current.className = 'loading-loop expandable-hidden';

                    latest.id = id + '-latest';
                    latest.className = 'loading-loop expandable-hidden';

                    head.appendChild(status);

                    content.appendChild(current);
                    content.appendChild(latest);

                    container.appendChild(head);
                    container.appendChild(content);

                    Expandable.createExpandableButton(container);
                }

                current.innerHTML = '%bridge.version%: </b>' + this.version.current[id];
                latest.innerHTML = '%bridge.latest_version%: </b>' + this.version.latest[id];

                if(this.version.current[id] != null 
                && this.version.latest[id] != null)
                {
                    if(window.Essentials.versionCount(this.version.latest[id]) > window.Essentials.versionCount(this.version.current[id]))
                    {
                        renderInstaller();

                        status.innerHTML = '%bridge.update_available%';

                        status.style.backgroundColor = 'hsl(280, 95%, 60%)';

                        status.classList.add('shine', 'available');
                    }
                    else
                    {
                        status.innerHTML = '%bridge.up_to_date%';

                        status.style.backgroundColor = 'hsl(165, 85%, 50%)';

                        status.classList.remove('shine');
                    }
                }
                else
                {
                    status.innerHTML = '%bridge.update_error%';

                    status.style.background = 'hsl(350, 95%, 60%)';

                    status.classList.remove('shine');
                }

                document.getElementById(type).appendChild(container);
            }
        };

        const renderInstaller = () => {

            if(document.getElementById('update-query') == null)
            {
                var updateQuery = document.createElement('button');

                updateQuery.id = 'update-query';
                updateQuery.innerHTML = '(0) %devices.update_all%'; // TODO

                updateQuery.style.marginBottom = '20px';

                updateQuery.setAttribute('type', 'button');

                updateQuery.onclick = () => window.Running.updatePlugins(updateQuery);

                window.PageManager.addFooter(updateQuery);
                window.PageManager.showFooter();
            }
        };

        if(Storage.getItem('expertMode') == true)
        {
            document.getElementById('expert-mode').classList.remove('hidden');
        }

        renderWidgets();
        renderPlugins();
    }

    renderGUI()
    {
        var removedUpdate = false, hasUpdate = false;

        for(const id in this.plugins)
        {
            var title = this.plugins[id].name.replace('SynTex', 'SynTex ').trim();
            /*
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

                Expandable.createExpandableButton(expandable);
            }
            else
            {
                document.getElementById('version-' + id).innerHTML = '<b>%bridge.version%: </b>' + this.version.current[id];
                document.getElementById('latest-version-' + id).innerHTML = '<b>%bridge.latest_version%: </b>' + this.version.latest[id];
            }
            */
            if(this.version.current[id] != null 
            && this.version.latest[id] != null
            && window.Essentials.versionCount(this.version.latest[id]) > window.Essentials.versionCount(this.version.current[id]))
            {
                if(document.getElementById('update-btn-' + id) == null)
                {
                    var updateButton = document.createElement('button');

                    updateButton.id = 'update-btn-' + id;
                    updateButton.innerHTML = title + ' %bridge.update% ( v' + this.version.latest[id] + ' )';

                    updateButton.style.marginBottom = '20px';

                    updateButton.setAttribute('type', 'button');

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
                /*
                document.getElementById('update-status-' + id).innerHTML = '%bridge.update_available%';
                document.getElementById('update-status-' + id).style.background = 'hsl(280, 95%, 60%)';
                document.getElementById('update-status-' + id).classList.add('shine');
                */
                hasUpdate = true;
            }
            else
            {
                if(document.getElementById('update-btn-' + id) != null)
                {
                    window.PageManager.removeFooter('update-btn-' + id);

                    removedUpdate = true;
                }
                /*
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
                */
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