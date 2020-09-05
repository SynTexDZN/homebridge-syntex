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

            if(styleSheet.rules && styleSheet.href)
            {
                for(var ri = styleSheet.rules.length - 1; ri >= 0; ri--)
                {
                    console.log(ri, styleSheet.rules[ri], styleSheet.rules[ri].selectorText && styleSheet.rules[ri].selectorText.includes(':hover'));

                    if(styleSheet.rules[ri].selectorText && styleSheet.rules[ri].selectorText.includes(':hover'))
                    {
                        styleSheet.deleteRule(ri);
                    }
                    else if(styleSheet.rules[ri].cssRules)
                    {
                        for(var rj = styleSheet.rules[ri].cssRules.length - 1; rj >= 0; rj--)
                        {
                            console.log(ri, rj, styleSheet.rules[ri].cssRules[rj], styleSheet.rules[ri].cssRules[rj].selectorText && styleSheet.rules[ri].cssRules[rj].selectorText.includes(':hover'));

                            if(styleSheet.rules[ri].cssRules[rj].selectorText && styleSheet.rules[ri].cssRules[rj].selectorText.includes(':hover'))
                            {
                                //styleSheet.rules[ri].cssRules.deleteRule(rj);
                            }
                        }
                    }
                }
            }
        }
    } catch (ex) {}
}