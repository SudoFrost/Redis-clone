import { Context } from "./types/redis"


type REDISRequest = Buffer[]

enum Flag {
  //the command is an administrative command.
  admin = 'admin',
  //the command is allowed even during hash slot migration.This flag is relevant in Redis Cluster deployments.
  asking = 'asking',
  //the command may block the requesting client.
  blocking = 'blocking',
  //the command is rejected if the server's memory usage is too high (see the maxmemory configuration directive).
  denyoom = 'denyoom',
  //the command operates in constant or log(N) time.This flag is used for monitoring latency with the LATENCY command.
  fast = 'fast',
  //the command is allowed while the database is loading.
  loading = 'loading',
  //the first key, last key, and step values don't determine all key positions. Clients need to use COMMAND GETKEYS or key specifications in this case. See below for more details.
  movablekeys = 'movablekeys',
  //executing the command doesn't require authentication.
  no_auth = 'no_auth',
  //the command is denied during asynchronous loading(that is when a replica uses disk - less SWAPDB SYNC, and allows access to the old dataset).
  no_async_loading = 'no_async_loading',
  //the command may accept key name arguments, but these aren't mandatory.
  no_mandatory_keys = 'no_mandatory_keys',
  //the command isn't allowed inside the context of a transaction.
  no_multi = 'no_multi',
  //the command can't be called from scripts or functions.
  noscript = 'noscript',
  //the command is related to Redis Pub / Sub.
  pubsub = 'pubsub',
  //the command returns random results, which is a concern with verbatim script replication.As of Redis 7.0, this flag is a command tip.
  random = 'random',
  //the command doesn't modify data.
  readonly = 'readonly',
  //the command's output is sorted when called from a script.
  sort_for_script = 'sort_for_script',
  //the command is not shown in MONITOR's output.
  skip_monitor = 'skip_monitor',
  //the command is not shown in SLOWLOG's output. As of Redis 7.0, this flag is a command tip.
  skip_slowlog = 'skip_slowlog',
  //the command is allowed while a replica has stale data.
  stale = 'stale',
  //the command may modify data.
  write = 'write',
}


/**
* Key specification describing a rule for extracting key names from the arguments.
*/
interface KeySpecification {
  /**
   * Beginning index for keys' extraction.
   */
  beginSearch: BeginSearch;

  /**
   * Rule for identifying the keys relative to the beginSearch.
   */
  findKeys: FindKeys;

  /**
   * Additional notes about the key specification.
   */
  notes?: string;

  /**
   * Flags providing more details about the key specification.
   */
  flags?: KeySpecFlag[];
}

/**
* Enum for the type of beginSearch.
*/
enum BeginSearchType {
  Index = "index",
  Keyword = "keyword",
  Unknown = "unknown"
}

/**
* Type for the beginning index for keys' extraction.
*/
type BeginSearch = {
  type: BeginSearchType;
  spec: IndexBeginSearch | KeywordBeginSearch | UnknownBeginSearch;
}

/**
* Index type of beginSearch.
*/
interface IndexBeginSearch {
  index: number;
}

/**
* Keyword type of beginSearch.
*/
interface KeywordBeginSearch {
  keyword: string;
  startFrom: number;
}

/**
* Unknown type of beginSearch.
*/
interface UnknownBeginSearch { }

/**
* Enum for the type of findKeys.
*/
enum FindKeysType {
  Range = "range",
  KeyNum = "keynum",
  Unknown = "unknown"
}

/**
* Type for the rule for identifying the keys relative to the beginSearch.
*/
type FindKeys = {
  type: FindKeysType;
  spec: RangeFindKeys | KeyNumFindKeys | UnknownFindKeys;
}

/**
* Range type of findKeys.
*/
interface RangeFindKeys {
  lastKey: number;
  keyStep: number;
  limit?: number;
}

/**
* KeyNum type of findKeys.
*/
interface KeyNumFindKeys {
  keyNumIdx: number;
  firstKey: number;
  keyStep: number;
}

/**
* Unknown type of findKeys.
*/
interface UnknownFindKeys { }

/**
* Enum for flags providing more details about the key specification.
*/
enum KeySpecFlag {
  RW = "RW",
  RO = "RO",
  OW = "OW",
  RM = "RM",
  Access = "access",
  Update = "update",
  Insert = "insert",
  Delete = "delete",
  NotKey = "not_key",
  Incomplete = "incomplete",
  VariableFlags = "variable_flags"
}


interface RedisCommand {
  /**
   * Command name in lowercase.
   */
  name: string;

  /**
   * Arity of the command.
   * - Positive integer: Fixed number of arguments.
   * - Negative integer: Minimal number of arguments.
   */
  arity: number;

  /**
   * Flags indicating various properties of the command.
   */
  flags: Flag[];

  /**
   * Position of the command's first key name argument.
   */
  firstKey: number;

  /**
   * Position of the command's last key name argument.
   */
  lastKey: number;

  /**
   * Step or increment between the first key and the position of the next key.
   */
  step: number;

  /**
   * Array of ACL categories to which the command belongs.
   */
  aclCategories: string[];

  /**
   * Tips providing additional information about the command.
   */
  tips: string[];

  /**
   * Key specifications describing rules for extracting key names from the arguments.
   */
  keySpecifications: KeySpecification[];

  /**
   * Subcommands of the command, if any.
   */
  subcommands: RedisCommand[];

  /**
   * Function to determine if the command matches the given request.
   *
   * @param request - The request to match against.
   * @returns - True if the command matches the request, false otherwise.
   */
  isMatch(request: REDISRequest): boolean;

  /**
   * Function to execute the command with the given context and request.
   *
   * @param ctx - The context for the command execution.
   * @param request - The request to execute.
   */
  execute(ctx: Context, request: REDISRequest): void;
}




const SetCommand: RedisCommand = {
  arity: 3,
  flags: [Flag.write],
  firstKey: 1,
  lastKey: 1,
  step: 1,
  aclCategories: [],
  tips: [
    "The command is allowed while a replica has stale data.",
  ],
  keySpecifications: [],
  subcommands: [],
  name: "set",

  isMatch([name]) {
    return name?.toString().toLocaleUpperCase() === "SET"
  },
  execute(ctx, request) {
    if (request.length !== 3) return
    ctx.db.set(request[1].toString(), request[2])
    ctx.resp.writeSimpleString('OK')
  }
}

const GetCommand: RedisCommand = {
  arity: 2,
  flags: [Flag.readonly],
  firstKey: 1,
  lastKey: 1,
  step: 1,
  aclCategories: [],
  tips: [],
  keySpecifications: [],
  subcommands: [],
  name: "get",

  isMatch([name]) {
    return name?.toString().toLocaleUpperCase() === "GET"
  },
  execute({ db, resp }, request) {
    if (request.length !== 2) return resp.writeError('ERR wrong number of arguments for command')
    const key = request[1]
    if (!db.has(key)) return resp.writeArrayNull()

    resp.writeBulkString(db.get(key)!)
  }
}

const CommandCommand: RedisCommand = {
  arity: -1,
  flags: [Flag.readonly],
  firstKey: 0,
  lastKey: 0,
  step: 0,
  aclCategories: [],
  tips: [],
  keySpecifications: [],
  subcommands: [],
  name: "command",

  isMatch([name]) {
    return name?.toString().toLocaleUpperCase() === "COMMAND"
  },
  execute(ctx) {
    ctx.resp.writeArray(commands.map(c => ctx.resp.makeArray([
      ctx.resp.makeBulkString(Buffer.from(c.name)),
      ctx.resp.makeInteger(c.arity),
      ctx.resp.makeArray(c.flags.map(f => ctx.resp.makeSimpleString(f))),
      ctx.resp.makeInteger(c.firstKey),
      ctx.resp.makeInteger(c.lastKey),
      ctx.resp.makeInteger(c.step),
      ctx.resp.makeArray(c.aclCategories.map(ac => ctx.resp.makeBulkString(Buffer.from(ac)))),
    ])))
  }
}

const FooCommand: RedisCommand = {
  arity: 2,
  flags: [Flag.readonly],
  firstKey: 1,
  lastKey: 1,
  step: 1,
  aclCategories: [],
  tips: [],
  keySpecifications: [],
  subcommands: [],
  name: "foo",

  isMatch([name]) {
    return name?.toString().toLocaleUpperCase() === "FOO"
  },
  execute(ctx, request) {
    if (request.length !== 3) return
    ctx.db.set(request[1].toString(), request[2])
    ctx.resp.writeSimpleString('OK')
  }
}


export const commands: RedisCommand[] = [
  GetCommand,
  SetCommand,
  CommandCommand,
  FooCommand
]