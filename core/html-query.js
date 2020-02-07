var log;

function send(html, params)
{
    log(params);
}

function SETUP(slog)
{
    log = slog;
};

module.exports = {
    SETUP,
    send
};