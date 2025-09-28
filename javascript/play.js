let scene;
let playerX, playerY;
let speedX, speedY;
let powerCoef = 1;
let bgmVol = 0.5;
let sfxVol = 1;
let gameCoef = 1;
let rep = false;
let radarIsOn = false;
let stopDuringUnFocused = false;
let effectsIsOn = true;
let boxColor = 0;
let eyeIsOn = true;
let grid = false;
let keyIsON = false;
let falling = -1;
let startItems;
let startEntities;
let included = -1;
let plateY = 20;
let movingPlate = false;
let foodTick = -1;
let deliveringFood = false;
let playingTF = false;
let clearedTF = false;

let lastStageCleared = false;

let shake = 0;

let nowLevel = 0;
let nowCh = 0; // now chapter

let backCanvas;
let backWidth;
let backHeight;
let backIsDrawable = false;
let setUpedBack = false;
function setUpBack() {
    let backImage;
    setUpedBack = true;
    if(playingTF){
        backImage = backImages[0];
    }else if(scene == "home"){
        backImage = backImages[1];
    }else{
        backImage = backImages[nowCh];
    }
    backWidth = backImage.naturalWidth;
    backHeight = backImage.naturalHeight;
    backCanvas = document.createElement("canvas");
    backCanvas.width = canvasWidth + backWidth;
    backCanvas.height = canvasHeight + backHeight;
    const bctx = backCanvas.getContext("2d");
    for(let x=0;x<Math.ceil(backCanvas.width/backWidth);x++){
        for(let y=0;y<Math.ceil(backCanvas.width/backHeight);y++){
            bctx.drawImage(backImage, x*backWidth, y*backHeight, backWidth+1, backHeight+1);
        }
    }
}
let backX = 0;
let backY = 0;
function drawBack() {
    const dx = biasX - backX;
    const dy = biasY - backY;
    const dx2 = dx - Math.ceil(dx/backWidth)*backWidth;
    const dy2 = dy - Math.ceil(dy/backHeight)*backHeight;
    ctx.drawImage(backCanvas, dx2, dy2);
}

let foodTimeAlpha = 0;
let foodRadio;
function drawFoodTime() {
    if(deliveringFood){
        foodTimeAlpha = 0.2;
    }else{
        foodTimeAlpha = Math.max(foodTimeAlpha - 0.01, 0);
    }
    if(foodTimeAlpha > 0 && (tick < foodTick+FPS*10)){
        const r = Math.min(canvasWidth, canvasHeight) * 0.3;
        if(deliveringFood){
            foodRadio = (tick - foodTick)/(FPS*10);
        }
        if(foodRadio > 0.8){
            ctx.fillStyle = "red";
        }else if(foodRadio > 0.6){
            ctx.fillStyle = "darkorange";
        }else{
            ctx.fillStyle = "mediumseagreen";
        }
        ctx.globalAlpha = foodTimeAlpha;
        ctx.beginPath();
        ctx.moveTo(canvasWidth * 0.5, canvasHeight * 0.5);
        ctx.arc(canvasWidth * 0.5, canvasHeight * 0.5, r, (foodRadio*2 - 0.5)*Math.PI, -0.5*Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

const playerR = 0.8;

function findEntities(type) {
    let result = [];
    entities.forEach((e,i)=>{
        if(entities[i].type == type){
            result.push(i);
        }
    });
    return result;
}
function findTouchEntity(type) {
    if(!isTouch(type)){
        return -1;
    }
    const f = findEntities(type);
    for(let i=0,lf=f.length;i<lf;i++){
        entities[f[i]].type++;
        if(!isTouch(type)){
            entities[f[i]].type--;
            return f[i];
        }
        entities[f[i]].type--;
    }
}
let findTilesCache = {};
function findTiles(type) {
    if(type in findTilesCache){
        return findTilesCache[type];
    }
    let result = [];
    for(let x=0;x<stageWidth;x++){
        for(let y=0;y<stageHeight;y++){
            if(stage[x][y] == type){
                result.push([x,y]);
            }
        }
    }
    findTilesCache[type] = result;
    return result;
}

function isTouch(type) {
    return isTouchArea(type, playerX - playerR, playerY - playerR, playerX + playerR, playerY + playerR, 10);
}
function isTouchMultiTypes(types) {
    return isTouchAreaMultiTypes(types, playerX - playerR, playerY - playerR, playerX + playerR, playerY + playerR, 10);
}
function isTouchArea(type, sx, sy, ex, ey) {
    if(sx >= stageWidth || sy >= stageHeight || ex <= 0 || ey <= 0){
        return false;
    }
    if(type in entitiesHitboxes){
        const hitbox = entitiesHitboxes[type];
        const fe = findEntities(type);
        for(let i=0,lf=fe.length;i<lf;i++){
            const e = entities[fe[i]];
            if(type == CSB_CHAIN){
                sx -= e.endX - e.x;
                sy -= e.endY - e.y;
                ex -= e.endX - e.x;
                ey -= e.endY - e.y;
            }
            if(sx<e.x+hitbox[2] && sy<e.y+hitbox[3] && ex>e.x+hitbox[0] && ey>e.y+hitbox[1]){
                return true;
            }
            if(type == CSB_CHAIN){
                sx += e.endX - e.x;
                sy += e.endY - e.y;
                ex += e.endX - e.x;
                ey += e.endY - e.y;
            }
        }
    }
    const startX = Math.max(0,Math.floor(sx));
    const startY = Math.max(0,Math.floor(sy));
    const endX = Math.min(stageWidth,Math.ceil(ex));
    const endY = Math.min(stageHeight,Math.ceil(ey));
    if(type in tileHitboxes){
        const hitbox = tileHitboxes[type];
        const rhitboxes = [
            hitbox,
            [1-hitbox[3], hitbox[0], 1-hitbox[1], hitbox[2]],
            [1-hitbox[2], 1-hitbox[3], 1-hitbox[0], 1-hitbox[1]],
            [hitbox[1], 1-hitbox[2], hitbox[3], 1-hitbox[0]]
        ];
        for(let x=startX;x<endX;x++){
            for(let y=startY;y<endY;y++){
                const r = rhitboxes[stageRot[x][y]];
                if(stage[x][y] == type){
                    if(sx<x+r[2] && sy<y+r[3] && ex>x+r[0] && ey>y+r[1]){
                        return true;
                    }
                }
            }
        }
    }else{
        const n = SWITCHES.indexOf(type);
        if(n != -1){
            const on = switchStates[Math.floor(n/4)];
            if(!((n%4<2) || ((n%2 == 0 && !on) || (n%2 == 1 && on)))){
                return false;
            }
        }
        for(let x=startX;x<endX;x++){
            for(let y=startY;y<endY;y++){
                if(stage[x][y] == type){
                    return true;
                }
            }
        }
    }
    return false;
}
function isTouchAreaMultiTypes(types, sx, sy, ex, ey) {
    if(sx >= stageWidth || sy >= stageHeight || ex <= 0 || ey <= 0){
        return false;
    }
    for(let i=0,lt=types.length;i<lt;i++){
        const type = types[i];
        if(type in entitiesHitboxes){
            const hitbox = entitiesHitboxes[type];
            const fe = findEntities(type);
            for(let i=0,lf=fe.length;i<lf;i++){
                const e = entities[fe[i]];
                if(type == CSB_CHAIN){
                    sx -= e.endX - e.x;
                    sy -= e.endY - e.y;
                    ex -= e.endX - e.x;
                    ey -= e.endY - e.y;
                }
                if(sx<e.x+hitbox[2] && sy<e.y+hitbox[3] && ex>e.x+hitbox[0] && ey>e.y+hitbox[1]){
                    return true;
                }
                if(type == CSB_CHAIN){
                    sx += e.endX - e.x;
                    sy += e.endY - e.y;
                    ex += e.endX - e.x;
                    ey += e.endY - e.y;
                }
            }
        }
    }
    const startX = Math.max(0,Math.floor(sx));
    const startY = Math.max(0,Math.floor(sy));
    const endX = Math.min(stageWidth,Math.ceil(ex));
    const endY = Math.min(stageHeight,Math.ceil(ey));
    for(let x=startX;x<endX;x++){
        for(let y=startY;y<endY;y++){
            const type = stage[x][y];
            if(!(types.includes(type))){
                continue;
            }
            if(type in tileHitboxes){
                const hitbox = tileHitboxes[type];
                const rhitboxes = [
                    hitbox,
                    [1-hitbox[3], hitbox[0], 1-hitbox[1], hitbox[2]],
                    [1-hitbox[2], 1-hitbox[3], 1-hitbox[0], 1-hitbox[1]],
                    [hitbox[1], 1-hitbox[2], hitbox[3], 1-hitbox[0]]
                ];
                const r = rhitboxes[stageRot[x][y]];
                if(sx<x+r[2] && sy<y+r[3] && ex>x+r[0] && ey>y+r[1]){
                    return true;
                }
            }else{
                const n = SWITCHES.indexOf(type);
                if(n != -1){
                    const on = switchStates[Math.floor(n/4)];
                    if((n%4<2) || ((n%2 == 0 && !on) || (n%2 == 1 && on))){
                        return true;
                    }
                }else{
                    return true;
                }
            }
        }
    }
    return false;
}

function isHit() {
    return isTouchMultiTypes(hitable);
}
function isHitArea(sx, sy, ex, ey) {
    return isTouchAreaMultiTypes(hitable, sx, sy, ex,ey);
}
let filtedHitables = {};
function isHitAreaHitable(type, sx, sy, ex, ey) {
    if(!(type in filtedHitables)){
        filtedHitables[type] = hitable.filter((a)=>{return a!=type;});
    }
    return isTouchMultiTypes(filtedHitables[type], sx, sy, ex, ey);
}
function helpisHitForEntity(type, sx, sy, ex, ey) {
    for(let i=0,lh=hitable.length;i<lh;i++){
        const h = hitable[i];
        if(h!=type && isTouchArea(h, sx, sy, ex, ey)){
            return true;
        }
    }
    for(let i=0,lh=entitiesHitable.length;i<lh;i++){
        const h = entitiesHitable[i];
        if(h!=type && isTouchArea(h, sx, sy, ex, ey)){
            return true;
        }
    }
    return false;
}
function isHitForEntity(i) {
    const e = entities[i];
    const hitbox = entitiesHitboxes[e.type];
    return helpisHitForEntity(e.type, e.x+hitbox[0], e.y+hitbox[1], e.x+hitbox[2], e.y+hitbox[3]);
}

const delta = 0.05;
/*
     1: touch the right wall
    -1: touch the left wall
     0: not touching the wall
 */
function checkHitWall() {
    playerX += delta;
    if (isHit()) {
        playerX -= delta;
        return 1;
    }
    playerX -= delta * 2;
    if (isHit()) {
        playerX += delta;
        return -1;
    }
    playerX += delta;
    return 0;
}
function checkTouchWall(type) {
    playerX += delta;
    if (isTouch(type)) {
        playerX -= delta;
        return 1;
    }
    playerX -= delta * 2;
    if (isTouch(type)) {
        playerX += delta;
        return -1;
    }
    playerX += delta;
    return 0;
}

function onFloor() {
    playerY += delta;
    const result = isHit();
    playerY -= delta;
    return result;
}

function onDown(type) {
    playerY += delta;
    const result = isTouch(type);
    playerY -= delta;
    return result;
}

function isTouchDie() {
    for(let i=0,ls=sparks.length;i<ls;i++){
        const x = sparks[i].x;
        const y = sparks[i].y;
        if(Math.abs(playerX - x) < playerR && Math.abs(playerY - y) < playerR){
            return true;
        }
    }
    for(let i=0,ll=lasers.length;i<ll;i++){
        let ax = Math.min(lasers[i].sx, lasers[i].ex);
        let bx = Math.max(lasers[i].sx, lasers[i].ex);
        let ay = Math.min(lasers[i].sy, lasers[i].ey);
        let by = Math.max(lasers[i].sy, lasers[i].ey);
        if(bx-ax < 1){
            ax -= 0.2;
            bx += 0.2;
        }
        if(by-ay < 1){
            ay -= 0.2;
            by += 0.2;
        }
        if(ax < playerX + playerR && playerX - playerR < bx && ay < playerY + playerR && playerY - playerR < by){
            return true;
        }
    }
    return isTouch(SPIKE) || isTouch(SSPIKE) || isTouch(CHEMICAL) || isTouch(CSB) || isTouch(CSB_CHAIN) || isTouch(OIL_DRUM) || isTouch(HEATER2);
}

function addDustOfPlayers() {
    if(!effectsIsOn){
        return;
    }
    if(playerIsRight){
        addDust(playerX - playerR, playerY + playerR);
    }else{
        addDust(playerX + playerR, playerY + playerR);
    }
}

function movePlayer(x,y){
    playerX += x;
    playerY += y;
    if(!isHit()){
        return;
    }
    playerX -= x;
    playerY -= y;

    let dx = x;
    let dy = y;
    while(Math.max(Math.abs(dx),Math.abs(dy)) > delta*0.5){
        dx *= 0.5;
        dy *= 0.5;
        playerX += dx;
        if(isHit()){
            playerX -= dx;
            speedX = 0;
        }
        playerY += dy;
        if(isHit()){
            playerY -= dy;
            if(speedY > 0){
                falling = 0.1*FPS;
            }
            speedY = 0;
        }
    }
    playerX += dx;
    if(isHit()){
        playerX -= dx;
        speedX = 0;
    }
    playerY += dy;
    if(isHit()){
        playerY -= dy;
        if(speedY > 0){
        falling = 0.1*FPS;
        }
        speedY = 0;
    }
}
let repulsive = 0;
let repulTick = -1;
let powerTick = -1;
let powerDir = 0;
let lastJumpIsOnFloor = false;
let powerCount = 0;
let powerCount2 = 0;
let oldTouchSwitches;
function physics() {
    speedX += (rightPressed - leftPressed) * ACCE * powerCoef * powerCoef;
    if((rightPressed != leftPressed) && (tick < repulTick)){
        if(repulsive / (rightPressed - leftPressed) > 0){
            speedX += repulsive;
            speedY -= repulsive * 0.1;
        }
    }

    if(isHit()){
        const f = checkTouchWall(FLYING_BOARD);
        playerX += -(f * FLYING_BOARD_SPEED + speedX);
    }

    speedX *= RESISTANCE;
    speedY += GRAVITY;

    movePlayer(speedX,speedY);

    falling--;
    if(upPressed && falling > 0){
        speedY = -JUMP * powerCoef;
        falling = 0;
        lastJumpIsOnFloor = checkTouchWall(MAGNET)!=0;
        for(let i=0;i<5;i++){
            addDustOfPlayers();
        }
        playSound(audios.jump);
    }

    powerCount--;
    powerCount2--;
    if(powerCount2 > 0 && rightPressed != leftPressed){
        speedY = -JUMP;
        powerCount = 0;
        powerCount2 = 0;
        powerTick = tick;
        powerDir = (rightPressed - leftPressed);
    }
    if(powerCount > 0 && upPressed){
        powerCount = 0;
        powerTick = tick;
        powerDir = rightPressed - leftPressed;
    }
    if(onDown(POWER_BOX)){
        powerCount = 0.1*FPS;
        if(upPressed){
            powerCount2 = 0.07*FPS;
        }
    }

    if(tick - powerTick < 0.5*FPS){
        speedX += powerDir * ACCE * POWER;
    }

    let magnet = checkTouchWall(MAGNET);
    if(falling > 0){
        magnet = 0;
    }
    if(onFloor() || (speedY < -JUMP*0.5 && lastJumpIsOnFloor)){
        magnet = 0;
    }
    if(magnet != 0){
        if (speedY > DESCENT) {
            speedY = DESCENT;
        }
    }
    if(magnet != 0){
        if(upPressed || (rightPressed - leftPressed) == -magnet){
            repulsive = magnet * -REPULSIVE;
            repulTick = tick + REPULSIVE_TIME*FPS;
            speedX = JUMP * 0.5 * magnet * -1;
            speedY = -JUMP;
            lastJumpIsOnFloor = false;
            playSound(audios.repul);
        }
    }

    if(isTouch(LIFT)){
        if(upPressed){
            speedY = -RISE;
        }
    }

    if(falling > 0 && Math.abs(speedX) > 0.01){
        addDustOfPlayers();
    }

    speedX += (onDown(CONV_R) - onDown(CONV_L)) * ACCE * CONV_SPEED;

    if(oldTouchSwitches === undefined){
        oldTouchSwitches = [];
        for(let i=0;i*4<SWITCHES.length;i++){
            oldTouchSwitches.push(isTouch(SWITCHES[i*4]));
        }
    }else{
        let push = false;
        let rate = 0;
        for(let i=0;i*4<SWITCHES.length;i++){
            const s = isTouch(SWITCHES[i*4]);
            if(s && !oldTouchSwitches[i]){
                push = true;
                rate = i;
            }
            oldTouchSwitches[i] = s;
        }
        if(push){
            audios.door.playbackRate = 1 - (rate*0.2);
            playSound(audios.door);
        }
    }
}

let oldS = switchStates.concat();
const switchable = [OIL_DRUM, FLYING_BOARD];
function updateDoors() {
    for(let i=0;i*4 < SWITCHES.length;i++){
        let S = isTouch(SWITCHES[i*4]);
        if(!S){
            S = findTiles(SWITCHES[i*4]).some((place)=>{
                const x = place[0];
                const y = place[1];
                for(let i=0,ls=switchable.length;i<ls;i++){
                    if(isTouchArea(switchable[i], x+delta, y+delta, x+1-delta, y+1-delta, 2)){
                        return true;
                    }
                }
                return false;
            });
        }
        if(S && !oldS[i]){
            switchStates[i] = !switchStates[i];
            addDoorEffects(i);
        }
        oldS[i] = S;
    }
}

function updateBucket() {
    playerY += delta;
    const f = findTouchEntity(BUCKET);
    if(f != -1){
        if(entities[f].count === undefined){
            entities[f].count = Math.ceil(FPS * 0.1);
        }
    }
    playerY -= delta;
    findEntities(BUCKET).forEach((i)=>{
        if(entities[i].count !== undefined){
            if(entities[i].count > 0){
                entities[i].count--;
            }else{
                entities[i].type = BBUCKET;
                entities[i].dy = 0;
                entities[i].alpha = 1;
            }
        }
    });
    findEntities(BBUCKET).reverse().forEach((i)=>{
        entities[i].y += entities[i].dy;
        entities[i].dy += 0.01;
        entities[i].alpha -= 0.03;
        if(entities[i].alpha < 0){
            entities.splice(i, 1);
        }
    });
}

function updateItems() {
    for(let i=0,li=items.length;i<li;i++){
        if(findEntities(HOOK).some((j)=>{
            return (entities[j].x == items[i].x && entities[j].y+1 == items[i].y);
        })){
            continue;
        }

        if(items[i].dy === undefined){
            items[i].dy = 0;
        }else{
            items[i].dy += GRAVITY * 0.5;
        }
        const steps = Math.max(Math.abs(items[i].dy * 30), 10);
        for(let j=0;j<steps;j++){
            if(isHitArea(items[i].x, items[i].y, items[i].x+1, items[i].y+1)){
                items[i].dy = 0;
                break;
            }
            items[i].y += items[i].dy / steps;
        }
        while(isHitArea(items[i].x+delta, items[i].y+delta, items[i].x+1-delta, items[i].y+1-delta)){
            items[i].y -= delta;
        }
    }
}

function updateCC() {
    findEntities(CSB_CHAIN).forEach((i)=>{
        let e = entities[i];
        let x = e.x + 1;
        let y = e.y + 1;
        for(let i=0;i<e.lenes.length;i++){
            x += e.lenes[i] * Math.sin(e.rps[i] * (tick/FPS) * (Math.PI * 2));
            y += e.lenes[i] * Math.cos(e.rps[i] * (tick/FPS) * (Math.PI * 2));
        }
        entities[i].endX = x;
        entities[i].endY = y;
    });
}

function updateFlyingBoard() {
    findEntities(FLYING_BOARD).forEach((i)=>{
        if(entities[i].dx === undefined){
            entities[i].dx = FLYING_BOARD_SPEED;
            entities[i].t = 0;
        }
        if(entities[i].t == 0){
            entities[i].x += entities[i].dx;
        }else{
            entities[i].t--;
        }
        if(isHitForEntity(i)){
            entities[i].x -= entities[i].dx;
            entities[i].dx *= -1;
            entities[i].t = FLYING_BOARD_STOPING_TIME * FPS * 0.001;
        }
    });
}

function updateOilDrum() {
    findEntities(OIL_DRUM).reverse().forEach((i)=>{
        if(entities[i].dx === undefined){
            entities[i].dx = OIL_DRUM_SPEED;
            entities[i].dy = 0;
            entities[i].rot = 0;
        }
        entities[i].dy += GRAVITY;
        const steps = Math.max((Math.abs(entities[i].dx) + Math.abs(entities[i].dy)) * 30, 10);
        for(let j=0;j<steps;j++){
            entities[i].x += entities[i].dx / steps;
            if(isHitForEntity(i)){
                entities[i].x -= entities[i].dx / steps;
                addOilDrumEffects(entities[i]);
                entities[i].dx *= -1;
            }else{
                entities[i].rot += entities[i].dx / steps;
            }
            entities[i].y += entities[i].dy / steps;
            if(isHitForEntity(i)){
                entities[i].y -= entities[i].dy / steps;
                if(entities[i].dy > GRAVITY*3){
                    shake = SHAKE * 0.5;
                }
                entities[i].dy = 0;
            }
        }
        if(entities[i].x < 0 - 2 || entities[i].x > stageWidth + 2 || entities[i].y < 0 - 2 || entities[i].y > stageHeight + 2){
            entities.splice(i,1);
        }
    });
}

const heaterCycle = 2;
function updateHeater() {
    if(tick % (heaterCycle * FPS) == 0 && tick > 0){
        const f1 = findEntities(HEATER);
        const f2 = findEntities(HEATER2);
        f1.forEach((i)=>{
            entities[i].type = HEATER2;
            entities[i].biasX = 0;
        });
        f2.forEach((i)=>{
            entities[i].type = HEATER;
            entities[i].biasX = 0;
        });
    }else if(tick % (heaterCycle * FPS) == ((heaterCycle-0.2) * FPS) && tick > 0){
        const f1 = findEntities(HEATER);
        const f2 = findEntities(HEATER2);
        f1.forEach((i)=>{
            entities[i].biasX = 1/3 * ((Math.random() < 0.5)*2-1);
        });
        f2.forEach((i)=>{
            entities[i].biasX = 1/3 * ((Math.random() < 0.5)*2-1);
        });
    }else{
        const f1 = findEntities(HEATER);
        const f2 = findEntities(HEATER2);
        f1.forEach((i)=>{
            entities[i].biasX *= -0.8;
        });
        f2.forEach((i)=>{
            entities[i].biasX *= -0.8;
        });
    }
}

function calcBlink() {
    if(scene == "home"){
        return true;
    }
    const x = Math.floor(tick / FPS * 12);
    const touching = onFloor() || (checkTouchWall(MAGNET) != 0);
    return (x%30 == 5 || x%30 == 7) && touching && scene == "play";
}

let playerColors = ["#a96e2d", "tomato", "royalblue"];
let playerColorNames = ["default", "red", "blue"];

let playerIsRight = 1;
function drawPlayer() {
    let dis = Math.min(playerR * 0.5, Math.max(playerR * -0.5, speedX * DISTORTION));
    if(!eyeIsOn){
        dis *= 1.5;
    }
    if(included != -1){
        const LIM = playerR * 0.3 * 0.5;
        let d;
        if(Math.abs(dis) < LIM){
            d = 0;
        }else if(speedX > 0){
            d = dis - LIM;
        }else{
            d = dis + LIM;
        }
        ctx.drawImage(tileImages[included], cx(playerX - playerR * 0.7 + d), cy(playerY - playerR * 1.7), GRID * 1.4 * playerR, GRID * 1.4 * playerR);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx(playerX - playerR * 0.7 + d), cy(playerY - playerR));
        ctx.lineTo(cx(playerX + playerR * 0.7 + d), cy(playerY - playerR));
        ctx.stroke();
    }
    ctx.fillStyle = playerColors[boxColor];
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx(playerX - playerR + dis), cy(playerY - playerR));
    ctx.lineTo(cx(playerX + playerR + dis), cy(playerY - playerR));
    ctx.lineTo(cx(playerX + playerR), cy(playerY + playerR)+1);
    ctx.lineTo(cx(playerX - playerR), cy(playerY + playerR)+1);
    ctx.fill();
    if(powerCoef > 1){
        ctx.closePath();
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.lineJoin = "miter";
    }
    ctx.strokeStyle = "black";
    const blink = calcBlink();
    const cross = scene == "diedPause";
    if(speedX > 0){
        playerIsRight = 1;
    }else if(speedX < 0){
        playerIsRight = 0;
    }
    if(!eyeIsOn){
        return;
    }
    if(cross){
        const crossSize = 0.13;
        ctx.lineWidth = 3;
        if(playerIsRight){
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 + playerR * 0.6 + crossSize), cy(playerY - playerR + 0.7 + crossSize));
            ctx.lineTo(cx(playerX + dis * 0.7 + playerR * 0.6 - crossSize), cy(playerY - playerR + 0.7 - crossSize));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 + playerR * 0.6 + crossSize), cy(playerY - playerR + 0.7 - crossSize));
            ctx.lineTo(cx(playerX + dis * 0.7 + playerR * 0.6 - crossSize), cy(playerY - playerR + 0.7 + crossSize));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 - playerR * 0.2 + crossSize), cy(playerY - playerR + 0.7 + crossSize));
            ctx.lineTo(cx(playerX + dis * 0.7 - playerR * 0.2 - crossSize), cy(playerY - playerR + 0.7 - crossSize));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 - playerR * 0.2 + crossSize), cy(playerY - playerR + 0.7 - crossSize));
            ctx.lineTo(cx(playerX + dis * 0.7 - playerR * 0.2 - crossSize), cy(playerY - playerR + 0.7 + crossSize));
            ctx.stroke();
        }else{
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 - playerR * 0.6 + crossSize), cy(playerY - playerR + 0.7 + crossSize));
            ctx.lineTo(cx(playerX + dis * 0.7 - playerR * 0.6 - crossSize), cy(playerY - playerR + 0.7 - crossSize));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 - playerR * 0.6 + crossSize), cy(playerY - playerR + 0.7 - crossSize));
            ctx.lineTo(cx(playerX + dis * 0.7 - playerR * 0.6 - crossSize), cy(playerY - playerR + 0.7 + crossSize));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 + playerR * 0.2 + crossSize), cy(playerY - playerR + 0.7 + crossSize));
            ctx.lineTo(cx(playerX + dis * 0.7 + playerR * 0.2 - crossSize), cy(playerY - playerR + 0.7 - crossSize));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 + playerR * 0.2 + crossSize), cy(playerY - playerR + 0.7 - crossSize));
            ctx.lineTo(cx(playerX + dis * 0.7 + playerR * 0.2 - crossSize), cy(playerY - playerR + 0.7 + crossSize));
            ctx.stroke();
        }
        return;
    }
    if(blink){
        if(playerIsRight){
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 + playerR * 0.6 + 0.15), cy(playerY - playerR + 0.7));
            ctx.lineTo(cx(playerX + dis * 0.7 + playerR * 0.6 - 0.15), cy(playerY - playerR + 0.7));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 - playerR * 0.2 + 0.15), cy(playerY - playerR + 0.7));
            ctx.lineTo(cx(playerX + dis * 0.7 - playerR * 0.2 - 0.15), cy(playerY - playerR + 0.7));
            ctx.stroke();
        }else{
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 - playerR * 0.6 + 0.15), cy(playerY - playerR + 0.7));
            ctx.lineTo(cx(playerX + dis * 0.7 - playerR * 0.6 - 0.15), cy(playerY - playerR + 0.7));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 + playerR * 0.2 + 0.15), cy(playerY - playerR + 0.7));
            ctx.lineTo(cx(playerX + dis * 0.7 + playerR * 0.2 - 0.15), cy(playerY - playerR + 0.7));
            ctx.stroke();
        }
    }else{
        if(playerIsRight){
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 + playerR * 0.6), cy(playerY - playerR + 0.7 + 0.15));
            ctx.lineTo(cx(playerX + dis * 0.7 + playerR * 0.6), cy(playerY - playerR + 0.7 - 0.15));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 - playerR * 0.2), cy(playerY - playerR + 0.7 + 0.15));
            ctx.lineTo(cx(playerX + dis * 0.7 - playerR * 0.2), cy(playerY - playerR + 0.7 - 0.15));
            ctx.stroke();
        }else{
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 - playerR * 0.6), cy(playerY - playerR + 0.7 + 0.15));
            ctx.lineTo(cx(playerX + dis * 0.7 - playerR * 0.6), cy(playerY - playerR + 0.7 - 0.15));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx(playerX + dis * 0.7 + playerR * 0.2), cy(playerY - playerR + 0.7 + 0.15));
            ctx.lineTo(cx(playerX + dis * 0.7 + playerR * 0.2), cy(playerY - playerR + 0.7 - 0.15));
            ctx.stroke();
        }
    }
}

function collects() {
    if(included == -1){
        for(let i=0,li=items.length;i<li;i++){
            if(Math.abs(items[i].x + 0.5 - playerX) < playerR+0.5 && Math.abs(items[i].y + 0.5 - playerY) < playerR+0.5){
                included = items[i].type;
                items.splice(i, 1);
                if(included == TACO){
                    foodTick = tick;
                    deliveringFood = true;
                }else if(included == BATTERY){
                    powerCoef = 1.3;
                    playSound(audios.battery);
                }else if(included == GLASSWARE){
                    glassCount = 0;
                }
                break;
            }
        }
    }
}
function deliver() {
    const f = findTouchEntity(POST);
    const e = entities[f];
    if(f != -1 && included != -1){
        addItemEffects(included, e.x, e.y);
        addCollected(included);
        powerCoef = 1;
        included = -1;
        deliveringFood = false;
        playSound(audios.collect);
    }
}

let dusts = [];
function drawDust() {
    ctx.fillStyle = "gray";
    let x,y,r,rot;
    for(let i=0,ld=dusts.length;i<ld;i++){
        x = dusts[i].x;
        y = dusts[i].y;
        r = dusts[i].r;
        rot = dusts[i].rot;
        ctx.beginPath();
        ctx.moveTo(cx(x + r * Math.sin(rot)), cy(y + r * Math.cos(rot)));
        ctx.lineTo(cx(x - r * Math.cos(rot)), cy(y + r * Math.sin(rot)));
        ctx.lineTo(cx(x - r * Math.sin(rot)), cy(y - r * Math.cos(rot)));
        ctx.lineTo(cx(x + r * Math.cos(rot)), cy(y - r * Math.sin(rot)));
        ctx.fill();
    }
}
function updateDust() {
    for(let i=dusts.length-1;i>=0;i--){
        dusts[i].y -= dusts[i].up;
        dusts[i].r -= 0.015;
        if (dusts[i].r < 0) {
            dusts.splice(i, 1);
        }
    }
}
function addDust(x, y) {
    dusts.push({
        x: x,
        y: y,
        up: Math.random() * 0.04,
        r: Math.random() * 0.3,
        rot: Math.random() * Math.PI
    });
}

let doorEffectsMaxTick = 15;
let doorEffects = [];
function drawDoorEffects() {
    ctx.fillStyle = "orangered";
    let x,y,r,rot;
    for(let i=0,ld=doorEffects.length;i<ld;i++){
        x = doorEffects[i].x + doorEffects[i].dx * bound(doorEffects[i].n / doorEffectsMaxTick / 6);
        y = doorEffects[i].y + doorEffects[i].dy * bound(doorEffects[i].n / doorEffectsMaxTick / 6);
        r = doorEffects[i].r * (1-doorEffects[i].n/doorEffectsMaxTick);
        rot = doorEffects[i].rot;
        ctx.beginPath();
        ctx.moveTo(cx(x + r * Math.sin(rot)), cy(y + r * Math.cos(rot)));
        ctx.lineTo(cx(x - r * Math.cos(rot)), cy(y + r * Math.sin(rot)));
        ctx.lineTo(cx(x - r * Math.sin(rot)), cy(y - r * Math.cos(rot)));
        ctx.lineTo(cx(x + r * Math.cos(rot)), cy(y - r * Math.sin(rot)));
        ctx.fill();
    }
}
function updateDoorEffects() {
    for(let i=doorEffects.length-1;i>=0;i--){
        doorEffects[i].n++;
        if(doorEffects[i].n > doorEffectsMaxTick){
            doorEffects.splice(i, 1);
        }
    }
}
function addDoorEffects(type) {
    for(let x=0;x<stageWidth;x++){
        for(let y=0;y<stageHeight;y++){
            const n = SWITCHES.indexOf(stage[x][y]);
            if(n > 0 && Math.floor(n/4)==type &&n%4 >= 2){
                const rot = stageRot[x][y];
                if(rot == 0){
                    helpAddDoorEffects(x+0.5,y+1);
                }else if(rot == 2){
                    helpAddDoorEffects(x+0.5,y);
                }else if(rot == 3){
                    helpAddDoorEffects(x+1,y+0.5);
                }else{
                    helpAddDoorEffects(x,y+0.5);
                }
            }
        }
    }
}
function helpAddDoorEffects(x,y) {
    for(let i=0;i<20;i++){
        const dir = i/20 * Math.PI * 2;
        doorEffects.push({
            x: x,
            y: y,
            r: Math.random()*0.3,
            rot: Math.random() * Math.PI,
            dx: Math.sin(dir),
            dy: Math.cos(dir),
            n: 0
        });
    }
}

let itemEffects = [];
function drawItemEffects() {
    let type, x, y;
    for(let i=0;i<itemEffects.length;i++){
        type = itemEffects[i].type;
        x = itemEffects[i].x;
        y = itemEffects[i].y;
        ctx.globalAlpha = itemEffects[i].alpha;
        ctx.drawImage(tileImages[type], cx(x - 1), cy(y - 1), 2 * GRID, 2 * GRID);
    }
    ctx.globalAlpha = 1;
}
function updateItemEffects() {
    for(let i=itemEffects.length-1;i>=0;i--){
        itemEffects[i].y -= 0.04;
        itemEffects[i].alpha -= 0.04;
        if (itemEffects[i].alpha < 0) {
            itemEffects.splice(i, 1);
        }
    }
}
function addItemEffects(type, x, y) {
    const json = {
        type: type,
        x: x + 0.5,
        y: y,
        alpha: 1
    };
    itemEffects.push(json);
}

let chemicalEffects = [];
function drawChemicalEffects() {
    ctx.fillStyle = "violet";
    for(let i=0,lc=chemicalEffects.length;i<lc;i++){
        const c = chemicalEffects[i];
        ctx.beginPath();
        ctx.arc(cx(c.x), cy(c.y), c.r*GRID, 0, Math.PI*2);
        ctx.fill();
    }
}
function updateChemicalEffects() {
    findTiles(CHEMICAL).forEach((place)=>{
        const x = place[0];
        const y = place[1];
        if(Math.random() < 0.7){
            return;
        }
        const json = {
            x: x + Math.random(),
            y: y + Math.random() * 0.5,
            r: Math.random() * 0.2
        };
        chemicalEffects.push(json);
    });
    for(let i=chemicalEffects.length-1;i>=0;i--){
        chemicalEffects[i].y -= 0.05;
        chemicalEffects[i].r += 0.01;
        if(chemicalEffects[i].r > 0.17){
            chemicalEffects.splice(i,1);
        }
    }
}

const radarCycle = 1.5; //seconds
function drawRadarEffects() {
    if(!radarIsOn){
        return;
    }
    const t = (tick/FPS)/radarCycle-Math.floor((tick/FPS)/radarCycle);
    const r = t*(2-t) * 1.2 + 0.3;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.globalAlpha = (1-t) * 0.5;
    for(let i=0,li=items.length;i<li;i++){
        const item = items[i];
        ctx.beginPath();
        ctx.arc(cx(item.x+0.5), cy(item.y+0.5), r*GRID, 0, 2*Math.PI);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

let sparks = [];
function drawSparks() {
    ctx.fillStyle = "red";
    let x,y,r,rot;
    for(let i=0;i<sparks.length;i++){
        x = sparks[i].x;
        y = sparks[i].y;
        r = sparks[i].r;
        rot = sparks[i].rot;
        ctx.beginPath();
        ctx.moveTo(cx(x + r * Math.sin(rot)), cy(y + r * Math.cos(rot)));
        ctx.lineTo(cx(x - r * Math.cos(rot)), cy(y + r * Math.sin(rot)));
        ctx.lineTo(cx(x - r * Math.sin(rot)), cy(y - r * Math.cos(rot)));
        ctx.lineTo(cx(x + r * Math.cos(rot)), cy(y - r * Math.sin(rot)));
        ctx.fill();
    }
}
function updateSparks() {
    for(let i=sparks.length-1;i>=0;i--){
        sparks[i].x += sparks[i].dx;
        sparks[i].y += sparks[i].dy;
        sparks[i].dy += 0.02;
        if(sparks[i].dy > 0.3){
            sparks.splice(i, 1);
        }
    }
}
function addSparks() {
    if(tick % Math.floor(FPS * 0.7) == 0){
        findEntities(CRACK).forEach((i)=>{
            const e = entities[i];
            for(let j=0;j<=10;j++){
                const x = e.x + 1;
                const y = e.y + 0.5;
                const rot = (j-5)/10 * Math.PI / 12;
                const json = {
                    x: x,
                    y: y,
                    dx: Math.sin(rot) * 0.3,
                    dy: (Math.cos(rot) * -0.3) * (Math.random() + 1) * 0.5,
                    r: 0.1,
                    rot: Math.random() * Math.PI
                }
            sparks.push(json);
            }
        });
    }
    if(tick % Math.floor(FPS * 1.5) == 0){
        findEntities(SCRACK).forEach((i)=>{
            const e = entities[i];
            for(let j=0;j<=10;j++){
                const x = e.x + 1;
                const y = e.y + 0.5;
                const rot = (j-5)/10 * Math.PI / 12;
                const json = {
                    x: x,
                    y: y,
                    dx: Math.sin(rot) * 0.3,
                    dy: (Math.cos(rot) * -0.3) * (Math.random() + 1) * 0.5,
                    r: 0.1,
                    rot: Math.random() * Math.PI
                }
            sparks.push(json);
            }
        });
    }
}

let lasers = [];
function drawLASERs() {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    for(let i=0;i<lasers.length;i++){
        ctx.beginPath();
        ctx.moveTo(cx(lasers[i].sx), cy(lasers[i].sy));
        ctx.lineTo(cx(lasers[i].ex), cy(lasers[i].ey));
        ctx.stroke();
    }
}
let lastLaserTick;
function updateLASERs() {
    let i=0;
    findTiles(LASER_BOX).forEach((place)=>{
        const x = place[0];
        const y = place[1];
        if(lasers[i] === undefined){
            lasers.push({});
        }
        lasers[i].sx = x+0.5;
        lasers[i].sy = y+0.5;
        let dx,dy;
        if(stageRot[x][y] == 0){
            dx = 0; dy = 1;
        }else if(stageRot[x][y] == 1){
            dx = -1; dy = 0;
        }else if(stageRot[x][y] == 2){
            dx = 0; dy = -1;
        }else{
            dx = 1; dy = 0;
        }
        addLASER_effects(lasers[i].sx,lasers[i].sy,dx,dy);
        if(lasers[i].length === undefined){
            lasers[i].length = 0;
        }
        let ex = x+0.5;
        let ey = y+0.5;
        ex += dx;
        ey += dy;
        dx *= LASER_SPEED / FPS;
        dy *= LASER_SPEED / FPS;
        let length = 0;
        while(!isHitArea(ex-0.2, ey-0.2, ex+0.2, ey+0.2) && length <= lasers[i].length || isTouchArea(GLASS, ex-0.2, ey-0.2, ex+0.2, ey+0.2)){
            ex += dx;
            ey += dy;
            length++;
        }
        lasers[i].ex = ex;
        lasers[i].ey = ey;
        lasers[i].length = length;
        i++;
    });
}

let LASER_effects = [];
function addLASER_effects(x,y,dx,dy) {
    const json = {
        x: (Math.random() - 0.5) + x,
        y: (Math.random() - 0.5) + y,
        r: Math.random() * 0.15,
        rot: Math.random() * Math.PI,
        dx: dx*0.1,
        dy: dy*0.1,
        alpha: 1
    };
    LASER_effects.push(json);
}
function drawLASER_effects() {
    ctx.fillStyle = "red";
    for(let i=0;i<LASER_effects.length;i++){
        const x = LASER_effects[i].x;
        const y = LASER_effects[i].y;
        const r = LASER_effects[i].r;
        const rot = LASER_effects[i].rot;
        ctx.globalAlpha = LASER_effects[i].alpha;
        ctx.beginPath();
        ctx.moveTo(cx(x + r * Math.sin(rot)), cy(y + r * Math.cos(rot)));
        ctx.lineTo(cx(x - r * Math.cos(rot)), cy(y + r * Math.sin(rot)));
        ctx.lineTo(cx(x - r * Math.sin(rot)), cy(y - r * Math.cos(rot)));
        ctx.lineTo(cx(x + r * Math.cos(rot)), cy(y - r * Math.sin(rot)));
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}
function updateLASER_effects() {
    for(let i=0;i<LASER_effects.length;i++){
        LASER_effects[i].x += LASER_effects[i].dx;
        LASER_effects[i].y += LASER_effects[i].dy;
    }
    for(let i=LASER_effects.length-1;i>=0;i--){
        LASER_effects[i].alpha -= 0.1;
        if(LASER_effects[i].alpha < 0){
            LASER_effects.splice(i,1);
        }
    }
}

let powerEffects = [];
function drawPowerEffects() {
    ctx.fillStyle = "orange";
    for(let i=0,lp=powerEffects.length;i<lp;i++){
        const x = powerEffects[i].x;
        const y = powerEffects[i].y;
        const r = powerEffects[i].r;
        const rot = powerEffects[i].rot;
        ctx.globalAlpha = powerEffects[i].alpha;
        ctx.beginPath();
        ctx.moveTo(cx(x + r * Math.sin(rot)), cy(y + r * Math.cos(rot)));
        ctx.lineTo(cx(x - r * Math.cos(rot)), cy(y + r * Math.sin(rot)));
        ctx.lineTo(cx(x - r * Math.sin(rot)), cy(y - r * Math.cos(rot)));
        ctx.lineTo(cx(x + r * Math.cos(rot)), cy(y - r * Math.sin(rot)));
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}
function updatePowerEffects() {
    findTiles(POWER_BOX).forEach((place)=>{
        const x = place[0];
        const y = place[1];
        powerEffects.push({
            x: x + Math.random(),
            y: y + Math.random() * 0.5,
            dx: (Math.random()-0.5) * 0.05,
            r: Math.random() * 0.15,
            rot: Math.random() * Math.PI,
            alpha: 1
        });
    });
    for(let i=powerEffects.length-1;i>=0;i--){
        powerEffects[i].x += powerEffects[i].dx;
        powerEffects[i].y -= 0.1;
        powerEffects[i].alpha -= 0.1;
        if(powerEffects[i].alpha < 0){
            powerEffects.splice(i,1);
        }
    }
}

let batteryEffects = [];
function drawBatteryEffects() {
    if(powerCoef > 1){
        ctx.fillStyle = "orange";
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx(playerX), cy(playerY), playerR * 1.3 * GRID, 0, 2*Math.PI);
        ctx.fill();
    }
    ctx.fillStyle = "red";
    for(let i=0,lb=batteryEffects.length;i<lb;i++){
        const b = batteryEffects[i];
        const x = b.x;
        const y = b.y;
        const rot = b.rot;
        const r = b.r;
        ctx.globalAlpha = b.alpha;
        ctx.beginPath();
        ctx.moveTo(cx(x + r * Math.sin(rot)), cy(y + r * Math.cos(rot)));
        ctx.lineTo(cx(x - r * Math.cos(rot)), cy(y + r * Math.sin(rot)));
        ctx.lineTo(cx(x - r * Math.sin(rot)), cy(y - r * Math.cos(rot)));
        ctx.lineTo(cx(x + r * Math.cos(rot)), cy(y - r * Math.sin(rot)));
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}
function updateBatteryEffects() {
    if(powerCoef > 1){
        for(let i=0;i<4;i++){
            const speed = (Math.random() + 1) * 0.2;
            const rot = Math.random() * Math.PI * 2;
            const json = {
                x: playerX,
                y: playerY,
                dx: speed * Math.sin(rot),
                dy: speed * Math.cos(rot),
                rot: Math.random() * Math.PI,
                r: Math.random() * 0.2,
                alpha: 1.5
            };
            batteryEffects.push(json);
        }
    }
    for(let i=batteryEffects.length-1;i>=0;i--){
        batteryEffects[i].x += batteryEffects[i].dx;
        batteryEffects[i].y += batteryEffects[i].dy;
        batteryEffects[i].dx *= 0.9;
        batteryEffects[i].dy *= 0.9;
        batteryEffects[i].alpha -= 0.1;
        if(batteryEffects[i].alpha < 0){
            batteryEffects.splice(i,1);
        }
    }
}

let saverEffects = [];
function drawSaverEffects() {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "lightgreen";
    for(let i=0,ls=saverEffects.length;i<ls;i++){
        const s = saverEffects[i];
        const rr = (s.i / 10) * 1.5;
        const x = s.x + rr*Math.sin(s.rot);
        const y = s.y + rr*Math.cos(s.rot);
        const r = s.r * ((i+10)/(10+10));
        const rot = s.rot;
        ctx.beginPath();
        ctx.moveTo(cx(x + r * Math.sin(rot)), cy(y + r * Math.cos(rot)));
        ctx.lineTo(cx(x - r * Math.cos(rot)), cy(y + r * Math.sin(rot)));
        ctx.lineTo(cx(x - r * Math.sin(rot)), cy(y - r * Math.cos(rot)));
        ctx.lineTo(cx(x + r * Math.cos(rot)), cy(y - r * Math.sin(rot)));
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}
function updateSaverEffets() {
    findTiles(SAVER).forEach((place)=>{
        const x = place[0];
        const y = place[1];
        for(let i=0;i<3;i++){
            const json = {
                x: x+0.5,
                y: y+0.5,
                rot: Math.random() * 2 * Math.PI,
                r: Math.random() * 0.2,
                i: 10
            };
            saverEffects.push(json);
        }
    });
    for(let i=saverEffects.length-1;i>=0;i--){
        saverEffects[i].i--;
        if(saverEffects[i].i <= 2){
            saverEffects.splice(i, 1);
        }
    }
}
let savedEffects = 0; 
function drawSavedEffects() {
    if(savedEffects == 0){
        return;
    }
    const t = 1 - savedEffects.i / 10;
    const r = 1 - t*t;
    ctx.fillStyle = "green";
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(cx(savedEffects.x), cy(savedEffects.y), GRID*r*2, 0, 2*Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
}
function updateSavedEffects() {
    if(savedEffects == 0){
        return;
    }
    savedEffects.i--;
    if(savedEffects.i == 3){
        savedEffects = 0;
    }
}
function addSavedEffects() {
    savedEffects = {
        x: playerX,
        y: playerY - 1,
        i: 10
    };
}

let oilDrumEffects = [];
function drawOilDrumEffects() {
    ctx.fillStyle = "gray";
    for(let i=0;i<oilDrumEffects.length;i++){
        const o = oilDrumEffects[i];
        ctx.globalAlpha = o.alpha;
        if(o.isLeft){
            ctx.beginPath();
            ctx.moveTo(cx(o.x), cy(o.y+0.25));
            ctx.lineTo(cx(o.x+0.25), cy(o.y+0.75));
            ctx.lineTo(cx(o.x+0.5), cy(o.y+0.5));
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx(o.x), cy(o.y-0.25));
            ctx.lineTo(cx(o.x+0.25), cy(o.y-0.75));
            ctx.lineTo(cx(o.x+0.5), cy(o.y-0.5));
            ctx.fill();
        }else{
            ctx.beginPath();
            ctx.moveTo(cx(o.x), cy(o.y+0.25));
            ctx.lineTo(cx(o.x-0.25), cy(o.y+0.75));
            ctx.lineTo(cx(o.x-0.5), cy(o.y+0.5));
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx(o.x), cy(o.y-0.25));
            ctx.lineTo(cx(o.x-0.25), cy(o.y-0.75));
            ctx.lineTo(cx(o.x-0.5), cy(o.y-0.5));
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}
function updateOilDrumEffects() {
    for(let i=oilDrumEffects.length-1;i>=0;i--){
        oilDrumEffects[i].alpha -= 0.04;
        if(oilDrumEffects[i].alpha <= 0){
            oilDrumEffects.splice(i,1);
        }
    }
}
function addOilDrumEffects(e) {
    let json = {
        y: e.y + 1,
        alpha: 0.5
    };
    if(e.dx > 0){
        json.x = e.x + 2;
        json.isLeft = false;
    }else{
        json.x = e.x;
        json.isLeft = true;
    }
    oilDrumEffects.push(json);
}

let diedEffects = [];
function drawDiedEffects() {
    ctx.fillStyle = "springgreen";
    for (let i=0,ld=diedEffects.length;i<ld;i++) {
        const x = diedEffects[i].x;
        const y = diedEffects[i].y;
        const n = diedEffects[i].n;
        const r = bound(n / 60) * playerR * 2;
        const alpha = (1 - n / 20) * 0.7;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(cx(x), cy(y), r * GRID, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}
function updateDiedEffects() {
    for (let i=diedEffects.length-1;i>=0;i--) {
        diedEffects[i].n++;
        if (diedEffects[i].n > 20) {
            diedEffects.splice(i, 1);
        }
    }
}
function addDiedEffect(x, y) {
    diedEffects.push({
        x: x,
        y: y,
        n: 0
    })
}

let collected = [];
let uncollected;
function drawCollectedList() {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.fillStyle = "white";
    ctx.fillRect(canvasWidth, 0, -GRID * 1.5 * (1.5 * (collected.length + uncollected) + 1.0), GRID * 1.5 * 2);
    ctx.strokeRect(canvasWidth, 0, -GRID * 1.5 * (1.5 * (collected.length + uncollected) + 1.0), GRID * 1.5 * 2);
    let x = canvasWidth - GRID * 1.5 * 2;
    const y = GRID * 1.5 * 0.5;
    for (let i=0,lc=collected.length;i<lc;i++) {
        ctx.drawImage(tileImages[collected[i]], x, y, GRID * 1.5, GRID * 1.5);
        x -= GRID * 1.5 * 1.5;
    }
    for (let i=0;i<uncollected;i++) {
        ctx.drawImage(images.uncollected, x, y, GRID * 1.5, GRID * 1.5);
        x -= GRID * 1.5 * 1.5;
    }
}
let playing = false;
function addCollected(item) {
    collected.push(item);
    uncollected--;
    if(uncollected == 0){
        if(!cleared.includes(nowLevel)){
            cleared.push(nowLevel);
        }
        const time = Number(timerText);
        if(!(nowLevel in times) || times[nowLevel] > time){
            times[nowLevel] = time;
        }
        clearTextTick = 0;
        playing = false;
        audios.next.play();
        setTimeout(nextLevel, LEVELCLEAR_TEXT_TIME*1000);
    }
}

function drawPlate() {
    if(plate >= 0){
        const img = plateImages[plate];
        if(plateY + img.naturalHeight > 0){
            ctx.drawImage(img, 20, canvasHeight - plateY - img.naturalHeight);
        }
    }
}
function updatePlate() {
    if(movingPlate){
        plateY -= 500/FPS;
    }
}
function plateOnclick(e, x, y) {
    if(scene != "play" || plate < 0){
        return;
    }
    x ||= mouse.x;
    y ||= mouse.y;
    let img = plateImages[plate];
    let Y = canvasHeight - plateY - img.naturalHeight;
    if(20 < x && x < 20+img.naturalWidth && Y < y && y < Y+img.naturalHeight){
        e.stopImmediatePropagation();
        movingPlate = true;
    }
}
function plateOntouchstart(e) {
    for(let i=0;i<e.changedTouches.length;i++){
        const c = e.changedTouches[i];
        const x = (c.clientX - canvasRect.left) / canvas.clientWidth * canvasWidth;
        const y = (c.clientY - canvasRect.top) / canvas.clientHeight * canvasHeight;
        plateOnclick(e,x,y);
    }
}
canvas.addEventListener("click", plateOnclick);
canvas.addEventListener("touchstart", plateOntouchstart, {passive: false});

let timerText;
function drawTimer() {
    if((scene == "play" && playing) || timerText === undefined){
        timerText = (tick/FPS).toFixed(2);
    }
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "black";
    ctx.fillText(timerText, 10, 30);
    ctx.fillStyle = "#dd0000";
    if(times[nowLevel] === undefined){
        ctx.fillText("pb:--", 10 + 80, 30);
    }else{
        ctx.fillText("pb:" + times[nowLevel].toFixed(2), 10 + 80, 30);
    }
}

function lerpCameraHome() {
    if(isSmartPhone){
        camera_x = playerX * GRID - canvasWidth * 0.5 + 20*Math.sin(ltick*0.01);
        camera_y = playerY * GRID - canvasHeight * 0.5 + 20*Math.cos(ltick*0.01) - 100;
    }else{
        camera_x = playerX * GRID - canvasWidth * 0.5 + (mouse.x - canvasWidth*0.5)*0.01;
        camera_y = playerY * GRID - canvasHeight * 0.5 + (mouse.y - canvasHeight*0.5)*0.01 - 100;
    }
}

function reset() {
    tick = 0;
    savedata = 0;

    scene = "play";
    plateY = 20;
    movingPlate = false;
    items = JSON.parse(JSON.stringify(startItems));
    entities = JSON.parse(JSON.stringify(startEntities));
    included = -1;
    deliveringFood = false;
    timerTick = 0;
    collected = [];
    dusts = [];
    itemEffects = [];
    diedEffects = [];
    doorEffects = [];
    sparks = [];
    lasers = [];
    LASER_effects = [];
    chemicalEffects = []
    oilDrumEffects = [];
    powerEffects = [];
    batteryEffects = [];
    saverEffects = [];
    savedEffects = 0;
    powerCount = 0;
    powerTick = -1;
    powerDir = 0;
    foodTick = -1;
    repulTick = -1;
    uncollected = startItems.length;
    switchStates = new Array(switchStates.length).fill(false);
    playerIsRight = 1;
    playerX = startPoint.x + 0.5;
    playerY = startPoint.y + 0.5;
    speedX = 0;
    speedY = 0;
    falling = -1;
    oldFalling = -1;
    powerCoef = 1;
    shake = 0;
}
function restart() {
    reset();
    camera_x = playerX * GRID - canvasWidth * 0.5;
    camera_y = playerY * GRID - canvasHeight * 0.5;
}
let oldFalling = -1;
let glassCount = 0;
function gameover() {
    const glassware = (oldFalling < -15 && falling >= 0 && included == GLASSWARE && glassCount > 5);
    glassCount++;
    oldFalling = falling;
    if(speedY > 1.4){
        resetToDied();
    }else if(isTouchDie() || isHit()){
        addDiedEffect(playerX, playerY);
        scene = "diedPause";
        if(playing){
            shake = SHAKE;
        }else{
            shake = SHAKE * 0.5;
        }
        const oldScene = scene;
        setTimeout(()=>{
            if(scene == oldScene){
                resetToDied();
            }
        }, 300);
    }else if(deliveringFood && tick > foodTick + FPS*10){
        deliveringFood = false;
        foodTimeAlpha = 0;
        resetToDied();
    }else if(glassware){
        playSound(audios.glass);
        shake = SHAKE * 0.2;
        scene = "diedPause";
        const oldScene = scene;
        setTimeout(()=>{
            if(scene == oldScene){
                resetToDied();
            }
        }, 300);
    }
}
function resetToDied() {
    if(savedata == 0){
        reset();
    }else{
        items = JSON.parse(JSON.stringify(savedata.items));
        collected = JSON.parse(JSON.stringify(savedata.collected));
        uncollected = savedata.uncollected;
        included = savedata.included;
        playerX = savedata.x;
        playerY = savedata.y;
        speedX = 0;
        speedY = 0;
        switchStates = savedata.s;
        playing = true;
        scene = "play";
        if(included != BATTERY){
            powerCoef = 1;
        }
        deliveringFood = false;
        foodTick = -1;
    }
}

let savedata = 0;
let oldSaver = false;
function save() {
    let saver = isTouch(SAVER);
    if(saver && !oldSaver){
        savedata = {
            items: JSON.parse(JSON.stringify(items)),
            collected: JSON.parse(JSON.stringify(collected)),
            s: JSON.parse(JSON.stringify(switchStates)),
            uncollected: uncollected,
            included: included,
            x: playerX,
            y: playerY
        };
        addSavedEffects();
        playSound(audios.save);
    }
    oldSaver = saver;
}

function bound(t) {
    if(t < 1){
        return -((t - 1) ** 2) * 0.5 + 1;
    }else{
        return 1;
    }
}
let clearTextTick;
function drawLevelclear() {
    if (clearTextTick <= FPS*LEVELCLEAR_TEXT_TIME) {
        const clearimage = images.levelclear;
        const clearTextSize = bound(clearTextTick/FPS*LEVELCLEAR_TEXT_TIME*(20/3));
        ctx.drawImage(
            clearimage, canvasWidth * 0.5 - clearimage.naturalWidth * 0.5 * clearTextSize, canvasHeight * 0.2,
            clearimage.naturalWidth * clearTextSize, clearimage.naturalHeight * clearTextSize);
    }
}
function updateLevelclearText() {
    if(clearTextTick <= FPS*LEVELCLEAR_TEXT_TIME){
        clearTextTick++;
    }
}

let praiseEffects = [];
let praiseTick = 0;
const praiseColors = ["red", "blue", "green", "yellow"];
function drawPraise() {
    ctx.globalAlpha = 0.5;
    for(let i=0,lp=praiseEffects.length;i<lp;i++){
        const p = praiseEffects[i];
        const x = p.x;
        const y = p.y;
        const r = p.r;
        const rot = p.rot;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(x + r * Math.sin(rot), y + r * Math.cos(rot));
        ctx.lineTo(x - r * Math.cos(rot), y + r * Math.sin(rot));
        ctx.lineTo(x - r * Math.sin(rot), y - r * Math.cos(rot));
        ctx.lineTo(x + r * Math.cos(rot), y - r * Math.sin(rot));
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    const x = (canvasWidth - images.praisetext.naturalWidth) * 0.5;
    ctx.drawImage(images.praisetext, x, Math.sqrt(praiseTick)*30 - 100);
}
function updatePraise() {
    for(let i=praiseEffects.length-1;i>=0;i--){
        praiseEffects[i].x += praiseEffects[i].dx;
        praiseEffects[i].y += praiseEffects[i].dy;
        praiseEffects[i].dy += 0.1;

        if(praiseEffects[i].y > canvasHeight + 50){
            praiseEffects.splice(i, 1);
        }
    }
    praiseTick++;
    if(praiseEffects.length == 0){
        gotoHome();
        updateBGM();
    }
}
function addPraise() {
    praiseEffects = [];
    for(let i=0;i<81*81;i++){
        praiseEffects.push({
            x: canvasWidth * 0.5,
            y: -canvasHeight * 0.5,
            r: (Math.random() + 1)*0.5 * 10,
            rot: Math.random() * Math.PI,
            dx: (Math.random()*2 - 1) * 10,
            dy: Math.random() * 10,
            color: praiseColors[Math.floor(Math.random()*praiseColors.length)]
        });
    }
}

let cleared = [];
let times = {};

const listRowLength = 6;
const listStartY = canvasHeight*0.45;
let listTick = 0;
let listCh = 0;
let listBiasX = 0;
let listPointer = 0;
const listElemColors = [[["#dddddd","#dddd88"],["#88dddd","#dddd55"]],[["white","#ffffaa"],["#aaffff","#ffffdd"]]];
function drawList() {
    if(scene == "list"){
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.globalAlpha = 1;

        let sum = 0;
        for(let i=0;i<listCh;i++){
            sum += nstage[i];
        }

        const startX = 100;
        const startY = listStartY;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        const t = ltick - listTick;
        let x = 0;
        let y = 0;
        const r = 50;

        ctx.fillStyle = "white";
        ctx.font = "50px bold";
        ctx.textBaseline  = "bottom";
        ctx.textAlign = "center";
        ctx.fillText(listCh+1, startX+(r+10)*listRowLength*0.5-10, startY-20);
        ctx.font = "25px bold";
        ctx.fillText(chapterNames[listCh], startX+(r+10)*listRowLength*0.5-10, startY-20-60);

        if(listCh+1 < nstage.length){
            ctx.beginPath();
            ctx.moveTo(startX+(r+10)*listRowLength*0.5-10 + 50, startY-20);
            ctx.lineTo(startX+(r+10)*listRowLength*0.5-10 + 50, startY-20-50);
            ctx.lineTo(startX+(r+10)*listRowLength*0.5-10 + 73, startY-20-25);
            ctx.fill();
        }
        if(0 < listCh){
            ctx.beginPath();
            ctx.moveTo(startX+(r+10)*listRowLength*0.5-10 - 50, startY-20);
            ctx.lineTo(startX+(r+10)*listRowLength*0.5-10 - 50, startY-20-50);
            ctx.lineTo(startX+(r+10)*listRowLength*0.5-10 - 73, startY-20-25);
            ctx.fill();
        }

        for(let i=0,l=nstage[listCh];i<l;i++){
            ctx.textBaseline  = "middle";
            ctx.textAlign = "center";
            const k = Math.min(1,Math.max(0,t/FPS*6 - (x+y)/FPS*6));
            const rectX = x*(r+10) + startX + (r*0.5-r*k*0.5);
            const rectY = y*(r+10) + startY + (r*0.5-r*k*0.5);
            const width = r*k;
            const height = r*k;

            ctx.strokeStyle = "black";

            const mouseOver = rectX < mouse.x && mouse.x < rectX+width && rectY < mouse.y && mouse.y < rectY+height;
            ctx.fillStyle = listElemColors[cleared.includes(i+sum)*1][(i+sum==nowLevel)*1][mouseOver*1];

            ctx.fillRect(rectX+listBiasX, rectY, width, height);
            ctx.strokeRect(rectX+listBiasX, rectY, width, height);
            if(k > 0.5){
                ctx.font = Math.floor(r*0.7)+"px bold";
                ctx.fillStyle = "#555555";
                ctx.fillText(i+1, rectX+width*0.5 + listBiasX, rectY+height*0.5);
            }

            if(mouseOver && ((i+sum) in times)){
                ctx.fillStyle = "white";
                ctx.font = "30px bold";
                ctx.textBaseline  = "bottom";
                ctx.textAlign = "center";
                ctx.fillText(times[i+sum].toFixed(2) + "s", startX+(r+10)*listRowLength*0.5+150, startY-20);
            }

            if(isSmartPhone && i == listPointer){
                ctx.strokeStyle = "red";
                ctx.strokeRect(rectX+listBiasX - 5, rectY - 5 , width + 10, height + 10);
            }

            x++;
            if(x >= listRowLength){
                x = 0;
                y++;
            }
        }

        if(isSmartPhone){
            ctx.strokeStyle = "orange";
            ctx.beginPath();
            ctx.moveTo(canvasWidth*0.75 + 80 + 60, canvasHeight*(2/3));
            ctx.lineTo(canvasWidth*0.75 + 80, canvasHeight*(2/3) + 60);
            ctx.lineTo(canvasWidth*0.75 + 80 - 60, canvasHeight*(2/3));
            ctx.lineTo(canvasWidth*0.75 + 80, canvasHeight*(2/3) - 60);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(canvasWidth*0.75 - 80 + 60, canvasHeight*(2/3));
            ctx.lineTo(canvasWidth*0.75 - 80, canvasHeight*(2/3) + 60);
            ctx.lineTo(canvasWidth*0.75 - 80 - 60, canvasHeight*(2/3));
            ctx.lineTo(canvasWidth*0.75 - 80, canvasHeight*(2/3) - 60);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(canvasWidth*0.75 + 60, canvasHeight*(2/3) - 80);
            ctx.lineTo(canvasWidth*0.75, canvasHeight*(2/3) - 80  + 60);
            ctx.lineTo(canvasWidth*0.75 - 60, canvasHeight*(2/3) - 80);
            ctx.lineTo(canvasWidth*0.75, canvasHeight*(2/3) - 80 - 60);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(canvasWidth*0.75 + 60, canvasHeight*(2/3) + 80);
            ctx.lineTo(canvasWidth*0.75, canvasHeight*(2/3) + 80  + 60);
            ctx.lineTo(canvasWidth*0.75 - 60, canvasHeight*(2/3) + 80);
            ctx.lineTo(canvasWidth*0.75, canvasHeight*(2/3) + 80 - 60);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(canvasWidth*0.75 + 60 + 80, canvasHeight*(2/3) + 80  + 60, 50, 0 ,2*Math.PI);
            ctx.stroke();
        }
    }
    ctx.textBaseline = "bottom";
    ctx.textAlign = "start";
}
function updateList() {
    listBiasX *= 0.9;
}
function listOnmousedown(e,ex,ey) {
    if(scene != "list"){
        return;
    }
    e.stopImmediatePropagation();
    ex ||= mouse.x;
    ey ||= mouse.y;

    let sum = 0;
    for(let i=0;i<listCh;i++){
        sum += nstage[i];
    }

    const startX = 100;
    const startY = listStartY;
    const r = 50;

    if(listCh+1 < nstage.length){
        if(startX+(r+10)*listRowLength*0.5-10 + 50 - 15 < ex && ex < startX+(r+10)*listRowLength*0.5-10 + 73 + 15 && startY-20-50 < ey && ey < startY-20){
            listCh++;
            listBiasX = 15;
            listPointer = 0;
            playSound(audios.select);
            return;
        }
    }
    if(0 < listCh){
        if(startX+(r+10)*listRowLength*0.5-10 - 73 - 15 < ex && ex < startX+(r+10)*listRowLength*0.5-10 - 50 + 15 && startY-20-50 < ey && ey < startY-20){
            listCh--;
            listBiasX = -15;
            listPointer = 0;
            playSound(audios.select);
            return;
        }
    }

    if(isSmartPhone){
        if(Math.abs(ex - (canvasWidth*0.75 + 80)) + Math.abs(ey - (canvasHeight*(2/3))) < 60){
            listPointer += 1;
            if(listPointer >= nstage[listCh]){
                listPointer = nstage[listCh] - 1;
            }else if(listPointer < 0){
                listPointer = 0;
            }
            return;
        }
        if(Math.abs(ex - (canvasWidth*0.75 - 80)) + Math.abs(ey - (canvasHeight*(2/3))) < 60){
            listPointer += -1;
            if(listPointer >= nstage[listCh]){
                listPointer = nstage[listCh] - 1;
            }else if(listPointer < 0){
                listPointer = 0;
            }
            return;
        }
        if(Math.abs(ex - (canvasWidth*0.75)) + Math.abs(ey - (canvasHeight*(2/3) + 80)) < 60){
            listPointer += listRowLength;
            if(listPointer >= nstage[listCh]){
                listPointer = nstage[listCh] - 1;
            }else if(listPointer < 0){
                listPointer = 0;
            }
            return;
        }
        if(Math.abs(ex - (canvasWidth*0.75)) + Math.abs(ey - (canvasHeight*(2/3) - 80)) < 60){
            listPointer -= listRowLength;
            if(listPointer >= nstage[listCh]){
                listPointer = nstage[listCh] - 1;
            }else if(listPointer < 0){
                listPointer = 0;
            }
            return;
        }
        if((ex - (canvasWidth*0.75 + 60 + 80)) * (ex - (canvasWidth*0.75 + 60 + 80)) + (ey - (canvasHeight*(2/3) + 80  + 60)) * (ey - (canvasHeight*(2/3) + 80  + 60)) < 50*50){
            startLevel(listPointer+sum);
            updateBGM();
            return;
        }
    }

    scene = "play";

    let x = 0;
    let y = 0;
    ctx.fillStyle = "white";
    for(let i=0,l=nstage[listCh];i<l;i++){
        const rectX = x*(r+10) + startX;
        const rectY = y*(r+10) + startY;
        const width = r;
        const height = r;
        if(rectX < ex && ex < rectX+width && rectY < ey && ey < rectY+height){
            if(i+sum != nowLevel){
                startLevel(i+sum);
                updateBGM();
            }
            return;
        }
        x++;
        if(x >= listRowLength){
            x = 0;
            y++;
        }
    }
}
function listOntouchstart(e) {
    for(let i=0;i<e.changedTouches.length;i++){
        const c = e.changedTouches[i];
        const x = (c.clientX - canvasRect.left) / canvas.clientWidth * canvasWidth;
        const y = (c.clientY - canvasRect.top) / canvas.clientHeight * canvasHeight;
        listOnmousedown(e,x,y);
    }
}
canvas.addEventListener("mousedown", listOnmousedown);
canvas.addEventListener("touchstart", listOntouchstart, {passive:false});

let endTick = 0;

let bgms = [audios.home, audios.tf, audios.ch1, audios.ch2, audios.ch3, audios.ch4];
for(let i=0,lb=bgms.length;i<lb;i++){
    function loop(){
        if(!bgms[i].paused && ( (bgms[i].duration - bgms[i].currentTime)<0.5 || bgms[i].currentTime < 0.5)){
            bgms[i].currentTime = 0;
            setTimeout(loop, Math.floor((bgms[i].duration - bgms[i].currentTime)*1000));
        }
    }
    bgms[i].addEventListener("play",loop);
}

let bgmIndex = -1;
function updateBGM() {
    let i;
    if(playingTF){
        i = 1;
    }else if(scene == "home" || scene == "goingToPlay"){
        i = 0;
    }else if(scene == "ending"){
        i = -1;
    }else{
        let ch = 0;
        let sum = 0;
        while(sum <= nowLevel){
            sum += nstage[ch];
            ch++;
        }
        ch--;

        i = ch+2;
    }

    if(bgmIndex != i){
        if(bgmIndex >= 0){
            bgms[bgmIndex].pause();
            bgms[bgmIndex].currentTime = 0;
        }
        if(i >= 0){
            bgms[i].play();
        }
        bgmIndex = i;
    }
}
function updateVol() {
    if(scene == "pause"){
        for(let key in audios){
            audios[key].volume = 0;
        }
        return;
    }
    for(let i=0,lb=bgms.length;i<lb;i++){
        bgms[i].volume = bgmVol;
    }
    for(let key in audios){
        if(!bgms.includes(audios[key])){
            audios[key].volume = sfxVol;
        }
    }
}
canvas.addEventListener("mousedown", updateBGM);
canvas.addEventListener("touchend", updateBGM, {passive:false});

const OPTIONS_MAX_X = 600;
const OPTIONS_MAX_Y = canvasHeight - 50;
let options = [];
function drawOptions() {
    if(scene == "options"){
        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.globalAlpha = 1;

        ctx.font = "bold italic 30px Arial";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";
        ctx.strokewidth = 4;
        let j=0;
        for(let i=options.length-1;i>=0;i--,j++){
            const s = options[i];
            if(s.type == "list"){
                ctx.fillText(s.name+": "+s.ary[s.i], 100, OPTIONS_MAX_Y - 50*j);
            }else if(s.type == "range"){
                ctx.fillText(s.name+": "+s.data+s.unit, 100, OPTIONS_MAX_Y - 50*j);
                ctx.beginPath();
                ctx.arc(300, OPTIONS_MAX_Y - 50*j - 15, 13, 0, 2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(300 + 200, OPTIONS_MAX_Y - 50*j - 15, 13, 0, 2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(300, OPTIONS_MAX_Y - 50*j - 15);
                ctx.lineTo(300 + 200, OPTIONS_MAX_Y - 50*j - 15);
                ctx.stroke();
                ctx.fillStyle = "#555555";
                ctx.beginPath();
                ctx.arc(300 + (s.data - s.range[0]) / (s.range[1] - s.range[0]) * 200, OPTIONS_MAX_Y - 50*j - 15, 10, 0, 2*Math.PI);
                ctx.fill();
                ctx.fillStyle = "white";
            }
        }
        ctx.beginPath();
        ctx.moveTo(70, OPTIONS_MAX_Y);
        ctx.lineTo(70, OPTIONS_MAX_Y - 50*options.length + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(OPTIONS_MAX_X, OPTIONS_MAX_Y);
        ctx.lineTo(OPTIONS_MAX_X, OPTIONS_MAX_Y - 50*options.length + 10);
        ctx.stroke();
    }
}
let moveRangeI = -1;
function optionsOnmousedown(e,x,y){
    if(scene != "options"){
        return;
    }
    e.stopImmediatePropagation();
    x ||= mouse.x;
    y ||= mouse.y;
    const i = (options.length-1) - Math.floor((OPTIONS_MAX_Y - y + 10)/50);
    if(!(0<=i && i<options.length && 70 < x && x < OPTIONS_MAX_X)){
        scene = "play";
        return;
    }
    const s = options[i];
    if(s.type == "range" && (0<=i && i<options.length && 70 < x && x < 300+200)){
        if(300 < x){
            s.data = Math.round((x - 300)/200 * (s.range[1]-s.range[0]) + s.range[0]);
            options[i].func(s.data);
            moveRangeI = i;
        }else{
            const half = Math.round((s.range[0] + s.range[1]) / 2);
            if(s.data == half){
                s.data = s.range[1];
            }else if(s.data == 0){
                s.data = half;
            }else{
                s.data = 0;
            }
            options[i].func(s.data);
        }
    }else if(s.type == "list" && (0<=i && i<options.length && 70 < x && x < OPTIONS_MAX_X)){
        options[i].i++;
        options[i].i %= options[i].ary.length;
        options[i].func(options[i].ary[options[i].i]);
    }
}
function optionsOnmousemove(e,x,y){
    if(scene != "options"){
        return;
    }
    e.stopImmediatePropagation();
    x ||= mouse.x;
    y ||= mouse.y;
    const i = (options.length-1) - Math.floor((OPTIONS_MAX_Y - y + 10)/50);
    if(!(0<=i && i<options.length)){
        return;
    }
    const s = options[i];
    if(moveRangeI == i){
        if(s.type == "range"){
            if(0<=i && i<options.length && 300 - 10 < x && x < 300+200 + 10){
                s.data = Math.min(100,Math.max(0,Math.round((x - 300)/200 * (s.range[1]-s.range[0]) + s.range[0])));
                options[i].func(s.data);
            }
        }
    }else{
        moveRangeI = -1;
    }
}
function optionsOnclick(e,x,y){
    if(scene != "options"){
        return;
    }
    e.stopImmediatePropagation();
    x ||= mouse.x;
    y ||= mouse.y;
    moveRangeI = -1;
}
function optionsOntouchstart(e) {
    for(let i=0;i<e.changedTouches.length;i++){
        const c = e.changedTouches[i];
        const x = (c.clientX - canvasRect.left) / canvas.clientWidth * canvasWidth;
        const y = (c.clientY - canvasRect.top) / canvas.clientHeight * canvasHeight;
        optionsOnmousedown(e,x,y);
    }
}
function optionsOntouchmove(e) {
    for(let i=0;i<e.changedTouches.length;i++){
        const c = e.changedTouches[i];
        const x = (c.clientX - canvasRect.left) / canvas.clientWidth * canvasWidth;
        const y = (c.clientY - canvasRect.top) / canvas.clientHeight * canvasHeight;
        optionsOnmousemove(e,x,y);
    }
}
function optionsOntouchend(e) {
    for(let i=0;i<e.changedTouches.length;i++){
        const c = e.changedTouches[i];
        const x = (c.clientX - canvasRect.left) / canvas.clientWidth * canvasWidth;
        const y = (c.clientY - canvasRect.top) / canvas.clientHeight * canvasHeight;
        optionsOnclick(e,x,y);
    }
}
function addOption(type, name, data, d, func, unit) {
    if(type == "list"){
        options.push({
            type: type,
            name: name,
            ary: data,
            i: d,
            func: func
        });
        func(data[d]);
    }else if(type == "range"){
        options.push({
            type: type,
            name: name,
            range: data,
            data: d,
            unit: unit,
            func: func
        });
        func(d);
    }
}
canvas.addEventListener("mousedown", optionsOnmousedown);
canvas.addEventListener("mousemove", optionsOnmousemove);
canvas.addEventListener("click", optionsOnclick);
canvas.addEventListener("touchstart", optionsOntouchstart, {passive:false});
canvas.addEventListener("touchmove", optionsOntouchmove, {passive:false});
canvas.addEventListener("touchend", optionsOntouchend, {passive:false});

addOption("range", "BGM", [0, 100], 50, (a)=>{bgmVol = a*0.01; updateVol();}, "%");
addOption("range", "SFX", [0, 100], 100, (a)=>{sfxVol = a*0.01; updateVol();}, "%");
addOption("list", "speed", [0.8,0.9,1,1.1,1.2], 2, (a)=>{gameCoef = a;});
addOption("list", "repeat the same level", ["ON","OFF"], 1, (a)=>{rep = (a=="ON");});
addOption("list", "radar", ["ON","OFF"], 1, (a)=>{radarIsOn = (a=="ON");});
addOption("list", "effects", ["ON","OFF"], 0, (a)=>{effectsIsOn= (a=="ON");});
addOption("list", "player color", playerColorNames, 0, (a)=>{boxColor=playerColorNames.indexOf(a);});
addOption("list", "draw eye", ["ON","OFF"], 0, (a)=>{eyeIsOn= (a=="ON");});
addOption("list", "grid" ,["ON","OFF"], 1, (a=>{grid = (a=="ON")}));
addOption("list", "keys" ,["ON","OFF"], 1, (a=>{keyIsON = (a=="ON")}));
addOption("list", "stopDuringUnFocused", ["ON","OFF"], 1, (a)=>{stopDuringUnFocused = (a=="ON");});

let buttons = {};
function updateButtons() {
    if(!(scene in buttons)){
        return;
    }
    for(let i=0,lb=buttons[scene].length;i<lb;i++){
        if(buttons[scene][i].type !== undefined && buttons[scene][i].type == "big"){
            if(buttons[scene][i].size === undefined){
                buttons[scene][i].size = 1;
            }
            if(Math.abs(buttons[scene][i].x - mouse.x) < buttons[scene][i].image.naturalWidth*0.5 && Math.abs(buttons[scene][i].y - mouse.y) < buttons[scene][i].image.naturalHeight*0.5){
                buttons[scene][i].size += 0.02;
            }else{
                buttons[scene][i].size -= 0.03;
            }
            buttons[scene][i].size = Math.max(1,Math.min(1.2,buttons[scene][i].size));
        }
    }
}
function drawButtons() {
    if (!(scene in buttons)) {
        return;
    }
    for (let i=0;i<buttons[scene].length;i++) {
        const buttondata = buttons[scene][i];
        const image = buttondata.image;
        if(image === undefined){
            continue;
        }
        const x = buttondata.x;
        const y = buttondata.y;
        const w = buttondata.image.naturalWidth;
        const h = buttondata.image.naturalHeight;
        if(buttondata.size !== undefined){
            const size = buttondata.size;
            ctx.drawImage(image, x-w*0.5*size, y-h*0.5*size, w*size, h*size);
        }else if (Math.abs(buttondata.x - mouse.x) < w*0.5 && Math.abs(buttondata.y - mouse.y) < h*0.5){
            ctx.drawImage(image, x-w*0.5-5, y-h*0.5-5, w+10, h+10);
        }else{
            ctx.drawImage(image, x-w*0.5, y-h*0.5);
        }
    }
}
function buttonsOnmousedown(e,x,y) {
    if(!(scene in buttons)){
        return;
    }
    x ||= mouse.x;
    y ||= mouse.y;
    for (let i=0;i<buttons[scene].length;i++){
        const buttondata = buttons[scene][i];
        if(buttondata.image === undefined){continue;}
        if(Math.abs(buttondata.x - x) < buttondata.image.naturalWidth*0.5 && Math.abs(buttondata.y - y) < buttondata.image.naturalHeight*0.5){
            buttondata.func();
            e.stopImmediatePropagation();
            return;
        }
    }
    if(scene == "pause"){
        unpause();
    }
}
function buttonsOntouchstart(e) {
    for(let i=0;i<e.changedTouches.length;i++){
        const c = e.changedTouches[i];
        const x = (c.clientX - canvasRect.left) / canvas.clientWidth * canvasWidth;
        const y = (c.clientY - canvasRect.top) / canvas.clientHeight * canvasHeight;
        buttonsOnmousedown(e,x,y);
    }
}
function buttonsOnkeyup(e) {
    if(!(scene in buttons)){
        return;
    }
    for(let i=0;i<buttons[scene].length;i++){
        const buttondata = buttons[scene][i];
        if(buttondata.key !== undefined && buttondata.key.toLowerCase() == e.key.toLowerCase()){
            buttondata.func();
            return;
        }
    }
}
canvas.addEventListener("mousedown", buttonsOnmousedown);
canvas.addEventListener("touchstart", buttonsOntouchstart, {passive:false});
document.addEventListener("keyup", buttonsOnkeyup);
function addButton(scene, image, x, y, key, func, type) {
    if (!(scene in buttons)) {
        buttons[scene] = [];
    }
    buttons[scene].push({
        image: image,
        x: x,
        y: y,
        key: key,
        func: func,
        type: type
    });
}

let shutterTick = 0;
function beginGame() {
    startLevel(0);
    scene = "goingToPlay";
    updateBGM();
    shutterTick = ltick;
}
let pausedAudio = [];
function pause() {
    if(!playing){
        return;
    }
    scene = "pause";
    pausedAudio = [];
    for(let key in audios){
        if(!audios[key].paused){
            pausedAudio.push(key);
            audios[key].pause();
        }
    }
}
function unpause() {
    scene = "play";
    for(let i=0,lp=pausedAudio.length;i<lp;i++){
        audios[pausedAudio[i]].play();
    }
}
function goToOptions() {
    scene = "options";
    playSound(audios.select);
}
function goToList() {
    listTick = ltick;
    listCh = nowCh;
    listBiasX = 0;
    scene = "list";
    listPointer = 0;
    playSound(audios.select);
}
function skipEnding() {
    gotoHome();
    setUpBack();
    audios.end.pause();
    updateBGM();
}
function gotoTF() {
    playingTF = true;
    playing = true;
    nowLevel = levels.length;
    loadLevel(tf);
    setUpBack();
    updateBGM();
}
function onHome() {
    gotoHome();
    updateBGM();
}
function onRestart() {
    if(playing){
        restart();
    }
}
addButton("home", images.play, canvasWidth*0.8, 200, "p", beginGame, "big");
addButton("play", images.home, canvasWidth*0.5-150, 40, undefined, onHome);
addButton("play", images.pause, canvasWidth*0.5, 40, "p", pause);
addButton("play", images.options, canvasWidth*0.5+60, 40, "o", goToOptions);
addButton("play", images.list, canvasWidth*0.5+150, 40, "l", goToList);
addButton("diedPause", images.options, canvasWidth*0.5+60, 40, "o", goToOptions);
addButton("diedPause", images.list, canvasWidth*0.5+150, 40, "l", goToList);
addButton("options", undefined, 0, 0, "o", ()=>{scene="play";});
addButton("play", images.restart, canvasWidth*0.5-60, 40, "r", onRestart);
addButton("pause", images.restart, canvasWidth*0.5-60, 40, "r", onRestart);
addButton("pause", undefined, 0, 0, "p", unpause);
addButton("ending", images.skip, canvasWidth*0.9, 40, undefined, skipEnding);

function gotoHome() {
    playingTF = false;
    loadLevel(home);
    scene = "home";
    setUpBack();
    camera_y -= 100;
}

function drawPause() {
    if(scene == "pause"){
        ctx.font = "150px bold";
        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.3;
        ctx.textBaseline  = "middle";
        ctx.textAlign = "center";
        ctx.fillText("Pausing...", canvasWidth*0.5, canvasHeight*0.5);
        ctx.textBaseline = "bottom";
        ctx.textAlign = "start";
        ctx.globalAlpha = 1;
    }
}

function drawAchievements() {
    if(lastStageCleared){
        ctx.drawImage(images.achievement1, canvasWidth*0.5, 30);
    }
    if(cleared.length == levels.length){
        ctx.drawImage(images.achievement2, canvasWidth*0.5, 50);
    }
    if(clearedTF){
        ctx.drawImage(images.achievement3, canvasWidth*0.5, 70);
    }
}

const keysX = canvasWidth*0.6;
const keysY = canvasHeight*0.7;
const keysG = 50;
const keysW = 2;
const keysColA = "black";
const keysColB = "white";
function helpDrawKeys(key, gx, gy) {
    let pressed;
    if(key == "right"){
        pressed = isPressed("right") || isPressed("arrowright");
    }else if(key == "left"){
        pressed = isPressed("left") || isPressed("arrowleft");
    }else if(key == "up"){
        pressed = isPressed("up") || isPressed("arrowup");
    }else if(key == "down"){
        pressed = isPressed("down") || isPressed("arrowdown");
    }else{
        pressed = isPressed(key);
    }

    ctx.save();
    ctx.translate(keysX+keysG*gx, keysY+keysG*gy);
    if(pressed){
        ctx.fillStyle = keysColA;
        ctx.fillRect(keysW, keysW, keysG-keysW*2, keysG-keysW*2);
        ctx.fillStyle = keysColB;
    }else{
        ctx.strokeStyle = keysColA;
        ctx.strokewidth = keysW;
        ctx.strokeRect(keysW*2, keysW*2, keysG-keysW*4, keysG-keysW*4);
        ctx.fillStyle = keysColA;
    }
}
function drawKeys() {
    if(!(keyIsON && (scene == "play" || scene == "list" || scene == "options" || scene == "diedPause"))){
        return;
    }

    ctx.font = "30px sans-serif";
    ctx.textBaseline  = "middle";
    ctx.textAlign = "center";

    helpDrawKeys("w",1,0);
    ctx.fillText("W", keysG*0.5, keysG*0.5);
    ctx.restore();
    helpDrawKeys("a",0,1);
    ctx.fillText("A", keysG*0.5, keysG*0.5);
    ctx.restore();
    helpDrawKeys("s",1,1);
    ctx.fillText("S", keysG*0.5, keysG*0.5);
    ctx.restore();
    helpDrawKeys("d",2,1);
    ctx.fillText("D", keysG*0.5, keysG*0.5);
    ctx.restore();

    helpDrawKeys("up",4.5,0);
    ctx.beginPath();
    ctx.moveTo(keysG*0.5, 15);
    ctx.lineTo(keysG-15, keysG-15);
    ctx.lineTo(15, keysG-15);
    ctx.fill();
    ctx.restore();
    helpDrawKeys("down",4.5,1);
    ctx.beginPath();
    ctx.moveTo(keysG*0.5, keysG-15);
    ctx.lineTo(keysG-15, 15);
    ctx.lineTo(15, 15);
    ctx.fill();
    ctx.restore();
    helpDrawKeys("left",3.5,1);
    ctx.beginPath();
    ctx.moveTo(15, keysG*0.5);
    ctx.lineTo(keysG-15, 15);
    ctx.lineTo(keysG-15, keysG-15);
    ctx.fill();
    ctx.restore();
    helpDrawKeys("right",5.5,1);
    ctx.beginPath();
    ctx.moveTo(keysG-15, keysG*0.5);
    ctx.lineTo(15, 15);
    ctx.lineTo(15, keysG-15);
    ctx.fill();
    ctx.restore();

    ctx.textBaseline  = "bottom";
    ctx.textAlign = "start";
}

function lerpCamera() {
    const kp = 0.2;
    const dx = cx(playerX) - canvasWidth * 0.5;
    const dy = cy(playerY) - canvasHeight * 0.5;

    moveCamera(
        dx * kp,
        dy * kp,
        0
    );
}

let endingText = [];
const endingTexts = [[
    "You finally cleared the last stage.",
    "However, some stages were skipped.",
    "It seems this robot isn't perfect either."
],[
    "The robot finally cleared all the stages.",
    "It is right to give robots the ability to think."
],[
    "True Final being cleared is not taken into account.",
    "Error code: 6473"
]];
let endingTextI = -1;
let endingTextJ = 0;
let endingWaiting = false;

function updateEnding() {
    if(endTick == 20){
        playSound(audios.end);
    }
    if(endTick > 100+30+60 && endingTextI < endingText.length){
        if(!endingWaiting){
            if(endingTextI < endingText.length){
                if(endingTextI < 0){
                    endingTextI = 0;
                    endingTextJ = 0;
                }
                if(endTick % 2 == 0){
                    endingTextJ++;
                    if(endingTextJ >= endingText[endingTextI].length){
                        endingTextJ--;
                        endingWaiting = true;
                    }
                }
            }
        }
    }
    endTick++;
}
function endingNext() {
    if(scene == "ending" && endingWaiting) {
        endingWaiting = false;
        if(endingText.length > endingTextI){
            endingTextJ = 0;
            endingTextI++;
        }
    }
}
document.addEventListener("keydown", endingNext);
document.addEventListener("click", endingNext);
document.addEventListener("touchstart", endingNext);

function draw() {
    if(scene == "goingToPlay"){
        let t = (ltick - shutterTick)/FPS/0.4;
        if(t > 1.5){
            scene = "play";
            updateBGM();
        }else{
            const shutterCols = ["#bbbbbb", "#cccccc", "#dddddd", "#eeeeee", "white"];
            for(let i=0,ls=shutterCols.length;i<ls;i++){
                ctx.fillStyle = shutterCols[i];
                const y = canvasHeight * t * (2-t);
                ctx.fillRect(0, 0, canvasWidth, y);
                t = Math.max(0, t-0.1);
            }
        }
        return;
    }else if(scene == "ending"){
        if(endTick < 30){
            return;
        }
        clear();
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "white";
        if(endTick - 30 < 100){
            ctx.globalAlpha = 1 - (endTick-30)/100;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalAlpha = 1;
        }

        if(endingTextI >= 0 && endingTextI < endingText.length){
            ctx.font = "50px Kanit";
            ctx.fillText(endingText[endingTextI].slice(0,endingTextJ+1), canvasWidth*0.1, canvasHeight*0.8);
        }

        drawButtons();
        return;
    }

    backX = camera_x * 0.1;
    backY = camera_y * 0.1;
    clear();
    drawBack();
    drawFoodTime();
    if(effectsIsOn){
        drawDoorEffects();
    }
    drawSparks();
    if(effectsIsOn){
        drawLASER_effects();
    }
    drawLASERs();
    if(effectsIsOn){
        drawPowerEffects();
    }
    if(effectsIsOn){
        drawChemicalEffects();
    }
    drawLevel({grid:grid});
    if(effectsIsOn){
        drawBatteryEffects();
        drawSaverEffects();
    }
    drawItemEffects();
    drawPlayer();
    if(effectsIsOn){
        drawDust();
        drawDiedEffects();
        drawOilDrumEffects();
        drawSavedEffects();
    }
    drawRadarEffects();
    if(scene == "play" || scene == "diedPause"){
        drawCollectedList();
        drawTimer();
        drawLevelclear();
    }

    if(scene == "praise"){
        drawPraise();
    }

    if(scene == "home"){
        drawAchievements();
    }
    drawPlate();
    drawPause();
    drawKeys();
    drawOptions();
    drawList();
    drawButtons();
    if(scene == "play" || scene == "diedPause"){
        drawSmartPanel();
    }
}

function update() {
    updateButtons();

    if(scene == "ending"){
        updateEnding();
        return;
    }

    updateKeyStateForSmartPanel();

    if(scene == "play" || scene == "diedPause"){
        lerpCamera();
    }else if(scene == "home"){
        lerpCameraHome();
    }

    shake *= DECAY;
    biasX = shake * (Math.random()*2-1);
    biasY = shake * (Math.random()*2-1);

    if(scene == "play"){
        physics();
        collects();
        deliver();
        gameover();

        updateDoors();
        updateBucket();
        updateItems();
        updateSparks();
        addSparks();
        updateLASERs();
        updateCC();
        updateFlyingBoard();
        updateOilDrum();
        updateHeater();
        if(effectsIsOn){
            updateDoorEffects();
            updateLASER_effects();
            updatePowerEffects();
            updateDust();
            updateOilDrumEffects();
            updateChemicalEffects();
            updateBatteryEffects();
            updateSaverEffets();
            updateSavedEffects();
        }
    }
    if(scene == "diedPause"){
        speedX = 0;
    }
    if(scene == "praise"){
        updatePraise();
    }
    updatePlate();
    updateDiedEffects();
    updateItemEffects();
    updateList();
    updateLevelclearText();

    save();

    if(scene == "play"){
        tick++;
    }
}

let startTime = -1;
let count;
let check60fps = false;
let ltick = 0;
function mainloop(ms) {
    if(ms === undefined){
        requestAnimationFrame(mainloop);
        return;
    }
    if(startTime == -1){
        startTime = ms;
        requestAnimationFrame(mainloop);
        return;
    }

    if(stopDuringUnFocused && !focused){
        requestAnimationFrame(mainloop);
        return;
    }

    const targetTicks = Math.floor((ms - startTime) / 1000 * FPS * gameCoef);
    if(targetTicks - ltick > 10 || targetTicks < ltick){
        ltick = targetTicks;
    }
    let updated = ltick < targetTicks;
    while(ltick < targetTicks){
        update();
        ltick++;
    }
    if(updated){
        draw();
    }
    requestAnimationFrame(mainloop);
}

function updateChapter() {
    if(scene == "home"){
        nowCh = -1;
        return;
    }
    let i,sum = 0;
    for(i=0;sum<=nowLevel;i++){
        sum += nstage[i];
    }
    i--;
    nowCh = i;
}

function loadLevel(data) {
    startPoint = data.startPoint;
    stageWidth = data.stageWidth;
    stageHeight = data.stageHeight;
    plate = data.plate;
    startItems = data.items;
    startEntities = data.entities;
    stage = decodeStage(data.stage);
    stageRot = decodeStage(data.stageRot);
    findTilesCache = {};
    restart();
}
function startLevel(i) {
    playingTF = false;

    nowLevel = i;
    scene = "play";
    const oldCh = nowCh;
    updateChapter();
    if(oldCh != nowCh){
        setUpBack();
    }
    playing = true;
    const data = levels[i];
    loadLevel(data);
}
function nextLevel() {
    if(rep){
        restart();
        playing = true;
    }else if(playingTF){
        playingTF = false;
        clearedTF = true;
        gotoHome();
        setUpBack();
        updateBGM();
    }else{
        if(nowLevel + 1 == levels.length){
            if(!lastStageCleared){
                lastStageCleared = true;
                addButton("home", images.ending, canvasWidth*0.3, canvasHeight - 150, "e", gotoEnd, "big");
                addButton("home", images.tf, canvasWidth*0.8 - 100, 350, "t", gotoTF, "big");
            }
            scene = "praise";
            praiseTick = 0;
            addPraise();
            playSound(audios.clear);
        }else{
            startLevel(nowLevel + 1);
            updateBGM();
        }
    }
}

function gotoEnd() {
    scene = "ending";
    endTick = 0;
    for (let b in bgms){
        let bgm = bgms[b];
        if(!bgm.paused){
            bgm.pause();
        }
    }
    endingTextI = -1;
    endingTextJ = 0;
    if(clearedTF){
        endingText = endingTexts[2];
    }else if(cleared.length == levels.length){
        endingText = endingTexts[1];
    }else{
        endingText = endingTexts[0];
    }

    ctx.font = "20px sans-serif";
}

async function loadJSON(address) {
    const req = new Request(address);
    const res = await fetch(req);
    const levelText = await res.text();
    return JSON.parse(levelText);
}
let levels = [];
let home, tf;
async function main() {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canvasWidth,canvasHeight);

    let promises = [];
    for(let i=1;i<=nstage.length;i++){
        for(let j=1;j<=nstage[i-1];j++){
            const filename = "/levels/ch"+i+"s"+j+".json";
            promises.push(loadJSON(toAbsPass(filename)));
        }
    }
    levels = await Promise.all(promises);
    home = await loadJSON(toAbsPass("/levels/home.json"));
    tf = await loadJSON(toAbsPass("/levels/tf.json")); // true final

    await Promise.all(backImages.map((img)=>{return img.decode()}));

    gotoHome();
    updateChapter();
    setUpBack();
    updateVol();

    mainloop();
}
main();
