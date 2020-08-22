var Query;

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

function checkRestart(url)
{
    return new Promise(async function(resolve) {

        var restart = await Query.fetchURL(url, 3000); //TODO: Auf Modul Umstellen

        console.log(restart);

        if(restart != null && restart == 'false')
        {
            resolve(true);
        }
        else
        {
            setTimeout(function()
            {
                resolve(checkRestart(url));
            }, 500);
        }
    });
}

var overlays = [];

function createOverlay(level, id, value, color)
{
    var overlay = document.createElement('input');

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
    overlays.push({
        reference: btn,
        overlay: overlay
    });

    btn.parentElement.insertBefore(overlay, btn);

    setTimeout(function()
    {
        btn.style.opacity = 0;
        
        for(var i = 0; i < overlays.length; i++)
        {
            if(overlays[i].reference == btn)
            {
                overlays[i].overlay.style.opacity = 0;
            }
        }

        overlay.style.opacity = 1;
    }, 10);
}

function showOverlayDelay(btn, overlay, delay)
{
    setTimeout(function()
    {
        showOverlay(btn, overlay);
    }, delay);
}

function removeOverlays(btn, show)
{
    for(var i = 0; i < overlays.length; i++)
    {
        if(overlays[i].reference == btn)
        {
            overlays[i].overlay.style.opacity = 0;
        }
    }

    if(show)
    {
        btn.style.opacity = 1;
    }

    if(!show)
    {
        setTimeout(function()
        {
            btn.style.height = 0;
            btn.style.paddingTop = 0;
            btn.style.paddingBottom = 0;
            btn.style.marginTop = 0;
            btn.style.marginBottom = 0;
            btn.style.borderTopWidth = 0;
            btn.style.borderBottomWidth = 0;
        }, 300);
    }

    setTimeout(function()
    {
        for(var i = overlays.length - 1; i >= 0; i--)
        {
            if(overlays[i].reference == btn)
            {
                btn.parentElement.removeChild(overlays[i].overlay);
                overlays.splice(overlays.indexOf(overlays[i]), 1);
            }
        }

        if(!show)
        {
            btn.parentElement.removeChild(btn);
        }
    }, 600);
}

function getType(services)
{
    var s = services;

    if(Array.isArray(s))
    {
        for(var i = 0; i < s.length; i++)
        {
            if(s[i] instanceof Object)
            {
                s[i] = s[i].type;
            }
        }

        if(s.length == 1)
        {
            return s[0];
        }
        else if(s.length == 2 && s.includes('temperature') && s.includes('humidity'))
        {
            return 'climate';
        }
        else if(s.length == 2 && s.includes('light') && s.includes('rain'))
        {
            return 'weather';
        }
        else if(s.length == 2 && s.includes('rgb') && s.includes('switch'))
        {
            return 'rgbw';
        }
        else if(s.includes('rgb'))
        {
            return 'rgb';
        }
        else if(s.includes('switch'))
        {
            return 'switch';
        }
        else
        {
            return 'special';
        }
    }
    else
    {
        return s;
    }
}

function removeOverlaysDelay(btn, delay, show)
{
    setTimeout(function()
    {
        removeOverlays(btn, show);
    }, delay);
}

function newTimeout(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

function SETUP(Q)
{
    Query = Q;
}

export let Essentials = { SETUP, newTimeout, removeOverlaysDelay, removeOverlays, versionCount, checkRestart, createOverlay, createPendingOverlay, createSuccessOverlay, createErrorOverlay, showOverlay, showOverlayDelay, getType };