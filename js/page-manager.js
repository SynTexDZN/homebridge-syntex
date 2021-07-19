class PageManagerModule
{
	constructor()
	{
		var lastWidth = document.getElementsByTagName('body')[0].offsetWidth;

		this.footerTemp = document.getElementById('footer-temp');
		this.footerContent = document.getElementById('footer-content');
		this.footerFade = document.getElementById('footer-fade');

		this.headTemp = document.getElementById('head-temp');
		this.headContent = document.getElementById('head-content');

		window.addEventListener('resize', () => {

			var width = document.getElementsByTagName('body')[0].offsetWidth;

			if(lastWidth < 1151 && width > 1151 || lastWidth > 1151 && width < 1151)
			{
				lastWidth = width;

				this.headContent.style.transition = 'none';

				this.headContent.style.maxHeight = this.headTemp.offsetHeight + 'px';
				this.headContent.style.minHeight = this.headTemp.offsetHeight + 'px';

				setTimeout(() => {

					this.headContent.style.removeProperty('transition');

				}, 100);
			}
			
		}, 'KEEP');
	}

	setHeader(title, subtitle, onPage)
	{
		if(this.headContent != null && this.headTemp != null)
		{
			if(title != null)
			{
				this.headTemp.children[0].innerHTML = title;
			}

			if(subtitle != null)
			{
				this.headTemp.children[1].innerHTML = subtitle;
			}

			setTimeout(() => { this.headTemp.style.display = '' }, onPage ? 200 : 0);

			if(!this.headContent.classList.contains('hidden'))
			{
				setTimeout(() => {

					this.headContent.style.maxHeight = this.headTemp.offsetHeight + 'px';
					this.headContent.style.minHeight = this.headTemp.offsetHeight + 'px';
					
				}, 100);
			}
			
			if((title != null && this.headContent.children[0] != null && title != this.headContent.children[0].innerHTML)
			|| (subtitle != null && this.headContent.children[1] != null && subtitle != this.headContent.children[1].innerHTML))
			{
				if(title != null && this.headContent.children[0] != null && title != this.headContent.children[0].innerHTML)
				{
					this.headContent.children[0].classList.add('hidden');
				}

				if(subtitle != null && this.headContent.children[1] != null && subtitle != this.headContent.children[1].innerHTML)
				{
					this.headContent.children[1].classList.add('hidden');
				}

				setTimeout(() => {

					if(title != null && this.headContent.children[0] != null && title != this.headContent.children[0].innerHTML)
					{
						this.headContent.children[0].innerHTML = title;
	
						this.headContent.children[0].classList.remove('hidden');
					}
	
					if(subtitle != null && this.headContent.children[1] != null && subtitle != this.headContent.children[1].innerHTML)
					{
						this.headContent.children[1].innerHTML = subtitle;
	
						this.headContent.children[1].classList.remove('hidden');
					}

					this.headContent.classList.remove('hidden');
	
				}, !onPage && (this.headContent.classList.contains('hidden') || document.getElementsByTagName('body')[0].offsetWidth > 1151) ? 0 : 200);
			}
			else
			{
				setTimeout(() => {

					this.headContent.classList.remove('hidden');

				}, (/*(!this.headContent.classList.contains('hidden') && onPage) || */(this.headContent.classList.contains('hidden') && !onPage)) ? 0 : 200);
			}
		}
	}

	hideHeader(onPage)
	{
		if(this.headContent != null && this.headTemp != null)
		{
			setTimeout(() => this.headContent.classList.add('hidden'), onPage ? 200 : 0);
			setTimeout(() => { this.headTemp.style.display = 'none' }, onPage ? 200 : 0);
		}
	}

	setFooter(element)
	{
		if(this.footerFade != null && this.footerTemp != null && this.footerContent != null && element != null)
		{
			this.footerSetup = true;
			this.footerAddition = [];

			element.style.opacity = 1;
			
			if(this.footerFade.innerHTML != element.outerHTML)
			{
				this.footerFade.style.opacity = 0;

				this.footerTemp.innerHTML = '';
				this.footerTemp.style.display = '';

				this.addFooter(element);
			}

			this.footerContent.classList.add('fade');
		}
	}

	addFooter(element)
	{
		if(this.footerTemp != null && this.footerAddition != null && element != null)
		{
			if(!this.footerSetup)
			{
				element.style.opacity = 0;

				this.footerAddition.push(element);
			}

			var clone = element.cloneNode(true);

			clone.innerHTML = clone.innerHTML.replace(/id=/g, 'oid=');

			if(clone.hasAttribute('id'))
			{
				clone.setAttribute('oid', clone.getAttribute('id'));
				clone.removeAttribute('id');
			}

			this.footerTemp.insertBefore(clone, this.footerTemp.children[0]);
		}
	}

	showFooter(onPage)
	{
		if(this.footerContent != null && this.footerTemp != null && this.footerFade != null)
		{
			if(!this.footerContent.classList.contains('hidden'))
			{
				this.footerContent.style.maxHeight = this.footerContent.offsetHeight + 'px';
				this.footerContent.style.minHeight = this.footerContent.offsetHeight + 'px';

				setTimeout(() => {
				
					this.footerContent.style.maxHeight = (this.footerTemp.offsetHeight + 1) + 'px';
					this.footerContent.style.minHeight = (this.footerTemp.offsetHeight + 1) + 'px';

				}, 0);

				setTimeout(() => {
				
					this.footerContent.style.maxHeight = 'none';
					this.footerContent.style.minHeight = 'auto';

				}, 200);
			}

			setTimeout(() => {

				if(this.footerSetup)
				{
					this.footerFade.innerHTML = this.footerTemp.innerHTML.replace(/oid=/g, 'id=');
				}
				else if(this.footerAddition != null)
				{
					for(const i in this.footerAddition)
					{
						this.footerFade.insertBefore(this.footerAddition[i], this.footerFade.children[0]);
					}

					this.footerAddition = [];
				}

				this.footerFade.style.opacity = 1;

				if(!this.footerSetup)
				{
					setTimeout(() => {

						for(var i = 0; i < this.footerFade.children.length; i++)
						{
							this.footerFade.children[i].style.opacity = 1;
							this.footerTemp.children[i].style.opacity = 1;
						}

					}, 100);
				}

				if(this.footerContent != null)
				{
					this.footerContent.classList.remove('fade');
					this.footerContent.classList.remove('hidden');
				}

				this.footerSetup = false;

			}, (document.getElementsByTagName('body')[0].offsetWidth > 1151 && !onPage) || this.footerContent.classList.contains('hidden') ? 0 : 200);
		}
	}

	removeFooter(id)
	{
		if(this.footerTemp != null && this.footerFade != null)
		{
			for(var i = 0; i < this.footerTemp.children.length; i++)
			{
				if(this.footerTemp.children[i].getAttribute('oid') == id)
				{
					setTimeout(function() {

						this.child.style.setProperty('height', '0', 'important');
						this.child.style.paddingTop = 0;
						this.child.style.paddingBottom = 0;
						this.child.style.marginTop = 0;
						this.child.style.marginBottom = 0;
						this.child.style.borderTopWidth = 0;
						this.child.style.borderBottomWidth = 0;

					}.bind({ child : this.footerTemp.children[i] }), 300);

					setTimeout(function() {

						this.footerTemp.removeChild(this.child);

					}.bind({ child : this.footerTemp.children[i], footerTemp : this.footerTemp }), 600);
				}
			}

			for(var i = 0; i < this.footerFade.children.length; i++)
			{
				if(this.footerFade.children[i].getAttribute('id') == id)
				{
					this.footerFade.children[i].style.opacity = 0;

					setTimeout(function() {

						this.child.style.setProperty('height', '0', 'important');
						this.child.style.paddingTop = 0;
						this.child.style.paddingBottom = 0;
						this.child.style.marginTop = 0;
						this.child.style.marginBottom = 0;
						this.child.style.borderTopWidth = 0;
						this.child.style.borderBottomWidth = 0;

					}.bind({ child : this.footerFade.children[i] }), 300);

					setTimeout(function() {

						this.footerFade.removeChild(this.child);

					}.bind({ child : this.footerFade.children[i], footerFade : this.footerFade }), 600);
				}
			}
		}
	}

	hideFooter(onPage)
	{
		if(this.footerContent != null && this.footerFade != null && this.footerTemp != null)
		{
			this.footerTemp.style.display = 'none';
			this.footerTemp.innerHTML = '';

			setTimeout(() => this.footerContent.classList.add('hidden'), document.getElementsByTagName('body')[0].offsetWidth > 1151 && onPage ? 200 : 0);
			
			setTimeout(() => {
				
				this.footerFade.innerHTML = '';

			}, 300);
		}
	}

	switchPage(previous, next, init)
	{
		return new Promise(async (resolve) => {

			if(!init)
			{
				document.getElementById('preloader').style.opacity = 1;

				await newTimeout(200);
			}

			document.getElementById(previous).style.display = 'none';
			document.getElementById(next).style.display = '';

			if(!init)
			{
				await newTimeout(50);
			}

			document.getElementById('preloader').style.opacity = 0;

			resolve();
		});
	}
}

function newTimeout(ms)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

export let PageManager = new PageManagerModule();