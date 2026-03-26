import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { join } from 'node:path'
import * as schema from './schema'

const DB_FILE = join(process.cwd(), 'data', 'qingchuang.db')

let _sqlite: Database.Database | null = null
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getSqlite() {
  if (!_sqlite) {
    _sqlite = new Database(DB_FILE)
    _sqlite.pragma('journal_mode = WAL')
    _sqlite.pragma('foreign_keys = ON')
  }
  return _sqlite
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getSqlite(), { schema })
  }
  return _db
}

export { schema }
