var srcCanvas = document.getElementById("sourceCanvas");
var srcCtx = srcCanvas.getContext("2d");
var targetCanvas = document.getElementById("targetCanvas");
targetCanvas.width = window.innerWidth;
targetCanvas.height = window.innerHeight;
var ctx = targetCanvas.getContext("2d");
var image;

var imageSent = function() {
    var imgFile = document.getElementById("img").files[0];
    image = new Image();
    var reader = new FileReader();
    reader.addEventListener("load", function(event) {
        image.src = event.target.result;
        console.log("imgsize:", image.naturalWidth, image.naturalHeight);
    });
    reader.readAsDataURL(imgFile);
    
    /*
    console.log(image.height);
    console.log(imgFile);
    console.log(image.src);
    document.body.appendChild(image);
    console.log(image.naturalWidth);
    */
    var repeat = setInterval(function() {
        if (image.width > 0) {
            clearInterval(repeat);
            imageLoaded();
        }
    },1);

    return false;
}
var imageLoaded = function() {
    console.log("loaded:",image.width,image.height);
    srcCanvas.width = image.width;
    srcCanvas.height = image.height;
    srcCtx.drawImage(image,0,0);
    var idt = srcCtx.getImageData(0,0,srcCanvas.width,srcCanvas.height);
    var signature = document.querySelector('input[name="signature"]:checked').value;
    console.log(signature);
    drawBySignature(signature, idt);
    for (var i=0; i<10; i++) {
        for (var j=0; j<10; j++) {
            var px = getPixelXY(idt,i,j);
            px[3] = 0;
        }
    }
    srcCtx.putImageData(idt,0,0);
}

var getPixelXY = function(imgData, x, y) {
    var i = 4*(imgData.width*y+x)
    return imgData.data.subarray(i,i+4);
}

var drawBySignature = function(signature, sourceIdt) {
    var targetIdt = ctx.getImageData(0,0,targetCanvas.width,targetCanvas.height);
    var sw = srcCanvas.width;
    var sh = srcCanvas.height; 
    for (var x=0; x<targetCanvas.width; x++) {
        for (var y=0; y<targetCanvas.height; y++) {
            var px_s;
            var px_t = getPixelXY(targetIdt, x, y);
            if (signature == "2222") {
                var xs = Math.floor(x/sw) % 2 == 0 ? x % sw : sw-1 - x % sw;
                var ys = Math.floor(x/sw) % 2 == 0 ? y % sh : sh-1 - y % sh;
                px_s = getPixelXY(sourceIdt, xs, ys);
            } else if (signature == "*2222") {
                var xs = Math.floor(x/sw) % 2 == 0 ? x % sw : sw-1 - x % sw;
                var ys = Math.floor(y/sh) % 2 == 0 ? y % sh : sh-1 - y % sh;
                px_s = getPixelXY(sourceIdt, xs, ys);
            } else {
                continue;
            }
            px_t[0] = px_s[0];
            px_t[1] = px_s[1];
            px_t[2] = px_s[2];
            px_t[3] = px_s[3];
        }
    }
    ctx.putImageData(targetIdt,0,0);

    if (signature == "632") {
        var ratio = Math.sqrt(3) / 2;
        var base;
        var height;
        if (sh / sw > ratio) {
            // The base of the triangle has full width of the source image.
            base = sw;
            height = ratio * base;
            srcCtx.beginPath();
            srcCtx.moveTo(0, sh);
            srcCtx.lineTo(sw/2, sh-height);
            srcCtx.lineTo(sw, sh);
            srcCtx.closePath();
            srcCtx.globalCompositeOperation = "destination-in";
            srcCtx.fill();
            srcCtx.globalCompositeOperation = "copy";
            srcCtx.drawImage(srcCanvas, 0, height-sh);
        } else {
            // The triangle has full height of the source image.
            console.log("height");
            height = sh;
            base = height / ratio;
            var diff = (sw-base)/2;
            srcCtx.beginPath();
            srcCtx.moveTo(diff, sh);
            srcCtx.lineTo(sw/2, 0);
            srcCtx.lineTo(diff+base, sh);
            srcCtx.globalCompositeOperation = "destination-in";
            srcCtx.fill();
            srcCtx.globalCompositeOperation = "copy";
            srcCtx.drawImage(srcCanvas, -diff, 0);
        }
        srcCtx.globalCompositeOperation = "source-over";
        ctx.drawImage(srcCanvas, 0, 0);
        ctx.drawImage(srcCanvas, 100, 0);
        var rotatedTriangles = [0,1,2,3,4,5];
        rotatedTriangles[0] = srcCanvas;
        rotatedTriangles[2] = rotatedCanvas(srcCanvas, base/2, height*2/3, 2*Math.PI/3);
        rotatedTriangles[3] = rotatedCanvas(srcCanvas, base/2, height/2, Math.PI)
        rotatedTriangles[4] = rotatedCanvas(srcCanvas, base/2, height*2/3, 4*Math.PI/3);
        rotatedTriangles[5] = rotatedCanvas(rotatedTriangles[2], base/2, height/2, Math.PI);
        rotatedTriangles[1] = rotatedCanvas(rotatedTriangles[4], base/2, height/2, Math.PI);

        var tmap = [[0,1,4,3,2,5],[3,2,5,0,1,4]];
        for (var i=-1; i*base/2 < targetCanvas.width; i++) {
            for (var j=0; j*height < targetCanvas.height; j++) {
                var tri = rotatedTriangles[tmap[j%2][(i+6)%6]];
                ctx.drawImage(tri, i*base/2, j*height);
            }
        }
        increaseAlpha(ctx);
    }
}

// Returns a counterclockwise rotated copy of the argument canvas.
var rotatedCanvas = function(canvas, midx, midy, radians) {
    var newCanvas = document.createElement("canvas");
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    var newCtx = newCanvas.getContext("2d");
    newCtx.translate(midx, midy);
    newCtx.rotate(-radians);
    newCtx.drawImage(canvas, -midx, -midy);
    newCtx.restore();
    return newCanvas;
}

var increaseAlpha = function(ctx) {
    var idt = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (var i=3; i<idt.data.length; i+=4) {
        if (idt.data[i] != 0) {
            idt.data[i] = 255;
        }
    }
    ctx.putImageData(idt, 0, 0);
}