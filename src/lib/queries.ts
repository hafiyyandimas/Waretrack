import { prisma } from '../db'
import { createServerFn } from '@tanstack/react-start'

// ─── Types ──────────────────────────────────────────────────────────────────

export type GudangRow = {
  id_gudang: number
  nama_gudang: string
}

export type StokGudangRow = {
  id_stok_gudang: number
  id_barang: number
  id_gudang: number
  kuantitas_stok: number
  updated_at: Date
  gudang: GudangRow
}

export type BarangRow = {
  id_barang: number
  nama_barang: string
  sku: string
  kategori: string | null
  satuan: string
  batas_minimum: number
  harga: number
  created_at: Date
  updated_at: Date
  total_stok: number          // SUM dari semua stok_gudang
  stok_gudang: StokGudangRow[]
}

// ─── Gudang ─────────────────────────────────────────────────────────────────

export const getGudang = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.gudang.findMany({ orderBy: { id_gudang: 'asc' } })
  return rows as GudangRow[]
})

// ─── Helpers internal ────────────────────────────────────────────────────────

function mapBarang(r: any): BarangRow {
  const stok_gudang: StokGudangRow[] = (r.stok_gudang ?? []).map((sg: any) => ({
    id_stok_gudang: sg.id_stok_gudang,
    id_barang:      sg.id_barang,
    id_gudang:      sg.id_gudang,
    kuantitas_stok: sg.kuantitas_stok,
    updated_at:     sg.updated_at,
    gudang: {
      id_gudang:   sg.gudang.id_gudang,
      nama_gudang: sg.gudang.nama_gudang,
    },
  }))
  const total_stok = stok_gudang.reduce((sum, sg) => sum + sg.kuantitas_stok, 0)
  return {
    id_barang:    r.id_barang,
    nama_barang:  r.nama_barang,
    sku:          r.sku,
    kategori:     r.kategori,
    satuan:       r.satuan,
    batas_minimum: r.batas_minimum,
    harga:        Number(r.harga),
    created_at:   r.created_at,
    updated_at:   r.updated_at,
    total_stok,
    stok_gudang,
  }
}

const barangInclude = {
  stok_gudang: {
    include: { gudang: true },
    orderBy: { gudang: { id_gudang: 'asc' as const } },
  },
}

// ─── Barang ──────────────────────────────────────────────────────────────────

export const getBarang = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.barang.findMany({
    orderBy: { id_barang: 'asc' },
    include: barangInclude,
  })
  return rows.map(mapBarang)
})

export const getLowStock = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.barang.findMany({
    include: barangInclude,
    orderBy: { id_barang: 'asc' },
  })
  return rows.map(mapBarang).filter(r => r.total_stok <= r.batas_minimum)
})

export const getBarangBySku = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: string }) => {
    const row = await prisma.barang.findUnique({
      where: { sku: data },
      include: barangInclude,
    })
    if (!row) return null
    return mapBarang(row)
  })

// ─── Create Barang ───────────────────────────────────────────────────────────
// Stok awal sudah TIDAK ada di sini — diisi lewat Stok Masuk

export const createBarang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: {
      nama_barang: string
      sku: string
      kategori?: string
      satuan: string
      batas_minimum: number
      harga: number
    }
  }) => {
    const row = await prisma.barang.create({
      data: {
        nama_barang:   data.nama_barang,
        sku:           data.sku,
        kategori:      data.kategori || null,
        satuan:        data.satuan,
        batas_minimum: data.batas_minimum,
        harga:         data.harga,
        updated_at:    new Date(),
      },
      include: barangInclude,
    })
    return mapBarang(row)
  })

// ─── Update Barang ───────────────────────────────────────────────────────────

export const updateBarang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: {
      sku: string
      nama_barang?: string
      kategori?: string | null
      satuan?: string
      batas_minimum?: number
      harga?: number
    }
  }) => {
    const { sku, ...fields } = data
    const row = await prisma.barang.update({
      where: { sku },
      data: {
        ...fields,
        updated_at: new Date(),
      },
      include: barangInclude,
    })
    return mapBarang(row)
  })

// ─── Delete Barang ───────────────────────────────────────────────────────────

export const deleteBarang = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: string }) => {
    const barang = await prisma.barang.findUnique({ where: { sku: data } })
    if (!barang) return { ok: false, hasTransaksi: false, count: 0 }

    const count = await prisma.transaksi.count({ where: { id_barang: barang.id_barang } })
    if (count > 0) return { ok: false, hasTransaksi: true, count }

    // stok_gudang akan CASCADE DELETE otomatis
    await prisma.barang.delete({ where: { sku: data } })
    return { ok: true, hasTransaksi: false, count: 0 }
  })

export const deleteBarangForce = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: string }) => {
    const barang = await prisma.barang.findUnique({ where: { sku: data } })
    if (!barang) return { ok: false }

    await prisma.transaksi.deleteMany({ where: { id_barang: barang.id_barang } })
    // stok_gudang CASCADE DELETE
    await prisma.barang.delete({ where: { sku: data } })
    return { ok: true }
  })

// ─── Stok Gudang ─────────────────────────────────────────────────────────────

// Upsert stok gudang (tambah atau kurangi, dipanggil dari transaksi)
async function upsertStokGudang(id_barang: number, id_gudang: number, delta: number) {
  const existing = await prisma.stokGudang.findUnique({
    where: { id_barang_id_gudang: { id_barang, id_gudang } },
  })

  if (existing) {
    const newStok = existing.kuantitas_stok + delta
    if (newStok < 0) throw new Error(`Stok di gudang tidak mencukupi. Tersedia: ${existing.kuantitas_stok}.`)
    return await prisma.stokGudang.update({
      where: { id_barang_id_gudang: { id_barang, id_gudang } },
      data:  { kuantitas_stok: newStok, updated_at: new Date() },
    })
  } else {
    if (delta < 0) throw new Error('Stok di gudang ini belum ada.')
    return await prisma.stokGudang.create({
      data: { id_barang, id_gudang, kuantitas_stok: delta, updated_at: new Date() },
    })
  }
}

// Update stok gudang langsung (untuk edit manual dari detail produk)
export const updateStokGudang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: { id_barang: number; id_gudang: number; kuantitas_stok: number }
  }) => {
    const existing = await prisma.stokGudang.findUnique({
      where: { id_barang_id_gudang: { id_barang: data.id_barang, id_gudang: data.id_gudang } },
    })
    if (existing) {
      return await prisma.stokGudang.update({
        where: { id_barang_id_gudang: { id_barang: data.id_barang, id_gudang: data.id_gudang } },
        data:  { kuantitas_stok: data.kuantitas_stok, updated_at: new Date() },
      })
    } else {
      return await prisma.stokGudang.create({
        data: { id_barang: data.id_barang, id_gudang: data.id_gudang, kuantitas_stok: data.kuantitas_stok, updated_at: new Date() },
      })
    }
  })

// Hapus stok produk dari gudang tertentu (hapus semua stok di gudang itu)
export const deleteStokGudang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { id_barang: number; id_gudang: number } }) => {
    await prisma.stokGudang.deleteMany({
      where: { id_barang: data.id_barang, id_gudang: data.id_gudang },
    })
    return { ok: true }
  })

// ─── Gudang CRUD ──────────────────────────────────────────────────────────────

export const createGudang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { nama_gudang: string } }) => {
    const row = await prisma.gudang.create({ data: { nama_gudang: data.nama_gudang } })
    return { ok: true, data: row }
  })

export const updateGudang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { id_gudang: number; nama_gudang: string } }) => {
    const row = await prisma.gudang.update({
      where: { id_gudang: BigInt(data.id_gudang) },
      data:  { nama_gudang: data.nama_gudang },
    })
    return { ok: true, data: row }
  })
 
export const deleteGudang = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: number }) => {
    const count = await prisma.stokGudang.count({ where: { id_gudang: BigInt(data) } })
    if (count > 0) return { ok: false, hasStok: true, count }
    await prisma.gudang.delete({ where: { id_gudang: BigInt(data) } })
    return { ok: true, hasStok: false }
  })

// ─── Reset Password ───────────────────────────────────────────────────────────

// Helper internal
function parseToken(token: string | null): { state: 'none' | 'pending' | 'active' | 'expired'; code?: string } {
  if (!token) return { state: 'none' }
  if (token === 'pending') return { state: 'pending' }
  const [code, expStr] = token.split(':')
  const expiry = parseInt(expStr, 10)
  if (isNaN(expiry) || Date.now() > expiry) return { state: 'expired' }
  return { state: 'active', code }
}

// User: request reset password
export const requestPasswordReset = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { username: string } }) => {
    const user = await prisma.pengguna.findFirst({
      where: { OR: [{ email: data.username }, { nama_lengkap: data.username }] },
    })
    if (!user) return { ok: false, error: 'Username tidak ditemukan.' }

    const parsed = parseToken(user.token)

    // Token masih aktif → langsung ke input token
    if (parsed.state === 'active') return { ok: true, state: 'has_token' }

    // Sudah pending → beritahu user menunggu
    if (parsed.state === 'pending') return { ok: true, state: 'pending' }

    // Buat request baru
    await prisma.pengguna.update({
      where: { id_pengguna: user.id_pengguna },
      data:  { token: 'pending', updated_at: new Date() },
    })
    return { ok: true, state: 'requested' }
  })

// Admin: approve reset → generate token 15 menit
export const approvePasswordReset = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: number }) => {
    const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code   = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const expiry = Date.now() + 15 * 60 * 1000  // 15 menit
    await prisma.pengguna.update({
      where: { id_pengguna: BigInt(data) },
      data:  { token: `${code}:${expiry}`, updated_at: new Date() },
    })
    return { ok: true, code }
  })

// User: validate token
export const validateResetToken = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { username: string; token: string } }) => {
    const user = await prisma.pengguna.findFirst({
      where: { OR: [{ email: data.username }, { nama_lengkap: data.username }] },
    })
    if (!user) return { ok: false, error: 'User tidak ditemukan.' }

    const parsed = parseToken(user.token)
    if (parsed.state !== 'active') return { ok: false, error: 'Token tidak valid atau sudah kadaluarsa.' }
    if (parsed.code !== data.token.toUpperCase()) return { ok: false, error: 'Kode token salah.' }

    return { ok: true }
  })

// User: ganti password dengan token
export const changePasswordWithToken = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { username: string; token: string; newPassword: string } }) => {
    const user = await prisma.pengguna.findFirst({
      where: { OR: [{ email: data.username }, { nama_lengkap: data.username }] },
    })
    if (!user) return { ok: false, error: 'User tidak ditemukan.' }

    const parsed = parseToken(user.token)
    if (parsed.state !== 'active' || parsed.code !== data.token.toUpperCase())
      return { ok: false, error: 'Token tidak valid atau sudah kadaluarsa.' }

    await prisma.pengguna.update({
      where: { id_pengguna: user.id_pengguna },
      data:  { password_hash: data.newPassword, token: null, updated_at: new Date() },
    })
    return { ok: true }
  })

// Admin: cancel / tolak request
export const cancelPasswordReset = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: number }) => {
    await prisma.pengguna.update({
      where: { id_pengguna: BigInt(data) },
      data:  { token: null, updated_at: new Date() },
    })
    return { ok: true }
  })
  
// ─── Bulk Create (Import CSV) ─────────────────────────────────────────────────
// CSV import: tidak ada stok awal, hanya data produk

export const bulkCreateBarang = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: Array<{
      nama_barang: string
      sku: string
      kategori?: string
      satuan: string
      batas_minimum: number
      harga: number
    }>
  }) => {
    const results = await Promise.allSettled(
      data.map(item =>
        prisma.barang.upsert({
          where: { sku: item.sku },
          update: {
            nama_barang:   item.nama_barang,
            kategori:      item.kategori || null,
            satuan:        item.satuan,
            batas_minimum: item.batas_minimum,
            harga:         item.harga,
            updated_at:    new Date(),
          },
          create: {
            nama_barang:   item.nama_barang,
            sku:           item.sku,
            kategori:      item.kategori || null,
            satuan:        item.satuan,
            batas_minimum: item.batas_minimum,
            harga:         item.harga,
            updated_at:    new Date(),
          },
        })
      )
    )
    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed    = results.filter(r => r.status === 'rejected').length
    return { succeeded, failed, total: data.length }
  })

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  const now            = new Date()
  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalSKU, barangAll, transaksiHariIni,
    masukBulanIni, keluarBulanIni,
    masukBulanLalu, keluarBulanLalu,
    totalSKUBulanLalu,
  ] = await Promise.all([
    prisma.barang.count(),
    prisma.barang.findMany({
      select: {
        kategori:  true,
        harga:     true,
        batas_minimum: true,
        stok_gudang: { select: { kuantitas_stok: true } },
      },
    }),
    prisma.transaksi.findMany({
      where:   { tanggal: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: { barang: true, pengguna: true, gudang: true },
      orderBy: { tanggal: 'desc' },
      take:    5,
    }),
    prisma.transaksi.aggregate({
      where: { jenis_transaksi: 'masuk',  tanggal: { gte: monthStart } },
      _sum:  { jumlah: true },
    }),
    prisma.transaksi.aggregate({
      where: { jenis_transaksi: 'keluar', tanggal: { gte: monthStart } },
      _sum:  { jumlah: true },
    }),
    prisma.transaksi.aggregate({
      where: { jenis_transaksi: 'masuk',  tanggal: { gte: lastMonthStart, lt: monthStart } },
      _sum:  { jumlah: true },
    }),
    prisma.transaksi.aggregate({
      where: { jenis_transaksi: 'keluar', tanggal: { gte: lastMonthStart, lt: monthStart } },
      _sum:  { jumlah: true },
    }),
    prisma.barang.count({ where: { created_at: { lt: monthStart } } }),
  ])

  const barangMapped = barangAll.map(b => ({
    kategori:      b.kategori,
    harga:         Number(b.harga),
    batas_minimum: b.batas_minimum,
    total_stok:    b.stok_gudang.reduce((s, sg) => s + sg.kuantitas_stok, 0),
  }))

  const nilaiInventaris = barangMapped.reduce((sum, b) => sum + b.harga * b.total_stok, 0)
  const lowStockCount   = barangMapped.filter(b => b.total_stok > 0 && b.total_stok <= b.batas_minimum).length

  // ── Kategori distribusi (pie chart) ──
  const katMap: Record<string, number> = {}
  barangMapped.forEach(b => {
    const kat = b.kategori ?? 'Lainnya'
    katMap[kat] = (katMap[kat] ?? 0) + b.harga * b.total_stok
  })
  const totalKatVal = Object.values(katMap).reduce((s, v) => s + v, 0) || 1
  let kategoriDistribusi = Object.entries(katMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value, pct: Math.round((value / totalKatVal) * 100) }))
  // Normalisasi agar total = 100%
  const pctSum = kategoriDistribusi.reduce((s, k) => s + k.pct, 0)
  if (kategoriDistribusi.length && pctSum !== 100) kategoriDistribusi[0].pct += 100 - pctSum

  // ── Persentase perubahan ──
  const masukIni   = masukBulanIni._sum.jumlah   ?? 0
  const keluarIni  = keluarBulanIni._sum.jumlah  ?? 0
  const masukLalu  = masukBulanLalu._sum.jumlah  ?? 0
  const keluarLalu = keluarBulanLalu._sum.jumlah ?? 0

  function calcPct(now: number, prev: number): number | null {
    if (prev === 0) return now > 0 ? 100 : null
    return Math.round(((now - prev) / prev) * 100)
  }

  return {
    totalSKU,
    nilaiInventaris,
    lowStockCount,
    masukBulanIni:     masukIni,
    keluarBulanIni:    keluarIni,
    masukPct:          calcPct(masukIni, masukLalu),
    keluarPct:         calcPct(keluarIni, keluarLalu),
    skuPct:            calcPct(totalSKU, totalSKUBulanLalu),
    kategoriDistribusi,
    transaksiHariIni: transaksiHariIni.map(t => ({
      ...t,
      barang: { ...t.barang, harga: Number(t.barang.harga) },
    })),
  }
})

// ─── Bar Chart (7 hari) ───────────────────────────────────────────────────────

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
          _sum:  { jumlah: true },
        }),
        prisma.transaksi.aggregate({
          where: { jenis_transaksi: 'keluar', tanggal: { gte: day, lt: next } },
          _sum:  { jumlah: true },
        }),
      ])
      return {
        label: String(day.getDate()),
        in:    masuk._sum.jumlah ?? 0,
        out:   keluar._sum.jumlah ?? 0,
      }
    })
  )
  return results
})

// ─── Transaksi ────────────────────────────────────────────────────────────────

export const getTransaksi = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.transaksi.findMany({
    include: { barang: true, pengguna: true, gudang: true },
    orderBy: { tanggal: 'desc' },
  })
  return rows.map(t => ({
    ...t,
    barang: { ...t.barang, harga: Number(t.barang.harga) },
  }))
})

export const getTransaksiMasuk = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.transaksi.findMany({
    where:   { jenis_transaksi: 'masuk' },
    include: { barang: true, pengguna: true, gudang: true },
    orderBy: { tanggal: 'desc' },
  })
  return rows.map(t => ({
    ...t,
    barang: { ...t.barang, harga: Number(t.barang.harga) },
  }))
})

export const getTransaksiKeluar = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await prisma.transaksi.findMany({
    where:   { jenis_transaksi: 'keluar' },
    include: { barang: true, pengguna: true, gudang: true },
    orderBy: { tanggal: 'desc' },
  })
  return rows.map(t => ({
    ...t,
    barang: { ...t.barang, harga: Number(t.barang.harga) },
  }))
})

// ─── Pengguna ─────────────────────────────────────────────────────────────────

export const getPengguna = createServerFn({ method: 'GET' }).handler(async () => {
  return await prisma.pengguna.findMany({ orderBy: { id_pengguna: 'asc' } })
})

export const getUsers = getPengguna

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { username: string; password: string } }) => {
    const user = await prisma.pengguna.findFirst({
      where: {
        OR: [
          { email: data.username },
          { nama_lengkap: data.username },
        ],
      },
    })
    if (!user) return { ok: false, error: 'Username atau email tidak ditemukan.' }
    if (data.password !== user.password_hash) return { ok: false, error: 'Password salah.' }
    return {
    ok: true,
    user: {
    id_pengguna:  Number(user.id_pengguna),  // ← convert ke number dulu
    nama_lengkap: user.nama_lengkap,
    email:        user.email,
    role:         user.role,
  }
}
  })

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUser = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: { nama_lengkap: string; username: string; password: string }
  }) => {
    const existing = await prisma.pengguna.findFirst({ where: { email: data.username } })
    if (existing) return { ok: false, error: 'Username sudah digunakan.' }

    const user = await prisma.pengguna.create({
      data: {
        nama_lengkap:  data.nama_lengkap,
        email:         data.username,
        password_hash: data.password,
        role:          'Operator Gudang',
        updated_at:    new Date(),
      },
    })
    return {
      ok: true,
      user: {
      id_pengguna:  Number(user.id_pengguna),  // ← sama
      nama_lengkap: user.nama_lengkap,
      email:        user.email,
      role:         user.role,
  }
}
  })

// ─── Update User ──────────────────────────────────────────────────────────────

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
      },
    })
    return { ok: true, user: row }
  })

// ─── Delete User ──────────────────────────────────────────────────────────────

export const deleteUser = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: number }) => {
    await prisma.pengguna.delete({ where: { id_pengguna: data } })
    return { ok: true }
  })

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const getAuditLog = createServerFn({ method: 'GET' }).handler(async () => {
  return await prisma.auditLog.findMany({
    orderBy: { created_at: 'desc' },
    take:    30,
    include: { pengguna: { select: { nama_lengkap: true } } },
  })
})

export const createAuditLog = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: { data: { id_pengguna: number | null; aksi: string } }) => {
    return await prisma.auditLog.create({ data })
  })

// ─── Create Transaksi Masuk ───────────────────────────────────────────────────

export const createTransaksiMasuk = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: {
      id_barang: number
      id_pengguna: number
      id_gudang: number
      jumlah: number
      keterangan?: string
      tanggal?: string
    }
  }) => {
    const barang = await prisma.barang.findUnique({ where: { id_barang: data.id_barang } })
    if (!barang) throw new Error('Barang tidak ditemukan.')

    const gudang = await prisma.gudang.findUnique({ where: { id_gudang: data.id_gudang } })
    if (!gudang) throw new Error('Gudang tidak ditemukan.')

    const transaksi = await prisma.transaksi.create({
      data: {
        id_barang:       data.id_barang,
        id_pengguna:     data.id_pengguna,
        id_gudang:       data.id_gudang,
        jenis_transaksi: 'masuk',
        jumlah:          data.jumlah,
        keterangan:      data.keterangan ?? null,
        tanggal:         data.tanggal ? new Date(data.tanggal) : new Date(),
        created_at:      new Date(),
      },
    })

    // Update stok di gudang yang dipilih
    await upsertStokGudang(data.id_barang, data.id_gudang, data.jumlah)

    return transaksi
  })

// ─── Create Transaksi Keluar ──────────────────────────────────────────────────

export const createTransaksiKeluar = createServerFn({ method: 'POST' })
  // @ts-ignore
  .handler(async ({ data }: {
    data: {
      id_barang: number
      id_pengguna: number
      id_gudang: number
      jumlah: number
      keterangan?: string
      tanggal?: string
    }
  }) => {
    const barang = await prisma.barang.findUnique({ where: { id_barang: data.id_barang } })
    if (!barang) throw new Error('Barang tidak ditemukan.')

    const gudang = await prisma.gudang.findUnique({ where: { id_gudang: data.id_gudang } })
    if (!gudang) throw new Error('Gudang tidak ditemukan.')

    // Validasi stok di gudang spesifik
    const stokGudang = await prisma.stokGudang.findUnique({
      where: { id_barang_id_gudang: { id_barang: data.id_barang, id_gudang: data.id_gudang } },
    })
    if (!stokGudang || stokGudang.kuantitas_stok < data.jumlah) {
      const tersedia = stokGudang?.kuantitas_stok ?? 0
      throw new Error(`Stok di ${gudang.nama_gudang} tidak mencukupi. Tersedia: ${tersedia} ${barang.satuan}.`)
    }

    const transaksi = await prisma.transaksi.create({
      data: {
        id_barang:       data.id_barang,
        id_pengguna:     data.id_pengguna,
        id_gudang:       data.id_gudang,
        jenis_transaksi: 'keluar',
        jumlah:          data.jumlah,
        keterangan:      data.keterangan ?? null,
        tanggal:         data.tanggal ? new Date(data.tanggal) : new Date(),
        created_at:      new Date(),
      },
    })

    await upsertStokGudang(data.id_barang, data.id_gudang, -data.jumlah)

    return transaksi
  })

// ─── Monthly Stats (6 bulan) ──────────────────────────────────────────────────

export const getMonthlyStats = createServerFn({ method: 'GET' }).handler(async () => {
  const now    = new Date()
  const months = Array.from({ length: 6 }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
  )
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

// ─── Top 5 Produk ─────────────────────────────────────────────────────────────

export const getTopProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const groups = await prisma.transaksi.groupBy({
    by:      ['id_barang'],
    _count:  { id_transaksi: true },
    _sum:    { jumlah: true },
    orderBy: { _count: { id_transaksi: 'desc' } },
    take:    5,
  })

  return Promise.all(
    groups.map(async g => {
      const b = await prisma.barang.findUnique({
        where:   { id_barang: g.id_barang },
        include: { stok_gudang: true },
      })
      const total_stok = b?.stok_gudang.reduce((s, sg) => s + sg.kuantitas_stok, 0) ?? 0
      return {
        nama_barang:      b?.nama_barang ?? '—',
        sku:              b?.sku ?? '—',
        jumlah_transaksi: g._count.id_transaksi,
        total_qty:        g._sum.jumlah ?? 0,
        total_nilai:      Number(b?.harga ?? 0) * (g._sum.jumlah ?? 0),
        total_stok,
      }
    })
  )
})