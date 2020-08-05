async function fetchURL(url)
{
    return new Promise(resolve => {
        
        var client = new XMLHttpRequest();

        client.timeout = 10000;

        client.open('GET', url);

        client.onreadystatechange = function()
        {
            if(client.readyState === 4)
            {  
                if(client.status === 200)
                {
                    resolve(client.responseText);
                }
                else
                {
                    resolve(null);
                }
            }
        }

        client.send();
    });
}

async function fetchURL(url, timeout)
{
    return new Promise(resolve => {
        
        var client = new XMLHttpRequest();

        client.timeout = timeout;

        client.open('GET', url);

        client.onreadystatechange = function()
        {
            if(client.readyState === 4)
            {  
                if(client.status === 200)
                {
                    resolve(client.responseText);
                }
                else
                {
                    resolve(null);
                }
            }
        }

        client.send();
    });
}

async function fetchURL(url, timeout, post)
{
    return new Promise(resolve => {
        
        var client = new XMLHttpRequest();

        client.timeout = timeout;

        client.open('POST', url);

        client.onreadystatechange = function()
        {
            if(client.readyState === 4)
            {  
                if(client.status === 200)
                {
                    resolve(client.responseText);
                }
                else
                {
                    resolve(null);
                }
            }
        }

        client.send(post);
    });
}

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

                var style = 'z-index: ' + z;

                if(overlays.pending.style)
                {
                    style += '; ' + overlays.pending.style;
                }

                if(overlays.pending.color)
                {
                    color = overlays.pending.color;
                }

                var overlay = createOverlay(z, overlays.id + '-pending', overlays.pending.value, color);

                overlay.setAttribute('style', style);

                showOverlay(overlays.root, overlay);
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

                var style = 'z-index: ' + z;

                if(overlays.pending && overlays.pending.style)
                {
                    style += '; ' + overlays.pending.style;
                }

                if(overlays.connectionError.color)
                {
                    color = overlays.connectionError.color;
                }

                var overlay = createOverlay(z, overlays.id + '-result', overlays.connectionError.value, color);

                overlay.setAttribute('style', style);

                showOverlay(overlays.root, overlay);

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

                var style = 'z-index: ' + z;

                if(overlays.pending && overlays.pending.style)
                {
                    style += '; ' + overlays.pending.style;
                }

                if(overlays.executeError.color)
                {
                    color = overlays.executeError.color;
                }

                var overlay = createOverlay(z, overlays.id + '-result', overlays.executeError.value, color);

                overlay.setAttribute('style', style);

                showOverlay(overlays.root, overlay);

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

                var style = 'z-index: ' + z;

                if(overlays.pending && overlays.pending.style)
                {
                    style += '; ' + overlays.pending.style;
                }

                if(overlays.success.color)
                {
                    color = overlays.success.color;
                }

                var overlay = createOverlay(z, overlays.id + '-result', overlays.success.value, color);

                overlay.setAttribute('style', style);

                showOverlay(overlays.root, overlay);

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

                var style = 'z-index: ' + z;

                if(overlays.pending.style)
                {
                    style += '; ' + overlays.pending.style;
                }

                if(overlays.pending.color)
                {
                    color = overlays.pending.color;
                }

                var overlay = createOverlay(z, overlays.id + '-pending', overlays.pending.value, color);

                overlay.setAttribute('style', style);

                showOverlay(overlays.root, overlay);
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

                var style = 'z-index: ' + z;

                if(overlays.pending && overlays.pending.style)
                {
                    style += '; ' + overlays.pending.style;
                }

                if(overlays.connectionError.color)
                {
                    color = overlays.connectionError.color;
                }

                var overlay = createOverlay(z, overlays.id + '-result', overlays.connectionError.value, color);

                overlay.setAttribute('style', style);

                showOverlay(overlays.root, overlay);

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

                var style = 'z-index: ' + z;

                if(overlays.pending && overlays.pending.style)
                {
                    style += '; ' + overlays.pending.style;
                }

                if(overlays.executeError.color)
                {
                    color = overlays.executeError.color;
                }

                var overlay = createOverlay(z, overlays.id + '-result', overlays.executeError.value, color);

                overlay.setAttribute('style', style);

                showOverlay(overlays.root, overlay);

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

                var style = 'z-index: ' + z;

                if(overlays.pending && overlays.pending.style)
                {
                    style += '; ' + overlays.pending.style;
                }

                if(overlays.success.color)
                {
                    color = overlays.success.color;
                }

                var overlay = createOverlay(z, overlays.id + '-result', overlays.success.value, color);

                overlay.setAttribute('style', style);

                showOverlay(overlays.root, overlay);

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