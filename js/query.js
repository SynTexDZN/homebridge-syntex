class URLQuery
{
	constructor() {}

	SETUP(Essentials)
	{
		this.Essentials = Essentials;
	}

	fetchURL(url, timeout, post, headers)
	{
		return new Promise(resolve => {
			
			var client = new XMLHttpRequest();

			client.timeout = 10000;

			if(timeout != null)
			{
				client.timeout = timeout;
			}

			var port = null;

			try
			{
				url = new URL(url);
			}
			catch(e)
			{
				//console.error(e);
			}

			if(url instanceof URL && url.port != '' && window.location.hostname == 'syntex.sytes.net')
			{
				port = url.port;
			}

			if(port != null)
			{
				url = new URL(url.href.replace(port, '8000'));
			}

			client.open('POST', url);

			if(port == '8000' || !(url instanceof URL))
			{
				client.setRequestHeader('bridge', headers?.bridgeID || Storage.getRemote('bridge-id'));
				client.setRequestHeader('password', headers?.bridgePassword || Storage.getRemote('bridge-password'));

				if(port != null)
				{
					client.setRequestHeader('port', port);
				}
			}

			client.onreadystatechange = () => {

				if(client.readyState === 4)
				{  
					if(client.status === 200)
					{
						resolve(client.responseText);
					}
					else
					{
						resolve(null);
					}
				}
			}

			if(post != null)
			{
				client.send(post);
			}
			else
			{
				client.send();
			}
		});
	}

	complexFetch(url, timeout, tries, overlays, remove, post, headers)
	{
		return new Promise(async (resolve) => {

			if(document.getElementById(overlays.id + '-pending') == null && document.getElementById(overlays.id + '-result') == null)
			{
				if(overlays.root && overlays.pending)
				{
					var color = 'blue', z = 1;

					if(overlays.pending.z)
					{
						z = overlays.pending.z;
					}

					var style = 'z-index: ' + z;

					if(overlays.pending.style)
					{
						style += '; ' + overlays.pending.style;
					}

					if(overlays.pending.color)
					{
						color = overlays.pending.color;
					}

					var overlay = this.Essentials.createOverlay(z, overlays.id + '-pending', overlays.pending.value, color);

					overlay.setAttribute('style', style);

					this.Essentials.showOverlay(overlays.root, overlay);
				}

				do
				{
					if(post != undefined)
					{
						var fetch = await this.fetchURL(url, timeout, post, headers);
					}
					else
					{
						var fetch = await this.fetchURL(url, timeout, null, headers);
					}
					
					tries--;
				}
				while(fetch == null && tries > 0);

				if(fetch == null && overlays.root && overlays.connectionError)
				{
					var color = 'red', z = 2;

					if(overlays.connectionError.z)
					{
						z = overlays.connectionError.z;
					}

					var style = 'z-index: ' + z;

					if(overlays.pending && overlays.pending.style)
					{
						style += '; ' + overlays.pending.style;
					}

					if(overlays.connectionError.color)
					{
						color = overlays.connectionError.color;
					}

					var overlay = this.Essentials.createOverlay(z, overlays.id + '-result', overlays.connectionError.value, color);

					overlay.setAttribute('style', style);

					this.Essentials.showOverlay(overlays.root, overlay);

					if(overlays.root && (overlays.connectionError.remove == undefined || overlays.connectionError.remove == true))
					{
						setTimeout(() => this.Essentials.removeOverlays(overlays.root, true), 2000);
					}
				}
				else if(fetch != 'Success' && overlays.root && overlays.executeError)
				{
					var color = 'red', z = 2;

					if(overlays.executeError.z)
					{
						z = overlays.executeError.z;
					}

					var style = 'z-index: ' + z;

					if(overlays.pending && overlays.pending.style)
					{
						style += '; ' + overlays.pending.style;
					}

					if(overlays.executeError.color)
					{
						color = overlays.executeError.color;
					}

					var overlay = this.Essentials.createOverlay(z, overlays.id + '-result', overlays.executeError.value, color);

					overlay.setAttribute('style', style);

					this.Essentials.showOverlay(overlays.root, overlay);

					if(overlays.root && (overlays.executeError.remove == undefined || overlays.executeError.remove == true))
					{
						setTimeout(() => this.Essentials.removeOverlays(overlays.root, true), 2000);
					}
				}
				else if(overlays.root && overlays.success)
				{
					var color = 'green', z = 2;

					if(overlays.success.z)
					{
						z = overlays.success.z;
					}

					var style = 'z-index: ' + z;

					if(overlays.pending && overlays.pending.style)
					{
						style += '; ' + overlays.pending.style;
					}

					if(overlays.success.color)
					{
						color = overlays.success.color;
					}

					var overlay = this.Essentials.createOverlay(z, overlays.id + '-result', overlays.success.value, color);

					overlay.setAttribute('style', style);

					this.Essentials.showOverlay(overlays.root, overlay);

					if(overlays.root && (overlays.success.remove == undefined || overlays.success.remove == true))
					{
						setTimeout(() => this.Essentials.removeOverlays(overlays.root, remove), 2000);
					}
				}

				resolve(fetch);
			}
			else
			{
				resolve(null);
			}
		});
	}

	connectSocket(url, callback, tries, message)
	{
		try
		{
			url = new URL(url);

			if(window.location.hostname == 'syntex.sytes.net')
			{
				url = new URL(url.href.replace('ws', 'wss'));

				if(url.port != '')
				{
					var port = url.port;

					url = new URL(url.href.replace(port, '8000'));

					url.searchParams.set('port', port);
				}
			}

			url.searchParams.set('bridge-id', Storage.getRemote('bridge-id'));
			url.searchParams.set('bridge-password', Storage.getRemote('bridge-password'));
		}
		catch(e)
		{
			console.error(e);
		}
		
		let socket = new WebSocket(url);

		socket.onmessage = (data) => {

			var parsedData = data.data;

			try
			{
				parsedData = JSON.parse(parsedData);
			}
			catch(e)
			{
				console.error(e);
			}

			callback(parsedData);
		};

		if(message != null)
		{
			socket.onopen = () => socket.send(JSON.stringify(message));
		}
	
		if(tries == null)
		{
			socket.onclose = (event) => {

				if(!event.wasClean)
				{
					setTimeout(() => this.connectSocket(url, callback, tries, message), 1000);
				}
			};
		}
		else if(tries > 0)
		{
			tries--;

			socket.onclose = (event) => {

				if(!event.wasClean)
				{
					setTimeout(() => this.connectSocket(url, callback, tries, message), 1000);
				}
			};
		}

		activeWebSockets.push(socket);

		return socket;
	}
}

export let Query = new URLQuery();