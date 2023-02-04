class ExpandableButton
{
	constructor()
	{
		this.buttons = [];
		this.lastWidth = document.getElementsByTagName('body')[0].offsetWidth;

		window.addEventListener('resize', () => {

			var width = document.getElementsByTagName('body')[0].offsetWidth;

			if(this.lastWidth < 1151 && width > 1151 || this.lastWidth > 1151 && width < 1151)
			{
				this.lastWidth = width;

				this.resizeButtons();
			}
		});
	}

	resizeButtons()
	{
		for(const i in this.buttons)
		{
			this.buttons[i].style.setProperty('transition', 'none', 'important');

			if(!this.buttons[i].opened)
			{
				this.buttons[i].style.removeProperty('height');
			}
			else
			{
				var padding = parseInt(this.buttons[i].style.paddingTop || getComputedStyle(this.buttons[i]).paddingTop) + parseInt(this.buttons[i].style.paddingBottom || getComputedStyle(this.buttons[i]).paddingBottom);

				this.buttons[i].style.height = this.buttons[i].children[0].offsetHeight + padding;
			}

			setTimeout(() => {

				this.buttons[i].style.removeProperty('transition');

			}, 100);
		}
	}

	createExpandableButton(btn)
	{
		btn.opened = false;

		btn.onclick = () => {
			
			var height = btn.scrollHeight;

			if(height != btn.offsetHeight)
			{
				btn.style.height = height;

				btn.opened = true;

				for(let i = 0; i < btn.getElementsByClassName('expandable-hidden').length; i++)
				{
					btn.getElementsByClassName('expandable-hidden')[i].style.opacity = 1;
				}
			}
			else
			{
				btn.style.removeProperty('height');

				btn.opened = false;

				for(let i = 0; i < btn.getElementsByClassName('expandable-hidden').length; i++)
				{
					btn.getElementsByClassName('expandable-hidden')[i].style.opacity = 0;
				}
			}
			/*
			for(const i in this.buttons)
			{
				if(this.buttons[i] != this)
				{
					this.buttons[i].style.removeProperty('height');
				}
			}
			*/
		};

		this.buttons.push(btn);
	}
}

export let Expandable = new ExpandableButton();