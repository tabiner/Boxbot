importTileImages();
importOtherImages();

const gridbox = document.getElementById("grid");
const palette = document.getElementById("palette");
const elemArea = document.getElementById("elem");
const plateNum = document.getElementById("plateNum");
const p1 = document.getElementById("p1");
const p2 = document.getElementById("p2");
const commandLine = document.getElementById("command");
const commandButton = document.getElementById("commandbutton");
const copyarea = document.getElementById("copyarea");
const loadtext = document.getElementById("loadtext");
const loadbutton = document.getElementById("load");
const copybutton = document.getElementById("copy");

function p1Onclick() {
    if(plate > -1){
        plate--;
    }
    plateNum.innerHTML = plate + "";
    setCopyarea();
}
function p2Onclick() {
    if(plate < plateImages.length-1){
        plate++;
    }
    plateNum.innerHTML = plate + "";
    setCopyarea();
}
p1.addEventListener("click", p1Onclick);
p2.addEventListener("click", p2Onclick);

var elem = 1;

let rotImg = document.createElement("img");
rotImg.src = "images/others/rot.png";
rotImg.width = 30; rotImg.height = 30;
rotImg.addEventListener('click', function onClick(e) {
    elem = -1;
    elemArea.innerHTML = "Num: " + elem.toString();
});
palette.appendChild(rotImg);
let startImg = document.createElement("img");
startImg.src = "images/others/startbutton.png";
startImg.width = 30; startImg.height = 30;
startImg.addEventListener('click', function onClick(e) {
    elem = -2;
    elemArea.innerHTML = "Num: " + elem.toString();
});
palette.appendChild(startImg);

for(let i=0;i<tileNames.length;){
    let img = document.createElement("img");
    img.src = tileImages[i].src;
    img.width = 30; img.height = 30;
    const index = i;
    img.addEventListener('click', function onClick(e) {
        elem = index;
        elemArea.innerHTML = "Num: " + elem.toString();
    });
    palette.appendChild(img);
    if(i in anime && anime[i].type=="anime"){
        i += anime[i].f;
    }else if(SWITCHES.includes(i) && SWITCHES.indexOf(i) % 4 == 0){
        i += 2;
    }else if(i+1 == BBUCKET){
        i += 2;
    }else{
        i++;
    }
}

function redraw() {
    const grid = gridbox.checked;
    clear();
    ctx.fillStyle = "lightgray";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    drawLevel({grid:grid, start:1, plate:1});
}

function setCopyarea() {
    copyarea.innerHTML = JSON.stringify({startPoint:startPoint, stageWidth:stageWidth, stageHeight:stageHeight, items:items, entities:entities, plate:plate ,stage:encodeStage(stage), stageRot:encodeStage(stageRot)});
}

function loadData() {
    json = JSON.parse(loadtext.value);
    startPoint = json.startPoint;
    stageWidth = json.stageWidth;
    stageHeight = json.stageHeight;
    plate = json.plate;
    stage = decodeStage(json.stage);
    stageRot = decodeStage(json.stageRot);
    entities = json.entities;
    items = json.items;
    setCopyarea();
}
loadbutton.addEventListener("click", loadData);

function onClick(e,ex,ey) {
    ex ||= mouse.x;
    ey ||= mouse.y;
    const x = Math.floor((ex + camera_x) / GRID);
    const y = Math.floor((ey + camera_y) / GRID);
    if(x >= stageWidth){
        x = stageWidth - 1;
    }
    if(y >= stageHeight){
        y = stageHeight - 1;
    }
    if(commandLine.value != ""){
        commandLine.value += " " + x + " " + y;
    }

    if(elem < 0){
        if(elem == -1){
            if(stage[x][y] != EMPTY){
                stageRot[x][y]++;
                stageRot[x][y] %= 4;
            }
        }else if(elem == -2){
            startPoint.x = x;
            startPoint.y = y;
        }
        setCopyarea();
        return;
    }

    let placedItem = -1;
    let indexOfPlacedItem = -1;
    for(let i=items.length-1;i>=0;i--){
        if(items[i].x == x && items[i].y == y){
            placedItem = items[i].type;
            indexOfPlacedItem = i;
            break;
        }
    }
    let placedEntity = -1;
    let indexOfPlacedEntity = -1;
    for(let i=entities.length-1;i>=0;i--){
        if(entities[i].x == x && entities[i].y == y){
            placedEntity = entities[i].type;
            indexOfPlacedEntity = i;
            break;
        }
    }

    if(elem == EMPTY){
        if(placedItem != -1){items.splice(indexOfPlacedItem, 1);}
        if(placedEntity != -1){entities.splice(indexOfPlacedEntity, 1);}

        stage[x][y] = EMPTY;
        stageRot[x][y] = 0;
    }else if(elem==FLOPPY || elem==TACO || elem==BATTERY || elem==GLASSWARE){
        if(placedItem != -1){items.splice(indexOfPlacedItem, 1);}
        stage[x][y] = EMPTY;
        stageRot[x][y] = 0;

        if(placedItem != elem){
            const json = {
                type: elem,
                x: x,
                y: y
            };
            items.push(json);
        }
    }else if(unsquares.includes(elem)){
        if(placedEntity != -1){entities.splice(indexOfPlacedEntity, 1);}
        stage[x][y] = EMPTY;
        stageRot[x][y] = 0;

        if(placedEntity != elem){
            const json = {
                type: elem,
                x: x,
                y: y
            };
            entities.push(json);
        }
    }else if(stage[x][y] == elem){
        stage[x][y] = EMPTY;
        stageRot[x][y] = 0;
    }else{
        stage[x][y] = elem;
    }
    setCopyarea();
}
function onTouchstart(e) {
    for(let i=0;i<e.changedTouches.length;i++){
        const c = e.changedTouches[i];
        const x = (c.clientX - canvasRect.left) / canvas.clientWidth * canvasWidth;
        const y = (c.clientY - canvasRect.top) / canvas.clientHeight * canvasHeight;
        onClick(e,x,y);
    }
}

setStage();
setCopyarea();
window.addEventListener('load',redraw);
canvas.addEventListener('mousedown', onClick);
canvas.addEventListener('touchstart', onTouchstart, {passive:false});

const templates = [
    {
        type: CSB_CHAIN,
        lenes: [5],
        rps: [0.8]
    },
    {
        type: CSB_CHAIN,
        lenes: [5],
        rps: [0.5]
    }
]
function doComamnd() {
    const args = commandLine.value.split(" ").filter((a)=>{return a != "";});
    commandLine.value = "";
    if(args[0]=="fill"){
        if(args.length == 6){
            const color = Number(args[1]);
            const startX = Number(args[2]);
            const startY = Number(args[3]);
            const endX = Number(args[4]);
            const endY = Number(args[5]);
            for(let x=startX;x<=endX;x++){
                for(let y=startY;y<=endY;y++){
                    stage[x][y] = color;
                }
            }
        }
    }else if(args[0]=="cc"){
        if(args.length > 2 && (args.length-3)%2 == 0){
            const x = Number(args[1]);
            const y = Number(args[2]);
            let index = -1;
            for(let i=0;i<entities.length;i++){
                if(entities[i].x == x && entities[i].y == y){
                    index = i;
                    break;
                }
            }
            if(index == -1 || entities[index].type != CSB_CHAIN){
                return;
            }
            entities[index].lenes = [];
            entities[index].rps = [];
            for(let i=3;i<3+Math.floor((args.length-3 + 1)/2);i++){
                entities[index].lenes.push(Number(args[i]));
            }
            for(let i=3+Math.floor((args.length-3 + 1)/2);i<args.length;i++){
                entities[index].rps.push(Number(args[i]));
            }
        }
    }else if(args[0] == "tpl"){
        if(args.length == 4){
            const x = Number(args[1]);
            const y = Number(args[2]);
            const i = Number(args[3]);
            e = JSON.parse(JSON.stringify(templates[i]));
            e.x = x;
            e.y = y;
            entities.push(e);
        }
    }
    setCopyarea();
}
commandButton.addEventListener("click", doComamnd);

function copyData() {
    navigator.clipboard.writeText(copyarea.innerHTML);
}
copybutton.addEventListener("click",copyData);

let speed_x = 0;
let speed_y = 0;
function loop() {
    redraw();
    speed_x += (rightPressed - leftPressed) * 15;
    speed_y += (downPressed - upPressed) * 15;
    speed_x *= 0.6;
    speed_y *= 0.6;
    moveCamera(speed_x, speed_y, 1);
    tick++;
}

function mainloop() {
    setTimeout(function() {
        requestAnimationFrame(mainloop);
        loop();
      }, 1000 / FPS);
}
mainloop();
