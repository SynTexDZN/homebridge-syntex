class PageBuilderModule
{
	constructor()
	{
		
	}

	createIconButton(options = {})
	{
		var element = document.createElement('button'),
			icon = document.createElement('div'),
			img = document.createElement('img'),
			text = document.createElement('div');

		element.className = 'icon-button center compact';
		element.type = 'button';

		if(options.align != null)
		{
			element.classList.add(options.align);
		}

		icon.className = 'button-icon';

		img.className = 'icon-inverted';
		img.src = options.src;

		text.className = 'button-text';
		text.innerHTML = options.text;

		icon.appendChild(img);

		element.appendChild(icon);
		element.appendChild(text);

		return element;
	}
}

export let PageBuilder = new PageBuilderModule();