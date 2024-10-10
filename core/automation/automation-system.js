module.exports = class AutomationSystem
{
	constructor(platform, ActivityManager)
	{
		this.running = [];

		this.timeLock = {};
		this.stateLock = {};

		this.automation = [];

		this.files = platform.files;
		this.logger = platform.logger;

		this.EventManager = platform.EventManager;
		this.RequestManager = platform.RequestManager;

		this.ActivityManager = ActivityManager;

		this.TypeManager = ActivityManager.TypeManager;

		this.loadAutomation().then((data) => {

			if(data != null && Array.isArray(data) && data.length > 0)
			{
				this.loadLock().then((success) => {

					if(success)
					{
						for(const automation of data)
						{
							this.automation.push(new Automation(this, automation));
						}

						this.timeInterval = setInterval(() => this.checkAutomation({ time : true, name : ('0' + new Date().getHours()).slice(-2) + ':' + ('0' + new Date().getMinutes()).slice(-2) }), 60000);
					
						this.lockInterval = setInterval(() => {
		
							if(this.changed)
							{
								this.files.writeFile('automation/automation-lock.json', { timeLock : this.timeLock, stateLock : this.stateLock });
							}
		
						}, 10000);

						this.EventManager.setInputStream('updateAutomation', { source : this, external : true }, () => {

							this.loadAutomation().then((data) => {
			
								if(data != null && Array.isArray(data) && data.length > 0)
								{
									this.automation = [];

									for(const automation of data)
									{
										this.automation.push(new Automation(this, automation));
									}

									this.logger.log('success', 'automation', 'Automation', '%automation_load_success%!');
								}
							});
						});
		
						this.logger.log('success', 'automation', 'Automation', '%automation_load_success%!');
					}
				});
			}
		});
	}

	loadAutomation()
	{
		return new Promise((resolve) => {

			if(this.files.checkFile('automation/automation.json'))
			{
				this.files.readFile('automation/automation.json').then((data) => {

					resolve(data);

				}).catch(() => {
				
					this.logger.log('error', 'automation', 'Automation', '%automation_load_error%!');

					resolve(null);
				});
			}
			else
			{
				resolve(null);
			}
		});
	}

	loadLock()
	{
		return new Promise((resolve) => {

			if(this.files.checkFile('automation/automation-lock.json'))
			{
				this.files.readFile('automation/automation-lock.json').then((data) => {

					if(data instanceof Object)
					{
						this.timeLock = data.timeLock || {};
						this.stateLock = data.stateLock || {};
					}
					 
					resolve(data instanceof Object);

				}).catch(() => {

					this.logger.log('error', 'automation', 'Automation', '%automation_load_error%!');
	
					resolve(false);
				});
			}
			else
			{
				resolve(true);
			}
		});
	}

	checkAutomation(service)
	{
		for(const automation of this.automation)
		{
			if(automation.active && automation.includesBlock(service))
			{
				const automationLogic = automation.logic, groups = [];

				for(const group of automation.trigger)
				{
					if(automationLogic == 'AND' || group.includesBlock(service))
					{
						groups.push(group);
					}
				}

				this.checkGroup(groups, service).then((result) => {

					var output = automationLogic == 'AND', locked = automationLogic == 'OR';

					for(const i in result)
					{
						if(automationLogic == 'AND')
						{
							if(!result[i].output)
							{
								output = false;
							}
							
							if(result[i].locked)
							{
								locked = true;
							}
						}

						if(automationLogic == 'OR')
						{
							if(result[i].output && !result[i].locked)
							{
								output = true;
								locked = false;
							}
						}
					}

					if(output && !locked)
					{
						if(!automation.isLocked())
						{
							this.logger.debug('Automation [' + automation.name + '] %trigger_activated% ' + automation.automationID);

							automation.executeResult(service, result);
						}
					}
					
					if(output && locked)
					{
						console.log(automation.automationID, automationLogic, output, 'LOCKED TRIGGER');
					}

					if(!output)
					{
						automation.unlockAutomation();

						//console.log(automation.automationID, automationLogic, output, 'FALSE');
					}

					if(!output && locked)
					{
						//console.log(automation.automationID, automationLogic, output, 'UNLOCK');
					}
				});
			}
		}
	}

	checkGroup(groups, service)
	{
		var promiseArray = [];

		for(const group of groups)
		{
			const automationLogic = group.automation.logic, groupLogic = group.logic, blocks = [];

			for(const block of group.blocks)
			{
				if(automationLogic == 'AND' || groupLogic == 'AND' || block.includesBlock(service))
				{
					blocks.push(block);
				}
			}

			promiseArray.push(new Promise((resolve) => this.checkBlock(blocks).then((result) => {

				//console.log('checkGroup', group.automationID, blocks.length, result.length, groupLogic, result);

				var output = groupLogic == 'AND', locked = groupLogic == 'OR';

				for(const i in result)
				{
					if(groupLogic == 'AND')
					{
						if(!result[i].output)
						{
							output = false;
						}
						
						if(result[i].locked)
						{
							locked = true;
						}
					}

					if(groupLogic == 'OR')
					{
						if(result[i].output && !result[i].locked)
						{
							output = true;
							locked = false;
						}
					}
				}

				resolve({ output, locked, blocks });
			})));
		}

		return Promise.all(promiseArray);
	}

	checkBlock(blocks)
	{
		var promiseArray = [];

		for(const block of blocks)
		{
			promiseArray.push(block.getOutput());
		}

		return Promise.all(promiseArray);
	}
}

class Automation
{
	constructor(LogicManager, automation)
	{
		this.trigger = [];

		this.LogicManager = LogicManager;

		this.logger = LogicManager.logger;

		this.automationID = automation.id;

		this.name = automation.name;
		this.active = automation.active;

		this.options = automation.options;

		this.logic = automation.trigger.logic;

		for(const groupID in automation.trigger.groups)
		{
			this.trigger.push(new Group(this, { ...automation.trigger.groups[groupID], groupID }));
		}

		this.result = automation.result;
	}

	includesBlock(block)
	{
		for(const trigger of this.trigger)
		{
			if(trigger.includesBlock(block))
			{
				return true;
			}
		}

		return false;
	}

	isLocked()
	{
		if(this.options != null
		&& this.options.timeLock != null)
		{
			if(this.LogicManager.timeLock[this.automationID] != null
			&& this.LogicManager.timeLock[this.automationID] > new Date().getTime())
			{
				return true;
			}
		}

		return false;
	}

	lockAutomation()
	{
		if(this.options != null && this.options.timeLock != null)
		{
			this.LogicManager.timeLock[this.automationID] = new Date().getTime() + this.options.timeLock;
		}
		
		if(this.options == null || this.options.stateLock != false)
		{
			if(this.LogicManager.stateLock[this.automationID] == null)
			{
				this.LogicManager.stateLock[this.automationID] = {};
			}

			this.LogicManager.stateLock[this.automationID].result = true;
		}
	}

	unlockAutomation()
	{
		if(this.LogicManager.stateLock[this.automationID] != null && this.LogicManager.stateLock[this.automationID].result == true)
		{
			this.LogicManager.stateLock[this.automationID].result = false;

			this.logger.debug('Automation [' + this.name + '] %automation_different% ' + this.automationID);

			this.LogicManager.changed = true;
		}
	}

	executeResult(trigger, triggers)
	{
		var groups = [], group = { blocks : [] }, delay = 0;

		if(!this.LogicManager.running.includes(this.automationID))
		{
			this.LogicManager.running.push(this.automationID);

			for(const block of this.result)
			{
				if(block.delay != null)
				{
					if(group.blocks.length > 0)
					{
						groups.push(group);
					}

					delay += block.delay;

					group = { delay, blocks : [] };
				}
				else
				{
					group.blocks.push(block);
				}
			}

			if(group.blocks.length > 0)
			{
				groups.push(group);
			}

			var locked = this.LogicManager.stateLock[this.automationID] != null && this.LogicManager.stateLock[this.automationID].result == true, promiseArray = [];

			for(const group of groups)
			{
				for(const block of group.blocks)
				{
					promiseArray.push(new Promise((resolve) => setTimeout(() => {

						if((block.options != null && block.options.stateLock == false) || !locked)
						{
							if(block.url != null)
							{
								this.fetchRequest(block.url).then((success) => resolve(success));
							}
							else if(block.id != null && block.letters != null && block.state != null)
							{
								var state = { ...block.state };

								if(this.LogicManager.TypeManager.letterToType(block.letters[0]) == 'statelessswitch')
								{
									state.event = state.value;
									state.value = 0;
								}

								if(block.bridge != null && block.port != null)
								{
									var url = 'http://' + block.bridge + ':' + block.port + '/devices?id=' + block.id + '&type=' + this.LogicManager.TypeManager.letterToType(block.letters[0]) + '&counter=' + block.letters.slice(1);

									for(const x in state)
									{
										url += '&' + x + '=' + state[x];
									}

									this.fetchRequest(url).then((success) => resolve(success));
								}
								else
								{
									this.LogicManager.EventManager.setOutputStream('changeHandler', { receiver : { id : block.id, letters : block.letters } }, state);
								
									resolve(true);
								}
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

					}, group.delay || 0)));
				}
			}

			Promise.all(promiseArray).then((result) => {

				if(result.includes(true))
				{
					//console.log('A', this.name, this.automationID, this.logic, this.LogicManager.stateLock[this.automationID], result, triggers);

					this.lockAutomation();

					for(const trigger of triggers)
					{
						for(const block of trigger.blocks)
						{
							block.lockBlock();
						}
					}

					//console.log('B', this.name, this.automationID, this.logic, this.LogicManager.stateLock[this.automationID]);
				
					this.logger.log('success', trigger.id, trigger.letters, '[' + trigger.name + '] %automation_executed[0]% [' + this.name + '] %automation_executed[1]%! ( ' + this.automationID + ' )');
				
					this.LogicManager.changed = true;
				}
				else
				{
					console.log(this.automationID, this.logic, 'LOCKED RESULT');
				}

				this.LogicManager.running.splice(this.LogicManager.running.indexOf(this.automationID), 1);
			});
		}
	}

	fetchRequest(url)
	{
		return new Promise((resolve) => {

			this.LogicManager.RequestManager.fetch(url, { timeout : 10000 }).then((response) => {
				
				if(response.data == null)
				{
					this.logger.log('error', 'automation', 'Automation', '[' + this.name + '] %request_result[0]% [' + url + '] %request_result[1]% [' + (response.status || -1) + '] %request_result[2]%: [' + (response.data || '') + ']', response.error || '');
				}

				resolve(response.data != null);
			});
		});
	}
}

class Group
{
	constructor(automation, group)
	{
		this.blocks = [];

		this.automation = automation;

		this.automationID = automation.automationID;
		this.groupID = group.groupID;

		this.logic = group.logic;

		for(const blockID in group.blocks)
		{
			this.blocks.push(new Block(automation, this, { ...group.blocks[blockID], blockID : this.groupID + '' + blockID }));
		}
	}

	includesBlock(block)
	{
		for(const trigger of this.blocks)
		{
			if(trigger.includesBlock(block))
			{
				return true;
			}
		}

		return false;
	}
}

class Block
{
	constructor(automation, group, block)
	{
		this.automation = automation;

		this.logger = automation.logger;

		this.LogicManager = automation.LogicManager;

		this.automationID = automation.automationID;
		this.groupID = group.groupID;

		for(const x in block)
		{
			this[x] = block[x];
		}
	}

	includesBlock(block)
	{
		if(this.id != null && this.letters != null && this.id == block.id && this.letters == block.letters)
		{
			return true;
		}

		if(this.comparison != null && this.comparison.id != null && this.comparison.letters != null && this.comparison.id == block.id && this.comparison.letters == block.letters)
		{
			return true;
		}

		if((this.time != null && block.time != null) || (this.days != null && block.days != null))
		{
			return true;
		}

		return false;
	}

	isLocked()
	{
		if(this.options != null
		&& this.options.stateLock == true)
		{
			if(this.LogicManager.stateLock[this.automationID] != null
			&& this.LogicManager.stateLock[this.automationID].trigger != null
			&& this.LogicManager.stateLock[this.automationID].trigger[this.blockID] == true)
			{
				return true;
			}
		}

		return false;
	}

	lockBlock()
	{
		if(this.options != null && this.options.stateLock == true)
		{
			if(this.LogicManager.stateLock[this.automationID] == null)
			{
				this.LogicManager.stateLock[this.automationID] = {};
			}
			
			if(this.LogicManager.stateLock[this.automationID].trigger == null)
			{
				this.LogicManager.stateLock[this.automationID].trigger = {};
			}
			
			this.LogicManager.stateLock[this.automationID].trigger[this.blockID] = true;
		}
	}

	unlockBlock()
	{
		if(this.LogicManager.stateLock[this.automationID] != null
		&& this.LogicManager.stateLock[this.automationID].trigger != null
		&& this.LogicManager.stateLock[this.automationID].trigger[this.blockID] == true)
		{
			this.LogicManager.stateLock[this.automationID].trigger[this.blockID] = false;

			if(this.operation == '<')
			{
				this.logger.debug('Automation [' + this.automation.name + '] %automation_greater% ' + this.automation.automationID + ' ' + this.blockID);
			}
			else if(this.operation == '>')
			{
				this.logger.debug('Automation [' + this.automation.name + '] %automation_lower% ' + this.automation.automationID + ' ' + this.blockID);
			}
			else
			{
				this.logger.debug('Automation [' + this.automation.name + '] %automation_different% ' + this.automation.automationID + ' ' + this.blockID);
			}

			this.LogicManager.changed = true;
		}
	}

	getOutput()
	{
		return new Promise((resolve) => {

			this.getLogic().then((logic) => {

				this.solveLogic(logic);

				logic.locked = this.isLocked();
				
				if(!logic.output && logic.locked)
				{
					this.unlockBlock();
				}

				resolve(logic);
			});
		});
	}

	getLogic()
	{
		const checkCharacteristics = (block, state) => {

			if(block instanceof Object && block.characteristic instanceof Object && state instanceof Object)
			{
				for(const x in block.characteristic)
				{
					if(state[x] == null)
					{
						state = {};
					}
				}

				for(const x in state)
				{
					if(block.characteristic[x] != null)
					{
						state[x] += block.characteristic[x];
					}
					else
					{
						delete state[x];
					}
				}
			}

			return state;
		};

		return new Promise((resolve) => {

			var promiseArray = [], result = { I1 : {}, operation : this.operation, I2 : {} };
			
			if(this.id != null && this.letters != null)
			{
				promiseArray.push(new Promise((callback) => this.LogicManager.ActivityManager._getState(this).then((state) => {
					
					if(state != null)
					{
						result.I1 = checkCharacteristics(this, state);
					}
	
					callback();
				})));
			}

			if(this.comparison != null)
			{
				promiseArray.push(new Promise((callback) => this.LogicManager.ActivityManager._getState(this.comparison).then((state) => {
					
					if(state != null)
					{
						result.I2 = checkCharacteristics(this.comparison, state);
					}

					callback();
				})));
			}

			if(this.state != null)
			{
				result.I2 = this.state;
			}

			if(this.time != null)
			{
				result.I1.time = ('0' + new Date().getHours()).slice(-2) + ':' + ('0' + new Date().getMinutes()).slice(-2)
				result.I2.time = this.time;
			}

			if(this.days != null)
			{
				result.I1.days = new Date().getDay();
				result.I2.days = this.days;
			}

			Promise.all(promiseArray).then(() => resolve(result));
		});
	}

	solveLogic(logic)
	{
		logic.output = true;

		if(Object.keys(logic.I2).length == 0)
		{
			logic.output = false;
		}

		for(const x in logic.I2)
		{
			if(logic.I1[x] == null)
			{
				logic.output = false;
			}

			if(logic.I1.time != null)
			{
				var I1 = new Date(), I2 = new Date();

				I1.setHours(logic.I1.time.split(':')[0]);
				I1.setMinutes(logic.I1.time.split(':')[1]);
				I1.setSeconds(0);
				I1.setMilliseconds(0);
				
				I2.setHours(logic.I2.time.split(':')[0]);
				I2.setMinutes(logic.I2.time.split(':')[1]);
				I2.setSeconds(0);
				I2.setMilliseconds(0);

				logic.I1.time = I1.getTime();
				logic.I2.time = I2.getTime();
			}

			if(logic.I1.days != null)
			{
				logic.I2.days = logic.I2.days.includes(logic.I1.days) ? logic.I1.days : null;
			}

			if((logic.I1[x] <= logic.I2[x] && logic.operation == '>')
			|| (logic.I1[x] >= logic.I2[x] && logic.operation == '<')
			|| (logic.I1[x] != logic.I2[x] && logic.operation == '='))
			{
				logic.output = false;
			}
		}
	}
}