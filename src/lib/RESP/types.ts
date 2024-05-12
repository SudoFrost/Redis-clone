
export enum RESPParedTypes {
  'SIMPLE_STRING',
  'ERROR',
  'INTEGER',
  'BULK_STRING',
  'ARRAY'
}



export type RESPTypeSimpleString = { type: RESPParedTypes.SIMPLE_STRING, value: string }
export type RESPTypeError = { type: RESPParedTypes.ERROR, value: string }
export type RESPTypeInteger = { type: RESPParedTypes.INTEGER, value: number }
export type RESPTypeBulkString = { type: RESPParedTypes.BULK_STRING, value: Buffer | null }
export type RESPTypeArray = { type: RESPParedTypes.ARRAY, value: RESPType[] | null }
export type RESPType = RESPTypeSimpleString | RESPTypeError | RESPTypeInteger | RESPTypeBulkString | RESPTypeArray
