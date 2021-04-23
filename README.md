# Homebridge SynTex UI
[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex?label=release&color=brightgreen)](https://www.npmjs.com/package/homebridge-syntex)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex/beta?color=orange&label=beta)](https://www.npmjs.com/package/homebridge-syntex)
[![GitHub Commits](https://badgen.net/github/commits/SynTexDZN/homebridge-syntex?color=yellow)](https://github.com/SynTexDZN/homebridge-syntex/commits)
[![NPM Downloads](https://badgen.net/npm/dt/homebridge-syntex?color=purple)](https://www.npmjs.com/package/homebridge-syntex)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex?color=0af)](https://github.com/SynTexDZN/homebridge-syntex)
[![Discord](https://img.shields.io/discord/442095224953634828?color=728ED5&label=discord)](https://discord.gg/XUqghtw4DE)

A simple UI to control and manage all of your homebridge accessory.<br>
Also it provides special features for SynTex plugins:<br>
`homebridge-syntex-magichome`, `homebridge-syntex-tuya`, `homebridge-syntex-webhooks`

## Core Fearures
- **Device Overfiew** ( *view and control their characteristics* )
- **Plugin Manager** ( *for information, updates and more* )
- **Colorful Log** ( *with filter tools and log level* )
- **Automation System** ( *faster and more stable than HomeKit automation* )


---


## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex`
3. Install the webhooks plugin using: `sudo npm install -g homebridge-syntex-webhooks`<br>
( *to enable all features of the UI* )
4. Update your configuration file. See snippet below.
5. Restart the Homebridge Service with: `sudo systemctl restart homebridge; sudo journalctl -fau homebridge`


## Example Config
**Important:** If the `logDirectory` and `cacheDirectory` for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge /var/homebridge/SynTex/` ( *permissions only for homebridge* )
- `sudo chmod 777 -R homebridge /var/homebridge/SynTex/` ( *permissions for many processes* )

```json
"platforms": [
    {
        "platform": "SynTex",
        "cacheDirectory": "/var/homebridge/SynTex/settings",
        "logDirectory": "/var/homebridge/SynTex/log",
        "port": 1711,
        "language": "us",
        "debug": false
    },
    {
        "platform": "SynTexWebHooks",
        "logDirectory": "/var/homebridge/SynTex/log",
        "automationDirectory": "/var/homebridge/SynTex/automation",
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

### SynTex WebHooks Config
Please visit GitHub for the config and other informations:<br>
https://github.com/SynTexDZN/homebridge-syntex-webhooks


---


## Currently Supported

### SynTex Devices
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
- Stateless Switch
- LED Controller
- Special Devices *( Doorbell, Multi-Device, .. )*

### Other Accessories
- Temperature Sensor
- Humidity Sensor
- Light Sensor
- Leak Sensor
- Motion Sensor
- Contact Sensor
- Smoke Sensor
- Occupancy Sensor
- Airquality Sensor
- Stateless Switch
- Switch / Relais / Outlet
- LED Lights / Dimmable Lights / RGB Lights