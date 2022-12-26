class URLQuery
{
	constructor()
	{
		this.isRemote = window.location.hostname == 'syntex.sytes.net';

		this.socketInterval = setInterval(() => {

			for(var i = window.activeWebSockets.length - 1; i >= 0; i--)
			{
				var reference = window.activeWebSockets[i];

				if(reference.socket.readyState == 3 && navigator.onLine)
				{
					window.activeWebSockets.splice(i, 1);

					this.connectSocket(reference);
				}
			}

		}, 1000, true);
	}

	SETUP(Essentials)
	{
		this.Essentials = Essentials;
	}

	fetchURL(url, timeout, post, headers)
	{
		return new Promise((resolve) => {
			
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

				if(this.isRemote && url.port != '' && url.port != '8000' && url.port != '8800' && url.port != '8888')
				{
					port = url.port;

					url = new URL(url.href.replace(port, '8000'));
				}
			}
			catch(e)
			{
				//console.error(e);
			}

			client.open('POST', url);

			if(this.isRemote)
			{
				client.setRequestHeader('session', Storage.getRemote('session-id'));
				
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
					let color = 'blue', z = 1;

					if(overlays.pending.z)
					{
						z = overlays.pending.z;
					}

					let style = 'z-index: ' + z;

					if(overlays.pending.style)
					{
						style += '; ' + overlays.pending.style;
					}

					if(overlays.pending.color)
					{
						color = overlays.pending.color;
					}

					let overlay = this.Essentials.createOverlay(z, overlays.id + '-pending', overlays.pending.value, color);

					overlay.setAttribute('style', style);

					this.Essentials.showOverlay(overlays.root, overlay);
				}

				do
				{
					var fetch = await this.fetchURL(url, timeout, post != undefined ? post : null, headers);
					
					tries--;
				}
				while(fetch == null && tries > 0);

				if(fetch == null && overlays.root && overlays.connectionError)
				{
					let color = 'red', z = 2;

					if(overlays.connectionError.z)
					{
						z = overlays.connectionError.z;
					}

					let style = 'z-index: ' + z;

					if(overlays.pending && overlays.pending.style)
					{
						style += '; ' + overlays.pending.style;
					}

					if(overlays.connectionError.color)
					{
						color = overlays.connectionError.color;
					}

					let overlay = this.Essentials.createOverlay(z, overlays.id + '-result', overlays.connectionError.value, color);

					overlay.setAttribute('style', style);

					this.Essentials.showOverlay(overlays.root, overlay);

					if(overlays.root && (overlays.connectionError.remove == undefined || overlays.connectionError.remove == true))
					{
						setTimeout(() => this.Essentials.removeOverlays(overlays.root, true), 2000);
					}
				}
				else if(fetch != 'Success' && overlays.root && overlays.executeError)
				{
					let color = 'red', z = 2;

					if(overlays.executeError.z)
					{
						z = overlays.executeError.z;
					}

					let style = 'z-index: ' + z;

					if(overlays.pending && overlays.pending.style)
					{
						style += '; ' + overlays.pending.style;
					}

					if(overlays.executeError.color)
					{
						color = overlays.executeError.color;
					}

					let overlay = this.Essentials.createOverlay(z, overlays.id + '-result', overlays.executeError.value, color);

					overlay.setAttribute('style', style);

					this.Essentials.showOverlay(overlays.root, overlay);

					if(overlays.root && (overlays.executeError.remove == undefined || overlays.executeError.remove == true))
					{
						setTimeout(() => this.Essentials.removeOverlays(overlays.root, true), 2000);
					}
				}
				else if(overlays.root && overlays.success)
				{
					let color = 'green', z = 2;

					if(overlays.success.z)
					{
						z = overlays.success.z;
					}

					let style = 'z-index: ' + z;

					if(overlays.pending && overlays.pending.style)
					{
						style += '; ' + overlays.pending.style;
					}

					if(overlays.success.color)
					{
						color = overlays.success.color;
					}

					let overlay = this.Essentials.createOverlay(z, overlays.id + '-result', overlays.success.value, color);

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

	connectSocket(reference)
	{
		var request = reference.url;

		try
		{
			request = new URL(request);

			if(window.location.hostname == 'syntex.sytes.net')
			{
				if(request.port != '')
				{
					var port = request.port;

					request = new URL(request.href.replace(port, '8000'));

					request.searchParams.set('port', port);
				}
				
				request.searchParams.set('bridge-id', Storage.getRemote('bridge-id'));
				request.searchParams.set('bridge-password', Storage.getRemote('bridge-password'));
			}
		}
		catch(e)
		{
			console.error(e);
		}
		
		reference.socket = new WebSocket(request);

		reference.socket.onmessage = (response) => {

			var parsedData = response.data;

			try
			{
				parsedData = JSON.parse(parsedData);
			}
			catch(e)
			{
				console.error(e);
			}

			reference.callback(parsedData);
		};

		if(reference.message != null)
		{
			reference.socket.onopen = () => reference.socket.send(JSON.stringify(reference.message));
		}
	
		window.activeWebSockets.push(reference);
	}

	loadData(options = {})
	{
		return new Promise((resolve) => {

			Query.complexFetch(options.url, options.timeout || 5000, options.tries || 2, options.overlay || {}, options.remove || false).then((data) => {

				try
				{
					options.reference[options.key] = JSON.parse(data);

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
}

export let Query = new URLQuery();