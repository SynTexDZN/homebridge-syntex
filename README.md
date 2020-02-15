# Homebridge SynTex
A plugin to control SynTex accessory.


# Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex`
3. Install this plugin using: `sudo npm install -g homebridge-syntex-webhooks`
4. Update your configuration file. See snippet below.


# Example Config
**INFO:** If the directory for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge ./SynTex/` ( *permissions only for homebridge* )
- `sudo chmod 777 -R homebridge ./SynTex/` ( *permissions for many processes* )

```
"platforms": [
    {
        "platform": "SynTex",
        "cache_directory": "./SynTex/data",
        "port": 1711
    },
    {
        "platform": "SynTexWebHooks",
        "port": 1710,
        "cache_directory": "./SynTex/",
        "sensors": [],
        "switches": [],
        "lights": []
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
- LED Controller