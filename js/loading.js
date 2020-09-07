window.addEventListener('load', function ()
{
    document.getElementById('preloader').style.opacity = 0;
    document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.transition = '.2s';
    document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.opacity = 0;
    
    setTimeout(function()
    {
        document.getElementById('preloader').style.pointerEvents = 'none';
    }, 200);
});