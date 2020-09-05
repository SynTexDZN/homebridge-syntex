function hasTouch()
{
    return 'ontouchstart' in document.documentElement
        || navigator.maxTouchPoints > 0
        || navigator.msMaxTouchPoints > 0;
}

if(hasTouch())
{
    alert('Touch Gerät');

    try
    {
        for(var si in document.styleSheets)
        {
            var styleSheet = document.styleSheets[si];

            alert(styleSheet);

            if(!styleSheet.rules) continue;

            for(var ri = styleSheet.rules.length - 1; ri >= 0; ri--)
            {
                if(!styleSheet.rules[ri].selectorText) continue;

                if(styleSheet.rules[ri].selectorText.match(':hover'))
                {
                    styleSheet.deleteRule(ri);
                }
            }
        }
    } catch (ex) {}
}