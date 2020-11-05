var loadFinished = false, scriptsFinished = false;

window.addEventListener('load', function ()
{
    loadFinished = true;
    
    removePreloader();
});

function finish()
{
    scriptsFinished = true;

    removePreloader();
}

function removePreloader()
{
    if(scriptsFinished && loadFinished)
    {
        document.getElementById('preloader').style.opacity = 0;
        document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.transition = '.2s';
        document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.opacity = 0;
        
        setTimeout(function()
        {
            document.getElementById('preloader').style.pointerEvents = 'none';
        }, 200);
    }
}

function expandWrapper(wrapper)
{
    var length = 0;

    for(var i = 0; i < wrapper.children.length; i++)
    {
        length += wrapper.children[i].offsetHeight;
    }

    wrapper.style.maxHeight = length + 1;
    wrapper.style.opacity = 1;

    setTimeout(() => { wrapper.style.maxHeight = 'none' }, 2000);
}

export let Preloader = { finish, expandWrapper };