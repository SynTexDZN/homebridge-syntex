# homebridge-syntex
A plugin to control SynTex accessory and to create HTTP devices.


# Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex`
3. Update your configuration file. See snippet below.


# Example Config
**INFO:** If the directory for the storage can't be created you have to do it by yourself and give it full write permissions!
```
"platforms": [
    {
        "platform": "SynTex",
        "port": 1710,
        "cache_directory": "./SynTex/",
        "sensors": [],
        "switches": []
    }
]
```


# Currently Supported
- Temperature / Humidity Sensor
- Light / Rain Sensor
- Motion Sensor
- Contact Sensor
- Relais
- Switch


# New in this Version
- No need for the Webhook Plugin. I wrote my own service for that.
- Relais / Switches


# Soon
Stateless switches & other switch types.