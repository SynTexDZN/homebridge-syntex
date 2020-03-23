function versionCount(version)
{
    var intVersion = 0;

    for(var i = (version.match(/\./g) || []).length; i >= 0; i--)
    {
        if(version.includes('-'))
        {
            intVersion += version.split('-')[0].split('.')[i] * Math.pow(100, i);
        }
        else
        {
            intVersion += version.split('.')[i] * Math.pow(100, i);
        }

        console.log(i, intVersion);
    }

    return intVersion;
}