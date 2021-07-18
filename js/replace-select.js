var selects = [];

class CustomSelect
{
	constructor()
	{
		window.addEventListener('click', (event) => {

			if(!isChildOfSelect(event.target) && !event.target.classList.contains('same-as-selected'))
			{
				closeOtherSelectMenus(event.target);
			}
			
		}, 'KEEP');

		window.addEventListener('touchstart', (event) => {

			if(!isChildOfSelect(event.target) && !event.target.classList.contains('same-as-selected'))
			{
				closeOtherSelectMenus(event.target);
			}

		}, 'KEEP');
	}

	SETUP()
	{
		var x = document.getElementsByClassName('custom-select');

		for(var i = 0; i < x.length; i++)
		{
			this.createSelectMenu(x[i]);
		}
	}

	createSelectMenu(container)
	{
		var j, a, b, c, selElmnt;

		selElmnt = container.getElementsByTagName('select')[0];

		container.setAttribute('id', 'select-' + selects.length);

		a = document.createElement('div');
		a.setAttribute('class', 'select-selected');

		if(selElmnt.options[selElmnt.selectedIndex].hasAttribute('img'))
		{
			a.style.paddingLeft = '15px';
			a.innerHTML = '<img src="' + selElmnt.options[selElmnt.selectedIndex].getAttribute('img') + '">';
		}

		a.innerHTML += selElmnt.options[selElmnt.selectedIndex].innerHTML;

		a.setAttribute('name', selElmnt.getAttribute('name'));

		container.appendChild(a);
		/* For each element, create a new DIV that will contain the option list: */
		b = document.createElement('div');
		b.setAttribute('class', 'select-items select-hide');
		
		for(j = 0; j < selElmnt.length; j++)
		{
			/* For each option in the original select element,
			create a new DIV that will act as an option item: */
			c = document.createElement('div');

			if(selElmnt.options[j].hasAttribute('img'))
			{
				c.style.paddingLeft = '15px';
				c.innerHTML = '<img src="' + selElmnt.options[j].getAttribute('img') + '">';
			}

			c.innerHTML += selElmnt.options[j].innerHTML;

			if(c.innerHTML == a.innerHTML)
			{
				c.className = 'same-as-selected';
			}

			c.setAttribute('counter', j);
			c.setAttribute('onclick', 'Replacer.selectMenuItem(this)');

			b.appendChild(c);
		}

		container.appendChild(b);

		a.setAttribute('onclick', 'Replacer.openSelectMenu(this)');
		
		selects.push(container);

		return container;
	}

	openSelectMenu(btn)
	{
		btn.nextSibling.classList.toggle('select-hide');
		btn.classList.toggle('select-active');

		closeOtherSelectMenus(btn);
	}

	selectMenuItem(elmnt)
	{
		if(!elmnt.classList.contains('same-as-selected'))
		{
			var y, i, k, s, h;
			
			s = elmnt.parentNode.parentNode.getElementsByTagName('select')[0];
			h = elmnt.parentNode.previousSibling;

			for(i = 0; i < s.length; i++)
			{
				if(elmnt.getAttribute('counter') == i)
				{
					s.selectedIndex = i;
					h.innerHTML = elmnt.innerHTML;
					y = elmnt.parentNode.getElementsByClassName('same-as-selected');

					for (k = 0; k < y.length; k++)
					{
						y[k].removeAttribute('class');
					}

					elmnt.setAttribute('class', 'same-as-selected');

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
						args[i] = elmnt.parentElement.parentElement;
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
}

function closeOtherSelectMenus(elmnt)
{
	for(var i = 0; i < selects.length; i++)
	{
		if((elmnt.parentElement == null || selects[i].id != elmnt.parentElement.id) && document.getElementById(selects[i].id) != null)
		{
			document.getElementById(selects[i].id).getElementsByClassName('select-selected')[0].className = 'select-selected';
			document.getElementById(selects[i].id).getElementsByClassName('select-items')[0].className = 'select-items select-hide';
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