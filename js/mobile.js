class MobileManager
{
	constructor()
	{
		if(this.hasTouch())
		{
			this.enableStyleSheet();
		}
	}

	hasTouch()
	{
		return 'ontouchstart' in document.documentElement || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
	}

	enableStyleSheet()
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
						if(styleSheet.rules[ri].selectorText && styleSheet.rules[ri].selectorText.includes(':hover'))
						{
							styleSheet.deleteRule(ri);
						}
						else if(styleSheet.rules[ri].cssRules)
						{
							for(var rj = styleSheet.rules[ri].cssRules.length - 1; rj >= 0; rj--)
							{
								if(styleSheet.rules[ri].cssRules[rj].selectorText && styleSheet.rules[ri].cssRules[rj].selectorText.includes(':hover'))
								{
									styleSheet.rules[ri].deleteRule(rj);
								}
							}
						}
					}
				}
			}
		}
		catch(e)
		{
			console.error(e);
		}
	}
}

new MobileManager();