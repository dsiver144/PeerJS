//=======================================================================
// * Plugin Name  : DSI-NetPlayerController.js
// * Last Updated : 1/19/2024
//========================================================================
/*:
 * @author dsiver144
 * @plugindesc (v1.0) Player Controller Plugin for RPG Maker MZ
 * @help 
 * Empty Help
 * 
 */
//========================================================================
// Plugin Code
//========================================================================
class NetPlayerController extends NetworkEntity {
    /**
     * Init Members
     */
    initMembers() {

    }
    /**
     * Update
     */
    update() {
        this.updateInput();
    }
    /**
     * Update Input
     */
    updateInput() {
        if (this.isReady() == false) return;
        const player = $gamePlayer;
        this.sendMessage({
            type: "playerUpdate",
            data: {
                x: player._realX,
                y: player._realY,
                direction: player.direction(),
                peerId: this.getPeerId(),
                pattern: player.pattern(),
                mapId: $gameMap.mapId(),
            }
        });
    }
}
