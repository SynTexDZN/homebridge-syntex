import { Expandable } from '/js/expandable-button.js';

export class Init
{
	constructor()
	{
		window.Expandable = Expandable;

		this.plugins = {};
		this.counter = { plugins : 0, updates : 0 };

		this.bridge = { ip : {}, mac : {} };
		this.version = { current : {}, latest : {} };

		this.tag = Storage.getItem('betaPluginVersions') == true ? 'beta' : 'latest';

		this.loadData().then(() => {

			this.renderGUI(true);
		
			window.Preloader.finish();
		});
	}

	loadData()
	{
		return Promise.all([

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

				if(window.Essentials.versionCount(this.version.latest[id]) > window.Essentials.versionCount(this.version.current[id]))
				{
					this.counter.updates++;
				}

				this.counter.plugins++;
			}
		});
	}

	renderGUI(init)
	{
		const renderWidgets = () => {

			document.getElementById('plugin-counter').innerHTML = this.counter.plugins;
			document.getElementById('plugin-updates').innerHTML = this.counter.updates;
			
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
					status = container.getElementsByClassName('update-status')[0];
					current = container.children[1].children[0];
					latest = container.children[1].children[1];
				}
				else
				{
					container.id = id;
					container.className = 'plugin';

					head.innerHTML = name;
					head.className = 'head';

					status.className = 'update-status';

					status.onclick = (e) => {

						e.stopPropagation();

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
	
						document.getElementById('update-query').innerHTML = '(' + window.Running.updateQuery.length + ') ' + (window.Running.updateQuery.length == 1 ? '%general.install_update%' : '%general.install_updates%');
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
						status.innerHTML = '%bridge.update_available%';

						status.style.backgroundColor = 'hsl(280, 95%, 60%)';

						status.classList.add('shine', 'available');
					}
					else
					{
						status.innerHTML = '%bridge.up_to_date%';

						status.style.backgroundColor = 'hsl(165, 85%, 50%)';

						status.classList.remove('shine', 'available');
					}
				}
				else
				{
					status.innerHTML = '%bridge.update_error%';

					status.style.background = 'hsl(350, 95%, 60%)';

					status.classList.remove('shine', 'available');
				}

				document.getElementById(type).appendChild(container);
			}
		};

		const renderFooter = () => {

			window.PageManager.setHeader('%general.dashboard%', '%menu.bridge%');

			var first = document.createElement('div'),
				restartContainer = document.createElement('div'),
				restartButton = document.createElement('button'),
				reloadContainer = document.createElement('div'),
				reloadButton = document.createElement('button'),
				updateButton = document.createElement('button');

			first.style.display = 'flex';
			first.style.gap = '20px';

			restartContainer.style.width = '100%';

			restartButton.id = 'restart-btn';
			restartButton.className = 'gradient-overlay overlay-orange';
			restartButton.innerHTML = '%bridge.restart%';

			restartButton.setAttribute('type', 'button');
			restartButton.setAttribute('onclick', 'window.Running.restartBridge(this)');

			reloadContainer.style.width = '100%';

			reloadButton.className = 'icon-button right split separated';
			reloadButton.innerHTML = '<div class="button-icon"><img class="icon-inverted" src="/img/reload.png"></div><div class="button-text">%general.reload%</div>';

			reloadButton.setAttribute('onclick', 'window.Running.reloadVersions(this)');

			updateButton.id = 'update-query';
			updateButton.innerHTML = '(0) %general.install_updates%';

			updateButton.style.marginBottom = '20px';

			updateButton.setAttribute('type', 'button');
			updateButton.setAttribute('onclick', 'window.Running.updatePlugins(this)');

			restartContainer.appendChild(restartButton);
			reloadContainer.appendChild(reloadButton);

			first.appendChild(restartContainer);
			first.appendChild(reloadContainer);

			window.PageManager.setFooter(first);
			window.PageManager.addFooter(updateButton);
			window.PageManager.showFooter();
		};

		if(Storage.getItem('expertMode') == true)
		{
			document.getElementById('expert-mode').classList.remove('hidden');
		}

		renderWidgets();
		renderPlugins();

		if(init)
		{
			renderFooter();
		}
		else
		{
			document.getElementById('update-query').innerHTML = '(0) %general.install_updates%';
		}
	}
}