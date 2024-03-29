# Homebridge SynTex UI
[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex?label=release&color=brightgree&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex/beta?color=orange&label=beta&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex)
[![NPM Downloads](https://img.shields.io/npm/dt/homebridge-syntex?color=9944ee&&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex)
[![GitHub Commits](https://img.shields.io/github/commits-since/SynTexDZN/homebridge-syntex/2.0.1?color=yellow&label=commits&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex/commits)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex?color=0af&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex)

A simple UI to control and manage all of your homebridge accessory.<br>
Also it provides special features for SynTex plugins:
- `homebridge-syntex-knx`
- `homebridge-syntex-magichome`
- `homebridge-syntex-tuya`
- `homebridge-syntex-webhooks`


## Core Fearures
- **Device Overview** *( view and control their characteristics )*
- **Plugin Manager** *( for information, updates and more )*
- **Colorful Log** *( with filter tools and log level )*
- **Automation System** *( faster and more stable than HomeKit automation )*
- **Remote Link** *( app with offline mode and connection outside the local network )*


## Troubleshooting
#### [![GitHub Issues](https://img.shields.io/github/issues-raw/SynTexDZN/homebridge-syntex?logo=github&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex/issues)
- `Report` us your `Issues`
- `Join` our `Discord Server`
#### [![Discord](https://img.shields.io/discord/442095224953634828?color=5865F2&logoColor=white&label=discord&logo=discord&style=for-the-badge)](https://discord.gg/XUqghtw4DE)


---


## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex`
3. Install the webhooks plugin using: `sudo npm install -g homebridge-syntex-webhooks`<br>
*( to enable all features of the UI )*
4. Update your `config.json` file. See snippet below.
5. Restart the Homebridge Service with: `sudo systemctl restart homebridge; sudo journalctl -fau homebridge`


## Example Config
**Info:** If the `baseDirectory` for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo mkdir -p /var/homebridge/SynTex/` *( create the directory )*
- `sudo chown -R homebridge /var/homebridge/SynTex/` *( permissions only for homebridge )*
- `sudo chmod 777 -R homebridge /var/homebridge/SynTex/` *( permissions for many processes )*

```json
"platforms": [
    {
        "platform": "SynTex",
        "baseDirectory": "/var/homebridge/SynTex",
        "options": {
            "port": 1711,
            "language": "us",
            "remote": false,
            "password": "1234",
            "refresh": 60000
        },
        "log": {
            "debug": false
        }
    },
    {
        "platform": "SynTexWebHooks",
        "baseDirectory": "/var/homebridge/SynTex",
        "options": {
            "port": 1710,
            "language": "us"
        },
        "log": {
            "debug": false
        },
        "accessories": []
    }
]
```

### Required Parameters
- `platform` is always `SynTex`
- `baseDirectory` The path where your data and logs are stored.

### Optional Parameters
- `port` To access the bridge website.
- `language` You can use your country initials if you want to change it *( Currently supported: `us`, `en`, `de` )*
- `debug` For further information because of troubleshooting and bug reports.
- `remote` To control your devices on the go with the enhanced offline app without port forwarding. *( Currently in beta, more information soon )*
- `password` To protect your remote connection against strangers. *( Only needed when `remote` is enabled )*
- `refresh` Sets the update interval for device states. *( 0 = only refresh on restart )*

### SynTex WebHooks Config
Please visit the `Homebridge SynTex WebHooks` README file for the config and further information:<br>
https://github.com/SynTexDZN/homebridge-syntex-webhooks#readme


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
- Window Coverings
- Heating / Cooling Thermostate