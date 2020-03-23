function versionCount(version)
{
    var intVersion = 0;

    for(var i = 0; i < (version.match(/\./g) || []).length; i++)
    {
        if(version.includes('-'))
        {
            intVersion += version.split('-')[0].split('.')[i] * Math.pow(100, (version.match(/\./g) || []).length - i);
        }
        else
        {
            intVersion += version.split('.')[i] * Math.pow(100, (version.match(/\./g) || []).length - i);
        }

        console.log(i, intVersion);
    }

    return intVersion;
}