# Homebridge Syntex
A plugin to control SynTex accessory.


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
        "port": 1711,
        "cache_directory": "./SynTex/"
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
- Plugin got seperated to webhook service and syntex device control


# Soon
Stateless switches & other switch types.