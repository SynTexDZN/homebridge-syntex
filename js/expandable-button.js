var buttons = [];
var lastWidth = document.getElementsByTagName('body')[0].offsetWidth;

document.getElementsByTagName('body')[0].onresize = function()
{
	var width = document.getElementsByTagName('body')[0].offsetWidth;

	if(lastWidth < 1151 && width > 1151 || lastWidth > 1151 && width < 1151)
	{
		lastWidth = width;

		for(const i in buttons)
		{
			buttons[i].style.transition = 'none';

			if(buttons[i].offsetHeight > 60)
			{
				buttons[i].style.removeProperty('height');
			}

			setTimeout(() => {

				buttons[i].style.transition = '.3s ease-in-out height';

			}, 100);
		}
	}
}

function createExpandableButton(btn)
{
	btn.onclick = function()
	{
		var height = btn.scrollHeight;

		if(height != btn.offsetHeight)
		{
			btn.style.height = height;

			for(var i = 0; i < btn.children[0].children.length; i++)
			{
				btn.children[0].children[i].style.opacity = 1;
			}
		}
		else
		{
			btn.style.removeProperty('height');

			for(var i = 0; i < btn.children[0].children.length; i++)
			{
				btn.children[0].children[i].style.opacity = 0;
			}
		}
		/*
		for(const i in buttons)
		{
			console.log(buttons[i].parentElement.id, this.parentElement.id);

			if(buttons[i] != this)
			{
				buttons[i].style.removeProperty('height');
			}
		}

		console.log(btn.offsetHeight, btn.clientHeight, btn.scrollHeight);
		*/
	};

	buttons.push(btn);
}

export let Expandable = { createExpandableButton };