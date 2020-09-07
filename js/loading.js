window.addEventListener('load', function ()
{
    document.getElementById('preloader').style.opacity = 0;
    
    setTimeout(function()
    {
        //document.getElementById("preloader").parentElement.removeChild(document.getElementById("preloader"));
        
        document.getElementById('preloader').style.pointerEvents = 'none';
        document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.opacity = 0;
    }, 200);
});