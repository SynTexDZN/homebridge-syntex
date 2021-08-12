let self = null;

class EssentialFeatures
{
	constructor()
	{
		var supportsPassive = false;

		try
		{
			window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
				get : () => { supportsPassive = true } 
			}));
		}
		catch(e) {}

		this.wheelOpt = supportsPassive ? { passive: false } : false;
		this.wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

		this.types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet', 'led', 'dimmer'];
		this.letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

		this.overlays = [];
		this.changeCounter = [];

		this.pageLoading = false;
		this.pageTimer = false;

		self = this;
	}

	SETUP(Query, Preloader)
	{
		this.Query = Query;
		this.Preloader = Preloader;

		window.onpopstate = () => location.reload();
	}

	newTimeout(ms)
	{
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	versionCount(version)
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

	checkRestart(url)
	{
		return new Promise(async (resolve) => {

			var restart = await this.Query.fetchURL(url, 3000); // OPTIMIZE: Change to Module ( complexFetch )

			console.log('RESTART', restart);

			if(restart != null && restart == 'false')
			{
				resolve(true);
			}
			else
			{
				setTimeout(() => resolve(this.checkRestart(url)), 500);
			}
		});
	}

	checkUpdating(url)
	{
		return new Promise(async (resolve) => {

			var restart = await this.Query.fetchURL(url, 3000); // OPTIMIZE: Change to Module ( complexFetch )

			console.log('UPDATING', restart);

			if(restart != null && restart == 'false')
			{
				resolve(true);
			}
			else
			{
				setTimeout(() => resolve(this.checkUpdating(url)), 500);
			}
		});
	}

	getType(services)
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

	openDialogue(data)
	{
		var dialogue = document.createElement('div');
		var panel = document.createElement('div');
		var title = document.createElement('h2');
		var subtitle = document.createElement('p');
		var buttonArea = document.createElement('div');

		disableScroll();

		dialogue.className = 'dialogue';
		dialogue.onclick = (e) => {

			if(e.target.classList.contains('dialogue'))
			{
				this.closeDialogue(e.target);
			}
		};

		panel.className = 'panel striped';
		title.className = 'title-container';
		title.innerHTML = data.title;
		subtitle.innerHTML = data.subtitle;
		buttonArea.className = 'button-area';

		if(data.buttons != null)
		{
			for(const i in data.buttons)
			{
				var button = document.createElement('button');

				button.innerHTML = data.buttons[i].text;

				if(data.buttons[i].color != null)
				{
					button.className = 'gradient-' + data.buttons[i].color;
				}

				if(data.buttons[i].action != null)
				{
					button.onclick = data.buttons[i].action;
				}

				if(data.buttons[i].close)
				{
					if(data.buttons[i].action != null)
					{
						button.onclick = () => { data.buttons[i].action(); this.closeDialogue(dialogue) };
					}
					else
					{
						button.onclick = () => this.closeDialogue(dialogue);
					}
				}

				buttonArea.appendChild(button);
			}
		}

		panel.appendChild(title);
		panel.appendChild(subtitle);
		panel.appendChild(buttonArea);

		dialogue.appendChild(panel);

		document.body.appendChild(dialogue);

		setTimeout(() => { dialogue.style.opacity = 1; panel.style.opacity = 1; panel.style.transform = 'scale(1)' }, 0);
	}

	closeDialogue(dialogue)
	{
		enableScroll();

		dialogue.style.opacity = 0;
		dialogue.getElementsByClassName('panel')[0].style.opacity = 0;

		setTimeout(() => dialogue.parentElement.removeChild(dialogue), 300);
	}

	letterToType(letter)
	{
		if(typeof letter == 'string')
		{
			return this.types[this.letters.indexOf(letter.toUpperCase())];
		}
		
		return null;
	}

	typeToLetter(type)
	{
		if(typeof type == 'string')
		{
			if(type.startsWith('rgb'))
			{
				type = 'rgb';
			}
			
			return this.letters[this.types.indexOf(type.toLowerCase())];
		}
		
		return null;
	}

	createOverlay(level, id, value, color)
	{
		var overlay = document.createElement('input');

		overlay.setAttribute('type', 'button');
		overlay.setAttribute('style', 'z-index: ' + level);
		overlay.setAttribute('id', id);
		overlay.setAttribute('value', value);
		overlay.setAttribute('class', 'overlay gradient-' + color + ' loading-loop');

		return overlay;
	}

	createPendingOverlay(id, value)
	{
		return this.createOverlay(1, id, value, 'blue');
	}

	createSuccessOverlay(id, value)
	{
		return this.createOverlay(2, id, value, 'green');
	}

	createErrorOverlay(id, value)
	{
		return this.createOverlay(2, id, value, 'red');
	}

	showOverlay(btn, overlay)
	{
		this.overlays.push({
			reference: btn,
			overlay: overlay
		});

		btn.parentElement.insertBefore(overlay, btn);

		setTimeout(() => {

			btn.style.opacity = 0;
			
			for(var i = 0; i < this.overlays.length; i++)
			{
				if(this.overlays[i].reference == btn)
				{
					this.overlays[i].overlay.style.opacity = 0;
				}
			}

			overlay.style.opacity = 1;

		}, 10);
	}

	showOverlayDelay(btn, overlay, delay)
	{
		setTimeout(() => this.showOverlay(btn, overlay), delay);
	}

	removeOverlays(btn, show)
	{
		if(show == true)
		{
			btn.style.opacity = 1;
		}
		else if(show == false)
		{
			btn.style.opacity = 0;
		}

		for(var i = 0; i < this.overlays.length; i++)
		{
			if(this.overlays[i].reference == btn)
			{
				this.overlays[i].overlay.style.opacity = 0;

				if(show)
				{
					this.overlays[i].overlay.style.setProperty('cursor', 'pointer', 'important');
				}
			}
		}

		if(show == false)
		{
			setTimeout(() => {

				btn.style.setProperty('height', '0', 'important');
				btn.style.paddingTop = 0;
				btn.style.paddingBottom = 0;
				btn.style.marginTop = 0;
				btn.style.marginBottom = 0;
				btn.style.borderTopWidth = 0;
				btn.style.borderBottomWidth = 0;

				console.log('MAIN BTN 2 SHRINK');

			}, 300);
		}

		setTimeout(() => {

			for(var i = this.overlays.length - 1; i >= 0; i--)
			{
				if(this.overlays[i].reference == btn)
				{
					btn.parentElement.removeChild(this.overlays[i].overlay);

					this.overlays.splice(this.overlays.indexOf(this.overlays[i]), 1);
				}
			}

			console.log('REMOVE OVERLAYS');

			if(show == false)
			{
				btn.parentElement.removeChild(btn);

				console.log('MAIN BTN 2 REMOVE');
			}

		}, (show == null || show == true) ? 300 : 600);
	}

	removeOverlaysDelay(btn, delay, show)
	{
		setTimeout(() => this.removeOverlays(btn, show), delay);
	}

	async leavePage(url)
	{
		if(!this.pageLoading)
		{
			/*
			var scrollPositions = JSON.parse(localStorage.getItem('scroll-positions')) || {};

			scrollPositions[window.location.pathname + window.location.search] = window.scrollY;

			localStorage.setItem('scroll-positions', JSON.stringify(scrollPositions));
			*/
			this.pageLoading = true;

			document.getElementById('preloader').style.opacity = 1;
			document.getElementById('preloader').style.pointerEvents = 'all';
			document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.transition = 'opacity 1s cubic-bezier(0.770, 0.000, 0.175, 1.000) 1s';
			document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.opacity = 1;

			this.pageTimer = false;

			setTimeout(() => {

				this.pageTimer = true;
				
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

			this.changeCounter = [];
			this.pageLoading = false;
		}
	}

	promoteSubmitButton(input, id)
	{
		var submit = document.getElementById(id), orginalValue = input.getAttribute('value'), inputID = getID(input);

		if(input.hasAttribute('orginal-value'))
		{
			orginalValue = input.getAttribute('orginal-value');
		}

		if(input.value != orginalValue && !this.changeCounter.includes(inputID))
		{
			this.changeCounter.push(inputID);
		}
		else if(input.value == orginalValue)
		{
			this.changeCounter.splice(this.changeCounter.indexOf(inputID), 1);
		}

		if(this.changeCounter.length > 0)
		{
			submit.classList.add('pulse');
		}

		submit.onanimationiteration = function()
		{
			if(this.changeCounter.length == 0)
			{
 				this.button.classList.remove('pulse');
			}

		}.bind({ button : submit, changeCounter : this.changeCounter });
	}
}

var idCounter = new Date().getTime();

function getID(element)
{
	return (element.id) ? element.id : (element.id = 'unique-' + idCounter++);
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

function preventDefaultForScrollKeys(e)
{
	var keys = [37, 38, 39, 40];
	
	if(keys.includes(e.keyCode))
	{
		e.preventDefault();

		return false;
	}
}

function disableScroll()
{
	window.addEventListener('DOMMouseScroll', (e) => { e.preventDefault() }, false);
	window.addEventListener(self.wheelEvent, (e) => { e.preventDefault() }, self.wheelOpt);
	window.addEventListener('touchmove', (e) => { e.preventDefault() }, self.wheelOpt);
	window.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

function enableScroll()
{
	window.removeEventListener('DOMMouseScroll', (e) => { e.preventDefault() }, false);
	window.removeEventListener(self.wheelEvent, (e) => { e.preventDefault() }, self.wheelOpt); 
	window.removeEventListener('touchmove', (e) => { e.preventDefault() }, self.wheelOpt);
	window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
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

					while(!self.pageTimer)
					{
						await self.newTimeout(1);
					}

					clearTimers();
					closeSockets();
					removeEventListeners();

					document.getElementById('content').outerHTML = '<div id="content"' + client.responseText.split('<div id="content"')[1].split('</body>')[0];

					window.scrollTo(window.scrollX, 0);
					/*
					var scrollPositions = JSON.parse(localStorage.getItem('scroll-positions')) || {};

					if(scrollPositions[url] != null)
					{
						window.scrollTo(window.scrollX, scrollPositions[url]);
					}
					
					console.log('SCROLL POSITIONS', scrollPositions);
					*/
					for(var i = 0; i < document.getElementsByTagName('script').length; i++)
					{
						if(document.getElementsByTagName('script')[i].id != 'static')
						{
							var script = document.createElement('script');

							script.innerHTML = document.getElementsByTagName('script')[i].innerHTML;

							if(document.getElementsByTagName('script')[i].hasAttribute('src'))
							{
								script.setAttribute('src', document.getElementsByTagName('script')[i].getAttribute('src'));
							}

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

					LoadingLoop.searchLoop();

					self.Preloader.load();
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

export let Essentials = new EssentialFeatures();