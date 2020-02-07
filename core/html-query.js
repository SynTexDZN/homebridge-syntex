var log;

function sendValue(html, param, value)
{
    var res = html.toString();

    res = res.replace(new RegExp('<%' + param + '%>', 'g'), value);
    
    return res;
}

function sendValues(html, obj)
{
    var res = html.toString();

    for(const i in obj)
    {
        res = res.replace(new RegExp('<%' + i + '%>', 'g'), obj[i]);
    }
    
    return res;
}

function SETUP(slog)
{
    log = slog;
};

module.exports = {
    SETUP,
    sendValue,
    sendValues
};