import { type GeneratedAlways, Kysely, CamelCasePlugin } from 'kysely'
import { PostgresJSDialect } from 'kysely-postgres-js'
import { DB } from './schema'
import postgres from 'postgres'

// ✅ DEFINE THIS OUTSIDE
const connectionString =
  process.env.FLOOT_DATABASE_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('No database URL provided')
}

export const db = new Kysely<DB>({
  plugins: [new CamelCasePlugin()],
  dialect: new PostgresJSDialect({
    postgres: postgres(connectionString, {
      prepare: false,
      idle_timeout: 10,
      max: 3,
    }),
  }),
})

console.log("ENV CHECK:", {
  FLOOT_DATABASE_URL: process.env.FLOOT_DATABASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
})
