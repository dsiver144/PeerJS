declare class Peer {
    constructor(id: string, options?: any);
    id: string;
    destroyed: boolean;
    disconnected: boolean;
    open: boolean;

    connect(id: string): DataConnection;
    call(id: string, stream: MediaStream): MediaConnection;

    on(event: string, callback: (connection: DataConnection) => void): void;
    disconnect(): void;
    destroy(): void;
}

declare class DataConnection {
    constructor(peer: Peer, options?: any);
    peer: string;
    connectionId: string;
    label: string;
    open: boolean;
    type: string;
    reliable: boolean;
    searialization: string;
    bufferSize: number;

    send(data: any): void;
    close(): void;

    on(event: string, callback: Function): void;
}

declare class MediaConnection {
    constructor(peer: Peer, options?: any);

    answer(stream: MediaStream): void;
    close(): void;

    on(event: string, callback: Function): void;
}