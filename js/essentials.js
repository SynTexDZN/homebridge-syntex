let self = null;

class EssentialFeatures
{
	constructor()
	{
		var supportsPassive = false;

		try
		{
			window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
				get : () => { return supportsPassive = true } 
			}));
		}
		catch(e)
		{
			//console.log(e);
		}

		this.wheelOpt = supportsPassive ? { passive: false } : false;
		this.wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

		this.types = ['occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet', 'led', 'dimmer', 'contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'blind'];
		this.letters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

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
		return new Promise((resolve) => {

			this.Query.fetchURL(url, 3000).then((restart) => {

				console.log('RESTART', restart);

				if(restart != null && restart == 'false')
				{
					resolve(true);
				}
				else
				{
					setTimeout(() => resolve(this.checkRestart(url)), 500);
				}

			}); // OPTIMIZE: Change to Module ( complexFetch )
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
		var dialogue = document.getElementById('dialogue');

		dialogue.style.removeProperty('z-index');

		if(dialogue != null)
		{
			var title = dialogue.getElementsByClassName('title-container')[0],
				subtitle = dialogue.getElementsByClassName('subtitle-container')[0],
				buttonArea = dialogue.getElementsByClassName('button-area')[0];

			disableScroll();

			dialogue.onclick = (e) => {

				if(e.target.id == 'dialogue')
				{
					this.closeDialogue();
				}
			};

			title.innerHTML = data.title || '';
			subtitle.innerHTML = data.subtitle || '';

			if(data.form != null)
			{
				subtitle.appendChild(data.form);
			}

			buttonArea.innerHTML = '';

			if(data.buttons != null)
			{
				for(const i in data.buttons)
				{
					var container = document.createElement('div'),
						button = document.createElement('button');

					container.style.width = '100%';

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
							button.onclick = () => { data.buttons[i].action(); this.closeDialogue() };
						}
						else
						{
							button.onclick = () => this.closeDialogue();
						}
					}

					container.appendChild(button);

					buttonArea.appendChild(container);
				}
			}
			
			dialogue.classList.remove('hidden');
		}
	}

	openOfflineDialogue(data)
	{
		var dialogue = document.getElementById('dialogue');

		dialogue.style.setProperty('z-index', '40000');

		if(dialogue != null)
		{
			var title = dialogue.getElementsByClassName('title-container')[0],
				subtitle = dialogue.getElementsByClassName('subtitle-container')[0],
				buttonArea = dialogue.getElementsByClassName('button-area')[0];

			if(document.getElementById('connection-status') == null)
			{
				disableScroll();

				title.innerHTML = data.title;

				if(!navigator.onLine)
				{
					subtitle.innerHTML = '<div id="connection-status" class="gradient-green gradient-overlay overlay-red activated" style="margin-bottom: 50px">%general.offline%</div>%general.no_connection_to_internet%!';
				}
				else
				{
					subtitle.innerHTML = '<div id="connection-status" class="gradient-green gradient-overlay overlay-red" style="margin-bottom: 50px">%general.online%</div>%general.page_loading_error%!';
				}

				const updateOnlineStatus = () => {

					if(navigator.onLine)
					{
						document.getElementById('connection-status').innerHTML = '%general.online%';
						document.getElementById('connection-status').classList.remove('activated');
					}
					else
					{
						document.getElementById('connection-status').innerHTML = '%general.offline%';
						document.getElementById('connection-status').classList.add('activated');
					}
				};

				updateOnlineStatus();

				window.addEventListener('online',  updateOnlineStatus);
				window.addEventListener('offline', updateOnlineStatus);

				buttonArea.innerHTML = '';

				if(data.buttons != null)
				{
					for(const i in data.buttons)
					{
						var container = document.createElement('div'),
							button = document.createElement('button');

						container.style.width = '100%';

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
								button.onclick = () => {

									window.removeEventListener('online',  updateOnlineStatus);
									window.removeEventListener('offline', updateOnlineStatus);
				
									this.closeDialogue();

									data.buttons[i].action();
								};
							}
							else
							{
								button.onclick = () => {
									
									window.removeEventListener('online',  updateOnlineStatus);
									window.removeEventListener('offline', updateOnlineStatus);
				
									this.closeDialogue();
								};
							}
						}

						container.appendChild(button);

						buttonArea.appendChild(container);
					}
				}

				dialogue.classList.remove('hidden');
			}
		}
	}

	closeDialogue()
	{
		var dialogue = document.getElementById('dialogue');

		enableScroll();

		dialogue.classList.add('hidden');
	}

	letterToType(letters)
	{
		if(letters != null)
		{
			return this.types[this.letters.indexOf(letters[0].toUpperCase())];
		}
		
		return null;
	}

	typeToLetter(type)
	{
		if(type != null)
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

			if(show == false)
			{
				btn.parentElement.removeChild(btn);
			}

		}, (show == null || show == true) ? 300 : 600);
	}

	removeOverlaysDelay(btn, delay, show)
	{
		setTimeout(() => this.removeOverlays(btn, show), delay);
	}

	leavePage(url)
	{
		return new Promise((resolve) => {

			if(!this.pageLoading)
			{
				/*
				var scrollPositions = Storage.getItem('scroll-positions') || {};

				scrollPositions[window.location.pathname + window.location.search] = window.scrollY;

				Storage.setItem('scroll-positions', scrollPositions);
				*/
				this.pageLoading = true;

				document.getElementById('preloader').style.opacity = 1;
				document.getElementById('preloader').style.pointerEvents = 'all';
				document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.transition = 'opacity 1s cubic-bezier(0.770, 0.000, 0.175, 1.000) 1s';
				document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.opacity = 1;

				this.pageTimer = false;

				setTimeout(() => { this.pageTimer = true }, 200);

				loadPageData(url).then((response) => {

					if(response != 200 && !navigator.onLine)
					{
						var dialogue = {
							title : '%general.connection_error%',
							buttons : [
								{
									text : '%general.reload%',
									action : () => {

										var button = document.getElementById('dialogue').getElementsByTagName('button')[0];

										this.showOverlay(button, this.createPendingOverlay('reload', '%general.loading% ..'));
										
										this.leavePage(url).then((status) => {
										
											if(status == 200)
											{
												Essentials.closeDialogue();
											}
											else
											{
												this.showOverlay(button, this.createErrorOverlay('reload', '%general.connection_error%'));

												this.removeOverlaysDelay(button, 2000, true);
											}
										})
									}
								}
							]
						};

						this.openOfflineDialogue(dialogue);
					}

					resolve(response);

					this.changeCounter = [];
					this.pageLoading = false;
				});
			}
			else
			{
				resolve(404);
			}
		});
	}

	promoteSubmitButton(input, id)
	{
		var submit = document.getElementById(id),
			orginalValue = input.getAttribute('value'),
			inputID = getID(input);

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

	gradientBackgroundFade(button, color)
	{
		if(button.classList.contains('activated'))
		{
			button.classList.add('underlay-' + color);

			button.classList.remove('activated');
			button.classList.add('deactivated');

			setTimeout(() => {

				var style = button.classList;

				for(const i in style)
				{
					if(typeof style[i] == 'string' && style[i].startsWith('overlay'))
					{
						button.classList.remove(style[i]);
					}
				}

			}, 200);
		}
		else if(button.classList.contains('deactivated'))
		{
			button.classList.add('overlay-' + color);

			button.classList.remove('deactivated');
			button.classList.add('activated');

			setTimeout(() => {

				var style = button.classList;

				for(const i in style)
				{
					if(typeof style[i] == 'string' && style[i].startsWith('underlay'))
					{
						button.classList.remove(style[i]);
					}
				}

			}, 200);
		}
		else
		{
			button.classList.add('overlay-' + color);

			button.classList.add('activated');
		}
	}

	scrollParentToChild(parent, child)
	{
		var parentRect = parent.getBoundingClientRect(),
			childRect = child.getBoundingClientRect();

		if(!(childRect.top >= parentRect.top && childRect.bottom <= parentRect.top + parent.clientHeight))
		{
			const scrollTop = childRect.top - parentRect.top;
			const scrollBot = childRect.bottom - parentRect.bottom;

			if(Math.abs(scrollTop) < Math.abs(scrollBot))
			{
				parent.scrollTop += scrollTop;
			}
			else
			{
				parent.scrollTop += scrollBot;
			}
		}

		if(!(childRect.left >= parentRect.left && childRect.right <= parentRect.left + parent.clientWidth))
		{
			const scrollLeft = childRect.left - parentRect.left;
			const scrollRight = childRect.right - parentRect.right;

			if(Math.abs(scrollLeft) < Math.abs(scrollRight))
			{
				parent.scrollLeft += scrollLeft;
			}
			else
			{
				parent.scrollLeft += scrollRight;
			}
		}
	}

	getServiceColor(service)
	{
		var result = { text : null, color : null };

		if(service.letters != null && service.state != null)
		{
			var type = Essentials.letterToType(service.letters[0]);

			if(type == 'rgb' || type == 'dimmer')
			{
				if(service.state.value == false || service.state.brightness == 0)
				{
					result.text = '%characteristics.boolean.inactive%';
				}
				else if(service.state.value == true)
				{
					result.text = Math.round(service.state.brightness) + '%';

					if(Math.round(service.state.brightness) == 100)
					{
						result.text = '%characteristics.boolean.active%';
					}
					
					if(type == 'rgb')
					{
						result.color = 'hsl(' + parseInt(service.state.hue) + ', ' + parseInt(14 + service.state.saturation * service.state.brightness / 100 / 100 * (100 - 14)) + '%, ' + (27 + service.state.brightness / 100 * (65 - 27)) + '%)';
					}
					else if(type == 'dimmer')
					{
						result.color = 'hsl(40, ' + parseInt(service.state.brightness * 0.85) + '%, ' + (25 + parseInt(service.state.brightness) * 0.5) + '%)';
					}
				}
			}
			else if(service.format.value.includes('bool'))
			{
				if(service.state.value)
				{
					result.text = window.servicePresets[type].active.text;
					result.color = window.servicePresets[type].active.color;
				}
				else
				{
					result.text = window.servicePresets[type].inactive.text;
					result.color = window.servicePresets[type].inactive.color;
				}
			}
			else if(service.format.value.includes('int') || service.format.value.includes('float'))
			{
				var cRange = window.servicePresets[type].colorRange,
					vRange = window.servicePresets[type].valueRange;

				result.text = service.state.value;

				if(type == 'temperature')
				{
					result.text = ((Math.round(service.state.value * 10.0)) / 10.0) + ' ' + window.servicePresets[type].text;

					if(service.state.value < vRange[0])
					{
						result.color = 'hsl(' + cRange[0] + ', 65%, 55%)';
					}
					else if(service.state.value > vRange[1])
					{
						result.color = 'hsl(' + cRange[1] + ', 65%, 55%)';
					}
					else
					{
						result.color = 'hsl(' + ((service.state.value - vRange[0]) / (vRange[1] - vRange[0]) * (cRange[1] - cRange[0]) + cRange[0]) + ', 65%, 55%)';
					}
				}
				else if(type == 'humidity')
				{
					result.text = Math.round(service.state.value) + ' ' + window.servicePresets[type].text;

					if(service.state.value > 50)
					{	
						cRange = [260, 0];
					}	

					if(service.state.value < vRange[0] || service.state.value > vRange[1])
					{
						result.color = 'hsl(' + cRange[0] + ', 65%, 55%)';
					}
					else if(service.state.value < 40 || service.state.value > 60)	
					{	
						result.color = 'hsl(' + ((service.state.value - vRange[0]) / (vRange[1] - vRange[0]) * (cRange[1] - cRange[0]) + cRange[0]) + ', 65%, 55%)';
					}	
					else	
					{	
						result.color = window.servicePresets[type].color;	
					}
				}
				else if(type == 'light')
				{
					result.text = Math.round(service.state.value) + ' ' + window.servicePresets[type].text;

					if(service.state.value > 1000)
					{
						result.color = window.servicePresets[type].color;
					}
					else
					{
						result.color = 'hsl(40, ' + ((service.state.value - vRange[0]) / (vRange[1] - vRange[0]) * (cRange[1] - cRange[0] + 25) + cRange[0] - 25) + '%, ' + ((service.state.value - vRange[0]) / (vRange[1] - vRange[0]) * (cRange[1] - cRange[0]) + cRange[0]) + '%)';
					}
				}
				else if(type == 'airquality')
				{
					result.text = Math.round(service.state.value) + ' ' + window.servicePresets[type].text;

					if(service.state.value > 4)
					{
						result.color = window.servicePresets[type].color;
					}
					else
					{
						result.color = 'hsl(' + ((service.state.value - vRange[0]) / (vRange[1] - vRange[0]) * (cRange[1] - cRange[0]) + cRange[0]) + ', 85%, 65%)';
					}
				}
				else if(type == 'blind')
				{
					if(service.state.value == 0)
					{
						result.text = '%characteristics.blind.inactive%';
					}
					else if(service.state.value == 100)
					{
						result.text = '%characteristics.blind.active%';
						result.color = window.servicePresets[type].color;
					}
					else
					{
						result.text = Math.round(service.state.value) + ' ' + window.servicePresets[type].text.toUpperCase();
						result.color = 'hsl(190, ' + ((service.state.value - vRange[0]) / (vRange[1] - vRange[0]) * (cRange[1] - cRange[0]) + cRange[0] - 10) + '%, ' + ((service.state.value - vRange[0]) / (vRange[1] - vRange[0]) * (cRange[1] - cRange[0]) + cRange[0] - 30) + '%)';
					}
				}
				else
				{
					result.text = service.state.value + ' ' + window.servicePresets[type].active.text;
				}
			}
		}
		else if(type == 'statelessswitch')	
		{	
			result.text = window.servicePresets[type].inactive.text;
			result.color = window.servicePresets[type].inactive.color;
		}

		return result;
	}

	getDataType(type)
	{
		if(type == 'temperature' || type == 'humidity' || type == 'light' || type == 'airquality' || type == 'blind' || type == 'statelessswitch')
		{
			return 'numeric';
		}
		else
		{
			return 'boolean';
		}
	}

	getURLParams(key)
	{
		var url = new URL(window.location.href);

		if(url != null)
		{
			try
			{
				return JSON.parse(url.searchParams.get(key));
			}
			catch(e)
			{
				return url.searchParams.get(key);
			}
		}

		return null;
	}

	hexToHSL(H)
	{
		let r = 0, g = 0, b = 0;

		if(H.length == 4)
		{
			r = '0x' + H[1] + H[1];
			g = '0x' + H[2] + H[2];
			b = '0x' + H[3] + H[3];
		}
		else if(H.length == 7)
		{
			r = '0x' + H[1] + H[2];
			g = '0x' + H[3] + H[4];
			b = '0x' + H[5] + H[6];
		}

		r /= 255;
		g /= 255;
		b /= 255;

		let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0;

		if(delta == 0)
		{
			h = 0;
		}
		else if(cmax == r)
		{
			h = ((g - b) / delta) % 6;
		}
		else if(cmax == g)
		{
			h = (b - r) / delta + 2;
		}
		else
		{
			h = (r - g) / delta + 4;
		}

		h = Math.round(h * 60);

		if(h < 0)
		{
			h += 360;
		}

		l = (cmax + cmin) / 2;
		s = (delta == 0) ? 0 : delta / (1 - Math.abs(2 * l - 1));
		s = +(s * 100).toFixed(1);
		l = +(l * 100).toFixed(1);

		return { hue : Math.round(h), saturation : Math.round(s), brightness : Math.round(l) };
	}

	hslToHEX(h, s, l)
	{
		s /= 100;
		l /= 100;

		let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0; 

		if(0 <= h && h < 60)
		{
			r = c; g = x; b = 0;
		}
		else if(60 <= h && h < 120)
		{
			r = x; g = c; b = 0;
		}
		else if(120 <= h && h < 180)
		{
			r = 0; g = c; b = x;
		}
		else if (180 <= h && h < 240)
		{
			r = 0; g = x; b = c;
		}
		else if (240 <= h && h < 300)
		{
			r = x; g = 0; b = c;
		}
		else if (300 <= h && h < 360)
		{
			r = c; g = 0; b = x;
		}
		
		r = Math.round((r + m) * 255).toString(16);
		g = Math.round((g + m) * 255).toString(16);
		b = Math.round((b + m) * 255).toString(16);

		if(r.length == 1)
		{
			r = '0' + r;
		}
		if(g.length == 1)
		{
			g = '0' + g;
		}
		if(b.length == 1)
		{
			b = '0' + b;
		}

		return '#' + r + g + b;
	}

	switchBooleanButton(btn, value)
	{
		if(value == null)
		{
			value = !(btn.value == '%characteristics.boolean.active%');
		}

		if(value)
		{
			btn.classList.add('white');
			btn.classList.remove('outline');

			btn.value = '%characteristics.boolean.active%';
		}
		else
		{
			btn.classList.remove('white');
			btn.classList.add('outline');

			btn.value = '%characteristics.boolean.inactive%';
		}
	}

	formatTimestamp(timestamp)
	{
		timestamp /= 1000;

		if(timestamp < 60)
		{
			return Math.round(timestamp) + ' ' + '%devices.time.seconds%'[0];
		}
		else if(timestamp < 60 * 60)
		{
			return Math.round(timestamp / 60) + ' ' + '%devices.time.minutes%'[0];
		}
		else if(timestamp < 60 * 60 * 24)
		{
			return Math.round(timestamp / 60 / 60) + ' ' + '%devices.time.hours%'[0];
		}
		else if(timestamp < 60 * 60 * 24 * 7)
		{
			return Math.round(timestamp / 60 / 60 / 24) + ' ' + '%devices.time.days%'[0];
		}
		else if(timestamp < 60 * 60 * 24 * 30.5)
		{
			return Math.round(timestamp / 60 / 60 / 24 / 7) + ' ' + '%devices.time.weeks%'[0];
		}
		else if(timestamp < 60 * 60 * 24 * 365)
		{
			return Math.round(timestamp / 60 / 60 / 24 / 30.5) + ' ' + '%devices.time.months%'[0];
		}
		else
		{
			return '> 1 ' + '%devices.time.years%'[0];
		}
	}

	addVerticalGrab(element)
	{
		let pos = { top : 0, left : 0, x : 0, y : 0 };

		const mouseDownHandler = function(e)
		{
			element.style.cursor = 'grabbing';
			element.style.userSelect = 'none';

			pos = {
				left : element.scrollLeft,
				top : element.scrollTop,
				x : e.clientX,
				y : e.clientY,
			};

			document.addEventListener('mousemove', mouseMoveHandler);
			document.addEventListener('mouseup', mouseUpHandler);
		};

		const mouseMoveHandler = function(e)
		{
			const dx = e.clientX - pos.x;
			const dy = e.clientY - pos.y;

			element.scrollTop = pos.top - dy;
			element.scrollLeft = pos.left - dx;
			
			for(var i = 0; i < element.children.length; i++)
			{
				element.children[i].style.pointerEvents = 'none';
			}
		};

		const mouseUpHandler = function()
		{
			element.style.cursor = 'grab';
			element.style.removeProperty('user-select');

			for(var i = 0; i < element.children.length; i++)
			{
				element.children[i].style.pointerEvents = 'all';
			}

			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
		};

		element.addEventListener('mousedown', mouseDownHandler);
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
		if(services[i] != 'switch' && services[i] != 'statelessswitch' && services[i] != 'unsupported')
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
	window.addEventListener('DOMMouseScroll', preventDefault, false);
	window.addEventListener(self.wheelEvent, preventDefault, self.wheelOpt);
	window.addEventListener('touchmove', preventDefault, self.wheelOpt);
	window.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

function enableScroll()
{
	window.removeEventListener('DOMMouseScroll', preventDefault, false);
	window.removeEventListener(self.wheelEvent, preventDefault, self.wheelOpt); 
	window.removeEventListener('touchmove', preventDefault, self.wheelOpt);
	window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}

function preventDefault(e)
{
	e.preventDefault();
}

function loadPageData(url)
{
	return new Promise((resolve) => {

		var client = new XMLHttpRequest();

		client.timeout = 30000;

		client.open('GET', url);

		client.setRequestHeader('bridge', Storage.getRemote('bridge-id'));
		client.setRequestHeader('password', Storage.getRemote('bridge-password'));

		client.onreadystatechange = async () => {
			
			if(client.readyState === 4)
			{
				resolve(client.status);

				if(client.status === 200)
				{
					if(url.includes('syntex.local'))
					{
						if(self.getURLParams('desktopApp') == true)
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
						if(self.getURLParams('desktopApp') == true)
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

					window.clearTimers();
					window.closeSockets();
					window.removeEventListeners();

					document.getElementById('content').outerHTML = '<div id="content"' + client.responseText.split('<div id="content"')[1].split('</body>')[0];

					window.scrollTo(window.scrollX, 0);
					/*
					var scrollPositions = Storage.getItem('scroll-positions') || {};

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

					window.LoadingLoop.searchLoop();

					self.Preloader.load();
				}
			}
		}

		client.send();
	});
}

export let Essentials = new EssentialFeatures();