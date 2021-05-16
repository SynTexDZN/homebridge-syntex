var Query, Preloader;

function versionCount(version)
{
	if(version != null && version != '0.0.0')
	{
		var intVersion = version.includes('-') ? -1 : 0;

		for(var i = 0; i < (version.match(/\./g) || []).length + 1; i++)
		{
			if(version.includes('-'))
			{
				intVersion += version.split('-')[0].split('.')[i] * Math.pow(100, (version.match(/\./g) || []).length - i);
			}
			else
			{
				intVersion += version.split('.')[i] * Math.pow(100, (version.match(/\./g) || []).length - i);
			}
		}

		if(version.includes('-'))
		{
			intVersion += parseFloat(version.split('-b')[1]) / 1000.0;
		}
	}

	return intVersion;
}

function checkRestart(url)
{
	return new Promise(async (resolve) => {

		var restart = await Query.fetchURL(url, 3000); // OPTIMIZE: Change to Module ( complexFetch )

		console.log('RESTART', restart);

		if(restart != null && restart == 'false')
		{
			resolve(true);
		}
		else
		{
			setTimeout(() => resolve(checkRestart(url)), 500);
		}
	});
}

function checkUpdating(url)
{
	return new Promise(async (resolve) => {

		var restart = await Query.fetchURL(url, 3000); // OPTIMIZE: Change to Module ( complexFetch )

		console.log('UPDATING', restart);

		if(restart != null && restart == 'false')
		{
			resolve(true);
		}
		else
		{
			setTimeout(() => resolve(checkUpdating(url)), 500);
		}
	});
}

var overlays = [];

function createOverlay(level, id, value, color)
{
	var overlay = document.createElement('input');

	overlay.setAttribute('type', 'button');
	overlay.setAttribute('style', 'z-index: ' + level);
	overlay.setAttribute('id', id);
	overlay.setAttribute('value', value);
	overlay.setAttribute('class', 'overlay gradient-' + color + ' loading-loop');

	return overlay;
}

function createPendingOverlay(id, value)
{
	return createOverlay(1, id, value, 'blue');
}

function createSuccessOverlay(id, value)
{
	return createOverlay(2, id, value, 'green');
}

function createErrorOverlay(id, value)
{
	return createOverlay(2, id, value, 'red');
}

function showOverlay(btn, overlay)
{
	overlays.push({
		reference: btn,
		overlay: overlay
	});

	btn.parentElement.insertBefore(overlay, btn);

	setTimeout(() => {

		btn.style.opacity = 0;
		
		for(var i = 0; i < overlays.length; i++)
		{
			if(overlays[i].reference == btn)
			{
				overlays[i].overlay.style.opacity = 0;
			}
		}

		overlay.style.opacity = 1;

	}, 10);
}

function showOverlayDelay(btn, overlay, delay)
{
	setTimeout(() => showOverlay(btn, overlay), delay);
}

function removeOverlays(btn, show)
{
	if(show)
	{
		btn.style.opacity = 1;
	}
	else
	{
		btn.style.opacity = 0;
	}
	
	for(var i = 0; i < overlays.length; i++)
	{
		if(overlays[i].reference == btn)
		{
			overlays[i].overlay.style.opacity = 0;

			if(show)
			{
				overlays[i].overlay.style.setProperty('cursor', 'pointer', 'important');
			}
		}
	}

	if(!show)
	{
		setTimeout(() => {

			btn.style.setProperty('height', '0', 'important');
			btn.style.paddingTop = 0;
			btn.style.paddingBottom = 0;
			btn.style.marginTop = 0;
			btn.style.marginBottom = 0;
			btn.style.borderTopWidth = 0;
			btn.style.borderBottomWidth = 0;

		}, 300);
	}

	setTimeout(() => {

		for(var i = overlays.length - 1; i >= 0; i--)
		{
			if(overlays[i].reference == btn)
			{
				btn.parentElement.removeChild(overlays[i].overlay);

				overlays.splice(overlays.indexOf(overlays[i]), 1);
			}
		}

		if(!show)
		{
			btn.parentElement.removeChild(btn);
		}

	}, show ? 300 : 600);
}

function getType(services)
{
	var finalType = 'special';

	if(Array.isArray(services))
	{
		var s = [ ...services ];

		for(var i = 0; i < s.length; i++)
		{
			if(s[i] instanceof Object)
			{
				s[i] = s[i].type;
			}
		}

		var unique = s.filter((value, index, self) => { return self.indexOf(value) == index });

		if(unique.length == 1)
		{
			finalType = s[0];
		}
		else if(unique.length < 4)
		{
			if(s.includes('rgb'))
			{
				finalType = 'rgb';

				if(s.includes('dimmer'))
				{
					finalType = 'rgbw';
				}
			}

			if(s.includes('temperature') && s.includes('humidity'))
			{
				finalType = 'climate';
			}
			
			if(s.includes('light') && s.includes('rain'))
			{
				finalType = 'weather';
			}
		}
		
		var onlyService = onlySwitches(s);

		if(onlyService != null)
		{
			finalType = onlyService;
		}
		
		var lastType = s[0], sameServices = true;

		for(const i in s)
		{
			if(lastType != s[i])
			{
				sameServices = false;
			}
		}

		if(sameServices && lastType != null)
		{
			finalType = lastType;
		}

		/*
		if(s.includes('lcd'))
		{
			finalType = 'special';
		}
		*/
	}
	else
	{
		finalType = services instanceof Object ? services.type : services;
	}

	return finalType;
}

function onlySwitches(services)
{
	var tmp = null;

	for(const i in services)
	{
		if(services[i] != 'switch')
		{
			if(tmp == null)
			{
				tmp = services[i];
			}
			else if(tmp != services[i])
			{
				return null;
			}
		}
	}

	return tmp;
}

var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet', 'led', 'dimmer'];
var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function letterToType(letter)
{
	if(typeof letter == 'string')
	{
		return types[letters.indexOf(letter.toUpperCase())];
	}
	
	return null;
}

function typeToLetter(type)
{
	if(typeof type == 'string')
	{
		return letters[types.indexOf(type.toLowerCase())];
	}
	
	return null;
}

var pageLoading = false, pageTimer = false;

async function leavePage(url)
{
	if(!pageLoading)
	{
		pageLoading = true;

		document.getElementById('preloader').style.opacity = 1;
		document.getElementById('preloader').style.pointerEvents = 'all';
		document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.transition = 'opacity 1s cubic-bezier(0.770, 0.000, 0.175, 1.000) 1s';
		document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.opacity = 1;

		pageTimer = false;

		setTimeout(() => {

			pageTimer = true;
			
		}, 200);

		var success = false, notFound = false;

		do
		{
			var response = await loadPageData(url);
			
			if(response == 0)
			{
				success = true;
			}
			else if(response == 1)
			{
				notFound = true;
			}
		}
		while(!success && !notFound);

		pageLoading = false;
	}
}

function loadPageData(url)
{
	return new Promise((resolve) => {

		var client = new XMLHttpRequest();

		client.timeout = 3000;

		client.open('GET', url);

		client.onreadystatechange = async () => {
			
			if(client.readyState === 4)
			{  
				if(client.status === 200)
				{
					resolve(0);

					if(url.includes('syntex.local'))
					{
						if((new URL(window.location.href)).searchParams.get('desktopApp') == 'true')
						{
							window.history.pushState(null, null, url.split('syntex.local')[1] + (url.split('syntex.local')[1].includes('?') ? '&' : '?') + 'desktopApp=true');
						}
						else
						{
							window.history.pushState(null, null, url.split('syntex.local')[1]);
						}
					}
					else
					{
						if((new URL(window.location.href)).searchParams.get('desktopApp') == 'true')
						{
							window.history.pushState(null, null, url + (url.includes('?') ? '&' : '?') + 'desktopApp=true');
						}
						else
						{
							window.history.pushState(null, null, url);
						}
					}

					while(!pageTimer)
					{
						await Essentials.newTimeout(1);
					}

					clearTimers();

					document.getElementById('content').outerHTML = '<div id="content"' + client.responseText.split('<div id="content"')[1].split('</body>')[0];

					for(var i = 0; i < document.getElementsByTagName('script').length; i++)
					{
						if(document.getElementsByTagName('script')[i].id != 'static')
						{
							var script = document.createElement('script');

							script.innerHTML = document.getElementsByTagName('script')[i].innerHTML;

							if(document.getElementsByTagName('script')[i].hasAttribute('type'))
							{
								script.setAttribute('type', document.getElementsByTagName('script')[i].getAttribute('type'));
							}

							if(document.getElementsByTagName('script')[i].hasAttribute('async'))
							{
								script.setAttribute('async', '');
							}

							if(document.getElementsByTagName('script')[i].hasAttribute('defer'))
							{
								script.setAttribute('defer', '');
							}

							var parent = document.getElementsByTagName('script')[i].parentElement;

							parent.replaceChild(script, document.getElementsByTagName('script')[i]);
						}
					}

					searchLoop();

					Preloader.load();
				}
				else if(client.status === 404)
				{
					resolve(1);

					// TODO: Add 404 Page When Page Path Not Found
				}
				else
				{
					resolve(2);
				}
			}
		}

		client.send();
	});
}

function removeOverlaysDelay(btn, delay, show)
{
	setTimeout(() => removeOverlays(btn, show), delay);
}

function newTimeout(ms)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

function SETUP(Q, P)
{
	Query = Q;
	Preloader = P;

	window.onpopstate = (event) => location.reload();
}

export let Essentials = { SETUP, newTimeout, removeOverlaysDelay, removeOverlays, versionCount, checkRestart, checkUpdating, createOverlay, createPendingOverlay, createSuccessOverlay, createErrorOverlay, showOverlay, showOverlayDelay, getType, letterToType, typeToLetter, leavePage };