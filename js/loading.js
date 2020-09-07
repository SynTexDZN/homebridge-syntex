window.addEventListener("load", function ()
{
    document.getElementById("preloader").setAttribute("style", "opacity: 0");
    
    setTimeout(function()
    {
        //document.getElementById("preloader").parentElement.removeChild(document.getElementById("preloader"));
        document.getElementById("preloader").style.pointerEvents = none;
    }, 300);
});