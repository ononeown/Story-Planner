import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // .env.local 미설정 시 빠르게 알아채도록 경고
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다. .env.example 을 참고해 .env.local 을 만드세요.',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')
