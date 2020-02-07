var log;

function send(html, param, value)
{
    var res = html.toString();

    res = res.replace(new RegExp('<%' + param + '%>', 'g'), value);
    
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