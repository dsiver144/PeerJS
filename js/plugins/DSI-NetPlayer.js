//=======================================================================
// * Plugin Name  : DSI-NetPlayerCharacter.js
// * Last Updated : 1/19/2024
//========================================================================
/*:
 * @author dsiver144
 * @plugindesc (v1.0) Net Player Character Plugin for RPG Maker MZ
 * @help 
 * Empty Help
 * 
 */
//========================================================================
// Plugin Code
//========================================================================
class NetPlayerCharacter extends Game_Character {
    /**
     * Constructor
     * @param {string} peerId
     * @param {number} mapId
     */
    constructor(peerId, mapId) {
        super();
        this._peerId = peerId;
        this._mapId = mapId;
        this.setImage("Actor2", 0);
    }
    /**
     * Get Peer Id
     */
    getPeerId() {
        return this._peerId;
    }
    /**
     * Set Map Id
     * @param {number} mapId
     */
    setMapId(mapId) {
        if (mapId != this._mapId) {
            this._mapId = mapId;
        }
    }
    /**
     * Get Map Id
     */
    getMapId() {
        return this._mapId;
    }
	/**
     * Is At Current Map
     */
    isAtCurrentMap() {
        return this.getMapId() == $gameMap.mapId();
    }
	/**
     * Opacity
     */
    opacity() {
        return this.isAtCurrentMap() ? 255 : 0;
    }
}