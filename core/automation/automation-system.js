const TypeManager = require('./type-manager'), RouteManager = require('./route-manager');

module.exports = class AutomationSystem
{
	constructor(platform, ActivityManager)
	{
		this.ready = false;

		this.automation = [];
		
		this.timeLock = {};
		this.stateLock = {};

		this.platform = platform;

		this.logger = platform.logger;
		this.files = platform.files;

		this.ContextManager = platform.ContextManager;
		this.EventManager = platform.EventManager;
		this.RequestManager = platform.RequestManager;

		this.ActivityManager = ActivityManager;
		
		this.TypeManager = new TypeManager(platform);
		this.RouteManager = new RouteManager(platform.logger, platform.files, platform.api.user.storagePath());
		
		if(this.files.checkFile('automation/automation.json'))
		{
			this.loadAutomation().then((automationSuccess) => {
			
				if(automationSuccess)
				{
					this.loadLock().then((lockSuccess) => {
	
						if(lockSuccess)
						{
							this.initNetwork();
	
							this.timeInterval = setInterval(() => {
				
								var promiseArray = [];
				
								for(const automation of this.automation)
								{
									if(automation.active && this._includesTime(automation))
									{
										promiseArray.push(this._checkLock(automation));
										
										this.checkTrigger(automation, { name : ('0' + new Date().getHours()).slice(-2) + ':' + ('0' + new Date().getMinutes()).slice(-2) });
									}
								}
				
								Promise.all(promiseArray).then((result) => {
	
									if(result.includes(true))
									{
										this.files.writeFile('automation/automation-lock.json', { timeLock : this.timeLock, stateLock : this.stateLock });
									}
								});
	
							}, 60000);
	
							this.logger.log('success', 'automation', 'Automation', '%automation_load_success%!');
	
							this.ready = true;
						}
					});
				}
			});
		}
	}

	loadAutomation()
	{
		return new Promise((resolve) => {

			this.files.readFile('automation/automation.json').then((data) => {

				if(data != null && Array.isArray(data) && data.length > 0)
				{
					this.automation = data;

					resolve(true);
				}
				else
				{
					resolve(false);
				}

			}).catch(() => {
				
				this.logger.log('warn', 'automation', 'Automation', '%automation_load_error%!');

				resolve(false);
			});
		});
	}

	loadLock()
	{
		return new Promise((resolve) => {

			this.files.readFile('automation/automation-lock.json').then((data) => {

				if(data != null)
				{
					this.timeLock = data.timeLock || {};
					this.stateLock = data.stateLock || {};
				}

				resolve(true);

			}).catch(() => {
				
				this.logger.log('warn', 'automation', 'Automation', '%automation_load_error%!');

				resolve(false);
			});
		});
	}

	initNetwork()
	{
		if(this.EventManager != null)
		{
			this.EventManager.setInputStream('updateAutomation', { source : this, external : true }, () => {

				this.loadAutomation().then((success) => {

					if(success)
					{
						this.logger.log('success', 'automation', 'Automation', '%automation_load_success%!');
					}
				});
			});
		}
	}

	runAutomation(service, state)
	{
		return new Promise((resolve) => {

			if(this.ready)
			{
				var promiseArray = [];

				for(const automation of this.automation)
				{
					if(automation.active && this._includesBlock(this._getBlocks(automation.id), service))
					{
						promiseArray.push(this._checkLock(automation, service, state));

						this.checkTrigger(automation, service, state);
					}
				}

				Promise.all(promiseArray).then((result) => {

					if(result.includes(true))
					{
						this.files.writeFile('automation/automation-lock.json', { timeLock : this.timeLock, stateLock : this.stateLock });
					}
				});
			}
			
			resolve();
		});
	}

	checkTrigger(automation, service, state = {})
	{
		return new Promise((resolve) => {

			const TRIGGER = (group) => {

				return new Promise((resolve) => {

					var promiseArray = [];

					for(const block of group.blocks)
					{
						promiseArray.push(this._getComparison(automation, block, service, state));
					}

					Promise.all(promiseArray).then((result) => {

						if(!result.includes(null))
						{
							if(group.logic == 'AND' && AND(result))
							{
								resolve(true);
							}
							else if(group.logic == 'OR' && OR(result))
							{
								resolve(true);
							}
							else
							{
								resolve(false);
							}
						}
						else
						{
							resolve(false);
						}
					});
				});
			};

			const AND = (blocks) => {

				var success = true;

				for(const block of blocks)
				{
					var output = this._getOutput(block.block, block.state);

					if(!output)
					{
						success = false;
					}
				}

				return success;
			};

			const OR = (blocks) => {

				var success = false;

				for(const block of blocks)
				{
					var output = this._getOutput(block.block, block.state);

					if(output)
					{
						success = true;
					}
				}

				return success;
			};

			var groups = this._getGroups(automation.id), promiseArray = [];

			for(const group of groups)
			{
				if(automation.trigger.logic == 'AND' || this._includesBlock(group.blocks, service))
				{
					promiseArray.push(TRIGGER(group));
				}
			}

			Promise.all(promiseArray).then((triggers) => {

				if(automation.trigger.logic == 'AND' ? !triggers.includes(false) : automation.trigger.logic == 'OR' ? triggers.includes(true) : false)
				{
					if(!this._isLocked(automation))
					{
						if(automation.options == null
						|| automation.options.timeLock == null
						|| this.timeLock[automation.id] == null
						|| new Date().getTime() >= this.timeLock[automation.id])
						{
							this.logger.debug('Automation [' + automation.name + '] %trigger_activated%');

							this.executeResult(automation, service);
						}
					}
				}
				else if(this.stateLock[automation.id] != null && this.stateLock[automation.id].result == true)
				{
					this.stateLock[automation.id].result = false;

					this.logger.debug('Automation [' + automation.name + '] %automation_different% ' + automation.id);
				}

				resolve();
			});
		});
	}

	async executeResult(automation, trigger)
	{
		var promiseArray = [], firstSuccess = false,
			locked = this.stateLock[automation.id] != null && this.stateLock[automation.id].result == true;

		for(const block of automation.result)
		{
			if(block.delay != null)
			{
				await new Promise((resolve) => setTimeout(() => resolve(), block.delay));
			}

			if((block.options != null && block.options.stateLock == false) || !locked)
			{
				if(block.url != null)
				{
					promiseArray.push(new Promise((resolve) => {

						var theRequest = {
							url : block.url,
							timeout : 10000
						};
						
						this.fetchRequest(theRequest, automation.name, block).then((data) => {

							if(!firstSuccess)
							{
								firstSuccess = true;

								this._automationLock(automation, { result : block });
							}

							resolve(data != null);
						});
					}));
				}

				if(block.id != null && block.letters != null && block.state != null && block.name != null)
				{
					promiseArray.push(new Promise((resolve) => {
					
						var state = { ...block.state };

						if((state = this.TypeManager.validateUpdate(block.id, block.letters, state)) != null)
						{
							if(this.TypeManager.letterToType(block.letters[0]) == 'statelessswitch')
							{
								state.event = state.value;
								state.value = 0;
							}

							if(block.bridge != null && block.port != null)
							{
								var theRequest = {
									url : 'http://' + block.bridge + ':' + block.port + '/devices?id=' + block.id + '&type=' + this.TypeManager.letterToType(block.letters[0]) + '&counter=' + block.letters.slice(1),
									timeout : 10000
								};

								for(const x in state)
								{
									theRequest.url += '&' + x + '=' + state[x];
								}

								this.fetchRequest(theRequest, automation.name, block).then((data) => {

									if(!firstSuccess)
									{
										firstSuccess = true;

										this._automationLock(automation, { result : block });
									}

									resolve(data != null);
								});
							}
							else
							{
								this.EventManager.setOutputStream('changeHandler', { receiver : { id : block.id, letters : block.letters } }, state);
							
								if(!firstSuccess)
								{
									firstSuccess = true;

									this._automationLock(automation, { result : block });
								}

								resolve(true);
							}
						}
						else
						{
							this.logger.log('error', block.id, block.letters, '[' + block.name + '] %update_error%! ( ' + block.id + ' )');

							resolve(false);
						}
					}));
				}
			}
		}

		Promise.all(promiseArray).then((success) => {

			if(success.includes(true))
			{
				this.logger.log('success', trigger.id, trigger.letters, '[' + trigger.name + '] %automation_executed[0]% [' + automation.name + '] %automation_executed[1]%!');

				this._automationLock(automation, { trigger });

				this.ActivityManager.updateAutomation(trigger.id, trigger.letters, automation);

				if(this.EventManager != null)
				{
					this.EventManager.setOutputStream('automationSuccess', { sender : this }, { automation : { id : automation.id, name : automation.name }, trigger : { name : trigger.name }});
				}
			}
		});
	}

	fetchRequest(theRequest, name, element)
	{
		return new Promise((resolve) => {

			this.RequestManager.fetch(theRequest.url, theRequest).then((response) => {
			
				if(response.data == null)
				{
					this.logger.log('error', element.id, element.letters, '[' + name + '] %request_result[0]% [' + theRequest.url + '] %request_result[1]% [' + (response.status || -1) + '] %request_result[2]%: [' + (response.data || '') + ']', response.error || '');
				}

				resolve(response.data);
			});
		});
	}

	_automationLock(automation, entry = {})
	{
		var changed = false;

		if(entry.result != null)
		{
			if(entry.result.options == null || entry.result.options.stateLock != false)
			{
				if(this.stateLock[automation.id] == null)
				{
					this.stateLock[automation.id] = {};
				}

				if(this.stateLock[automation.id].result != true)
				{
					this.stateLock[automation.id].result = true;

					changed = true;
				}
			}
		}
		
		if(entry.trigger != null)
		{
			var groups = this._getGroups(automation.id);

			if(automation.options != null && automation.options.timeLock != null)
			{
				this.timeLock[automation.id] = new Date().getTime() + automation.options.timeLock;

				changed = true;
			}

			for(const i in groups)
			{
				if(automation.trigger.logic == 'AND' || this._includesBlock(groups[i].blocks, entry.trigger))
				{
					for(const j in groups[i].blocks)
					{
						if(groups[i].logic == 'AND' || ((groups[i].blocks[j].id == entry.trigger.id && groups[i].blocks[j].letters == entry.trigger.letters) || entry.trigger.days != null || entry.trigger.time != null))
						{
							if(groups[i].blocks[j].options != null && groups[i].blocks[j].options.stateLock == true)
							{
								if(this.stateLock[automation.id] == null)
								{
									this.stateLock[automation.id] = {};
								}

								if(this.stateLock[automation.id].trigger == null)
								{
									this.stateLock[automation.id].trigger = {};
								}

								this.stateLock[automation.id].trigger[i + '' + j] = true;

								changed = true;
							}
						}
					}
				}
			}
		}

		if(changed)
		{
			this.files.writeFile('automation/automation-lock.json', { timeLock : this.timeLock, stateLock : this.stateLock });
		}
	}

	async _getState(automation, block)
	{
		var state = null;

		if(block.id != null && block.letters != null)
		{
			if((block.bridge != null && block.port != null) || (block.plugin != null && this.RouteManager.getPort(block.plugin) != null))
			{
				var theRequest = {
					url : 'http://' + (block.bridge || '127.0.0.1') + ':' + (block.port || this.RouteManager.getPort(block.plugin)) + '/devices?id=' + block.id + '&type=' + this.TypeManager.letterToType(block.letters[0]) + '&counter=' + block.letters.slice(1),
					timeout : 10000
				};

				try
				{
					state = await this.fetchRequest(theRequest, automation.name, block);
				}
				catch(e)
				{
					this.logger.log('error', 'automation', 'Automation', 'Request %json_parse_error%!', e);
				}
			}
			else
			{
				state = this.platform.readAccessoryService(block.id, block.letters, true);	
			}
		}

		return state;
	}

	_getOutput(block, state = {})
	{
		var now = new Date();

		if(block.time != null && block.time.includes(':') && block.operation != null)
		{
			var begin = new Date(), end = new Date();

			begin.setMinutes(0);
			begin.setSeconds(0);
			begin.setMilliseconds(0);
			
			end.setMinutes(0);
			end.setSeconds(0);
			end.setMilliseconds(0);

			if(block.operation == '>')
			{
				begin.setHours(block.time.split(':')[0]);
				begin.setMinutes(block.time.split(':')[1]);

				end.setHours(24);
			}

			if(block.operation == '<')
			{
				begin.setHours(0);

				end.setHours(block.time.split(':')[0]);
				end.setMinutes(block.time.split(':')[1]);
			}

			if(block.operation == '=')
			{
				begin.setHours(block.time.split(':')[0]);
				begin.setMinutes(block.time.split(':')[1]);

				end.setHours(block.time.split(':')[0]);
				end.setMinutes(parseInt(block.time.split(':')[1]) + 1);
			}

			if(now.getTime() > begin.getTime()
			&& now.getTime() < end.getTime())
			{
				return true;
			}
		}

		if(block.days != null && Array.isArray(block.days) && block.days.includes(now.getDay()))
		{
			return true;
		}

		if(block.id != null && block.letters != null && block.operation != null && block.state instanceof Object && state instanceof Object)
		{
			var success = true;

			for(const x in block.state)
			{
				if(state[x] == null)
				{
					success = false;
				}

				if((state[x] <= block.state[x] && block.operation == '>')
				|| (state[x] >= block.state[x] && block.operation == '<')
				|| (state[x] != block.state[x] && block.operation == '='))
				{
					success = false;
				}
			}

			if(success)
			{
				return true;
			}
		}

		return false;
	}

	_getBlocks(id)
	{
		var blocks = [];

		for(const automation of this.automation)
		{
			if((id == null || automation.id == id) && automation.trigger != null && Array.isArray(automation.trigger.groups))
			{
				for(const i in automation.trigger.groups)
				{
					if(Array.isArray(automation.trigger.groups[i].blocks))
					{
						for(const j in automation.trigger.groups[i].blocks)
						{
							blocks.push({ blockID : i + '' + j, ...automation.trigger.groups[i].blocks[j] });
						}
					}
				}
			}
		}

		return blocks;
	}

	_getGroups(id)
	{
		var groups = [];

		for(const automation of this.automation)
		{
			if((id == null || automation.id == id) && automation.trigger != null && automation.trigger.groups != null)
			{
				for(const i in automation.trigger.groups)
				{
					if(automation.trigger.groups[i].blocks != null && automation.trigger.groups[i].logic != null)
					{
						var blocks = [];

						for(const j in automation.trigger.groups[i].blocks)
						{
							blocks.push({ ...automation.trigger.groups[i].blocks[j], blockID : i + '' + j });
						}

						groups.push({ ...automation.trigger.groups[i], blocks, groupID : i });
					}
				}
			}
		}

		return groups;
	}

	_isLocked(automation, service = {})
	{
		var groups = this._getGroups(automation.id), groupCounter = { lock : 0, locked : 0 };

		for(const group of groups)
		{
			var blockCounter = { lock : 0, locked : 0 }, included = false;

			for(const block of group.blocks)
			{
				if(block.options != null
				&& block.options.stateLock == true)
				{
					if(this.stateLock[automation.id] != null
					&& this.stateLock[automation.id].trigger != null
					&& this.stateLock[automation.id].trigger[block.blockID] == true)
					{
						blockCounter.locked++;
					}

					blockCounter.lock++;
				}

				if((block.id == service.id && block.letters == service.letters) || block.days != null || block.time != null)
				{
					included = true;
				}
			}

			if(blockCounter.lock > 0 && (automation.trigger.logic == 'AND' || included))
			{
				if(group.logic == 'AND' && blockCounter.locked > 0)
				{
					groupCounter.locked++;
				}

				if(group.logic == 'OR' && blockCounter.locked == blockCounter.lock)
				{
					groupCounter.locked++;
				}

				groupCounter.lock++;
			}
		}

		if(groupCounter.lock > 0)
		{
			if(automation.trigger.logic == 'AND' && groupCounter.locked > 0)
			{
				return true;
			}

			if(automation.trigger.logic == 'OR' && groupCounter.locked == groupCounter.lock)
			{
				return true;
			}
		}

		return false;
	}

	_includesBlock(blocks, service)
	{
		for(const block of blocks)
		{
			if(block.id == service.id && block.letters == service.letters)
			{
				return true;
			}

			if(block.comparison != null && block.comparison.id == service.id && block.comparison.letters == service.letters)
			{
				return true;
			}
		}

		return false;
	}

	_includesTime(automation)
	{
		var blocks = this._getBlocks(automation.id);

		for(const block of blocks)
		{
			if(block.days != null || block.time != null)
			{
				return true;
			}
		}

		return false;
	}

	_checkLock(automation, service = {}, state = {})
	{
		return new Promise((resolve) => {

			var blocks = this._getBlocks(automation.id), promiseArray = [];

			for(const block of blocks)
			{
				if(this.stateLock[automation.id] != null
				&& this.stateLock[automation.id].trigger != null
				&& this.stateLock[automation.id].trigger[block.blockID] == true)
				{
					if((block.id == service.id && block.letters == service.letters) || (block.comparison != null && block.comparison.id == service.id && block.comparison.letters == service.letters) || block.days != null || block.time != null)
					{
						promiseArray.push(new Promise((callback) => {
							
							this._getComparison(automation, block, service, state).then((result) => {

								if(!this._getOutput(result.block, result.state))
								{
									this.stateLock[automation.id].trigger[block.blockID] = false;

									if(block.operation == '<')
									{
										this.logger.debug('Automation [' + automation.name + '] %automation_greater% ' + automation.id + ' ' + block.blockID);
									}
									else if(block.operation == '>')
									{
										this.logger.debug('Automation [' + automation.name + '] %automation_lower% ' + automation.id + ' ' + block.blockID);
									}
									else
									{
										this.logger.debug('Automation [' + automation.name + '] %automation_different% ' + automation.id + ' ' + block.blockID);
									}

									callback(true);
								}
								else
								{
									callback(false);
								}
							});
						}));
					}
				}
			}

			Promise.all(promiseArray).then((result) => resolve(result.includes(true)));
		});
	}

	_getComparison(automation, block, service, state)
	{
		const checkCharacteristics = (result) => {

			if(result.state instanceof Object && result.block instanceof Object)
			{
				if(result.block.characteristic instanceof Object)
				{
					var characteristic = Object.keys(result.block.characteristic)[0];

					result.state = {
						value : result.state[characteristic] + result.block.characteristic[characteristic]
					};
				}

				if(result.block.comparison instanceof Object && result.block.comparison.characteristic instanceof Object)
				{
					var characteristic = Object.keys(result.block.comparison.characteristic)[0];

					result.block.state = {
						value : result.block.state[characteristic] + result.block.comparison.characteristic[characteristic]
					};
				}
			}

			return result;
		};

		return new Promise((resolve) => {

			if(block.comparison != null)
			{
				if(block.id == service.id && block.letters == service.letters)
				{
					this._getState(automation, block.comparison).then((comparison) => {
				
						block.state = comparison;

						resolve(checkCharacteristics({ block, state }));
					});
				}
				else if(block.comparison.id == service.id && block.comparison.letters == service.letters)
				{
					this._getState(automation, block).then((comparison) => {
				
						block.state = state;

						resolve(checkCharacteristics({ block, state : comparison }));
					});
				}
				else
				{
					this._getState(automation, block).then((state) => {

						this._getState(automation, block.comparison).then((comparison) => {
				
							block.state = comparison;

							resolve(checkCharacteristics({ block, state }));
						});
					});
				}
			}
			else
			{
				if(block.id == service.id && block.letters == service.letters)
				{
					resolve(checkCharacteristics({ block, state }));
				}
				else
				{
					this._getState(automation, block).then((state) => resolve(checkCharacteristics({ block, state })));
				}
			}
		});
	}
}