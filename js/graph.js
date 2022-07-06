let self;

class GraphManager
{
	constructor() {}

	setPadding(padding)
	{
		this.padding = padding;

		self = this;
	}

	drawGraph(canvas, data, gradients, points)
	{
		if(data.join().replace(/,/g, '').length > 0)
		{
			var ctx = canvas.getContext('2d'), width = canvas.offsetWidth;
			var grd = ctx.createLinearGradient(0, this.getPoint(canvas, 100), 0, this.getPoint(canvas, 0));

			for(const i in gradients)
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
					ctx.arc((i - 1) * width / (data.length - 1), this.getPoint(canvas, data[i - 1]), 10, 0, 360);
					ctx.fill();
					ctx.closePath();

					ctx.fillStyle = gradients[1];

					ctx.beginPath();
					ctx.arc((i - 1) * width / (data.length - 1), this.getPoint(canvas, data[i - 1]), 5, 0, 360);
					ctx.fill();
					ctx.closePath();
				}

				if(data[i - 1] != null)
				{
					ctx.beginPath();
					ctx.moveTo((i - 1) * width / (data.length - 1), this.getPoint(canvas, data[i - 1]));
				}
				
				if(data[i] != null)
				{
					ctx.lineTo(i * width / (data.length - 1), this.getPoint(canvas, data[i]));
					ctx.stroke();
				}

				if(points)
				{
					ctx.fillStyle = gradients[0];

					ctx.beginPath();
					ctx.arc((i - 1) * width / (data.length - 1), this.getPoint(canvas, data[data.length - 1]), 10, 0, 360);
					ctx.fill();
					ctx.closePath();

					ctx.fillStyle = gradients[1];

					ctx.beginPath();
					ctx.arc((i - 1) * width / (data.length - 1), this.getPoint(canvas, data[data.length - 1]), 5, 0, 360);
					ctx.fill();
					ctx.closePath();
				}
			}
		}
	}

	drawFill(canvas, data, gradients, smoothing)
	{
		if(data.join().replace(/,/g, '').length > 0)
		{
			var ctx = canvas.getContext('2d'), width = canvas.offsetWidth;
			var grd = ctx.createLinearGradient(0, this.getPoint(canvas, 100), 0, this.getPoint(canvas, 0));

			for(const i in gradients)
			{
				grd.addColorStop(i / (gradients.length - 1), gradients[i]);
			}

			ctx.fillStyle = grd;

			ctx.setLineDash([]);

			ctx.beginPath();
			ctx.moveTo(0, this.getPoint(canvas, 0));
			ctx.lineTo(0, this.getPoint(canvas, data[0]));

			for(var i = 1; i < data.length; i++)
			{
				if(data[i] != null)
				{
					if(smoothing == 0)
					{
						ctx.lineTo(i * width / (data.length - 1), this.getPoint(canvas, data[i]));
					}
					else
					{
						var multiplicator = 100 / data.max * height / 100, height = canvas.offsetHeight - this.padding * 2 - 2;

						ctx.bezierCurveTo(i * width / (data.length - 1) - width / smoothing / (data.length - 1), height - data[i - 1] * multiplicator, i * width / (data.length - 1) + this.padding - width / smoothing / (data.length - 1), height - data[i] * multiplicator - this.padding , i * width / (data.length - 1) + this.padding, height - data[i] * multiplicator - this.padding ); // FIXME: Graph Smoothing Improvements
					}
				}
			}

			ctx.lineTo((data.length - 1) * width / (data.length - 1), this.getPoint(canvas, 0));

			ctx.closePath();
			ctx.fill();
		}
	}

	drawGrid(canvas, data)
	{
		var ctx = canvas.getContext('2d'), height = canvas.offsetHeight - this.padding * 2 - 2, width = canvas.offsetWidth;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.lineCap = 'butt';
		ctx.lineWidth = 2;
		
		ctx.setLineDash([]);

		ctx.strokeStyle = 'rgb(25, 25, 40)';

		var pattern = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
		var lines, space, counter = 0;

		do
		{
			space = pattern[counter];

			lines = Math.ceil((Math.ceil(data.max) - Math.floor(data.min) - space) / space);

			if(lines > 10)
			{
				counter++;
			}
		}
		while(lines > 10 && pattern[counter] != null);
		
		var start = Math.floor(data.min) - Math.floor(data.min) % space + space;

		for(let i = start; i < Math.ceil(data.max); i += space)
		{
			ctx.beginPath();
			ctx.moveTo(0, height - ((i - data.min) / (data.max - data.min) * 100) * height / 100 + this.padding);
			ctx.lineTo(width, height - ((i - data.min) / (data.max - data.min) * 100) * height / 100 + this.padding)
			ctx.stroke();
		}

		var time = Math.round((new Date().getTime() - this.getHourCycle(6)) / 3600000 * width / 24);
		
		space = width / 24;
		counter = 0;

		for(let i = 0; i < 30; i++)
		{
			ctx.strokeStyle = 'rgb(25, 25, 40)';
			
			if(counter == 0 || counter == 6 || counter == 12 || counter == 18 || counter == 24)
			{
				ctx.strokeStyle = 'rgb(40, 40, 55)';
			}
			
			ctx.beginPath();
			ctx.moveTo(i * space - time, this.getPoint(canvas, 0));
			ctx.lineTo(i * space - time, this.getPoint(canvas, 100));
			ctx.stroke();
			
			counter++;
		}

		counter = 0;

		ctx.font = '300 14px Rubik';
		ctx.textBaseline = 'center';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'rgb(150, 150, 170)';
		ctx.strokeStyle = 'rgb(50, 50, 70)';

		for(let i = width - time; i > 0; i -= space)
		{
			var padding = 5,
				hour = new Date(this.getHourCycle(6) - (counter * 60 * 60 * 1000)).getHours();

			if(hour == 0)
			{
				hour = 24;
			}

			var cycleLabel = {
				text : (hour + ' Uhr').split('').join(String.fromCharCode(8202) + String.fromCharCode(8202)),
				x : i + 2,
				y : this.getPoint(canvas, -15 + padding),
				width : ctx.measureText((hour + ' Uhr').split('').join(String.fromCharCode(8202) + String.fromCharCode(8202))).width
			};

			if(cycleLabel.x + (cycleLabel.width / 2) + padding > width)
			{
				cycleLabel.x = width - (cycleLabel.width / 2) - padding;
			}

			if(cycleLabel.x - (cycleLabel.width / 2) - padding < 0)
			{
				cycleLabel.x = (cycleLabel.width / 2) + padding;
			}

			if(counter == 0 || counter == 6 || counter == 12 || counter == 18)
			{
				ctx.fillText(cycleLabel.text, cycleLabel.x, cycleLabel.y);
			}
			
			counter++;
		}

		ctx.beginPath();
		ctx.moveTo(0, this.getPoint(canvas, 0));
		ctx.lineTo(width, this.getPoint(canvas, 0))
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(0, this.getPoint(canvas, -15));
		ctx.lineTo(width, this.getPoint(canvas, -15))
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(0, this.getPoint(canvas, 100));
		ctx.lineTo(width, this.getPoint(canvas, 100))
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(0, this.getPoint(canvas, 115));
		ctx.lineTo(width, this.getPoint(canvas, 115))
		ctx.stroke();
	}

	drawEvents(canvas, data, gradients, type)
	{
		var drawn = [];

		if(data.length > 0)
		{
			var ctx = canvas.getContext('2d'), width = canvas.offsetWidth;
			var grd = ctx.createLinearGradient(0, this.getPoint(canvas, 100), 0, this.getPoint(canvas, 0));

			for(const i in gradients)
			{
				grd.addColorStop(i / (gradients.length - 1), gradients[i]);
			}

			ctx.fillStyle = grd;
			ctx.lineCap = 'butt';
			ctx.lineWidth = 1.5;
			ctx.setLineDash([]);

			for(var i = data.length - 1; i >= 0; i--)
			{
				if(data[i] != null && data[i].percent != null)
				{
					ctx.beginPath();
					ctx.arc(i * width / (data.length - 1), this.getPoint(canvas, data[i].percent), 4, 0, 360);
					ctx.fill();
					ctx.closePath();
					
					if(data[i].value != null && !drawn.includes(data[i].value))
					{
						var padding = 8,
							textValue = (data[i].value.toString() + (window.servicePresets[type].text != null ? ' ' + window.servicePresets[type].text.toUpperCase() : '')).split('').join(String.fromCharCode(8202) + String.fromCharCode(8202) + String.fromCharCode(8202)),
							textWidth = ctx.measureText(textValue).width,
							textX = i * width / (data.length - 1),
							textY = this.getPoint(canvas, data[i].percent) - padding - 2;

						ctx.font = '300 14px Rubik';
						ctx.textBaseline = 'center';
						ctx.textAlign = 'center';
						ctx.lineWidth = 2;
						ctx.strokeStyle = 'rgba(20, 20, 30, 0.6)';

						if(textX - (textWidth / 2) < padding)
						{
							textX = padding;

							ctx.textAlign = 'left';
						}
						else if(textX + (textWidth / 2) >= width - padding)
						{
							textX = width - padding;

							ctx.textAlign = 'right';
						}

						if(textY < this.padding + 14 + padding)
						{
							textY += 21 + padding + 2;
						}

						ctx.strokeText(textValue, textX, textY);
						ctx.fillText(textValue, textX, textY);

						drawn.push(data[i].value);
					}
				}
			}
		}
	}

	drawAutomation(canvas, data)
	{
		if(data.length > 0)
		{
			var ctx = canvas.getContext('2d'), width = canvas.offsetWidth;

			ctx.lineCap = 'butt';
			ctx.lineWidth = 1.5;
			ctx.setLineDash([10, 15]);

			for(const i in data)
			{
				ctx.strokeStyle = 'rgb(40, 40, 55)';

				ctx.beginPath();
				ctx.moveTo(0, this.getPoint(canvas, data[i].percent));
				ctx.lineTo(width, this.getPoint(canvas, data[i].percent))
				ctx.stroke();
				/*
				if(i == 0 || data[i - 1].percent > data[i].percent + 5 || data[i - 1].percent < data[i].percent - 5)
				{
					ctx.font = '200 12px Rubik';
					ctx.fillStyle = 'rgba(245, 245, 255, 0.5)';
					ctx.globalCompositeOperation = 'source-over';
					//ctx.textAlign = 'center';
					ctx.fillText(data[i].value, 5, height - data[i].percent * height / 100 + this.padding - 7);
				}
				*/
			}
		}
	}

	convertActivity(data, values, automation, events)
	{
		data.nextRefresh = this.getMinuteCycle(data.interval) + 60000 * data.interval;
		data.sectors = this.renderMinutesCycle(data.interval);
		data.values = [];

		data.min = 100000;
		data.max = -100000;

		data = addValues(data, values);
		data = getAutomations(data, automation, events);
		data = getPercents(data);
		data = selectValues(data);
		data = startEndPoints(data);
		data = smoothValues(data);

		return data;
	}

	getMinuteCycle(unterteilungenInMinuten, timeStamp)
	{
		var date = new Date();

		if(timeStamp != null)
		{
			date = new Date(timeStamp);
		}

		var minutes = (unterteilungenInMinuten - date.getMinutes() % unterteilungenInMinuten) * 60000;

		return Math.floor((date.getTime() + minutes) / 60000) * 60000 - unterteilungenInMinuten * 60000;
	}

	getHourCycle(unterteilungenInStunden, timeStamp)
	{
		var date = new Date();

		if(timeStamp != null)
		{
			date = new Date(timeStamp);
		}

		var hours = (unterteilungenInStunden - date.getHours() % unterteilungenInStunden) * 3600000;

		return Math.floor((date.getTime() + hours) / 3600000) * 3600000 - unterteilungenInStunden * 3600000;
	}

	renderMinutesCycle(unterteilungenInMinuten)
	{
		var data = {}, endTime = this.getMinuteCycle(unterteilungenInMinuten);

		for(var i = 0; i < 24 * 60 / unterteilungenInMinuten + 1; i++)
		{
			data[endTime] = [];

			endTime -= 60000 * unterteilungenInMinuten;
		}

		data = Object.keys(data).sort().reduce((obj, key) => { obj[key] = data[key]; return obj }, {});

		return data;
	}

	getPoint(canvas, percent)
	{
		var height = canvas.offsetHeight - this.padding * 2 - 2;
		
		return height - percent * height / 100 + this.padding;
	}
}

function addValues(data, values)
{
	console.debug('VALUES', values);
	
	for(const v in values)
	{
		var cycleTime = self.getMinuteCycle(data.interval, parseInt(values[v].time) * 1000);

		if(data.sectors[cycleTime] != null)
		{
			var value = values[v].value, brightness = values[v].brightness;

			try
			{
				if(value != null)
				{
					value = JSON.parse(value);
				}

				if(brightness != null)
				{
					brightness = JSON.parse(brightness);
				}
			}
			catch(e)
			{
				console.error(e);
			}

			if(typeof value == 'boolean')
			{
				value = value ? 100 : 0;
			}

			if(brightness != null && value == 100)
			{
				value = brightness;
			}

			if(value < data.min)
			{
				data.min = value;
			}

			if(value > data.max)
			{
				data.max = value;
			}

			data.sectors[cycleTime].push({ time : values[v].time, value });
		}
	}
	
	return data;
}

function getPercents(data)
{
	for(const i in data.sectors)
	{
		for(const j in data.sectors[i])
		{
			if(data.sectors[i][j].automation != null)
			{
				data.sectors[i][j].percents = (data.sectors[i][j].automation - data.min) / (data.max - data.min) * 100;
			}
			else if(data.min != data.max)
			{
				data.sectors[i][j].percents = (data.sectors[i][j].value - data.min) / (data.max - data.min) * 100;
			}
			else
			{
				data.sectors[i][j].percents = data.min;
			}
		}
	}

	return data;
}

function getAutomations(data, automation, events)
{
	var visibleAutomation = [];

	for(const a in automation)
	{
		for(const b in automation[a].trigger)
		{
			if(automation[a].trigger[b].id == data.id && automation[a].trigger[b].letters == data.letters && (automation[a].trigger[b].value - data.min) / (data.max - data.min) * 100 < 100 && (automation[a].trigger[b].value - data.min) / (data.max - data.min) * 100 > 0)
			{
				for(const e in events)
				{
					if(automation[a].name == events[e].v)
					{
						visibleAutomation.push({ time : events[e].t, value : automation[a].trigger[b].value });
					}
				}
			}
		}
	}

	for(const i in data.sectors)
	{
		for(const j in data.sectors[i])
		{
			for(const a in visibleAutomation)
			{
				if(visibleAutomation[a].time == data.sectors[i][j].time)
				{
					data.sectors[i][j].automation = JSON.parse(visibleAutomation[a].value);
				}
			}
		}
	}

	return data;
}

function selectValues(data)
{
	for(const i in data.sectors)
	{
		if(data.sectors[i].length > 0)
		{
			var avg = 0, max = -100000, min = 100000, automation = null, last = data.sectors[i][data.sectors[i].length - 1].percents, first = data.sectors[i][0].percents;

			for(const j in data.sectors[i])
			{
				var value = parseFloat(data.sectors[i][j].percents);

				if(value < min)
				{
					min = value;
				}

				if(value > max)
				{
					max = value;
				}

				if(data.sectors[i][j].automation != null)
				{
					automation = data.sectors[i][j].percents;
				}

				avg += value;
			}

			if(avg > 0)
			{
				avg /= data.sectors[i].length;
			}

			if(data.format != 'boolean' && data.letters[0] != 'G')
			{
				if(min == 0)
				{
					data.values.push(min);
				}
				else if(max == 100)
				{
					data.values.push(max);
				}
				else if(automation != null)
				{
					data.values.push(automation);
				}
				else
				{
					data.values.push(avg);
				}
			}
			else
			{
				if(min != max)
				{
					data.values[data.values.length - 1] = first;
				}
				
				data.values.push(last);
			}

			//data.values.push((100 - max < min) ? max : min);
		}
		else
		{
			data.values.push(null);	
		}
	}

	// NOTE: Possible Past Interpretation
	
	if(data.format == 'boolean' && data.values[0] == null && data.values.join().replace(/,/g, '').length > 0)
	{
		data.values[0] = 0;
		/*
		var indexX = getNextValue(data, -1);
		var indexY = getNextValue(data, parseInt(indexX.index));
		
		//console.debug('XXX', indexX, indexY);
		
		if(indexX != null && indexY != null)
		{
			if(indexX.value == indexY.value)
			{
				data.values[0] = indexX.value;
			}
			else
			{
				data.values[0] = indexY.value;
				//data.values[0] = getNextValue(data, 0).value;
			}
		}
		*/
	}
	
	return data;
}

function startEndPoints(data)
{
	var last = getLastValue(data, data.values.length - 1);
	var next = getNextValue(data, 0);

	if(data.values[0] == null && next != null)
	{
		data.values[0] = next.value;
	}

	if(data.values[data.values.length - 1] == null && last != null)
	{
		data.values[data.values.length - 1] = last.value;
	}

	return data;
}

// NOTE: Smooth Values

function smoothValues(data)
{
	for(const i in data.values)
	{
		var last = getLastValue(data, parseInt(i));

		if(data.values[i] == null && data.values[parseInt(i) + 1] != null)
		{
			if(data.format == 'boolean' || data.letters[0] == 'F' || data.letters[0] == 'G')
			{
				if(last != null)
				{
					data.values[i] = last.value;
				}
			}
		}
	}

	return data;
}

const getNextValue = (data, index) => {

	for(var i = index + 1; i < data.values.length; i++)
	{
		if(data.values[i] != null)
		{
			return { index : i, value : data.values[i] };
		}
	}

	return null;
};

const getLastValue = (data, index) => {

	for(var i = index - 1; i >= 0; i--)
	{
		if(data.values[i] != null)
		{
			return { index : i, value : data.values[i] };
		}
	}

	return null;
};

export let Graph = new GraphManager();