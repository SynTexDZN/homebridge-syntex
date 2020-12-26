# Homebridge SynTex
A plugin to control SynTex accessory.<br>
It offers an UI to manage all your SynTex Plugins.

[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex?label=release&color=brightgreen)](https://www.npmjs.com/package/homebridge-syntex)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex/beta?color=orange&label=beta)](https://www.npmjs.com/package/homebridge-syntex)
[![GitHub Commits](https://badgen.net/github/commits/SynTexDZN/homebridge-syntex?color=yellow)](https://github.com/SynTexDZN/homebridge-syntex/commits)
[![NPM Downloads](https://badgen.net/npm/dt/homebridge-syntex?color=purple)](https://www.npmjs.com/package/homebridge-syntex)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex?color=0af)](https://github.com/SynTexDZN/homebridge-syntex)
[![Discord](https://img.shields.io/discord/442095224953634828?color=728ED5&label=discord)](https://discord.gg/XUqghtw4DE)

<br>

## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex`
3. Install the webhooks plugin using: `sudo npm install -g homebridge-syntex-webhooks`
4. Update your configuration file. See snippet below.


## Example Config
**Info:** If the directory for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge ./SynTex/` ( *permissions only for homebridge* )
- `sudo chmod 777 -R homebridge ./SynTex/` ( *permissions for many processes* )

```
"platforms": [
	{
		"platform": "SynTex",
		"cache_directory": "./SynTex/settings",
		"log_directory": "./SynTex/log",
		"port": 1711
	},
	{
		"platform": "SynTexWebHooks",
		"cache_directory": "./SynTex/devices",
		"log_directory": "./SynTex/log",
		"port": 1710,
		"accessories": []
	}
]
```


## Currently Supported
- Climate Sensor
- Temperature Sensor
- Humidity Sensor
- Weather Sensor
- Light Sensor
- Rain Sensor
- Motion Sensor
- Contact Sensor
- Relais
- Switch
- LED Controller
- Special Devices
