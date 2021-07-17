class URLQuery
{
	constructor() {}

	SETUP(Essentials)
	{
		this.Essentials = Essentials;
	}

	fetchURL(url, timeout, post)
	{
		return new Promise(resolve => {
			
			var client = new XMLHttpRequest();

			client.timeout = 10000;

			if(timeout != undefined)
			{
				client.timeout = timeout;
			}

			client.open('POST', url);

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

			if(post != undefined)
			{
				client.send(post);
			}
			else
			{
				client.send();
			}
		});
	}

	complexFetch(url, timeout, tries, overlays, remove, post)
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
						var fetch = await this.fetchURL(url, timeout, post);
					}
					else
					{
						var fetch = await this.fetchURL(url, timeout);
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
						setTimeout(() => this.Essentials.removeOverlays(overlays.root, true), 4000);
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
						setTimeout(() => this.Essentials.removeOverlays(overlays.root, true), 4000);
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
						setTimeout(() => this.Essentials.removeOverlays(overlays.root, remove), 4000);
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
			socket.onclose = () => {

				if(activeWebSockets.includes(socket))
				{
					setTimeout(() => this.connectSocket(url, callback, tries, message), 1000);
				}
			};
		}
		else if(tries > 0)
		{
			tries--;

			socket.onclose = () => {

				if(activeWebSockets.includes(socket))
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