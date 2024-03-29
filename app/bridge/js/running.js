export class Running
{
	constructor()
	{
		this.reloading = false;
		this.restarting = false;
		this.updating = false;

		this.updateQuery = [];
	}

	restartBridge(btn)
	{
		if(!this.reloading && !this.restarting && !this.updating)
		{
			var overlays = {
				root : btn,
				id : 'restart',
				pending : { value : '%general.restarting% ..' },
				executeError : { value : '%general.restart_failed%!' },
				connectionError : { value : '%general.bridge_connection_error%!' }
			};

			this.restarting = true;

			window.Query.complexFetch('/serverside/restart', 5000, 2, overlays, true).then((data) => {

				if(data == 'Success')
				{
					setTimeout(() => {
						
						window.Essentials.checkRestart('/serverside/check-restart').then((success) => {

							if(success)
							{
								window.Essentials.showOverlay(btn, window.Essentials.createSuccessOverlay('restart-result', '%general.restart_success%!'));
	
								document.getElementById('restart-btn').classList.remove('activated');
							}
							else
							{
								window.Essentials.showOverlay(btn, window.Essentials.createErrorOverlay('restart-result', '%general.restart_failed%!'));
							}

							this.restarting = false;

							setTimeout(() => window.Essentials.removeOverlays(btn, true), 4000);
						});

					}, 3000);
				}
				else
				{
					this.restarting = false;
				}
			});
		}
	}

	reloadVersions(btn)
	{
		if(!this.reloading && !this.restarting && !this.updating)
		{
			var overlays = {
				root : btn,
				id : 'reload',
				pending : { value : '%general.reloading% ..' },
				connectionError : { value : '%general.bridge_connection_error%!' }
			};

			this.reloading = true;

			for(const id in window.Init.plugins)
			{
				if(document.getElementById(id) != null)
				{
					document.getElementById(id + '-current').innerHTML = '%bridge.version%: %general.loading% ..';
					document.getElementById(id + '-latest').innerHTML = '%bridge.latest_version%: %general.loading% ..';
				}
			}

			window.Query.complexFetch('/serverside/plugins?reload', 5000, 2, overlays, false).then((data) => {

				if(data != null)
				{
					try
					{
						window.Init.plugins = JSON.parse(data);

						window.Essentials.showOverlay(btn, window.Essentials.createSuccessOverlay('reload', '%general.reload_success%!'));

						for(const id in window.Init.plugins)
						{
							var tag = window.Init.tag;

							if(window.Init.plugins[id].versions[tag] == null
							|| window.Essentials.versionCount(window.Init.plugins[id].versions[tag]) < window.Essentials.versionCount(window.Init.plugins[id].versions['latest']))
							{
								tag = 'latest';
							}

							if(window.Init.plugins[id].versions.current != null)
							{
								window.Init.version.current[id] = window.Init.plugins[id].versions.current;
							}

							if(window.Init.plugins[id].versions[tag] != null)
							{
								window.Init.version.latest[id] = window.Init.plugins[id].versions[tag];
							}
						}

						this.updateQuery = [];

						window.Init.renderGUI();
					}
					catch(e)
					{
						window.Essentials.showOverlay(btn, window.Essentials.createErrorOverlay('reload', '%general.reload_failed%!'));

						console.error(e);
					}

					console.log('PLUGINS', window.Init.plugins);

					setTimeout(() => window.Essentials.removeOverlays(btn, true), 2000);
				}

				this.reloading = false;
			});
		}
	}

	updatePlugins(btn)
	{
		if(!this.reloading && !this.restarting && !this.updating)
		{
			if(this.updateQuery.length > 0)
			{
				var overlays = {
					root : btn,
					id : 'update',
					pending : { value : '%general.updating% ..', color : 'purple' },
					executeError : { value : '%general.update_failed%!' },
					connectionError : { value : '%general.bridge_connection_error%!' }
				};
				
				this.updating = true;
	
				window.Query.complexFetch('/serverside/update', 10000, 2, overlays, false, JSON.stringify({ plugins : this.updateQuery })).then((data) => {
	
					const checkUpdate = () => {
	
						window.Query.fetchURL('/serverside/update').then((data) => {
	
							if(data != 'Pending')
							{
								var success = false;
	
								if(data != 'Error')
								{
									window.Init.plugins = JSON.parse(data);
	
									for(const query of this.updateQuery)
									{
										const id = query.split('@')[0], version = query.split('@')[1];
	
										if(window.Init.plugins[id] != null)
										{
											if(window.Init.plugins[id].versions.current == version)
											{
												window.Init.version.current[id] = version;

												document.getElementById(id + '-current').innerHTML = '%bridge.version%: ' + version;

												window.Essentials.showOverlay(btn, window.Essentials.createSuccessOverlay('update-result-' + id, '%general.update_success%!'));

												document.getElementById(id).getElementsByClassName('update-status')[0].innerHTML = '%bridge.up_to_date%';
												document.getElementById(id).getElementsByClassName('update-status')[0].style.background = 'hsl(165, 85%, 50%)';
												document.getElementById(id).getElementsByClassName('update-status')[0].classList.remove('shine', 'available');

												success = true;
											}
											else
											{
												window.Essentials.showOverlay(btn, window.Essentials.createErrorOverlay('update-result-' + id, '%general.update_failed%!'));
											}

											setTimeout(() => window.Essentials.removeOverlays(btn, true), 4000);
										}
									}
								}
	
								this.updating = false;
	
								if(success)
								{
									this.updateQuery = [];
	
									document.getElementById('update-query').innerHTML = '(0) %general.install_updates%';

									window.Init.counter.updates--;

									document.getElementById('plugin-updates').innerHTML = window.Init.counter.updates;
	
									setTimeout(() => document.getElementById('restart-btn').classList.add('activated'), 4000);
								}
							}
							else
							{
								setTimeout(() => checkUpdate(), 1000);
							}
						});
					};
	

					if(data == 'Success')
					{
						checkUpdate();
					}
				});
			}
			else
			{
				var dialogue = {
					title : '%bridge.no_updates_chosen%',
					subtitle : '%bridge.choose_update%',
					buttons : [
						{
							text : '%general.ok%',
							close : true,
							action : () => {

								var update = document.getElementById('plugin-container').getElementsByClassName('available')[0];
								
								if(update != null)
								{
									window.scrollTo({ top : update.offsetTop - 29, behavior : 'smooth' });
								}
							}
						}
					]
				};

				window.Essentials.openDialogue(dialogue);
			}
		}
	}
}