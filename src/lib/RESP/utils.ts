import { IBufferChannel } from "../../types/stream";

const CR = Buffer.from("\r")[0];
const LF = Buffer.from("\n")[0];
const CRLF = Buffer.from("\r\n");

function bufferToBufferChannel(buffer: Buffer): IBufferChannel {
  return {
    read(size) {
      const getSize = typeof size === 'number' ? () => size : size;
      const readSize = getSize(buffer);
      if (readSize > buffer.length) throw new Error('Buffer underflow')
      return Promise.resolve(buffer.subarray(0, readSize));
    }
  }
}

function readCRLF(buffer: IBufferChannel): Promise<Buffer> {
  return buffer.read(2).then(data => {
    if (data[0] !== CR || data[1] !== LF) throw new Error('Invalid CRLF')
    return data;
  })
}

function findCRLFIndex(buffer: Buffer): number {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === CR && buffer[i + 1] === LF) {
      return i;
    }
  }
  return -1;
}

function toBufferChannel(buffer: IBufferChannel | string | Buffer): IBufferChannel {
  if (typeof buffer === 'string') buffer = Buffer.from(buffer);
  if (buffer instanceof Buffer) return bufferToBufferChannel(buffer);
  return buffer;
}


export {
  CR,
  LF,
  CRLF,
  bufferToBufferChannel,
  readCRLF,
  findCRLFIndex,
  toBufferChannel
}