var buttons = [];

function createExpandableButton(btn)
{
    btn.onclick = function()
    {
        var height = btn.scrollHeight;

        if(height != btn.offsetHeight)
        {
            btn.style.height = height;
        }
        else
        {
            btn.style.removeProperty('height');
        }

        for(const i in buttons)
        {
            console.log(buttons[i].parentElement.id, this.parentElement.id);

            if(buttons[i] != this)
            {
                //buttons[i].style.removeProperty('height');
            }
        }

        console.log(btn.offsetHeight, btn.clientHeight, btn.scrollHeight);
    };

    buttons.push(btn);
}

export let Expandable = { createExpandableButton };