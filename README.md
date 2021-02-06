# Homebridge SynTex
A plugin to control SynTex accessory.<br>
It offers an UI to manage all your SynTex Plugins *( `homebridge-syntex-magichome`, `homebridge-syntex-tuya`, `homebridge-syntex-webhooks` )*

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
5. Restart the Homebridge Service with: `sudo systemctl restart homebridge; sudo journalctl -fau homebridge`


## Example Config
**Info:** If the `logDirectory` for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge ./SynTex/` ( *permissions only for homebridge* )
- `sudo chmod 777 -R homebridge ./SynTex/` ( *permissions for many processes* )

```json
"platforms": [
    {
        "platform": "SynTex",
        "cacheDirectory": "./SynTex/settings",
        "logDirectory": "./SynTex/log",
        "port": 1711,
        "language": "us",
        "debug": false
    },
    {
        "platform": "SynTexWebHooks",
        "logDirectory": "./SynTex/log",
        "automationDirectory": "./SynTex/automation",
        "port": 1710,
        "language": "us",
        "debug": false,
        "accessories": []
    }
]
```
### Required Parameters
- `platform` is always `SynTex`
- `logDirectory` The path where your logs are stored.
- `cacheDirectory` The path where your data is stored.
- `port` To access the bridge website.

### Optional Parameters
- `language` You can use your country initials if you want to change it *( Currently supported: `us`, `en`, `de` )*
- `debug` For further information because of troubleshooting and bug reports.


---


## Currently Supported
- Climate Sensor
- Temperature Sensor
- Humidity Sensor
- Weather Sensor
- Light Sensor
- Rain Sensor
- Motion Sensor
- Contact Sensor
- Occupancy Sensor
- Relais
- Switch
- Stateless Switch
- LED Controller
- Special Devices *( Doorbell, Multi-Device )*
