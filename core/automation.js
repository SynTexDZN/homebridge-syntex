const store = require('json-fs-store');

var logger, storage;

function loadAutomation()
{
	return new Promise(resolve => {

		storage.load('automation', (err, obj) => {  

			if(!obj || err)
			{
				resolve([]);
			}
			else
			{
				resolve(obj.automation);
			}
		});
	});
}

function createAutomation(automation)
{
	return new Promise(resolve => {

		if(isValid(automation))
		{
			storage.load('automation', (err, obj) => {  

				if(!obj || err)
				{
					obj = { id : 'automation', automation : [ automation ] };
				}
				else
				{
					obj.id = 'automation';

					obj.automation[obj.automation.length] = automation;
				}
	
				storage.add(obj, (err) => {
	
					if(err)
					{
						logger.log('error', 'bridge', 'Bridge', 'Automation.json %update_error%! ' + err);
	
						resolve(false);
					}
					else
					{
						logger.log('success', 'bridge', 'Bridge', '%automation_created[0]% [' + automation.id + '] %automation_created[1]%!');
	
						resolve(true);
					}
				});
			});
		}
		else
		{
			resolve(false);
		}
	});
}

function removeAutomation(id)
{
	return new Promise(resolve => {

		storage.load('automation', (err, obj) => {  

			if(!obj || err)
			{
				resolve(false);
			}
			else
			{
				obj.id = 'automation';

				for(var i = 0; i < obj.automation.length; i++)
				{
					if(obj.automation[i].id == id)
					{
						obj.automation.splice(i, 1);
					}
				}

				storage.add(obj, (err) => {
	
					if(err)
					{
						logger.log('error', 'bridge', 'Bridge', 'Automation.json %update_error%! ' + err);
	
						resolve(false);
					}
					else
					{
						logger.log('success', 'bridge', 'Bridge', '%automation_removed[0]% [' + id + '] %automation_removed[1]%!');
	
						resolve(true);
					}
				});
			}
		});
	});
}

function isValid(automation)
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

function modifyAutomation(automation)
{
	return new Promise(resolve => {

		if(isValid(automation))
		{
			storage.load('automation', (err, obj) => {  

				if(!obj || err)
				{
					resolve(false);
				}
				else
				{
					obj.id = 'automation';

					for(var i = 0; i < obj.automation.length; i++)
					{
						if(obj.automation[i].id == automation.id)
						{
							obj.automation[i] = automation;
						}
					}

					storage.add(obj, (err) => {
		
						if(err)
						{
							logger.log('error', 'bridge', 'Bridge', 'Automation.json %update_error%! ' + err);
		
							resolve(false);
						}
						else
						{
							logger.log('success', 'bridge', 'Bridge', '%automation_updated[0]% [' + automation.id + '] %automation_updated[1]%!');
		
							resolve(true);
						}
					});
				}
			});
		}
		else
		{
			resolve(false);
		}
	});
}

function SETUP(log, storagePath)
{
	logger = log;
	storage = store(storagePath);
}

module.exports = {
	SETUP,
	loadAutomation,
	createAutomation,
	removeAutomation,
	modifyAutomation
};