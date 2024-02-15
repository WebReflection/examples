from pyscript.js_modules.ml5 import default as ml5
from pyscript import document, window

objectDetector = None
img = None

width = 0
height = 0

def createCanvas(w, h):
    canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    return document.body.appendChild(canvas)

def draw(canvas, results):
    ctx = canvas.getContext('2d')
    ctx.font = "16px Arial"
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, width, height)
  
    ctx.drawImage(img, 0, 0)

    for obj in results:
        ctx.fillStyle = "green"
        ctx.fillText(obj.label, obj.x + 4, obj.y + 16)
        ctx.beginPath()
        ctx.rect(obj.x, obj.y, obj.width, obj.height)
        ctx.strokeStyle = "green"
        ctx.stroke()
        ctx.closePath()

def once_detected(*args):
    [err, results] = args
    if results:
        draw(createCanvas(width, height), results)

def once_loaded(*args):
    global objectDetector, width, height
    width = img.naturalWidth
    height = img.naturalHeight
    objectDetector = ml5.objectDetector('cocossd', startDetecting)

def startDetecting(*args):
    print('model ready')
    objectDetector.detect(img, once_detected)

def make():
    global objectDetector, img
    img = window.Image.new()
    img.onload = once_loaded
    img.src = 'images/target.jpg'
    # other.jpg image courtesy of unsplash:
    # https://unsplash.com/photos/white-rabbit-on-green-grass-u_kMWN-BWyU

make()
