function versionCount(version)
{
    if(version.includes('-'))
    {
        var intVersion = -1;
    }
    else
    {
        var intVersion = 0;
    }

    for(var i = 0; i < (version.match(/\./g) || []).length + 1; i++)
    {
        if(version.includes('-'))
        {
            intVersion += version.split('-')[0].split('.')[i] * Math.pow(100, (version.match(/\./g) || []).length - i);
        }
        else
        {
            intVersion += version.split('.')[i] * Math.pow(100, (version.match(/\./g) || []).length - i);
        }
    }

    return intVersion;
}

function checkRestart()
{
    return new Promise(resolve => {

        fetchURL('/check-restart', 3000).then(function(res) {

            console.log(res);

            if(res != null && res == 'false')
            {
                resolve(true);
            }
            else
            {
                setTimeout(function()
                {
                    resolve(checkRestart());
                }, 500);
            }
        });
    });
}

function createOverlay(level, id, value, color)
{
    var overlay = document.createElement('input');

    console.log('CREATE OVERLAY PROZESS');

    overlay.setAttribute('type', 'button');
    overlay.setAttribute('style', 'z-index: ' + level);
    overlay.setAttribute('id', id);
    overlay.setAttribute('value', value);
    overlay.setAttribute('class', 'overlay gradient-' + color + ' loading-loop');

    return overlay;
}

function createPendingOverlay(id, value)
{
    return createOverlay(1, id, value, 'blue');
}

function createSuccessOverlay(id, value)
{
    return createOverlay(2, id, value, 'green');
}

function createErrorOverlay(id, value)
{
    return createOverlay(2, id, value, 'red');
}

function showOverlay(btn, overlay)
{
    /*
    var otherOverlays = btn.getElementsByClassName('overlay');
    
    if(btn.previousElementSibling.getAttribute('class') != 'overlay-container')
    {
        var overlayContainer = document.createElement('div');

        btn.parentElement.insertBefore(overlayContainer, btn);
        overlayContainer.appendChild(overlay);
    }
    else
    {
        btn.previousElementSibling.appendChild(overlay);
    }
    */
    console.log(overlay);
    console.log(btn);
    btn.parentElement.insertBefore(overlay, btn);

    setTimeout(function()
    {
        btn.style.opacity = 0;
        /*
        for(var i = 0; i < otherOverlays.length; i++)
        {
            otherOverlays[i].style.opacity = 0;
        }
        */
        overlay.style.opacity = 1;
    }, 10);
}

function showOverlayDelay(btn, overlay, delay)
{
    console.log('X');
    setTimeout(function()
    {
        showOverlay(btn, overlay);
    }, delay);
}

function removeOverlays(btn)
{
    console.log('Y');
    var otherOverlays = btn.getElementsByClassName('overlay');

    for(var i = 0; i < otherOverlays.length; i++)
    {
        otherOverlays[i].style.opacity = 0;
    }

    btn.style.opacity = 1;

    setTimeout(function()
    {
        for(var i = 0; i < otherOverlays.length; i++)
        {
            btn.parentElement.removeChild(otherOverlays[i]);
        }
    }, 300);
}

function removeOverlaysDelay(btn, delay)
{
    console.log('Z');
    setTimeout(function()
    {
        removeOverlays(btn, overlay);
    }, delay);
}