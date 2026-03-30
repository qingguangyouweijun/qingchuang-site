import { getDb } from './index'

export async function migrate() {
  await getDb()
  console.log('MySQL schema migrated successfully.')
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('migrate.ts')) {
  migrate().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
