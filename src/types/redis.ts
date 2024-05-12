import type { RESP } from "../lib/RESP/resp";
import type { Database } from "../db";

export type Context = {
  db: Database,
  resp: RESP,
}
