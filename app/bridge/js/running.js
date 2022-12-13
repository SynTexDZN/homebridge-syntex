class Running
{
    constructor()
    {
        this.restarting = false;
        this.updating = false;

        this.updateQuery = [];
    }

    async restartBridge(btn)
    {
        if(!this.restarting && !this.updating)
        {
            var overlays = {
                root : btn,
                id : 'restart',
                pending : { value : '%general.restarting% ..' },
                executeError : { value : '%general.restart_failed%!' },
                connectionError : { value : '%general.bridge_connection_error%!' }
            };

            this.restarting = true;

            if(await window.Query.complexFetch('/serverside/restart', 5000, 2, overlays, true) == 'Success')
            {
                await window.Essentials.newTimeout(3000);

                if(await window.Essentials.checkRestart('/serverside/check-restart'))
                {
                    window.Essentials.showOverlay(btn, window.Essentials.createSuccessOverlay('restart-result', '%general.restart_success%!'));

                    document.getElementById('restart-btn').classList.remove('activated');
                }
                else
                {
                    window.Essentials.showOverlay(btn, window.Essentials.createErrorOverlay('restart-result', '%general.restart_failed%!'));
                }

                await window.Essentials.newTimeout(4000);

                window.Essentials.removeOverlays(btn, true);
            }

            this.restarting = false;
        }
    }

    reloadVersions(btn)
    {
        var overlays = {
            root : btn,
            id : 'reload',
            pending : { value : '%general.reloading% ..' },
            connectionError : { value : '%general.bridge_connection_error%!' }
        };

        for(const id in window.Init.plugins)
        {
            if(document.getElementById(id) != null)
            {
                document.getElementById('version-' + id).innerHTML = '<b>%bridge.version%: </b>%general.loading% ..';
                document.getElementById('latest-version-' + id).innerHTML = '<b>%bridge.latest_version%: </b>%general.loading% ..';
            }
        }

        window.Query.complexFetch('/serverside/plugins?reload', 5000, 2, overlays, false).then(async (p) => {

            try
            {
                window.Init.plugins = JSON.parse(p);

                window.Essentials.showOverlay(btn, window.Essentials.createSuccessOverlay('reload', '%general.reload_success%!'));

                window.Init.renderGUI();
            }
            catch(e)
            {
                window.Essentials.showOverlay(btn, window.Essentials.createErrorOverlay('reload', '%general.reload_failed%!'));

                console.error(e);
            }

            console.log('PLUGINS', window.Init.plugins);

            await window.Essentials.newTimeout(2000);

            window.Essentials.removeOverlays(btn, true);
        });
    }

    updatePlugins(btn)
    {
        if(this.updateQuery.length > 0 && !this.restarting && !this.updating)
        {
            var overlays = {
                root : btn,
                id : 'update',
                pending : { value : '%general.updating% ..', color : 'purple' },
                executeError : { value : '%general.update_failed%!' },
                connectionError : { value : '%general.bridge_connection_error%!' }
            };
            
            this.updating = true;

            window.Query.complexFetch('/serverside/update', 10000, 2, overlays, false, JSON.stringify({ plugins : this.updateQuery })).then(() => {

                const checkUpdate = () => {

                    window.Query.fetchURL('/serverside/update').then((data) => {

                        if(data != 'Pending')
                        {
                            var success = false;

                            if(data != 'Error')
                            {
                                data = JSON.parse(data);

                                for(const query of this.updateQuery)
                                {
                                    const id = query.split('@')[0], version = query.split('@')[1];

                                    for(const plugin of data)
                                    {
                                        if(plugin.id == id)
                                        {
                                            if(plugin.version == version)
                                            {
                                                window.Init.version.current[id] = version;

                                                document.getElementById('version-' + id).innerHTML = '<b>%bridge.version%: </b>' + version;

                                                window.Essentials.showOverlay(btn, window.Essentials.createSuccessOverlay('update-result-' + id, '%general.update_success%!'));

                                                document.getElementById('update-status-' + id).innerHTML = '%bridge.up_to_date%';
                                                document.getElementById('update-status-' + id).style.background = 'hsl(165, 85%, 50%)';
                                                document.getElementById('update-status-' + id).classList.remove('shine');

                                                success = true;
                                            }
                                            else
                                            {
                                                window.Essentials.showOverlay(btn, window.Essentials.createErrorOverlay('update-result-' + id, '%general.update_failed%!'));
                                            }

                                            setTimeout(() => {
                                                
                                                window.Essentials.removeOverlays(btn, true);

                                                if(plugin.version == version)
                                                {
                                                    window.PageManager.removeFooter('update-btn-' + id);
                                                }
                                                
                                            }, 4000);
                                        }
                                    }
                                }
                            }

                            setTimeout(() => {

                                this.updating = false;

                                if(success)
                                {
                                    this.updateQuery = [];

                                    document.getElementById('update-query-btn').innerHTML = '0 %devices.update_all%';

                                    document.getElementById('restart-btn').classList.add('activated');
                                }
                                
                            }, 4000);
                        }
                        else
                        {
                            setTimeout(() => checkUpdate(), 1000);
                        }
                    });
                };

                setTimeout(() => checkUpdate(), 1000);
            });
        }
    }
}

window.Running = new Running();