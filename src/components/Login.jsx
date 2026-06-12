import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

export function Login({ onLoginSuccess }) {
  const { 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    isFirebaseEnabled 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      onLoginSuccess();
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err) {
      console.error("Google Auth error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(mobile)) { 
      setError('Enter a 10-digit mobile number.'); 
      return; 
    }
    setOtpSent(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp !== '1234') { 
      setError('Invalid OTP. Enter 1234.'); 
      return; 
    }
    setError('');
    // For local sandbox demo OTP bypass
    if (!isFirebaseEnabled) {
      localStorage.setItem('fh_is_logged_in', 'true');
      localStorage.setItem('fh_local_role', 'owner');
    }
    onLoginSuccess();
  };

  return (
    <div className="login-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div className="login-logo-box" style={{ margin: '0 auto 0.5rem auto' }}>
            <Icon name="heart" size={30} className="pulse-animation" color="#ffffff" />
          </div>
          <h2 className="login-title" style={{ margin: 0 }}>FamilyHealth</h2>
          <p className="login-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Cloud Health Portal</p>
        </div>
        
        <div className="login-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', paddingBottom: '0.2rem' }}>
            <button 
              type="button"
              className="btn-icon" 
              style={{ 
                flex: 1, 
                border: 'none', 
                background: loginMode === 'email' ? 'var(--color-primary-light)' : 'none', 
                color: loginMode === 'email' ? 'var(--color-primary)' : 'var(--text-secondary)', 
                height: '30px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
              onClick={() => { setLoginMode('email'); setError(''); }}
            >
              Email / Google
            </button>
            <button 
              type="button"
              className="btn-icon" 
              style={{ 
                flex: 1, 
                border: 'none', 
                background: loginMode === 'otp' ? 'var(--color-primary-light)' : 'none', 
                color: loginMode === 'otp' ? 'var(--color-primary)' : 'var(--text-secondary)', 
                height: '30px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
              onClick={() => { setLoginMode('otp'); setError(''); }}
            >
              Phone OTP
            </button>
          </div>

          {error && (
            <div style={{ 
              background: 'var(--color-danger-light)', 
              color: 'var(--color-danger)', 
              padding: '0.5rem 0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.65rem', 
              marginBottom: '0.8rem',
              fontWeight: '600',
              border: '1px solid rgba(220, 38, 38, 0.15)',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          {loginMode === 'email' ? (
            <form onSubmit={handleEmailAuth} style={{ textAlign: 'left' }}>
              {isRegistering && (
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ height: '38px', fontSize: '0.8rem' }}
                    required 
                  />
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="demo@health.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={{ height: '38px', fontSize: '0.8rem' }}
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={{ height: '38px', fontSize: '0.8rem' }}
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading} 
                style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}
              >
                {loading ? 'Authenticating...' : isRegistering ? 'Create Account' : 'Log In'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {isRegistering ? "Already have an account? " : "New to FamilyHealth? "}
                </span>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => setIsRegistering(!isRegistering)}
                >
                  {isRegistering ? "Sign In" : "Register"}
                </button>
              </div>

              {isFirebaseEnabled && (
                <>
                  <div style={{ position: 'relative', textAlign: 'center', margin: '1rem 0 0.75rem 0' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />
                    <span style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-secondary)', padding: '0 0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>OR</span>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleGoogleAuth} 
                    disabled={loading}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.77H24v9.03h12.75c-.55 2.89-2.2 5.33-4.68 7l7.26 5.63C43.58 36.6 46.5 30.9 46.5 24z"/>
                      <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.26-5.63c-2.03 1.36-4.63 2.19-8.63 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} style={{ textAlign: 'left' }}>
              {!otpSent ? (
                <>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Mobile Number</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="Enter 10-digit mobile number" 
                      value={mobile} 
                      onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                      style={{ height: '38px', fontSize: '0.8rem' }}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                    Send Verification Code
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Verification Code</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="••••" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                      style={{ letterSpacing: '0.5em', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', height: '40px', borderRadius: '8px' }} 
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '38px', borderRadius: '8px', fontSize: '0.75rem' }} onClick={() => { setOtpSent(false); setOtp(''); }}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2, height: '38px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
                      Verify & Log In
                    </button>
                  </div>
                </>
              )}
              
              <div className="demo-info-box" style={{ marginTop: '1rem', padding: '0.5rem 0.6rem', fontSize: '0.62rem' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.1rem' }}>🔑 Demo Mode OTP</div>
                <div>Enter any mobile and verify using code <strong>1234</strong>.</div>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {!isFirebaseEnabled && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', padding: '0.5rem', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
          💡 Local Sandbox Mode: Login with email <strong>demo@health.com</strong> and password <strong>123456</strong>. You can connect a custom Firebase cloud project in Settings after logging in.
        </div>
      )}
    </div>
  );
}

export default Login;
