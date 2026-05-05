import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const staffPassword = await bcrypt.hash('staff123', 10)

  const users = [
    { nama_lengkap: 'Super Admin',     email: 'admin',   password_hash: adminPassword, role: 'Super Admin'    },
    { nama_lengkap: 'Admin Gudang',    email: 'gudang',  password_hash: staffPassword, role: 'Admin Gudang'   },
    { nama_lengkap: 'Staff Inbound',   email: 'inbound', password_hash: staffPassword, role: 'Staff Inbound'  },
    { nama_lengkap: 'Staff Outbound',  email: 'outbound',password_hash: staffPassword, role: 'Staff Outbound' },
  ]

  for (const u of users) {
    await prisma.pengguna.upsert({
      where: { email: u.email },
      update: { password_hash: u.password_hash, nama_lengkap: u.nama_lengkap, role: u.role, updated_at: new Date() },
      create: { ...u, updated_at: new Date() },
    })
    console.log(`  ✅ User "${u.email}" (${u.role})`)
  }

  console.log('\n📋 Login credentials:')
  console.log('  Username: admin    | Password: admin123  | Role: Super Admin')
  console.log('  Username: gudang   | Password: staff123  | Role: Admin Gudang')
  console.log('  Username: inbound  | Password: staff123  | Role: Staff Inbound')
  console.log('  Username: outbound | Password: staff123  | Role: Staff Outbound')
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())