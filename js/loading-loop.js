function searchLoop()
{
    var loop = document.getElementsByClassName('loading-loop');

    for(var i = 0; i < loop.length; i++)
    {
        if(loop[i].hasAttribute('value') && loop[i].value.substring(loop[i].value.length - 1) == ' .')
        {
            if((loop[i].value.match(/\./g) || []).length < 3)
            {
                loop[i].value += '.';
            }
            else
            {
                loop[i].value = loop[i].value.replace('...', '.');
            }
        }
        else if(loop[i].innerHTML.substring(loop[i].innerHTML.length - 1) == ' .')
        {
            if((loop[i].innerHTML.match(/\./g) || []).length < 3)
            {
                loop[i].innerHTML += '.';
            }
            else
            {
                loop[i].innerHTML = loop[i].innerHTML.replace('...', '.');
            }
        }
        else
        {
            console.error('Falsches Eingabeformat');
        }
    }

    setTimeout(function()
    {
        searchLoop();
    }, 1000);
}

setTimeout(function()
{
    searchLoop();
}, 1000);