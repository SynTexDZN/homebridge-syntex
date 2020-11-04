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

export let Preloader = { finish };