module.exports = class TypeManager
{
	constructor(platform)
	{
		this.services = [];

		this.logger = platform.logger;

		this.Characteristic = platform.api.hap.Characteristic;

		this.addServices([ AirQuality, Blind, ColoredBulb, Contact, DimmedBulb, Fan, Humidity, Leak, Light, LightBulb, Motion, Occupancy, Outlet, Relais, Smoke, StatelessSwitch, Switch, Temperature, Thermostat ]);
	}

	typeToLetter(type)
	{
		var service = this.getService({ type : type.startsWith('rgb') ? 'rgb' : type });

		if(service != null)
		{
			return service.letter;
		}

		return null;
	}

	letterToType(letters)
	{
		var service = this.getService({ letters });

		if(service != null)
		{
			return service.type;
		}

		return null;
	}

	getCharacteristic(type, options = {})
	{
		var service = this.getService(options);

		if(service != null)
		{
			if(service.characteristics[type] != null)
			{
				return service.characteristics[type];
			}
		}

		return null;
	}

	getCharacteristics(options = {})
	{
		var service = this.getService(options);
		
		if(service != null)
		{
			return service.characteristics;
		}

		return null;
	}

	addServices(services)
	{
		for(const Service of services)
		{
			this.services.push(new Service(this.Characteristic));
		}
	}

	getService(options = {})
	{
		for(const service of this.services)
		{
			if((typeof options.type == 'string' && options.type.toLowerCase() == service.type)
			|| (typeof options.letters == 'string' && options.letters[0].toUpperCase() == service.letter))
			{
				return service;
			}
		}

		return null;
	}

	validateUpdate(id, letters, state)
	{
		if(id != null && letters != null && state instanceof Object)
		{
			for(const x in state)
			{
				var characteristic = this.getCharacteristic(x, { letters });

				if(characteristic != null)
				{
					try
					{
						state[x] = JSON.parse(state[x]);
					}
					catch(e)
					{
						this.logger.log('warn', id, letters, '%conversion_error_parse[0]%: [' + state[x] + '] %conversion_error_parse[1]%! ( ' + id + ' )');

						return null;
					}
					
					if(typeof state[x] != characteristic.format)
					{
						this.logger.log('warn', id, letters, '%conversion_error_format[0]%: [' + state[x] + '] %conversion_error_format[1]% ' + (characteristic.format == 'boolean' ? '%conversion_error_format[2]%' : characteristic.format == 'number' ? '%conversion_error_format[3]%' : '%conversion_error_format[4]%') + ' %conversion_error_format[5]%! ( ' + id + ' )');

						return null;
					}
					
					if(characteristic.format == 'number')
					{
						var min = characteristic.min, max = characteristic.max;

						if(min != null && state[x] < min)
						{
							state[x] = min;
						}

						if(max != null && state[x] > max)
						{
							state[x] = max;
						}
					}
				}
			}
		}

		return state;
	}
}

class ServiceType
{
	constructor(type, letter)
	{
		this.characteristics = {};

		this.type = type;
		this.letter = letter;
	}

	addCharacteristic(type, format, characteristic, options = {})
	{
		this.characteristics[type] = { format, characteristic };

		if(format == 'boolean')
		{
			this.characteristics[type].default = false;
		}
		else if(format == 'number')
		{
			this.characteristics[type].default = 0;
		}

		for(const x in options)
		{
			this.characteristics[type][x] = options[x];
		}
	}
}

class Occupancy extends ServiceType
{
	constructor(Characteristic)
	{
		super('occupancy', '0');

		this.addCharacteristic('value', 'boolean', Characteristic.OccupancyDetected);
	}
}

class Smoke extends ServiceType
{
	constructor(Characteristic)
	{
		super('smoke', '1');

		this.addCharacteristic('value', 'boolean', Characteristic.SmokeDetected);
	}
}

class AirQuality extends ServiceType
{
	constructor(Characteristic)
	{
		super('airquality', '2');

		this.addCharacteristic('value', 'number', Characteristic.AirQuality, { min : 0, max : 5 });
	}
}

class ColoredBulb extends ServiceType
{
	constructor(Characteristic)
	{
		super('rgb', '3');

		this.addCharacteristic('value', 'boolean', Characteristic.On);
		this.addCharacteristic('hue', 'number', Characteristic.Hue, { min : 0, max : 360 });
		this.addCharacteristic('saturation', 'number', Characteristic.Saturation, { min : 0, max : 100, default : 100 });
		this.addCharacteristic('brightness', 'number', Characteristic.Brightness, { min : 0, max : 100, default : 100 });
	}
}

class Switch extends ServiceType
{
	constructor(Characteristic)
	{
		super('switch', '4');

		this.addCharacteristic('value', 'boolean', Characteristic.On);
	}
}

class Relais extends ServiceType
{
	constructor(Characteristic)
	{
		super('relais', '5');

		this.addCharacteristic('value', 'boolean', Characteristic.On);
	}
}

class StatelessSwitch extends ServiceType
{
	constructor(Characteristic)
	{
		super('statelessswitch', '6');

		this.addCharacteristic('value', 'number', Characteristic.ProgrammableSwitchEvent);
	}
}

class Outlet extends ServiceType
{
	constructor(Characteristic)
	{
		super('outlet', '7');

		this.addCharacteristic('value', 'boolean', Characteristic.On);
	}
}

class LightBulb extends ServiceType
{
	constructor(Characteristic)
	{
		super('led', '8');

		this.addCharacteristic('value', 'boolean', Characteristic.On);
	}
}

class DimmedBulb extends ServiceType
{
	constructor(Characteristic)
	{
		super('dimmer', '9');

		this.addCharacteristic('value', 'boolean', Characteristic.On);
		this.addCharacteristic('brightness', 'number', Characteristic.Brightness, { min : 0, max : 100, default : 100 });
	}
}

class Contact extends ServiceType
{
	constructor(Characteristic)
	{
		super('contact', 'A');

		this.addCharacteristic('value', 'boolean', Characteristic.ContactSensorState);
	}
}

class Motion extends ServiceType
{
	constructor(Characteristic)
	{
		super('motion', 'B');

		this.addCharacteristic('value', 'boolean', Characteristic.MotionDetected);
	}
}

class Temperature extends ServiceType
{
	constructor(Characteristic)
	{
		super('temperature', 'C');

		this.addCharacteristic('value', 'number', Characteristic.CurrentTemperature, { min : -270, max : 100 });
	}
}

class Humidity extends ServiceType
{
	constructor(Characteristic)
	{
		super('humidity', 'D');

		this.addCharacteristic('value', 'number', Characteristic.CurrentRelativeHumidity, { min : 0, max : 100 });
	}
}

class Leak extends ServiceType
{
	constructor(Characteristic)
	{
		super('rain', 'E');

		this.addCharacteristic('value', 'boolean', Characteristic.LeakDetected);
	}
}

class Light extends ServiceType
{
	constructor(Characteristic)
	{
		super('light', 'F');

		this.addCharacteristic('value', 'number', Characteristic.CurrentAmbientLightLevel, { min : 0.0001, max : 100000 , default : 0.0001});
	}
}

class Blind extends ServiceType
{
	constructor(Characteristic)
	{
		super('blind', 'G');

		this.addCharacteristic('value', 'number', Characteristic.CurrentPosition, { min : 0, max : 100 });
		this.addCharacteristic('target', 'number', Characteristic.TargetPosition, { min : 0, max : 100 });
		this.addCharacteristic('state', 'number', Characteristic.PositionState, { min : 0, max : 2, default : 2 });
	}
}

class Thermostat extends ServiceType
{
	constructor(Characteristic)
	{
		super('thermostat', 'H');

		this.addCharacteristic('value', 'number', Characteristic.CurrentTemperature, { min : -270, max : 100 });
		this.addCharacteristic('target', 'number', Characteristic.TargetTemperature, { min : 4, max : 36, default : 4 });
		this.addCharacteristic('state', 'number', Characteristic.CurrentHeatingCoolingState, { min : 0, max : 2 });
		this.addCharacteristic('mode', 'number', Characteristic.TargetHeatingCoolingState, { min : 1, max : 3, default : 3 });
		this.addCharacteristic('base', 'number', null, { min : 4, max : 36, default : 4 });
		this.addCharacteristic('offset', 'number', null, { min : -127, max : 128 });
	}
}

class Fan extends ServiceType
{
	constructor(Characteristic)
	{
		super('fan', 'I');

		this.addCharacteristic('value', 'boolean', Characteristic.On);
		this.addCharacteristic('speed', 'number', Characteristic.RotationSpeed, { min : 0, max : 100, default : 100 });
		this.addCharacteristic('direction', 'number', Characteristic.RotationDirection, { min : 0, max : 1 });
	}
}