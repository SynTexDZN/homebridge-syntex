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