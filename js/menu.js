var win, app, frame, BrowserWindow, path, url;
var openedMenus = [];
var isFullScreen = false;
var isMaximized = false;

try
{
    frame = require('electron').webFrame;

    const { remote } = require('electron');
    path = require('path');
    url = require('url');

    if(remote != undefined)
    {
        win = remote.getCurrentWindow();
        app = remote.app;
        BrowserWindow = remote.BrowserWindow;

        var title = document.getElementsByTagName('title')[0];

        if(title != null)
        {
            document.getElementById('menu-title').innerHTML = title.innerHTML;
        }

        document.getElementById('close').onclick = function()
        {
            closeWindow();
        };

        document.getElementById('minimize').onclick = function()
        {
            win.minimize();
        };

        document.getElementById('maximize').onclick = function()
        {
            if(!isMaximized && !isFullScreen)
            {
                win.maximize();
                win.resizable = false;
                document.getElementsByTagName('html')[0].className = 'maximized';
                isMaximized = true;
            }
            else
            {
                win.unmaximize();
                win.resizable = true;
                document.getElementsByTagName('html')[0].className = '';
                isMaximized = false;
                isFullScreen = false;
            }
        };

        window.addEventListener('keyup', (event) => {
            
            if(event.key == 'F12')
            {
                fullScreen();
            }
            else if(event.key == 'F5')
            {
                window.location.reload();
            }
            else if(event.key == 'q' && event.ctrlKey)
            {
                closeApp();
            }
            else if(event.key == 'w' && event.ctrlKey)
            {
                closeWindow();
            }
            else if(event.key == 'o' && event.ctrlKey)
            {
                openConnectWindow();
            }
            else if(event.key == '+' && event.ctrlKey)
            {
                zoomInWindow();
            }
            else if(event.key == '-' && event.ctrlKey)
            {
                zoomOutWindow();
            }
        });
    }
}
catch(e)
{
    console.warn('No App Detected');
}

function openMenuDropdown(menus, id, parent)
{
    if(openedMenus.length > 0)
    {
        if(openedMenus[0] != id)
        {
            closeMenuDropdown(openedMenus[0]);

            setTimeout(() => {

                openMenuDropdown(menus, id, parent);
            }, 100);
        }
        else
        {
            closeMenuDropdown(openedMenus[0]);
        }
    }
    else if(!openedMenus.includes(id))
    {
        if(document.getElementById('menu-' + id) == null)
        {
            var menuDropdown = document.createElement('div');

            menuDropdown.className = 'menu-dropdown';
            menuDropdown.id = 'menu-' + id;

            for(var i = 0; i < menus.length; i++)
            {
                var menuElement = document.createElement('span');

                menuElement.innerHTML = menus[i].name;
                menuElement.onclick = function()
                {
                    this.callback();

                    closeMenuDropdown(id);

                }.bind({ id: id, callback: menus[i].callback });

                menuDropdown.appendChild(menuElement);
            }

            parent.parentElement.appendChild(menuDropdown);

            setTimeout(() => {

                parent.parentElement.id = 'dropdown-active';
                /*
                menuDropdown.style.opacity = 1;
                menuDropdown.style.top = 'var(--menu-height)';
                */
            }, 10);
        }
        else
        {
            document.getElementById('menu-' + id).parentElement.id = 'dropdown-active';
        }

        openedMenus.push(id);
    }
    else
    {
        //closeMenuDropdown(id);
    }
}

function closeMenuDropdown(id)
{
    /*
    document.getElementById('menu-' + id).style.opacity = 0;
    document.getElementById('menu-' + id).style.top = '35px';
    */
    document.getElementById('menu-' + id).parentElement.id = '';

    setTimeout(() => {

        //document.getElementById('menu-' + id).parentElement.removeChild(document.getElementById('menu-' + id));
    }, 200);

    openedMenus.splice(openedMenus.indexOf(id), 1);
}

function closeWindow()
{
    if(win.getParentWindow() != null)
    {
        win.getParentWindow().focus();
    }

    win.close();
}

function closeApp()
{
    app.quit();
}

function fullScreen()
{
    if(!isFullScreen)
    {
        win.fullScreen = true;
        win.resizable = false;
        isFullScreen = true;
        document.getElementsByTagName('html')[0].className = 'maximized';
    }
    else
    {
        win.unmaximize();
        win.resizable = true;
        isFullScreen = false;
        document.getElementsByTagName('html')[0].className = '';
    }
}

function zoomInWindow()
{
    frame.setZoomFactor(frame.getZoomFactor() + 0.1);
}

function zoomOutWindow()
{
    frame.setZoomFactor(frame.getZoomFactor() - 0.1);
}

function resetZoom()
{
    frame.setZoomFactor(1);
}

function openDevTools()
{
    win.openDevTools({ detach : true });
}

var connectWindow = null;

function openConnectWindow()
{
    connectWindow = new BrowserWindow({

        width: 750,
        height: 350,
        frame: false,
        transparent: true,
        center: true,
        backgroundColor: '#00ffffff',
        icon: __dirname + '/favicon.ico',
        parent: win,
        show: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    connectWindow.loadURL(url.format({

        pathname : '/connect.html',
        protocol: 'file:',
        slashes: true
    }));
    
    connectWindow.once('ready-to-show', () => {

        connectWindow.show();
    });
}