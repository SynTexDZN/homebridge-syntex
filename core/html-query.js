var log;

function send(html, param, value)
{
    var res = html.toString();
    
    log(value);

    res = res.replace(new RegExp('<%' + param + '%>', 'g'), value);
    
    log(res);
    
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