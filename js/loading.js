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

        console.log(wrapper.children[i].offsetHeight, Math.ceil(wrapper.children[i].offsetHeight));
    }

    console.log(length, Math.ceil(length));

    wrapper.style.maxHeight = Math.ceil(length);
    wrapper.style.opacity = 1;

    setTimeout(() => { wrapper.style.maxHeight = 'none'; console.log(wrapper.children[i].offsetHeight) }, 2000);
}

export let Preloader = { finish, expandWrapper };