var development = false;

if(development)
{
    var client = new XMLHttpRequest();

    client.timeout = 10000;

    client.open('GET', '/includes/head.html');

    client.onreadystatechange = function()
    {
        if(client.readyState === 4)
        {  
            if(client.status === 200)
            {
                document.getElementsByTagName('head')[0].innerHTML = client.responseText;
            }
        }
    }

    client.send();
}

export let Head = { Hi, Test };

function Hi(text)
{
    console.log(text);
};

function Test(one, two)
{
    if(!one && !two)
    {
        console.log('0');
    }

    if(one)
    {
        console.log(one);
    }
    
    if(two)
    {
        console.log(one, two);
    }

    console.log(one, two);
};