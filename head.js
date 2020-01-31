function getHead()
{
    var html = "<head>";
        html += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
        html += '<meta name="mobile-web-app-capable" content="yes">';
        html += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=0.65, user-scalable=no, viewport-fit=cover">';
        html += '<meta name="apple-mobile-web-app-title" content="SmartLock Control">';
        html += '<meta name="apple-mobile-web-app-capable" content="yes">';
        html += '<link rel="apple-touch-icon" href="https://syntex.sytes.net/img/logo-180.png" sizes="180x180">';
        html += '<link rel="apple-touch-icon" href="https://syntex.sytes.net/img/logo-196.png" sizes="196x196">';
        html += '<link rel="apple-touch-icon" href="https://syntex.sytes.net/img/logo.png">';
        html += '<link rel="apple-touch-startup-image" href="https://syntex.sytes.net/img/splashscreen.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">';
        html += '<link rel="apple-touch-startup-image" href="https://syntex.sytes.net/img/splashscreen.png" media="(min-device-width: 1024px) and (max-device-width: 2048) and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait)">';
        html += '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">';
        html += '<link rel="stylesheet" type="text/css" href="/style/main.css?rnd=' + Math.random() * 10000000; + '" media="screen" />';
        html += '<script src="/js/jquery.min.js"></script>';
        html += '</head>';
    
    return html;
}