//=======================================================================
// * Plugin Name  : DSI-NetWorldController.js
// * Last Updated : 1/20/2024
//========================================================================
/*:
 * @author dsiver144
 * @plugindesc (v1.0) World Controller Plugin for RPG Maker MZ 
 * @help 
 * Empty Help
 * 
 */
//========================================================================
// Plugin Code
//========================================================================
class NetWorldController extends NetworkEntity {
    /**
     * Init Members
     */
    initMembers() {
        /** @type {Object.<string, NetPlayerCharacter>} */
        this._players = {};
    }
    /**
     * Add Network Player
     * @param {any} data
     */
    addNetworkPlayer(data) {
        const peerId = data.peerId;
        if (this._players[peerId]) {
            console.warn("Player already exists: ", data);
            return;
        }
        if (peerId == this.getPeerId()) {
            console.warn("Player is self: ", data);
            return;
        }
        const mapId = data.mapId;
        const player = new NetPlayerCharacter(peerId, mapId);
        player.setPosition(data.x, data.y);
        player.setDirection(data.direction);
        player.setMapId(data.mapId);
        player.setThrough(true);
        this._players[peerId] = player;
        ESL.CustomEventDispatcher.dispatch("onNetworkPlayerAdded", player);
    }
    /**
     * Get All Players
     */
    getAllPlayers() {
        return Object.values(this._players);
    }
    /**
     * Update
     */
    update() {

    }
    /**
     * On Message Received
     * @param {PeerMessage} message
     */
    onMessageReceived(message) {
        switch (message.type) {
            case "clientConnected":
                this.onClientConnected(message);
                break;
            case "createPlayer":
                this.onCreatePlayer(message);
                break;
            case "newPlayerConnected":
                this.onNewPlayerConnected(message);
                break;
            case "clientDisconnected":
                this.onClientDisconnected(message);
                break;
            case "playerUpdate":
                this.onPlayerUpdate(message);
                break;
        }
    }
	/**
     * On Client Connected (client only)
     * @param {PeerMessage} message
     */
    onClientConnected(message) {
        console.log("Client Connected: ", message);
        this.sendMessage({
            type: "newPlayerConnected",
            data: {
                x: $gamePlayer.x,
                y: $gamePlayer.y,
                direction: $gamePlayer.direction(),
                mapId: $gameMap.mapId(),
                peerId: this.getPeerId()
            }
        });
    }
	/**
     * On Client Disconnected
     * @param {PeerMessage} message
     */
    onClientDisconnected(message) {
        console.log("Client Player Disconnected: ", message);
        const peerId = message.data.peerId;
        return peerId;
    }
	/**
     * On Create Player
     * @param {PeerMessage} message
     */
    onCreatePlayer(message) {
        console.log("Create Player: ", message);
        this.addNetworkPlayer(message.data);
    }
	/**
     * On New Player Connected
     * @param {PeerMessage} message
     */
    onNewPlayerConnected(message) {
        console.log("New Client Player Joined: ", message);
        this.addNetworkPlayer(message.data);
        // Send host player to new player
        this.sendMessage({
            type: "createPlayer",
            data: {
                x: $gamePlayer.x,
                y: $gamePlayer.y,
                direction: $gamePlayer.direction(),
                mapId: $gameMap.mapId(),
                peerId: this.getPeerId()
            }
        });
        // Send existings players to new player
        for (let peerId in this._players) {
            const player = this._players[peerId];
            this.sendMessage({
                type: "createPlayer",
                data: {
                    x: player.x,
                    y: player.y,
                    direction: player.direction(),
                    mapId: player.getMapId(),
                    peerId: player.getPeerId()
                }
            });
        }
    }
	/**
     * On Player Update
     * @param {PeerMessage} message
     */
    onPlayerUpdate(message) {
        if (this.isHost()) {
            // Send host player & new players to all other players
            for (let peerId in this._players) {
                const player = this._players[peerId];
                this.sendMessage({
                    type: "playerUpdate",
                    data: {
                        x: player.x,
                        y: player.y,
                        direction: player.direction(),
                        mapId: player.getMapId(),
                        peerId: player.getPeerId(),
                        pattern: player.pattern(),
                    }
                });
            }
        }
        const peerId = message.data.peerId;
        const player = this._players[peerId];
        if (player) {
            player._realX = message.data.x;
            player._realY = message.data.y;
            player._x = message.data.x;
            player._y = message.data.y;
            player.setDirection(message.data.direction);
            player.setMapId(message.data.mapId);
            player._pattern = message.data.pattern;
        }
    }

}