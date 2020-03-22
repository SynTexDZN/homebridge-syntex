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