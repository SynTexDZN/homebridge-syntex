var desktopAppEnabled = false;

try
{
    const { remote } = require('electron');

    if(remote != undefined)
    {
        var win = remote.getCurrentWindow();

        desktopAppEnabled = true;

        document.getElementById('close').onclick = function()
        {
            win.close();
        };

        document.getElementById('minimize').onclick = function()
        {
            win.minimize();
        };

        var isFullScreen = false;
        var isMaximized = false;

        window.addEventListener('keyup', (event) => {
            
            if(event.key == 'F12')
            {
                if(!isFullScreen)
                {
                    win.fullScreen = true;
                    isFullScreen = true;
                    document.getElementsByTagName('html')[0].className = 'maximized';
                }
                else
                {
                    win.unmaximize();
                    isFullScreen = false;
                    document.getElementsByTagName('html')[0].className = '';
                }
            }
        });

        document.getElementById('maximize').onclick = function()
        {
            if(!isMaximized && !isFullScreen)
            {
                win.maximize();
                isMaximized = true;
                document.getElementsByTagName('html')[0].className = 'maximized';
            }
            else
            {
                win.unmaximize();
                isMaximized = false;
                isFullScreen = false;
                document.getElementsByTagName('html')[0].className = '';
            }
        };
    }
}
catch(e)
{
    console.warn('No App Detected');
}