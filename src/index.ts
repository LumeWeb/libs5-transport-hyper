import { BasePeer, Logger, PeerConstructorOptions } from "@lumeweb/libs5";
import { URL } from "url";
import { Buffer } from "buffer";
import { Readable } from "streamx";

export default class HyperTransportPeer extends BasePeer {
  private _peer: any;
  private _muxer: any;
  private _protocol: string;
  protected _socket = new Readable();
  private _pipe?: any;

  constructor(
    options: PeerConstructorOptions & {
      peer: any;
      muxer: any;
      protocol: string;
      socket?: any;
    },
  ) {
    super(options);
    const { peer, muxer, protocol } = options;
    this._peer = peer;
    this._muxer = muxer;
    this._protocol = protocol;
  }

  public async init() {
    const channel = await this._muxer.createChannel({
      protocol: this._protocol,
    });

    const self = this;

    this._pipe = await channel.addMessage({
      async onmessage(m) {
        if (m instanceof Uint8Array) {
          m = Buffer.from(m);
        }

        self._socket.push(m);
      },
    });

    await channel.open();
  }

  public static async connect(uri: URL): Promise<any> {
    return Promise.reject("not supported");
  }

  listenForMessages(
    callback: (event: any) => Promise<void>,
    {
      onDone,
      onError,
      logger,
    }: {
      onDone?: any;
      onError?: (...args: any[]) => void;
      logger: Logger;
    },
  ): void {
    this._socket.on("data", async (data: Buffer) => {
      await callback(data);
    });

    if (onDone) {
      this._socket.on("end", onDone);
    }

    if (onError) {
      this._socket.on("error", onError);
    }
  }

  renderLocationUri(): string {
    return "Hypercore client";
  }

  sendMessage(message: Uint8Array): void {
    this._pipe.write(message);
  }
}
