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

	async setHeader(title, subtitle)
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

			this.headTemp.style.display = '';

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
					this.headContent.children[0].style.opacity = 0;
				}

				if(subtitle != null && this.headContent.children[1] != null && subtitle != this.headContent.children[1].innerHTML)
				{
					this.headContent.children[1].style.opacity = 0;
				}

				setTimeout(() => {

					if(title != null && this.headContent.children[0] != null && title != this.headContent.children[0].innerHTML)
					{
						this.headContent.children[0].innerHTML = title;
	
						this.headContent.children[0].style.opacity = 1;
					}
	
					if(subtitle != null && this.headContent.children[1] != null && subtitle != this.headContent.children[1].innerHTML)
					{
						this.headContent.children[1].innerHTML = subtitle;
	
						this.headContent.children[1].style.opacity = 1;
					}

					this.headContent.classList.remove('hidden');
	
				}, this.headContent.classList.contains('hidden') ? 0 : 200);
			}
			else
			{
				this.headContent.classList.remove('hidden');
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

				this.footerTemp.insertBefore(element, this.footerTemp.children[0]);
				//this.footerFade.appendChild(element.cloneNode(true));
			}
		}
	}

	showFooter()
	{
		if(this.footer != null)
		{
			//this.footerFade.style.opacity = 0;

			this.setContentMargin(this.footerContent.classList.contains('hidden'));
			
			/*if(!this.footerContent.classList.contains('hidden'))
			{*/
				this.footerContent.style.maxHeight = this.footerTemp.offsetHeight + 'px';
				this.footerContent.style.minHeight = this.footerTemp.offsetHeight + 'px';
			//}
			
			setTimeout(() => {

				this.footerFade.innerHTML = this.footerTemp.innerHTML.replace(/oid=/g, 'id=');

				this.footerFade.style.opacity = 1;

				if(this.footerContent != null)
				{
					this.footerContent.classList.remove('fade');
				}

				this.footerContent.classList.remove('hidden');

			}, this.footerContent.classList.contains('hidden') ? 200 : 200);
		}
	}

	setFooter(element)
	{
		if(this.footerFade != null)
		{
			this.footerFade.style.opacity = 0;
		}

		if(this.footerContent != null)
		{
			this.footerContent.classList.add('fade');
		}

		if(this.footerTemp != null)
		{
			this.footerTemp.innerHTML = '';
			this.footerTemp.style.display = '';
		}

		this.addFooter(element);
	}

	setContentMargin(hidden)
	{
		if(this.content != null)
		{
			this.content.setAttribute('last-margin', this.headTemp.offsetHeight + 84);

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

	hideHeader()
	{
		if(this.headContent != null)
		{
			this.headContent.classList.add('hidden');
		}

		if(this.headTemp != null)
		{
			this.headTemp.style.display = 'none';
		}
	}

	hideFooter()
	{
		if(this.footerContent != null)
		{
			this.footerContent.classList.add('hidden');
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
				document.getElementById(previous).style.opacity = 0;

				await newTimeout(200);
			}

			document.getElementById(previous).style.display = 'none';
			document.getElementById(next).style.display = '';

			if(!init)
			{
				await newTimeout(50);
			}

			document.getElementById(next).style.opacity = 1;

			resolve();
		});
	}
}

function newTimeout(ms)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

export let PageManager = new PageManagerModule();