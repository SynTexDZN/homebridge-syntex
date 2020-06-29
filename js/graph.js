function drawGraph(canvas, data, clr1, clr2, points)
{
    var ctx = canvas.getContext('2d');

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = clr2;

    for(var i = 1; i < data.length; i++)
    {
        if(points)
        {
            ctx.fillStyle = clr1;
            ctx.beginPath();
            ctx.arc((i - 1) * width / (data.length - 1) + padding, height - data[i - 1] * multiplicator - padding - 3, 10, 0, 360);
            ctx.fill();
            ctx.closePath();
            ctx.fillStyle = clr2;
            ctx.beginPath();
            ctx.arc((i - 1) * width / (data.length - 1) + padding, height - data[i - 1] * multiplicator - padding - 3, 5, 0, 360);
            ctx.fill();
            ctx.closePath();
        }

        ctx.beginPath();
        ctx.moveTo((i - 1) * width / (data.length - 1) + padding, height - data[i - 1] * multiplicator - padding - 3);
        ctx.lineTo(i * width / (data.length - 1) + padding, height - data[i] * multiplicator - padding - 3);
        ctx.stroke();
    }

    if(points)
    {
        ctx.fillStyle = clr1;
        ctx.beginPath();
        ctx.arc((i - 1) * width / (data.length - 1) + padding, height - data[data.length - 1] * multiplicator - padding - 3, 10, 0, 360);
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = clr2;
        ctx.beginPath();
        ctx.arc((i - 1) * width / (data.length - 1) + padding, height - data[data.length - 1] * multiplicator - padding - 3, 5, 0, 360);
        ctx.fill();
        ctx.closePath();
    }
}

function drawFill(canvas, data, clr1, clr2, smoothing)
{
    var ctx = canvas.getContext('2d');

    var grd = ctx.createLinearGradient(0, 0, 0, height + 100);
    grd.addColorStop(0, clr1);
    grd.addColorStop(1, clr2);

    ctx.fillStyle = grd;

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, height - data[0] * multiplicator - padding - 3);

    for(var i = 1; i < data.length; i++)
    {
        if(smoothing == 0)
        {
            ctx.lineTo(i * width / (data.length - 1) + padding, height - data[i] * multiplicator - padding - 3);
        }
        else
        {
            ctx.bezierCurveTo(i * width / (data.length - 1) + padding - width / smoothing / (data.length - 1), height - data[i - 1] * multiplicator, i * width / (data.length - 1) + padding - width / smoothing / (data.length - 1), height - data[i] * multiplicator - padding - 3, i * width / (data.length - 1) + padding, height - data[i] * multiplicator - padding - 3);
        }
    }

    ctx.lineTo((data.length - 1) * width / (data.length - 1) + padding, height - padding);

    ctx.closePath();
    ctx.fill();
}

function drawGrid(canvas, data, outline)
{
    var ctx = canvas.getContext('2d');

    ctx.lineCap = 'butt';
    ctx.lineWidth = 1.5;

    for(var i = 0; i < height / 5 + 1; i++)
    {
        ctx.strokeStyle = 'rgb(25, 25, 35)';

        if(i == unterteilungen || i == 0)
        {
            ctx.strokeStyle = outline;
        }

        ctx.beginPath();
        ctx.moveTo(padding, height - height / unterteilungen * i - padding);
        ctx.lineTo((data.length - 1) * width / (data.length - 1) + padding, height - height / unterteilungen * i - padding);
        ctx.stroke();
    }

    for(var i = 0; i < data.length; i++)
    {
        ctx.strokeStyle = 'rgb(40, 40, 50)';

        if(i == data.length - 1 || i == 0)
        {
            ctx.strokeStyle = outline;
        }

        ctx.beginPath();
        ctx.moveTo(i * width / (data.length - 1) + padding, 0 - padding);
        ctx.lineTo(i * width / (data.length - 1) + padding, height - padding);
        ctx.stroke();
    }
}