var fs = require('fs');
var path = require('path');
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

function exists(reqPath)
{
    return new Promise(resolve => {
        
        var pathname = path.join(__dirname, '../' + reqPath);

        var noext = false;

        if(path.parse(pathname).ext == '')
        {
            noext = true;
        }

        fs.exists(pathname, function(exist)
        {
            if(exist && fs.statSync(pathname).isDirectory())
            {
                resolve(exists(reqPath + 'index.html'));
            }
            else if(exist)
            {
                resolve(pathname);
            }
            else
            {
                resolve(false);
            }
        });
    });
}

function read(reqPath)
{
    return new Promise(resolve => {
        
        fs.readFile(reqPath, function(err, res)
        {                                        
            if(!res || err)
            {
                res = "";
            }

            resolve(res);
        });
    });
}

function SETUP(slog)
{
    log = slog;
};

module.exports = {
    SETUP,
    sendValue,
    sendValues,
    read,
    exists
};