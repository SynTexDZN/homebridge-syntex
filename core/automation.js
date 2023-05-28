module.exports = class Automation
{
	constructor(platform)
	{
		this.logger = platform.logger;
		this.files = platform.files;
	}

	loadAutomation()
	{
		return new Promise((resolve) => {

			this.files.readFile('automation/automation.json').then((data) => {

				resolve(data || []);
			});
		});
	}

	setAutomation(automation)
	{
		return new Promise((resolve) => {

			if(this.isValid(automation))
			{
				this.files.readFile('automation/automation.json').then((data) => {

					var created = false;

					if(data != null)
					{
						var found = false;

						for(const i in data)
						{
							if(data[i].id == automation.id)
							{
								data[i] = automation;

								found = true;
							}
						}

						if(!found)
						{
							data.push(automation);

							created = true;
						}
					}
					else
					{
						data = [ automation ];

						created = true;
					}

					this.files.writeFile('automation/automation.json', data).then((response) => {

						if(response.success)
						{
							this.logger.log('success', 'bridge', 'Bridge', (created ? '%automation_created[0]%' : '%automation_updated[0]%') + ' [' + automation.id + '] ' + (created ? '%automation_created[1]%' : '%automation_updated[1]%') + '!');
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

	removeAutomation(id)
	{
		return new Promise((resolve) => {

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
		const validateBlock = (block) => {

			if(block != null
			&& block instanceof Object)
			{
				if(block.id != null
				&& block.name != null
				&& block.letters != null
				&& block.operation != null
				&& block.state != null
				&& block.state instanceof Object)
				{
					return true;
				}

				if(block.days != null
				&& Array.isArray(block.days)
				&& block.days.length > 0)
				{
					return true;
				}

				if(block.delay != null)
				{
					return true;
				}
				
				if(block.time != null)
				{
					return true;
				}
				
				if(block.url != null)
				{
					return true;
				}
			}

			return false;
		};

		if(automation != null
		&& automation instanceof Object
		&& automation.id != null
		&& automation.name != null
		&& automation.active != null
		&& automation.trigger != null
		&& automation.result != null)
		{
			if(automation.trigger instanceof Object
			&& automation.trigger.logic != null
			&& automation.trigger.groups != null
			&& Array.isArray(automation.trigger.groups)
			&& automation.trigger.groups.length > 0)
			{
				for(const i in automation.trigger.groups)
				{
					if(automation.trigger.groups[i] instanceof Object
					&& automation.trigger.groups[i].logic != null
					&& automation.trigger.groups[i].blocks != null
					&& Array.isArray(automation.trigger.groups[i].blocks)
					&& automation.trigger.groups[i].blocks.length > 0)
					{
						for(const j in automation.trigger.groups[i].blocks)
						{
							if(!validateBlock(automation.trigger.groups[i].blocks[j]))
							{
								return false;
							}
						}
					}
					else
					{
						return false;
					}
				}
			}
			else
			{
				return false;
			}

			if(Array.isArray(automation.result)
			&& automation.result.length > 0)
			{
				for(const i in automation.result)
				{
					if(!validateBlock(automation.result[i]))
					{
						return false;
					}
				}
			}
			else
			{
				return false;
			}
		}
		else
		{
			return false;
		}

		return true;
	}
}