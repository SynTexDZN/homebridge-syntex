function hasTouch()
{
    return 'ontouchstart' in document.documentElement
        || navigator.maxTouchPoints > 0
        || navigator.msMaxTouchPoints > 0;
}

if(!hasTouch())
{
    try
    {
        for(var si in document.styleSheets)
        {
            var styleSheet = document.styleSheets[si];

            if(styleSheet.rules)
            {
                console.log(styleSheet);
                
                for(var ri = styleSheet.rules.length - 1; ri >= 0; ri--)
                {
                    if(styleSheet.rules[ri].selectorText && styleSheet.rules[ri].selectorText.includes(':hover'))
                    {
                        console.log(styleSheet.rules[ri].selectorText);

                        styleSheet.deleteRule(ri);
                    }
                }
            }
        }
    } catch (ex) {}
}