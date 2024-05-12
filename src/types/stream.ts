
export interface IBufferChannel {
  read(size: number | ((buffer: Buffer) => number)): Promise<Buffer>
}