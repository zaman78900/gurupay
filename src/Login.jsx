import { useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[6-9]\d{9}$/

const normalizePhone = (value = '') => {
  const onlyDigits = value.replace(/\D/g, '')
  if (onlyDigits.startsWith('91') && onlyDigits.length > 10) {
    return onlyDigits.slice(-10)
  }
  return onlyDigits.slice(0, 10)
}

export default function Login() {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isSignUp = mode === 'signup'
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone])

  const validate = () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Please enter a valid email address.'
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters.'
    }

    if (isSignUp && !PHONE_REGEX.test(normalizedPhone)) {
      return 'Please enter a valid 10-digit mobile number (starting with 6-9).'
    }

    return ''
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setMessage('')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    })

    if (oauthError) {
      setError(oauthError.message || 'Google sign-in failed. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const formError = validate()
    if (formError) {
      setError(formError)
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              phone: normalizedPhone
            }
          }
        })

        if (signUpError) throw signUpError

        setMessage('Account created successfully. Please check your email for confirmation link if required.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })

        if (signInError) throw signInError
      }
    } catch (authError) {
      setError(authError?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1.25rem' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          boxShadow: '0 10px 25px rgba(2, 6, 23, 0.08)',
          padding: '1.5rem'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <img src="/feesync-logo.png" alt="FeeSync" style={{ width: 170, marginBottom: 10 }} />
          <p style={{ color: '#64748B', margin: 0, fontSize: 14 }}>
            Coaching Fee Manager — Sign in to continue
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <div
            style={{
              padding: '0.9rem',
              borderRadius: 12,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              lineHeight: 1.5,
              fontSize: 14
            }}
          >
            Supabase is not configured yet. Add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> in your environment variables to enable login.
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                background: '#fff',
                color: '#334155',
                height: 42,
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              Sign in with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ height: 1, background: '#E2E8F0', flex: 1 }} />
              <span style={{ color: '#94A3B8', fontSize: 12 }}>or continue with email</span>
              <div style={{ height: 1, background: '#E2E8F0', flex: 1 }} />
            </div>

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: 14, color: '#334155', marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                autoComplete="email"
                style={{
                  width: '100%',
                  border: '1px solid #CBD5E1',
                  borderRadius: 10,
                  height: 40,
                  padding: '0 12px',
                  marginBottom: 12,
                  outline: 'none'
                }}
              />

              <label style={{ display: 'block', fontSize: 14, color: '#334155', marginBottom: 6 }}>Create a Password</label>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  style={{
                    width: '100%',
                    border: '1px solid #CBD5E1',
                    borderRadius: 10,
                    height: 40,
                    padding: '0 42px 0 12px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {isSignUp && (
                <>
                  <label style={{ display: 'block', fontSize: 14, color: '#334155', marginBottom: 6 }}>Phone number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(normalizePhone(e.target.value))}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    autoComplete="tel"
                    style={{
                      width: '100%',
                      border: '1px solid #CBD5E1',
                      borderRadius: 10,
                      height: 40,
                      padding: '0 12px',
                      marginBottom: 6,
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: 0, marginBottom: 12, color: '#64748B', fontSize: 12 }}>
                    Required for first-time account creation.
                  </p>
                </>
              )}

              {error && (
                <div style={{ marginBottom: 10, color: '#B91C1C', fontSize: 13, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 10px' }}>
                  {error}
                </div>
              )}

              {message && (
                <div style={{ marginBottom: 10, color: '#166534', fontSize: 13, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 10px' }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: 10,
                  background: '#34D399',
                  color: '#fff',
                  height: 40,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1
                }}
              >
                {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(isSignUp ? 'signin' : 'signup')
                setError('')
                setMessage('')
              }}
              style={{
                border: 'none',
                background: 'none',
                color: '#64748B',
                marginTop: 12,
                width: '100%',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}