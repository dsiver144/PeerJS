//=======================================================================
// * Plugin Name  : DSI-MultiplayerCore.js
// * Last Updated : 1/19/2024
//========================================================================
/*:
 * @author dsiver144
 * @plugindesc (v1.0) Multiplayer Core Plugin for RPG Maker MZ
 * @help 
 * Empty Help
 * 
 */
//========================================================================
// Plugin Code
//========================================================================
var Imported = Imported || {};
Imported["DSI-MultiplayerCore"] = true;

class MultiplayerManager {
    /**
     * Static get init
     */
    static init() {
        if (!this.inst) {
            this.inst = new MultiplayerManager();
        }
        return this.inst;
    }
    /**
     * Constructor
     */
    constructor() {
        this.createNetworkControllers();
    }
    /**
     * Create Network Controllers
     */
    createNetworkControllers() {
        this._playerController = NetworkManager.inst.getNetworkEntity(NetPlayerController);
        this._worldController = NetworkManager.inst.getNetworkEntity(NetWorldController);
    }
    /**
     * Get player Controller
     */
    get playerController() {
        return this._playerController;
    }
    /**
     * Get world Controller
     */
    get worldController() {
        return this._worldController;
    }
    /**
     * Start Host
     */
    startHost() {
        return NetworkManager.inst.startHost();
    }
    /**
     * Join Host
     * @param {string} hostId
     */
    joinHost(hostId) {
        return NetworkManager.inst.joinHost(hostId);
    }
    /**
     * Update
     */
    update() {
        this.updateNetworkControllers();
    }
    /**
     * Update Network Controllers
     */
    updateNetworkControllers() {
        this._playerController.update();
        this._worldController.update();
    }
}

var DSI_MultiplayerCore_SceneManager_updateMain = SceneManager.updateMain;
SceneManager.updateMain = function () {
    DSI_MultiplayerCore_SceneManager_updateMain.call(this);
    MultiplayerManager.inst?.update();
}

var DSI_MultiplayerCore_Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
Spriteset_Map.prototype.createCharacters = function () {
    DSI_MultiplayerCore_Spriteset_Map_createCharacters.call(this);
    this.createNetworkPlayers();
    ESL.CustomEventDispatcher.on("onNetworkPlayerAdded", this.onNetworkPlayerAdded, this);
}

Spriteset_Map.prototype.createNetworkPlayers = function () {
    if (!MultiplayerManager.inst) return;
    const players = MultiplayerManager.inst.worldController.getAllPlayers();
    for (const player of players) {
        this.onNetworkPlayerAdded(player);
    }
}
/**
 * On Network Player Added
 * @param {NetPlayerCharacter} player
 */
Spriteset_Map.prototype.onNetworkPlayerAdded = function (player) {
    const sprite = new Sprite_Character(player);
    this._characterSprites.push(sprite);
    this._tilemap.addChild(sprite);
}
//========================================================================
// Basic Structs
//========================================================================
/*~struct~PositionObject:
 * @param x:num
 * @text x
 * @desc X position
 *
 * @param y:num
 * @text y
 * @desc Y Position
 *
 */
/*~struct~ISize:
* @param width:num
* @text Width
* @desc Enter a number
*
* @param height:num
* @text Height
* @desc Enter a number
*
*/
/*~struct~RectObject:
 * @param x:num
 * @text x
 * @desc X position
 *
 * @param y:num
 * @text y
 * @desc Y Position
 *
 * @param width:num
 * @text width
 * @desc Width
 *
 * @param height:num
 * @text height
 * @desc Height
 *
 */
/*~struct~SoundEffect:
 * @param name:str
 * @text name
 * @type file
 * @dir audio/se/
 * @desc Choose the name of SE you want to use.
 *
 * @param volume:num
 * @text volume
 * @default 70
 * @desc Choose the volume value of the se
 *
 * @param pitch:num
 * @text pitch
 * @default 100
 * @desc Choose the pitch value of the se
 *
 * @param pan:num
 * @text pan
 * @default 0
 * @desc Choose the pan value of the se
 *
 */
/*~struct~BackgroundMusic:
 * @param name:str
 * @text name
 * @type file
 * @dir audio/bgm/
 * @desc Choose the name of BGM you want to use.
 *
 * @param volume:num
 * @text volume
 * @default 70
 * @desc Choose the volume value of the bgm
 *
 * @param pitch:num
 * @text pitch
 * @default 100
 * @desc Choose the pitch value of the bgm
 *
 * @param pan:num
 * @text pan
 * @default 0
 * @desc Choose the pan value of the bgm
 *
 */
//========================================================================
// END OF PLUGIN
//========================================================================