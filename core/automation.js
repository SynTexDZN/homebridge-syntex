module.exports = class Automation
{
	constructor(logger, files)
	{
		this.logger = logger;
		this.files = files;
	}

	loadAutomation()
	{
		return new Promise(resolve => {

			this.files.readFile('automation/automation.json').then((data) => {

				resolve(data || []);
			});
		});
	}

	createAutomation(automation)
	{
		return new Promise(resolve => {

			if(this.isValid(automation))
			{
				this.files.readFile('automation/automation.json').then((data) => {

					if(data != null)
					{
						data[data.length] = automation;
					}
					else
					{
						data = [ automation ];
					}

					this.files.writeFile('automation/automation.json', data).then((response) => {

						if(response.success)
						{
							this.logger.log('success', 'bridge', 'Bridge', '%automation_created[0]% [' + automation.id + '] %automation_created[1]%!');
						}

						resolve(response.success);
					});
				});
			}
			else
			{
				resolve(false);
			}
		});
	}

	modifyAutomation(automation)
	{
		return new Promise(resolve => {

			if(this.isValid(automation))
			{
				this.files.readFile('automation/automation.json').then((data) => {

					if(data != null)
					{
						for(var i = 0; i < data.length; i++)
						{
							if(data[i].id == automation.id)
							{
								data[i] = automation;
							}
						}

						this.files.writeFile('automation/automation.json', data).then((response) => {

							if(response.success)
							{
								this.logger.log('success', 'bridge', 'Bridge', '%automation_updated[0]% [' + automation.id + '] %automation_updated[1]%!');
							}

							resolve(response.success);
						});
					}
					else
					{
						resolve(false);
					}
				});
			}
			else
			{
				resolve(false);
			}
		});
	}

	removeAutomation(id)
	{
		return new Promise(resolve => {

			this.files.readFile('automation/automation.json').then((data) => {

				if(data != null)
				{
					var name = null;

					for(var i = 0; i < data.length; i++)
					{
						if(data[i].id == id)
						{
							name = data[i].name;

							data.splice(i, 1);
						}
					}

					this.files.writeFile('automation/automation.json', data).then((response) => {

						if(response.success)
						{
							this.logger.log('success', 'bridge', 'Bridge', '%automation_removed[0]% [' + name + '] %automation_removed[1]%!');
						}

						resolve(response.success);
					});
				}
				else
				{
					resolve(false);
				}
			});
		});
	}

	isValid(automation)
	{
		if(automation.id != null && automation.name != null && automation.active != null && automation.trigger != null && automation.result != null)
		{
			var valid = { trigger : false, condition : false, result : false };

			for(var i = 0; i < automation.trigger.length; i++)
			{
				if(automation.trigger[i].id != null && automation.trigger[i].name != null && automation.trigger[i].letters != null && automation.trigger[i].value != null && automation.trigger[i].operation != null)
				{
					valid.trigger = true;
				}
				else
				{
					return false;
				}
			}

			if(automation.condition != null)
			{
				for(var i = 0; i < automation.condition.length; i++)
				{
					if(automation.condition[i].id != null && automation.condition[i].name != null && automation.condition[i].letters != null && automation.condition[i].value != null && automation.condition[i].operation != null)
					{
						valid.condition = true;
					}
					else
					{
						return false;
					}
				}
			}

			for(var i = 0; i < automation.result.length; i++)
			{
				if(automation.result[i].id != null && automation.result[i].name != null && automation.result[i].letters != null && automation.result[i].value != null && automation.result[i].operation != null)
				{
					valid.result = true;
				}
				else if(automation.result[i].url)
				{
					valid.result = true;
				}
				else
				{
					return false;
				}
			}

			return valid.trigger && valid.result ? true : false;
		}
		else
		{
			return false;
		}
	}
}