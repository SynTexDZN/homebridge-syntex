class PageBuilderModule
{
	constructor()
	{
		
	}

	createSelect(options = {})
	{
		var element = document.createElement('div'),
			select = document.createElement('select');

		element.className = 'custom-select';

		if(options.name != null)
		{
			select.name = options.name;
		}

		if(options.options != null)
		{
			for(const i in options.options)
			{
				var option = document.createElement('option');

				option.innerHTML = options.options[i].text;

				if(options.options[i].selected)
				{
					option.selected = true;
				}

				for(const x in options.options[i])
				{
					if(x != 'text' && x != 'selected')
					{
						option.setAttribute(x, options.options[i][x]);
					}
				}

				select.appendChild(option);
			}
		}

		if(options.multiple)
		{
			select.setAttribute('multiple', '');
		}

		element.appendChild(select);

		window.Replacer.createSelectMenu(element, options);

		return element;
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