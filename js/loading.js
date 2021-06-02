var loadFinished = false, scriptsFinished = false;

class PreloadOverlay
{
	constructor()
	{
		window.addEventListener('load', () => {

			loadFinished = true;
			
			removePreloader();
		});
	}

	load()
	{
		scriptsFinished = false;
	}

	finish()
	{
		scriptsFinished = true;

		removePreloader();
	}
}

function removePreloader()
{
	if(document.getElementById('preloader') != null && scriptsFinished && loadFinished)
	{
		document.getElementById('preloader').style.opacity = 0;
		document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.transition = '.2s';
		document.getElementById('preloader').getElementsByClassName('loader-4')[0].style.opacity = 0;
		
		setTimeout(() => { document.getElementById('preloader').style.pointerEvents = 'none' }, 200);
	}
}

export let Preloader = new PreloadOverlay();