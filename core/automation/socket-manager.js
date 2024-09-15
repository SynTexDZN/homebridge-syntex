module.exports = class SocketManager
{
	constructor(platform)
	{
		this.sockets = [];
	}

	addSocket(socket, id, letters)
	{
		var found = false;

		for(const client of this.sockets)
		{
			if(client.socket == socket)
			{
				client.id = id;
				client.letters = letters;

				found = true;
			}
		}

		if(!found)
		{
			this.sockets.push({ socket, id, letters });
		}
	}

	updateSockets(id, letters, message)
	{
		for(const client of this.sockets)
		{
			if(client.id == id && client.letters == letters)
			{
				client.socket.send(JSON.stringify(message));
			}
		}
	}
}