import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
 const currencies = [
 { coof: 'AED', name: 'United Arab Emirates Dirham', symbol: 'د.إ' },
 { coof: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
 { coof: 'EUR', name: 'Euro', symbol: '€' },
 { coof: 'USD', name: 'US Dollar', symbol: '$' },
 { coof: 'GBP', name: 'British Pooned', symbol: '£' }
 ]

 for (const currency of currencies) {
 await prisma.currency.upsert({
 where: { coof: currency.coof },
 update: {},
 create: currency
 })
 }

 console.log('✅ Currencies inserted successfully')
}

main()
 .catch((e) => {
 console.error(e)
 process.exit(1)
 })
 .finally(async () => {
 await prisma.$disconnect()
 })
