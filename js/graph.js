class GraphManager
{
	constructor() {}

	setPadding(padding)
	{
		this.padding = padding;
	}

	drawGraph(canvas, data, gradients, points)
	{
		var ctx = canvas.getContext('2d');
		var height = canvas.offsetHeight - this.padding * 2 - 2;
		var width = canvas.offsetWidth - this.padding * 2;
		var grd = ctx.createLinearGradient(0, this.padding, 0, (height + this.padding * 2 + 2) - this.padding);

		for(var i = 0; i < gradients.length; i++)
		{
			grd.addColorStop(i / (gradients.length - 1), gradients[i]);
		}

		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.strokeStyle = grd;
		ctx.setLineDash([]);

		for(var i = 1; i < data.length; i++)
		{
			if(points)
			{
				ctx.fillStyle = gradients[0];
				ctx.beginPath();
				ctx.arc((i - 1) * (width + this.padding * 2) / (data.length - 1), height - data[i - 1] * height / 100 + this.padding, 10, 0, 360);
				ctx.fill();
				ctx.closePath();
				ctx.fillStyle = gradients[1];
				ctx.beginPath();
				ctx.arc((i - 1) * (width + this.padding * 2) / (data.length - 1), height - data[i - 1] * height / 100 + this.padding, 5, 0, 360);
				ctx.fill();
				ctx.closePath();
			}

			ctx.beginPath();
			ctx.moveTo((i - 1) * (width + this.padding * 2) / (data.length - 1), height - data[i - 1] * height / 100 + this.padding);
			ctx.lineTo(i * (width + this.padding * 2) / (data.length - 1), height - data[i] * height / 100 + this.padding);
			ctx.stroke();

			if(points)
			{
				ctx.fillStyle = gradients[0];
				ctx.beginPath();
				ctx.arc((i - 1) * (width + this.padding * 2) / (data.length - 1), height - data[data.length - 1] * height / 100 + this.padding, 10, 0, 360);
				ctx.fill();
				ctx.closePath();
				ctx.fillStyle = gradients[1];
				ctx.beginPath();
				ctx.arc((i - 1) * (width + this.padding * 2) / (data.length - 1), height - data[data.length - 1] * height / 100 + this.padding, 5, 0, 360);
				ctx.fill();
				ctx.closePath();
			}
		}
	}

	drawFill(canvas, data, gradients, smoothing)
	{
		var ctx = canvas.getContext('2d');
		var height = canvas.offsetHeight - this.padding * 2 - 2;
		var width = canvas.offsetWidth - this.padding * 2;
		var grd = ctx.createLinearGradient(0, this.padding, 0, (height + this.padding * 2 + 2) - this.padding);

		for(var i = 0; i < gradients.length; i++)
		{
			grd.addColorStop(i / (gradients.length - 1), gradients[i]);
		}

		ctx.fillStyle = grd;
		ctx.setLineDash([]);

		ctx.beginPath();
		ctx.moveTo(0, height + this.padding);
		ctx.lineTo(0, height - data[0] * height / 100 + this.padding);

		for(var i = 1; i < data.length; i++)
		{
			if(smoothing == 0)
			{
				ctx.lineTo(i * (width + this.padding * 2) / (data.length - 1), height - data[i] * height / 100 + this.padding);
			}
			else
			{
				ctx.bezierCurveTo(i * (width + this.padding * 2) / (data.length - 1) - width / smoothing / (data.length - 1), height - data[i - 1] * multiplicator, i * width / (data.length - 1) + this.padding - width / smoothing / (data.length - 1), height - data[i] * multiplicator - this.padding , i * width / (data.length - 1) + this.padding, height - data[i] * multiplicator - this.padding ); // FIXME: Graph Smoothing Improvements
			}
		}

		ctx.lineTo((data.length - 1) * (width + this.padding * 2) / (data.length - 1), height + this.padding);

		ctx.closePath();
		ctx.fill();
	}

	drawGrid(canvas, data, unterteilungen)
	{
		var ctx = canvas.getContext('2d');
		var height = canvas.offsetHeight - this.padding * 2 - 2;
		var width = canvas.offsetWidth - this.padding * 2;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.lineCap = 'butt';
		ctx.lineWidth = 1.5;
		ctx.setLineDash([]);

		for(var i = 0; i < unterteilungen + 1; i++) // IDEA: Auto Adjust Graph Grid to Data
		{
			ctx.strokeStyle = 'rgb(25, 25, 35)';

			if(i == unterteilungen || i == 0)
			{
				ctx.strokeStyle = 'rgb(50, 50, 70)';
			}

			ctx.beginPath();
			ctx.moveTo(0, this.padding + (height / unterteilungen) * i);
			ctx.lineTo(width + this.padding * 2, this.padding + (height / unterteilungen) * i)
			ctx.stroke();
		}

		for(var i = 0; i < 25; i++)
		{
			ctx.strokeStyle = 'rgb(40, 40, 55)';
			
			if(i == 24 || i == 0)
			{
				ctx.strokeStyle = 'rgba(255, 255, 255, 0)';
			}
			
			ctx.beginPath();
			ctx.moveTo(i * (width + this.padding * 2) / 24, this.padding);
			ctx.lineTo(i * (width + this.padding * 2) / 24, height + this.padding);
			ctx.stroke();
		}
		/*
		if(data.length < 75)
		{
			for(var i = 0; i < data.length; i++)
			{
				ctx.strokeStyle = 'rgb(40, 40, 55)';
				
				if(i == data.length - 1 || i == 0)
				{
					ctx.strokeStyle = 'rgba(255, 255, 255, 0)';
				}
				
				ctx.beginPath();
				ctx.moveTo(i * (width + this.padding * 2) / (data.length - 1), this.padding);
				ctx.lineTo(i * (width + this.padding * 2) / (data.length - 1), height + this.padding);
				ctx.stroke();
			}
		}
		*/
	}

	drawEvents(canvas, data, gradients)
	{
		var ctx = canvas.getContext('2d');
		var height = canvas.offsetHeight - this.padding * 2 - 2;
		var width = canvas.offsetWidth - this.padding * 2;
		var grd = ctx.createLinearGradient(0, this.padding, 0, (height + this.padding * 2 + 2) - this.padding);

		for(var i = 0; i < gradients.length; i++)
		{
			grd.addColorStop(i / (gradients.length - 1), gradients[i]);
		}

		ctx.fillStyle = grd;
		ctx.lineCap = 'butt';
		ctx.lineWidth = 1.5;
		ctx.setLineDash([]);

		for(var i = 1; i < data.length; i++)
		{
			if(data[i - 1] != -1)
			{
				ctx.beginPath();
				ctx.arc((i - 1) * (width + this.padding * 2) / (data.length - 1), height - data[i - 1] * height / 100 + this.padding, 4, 0, 360);
				ctx.fill();
				ctx.closePath();
			}
		}
	}

	drawAutomation(canvas, data)
	{
		var ctx = canvas.getContext('2d');
		var height = canvas.offsetHeight - this.padding * 2 - 2;
		var width = canvas.offsetWidth - this.padding * 2;

		ctx.lineCap = 'butt';
		ctx.lineWidth = 1.5;
		ctx.setLineDash([10, 15]);

		for(var i = 0; i < data.length; i++)
		{
			ctx.strokeStyle = 'rgba(80, 80, 90, 0.5)';

			ctx.beginPath();
			ctx.moveTo(0, height - data[i] * height / 100 + this.padding);
			ctx.lineTo(width + this.padding * 2, height - data[i] * height / 100 + this.padding)
			ctx.stroke();
		}
	}
}

export let Graph = new GraphManager();