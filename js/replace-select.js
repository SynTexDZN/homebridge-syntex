var selects = [];

class CustomSelect
{
	constructor()
	{
		var moved = false;

		window.addEventListener('mousedown', (event) => {

			moved = false;
			
		}, 'KEEP');

		window.addEventListener('mousemove', (event) => {

			moved = true;
			
		}, 'KEEP');

		window.addEventListener('mouseup', (event) => {

			if(!moved && !isChildOfSelect(event.target) && !event.target.classList.contains('same-as-selected'))
			{
				closeOtherSelectMenus(event.target);
			}
			
		}, 'KEEP');

		window.addEventListener('touchstart', (event) => {

			moved = false;

		}, 'KEEP');

		window.addEventListener('touchmove', (event) => {

			moved = true;

		}, 'KEEP');

		window.addEventListener('touchend', (event) => {

			if(!moved && !isChildOfSelect(event.target) && !event.target.classList.contains('same-as-selected'))
			{
				closeOtherSelectMenus(event.target);
			}

		}, 'KEEP');
	}

	SETUP()
	{
		var customSelects = document.getElementsByClassName('custom-select');

		for(var i = 0; i < customSelects.length; i++)
		{
			this.createSelectMenu(customSelects[i]);
		}
	}

	createSelectMenu(container, search)
	{
		var nativeSelect = container.getElementsByTagName('select')[0];

		container.setAttribute('id', 'select-' + selects.length);

		var searchElement = document.createElement('input');

		searchElement.setAttribute('class', 'select-search');
		searchElement.setAttribute('type', 'text');
		searchElement.setAttribute('placeholder', 'Suchen');
		searchElement.setAttribute('style', 'display: none');
		searchElement.setAttribute('oninput', 'Replacer.filterSelectMenu(this)');
		searchElement.setAttribute('value', nativeSelect.options[nativeSelect.selectedIndex].innerHTML);

		var selectedElement = document.createElement('div');

		selectedElement.setAttribute('class', 'select-selected');

		if(nativeSelect.options[nativeSelect.selectedIndex].hasAttribute('img'))
		{
			selectedElement.style.paddingLeft = '12px';
			selectedElement.innerHTML = '<img class="select-image" src="' + nativeSelect.options[nativeSelect.selectedIndex].getAttribute('img') + '">';
		}

		selectedElement.innerHTML += '<div class="select-text">' + nativeSelect.options[nativeSelect.selectedIndex].innerHTML + '</div>';

		selectedElement.setAttribute('name', nativeSelect.getAttribute('name'));

		if(search)
		{
			selectedElement.appendChild(searchElement);
		}

		container.appendChild(selectedElement);

		var selectItems = document.createElement('div');

		selectItems.setAttribute('class', 'select-items select-hide');
		
		for(var i = 0; i < nativeSelect.options.length; i++)
		{
			var selectItem = document.createElement('div');

			selectItem.setAttribute('class', 'select-item');
			selectItem.setAttribute('onclick', 'Replacer.selectMenuItem(this)');
			selectItem.setAttribute('counter', i);

			if(nativeSelect.options[i].hasAttribute('img'))
			{
				selectItem.style.paddingLeft = '15px';
				selectItem.innerHTML = '<img class="select-image" src="' + nativeSelect.options[i].getAttribute('img') + '">';
			}

			selectItem.innerHTML += '<div class="select-text">' + nativeSelect.options[i].innerHTML + '</div>';

			if(selectItem.innerHTML.split('</div>')[0] == selectedElement.innerHTML.split('</div>')[0])
			{
				selectItem.classList.add('same-as-selected');
			}

			selectItems.appendChild(selectItem);
		}

		container.appendChild(selectItems);

		selectedElement.setAttribute('onclick', 'Replacer.openSelectMenu(this)');
		
		selects.push(container);

		return container;
	}

	openSelectMenu(btn)
	{
		var select = btn.parentElement,
			selectedItems = select.getElementsByClassName('select-items')[0],
			selectedItem = selectedItems.getElementsByClassName('same-as-selected')[0].getElementsByClassName('select-text')[0];

		var searchElement = btn.getElementsByClassName('select-search')[0],
			selectText = btn.getElementsByClassName('select-text')[0];

		var selectItems = btn.parentElement.getElementsByClassName('select-item');

		btn.nextSibling.classList.toggle('select-hide');
		btn.classList.toggle('select-active');

		if(document.getElementById('content').getBoundingClientRect().bottom - selectedItems.getBoundingClientRect().bottom > 0)
		{
			select.classList.remove('on-top');
		}
		else
		{
			select.classList.add('on-top');
		}

		if(searchElement != null)
		{
			if(btn.classList.contains('select-active'))
			{
				searchElement.style.display = '';
				searchElement.value = selectText.innerHTML;
				
				searchElement.setSelectionRange(0, searchElement.value.length);
				searchElement.focus();

				for(var i = 0; i < selectItems.length; i++)
				{
					selectItems[i].style.display = '';
				}

				selectText.innerHTML = '';

				Essentials.scrollParentToChild(btn.parentElement.getElementsByClassName('same-as-selected')[0].parentElement, btn.parentElement.getElementsByClassName('same-as-selected')[0]);
			}
			else
			{
				selectText.innerHTML = selectedItem.innerHTML;

				searchElement.style.display = 'none';
			}
		}

		closeOtherSelectMenus(btn);
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
		if(!element.classList.contains('same-as-selected'))
		{
			var y, i, k, s, h;
			
			s = element.parentNode.parentNode.getElementsByTagName('select')[0];
			h = element.parentNode.previousSibling;

			for(i = 0; i < s.length; i++)
			{
				if(element.getAttribute('counter') == i)
				{
					h.getElementsByClassName('select-text')[0].innerHTML = element.getElementsByClassName('select-text')[0].innerHTML;

					if(element.getElementsByClassName('select-image')[0] != null && h.getElementsByClassName('select-image')[0] != null)
					{
						h.getElementsByClassName('select-image')[0].src = element.getElementsByClassName('select-image')[0].src;
					}

					y = element.parentNode.getElementsByClassName('same-as-selected');

					for(k = 0; k < y.length; k++)
					{
						y[k].classList.remove('same-as-selected');
					}

					element.classList.add('same-as-selected');

					s.selectedIndex = i;

					break;
				}
			}

			h.click();

			if(s.getAttribute('onchange') != null)
			{
				var functionName = s.getAttribute('onchange').split('(')[0];
				var params = s.getAttribute('onchange').split('(')[1].split(')')[0].split(', ');
				var args = [];

				for(const i in params)
				{
					if(params[i] == 'this')
					{
						args[i] = element.parentElement.parentElement;
					}
					else
					{
						args[i] = eval(params[i]);
					}
				}

				window[functionName](...args);
			}
		}
	}

	filterSelectMenu(search)
	{
		var selectItems = search.parentElement.parentElement.getElementsByClassName('select-item');

		for(var i = 0; i < selectItems.length; i++)
		{
			var selectText = selectItems[i].getElementsByClassName('select-text')[0];

			if(!selectText.innerHTML.toLowerCase().includes(search.value.toLowerCase()) && search.value != null)
			{
				selectItems[i].style.display = 'none';
			}
			else
			{
				selectItems[i].style.display = '';
			}
		}
	}

	getSelect(select)
	{
		var obj = { items : [] };

		var selectItems = select.getElementsByClassName('select-items')[0].children;
		var selectedItem = select.getElementsByClassName('select-selected')[0],
			selectedItemText = selectedItem.getElementsByClassName('select-text')[0],
			selectedItemImage = selectedItem.getElementsByClassName('select-image')[0];

		for(var i = 0; i < selectItems.length; i++)
		{
			var item = { element : selectItems[i], text : selectItems[i].getElementsByClassName('select-text')[0].innerHTML }

			if(selectItems[i].getElementsByClassName('select-image')[0] != null)
			{
				item.image = selectItems[i].getElementsByClassName('select-image')[0].src;
			}

			obj.items.push(item);
		}

		obj.updateSelected = (index) => {

			select.getElementsByTagName('select')[0].selectedIndex = index;

			selectedItemText.innerHTML = obj.items[index].text;
			
			if(selectedItemImage != null)
			{
				selectedItemImage.src = obj.items[index].image;
			}

			for(const i in obj.items)
			{
				if(i == index)
				{
					obj.items[i].element.classList.add('same-as-selected');
				}
				else
				{
					obj.items[i].element.classList.remove('same-as-selected');
				}
			}
		};

		var selected = { index : select.getElementsByTagName('select')[0].selectedIndex, display : selectedItem };

		selected.element = selectItems[selected.index];

		selected.text = selectItems[selected.index].getElementsByClassName('select-text')[0].innerHTML;

		if(selectItems[selected.index].getElementsByClassName('select-image')[0] != null)
		{
			selected.image = selectItems[selected.index].getElementsByClassName('select-image')[0].src;
		}

		obj.selected = selected;

		return obj;
	}
}

function closeOtherSelectMenus(element)
{
	for(var i = 0; i < selects.length; i++)
	{
		if((element.parentElement == null || selects[i].id != element.parentElement.id) && document.getElementById(selects[i].id) != null)
		{
			var select = document.getElementById(selects[i].id),
				selectedItems = select.getElementsByClassName('select-items')[0],
				selectedItem = selectedItems.getElementsByClassName('same-as-selected')[0].getElementsByClassName('select-text')[0],
				selectedElement = select.getElementsByClassName('select-selected')[0];

			selectedElement.getElementsByClassName('select-text')[0].innerHTML = selectedItem.innerHTML;

			selectedElement.className = 'select-selected';
			selectedItems.className = 'select-items select-hide';
		
			if(selectedElement.children[2] != null)
			{
				selectedElement.children[2].style.display = 'none';
			}
		}
	}
}

function isChildOfSelect(child)
{
	var node = child.parentNode;

	while(node != null)
	{
		if(node.classList != null && node.classList.contains('custom-select'))
		{
			return true;
		}

		node = node.parentNode;
	}

	return false;
}

export let Replacer = new CustomSelect();