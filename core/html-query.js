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

function read(path)
{
    return new Promise(resolve => {
        
        var pathname = path.join(__dirname, path);

        var noext = false;

        if(path.parse(urlPath).ext == '')
        {
            noext = true;
        }

        fs.exists(pathname, function(exist)
        {
            if(exist || noext)
            {
                if(exist && fs.statSync(pathname).isDirectory())
                {
                    pathname += '/index.html';
                }
                else if(noext)
                {
                    pathname += '.html';
                }
            }
            
            fs.readFile(pathname, function(err, res)
            {                                        
                if(!res || err)
                {
                    res = "";
                }

                resolve(res);
            });
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
    include
};