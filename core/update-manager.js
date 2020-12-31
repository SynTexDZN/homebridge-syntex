const request = require('request');

module.exports = class UpdateManager
{
    constructor(interval)
    {
        this.updateInterval = setInterval(() => {

            this.fetchUpdates();

        }, interval * 1000);
    }

    fetchUpdates()
    {
        var theRequest = {
            method : 'GET',
            url : 'http://syntex.sytes.net/smarthome/check-version.php',
            timeout : 10000
        };

        request(theRequest, (error, response, body) => {

            console.log(body);
        });
    }
}