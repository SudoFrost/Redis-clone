import { createServer } from "net";
import { BufferChannel } from "./lib/channels";
import { RESP } from "./lib/RESP/resp";
import { Database } from "./db";
import { RESPParedTypes } from "./lib/RESP/types";
import { Context } from "./types/redis";
import { commands } from "./commands";

const DB = new Database()

type REDISRequest = Buffer[]

async function loop(ctx: Context) {
  while (true) {
    const data = await ctx.resp.read()

    if (data.type !== RESPParedTypes.ARRAY) continue
    if (data.value === null || data.value.length === 0) continue
    const request: REDISRequest = []
    for (const v of data.value) {
      if (v.type !== RESPParedTypes.BULK_STRING) continue
      if (v.value === null) continue
      request.push(v.value)
    }
    if (request.length === 0) continue

    const command = commands.find(c => c.isMatch(request))
    if (!command) continue
    command.execute(ctx, request)
  }
}

createServer((socket) => {
  const channel = new BufferChannel();
  const protocol = new RESP(channel, socket);
  const ctx: Context = {
    db: DB,
    resp: protocol
  }
  loop(ctx)
  socket.on("data", channel.write.bind(channel))
}).listen(8080)
