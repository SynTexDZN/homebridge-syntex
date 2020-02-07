var log;

function send(html, param, value)
{
    var res = html.toString();

    res = res.replace(new RegExp('<%' + param + '%>', 'g'), value);
    
    return res;
}

function send(html, obj)
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
    send
};