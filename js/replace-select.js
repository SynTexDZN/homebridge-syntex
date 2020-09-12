var selects = [], x = document.getElementsByClassName('custom-select');

for(var i = 0; i < x.length; i++)
{
    createSelectMenu(x[i]);
}

window.onclick(function()
{
    console.log('clicked anywhere');
});

function createSelectMenu(container)
{
    var j, a, b, c, selElmnt;

    selElmnt = container.getElementsByTagName("select")[0];

    container.setAttribute('id', 'select-' + selects.length);

    a = document.createElement("DIV");
    a.setAttribute("class", "select-selected");

    if(selElmnt.options[selElmnt.selectedIndex].hasAttribute('img'))
    {
        console.log(selElmnt.options[selElmnt.selectedIndex].getAttribute('img'));

        a.style.paddingLeft = '15px';
        a.innerHTML = '<img src="' + selElmnt.options[selElmnt.selectedIndex].getAttribute('img') + '">';
    }

    a.innerHTML += selElmnt.options[selElmnt.selectedIndex].innerHTML;

    a.setAttribute("name", selElmnt.getAttribute("name"));

    container.appendChild(a);
    /* For each element, create a new DIV that will contain the option list: */
    b = document.createElement("DIV");
    b.setAttribute("class", "select-items select-hide");
    
    for(j = 0; j < selElmnt.length; j++)
    {
        /* For each option in the original select element,
        create a new DIV that will act as an option item: */
        c = document.createElement("DIV");

        if(selElmnt.options[j].hasAttribute('img'))
        {
            c.style.paddingLeft = '15px';
            c.innerHTML = '<img src="' + selElmnt.options[j].getAttribute('img') + '">';
        }

        c.innerHTML += selElmnt.options[j].innerHTML;

        if(c.innerHTML == a.innerHTML)
        {
            c.className = "same-as-selected";
        }

        console.log('added click event');

        c.setAttribute('onclick', 'Replacer.selectMenuItem(this)');

        b.appendChild(c);
    }

    container.appendChild(b);

    a.onclick(function(event)
    {
        event.stopPropagation();
    });

    a.setAttribute('onclick', 'Replacer.openSelectMenu(this)');
    
    selects.push(container);

    return container;
}

function selectMenuItem(elmnt)
{
    /* When an item is clicked, update the original select box,
    and the selected item: */

    console.log('clicked!');

    var y, i, k, s, h;
    s = elmnt.parentNode.parentNode.getElementsByTagName("select")[0];
    h = elmnt.parentNode.previousSibling;

    console.log(s, h);

    for(i = 0; i < s.length; i++)
    {
        console.log(s.options[i].innerHTML, elmnt.innerHTML, s.options[i].innerHTML == elmnt.innerHTML);

        if(s.options[i].innerHTML == elmnt.innerHTML || (elmnt.innerHTML.includes('<img') && s.options[i].innerHTML == elmnt.innerHTML.split('>')[1]))
        {
            s.selectedIndex = i;
            h.innerHTML = elmnt.innerHTML;
            y = elmnt.parentNode.getElementsByClassName("same-as-selected");
            for (k = 0; k < y.length; k++)
            {
                y[k].removeAttribute("class");
            }
            elmnt.setAttribute("class", "same-as-selected");
            break;
        }
    }

    h.click();

    if(s.getAttribute("onchange") != null)
    {
        var functionName = s.getAttribute("onchange").split("()")[0];
        window[functionName]();
    }
}

function openSelectMenu(btn)
{
    btn.nextSibling.classList.toggle('select-hide');
    btn.classList.toggle('select-active');

    console.log('Open Select Menu');

    closeOtherSelectMenus(btn);
}

function closeOtherSelectMenus(elmnt)
{
    console.log('Close Menus', elmnt, selects);

    for(var i = 0; i < selects.length; i++)
    {
        console.log(selects[i].id, elmnt.parentElement.id, selects[i].id != elmnt.parentElement.id);

        if(selects[i].id != elmnt.parentElement.id)
        {
            document.getElementById(selects[i].id).getElementsByClassName('select-selected')[0].className = 'select-selected';
            document.getElementById(selects[i].id).getElementsByClassName('select-items')[0].className = 'select-items select-hide';
            
            //selects[i].getElementsByClassName('select-selected')[0].className = 'select-selected';
            //selects[i].getElementsByClassName('select-items')[0].className = 'select-items select-hide';

            //selects[i].getElementsByClassName('select-selected')[0].classList.remove('select-active');
            //selects[i].getElementsByClassName('select-items')[0].classList.add('select-hide');
        }
    }
}

export let Replacer = { createSelectMenu, openSelectMenu, selectMenuItem };