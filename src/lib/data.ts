// ─── Formatters ────────────────────────────────────────────────────────────

export const fmtIDR = (n: number | bigint | null | undefined) => {
  if (n === null || n === undefined) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

export const fmtNum = (n: number) => n.toLocaleString('id-ID')

// ─── Stock status helper ────────────────────────────────────────────────────

export function statusForStock(stok: number, min: number): { kind: string; label: string } {
  if (stok === 0)          return { kind: 'danger', label: 'HABIS' }
  if (stok < min)          return { kind: 'warn',   label: 'RENDAH' }
  if (stok < min * 1.2)   return { kind: 'warn',   label: 'HAMPIR MIN' }
  return                          { kind: 'ok',     label: 'NORMAL' }
}