class PageManagerModule
{
	constructor()
	{
		var lastWidth = document.getElementsByTagName('body')[0].offsetWidth;

		this.footer = document.getElementById('footer-container');
		this.footerTemp = document.getElementById('footer-temp');
		this.footerContent = document.getElementById('footer-content');
		this.footerFade = document.getElementById('footer-fade');

		this.head = document.getElementById('head-container');
		this.headTemp = document.getElementById('head-temp');
		this.headContent = document.getElementById('head-content');

		this.content = document.getElementById('content');

		window.addEventListener('resize', () => {

			var width = document.getElementsByTagName('body')[0].offsetWidth;

			if(lastWidth < 1151 && width > 1151 || lastWidth > 1151 && width < 1151)
			{
				lastWidth = width;

				this.headContent.style.transition = 'none';
				this.footerContent.style.transition = 'none';

				this.headContent.style.maxHeight = this.headTemp.offsetHeight + 'px';
				this.headContent.style.minHeight = this.headTemp.offsetHeight + 'px';
				this.footerContent.style.maxHeight = this.footerTemp.offsetHeight + 'px';
				this.footerContent.style.minHeight = this.footerTemp.offsetHeight + 'px';

				this.setContentMargin(true);

				setTimeout(() => {

					this.headContent.style.transition = '.2s opacity ease-in-out, .2s max-height ease-in-out, .2s min-height ease-in-out';
					this.footerContent.style.transition = '.2s opacity ease-in-out, .2s max-height ease-in-out, .2s min-height ease-in-out';

				}, 100);
			}
		});
	}

	async setHeader(title, subtitle, onPage)
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

			this.setContentMargin(this.headContent.classList.contains('hidden'));
			
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

	addFooter(element)
	{
		if(this.footerTemp != null)
		{
			if(element != null)
			{
				element.innerHTML = element.innerHTML.replace(/id=/g, 'oid=');

				if(element.hasAttribute('id'))
				{
					element.setAttribute('oid', element.id);
					element.removeAttribute('id');
				}

				this.footerTemp.insertBefore(element, this.footerTemp.children[0]);
			}
		}
	}

	removeFooter(id)
	{
		if(this.footerTemp != null)
		{
			for(var i = 0; i < this.footerTemp.children.length; i++)
			{
				if(this.footerTemp.children[i].getAttribute('oid') == id)
				{
					this.footerTemp.children[i].style.setProperty('height', '0', 'important');
					this.footerTemp.children[i].style.paddingTop = 0;
					this.footerTemp.children[i].style.paddingBottom = 0;
					this.footerTemp.children[i].style.marginTop = 0;
					this.footerTemp.children[i].style.marginBottom = 0;
					this.footerTemp.children[i].style.borderTopWidth = 0;
					this.footerTemp.children[i].style.borderBottomWidth = 0;

					setTimeout(function() {

						this.footerTemp.removeChild(this.child);

					}.bind({ child : this.footerTemp.children[i], footerTemp : this.footerTemp }), 300);
				}
			}

			if(this.footerContent != null)
			{
				this.footerContent.style.maxHeight = 'none';
				this.footerContent.style.minHeight = 'auto';

				setTimeout(() => {

					this.footerContent.style.maxHeight = this.footerTemp.offsetHeight + 'px';
					this.footerContent.style.minHeight = this.footerTemp.offsetHeight + 'px';
					
				}, 350);
			}
		}
	}

	showFooter(onPage)
	{
		if(this.footer != null)
		{
			this.setContentMargin(this.footerContent.classList.contains('hidden'));
			
			if(this.footerContent.classList.contains('hidden'))
			{
				this.footerContent.style.transition = 'none';
			}

			this.footerContent.style.maxHeight = this.footerTemp.offsetHeight + 'px';
			this.footerContent.style.minHeight = this.footerTemp.offsetHeight + 'px';

			setTimeout(() => {
				
				this.footerContent.style.transition = '.2s opacity ease-in-out, .2s max-height ease-in-out, .2s min-height ease-in-out';

			}, 100);
			
			setTimeout(() => {

				this.footerFade.innerHTML = this.footerTemp.innerHTML.replace(/oid=/g, 'id=');

				this.footerFade.style.opacity = 1;

				if(this.footerContent != null)
				{
					this.footerContent.classList.remove('fade');
					this.footerContent.classList.remove('hidden');
				}

			}, document.getElementsByTagName('body')[0].offsetWidth > 1151 && !onPage ? 0 : 200);
		}
	}

	setFooter(element)
	{
		if(this.footerFade != null)
		{
			if(this.footerFade.innerHTML != element.outerHTML)
			{
				this.footerFade.style.opacity = 0;

				if(this.footerTemp != null)
				{
					this.footerTemp.innerHTML = '';
					this.footerTemp.style.display = '';
				}

				this.addFooter(element);
			}
		}

		if(this.footerContent != null)
		{
			this.footerContent.classList.add('fade');
		}
	}

	setContentMargin(hidden)
	{
		if(this.content != null)
		{
			if(hidden)
			{
				this.content.style.transition = 'none';
			}

			//this.content.style.marginTop = (this.headTemp.offsetHeight + 84) + 'px';
			//content.style.marginBottom = (this.footerTemp.offsetHeight + 60) + 'px';
		
			setTimeout(() => {

				this.content.style.transition = '.2s margin-top ease-in-out';

			}, 100);
		}
	}

	hideHeader(onPage)
	{
		if(this.headContent != null)
		{
			setTimeout(() => this.headContent.classList.add('hidden'), onPage ? 200 : 0);
		}

		if(this.headTemp != null)
		{
			setTimeout(() => { this.headTemp.style.display = 'none' }, onPage ? 200 : 0);
		}
	}

	hideFooter(onPage)
	{
		if(this.footerContent != null)
		{
			setTimeout(() => this.footerContent.classList.add('hidden'), document.getElementsByTagName('body')[0].offsetWidth > 1151 && onPage ? 200 : 0);
		}

		if(this.footerFade != null)
		{
			setTimeout(() => {
				
				this.footerFade.innerHTML = '';

			}, 300);
		}

		if(this.footerTemp != null)
		{
			this.footerTemp.style.display = 'none';
			this.footerTemp.innerHTML = '';
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