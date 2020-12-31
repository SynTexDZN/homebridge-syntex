const fs = require('fs'), path = require('path');

module.exports = class HTMLQuery
{
	constructor(logger)
	{
		this.logger = logger;
	}

	sendValue(html, param, value)
	{
		var res = html.toString();

		res = res.replace(new RegExp('<%' + param + '%>', 'g'), value);
		
		return res;
	}

	sendValues(html, obj)
	{
		var res = html.toString();

		for(const i in obj)
		{
			res = this.sendValue(res, i, obj[i]);
		}
		
		return res;
	}

	exists(reqPath)
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
				else if(noext)
				{
					resolve(exists(reqPath + '.html'));
				}
				else
				{
					resolve(false);
				}
			});
		});
	}

	read(reqPath)
	{
		return new Promise(resolve => fs.readFile(reqPath, 
			(err, res) => resolve(res || '')));
	}
}