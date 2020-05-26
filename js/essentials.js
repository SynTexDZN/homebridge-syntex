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

        var restart = await fetchURL(url, 3000);

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
/*
function complexFetch(url, tries, overlays)
{
    return new Promise(async function(resolve) {

        if(overlays.root && overlays.pending)
        {
            var color = 'blue', z = 1;

            if(overlays.connectionError.z)
            {
                z = overlays.connectionError.z;
            }

            if(overlays.connectionError.color)
            {
                color = overlays.connectionError.color;
            }

            showOverlay(overlays.root, createOverlay(z, overlays.pending.id, overlays.pending.value, color));
        }

        do
        {
            var fetch = await fetchURL(url);
            tries--;
        }
        while(fetch == null && tries > 0);

        if(fetch == null && overlays.root && overlays.connectionError)
        {
            var color = 'red', z = 2;

            if(overlays.connectionError.z)
            {
                z = overlays.connectionError.z;
            }

            if(overlays.connectionError.color)
            {
                color = overlays.connectionError.color;
            }

            showOverlay(overlays.root, createOverlay(z, overlays.connectionError.id, overlays.connectionError.value, color));
        }
        else if(fetch != 'Success' && overlays.root && overlays.executeError)
        {
            var color = 'red', z = 2;

            if(overlays.executeError.z)
            {
                z = overlays.executeError.z;
            }

            if(overlays.executeError.color)
            {
                color = overlays.executeError.color;
            }

            showOverlay(overlays.root, createOverlay(z, overlays.executeError.id, overlays.executeError.value, color));
        }
        else if(overlays.root && overlays.success)
        {
            var color = 'green', z = 2;

            if(overlays.success.z)
            {
                z = overlays.success.z;
            }

            if(overlays.success.color)
            {
                color = overlays.success.color;
            }

            showOverlay(overlays.root, createOverlay(z, overlays.success.id, overlays.success.value, color));
        }

        resolve(fetch);
    });
}
*/
function complexFetch(url, timeout, tries, overlays, remove)
{
    return new Promise(async function(resolve) {

        if(document.getElementById(overlays.id + '-pending') == null && document.getElementById(overlays.id + '-result') == null)
        {
            if(overlays.root && overlays.pending)
            {
                var color = 'blue', z = 1;

                if(overlays.pending.z)
                {
                    z = overlays.pending.z;
                }

                if(overlays.pending.color)
                {
                    color = overlays.pending.color;
                }

                showOverlay(overlays.root, createOverlay(z, overlays.id + '-pending', overlays.pending.value, color));
            }

            do
            {
                var fetch = await fetchURL(url, timeout);
                tries--;
            }
            while(fetch == null && tries > 0);

            if(fetch == null && overlays.root && overlays.connectionError)
            {
                var color = 'red', z = 2;

                if(overlays.connectionError.z)
                {
                    z = overlays.connectionError.z;
                }

                if(overlays.connectionError.color)
                {
                    color = overlays.connectionError.color;
                }

                showOverlay(overlays.root, createOverlay(z, overlays.id + '-result', overlays.connectionError.value, color));

                if(overlays.root && (overlays.connectionError.remove == undefined || overlays.connectionError.remove == true))
                {
                    setTimeout(function()
                    {
                        removeOverlays(overlays.root, true);
                    }, 4000);
                }
            }
            else if(fetch != 'Success' && overlays.root && overlays.executeError)
            {
                var color = 'red', z = 2;

                if(overlays.executeError.z)
                {
                    z = overlays.executeError.z;
                }

                if(overlays.executeError.color)
                {
                    color = overlays.executeError.color;
                }

                showOverlay(overlays.root, createOverlay(z, overlays.id + '-result', overlays.executeError.value, color));

                if(overlays.root && (overlays.executeError.remove == undefined || overlays.executeError.remove == true))
                {
                    setTimeout(function()
                    {
                        removeOverlays(overlays.root, true);
                    }, 4000);
                }
            }
            else if(overlays.root && overlays.success)
            {
                var color = 'green', z = 2;

                if(overlays.success.z)
                {
                    z = overlays.success.z;
                }

                if(overlays.success.color)
                {
                    color = overlays.success.color;
                }

                showOverlay(overlays.root, createOverlay(z, overlays.id + '-result', overlays.success.value, color));
                
                if(overlays.root && (overlays.success.remove == undefined || overlays.success.remove == true))
                {
                    setTimeout(function()
                    {
                        removeOverlays(overlays.root, remove);
                    }, 4000);
                }
            }

            resolve(fetch);
        }
        else
        {
            resolve(null);
        }
    });
}

function complexFetchPost(url, timeout, post, tries, overlays, remove)
{
    return new Promise(async function(resolve) {

        if(document.getElementById(overlays.id + '-pending') == null && document.getElementById(overlays.id + '-result') == null)
        {
            if(overlays.root && overlays.pending)
            {
                var color = 'blue', z = 1;

                if(overlays.pending.z)
                {
                    z = overlays.pending.z;
                }

                if(overlays.pending.color)
                {
                    color = overlays.pending.color;
                }

                showOverlay(overlays.root, createOverlay(z, overlays.id + '-pending', overlays.pending.value, color));
            }

            do
            {
                var fetch = await fetchURL(url, timeout, post);
                tries--;
            }
            while(fetch == null && tries > 0);

            if(fetch == null && overlays.root && overlays.connectionError)
            {
                var color = 'red', z = 2;

                if(overlays.connectionError.z)
                {
                    z = overlays.connectionError.z;
                }

                if(overlays.connectionError.color)
                {
                    color = overlays.connectionError.color;
                }

                showOverlay(overlays.root, createOverlay(z, overlays.id + '-result', overlays.connectionError.value, color));

                if(overlays.root && (overlays.connectionError.remove == undefined || overlays.connectionError.remove == true))
                {
                    setTimeout(function()
                    {
                        removeOverlays(overlays.root, true);
                    }, 4000);
                }
            }
            else if(fetch != 'Success' && overlays.root && overlays.executeError)
            {
                var color = 'red', z = 2;

                if(overlays.executeError.z)
                {
                    z = overlays.executeError.z;
                }

                if(overlays.executeError.color)
                {
                    color = overlays.executeError.color;
                }

                showOverlay(overlays.root, createOverlay(z, overlays.id + '-result', overlays.executeError.value, color));

                if(overlays.root && (overlays.executeError.remove == undefined || overlays.executeError.remove == true))
                {
                    setTimeout(function()
                    {
                        removeOverlays(overlays.root, true);
                    }, 4000);
                }
            }
            else if(overlays.root && overlays.success)
            {
                var color = 'green', z = 2;

                if(overlays.success.z)
                {
                    z = overlays.success.z;
                }

                if(overlays.success.color)
                {
                    color = overlays.success.color;
                }

                showOverlay(overlays.root, createOverlay(z, overlays.id + '-result', overlays.success.value, color));
                
                if(overlays.root && (overlays.success.remove == undefined || overlays.success.remove == true))
                {
                    setTimeout(function()
                    {
                        removeOverlays(overlays.root, remove);
                    }, 4000);
                }
            }

            resolve(fetch);
        }
        else
        {
            resolve(null);
        }
    });
}