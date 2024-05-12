
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import { IBufferChannel } from '../types/stream';

export class BufferChannel extends EventEmitter implements IBufferChannel {
  private buffer: Buffer = Buffer.alloc(0);

  constructor() {
    super();
  }

  write(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);
    this.emit('write');
  }

  private _read(size: number): Buffer {
    const buffer = this.buffer.subarray(0, size);
    this.buffer = this.buffer.subarray(size);
    return buffer;
  }

  read(size: number | ((buffer: Buffer) => number)): Promise<Buffer> {
    let getReadSize = typeof size === "number" ? () => size : size;
    let writeListener: () => void;
    return new Promise<Buffer>((resolve) => {
      let resolved = false
      writeListener = async () => {
        const readSize = getReadSize(this.buffer);
        if (readSize <= 0) return;
        if (this.buffer.length >= readSize) {
          resolved = true;
          resolve(this._read(readSize));
        }
      }
      writeListener();
      if (!resolved) this.on('write', writeListener);
    }).finally(() => this.off("write", writeListener))
  }
}