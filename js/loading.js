window.addEventListener("load", function ()
{
    document.getElementById("preloader").setAttribute("style", "opacity: 0");
    
    setTimeout(function()
    {
        document.getElementById("preloader").parentElement.removeChild(document.getElementById("preloader"));
    }, 300);
});
/*
var preloader = document.createElement('DIV');
var loading = document.createElement('DIV');
var animation = document.createElement('SPAN');

preloader.setAttribute('id', 'preloader');
loading.setAttribute('class', 'loader-4');

loading.appendChild(animation);
preloader.appendChild(loading);

document.getElementsByTagName("html")[0].appendChild(preloader);
log('NOW 2');
*/
