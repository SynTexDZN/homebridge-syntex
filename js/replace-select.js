var selects = [], x = document.getElementsByClassName('custom-select');

for(var i = 0; i < x.length; i++)
{
    createSelectMenu(x[i]);
}

function createSelectMenu(container)
{
    var j, a, b, c, selElmnt;

    selElmnt = container.getElementsByTagName("select")[0];

    a = document.createElement("DIV");
    a.setAttribute("class", "select-selected");

    if(selElmnt.options[selElmnt.selectedIndex].hasAttribute('img'))
    {
        console.log(selElmnt.options[selElmnt.selectedIndex].getAttribute('img'));

        a.style.paddingLeft = '12px';
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

        c.addEventListener("click", function(e)
        {
            /* When an item is clicked, update the original select box,
            and the selected item: */

            console.log('clicked!');

            var y, i, k, s, h;
            s = this.parentNode.parentNode.getElementsByTagName("select")[0];
            h = this.parentNode.previousSibling;

            for(i = 0; i < s.length; i++)
            {
                console.log(s.options[i].innerHTML, this.innerHTML, s.options[i].innerHTML == this.innerHTML);

                if(s.options[i].innerHTML == this.innerHTML || (this.innerHTML.includes('<img') && s.options[i].innerHTML == this.innerHTML.split('>')[1]))
                {
                    s.selectedIndex = i;
                    h.innerHTML = this.innerHTML;
                    y = this.parentNode.getElementsByClassName("same-as-selected");
                    for (k = 0; k < y.length; k++)
                    {
                        y[k].removeAttribute("class");
                    }
                    this.setAttribute("class", "same-as-selected");
                    break;
                }
            }

            h.click();

            if(s.getAttribute("onchange") != null)
            {
                var functionName = s.getAttribute("onchange").split("()")[0];
                window[functionName]();
            }
        });
        b.appendChild(c);
    }

    container.appendChild(b);

    a.setAttribute('onclick', 'Replacer.openSelectMenu(this)');
    
    selects.push(container);

    return container;
}

function openSelectMenu(btn)
{
    btn.nextSibling.classList.toggle('select-hide');
    btn.classList.toggle('select-active');

    closeOtherSelectMenus(btn);
}

function closeOtherSelectMenus(elmnt)
{
    for(var i = 0; i < selects.length; i++)
    {
        if(selects[i] != elmnt.parentElement)
        {
            selects[i].getElementsByClassName('select-selected')[0].classList.remove('select-active');
            selects[i].getElementsByClassName('select-items')[0].classList.add('select-hide');
        }
    }
}

export let Replacer = { createSelectMenu, openSelectMenu };