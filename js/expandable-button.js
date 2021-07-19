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

				for(const i in this.buttons)
				{
					this.buttons[i].style.setProperty('transition', 'none', 'important');

					if(this.buttons[i].offsetHeight > 60)
					{
						//this.buttons[i].style.removeProperty('height');
						this.buttons[i].style.height = 'auto';
					}

					setTimeout(() => {

						this.buttons[i].style.height = this.buttons[i].offsetHeight;
						this.buttons[i].style.removeProperty('transition');

					}, 100);
				}
			}
		});
	}

	createExpandableButton(btn)
	{
		btn.onclick = () => {
			
			var height = btn.scrollHeight;

			if(height != btn.offsetHeight)
			{
				btn.style.height = height;

				for(var i = 0; i < btn.getElementsByClassName('expandable-hidden').length; i++)
				{
					btn.getElementsByClassName('expandable-hidden')[i].style.opacity = 1;
				}
			}
			else
			{
				btn.style.removeProperty('height');

				for(var i = 0; i < btn.getElementsByClassName('expandable-hidden').length; i++)
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