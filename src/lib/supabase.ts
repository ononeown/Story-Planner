import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** .env.local 에 Supabase 자격증명이 설정되어 있는지 여부 */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다. .env.example 을 참고해 .env.local 을 만드세요.',
  )
}

// 미설정 시에도 createClient 가 throw 하지 않도록 자리표시자 값을 넣는다.
// (실제 호출은 isSupabaseConfigured 게이트로 막아 placeholder 로 네트워크 요청이 가지 않음)
export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? anonKey : 'placeholder-anon-key',
)
