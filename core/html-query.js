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
}