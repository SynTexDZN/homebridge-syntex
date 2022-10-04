class DialogueManager
{
	constructor() {}

	SETUP(Query, Essentials)
	{
		this.Query = Query;
		this.Essentials = Essentials;
	}

	showRestartPanel(text)
	{
		var dialogue = {
			title : '%bridge.restart%',
			subtitle : text,
			buttons : [
				{
					text : '%menu.back%',
					close : true
				},
				{
					text : '%general.restart%',
					action : async () => {

						var btn = document.getElementById('dialogue').getElementsByClassName('button-area')[0].children[1].children[0];

						var overlays = {
							root : btn,
							id : 'restart',
							pending : { value : '%general.restarting% ..' },
							executeError : { value : '%general.restart_failed%!' },
							connectionError : { value : '%general.bridge_connection_error%!' }
						};

						if(await this.Query.complexFetch('/serverside/restart', 5000, 2, overlays, true) == 'Success')
						{
							await this.Essentials.newTimeout(200);

							if(await this.Essentials.checkRestart('/serverside/check-restart'))
							{
								this.Essentials.showOverlay(btn, this.Essentials.createSuccessOverlay('restart-result', '%general.restart_success%!'));
							}
							else
							{
								this.Essentials.showOverlay(btn, this.Essentials.createErrorOverlay('restart-result', '%general.restart_failed%!'));
							}

							await this.Essentials.newTimeout(2000);

							this.Essentials.closeDialogue();
						}
					}
				}
			]
		};

		this.Essentials.openDialogue(dialogue);
	}
}

export let Dialogues = new DialogueManager();