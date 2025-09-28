function toAbsPass(url){
    let ary = location.href.split("/");
    ary.pop();
    let uary = url.split("/");
    for(let i=0;i<uary.length;i++){
        if(uary[i].replace(/\s+/g, "").length == 0 || uary[i] == "."){
            ;
        }else if(uary[i] == ".."){
            ary.pop();
        }else{
            ary.push(uary[i]);
        }
    }
    return ary.join("/");
}
function playSound(s) {
    s.pause();
    s.currentTime = 0;
    s.play();
}
function encodeStage(stage) {
    return stage.map((ary)=>{
        let result = [];
        let count = 1;
        let t = ary[0];
        for(let i=1,la=ary.length;i<la;i++){
            if(t == ary[i]){
                count++;
            }else{
                result.push(t);
                result.push(count);
                t = ary[i];
                count = 1;
            }
        }
        result.push(t);
        result.push(count);
        return result;
    });
}
function decodeStage(data) {
    return data.map((ary)=>{
        let result = [];
        for(let i=0,la=ary.length;i<la;i+=2){
            for(let j=0,l=ary[i+1];j<l;j++){
                result.push(ary[i]);
            }
        }
        return result;
    });
}

let focused = true;
window.addEventListener("focus", ()=>{focused = true;});
window.addEventListener("blur", ()=>{focused = false;});

// https://www.site-convert.com/archives/2188
let isSmartPhone = 0;
function oncontextmenu(e) {
    if(isSmartPhone){
        e.preventDefault();
    }
}
document.addEventListener("contextmenu",oncontextmenu);

let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let jumpPressed = false;
let keyboardPressedData = {};
function isPressed(k){
    if(k in keyboardPressedData){
        return keyboardPressedData[k];
    }else{
        return false;
    }
}

const canvas = document.getElementById("myCanvas");
let canvasRect = canvas.getBoundingClientRect();
const ctx = canvas.getContext("2d", {alpha: false});
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

function canvasResize() {
    const t = Math.min(Math.min(window.innerWidth, screen.width-100) / canvasWidth, Math.min(window.innerHeight,screen.height-10) / canvasHeight, 1);
    const x = Math.floor(canvas.width * t);
    const y = Math.floor(canvas.height * t);
    canvas.style.width = x.toString()+"px";
    canvas.style.height = y.toString()+"px";
    if(t==1){
        canvas.style.margin = "50px auto";
    }else{
        canvas.style.margin = "0 auto";
    }
    canvasRect = canvas.getBoundingClientRect();
}
setTimeout(canvasResize, 300);
setInterval(canvasResize, 1000);
window.addEventListener("resize", canvasResize);

let mouse = {
    x: -1,
    y: -1
};
function onMouseMove(e) {
    mouse.x = e.offsetX * (canvasWidth / canvas.clientWidth);
    mouse.y = e.offsetY * (canvasWidth / canvas.clientWidth);
}
function onMouseOut(e) {
    mouse.x = -1;
    mouse.y = -1;
}
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseout", onMouseOut);



function setarrowPressed() {
    rightPressed = isPressed("right") || isPressed("arrowright") || isPressed("d");
    leftPressed = isPressed("left") || isPressed("arrowleft") || isPressed("a");
    upPressed = isPressed("up") || isPressed("arrowup") || isPressed("w");
    downPressed = isPressed("down") || isPressed("arrowdown") || isPressed("s");
}
function keyDownHandler(e) {
    const ek = e.key.toLowerCase();
    keyboardPressedData[ek] = true;
    setarrowPressed();
    if(["right", "arrowright", "d", "left", "arrowleft", "a", "up", "arrowup", "w", "down", "arrowdown", "s"].includes(ek)){
        e.preventDefault();
    }
}
function keyUpHandler(e) {
    const ek = e.key.toLowerCase();
    keyboardPressedData[ek] = false;
    setarrowPressed();
    if(["right", "arrowright", "d", "left", "arrowleft", "a", "up", "arrowup", "w", "down", "arrowdown", "s"].includes(ek)){
        e.preventDefault();
    }
}

const jumpPanelX = canvasWidth-200;
const jumpPanelY = canvasHeight-150;
const lateralPanelX = 70;
const lateralPanelY = canvasHeight-300;
function drawSmartPanel() {
    if(isSmartPhone){
        ctx.strokeStyle = "orange";
        ctx.fillStyle = "orange";
        ctx.lineWidth = 4;
        ctx.strokeRect(lateralPanelX+200,lateralPanelY,150,150);
        if(rightPressed){
            ctx.globalAlpha = 0.3;
            ctx.fillRect(lateralPanelX+200,lateralPanelY,150,150);
            ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(jumpPanelX,jumpPanelY,100,0,2*Math.PI);
        ctx.stroke();
        if(upPressed){
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.strokeRect(lateralPanelX,lateralPanelY,150,150);
        if(leftPressed){
            ctx.globalAlpha = 0.3;
            ctx.fillRect(lateralPanelX,lateralPanelY,150,150);
            ctx.globalAlpha = 1;
        }
        ctx.strokeRect(lateralPanelX+150,lateralPanelY,50,150);
    }
}
let fingers = {};
function ontouchstart(event) {
    if(event.cancelable){
        event.preventDefault();
    }
    isSmartPhone = true;
    for(let i=0;i<event.changedTouches.length;i++){
        const c = event.changedTouches[i];
        const x = c.clientX - canvasRect.left;
        const y = c.clientY - canvasRect.top;
        fingers[c.identifier] = {x:x, y:y};
    }
}
function ontouchmove(event) {
    for(let i=0;i<event.changedTouches.length;i++){
        const c = event.changedTouches[i];
        const x = c.clientX - canvasRect.left;
        const y = c.clientY - canvasRect.top;
        fingers[c.identifier] = {x:x, y:y};
    }
}
function ontouchend(event) {
    for(let i=0;i<event.changedTouches.length;i++){
        const c = event.changedTouches[i];
        delete fingers[c.identifier];
    }
}
function updateKeyStateForSmartPanel() {
    if(isSmartPhone){
        let r = false;
        let u = false;
        let l = false;
        for(i in fingers){
            const x = fingers[i].x / canvas.clientWidth * canvasWidth;
            const y = fingers[i].y / canvas.clientHeight * canvasHeight;
            if(lateralPanelX+200 < x && x < lateralPanelX+350 && lateralPanelY < y && y < lateralPanelY+150){
                r = true;
            }
            if(lateralPanelX < x && x < lateralPanelX+150 && lateralPanelY < y && y < lateralPanelY+150){
                l = true;
            }
            if((x-jumpPanelX)*(x-jumpPanelX) + (y-jumpPanelY)*(y-jumpPanelY) < 100*100){
                u = true;
            }
        }
        rightPressed = r;
        upPressed = u;
        leftPressed = l;
    }
}
canvas.addEventListener("touchstart",ontouchstart,{passive:false});
canvas.addEventListener("touchmove",ontouchmove,{passive:true});
canvas.addEventListener("touchend",ontouchend);
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);



const GRID = 30;
var stageHeight = 100;
var stageWidth = 100;
let tileImages = [];
let plateImages = [];
let backImages = [];
let images = {};
let audios = {};
let stage;
let stageRot;
let plate = -1;
let entities = [];
let startPoint = {x:5, y:5};
let items = [];
let ntiles;

function importTileImages() {
    ntiles = tileNames.length;
    for(let i=0; i<ntiles; i++){
        let img = new Image();
        img.src = "images/tiles/" + tileNames[i];
        tileImages.push(img);
    }
}
function importPlateImages() {
    for(let i=0,lp=plateNames.length;i<lp;i++){
        let img = new Image();
        img.src = "images/plates/" + plateNames[i];
        plateImages.push(img);
    }
}
function importBackImages() {
    for(let i=0,lb=backNames.length;i<lb;i++){
        let img = new Image();
        img.src = "images/backs/" + backNames[i];
        backImages.push(img);
    }
}
function importOtherImages() {
    for(let i=0,li=imageNames.length;i<li;i++){
        let img = new Image();
        img.src = "images/others/" + imageNames[i];
        images[imageNames[i].split(".")[0]] = img;
    }
}
function importAudios() {
    for(let i=0,lp=audioNames.length;i<lp;i++){
        let a = new Audio("audios/"+audioNames[i]);
        audios[audioNames[i].split(".")[0]] = a;
    }
}

function setStage() {
    stage = new Array(stageWidth);
    for(let i=0;i<stageWidth;i++){
        stage[i] = new Array(stageHeight).fill(0);
    }
    stageRot = JSON.parse(JSON.stringify(stage));
}

let camera_x = 0;
let camera_y = 0;
function moveCamera(x, y, editor){
    camera_x += x;
    camera_y += y;
    if(editor){
        if(camera_x < 0){
            camera_x = 0;
        }else if(camera_x > stageWidth*GRID - canvasWidth){
            camera_x = stageWidth*GRID - canvasWidth;
        }
        if(camera_y < 0){
            camera_y = 0;
        }else if(camera_y > stageHeight*GRID - canvasHeight){
            camera_y = stageHeight*GRID - canvasHeight;
        }
    }
}

function clear() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}
clear();

let biasX = 0;
let biasY = 0;
function cx(x) {
    return x*GRID - camera_x + biasX;
}
function cy(y) {
    return y*GRID - camera_y + biasY;
}

function drawLevel(prams) {
    for(let a in anime){
        delete offScreenTiles[a];
    }
    for(let i=0;i<moveable.length;i++){
        if(offScreenTiles[moveable[i]]){
            delete offScreenTiles[moveable[i]];
        }
    }

    for(let i=0;i<entities.length;i++){
        const e = entities[i];
        if(!frontTiles.includes(e.type)){
            drawEntity(e);
        }
    }

    const x_start = Math.max(Math.floor(camera_x / GRID - 1), 0);
    const x_end = Math.min(Math.ceil((canvasWidth + camera_x) / GRID + 1), stageWidth);
    const y_start = Math.max(Math.floor(camera_y / GRID - 1), 0);
    const y_end = Math.min(Math.ceil((canvasHeight + camera_y) / GRID + 1), stageHeight);
    for(let x=x_start;x<x_end;x++){
        for(let y=y_start;y<y_end;y++){
            drawTile(stage[x][y], x, y, 1, stageRot[x][y]);
        }
    }

    for(let i=0;i<entities.length;i++){
        const e = entities[i];
        if(frontTiles.includes(e.type)){
            drawEntity(e);
        }
    }

    for(let i=0;i<items.length;i++){
        const it = items[i];
        drawTile(it.type, it.x, it.y + (itemBiases[it.type]||0), 1, 0);
    }
    if(prams && prams.grid){
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 1;
        for(let i=y_start;i<y_end;i++){
            ctx.beginPath();
            ctx.moveTo(0, i*GRID - camera_y);
            ctx.lineTo(canvasWidth, i*GRID - camera_y);
            ctx.stroke();
        }
        for(let i=x_start;i<x_end;i++){
            ctx.beginPath();
            ctx.moveTo(i*GRID - camera_x, 0);
            ctx.lineTo(i*GRID - camera_x, canvasHeight);
            ctx.stroke();
        }
    }
    if(prams && prams.start){
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx(startPoint.x+0.5),cy(startPoint.y+0.5),0.5*GRID,0,Math.PI*2,true);
        ctx.stroke();
    }
    if(prams && prams.plate){
        if(plate >= 0){
            let img = plateImages[plate];
            ctx.globalAlpha = 0.3;
            ctx.drawImage(img, canvasWidth*0.5-img.naturalWidth*0.5, 20);
            ctx.globalAlpha = 1;
        }
    }
}

function drawEntity(e) {
    e.x += e.biasX || 0;
    if(e.type == CSB_CHAIN){
        drawCC(e);
    }else if(e.type == OIL_DRUM){
        drawOilDrum(e);
    }else{
        drawTile(e.type, e.x, e.y, e.alpha || 1, 0);
    }
    e.x -= e.biasX || 0;
}

function drawCC(e) {
    let endX, endY;
    if(e.lenes){
        let xs = [];
        let ys = [];
        let x = 0;
        let y = 0;
        for(let i=0;i<e.lenes.length;i++){
            x += e.lenes[i] * Math.sin(e.rps[i] * (tick/FPS) * (Math.PI * 2));
            y += e.lenes[i] * Math.cos(e.rps[i] * (tick/FPS) * (Math.PI * 2));
            xs.push(x);
            ys.push(y);
        }
        endX = xs[xs.length-1];
        endY = ys[ys.length-1];
        ctx.strokeStyle = "brown";
        ctx.lineJoin = "round";
        ctx.lineWidth = GRID * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx(e.x + 1), cy(e.y + 1));
        for(let i=0;i<xs.length;i++){
            ctx.lineTo(cx(e.x + xs[i] + 1), cy(e.y + ys[i] + 1));
        }
        ctx.stroke();
        ctx.lineJoin = "miter";
    }
    drawTile(e.type, e.x, e.y, e.alpha || 1, 0);
    if(e.lenes){
        drawTile(CSB, e.x+endX - 0.5, e.y+endY - 0.5, 1, 0);
    }
}

function drawOilDrum(e) {
    const type = OIL_DRUM;
    const dx = tileImages[type].naturalWidth * 0.5;
    const dy = tileImages[type].naturalHeight * 0.5;
    ctx.save();
    ctx.translate(cx(e.x) + dx,cy(e.y) + dy);
    ctx.rotate(e.rot || 0);
    ctx.drawImage(tileImages[type], -dx, -dy);
    ctx.drawImage(tileImages[type], -dx, -dy);
    ctx.restore();
}

let tick = 0;
let offScreenTiles = {};
function drawTile(type, x, y, alpha, rot) {
    if(SWITCHES.includes(type)){
        let n = SWITCHES.indexOf(type);
        if(switchStates[Math.floor(n/4)]){
            if(n % 2 == 0){
                n++;
            }else{
                n--;
            }
        }
        type = SWITCHES[n];
    }else if(type in anime && anime[type].type=="anime"){
        type += tick % anime[type].f;
    }

    if(type in offScreenTiles){
        helpDrawTile(offScreenTiles[type], x, y, rot);
        return;
    }
    if(type == EMPTY){
        return;
    }
    const offScreenCanvas = document.createElement("canvas");
    if(isSquare(type)){
        offScreenCanvas.width = GRID+1;
        offScreenCanvas.height = GRID+1;
    }else{
        offScreenCanvas.width = tileImages[type].naturalWidth+1;
        offScreenCanvas.height = tileImages[type].naturalHeight+1;
    }
    const octx = offScreenCanvas.getContext("2d");

    octx.globalAlpha = alpha;
    if(type in anime && anime[type].type!="anime"){
        drawAnimatedTile(octx, type);
    }else if(isSquare(type)){
        octx.drawImage(tileImages[type], 0, 0, GRID+1, GRID+1);
    }else{
        octx.drawImage(tileImages[type], 0, 0);
    }
    octx.globalAlpha = 1;
    helpDrawTile(offScreenCanvas, x, y, rot);
    offScreenTiles[type] = offScreenCanvas;
}

function helpDrawTile(img, x, y, rot) {
    if(rot != 0){
        const R = GRID + 1;
        ctx.save();
        ctx.translate(cx(x) + R*0.5, cy(y) + R*0.5);
        ctx.rotate(Math.PI * 0.5 * rot);
        ctx.drawImage(img, -R*0.5, -R*0.5);
        ctx.restore();
    }else{
        ctx.drawImage(img, cx(x), cy(y));
    }
}

function drawAnimatedTile(octx, type){
    switch(anime[type].type){
        case "rot":
            const dx = tileImages[type].naturalWidth * 0.5;
            const dy = tileImages[type].naturalHeight * 0.5;
            octx.save();
            octx.translate(dx,dy);
            octx.rotate(tick/FPS*anime[type].rps * Math.PI * 2);
            if(isSquare(type)){
                octx.drawImage(tileImages[type], -dx, -dy, GRID+1, GRID+1);
            }else{
                octx.drawImage(tileImages[type], -dx, -dy);
            }
            octx.drawImage(tileImages[type], -dx, -dy);
            octx.restore();
            break;
        case "vert":
            const vert_raw = tick/FPS*anime[type].cycles;
            const vert = vert_raw - Math.floor(vert_raw);
            octx.drawImage(tileImages[type], 0, (vert-1)*GRID, GRID+1, GRID+1);
            octx.drawImage(tileImages[type], 0, vert*GRID, GRID+1, GRID+1);
            break;
        case "beside":
            const beside_raw = tick/FPS*anime[type].cycles;
            const beside = beside_raw - Math.floor(beside_raw);
            octx.drawImage(tileImages[type], (beside-1)*GRID, 0, GRID+1, GRID+1);
            octx.drawImage(tileImages[type], beside*GRID, 0, GRID+1, GRID+1);
            break;
    }
}

importTileImages();
importPlateImages();
importBackImages();
importOtherImages();
importAudios();
