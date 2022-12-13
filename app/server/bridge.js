module.exports = class Bridge
{
    constructor(platform)
    {
        this.platform = platform;

        this.WebServer = platform.WebServer;

        this.infos = { ip : {}, mac : {} };

        this.getMac().then(() => this.initWebServer())
    }

    initWebServer()
    {
        this.WebServer.addPage('/serverside/bridge', async (request, response/*, params, content, post*/) => {
        
            this.infos.id = this.platform.bridgeID;

            this.getIP();

            response.end(JSON.stringify(this.infos));
        });
    }

    getIP()
    {
        const ifaces = require('os').networkInterfaces();

        for(var dev in ifaces)
        {
            var iface = ifaces[dev].filter((details) => {

                return details.family == 'IPv4' && details.internal == false;
            });

            for(const connection of iface)
            {
                for(const type in this.infos.mac)
                {
                    if(this.infos.mac[type] == connection.mac)
                    {
                        this.infos.ip[type] = connection.address;
                    }
                }
            }
        }
    }

    getMac()
    {
        const { exec } = require('child_process');

        const getMacAddress = (type) => {

            return new Promise((resolve) => {

                var path = { lan : 'eth0', wlan : 'wlan0' };

                exec('cat /sys/class/net/' + path[type] + '/address', (error, mac) => {

                    if(mac != null)
                    {
                        this.infos.mac[type] = mac.replace(/\s/g, '');
                    }
                    
                    resolve();
                });
            });
        };

        return new Promise((resolve) => {

            Promise.all([getMacAddress('lan'), getMacAddress('wlan')]).then(() => resolve());
        });
    }
}