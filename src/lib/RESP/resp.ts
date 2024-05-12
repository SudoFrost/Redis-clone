import { IBufferChannel } from "../../types/stream";
import { Writable } from "stream";
import * as u from './utils'
import { RESPParedTypes, RESPType } from "./types";


export class RESP {
  constructor(protected channel: IBufferChannel, protected writer: Writable) { }

  private async parse(): Promise<RESPType> {
    const prefix = (await this.channel.read(1))[0]

    switch (String.fromCharCode(prefix)) {
      case '+':
        const str = await this.channel.read(u.findCRLFIndex)
        await u.readCRLF(this.channel)
        return this.makeSimpleString(str.toString())
      case '-':
        const err = await this.channel.read(u.findCRLFIndex)
        await u.readCRLF(this.channel)
        return this.makeError(err.toString())
      case ':':
        const num = await this.channel.read(u.findCRLFIndex)
        await u.readCRLF(this.channel)
        return this.makeInteger(parseInt(num.toString()))
      case '$':
        const len = parseInt((await this.channel.read(u.findCRLFIndex)).toString())
        await u.readCRLF(this.channel)
        if (len === -1) return this.makeBulkString(null)
        const data = await this.channel.read(len)
        await u.readCRLF(this.channel)
        return this.makeBulkString(data)
      case '*':
        let count = parseInt((await this.channel.read(u.findCRLFIndex)).toString())
        await u.readCRLF(this.channel)
        if (count === -1) return this.makeArray(null)
        const results: RESPType[] = []
        while (count--) results.push(await this.parse())
        return this.makeArray(results)
      default:
        throw new Error(`Invalid prefix: ${prefix}`)
    }
  }

  read() {
    return this.parse()
  }

  serialize(data: RESPType): Buffer {
    switch (data.type) {
      case RESPParedTypes.SIMPLE_STRING:
        return Buffer.from(`+${data.value}${u.CRLF}`)
      case RESPParedTypes.ERROR:
        return Buffer.from(`-${data.value}${u.CRLF}`)
      case RESPParedTypes.INTEGER:
        return Buffer.from(`:${data.value}${u.CRLF}`)
      case RESPParedTypes.BULK_STRING:
        if (data.value === null) return Buffer.from(`-1${u.CRLF}`)
        return Buffer.concat([
          Buffer.from(`$${data.value.length}${u.CRLF}`),
          data.value,
          Buffer.from(u.CRLF)
        ])
      case RESPParedTypes.ARRAY:
        if (data.value === null) return Buffer.from(`*-1${u.CRLF}`)
        const serialized = data.value.map(item => this.serialize(item))
        return Buffer.concat([
          Buffer.from(`*${data.value.length}${u.CRLF}`),
          ...serialized
        ])
    }
  }


  makeSimpleString(str: string) {
    return {
      type: RESPParedTypes.SIMPLE_STRING as const,
      value: str
    }
  }

  makeError(str: string) {
    return {
      type: RESPParedTypes.ERROR as const,
      value: str
    }
  }

  makeInteger(num: number) {
    return {
      type: RESPParedTypes.INTEGER as const,
      value: num
    }
  }

  makeBulkString(data: Buffer | null) {
    return {
      type: RESPParedTypes.BULK_STRING as const,
      value: data
    }
  }

  makeArray(data: RESPType[] | null) {
    return {
      type: RESPParedTypes.ARRAY as const,
      value: data
    }
  }

  writeSimpleString(str: string) {
    this.write(this.serialize(this.makeSimpleString(str)))
  }

  writeError(err: string) {
    this.write(this.serialize(this.makeError(err)))
  }

  writeInteger(num: number) {
    this.write(this.serialize(this.makeInteger(num)))
  }

  writeBulkString(data: Buffer | null) {
    this.write(this.serialize(this.makeBulkString(data)))
  }

  writeArray(data: RESPType[]) {
    this.write(this.serialize(this.makeArray(data)))
  }

  writeBulkStringNull() {
    this.write(this.serialize(this.makeBulkString(null)))
  }

  writeArrayNull() {
    this.write(this.serialize(this.makeArray(null)))
  }

  write(data: Buffer | string) {
    this.writer.write(data)
  }
}