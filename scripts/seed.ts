import { seedPermissions } from "./seed/00-permissions"
import { seedDefaultRoles } from "./seed/01-roles"
import { seedTenant } from "./seed/02-tenant"
import { seedSampleData } from "./seed/03-sample-data"

async function main() {
  console.log("🌱 STARTING FULL DATABASE SEED")

  await seedPermissions()

  const tenantId = await seedTenant()

  await seedDefaultRoles(tenantId)

  await seedSampleData(tenantId)

  console.log("🎉 SEED COMPLETE!")
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
