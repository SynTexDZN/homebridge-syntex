var AutomationSystem = null, stateLock = {};

module.exports = class Logic
{
    constructor(automationSystem)
    {
        this.automation = [];

        AutomationSystem = automationSystem;

        this.timeInterval = setInterval(() => this.checkAutomation({ time : true, name : ('0' + new Date().getHours()).slice(-2) + ':' + ('0' + new Date().getMinutes()).slice(-2) }), 60000);
    }

    createAutomation(config)
    {
        this.automation.push(new Automation(config));
    }

    checkAutomation(service, state = {})
    {
        for(const automation of this.automation)
        {
            if(automation.active && automation.includesBlock(service))
            {
                const automationLogic = automation.logic, groups = [];

                for(const group of automation.groups)
                {
                    if(automationLogic == 'AND' || group.includesBlock(service))
                    {
                        groups.push(group);
                    }
                }

                this.checkGroup(groups, service, state).then((result) => {

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
                            if(result[i].output)
                            {
                                output = true;
                            }
                            
                            if(!result[i].locked)
                            {
                                locked = false;
                            }
                        }
                    }

                    if(output && !locked)
                    {
                        executeResult(automation, service, result);
                    }
                    
                    if(output && locked)
                    {
                        console.log(automation.automationID, automationLogic, output, 'LOCKED TRIGGER');
                    }

                    if(!output)
                    {
                        unlockAutomation(automation);

                        console.log(automation.automationID, automationLogic, output, 'FALSE');
                    }

                    if(!output && locked)
                    {
                        //console.log(automation.automationID, automationLogic, output, 'UNLOCK');
                    }
                });
            }
        }
    }

    checkGroup(groups, service, state)
    {
        var promiseArray = [];

        for(const group of groups)
        {
            const groupLogic = group.logic, blocks = [];

            for(const block of group.blocks)
            {
                if(groupLogic == 'AND' || block.includesBlock(service))
                {
                    blocks.push(block);
                }
            }

            promiseArray.push(new Promise((resolve) => this.checkBlock(blocks, service, state).then((result) => {

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
                        if(result[i].output)
                        {
                            output = true;
                        }
                        
                        if(!result[i].locked)
                        {
                            locked = false;
                        }
                    }
                }

                resolve({ output, locked, blocks });
            })));
        }

        return Promise.all(promiseArray);
    }

    checkBlock(blocks, service, state)
    {
        var promiseArray = [];

        for(const block of blocks)
        {
            promiseArray.push(block.getOutput(service, state));
        }

        return Promise.all(promiseArray);
    }
}

class Block
{
    constructor(automation, group, block)
    {
        this.comparisons = [];

        this.comparisons.push(block);

        this.automationID = automation.automationID;
        this.groupID = group.groupID;

        for(const x in block)
        {
            this[x] = block[x];
        }
    }

    isLocked()
    {
        if(this.options != null
        && this.options.stateLock == true)
        {
            if(stateLock[this.automationID] != null
            && stateLock[this.automationID].trigger != null
            && stateLock[this.automationID].trigger[this.blockID] == true)
            {
                return true;
            }
        }

        return false;
    }

    getOutput(service, state)
    {
        return new Promise((resolve) => {

            AutomationSystem._getComparison({ name : '???' }, this, service, state).then((result) => {

                var output = AutomationSystem._getOutput(result.block, result.state), locked = this.isLocked();
                
                if(!output && !locked)
                {
                    unlockTrigger(this);
                }

                resolve({ output, locked });
            });
        });
    }

    includesBlock(block)
    {
        for(const comparison of this.comparisons)
        {
            if(block.id != null && block.letters != null && comparison.id == block.id && comparison.letters == block.letters)
            {
                return true;
            }

            if((block.time != null && comparison.time != null) || (block.date != null && comparison.date != null))
            {
                return true;
            }
        }

        return false;
    }
}

class Group
{
    constructor(automation, group)
    {
        this.blocks = [];

        this.automationID = automation.automationID;
        this.groupID = group.groupID;

        this.logic = group.logic;

        for(const id in group.blocks)
        {
            this.blocks.push(new Block(automation, this, { ...group.blocks[id], blockID : this.groupID + '' + id }));
        }
    }

    includesBlock(block)
    {
        for(const i in this.blocks)
        {
            if(this.blocks[i].includesBlock(block))
            {
                return true;
            }
        }

        return false;
    }
}

class Automation
{
    constructor(automation)
    {
        this.groups = [];

        this.automationID = automation.id;

        this.name = automation.name;
        this.active = automation.active;

        this.options = automation.options;

        this.logic = automation.trigger.logic;

        for(const id in automation.trigger.groups)
        {
            this.groups.push(new Group(this, { ...automation.trigger.groups[id], groupID : id }));
        }

        this.result = automation.result;
    }

    includesBlock(block)
    {
        for(const i in this.groups)
        {
            if(this.groups[i].includesBlock(block))
            {
                return true;
            }
        }

        return false;
    }
}

function executeResult(automation, trigger, triggers)
{
    var groups = [], group = { blocks : [] }, delay = 0;

    for(const block of automation.result)
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

    var locked = stateLock[automation.automationID] != null && stateLock[automation.automationID].result == true, promiseArray = [];

    for(const group of groups)
    {
        for(const block of group.blocks)
        {
            promiseArray.push(new Promise((resolve) => setTimeout(() => {

                if((block.options != null && block.options.stateLock == false) || !locked)
                {
                    if(block.url != null)
                    {
                        fetchRequest(block.url).then((success) => resolve(success));
                    }
                    else if(block.id != null && block.letters != null && block.state != null)
                    {
                        if(block.bridge != null && block.port != null)
                        {
                            var url = 'http://' + block.bridge + ':' + block.port + '/devices?id=' + block.id + '&type=' + AutomationSystem.TypeManager.letterToType(block.letters[0]) + '&counter=' + block.letters.slice(1);

                            for(const x in block.state)
                            {
                                url += '&' + x + '=' + block.state[x];
                            }

                            fetchRequest(url).then((success) => resolve(success));
                        }
                        else
                        {
                            var state = { ...block.state };

                            AutomationSystem.EventManager.setOutputStream('changeHandler', { receiver : { id : block.id, letters : block.letters } }, state);
                        
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
            console.log('----------------> A', automation.name, automation.automationID, automation.logic, stateLock[automation.automationID]);

            lockAutomation(automation, triggers);

            console.log('----------------> B', automation.name, automation.automationID, automation.logic, stateLock[automation.automationID]);
        
            AutomationSystem.logger.log('success', trigger.id, trigger.letters, '[' + trigger.name + '] %automation_executed[0]% [' + automation.name + '] %automation_executed[1]%! ( ' + automation.automationID + ' )');
        }
        else
        {
            console.log(automation.automationID, automation.logic, 'LOCKED RESULT');
        }
    });
}

function lockAutomation(automation, triggers)
{
    if(automation.options == null || automation.options.stateLock != false)
    {
        if(stateLock[automation.automationID] == null)
        {
            stateLock[automation.automationID] = {};
        }

        stateLock[automation.automationID].result = true;
    }

    for(const trigger of triggers)
    {
        for(const block of trigger.blocks)
        {
            if(block.options != null && block.options.stateLock == true)
            {
                if(stateLock[automation.automationID] == null)
                {
                    stateLock[automation.automationID] = {};
                }
                
                if(stateLock[automation.automationID].trigger == null)
                {
                    stateLock[automation.automationID].trigger = {};
                }
                
                stateLock[automation.automationID].trigger[block.blockID] = true;
            }
        }
    }
}

function unlockAutomation(automation)
{
    if(stateLock[automation.automationID] != null && stateLock[automation.automationID].result == true)
    {
        stateLock[automation.automationID].result = false;
    }
}

function unlockTrigger(block)
{
    if(stateLock[block.automationID] != null && stateLock[block.automationID].trigger != null && stateLock[block.automationID].trigger[block.blockID] == true)
    {
        stateLock[block.automationID].trigger[block.blockID] = false;
    }
}

function fetchRequest(url)
{
    return new Promise((resolve) => {

        AutomationSystem.RequestManager.fetch(url, { timeout : 10000 }).then((response) => {
			
            if(response.data == null)
            {
                this.logger.log('error', '???ID???', '???LETTERS???', '[' + '???NAME???' + '] %request_result[0]% [' + url + '] %request_result[1]% [' + (response.status || -1) + '] %request_result[2]%: [' + (response.data || '') + ']', response.error || '');
            }

            resolve(response.data != null);
        });
    });
}