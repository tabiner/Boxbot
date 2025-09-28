const tileNames = [
    "empty.svg","block.png","junk.png", "post.svg","floppy.png", "magnet.png", "lift.svg", "spike.png", "sspike.png", "csb.png",
    "gold(s,on).svg", "gold(s,off).svg", "gold(d,on).svg", "gold(d,off).svg",
    "iron(s,on).svg", "iron(s,off).svg", "iron(d,on).svg", "iron(d,off).svg",
    "copper(s,on).svg", "copper(s,off).svg", "copper(d,on).svg", "copper(d,off).svg",
    "convR.png", "convL.png", "crack.png", "taco.svg", "bucket.png", "bbucket.png", "powerbox.png", "csbchain.png", "hook.png", "laserbox.png",
    "flyingboard.png", "oildrum.svg", "scrack.png", "battery.png", "chemical.svg", "glass.svg", "home.png", "meter.svg", "saver.svg", "heater.png", "heater2.png", "glassware.png"
];
const plateNames = ["plate1.png","plate2.png","plate3.png","plate4.png","plate5.png","plate6.png","plate7.png","plate8.png","plate9.png","plate10.png","plate11.png","plate12.png"];
const backNames = ["back1.svg", "back2.svg", "back3.svg", "back4.svg"];
const imageNames = ["uncollected.png", "levelclear.png", "praisetext.png", "home.png", "pause.svg", "restart.svg", "options.svg", "play.svg", "tf.svg", "ending.svg", "list.svg", "skip.svg", "achievement1.svg", "achievement2.svg", "achievement3.svg"];

const audioNames = ["home.mp3","tf.mp3","ch1.wav","ch2.mp3","ch3.mp3","ch4.mp3","end.mp3","next.mp3","jump.mp3","door.mp3","collect.mp3","battery.mp3", "save.mp3", "glass.mp3", "select.mp3", "clear.mp3", "repul.mp3"];

const nstage = [10, 30, 30, 10];
const chapterNames = ["Tutorial", "Basic", "Hard", "Final Challenges"];

function getTileIdByName(name) {
    return tileNames.indexOf(tileNames.find(el => el.split(".")[0]==name));
}
const EMPTY = getTileIdByName("empty");
const POST = getTileIdByName("post");
const FLOPPY = getTileIdByName("floppy");
const CSB = getTileIdByName("csb");
const BLOCK = getTileIdByName("block");
const LIFT = getTileIdByName("lift");
const MAGNET = getTileIdByName("magnet");
const SPIKE = getTileIdByName("spike");
const SSPIKE = getTileIdByName("sspike");
const CONV_R = getTileIdByName("convR");
const CONV_L = getTileIdByName("convL");
const CRACK = getTileIdByName("crack");
const SCRACK = getTileIdByName("scrack");
const TACO = getTileIdByName("taco");
const BUCKET = getTileIdByName("bucket");
const BBUCKET = getTileIdByName("bbucket");
const POWER_BOX = getTileIdByName("powerbox");
const CSB_CHAIN = getTileIdByName("csbchain");
const HOOK = getTileIdByName("hook");
const LASER_BOX = getTileIdByName("laserbox");
const FLYING_BOARD = getTileIdByName("flyingboard");
const OIL_DRUM = getTileIdByName("oildrum");
const BATTERY = getTileIdByName("battery");
const CHEMICAL = getTileIdByName("chemical");
const GLASS = getTileIdByName("glass");
const METER = getTileIdByName("meter");
const SAVER = getTileIdByName("saver");
const HEATER = getTileIdByName("heater");
const HEATER2 = getTileIdByName("heater2");
const GLASSWARE = getTileIdByName("glassware");
let SWITCHES = [];
let switchStates = [];
function setSWITCHES() {
    const cols = ["gold", "iron", "copper"];
    const types = ["s","d"];
    const nfs = ["on","off"];
    for(let col=0;col<cols.length;col++){
        for(let type=0;type<types.length;type++){
            for(let nf=0;nf<nfs.length;nf++){
                SWITCHES.push(getTileIdByName(cols[col] + "(" + types[type] + "," + nfs[nf] + ")"));
            }
        }
        switchStates.push(0);
    }
    switchStates = new Array(cols.length).fill(0);
}
setSWITCHES();

const unsquares = [POST, CSB, CRACK, SCRACK, BUCKET, BBUCKET, CSB_CHAIN, HOOK, FLYING_BOARD, OIL_DRUM, METER, getTileIdByName("home"), HEATER, HEATER2];
function isSquare(type) {
    return !(unsquares.includes(type));
}

const frontTiles = [CRACK, SCRACK, OIL_DRUM, METER];

const anime = {};
anime[LIFT] = {
    type: "vert",
    cycles: -5
};
anime[CSB] = {
    type: "rot",
    rps: 0.7
};
anime[CONV_R] = {
    type: "beside",
    cycles: 4
};
anime[CONV_L] = {
    type: "beside",
    cycles: -4
};
anime[METER] = {
    type: "rot",
    rps: 0.5
};

let moveable = [BBUCKET];

let hitable = [BLOCK, MAGNET, CONV_R, CONV_L, BUCKET, POWER_BOX, FLYING_BOARD, LASER_BOX, GLASS, HEATER];
for(let i=0;i*4<SWITCHES.length;i++){
    for(let j=2;j<4;j++){
        hitable.push(SWITCHES[i*4 + j]);
    }
}
const entitiesHitable = [SPIKE, SSPIKE];

const entitiesHitboxes = {};
entitiesHitboxes[CSB]          = [0.5, 0.5, 2.5, 2,5];
entitiesHitboxes[BUCKET]       = [0, 1.2, 2, 2];
entitiesHitboxes[FLYING_BOARD] = [0, 0, 5, 1];
entitiesHitboxes[OIL_DRUM]     = [0, 0, 2, 2];
entitiesHitboxes[POST]         = [0.3, 0.5, 0.7, 1.5];
entitiesHitboxes[CSB_CHAIN]    = [-1, -1, 1, 1];
entitiesHitboxes[HEATER]        = [0, 0, 5, 5];
entitiesHitboxes[HEATER2]        = [0, 0, 5, 5];

const tileHitboxes = {};
tileHitboxes[SPIKE] = [0.1, 1/3, 0.9, 1];
tileHitboxes[SSPIKE] = [0.1, 2/3, 0.9, 1];
tileHitboxes[CHEMICAL] = [0.3, 0.3, 0.7, 0.7];

const itemBiases = {};
itemBiases[TACO] = 0.2;
itemBiases[GLASSWARE] = 0.04;


const FPS = 60;

const GRAVITY = 0.022; //重力
const JUMP = 0.47; //ジャンプ力
const ACCE = 0.04; //横移動の力
const POWER = 2.5; //パワーブロックの加速度が通常の何倍か
const RESISTANCE = 0.85; //摩擦抵抗
const DESCENT = 0.05; //magnetに粘着してるときの下降速度
const REPULSIVE = 0.05; //magnetから離れるときの反発力
const REPULSIVE_TIME = 0.3; //magnetの反発力を受けられる時間(s)
const RISE = 0.3; //リフトに乗っているときの上昇速度
const CONV_SPEED = 0.7 //キーを押さずにコンベアーに乗っているときの速度が普通に移動しているときの何倍か
const LASER_SPEED = 30; //レーザーの速度
const FLYING_BOARD_SPEED = 0.15; //flying boardの速度
const FLYING_BOARD_STOPING_TIME = 50; //flying boardの壁にあたったときの停止時間(ms)
const OIL_DRUM_SPEED = 0.1;
const DISTORTION = 0.7; //主人公の歪ませ方
const SHAKE = 30; //揺れの大きさ
const DECAY = 0.90; //揺れの減衰

const LEVELCLEAR_TEXT_TIME = 0.5; //レベルクリア時のテキストの表示時間(ticks)
