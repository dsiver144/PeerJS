//=======================================================================
// * Plugin Name  : DSI-PeerJS.js
// * Last Updated : 1/19/2024
//========================================================================
/*:
 * @author dsiver144
 * @plugindesc (v1.0) PeerJS Plugin for RPG Maker MZ
 * @help 
 * Empty Help
 * 
 */
//========================================================================
// Plugin Code
//========================================================================
// var Imported = Imported || {};
// Imported["DSI-PeerJS"] = true;
/**
 * @typedef PeerMessage
 * @property {string} type
 * @property {any} data
 */

class NetworkManager {
    /** @type {NetworkManager} */
    static inst = null;
    static start() {
        if (this.inst != null) {
            return;
        }
        this.inst = new NetworkManager();
    }
    /**
     * Constructor
     */
    constructor() {
        this.initMembers();
    }
    /**
     * Init
     */
    initMembers() {
        /** @type {Peer} */
        this._peer = new Peer();
        /** @type {boolean} */
        this._ready = false;
        /** @type {string} */
        this._peerId = null;
        /** @type {DataConnection} */
        this._hostConnection = null;
        /** @type {DataConnection[]} */
        this._clientConnections = [];
        /** @type {NetworkEntity[]} */
        this._networkEntities = [];
        this.open();
    }
    /**
     * Open
     */
    open() {
        this._peer.on("open", (id) => {
            console.log("✨ PeerJS open: ", id);
            this._ready = true;
            this._peerId = id;
        });
    }
    /**
     * Is Host
     */
    isHost() {
        return this._hostConnection == null;
    }
    /**
     * Is Client
     */
    isClient() {
        return this._hostConnection != null;
    }
    /**
     * On New Connection
     * @param {DataConnection} connection
     */
    onNewConnection(connection) {
        console.log("✅ Connection with client received: ", connection);
        connection.on("data", (data) => {
            this.onReceivedDataFromClient(connection, data);
        });
        connection.on("close", () => {
            console.log("❌ Client's connection closed: ", connection);
            var index = this._clientConnections.indexOf(connection);
            if (index >= 0) {
                this._clientConnections.splice(index, 1);
            }
            this.delegateDisconnectedMessage(connection);
        });
        this._clientConnections.push(connection);
    }
    /**
     * Delegate Disconnected Message
     * @param {DataConnection} connection
     */
    delegateDisconnectedMessage(connection) {
        this._networkEntities.forEach((entity) => {
            entity.onMessageReceived({ type: "clientDisconnected", data: { peerId: connection.peer } });
        });
    }
	/**
     * Delegate Connected Message
     * @param {DataConnection} connection
     */
    delegateConnectedMessage(connection) {
        this._networkEntities.forEach((entity) => {
            entity.onMessageReceived({ type: "clientConnected", data: { peerId: connection.peer } });
        });
    }
    /**
     * On Received Data From Client
     * @param {any} connection
     * @param {PeerMessage} message
     */
    onReceivedDataFromClient(connection, message) {
        // console.log("✅ Received data from client: ", connection, message);
        this._networkEntities.forEach((entity) => {
            entity.onMessageReceived(message);
        });
    }
    /**
     * Connect
     * @param {string} peerId
     * @returns {DataConnection}
     */
    connect(peerId) {
        var connection = this._peer.connect(peerId);
        if (connection == null) {
            return null;
        }
        connection.on("open", () => {
            console.log("✅ Connection with host established: ", connection);
            this.delegateConnectedMessage(connection);
        });
        connection.on("data", (data) => {
            this.onReceivedDataFromHost(peerId, data);
        });
        connection.on("close", () => {
            console.log("❌ Host's connection closed: ", connection);
            this._hostConnection = null;
        });
        return connection;
    }
    /**
     * On Received Data From Host
     * @param {string} hostId
     * @param {PeerMessage} message
     */
    onReceivedDataFromHost(hostId, message) {
        // console.log("✅ Received data from host: ", hostId, message);
        this._networkEntities.forEach((entity) => {
            entity.onMessageReceived(message);
        });
    }
    /**
     * Creates and returns a new instance of the provided constructor, passing the peer ID as an argument.
     *
     * @template T
     * @param {new (...args: any[]) => T} constructor - The constructor function to create a new instance of.
     * @returns {T} The newly created instance of the provided constructor.
     */
    getNetworkEntity(constructor) {
        const entity = new constructor(this._peer.id);
        this._networkEntities.push(entity);
        return entity;
    }
    /**
     * Start Host
     */
    startHost() {
        if (!this._ready) {
            return false;
        }
        this._peer.on("connection", this.onNewConnection.bind(this));
        this._peer.on("error", (err) => {
            throw new Error("PeerJS error: " + err);
        });
        console.log("✅ PeerJS host started!");
        this._hosting = true;
        return true;
    }
    /**
     * Join Host
     * @param {string} hostId
     */
    joinHost(hostId) {
        var conn = this.connect(hostId);
        if (conn == null) {
            throw new Error("Failed to connect to host!");
        }
        this._hostConnection = conn;
        return conn;
    }
    /**
     * Send To Host
     * @param {PeerMessage} message
     */
    sendToHost(message) {
        if (this._hostConnection == null) {
            return false;
        }
        this._hostConnection.send(message);
        return true;
    }
    /**
     * Send To Clients
     * @param {PeerMessage} message
     */
    sendToClients(message) {
        if (this._clientConnections.length <= 0) {
            return false;
        }
        for (var i = 0; i < this._clientConnections.length; i++) {
            var conn = this._clientConnections[i];
            conn.send(message);
        }
        return true;
    }
	/**
     * Is Ready For Multiplayer
     */
    isReadyForMultiplayer() {
        return this._hosting || this._hostConnection != null;
    }
}
NetworkManager.start();

class NetworkEntity {
    /**
     * Constructor
     */
    constructor(peerId) {
        this._peerId = peerId;
        this.initMembers();
    }
    /**
     * Init Members
     * @override
     */
    initMembers() {

    }
    /**
     * Update
     * @override
     */
    update() {

    }
    /**
     * Is Host
     */
    isHost() {
        return NetworkManager.inst.isHost();
    }
    /**
     * Is Client
     */
    isClient() {
        return !this.isHost();
    }
    /**
     * Get Peer ID
     */
    getPeerId() {
        return this._peerId;
    }
	/**
     * Is Ready
     */
    isReady() {
        return NetworkManager.inst.isReadyForMultiplayer();
    }
    /**
     * Send Message
     * @param {PeerMessage} message
     */
    sendMessage(message) {
        if (this.isHost()) {
            NetworkManager.inst.sendToClients(message);
        } else {
            NetworkManager.inst.sendToHost(message);
        }
    }
    /**
     * On Message Received
     * @param {PeerMessage} message
     */
    onMessageReceived(message) {

    }
}
//========================================================================
// END OF PLUGIN
//========================================================================