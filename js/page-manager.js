class PageManagerModule
{
	constructor()
	{

	}

	async setHeader(title, subtitle)
	{
		var head = document.getElementById('head-container');

		if(head != null)
		{
			if((title != null && head.children[0] != null && title != head.children[0].innerHTML)
			|| (subtitle != null && head.children[1] != null && subtitle != head.children[1].innerHTML))
			{
				if(title != null && head.children[0] != null && title != head.children[0].innerHTML)
				{
					head.children[0].style.opacity = 0;
				}

				if(subtitle != null && head.children[1] != null && subtitle != head.children[1].innerHTML)
				{
					head.children[1].style.opacity = 0;
				}

				setTimeout(() => {

					if(title != null && head.children[0] != null && title != head.children[0].innerHTML)
					{
						head.children[0].innerHTML = title;
	
						head.children[0].style.opacity = 1;
					}
	
					if(subtitle != null && head.children[1] != null && subtitle != head.children[1].innerHTML)
					{
						head.children[1].innerHTML = subtitle;
	
						head.children[1].style.opacity = 1;
					}

					head.style.opacity = 1;
	
					this.setContentMargin();
	
				}, head.style.opacity == 1 ? 200 : 0);
			}
			else
			{
				head.style.opacity = 1;
	
				this.setContentMargin();
			}
		}
	}

	setContentMargin()
	{
		var content = document.getElementById('content');

		if(content != null)
		{
			var style = window.getComputedStyle(document.getElementById('head-container'), null);

			content.style.marginTop = (Math.round(style.getPropertyValue('height').slice(0, -2)) + 84) + 'px';
		
			console.log('SET CONTENT MARGIN', (Math.round(style.getPropertyValue('height').slice(0, -2)) + 84) + 'px');
		}
	}

	hideHeader()
	{
		var head = document.getElementById('head-container');

		if(head != null)
		{
			head.style.opacity = 0;
		}

		var content = document.getElementById('content');

		if(content != null)
		{
			content.style.marginTop = '0px';
		}
	}
}

export let PageManager = new PageManagerModule();