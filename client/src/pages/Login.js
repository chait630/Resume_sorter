import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_AUTH } from '../config';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode]         = useState('login');
  const [step, setStep]         = useState(1);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [otp, setOtp]           = useState(['','','','','','']);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_AUTH}/login`, { email, password });
      if (res.data.token) {
        localStorage.setItem('hr_token', res.data.token);
        localStorage.setItem('hr_name',  res.data.name);
        localStorage.setItem('hr_email', res.data.email);
        localStorage.setItem('hr_role',  res.data.role);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_AUTH}/register`, { name, email, password });
      setSuccess('Verification code sent to your email');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError(''); setSuccess('');
    const otpStr = otp.join('');
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/verify-otp' : '/verify-login-otp';
      const res = await axios.post(`${API_AUTH}${endpoint}`, { email, otp: otpStr });
      localStorage.setItem('hr_token', res.data.token);
      localStorage.setItem('hr_name',  res.data.name);
      localStorage.setItem('hr_email', res.data.email);
      localStorage.setItem('hr_role',  res.data.role);
      navigate('/');
    } catch (err) {
      setError('Invalid code');
    }
    setLoading(false);
  };

  const handleOtpChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val.replace(/[^0-9]/g, '').slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) document.getElementById(`otp-${idx+1}`).focus();
  };

  const switchMode = (m) => {
    setMode(m); setStep(1); setError(''); setSuccess(''); setOtp(['','','','','','']);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await axios.post(`${API_AUTH}/forgot-password`, { email });
      setSuccess('Verification code sent to your email');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match'); return; }
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Enter full 6-digit OTP'); return; }
    
    setLoading(true);
    try {
      await axios.post(`${API_AUTH}/reset-password`, { email, otp: otpStr, newPassword });
      setSuccess('Password reset successfully. Please login.');
      setTimeout(() => switchMode('login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
    setLoading(false);
  };

  return (
    <div className="login-artisan">
      <div className="login-frame artisan-card reveal">
        <h2>{step === 1 ? (mode === 'login' ? 'Sign In' : mode === 'register' ? 'Sign Up' : 'Reset Password') : step === 3 ? 'Reset Password' : 'Verify'}</h2>

        {error && <div style={{color:'var(--error)', fontSize:'12px', textAlign:'center', marginBottom:'32px', fontWeight:'800'}}>{error}</div>}
        {success && <div style={{color:'var(--accent-gold)', fontSize:'12px', textAlign:'center', marginBottom:'32px'}}>{success}</div>}

        {step === 1 && mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="modern-input-group">
              <input className="modern-input" type="email" placeholder=" " value={email} onChange={e=>setEmail(e.target.value)} required />
              <label className="modern-label">Email Address</label>
            </div>
            <div className="modern-input-group">
              <input className="modern-input" type="password" placeholder=" " value={password} onChange={e=>setPassword(e.target.value)} required />
              <label className="modern-label">Password</label>
            </div>
            <div style={{marginTop:'16px', textAlign:'right', fontSize:'12px'}}>
              <button type="button" onClick={()=>switchMode('forgot')} style={{background:'transparent', color:'var(--text-muted)', border:'none', cursor:'pointer'}}>Forgot Password?</button>
            </div>
            <button type="submit" className="btn-artisan" style={{width:'100%', marginTop:'32px'}} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div style={{marginTop:'48px', textAlign:'center', fontSize:'12px'}}>
              Don't have an account? <button type="button" onClick={()=>switchMode('register')} style={{background:'transparent', color:'var(--accent-copper)', border:'none', fontWeight:'800', cursor:'pointer'}}>Create Account</button>
            </div>
          </form>
        )}

        {step === 1 && mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="modern-input-group">
              <input className="modern-input" placeholder=" " value={name} onChange={e=>setName(e.target.value)} required />
              <label className="modern-label">Full Name</label>
            </div>
            <div className="modern-input-group">
              <input className="modern-input" type="email" placeholder=" " value={email} onChange={e=>setEmail(e.target.value)} required />
              <label className="modern-label">Email Address</label>
            </div>
            <div className="modern-input-group">
              <input className="modern-input" type="password" placeholder=" " value={password} onChange={e=>setPassword(e.target.value)} required />
              <label className="modern-label">Password</label>
            </div>
            <div className="modern-input-group">
              <input className="modern-input" type="password" placeholder=" " value={confirm} onChange={e=>setConfirm(e.target.value)} required />
              <label className="modern-label">Confirm Password</label>
            </div>
            <button type="submit" className="btn-artisan" style={{width:'100%', marginTop:'32px'}} disabled={loading}>
              Sign Up
            </button>
            <div style={{marginTop:'48px', textAlign:'center'}}>
              <button type="button" onClick={()=>switchMode('login')} style={{background:'transparent', color:'var(--text-muted)', border:'none', cursor:'pointer'}}>Back to Login</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div style={{textAlign:'center'}}>
            <p style={{color:'var(--text-muted)', marginBottom:'48px', fontSize:'14px'}}>Enter code sent to {email}</p>
            <div className="otp-group" style={{marginBottom:'48px', display:'flex', gap:'8px', justifyContent:'center'}}>
              {otp.map((d, i) => (
                <input key={i} id={`otp-${i}`} className="modern-input" type="text" maxLength={1} value={d}
                  onChange={e=>handleOtpChange(e.target.value, i)} style={{width:'40px', textAlign:'center'}} />
              ))}
            </div>
            <button onClick={handleVerifyOtp} className="btn-artisan" style={{width:'100%'}} disabled={loading}>
              Verify Code
            </button>
          </div>
        )}

        {step === 1 && mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <div className="modern-input-group">
              <input className="modern-input" type="email" placeholder=" " value={email} onChange={e=>setEmail(e.target.value)} required />
              <label className="modern-label">Email Address</label>
            </div>
            <button type="submit" className="btn-artisan" style={{width:'100%', marginTop:'32px'}} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <div style={{marginTop:'48px', textAlign:'center'}}>
              <button type="button" onClick={()=>switchMode('login')} style={{background:'transparent', color:'var(--text-muted)', border:'none', cursor:'pointer'}}>Back to Login</button>
            </div>
          </form>
        )}

        {step === 3 && mode === 'forgot' && (
          <form onSubmit={handleResetPassword}>
            <p style={{color:'var(--text-muted)', marginBottom:'24px', fontSize:'14px', textAlign:'center'}}>Enter code sent to {email}</p>
            <div className="otp-group" style={{marginBottom:'24px', display:'flex', gap:'8px', justifyContent:'center'}}>
              {otp.map((d, i) => (
                <input key={i} id={`otp-${i}`} className="modern-input" type="text" maxLength={1} value={d}
                  onChange={e=>handleOtpChange(e.target.value, i)} style={{width:'40px', textAlign:'center'}} />
              ))}
            </div>
            <div className="modern-input-group">
              <input className="modern-input" type="password" placeholder=" " value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
              <label className="modern-label">New Password</label>
            </div>
            <div className="modern-input-group">
              <input className="modern-input" type="password" placeholder=" " value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} required />
              <label className="modern-label">Confirm New Password</label>
            </div>
            <button type="submit" className="btn-artisan" style={{width:'100%', marginTop:'32px'}} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}