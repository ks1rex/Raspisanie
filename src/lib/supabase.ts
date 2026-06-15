import { createClient } from '@supabase/supabase-js'

// Нормализуем значение из env: добавляем https://, отсекаем битое.
// Битый/пустой URL -> null (синк выключен), а не краш на createClient.
function resolveUrl(v?: string): string | null {
  if (!v) return null
  const withProto = /^https?:\/\//.test(v) ? v : `https://${v}`
  try {
    return new URL(withProto).origin
  } catch {
    console.warn('VITE_SUPABASE_URL невалиден, синк выключен:', v)
    return null
  }
}

const url = resolveUrl(import.meta.env.VITE_SUPABASE_URL)
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null
