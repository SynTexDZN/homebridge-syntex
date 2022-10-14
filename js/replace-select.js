var selects = [];

class CustomSelect
{
	constructor()
	{
		var moved = false;

		window.addEventListener('mousedown', () => {

			moved = false;
			
		}, 'KEEP');

		window.addEventListener('mousemove', () => {

			moved = true;
			
		}, 'KEEP');

		window.addEventListener('mouseup', (event) => {

			if(!moved && !isChildOfSelect(event.target) && !event.target.classList.contains('same-as-selected'))
			{
				closeOtherSelectMenus(event.target);
			}
			
		}, 'KEEP');

		window.addEventListener('touchstart', () => {

			moved = false;

		}, 'KEEP');

		window.addEventListener('touchmove', () => {

			moved = true;

		}, 'KEEP');

		window.addEventListener('touchend', (event) => {

			if(!moved && !isChildOfSelect(event.target) && !event.target.classList.contains('same-as-selected'))
			{
				closeOtherSelectMenus(event.target);
			}

		}, 'KEEP');

		this.lastWidth = document.getElementsByTagName('body')[0].offsetWidth;

		window.addEventListener('resize', () => {

			var width = document.getElementsByTagName('body')[0].offsetWidth;

			if(this.lastWidth < 1151 && width > 1151 || this.lastWidth > 1151 && width < 1151)
			{
				this.lastWidth = width;

				setTimeout(() => {
					
					for(const select of selects)
					{
						var element = document.getElementById(select.id);

						if(element != null)
						{
							this._checkDirection(element);
							this._checkOversized(element);
						}
					}

				}, 1000);
			}
		});
	}

	SETUP()
	{
		var customSelects = document.getElementsByClassName('custom-select');

		for(var i = 0; i < customSelects.length; i++)
		{
			this.createSelectMenu(customSelects[i]);
		}
	}

	createSelectMenu(container, options = {})
	{
		var select = container.getElementsByTagName('select')[0],
			selectSelected = document.createElement('div'),
			selectImage = document.createElement('img'),
			selectText = document.createElement('div'),
			selectItems = document.createElement('div');

		container.id = 'select-' + selects.length;
		
		container.classList.add('on-top');

		if(options.onchange != null)
		{
			select.onchange = options.onchange;
		}

		if(options.multiple)
		{
			select.selectedItems = [];
		}

		selectSelected.className = 'select-selected';

		selectSelected.setAttribute('name', select.getAttribute('name'));

		selectSelected.onclick = () => Replacer.openSelectMenu(selectSelected);

		selectImage.className = 'select-image hidden';

		if(select.options[select.selectedIndex].hasAttribute('img'))
		{
			selectImage.classList.remove('hidden');
			
			selectImage.src = select.options[select.selectedIndex].getAttribute('img');
		
			selectSelected.style.paddingLeft = '12px';
		}

		selectText.className = 'select-text';
		selectText.innerHTML = select.options[select.selectedIndex].innerHTML;

		selectSelected.appendChild(selectImage);
		selectSelected.appendChild(selectText);

		if(options.search)
		{
			var selectSearch = document.createElement('input');

			selectSearch.className = 'select-search';

			selectSearch.setAttribute('value', select.options[select.selectedIndex].innerHTML);
			selectSearch.setAttribute('type', 'text');
			selectSearch.setAttribute('placeholder', '%general.search%');

			selectSearch.oninput = () => Replacer.filterSelectMenu(selectSearch);

			selectSearch.style.display = 'none';

			selectSelected.appendChild(selectSearch);
		}

		selectItems.className = 'select-items select-hide';

		for(var i = 0; i < select.options.length; i++)
		{
			var selectItem = document.createElement('div'),
				optionImage = document.createElement('img'),
				optionText = document.createElement('div');

			selectItem.className = 'select-item';

			if(select.options[i].hasAttribute('hidden'))
			{
				selectItem.classList.add('hidden');
			}

			if(select.options[i].selected)
			{
				selectItem.classList.add('same-as-selected');
			}

			selectItem.setAttribute('counter', i);
			selectItem.setAttribute('onclick', 'Replacer.selectMenuItem(this)');

			optionImage.className = 'select-image';

			if(select.options[i].hasAttribute('img'))
			{
				optionImage.classList.remove('hidden');

				optionImage.src = select.options[i].getAttribute('img');
				
				selectItem.style.paddingLeft = '15px';
			}

			optionText.className = 'select-text';
			optionText.innerHTML = select.options[i].innerHTML;

			selectItem.appendChild(optionImage);
			selectItem.appendChild(optionText);

			selectItems.appendChild(selectItem);
		}

		container.appendChild(selectSelected);
		container.appendChild(selectItems);

		selects.push(container);

		setTimeout(() => {

			this._checkDirection(document.getElementById(container.id));
			this._checkOversized(document.getElementById(container.id));

		}, 0);

		return container;
	}

	openSelectMenu(selectSelected)
	{
		var container = selectSelected.parentElement,
			selectItems = container.getElementsByClassName('select-items')[0],
			selectedItem = selectItems.getElementsByClassName('same-as-selected')[0],
			selectSearch = selectSelected.getElementsByClassName('select-search')[0],
			selectText = selectSelected.getElementsByClassName('select-text')[0];

		selectSelected.classList.toggle('select-active');

		selectItems.classList.toggle('select-hide');

		if(selectSelected.classList.contains('select-active'))
		{
			selectItems.style.removeProperty('max-height');

			if(selectSearch != null)
			{
				selectSearch.style.removeProperty('display');
				selectSearch.value = selectText.innerHTML;
				
				selectSearch.setSelectionRange(0, selectSearch.value.length);
				selectSearch.focus();

				for(var i = 0; i < selectItems.children.length; i++)
				{
					selectItems.children[i].style.removeProperty('display');
				}

				selectText.innerHTML = '';
			}

			window.Essentials.scrollParentToChild(selectItems, selectedItem);

			this._checkDirection(container);
			this._checkOversized(container);
		}
		else if(selectSearch != null)
		{
			selectText.innerHTML = selectedItem.getElementsByClassName('select-text')[0].innerHTML;

			selectSearch.style.display = 'none';
		}

		closeOtherSelectMenus(selectSelected);
	}
	/*
	setMenuDimensions(select, selectedItems)
	{
		var isMobile = document.getElementsByTagName('body')[0].offsetWidth < 1151;

		if(select.getBoundingClientRect().y < window.innerHeight / 2 + 5)
		{
			var height = Math.min(window.innerHeight - select.getBoundingClientRect().y, 800);

			if(isMobile)
			{
				height -= 201;
			}
			else
			{
				height -= 70;
			}

			select.classList.remove('on-top');

			selectedItems.style.maxHeight = height + 'px';
		}
		else
		{
			var height = Math.min(select.getBoundingClientRect().y, 800);

			if(isMobile)
			{
				height -= 210;
			}
			else
			{
				height -= 20;
			}

			select.classList.add('on-top');

			selectedItems.style.maxHeight = height + 'px';
		}
	}
	*/
	selectMenuItem(element)
	{
		var container = element.parentElement.parentElement,
			select = container.getElementsByTagName('select')[0],
			selectSelected = container.getElementsByClassName('select-selected')[0],
			selectItems = container.getElementsByClassName('select-items')[0];

		if(!element.classList.contains('same-as-selected') || select.hasAttribute('multiple'))
		{
			select.selectedIndex = parseInt(element.getAttribute('counter'));

			if(!select.hasAttribute('multiple'))
			{
				for(var i = 0; i < selectItems.children.length; i++)
				{
					selectItems.children[i].classList.remove('same-as-selected');
				}
			}

			element.classList.toggle('same-as-selected');

			if(select.hasAttribute('multiple'))
			{
				var value = null;

				try
				{
					value = JSON.parse(select.options[element.getAttribute('counter')].value);
				}
				catch(e)
				{
					value = select.options[element.getAttribute('counter')].value;
				}

				if(!select.selectedItems.includes(value) && element.classList.contains('same-as-selected'))
				{
					select.selectedItems.push(value);
				}
				else if(select.selectedItems.includes(value) && !element.classList.contains('same-as-selected'))
				{
					select.selectedItems.splice(select.selectedItems.indexOf(value), 1);
				}
			}
			else
			{
				selectSelected.click();
			}

			var result = getSelectionCount(container);

			selectSelected.getElementsByClassName('select-text')[0].innerHTML = result.text;

			if(selectSelected.getElementsByClassName('select-image')[0] != null && result.icon != null)
			{
				selectSelected.getElementsByClassName('select-image')[0].src = result.icon;
			}

			if(select.onchange != null)
			{
				select.onchange();
			}
		}
	}

	filterSelectMenu(search)
	{
		var container = search.parentElement.parentElement,
			select = container.getElementsByTagName('select')[0],
			selectItems = container.getElementsByClassName('select-items')[0];

		for(var i = 0; i < selectItems.children.length; i++)
		{
			var selectText = selectItems.children[i].getElementsByClassName('select-text')[0],
				selectOption = select.getElementsByTagName('option')[i];

			if(search.value != null && !selectText.innerHTML.toLowerCase().includes(search.value.toLowerCase()) && selectOption != null && selectOption.id != null && !selectOption.id.toLowerCase().includes(search.value.toLowerCase()))
			{
				selectItems.children[i].style.display = 'none';
			}
			else
			{
				selectItems.children[i].style.removeProperty('display');
			}
		}
	}

	getSelect(container)
	{
		var obj = { items : [] };

		var select = container.getElementsByTagName('select')[0],
			selectItems = container.getElementsByClassName('select-items')[0],
			selectSelected = container.getElementsByClassName('select-selected')[0],
			selectText = selectSelected.getElementsByClassName('select-text')[0],
			selectImage = selectSelected.getElementsByClassName('select-image')[0];

		for(var i = 0; i < selectItems.children.length; i++)
		{
			var item = {
				element : selectItems.children[i],
				text : selectItems.children[i].getElementsByClassName('select-text')[0].innerHTML
			};

			if(selectItems.children[i].getElementsByClassName('select-image')[0] != null)
			{
				item.image = selectItems.children[i].getElementsByClassName('select-image')[0].src;
			}

			obj.items.push(item);
		}

		obj.updateSelected = (index) => {

			if(index != null)
			{
				select.selectedIndex = index;

				if(select.hasAttribute('multiple'))
				{
					var value = null;

					try
					{
						value = JSON.parse(select.options[index].value);
					}
					catch(e)
					{
						value = select.options[index].value;
					}

					if(!select.selectedItems.includes(value))
					{
						select.selectedItems.push(value);
					}
				}

				for(const i in obj.items)
				{
					if(i == index)
					{
						obj.items[i].element.classList.add('same-as-selected');
					}
					else if(!select.hasAttribute('multiple'))
					{
						obj.items[i].element.classList.remove('same-as-selected');
					}
				}
			}

			var result = getSelectionCount(container);

			selectText.innerHTML = result.text;

			if(selectImage != null && result.icon != null)
			{
				selectImage.src = result.icon;
			}
		};

		obj.updateOption = (index, text) => {

			if(obj.items[index] != null)
			{
				obj.items[index].text = text;

				obj.items[index].element.getElementsByClassName('select-text')[0].innerHTML = text;
			}
		};

		var selected = {
			index : select.selectedIndex,
			display : selectSelected
		};

		selected.element = selectItems.children[selected.index];
		selected.option = select.children[selected.index];

		selected.text = selectItems.children[selected.index].getElementsByClassName('select-text')[0].innerHTML;

		if(selectItems.children[selected.index].getElementsByClassName('select-image')[0] != null)
		{
			selected.image = selectItems.children[selected.index].getElementsByClassName('select-image')[0].src;
		}

		obj.selected = selected;

		return obj;
	}

	refreshPositions()
	{
		for(const select of selects)
		{
			var element = document.getElementById(select.id);

			if(element != null)
			{
				this._checkDirection(element);
				this._checkOversized(element);
			}
		}
	}

	_checkDirection(select)
	{
		var selectItems = select.getElementsByClassName('select-items')[0],
			selectSelected = select.getElementsByClassName('select-selected')[0];

		var direction = select.classList.contains('on-top') ? 'bottom' : 'top', style = getComputedStyle(selectItems);

		if(style != null && style[direction] != null)
		{
			try
			{
				var gap = parseInt(style[direction]);

				if(document.getElementById('content').getBoundingClientRect().bottom - selectSelected.getBoundingClientRect().top - selectItems.getBoundingClientRect().height - gap < 0)
				{
					select.classList.add('on-top');

					return true;
				}
			}
			catch(e)
			{
				console.error(e);
			}

			select.classList.remove('on-top');

			return false;
		}
	}

	_checkOversized(select)
	{
		var selectItems = select.getElementsByClassName('select-items')[0];

		if(document.getElementById('content').getBoundingClientRect().top - selectItems.getBoundingClientRect().top > 0)
		{
			select.classList.remove('on-top');

			selectItems.style.maxHeight = document.getElementById('footer-content').getBoundingClientRect().bottom - selectItems.getBoundingClientRect().top;

			return true;
		}

		return false;
	}
}

function closeOtherSelectMenus(element)
{
	for(const select of selects)
	{
		if((element.parentElement == null || select.id != element.parentElement.id) && document.getElementById(select.id) != null)
		{
			var container = document.getElementById(select.id),
				selectItems = container.getElementsByClassName('select-items')[0],
				selectSelected = container.getElementsByClassName('select-selected')[0],
				selectSearch = selectSelected.getElementsByClassName('select-search')[0];

			selectItems.classList.add('select-hide');

			selectSelected.classList.remove('select-active');
		
			if(selectSearch != null)
			{
				selectSearch.style.display = 'none';
			}

			var result = getSelectionCount(container);

			selectSelected.getElementsByClassName('select-text')[0].innerHTML = result.text;

			if(selectSelected.getElementsByClassName('select-image')[0] != null && result.icon != null)
			{
				selectSelected.getElementsByClassName('select-image')[0].src = result.icon;
			}
		}
	}
}

function getSelectionCount(container)
{
	var select = container.getElementsByTagName('select')[0],
		selectItems = container.getElementsByClassName('select-items')[0],
		selectedItems = selectItems.getElementsByClassName('same-as-selected'),
		selectedItem = selectedItems[0], counter = 0;

	var obj = {
		text : selectedItem.getElementsByClassName('select-text')[0].innerHTML
	};

	if(selectedItem.getElementsByClassName('select-image')[0] != null)
	{
		obj.icon = selectedItem.getElementsByClassName('select-image')[0].src;
	}

	for(var i = 0; i < selectedItems.length; i++)
	{
		if(!selectedItems[i].classList.contains('hidden'))
		{
			counter++;
		}
	}

	if(select.hasAttribute('multiple') && counter > 0)
	{
		obj.text = '(' + counter + ') %general.chosen%';
	}

	return obj;
}

function isChildOfSelect(child)
{
	var node = child.parentElement;

	while(node != null)
	{
		if(node.classList != null && node.classList.contains('custom-select'))
		{
			return true;
		}

		node = node.parentElement;
	}

	return false;
}

export let Replacer = new CustomSelect();