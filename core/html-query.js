var log;

function send(html, params)
{
    return html;
}

function SETUP(slog)
{
    log = slog;
};

module.exports = {
    SETUP,
    send
};