import { prisma } from '../db'
import { createServerFn } from '@tanstack/react-start'


// ─── Types ─────────────────────────────────────────────────────────────────

type BarangRow = {
  id_barang: number
  nama_barang: string
  sku: string
  kategori: string | null
  satuan: string
  kuantitas_stok: number
  batas_minimum: number
  harga: number
  created_at: Date
  updated_at: Date
}

// ─── Barang ────────────────────────────────────────────────────────────────

export const getBarang = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.barang.findMany({ orderBy: { id_barang: 'asc' } })
  return rows.map((r): BarangRow => ({ ...r, harga: Number(r.harga) }))
})

export const getLowStock = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.barang.findMany({
    where: { kuantitas_stok: { lte: prisma.barang.fields.batas_minimum } },
    orderBy: { kuantitas_stok: 'asc' }
  })
  return rows.map((r): BarangRow => ({ ...r, harga: Number(r.harga) }))
})

export const getBarangBySku = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: string }) => {
    const row = await prisma.barang.findUnique({ where: { sku: data } })
    if (!row) return null
    return { ...row, harga: Number(row.harga) } as BarangRow
  })

// ─── Create Barang ─────────────────────────────────────────────────────────

export const createBarang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: {
      nama_barang: string
      sku: string
      kategori?: string
      satuan: string
      kuantitas_stok: number
      batas_minimum: number
      harga: number
    }
  }) => {
    const row = await prisma.barang.create({
      data: {
        nama_barang: data.nama_barang,
        sku: data.sku,
        kategori: data.kategori || null,
        satuan: data.satuan,
        kuantitas_stok: data.kuantitas_stok,
        batas_minimum: data.batas_minimum,
        harga: data.harga,
        updated_at: new Date(),
      }
    })
    return { ...row, harga: Number(row.harga) } as BarangRow
  })

// ─── Update Barang ─────────────────────────────────────────────────────────

export const updateBarang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: {
      sku: string
      nama_barang?: string
      kategori?: string | null
      satuan?: string
      kuantitas_stok?: number
      batas_minimum?: number
      harga?: number
    }
  }) => {
    const { sku, ...fields } = data
    const row = await prisma.barang.update({
      where: { sku },
      data: {
        ...fields,
        harga: fields.harga !== undefined ? fields.harga : undefined,
        updated_at: new Date(),
      }
    })
    return { ...row, harga: Number(row.harga) } as BarangRow
  })

// ─── Delete Barang ─────────────────────────────────────────────────────────

export const deleteBarang = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: string }) => {
    await prisma.barang.delete({ where: { sku: data } })
    return { ok: true }
  })

// ─── Bulk Create (Import CSV) ──────────────────────────────────────────────

export const bulkCreateBarang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: Array<{
      nama_barang: string
      sku: string
      kategori?: string
      satuan: string
      kuantitas_stok: number
      batas_minimum: number
      harga: number
    }>
  }) => {
    const results = await Promise.allSettled(
      data.map(item =>
        prisma.barang.upsert({
          where: { sku: item.sku },
          update: {
            nama_barang: item.nama_barang,
            kategori: item.kategori || null,
            satuan: item.satuan,
            kuantitas_stok: item.kuantitas_stok,
            batas_minimum: item.batas_minimum,
            harga: item.harga,
            updated_at: new Date(),
          },
          create: {
            nama_barang: item.nama_barang,
            sku: item.sku,
            kategori: item.kategori || null,
            satuan: item.satuan,
            kuantitas_stok: item.kuantitas_stok,
            batas_minimum: item.batas_minimum,
            harga: item.harga,
            updated_at: new Date(),
          }
        })
      )
    )
    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    return { succeeded, failed, total: data.length }
  })

// ─── Dashboard Stats ───────────────────────────────────────────────────────

export const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  const [totalSKU, barangAll, lowStockCount, transaksiHariIni] = await Promise.all([
    prisma.barang.count(),
    prisma.barang.findMany({ select: { kuantitas_stok: true, harga: true, batas_minimum: true } }),
    prisma.barang.count({
      where: { kuantitas_stok: { lte: prisma.barang.fields.batas_minimum } }
    }),
    prisma.transaksi.findMany({
      where: { tanggal: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: { barang: true, pengguna: true },
      orderBy: { tanggal: 'desc' },
      take: 5
    })
  ])

  const nilaiInventaris = barangAll.reduce(
    (sum: number, b: { harga: bigint | number; kuantitas_stok: number }) =>
      sum + Number(b.harga) * b.kuantitas_stok, 0
  )

  return {
    totalSKU,
    nilaiInventaris,
    lowStockCount,
    transaksiHariIni: transaksiHariIni.map(t => ({
      ...t,
      barang: { ...t.barang, harga: Number(t.barang.harga) }
    }))
  }
})

// ─── Bar Chart ─────────────────────────────────────────────────────────────

export const getBarChart = createServerFn({ method: 'GET' }).handler(async () => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const results = await Promise.all(
    days.map(async (day) => {
      const next = new Date(day)
      next.setDate(next.getDate() + 1)
      const [masuk, keluar] = await Promise.all([
        prisma.transaksi.aggregate({
          where: { jenis_transaksi: 'masuk', tanggal: { gte: day, lt: next } },
          _sum: { jumlah: true }
        }),
        prisma.transaksi.aggregate({
          where: { jenis_transaksi: 'keluar', tanggal: { gte: day, lt: next } },
          _sum: { jumlah: true }
        })
      ])
      return {
        label: String(day.getDate()),
        in: masuk._sum.jumlah ?? 0,
        out: keluar._sum.jumlah ?? 0,
      }
    })
  )
  return results
})

// ─── Transaksi ─────────────────────────────────────────────────────────────

export const getTransaksi = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.transaksi.findMany({
    include: { barang: true, pengguna: true },
    orderBy: { tanggal: 'desc' }
  })
  return rows.map(t => ({
    ...t,
    barang: { ...t.barang, harga: Number(t.barang.harga) }
  }))
})

export const getTransaksiMasuk = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.transaksi.findMany({
    where: { jenis_transaksi: 'masuk' },
    include: { barang: true, pengguna: true },
    orderBy: { tanggal: 'desc' }
  })
  return rows.map(t => ({
    ...t,
    barang: { ...t.barang, harga: Number(t.barang.harga) }
  }))
})

export const getTransaksiKeluar = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.transaksi.findMany({
    where: { jenis_transaksi: 'keluar' },
    include: { barang: true, pengguna: true },
    orderBy: { tanggal: 'desc' }
  })
  return rows.map(t => ({
    ...t,
    barang: { ...t.barang, harga: Number(t.barang.harga) }
  }))
})

// ─── Pengguna ──────────────────────────────────────────────────────────────

export const getPengguna = createServerFn({ method: 'GET' }).handler(async () => {
  return await prisma.pengguna.findMany({ orderBy: { id_pengguna: 'asc' } })
})

export const getUsers = getPengguna

// ─── Login ─────────────────────────────────────────────────────────────────

export const loginUser = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { username: string; password: string } }) => {
    const user = await prisma.pengguna.findFirst({
      where: {
        OR: [
          { email: data.username },
          { nama_lengkap: data.username },
        ]
      }
    })
    if (!user) return { ok: false, error: 'Username atau email tidak ditemukan.' }
    if (data.password !== user.password_hash) {
      return { ok: false, error: 'Password salah.' }
    }
    return {
      ok: true,
      user: {
        id_pengguna:  user.id_pengguna,
        nama_lengkap: user.nama_lengkap,
        email:        user.email,
        role:         user.role,
      }
    }
  })

// ─── Register (Signup mandiri oleh user) ───────────────────────────────────

export const registerUser = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: { nama_lengkap: string; username: string; password: string }
  }) => {
    const existing = await prisma.pengguna.findFirst({
      where: { email: data.username }
    })
    if (existing) return { ok: false, error: 'Username sudah digunakan.' }

    const user = await prisma.pengguna.create({
      data: {
        nama_lengkap:  data.nama_lengkap,
        email:         data.username,
        password_hash: data.password,
        role:          'Staff Inbound',
        updated_at:    new Date(),
      }
    })
    return {
      ok: true,
      user: {
        id_pengguna:  user.id_pengguna,
        nama_lengkap: user.nama_lengkap,
        email:        user.email,
        role:         user.role,
      }
    }
  })

// ─── Update User ────────────────────────────────────────────────────────────

export const updateUser = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: {
      id_pengguna: number
      nama_lengkap?: string
      email?: string
      password?: string
      role?: string
    }
  }) => {
    const { id_pengguna, password, ...fields } = data
    const row = await prisma.pengguna.update({
      where: { id_pengguna },
      data: {
        ...fields,
        ...(password ? { password_hash: password } : {}),
        updated_at: new Date(),
      }
    })
    return { ok: true, user: row }
  })

// ─── Delete User ────────────────────────────────────────────────────────────

export const deleteUser = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: number }) => {
    await prisma.pengguna.delete({ where: { id_pengguna: data } })
    return { ok: true }
  })

// ─── Audit Log ──────────────────────────────────────────────────────────────

export const getAuditLog = createServerFn({ method: 'GET' }).handler(async () => {
  return await prisma.auditLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 30,
    include: { pengguna: { select: { nama_lengkap: true } } },
  })
})

export const createAuditLog = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { id_pengguna: number | null; aksi: string } }) => {
    return await prisma.auditLog.create({ data })
  })

// ─── Create Transaksi Masuk ─────────────────────────────────────────────────

export const createTransaksiMasuk = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: { id_barang: number; id_pengguna: number; jumlah: number; keterangan?: string; tanggal?: string }
  }) => {
    const barang = await prisma.barang.findUnique({ where: { id_barang: data.id_barang } })
    if (!barang) throw new Error('Barang tidak ditemukan.')

    const transaksi = await prisma.transaksi.create({
      data: {
        id_barang:       data.id_barang,
        id_pengguna:     data.id_pengguna,
        jenis_transaksi: 'masuk',
        jumlah:          data.jumlah,
        keterangan:      data.keterangan ?? null,
        tanggal:         data.tanggal ? new Date(data.tanggal) : new Date(),
        created_at:      new Date(),
      }
    })

    await prisma.barang.update({
      where: { id_barang: data.id_barang },
      data:  { kuantitas_stok: { increment: data.jumlah }, updated_at: new Date() }
    })

    return transaksi
  })

// ─── Create Transaksi Keluar ────────────────────────────────────────────────

export const createTransaksiKeluar = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: { id_barang: number; id_pengguna: number; jumlah: number; keterangan?: string; tanggal?: string }
  }) => {
    const barang = await prisma.barang.findUnique({ where: { id_barang: data.id_barang } })
    if (!barang) throw new Error('Barang tidak ditemukan.')
    if (barang.kuantitas_stok < data.jumlah)
      throw new Error(`Stok tidak mencukupi. Tersedia: ${barang.kuantitas_stok} ${barang.satuan}.`)

    const transaksi = await prisma.transaksi.create({
      data: {
        id_barang:       data.id_barang,
        id_pengguna:     data.id_pengguna,
        jenis_transaksi: 'keluar',
        jumlah:          data.jumlah,
        keterangan:      data.keterangan ?? null,
        tanggal:         data.tanggal ? new Date(data.tanggal) : new Date(),
        created_at:      new Date(),
      }
    })

    await prisma.barang.update({
      where: { id_barang: data.id_barang },
      data:  { kuantitas_stok: { decrement: data.jumlah }, updated_at: new Date() }
    })

    return transaksi
  })

  // ─── Monthly Stats (6 bulan) ────────────────────────────────────────────────

export const getMonthlyStats = createServerFn({ method: 'GET' }).handler(async () => {
  const now    = new Date()
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1))
  const sixMonthsAgo = months[0]

  const allTrx = await prisma.transaksi.findMany({
    where:   { tanggal: { gte: sixMonthsAgo } },
    include: { barang: { select: { harga: true } } },
  })

  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

  return months.map(monthDate => {
    const m = monthDate.getMonth()
    const y = monthDate.getFullYear()
    const monthTrx = allTrx.filter(t => {
      const td = new Date(t.tanggal)
      return td.getMonth() === m && td.getFullYear() === y
    })
    const masuk  = monthTrx.filter(t => t.jenis_transaksi === 'masuk')
    const keluar = monthTrx.filter(t => t.jenis_transaksi === 'keluar')
    return {
      label:       monthNames[m],
      in:          masuk.reduce((s, t) => s + t.jumlah, 0),
      out:         keluar.reduce((s, t) => s + t.jumlah, 0),
      nilaiMasuk:  Math.round(masuk.reduce((s, t)  => s + Number(t.barang.harga) * t.jumlah, 0) / 1_000_000),
      nilaiKeluar: Math.round(keluar.reduce((s, t) => s + Number(t.barang.harga) * t.jumlah, 0) / 1_000_000),
    }
  })
})

// ─── Top 5 Produk ───────────────────────────────────────────────────────────

export const getTopProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const groups = await prisma.transaksi.groupBy({
    by:      ['id_barang'],
    _count:  { id_transaksi: true },
    _sum:    { jumlah: true },
    orderBy: { _count: { id_transaksi: 'desc' } },
    take:    5,
  })

  return Promise.all(groups.map(async g => {
    const b = await prisma.barang.findUnique({ where: { id_barang: g.id_barang } })
    return {
      nama_barang:      b?.nama_barang ?? '—',
      sku:              b?.sku ?? '—',
      jumlah_transaksi: g._count.id_transaksi,
      total_qty:        g._sum.jumlah ?? 0,
      total_nilai:      Number(b?.harga ?? 0) * (g._sum.jumlah ?? 0),
    }
  }))
})