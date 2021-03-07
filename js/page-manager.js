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

					head.classList.remove('hidden');

					head.style.maxHeight = head.scrollHeight + 'px';
	
					this.setContentMargin();
	
				}, head.classList.contains('hidden') ? 0 : 200);
			}
			else
			{
				head.classList.remove('hidden');

				head.style.maxHeight = head.scrollHeight + 'px';

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
			head.classList.add('hidden');
		}

		var content = document.getElementById('content');

		if(content != null)
		{
			content.style.marginTop = '0px';
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