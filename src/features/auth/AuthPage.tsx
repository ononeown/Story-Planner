import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'

type Mode = 'login' | 'signup'

const configMissing =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // 이메일 확인이 켜져 있으면 세션이 즉시 생기지 않는다.
        if (!data.session) {
          setNotice(
            '가입 완료. 이메일 확인이 켜져 있다면 메일의 링크를 눌러 인증하세요. (개발 중엔 Supabase Auth 설정에서 "Confirm email"을 꺼도 됩니다)',
          )
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Story Planner
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {mode === 'login' ? '로그인하여 작품을 이어가세요' : '새 계정을 만드세요'}
          </p>
        </div>

        {configMissing && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
            Supabase 환경변수가 설정되지 않았습니다. <code>.env.local</code> 을 만들고
            <code> VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code> 를 넣은 뒤
            서버를 재시작하세요.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="이메일" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="비밀번호" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
            />
          </Field>

          {error && (
            <p className="text-[13px] text-danger">{error}</p>
          )}
          {notice && (
            <p className="text-[13px] text-success">{notice}</p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : mode === 'login' ? '로그인' : '가입하기'}
          </Button>
        </form>

        <div className="mt-6 text-center text-[13px] text-ink-muted">
          {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
          <button
            type="button"
            className="font-medium text-accent hover:underline"
            onClick={() => {
              setMode((m) => (m === 'login' ? 'signup' : 'login'))
              setError(null)
              setNotice(null)
            }}
          >
            {mode === 'login' ? '가입하기' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}
