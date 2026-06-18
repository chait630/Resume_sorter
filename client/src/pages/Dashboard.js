import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_RESUMES, UPLOADS_URL, API_REQUIREMENTS, API_EMAIL } from '../config';
const ALL_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi'
];

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [state, setState] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReqModal, setShowReqModal] = useState(false);
  const [view, setView] = useState('grid');
  const [apiError, setApiError] = useState('');
  const [emailModal, setEmailModal] = useState(null); // { to, name }
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', company: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  const [inboxModal, setInboxModal] = useState(false);
  const [inboxEmails, setInboxEmails] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState('');

  const EMAIL_TEMPLATES = [
    { label: 'Shortlist', subject: 'You have been Shortlisted!', body: 'We are pleased to inform you that your profile has been shortlisted for further evaluation. Our team will reach out to you shortly with the next steps.\n\nThank you for your interest.' },
    { label: 'Interview Invite', subject: 'Interview Invitation', body: 'We would like to invite you for an interview. Please reply to this email to confirm your availability and we will schedule a convenient time.\n\nLooking forward to connecting with you.' },
    { label: 'Rejection', subject: 'Regarding Your Application', body: 'Thank you for your interest and the time you invested in applying. After careful consideration, we have decided to move forward with other candidates whose profiles more closely match our current requirements.\n\nWe will keep your profile on record for future opportunities.' },
  ];

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setEmailSending(true);
    setEmailStatus('');
    try {
      const token = localStorage.getItem('hr_token');
      await axios.post(`${API_EMAIL}/send`, {
        to: emailModal.to,
        candidateName: emailModal.name,
        subject: emailForm.subject,
        body: emailForm.body,
        company: emailForm.company
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEmailStatus('success');
    } catch (err) {
      setEmailStatus('error: ' + (err.response?.data?.message || err.message));
    }
    setEmailSending(false);
  };

  const fetchInbox = async () => {
    setInboxLoading(true);
    setInboxError('');
    try {
      const token = localStorage.getItem('hr_token');
      const res = await axios.get(`${API_EMAIL}/read`, { headers: { Authorization: `Bearer ${token}` } });
      setInboxEmails(res.data.emails || []);
    } catch (err) {
      setInboxError(err.response?.data?.message || err.message);
    }
    setInboxLoading(false);
  };

  useEffect(() => {
    if (inboxModal) {
      fetchInbox();
    }
  }, [inboxModal]);

  // Requirement Form State
  const [newReq, setNewReq] = useState({ title: '', targetSkills: '', minExperience: 0, targetState: '' });

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('hr_token');
      if (!token) { setApiError('Not authenticated. Please log in again.'); setLoading(false); return; }
      const res = await axios.get(API_RESUMES, { 
        params: state ? { state } : {},
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both paginated {resumes:[]} and legacy [] response shapes
      const data = res.data;
      if (Array.isArray(data)) {
        setResumes(data);
      } else if (data && Array.isArray(data.resumes)) {
        setResumes(data.resumes);
      } else {
        setResumes([]);
      }
    } catch (err) {
      console.error('fetchResumes error:', err);
      setApiError(err.response?.data?.message || err.message || 'Failed to load resumes.');
    }
    setLoading(false);
  }, [state]);

  const fetchRequirements = useCallback(async () => {
    try {
      const token = localStorage.getItem('hr_token');
      if (!token) return;
      const res = await axios.get(API_REQUIREMENTS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequirements(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('fetchRequirements error:', err); }
  }, []);

  useEffect(() => { fetchResumes(); fetchRequirements(); }, [fetchResumes, fetchRequirements]);

  useEffect(() => {
    let data = [...resumes];
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(r => 
        r.name.toLowerCase().includes(s) || 
        (r.skills && r.skills.toLowerCase().includes(s)) ||
        r.email.toLowerCase().includes(s)
      );
    }

    // Apply Intelligent Scoring if a requirement is selected
    if (selectedReq) {
      data = data.map(r => {
        let score = 0;
        const skills = r.skills?.toLowerCase() || '';
        const reqSkills = selectedReq.targetSkills.map(s => s.toLowerCase());
        
        const skillMatches = reqSkills.filter(s => skills.includes(s)).length;
        const skillScore = reqSkills.length ? (skillMatches / reqSkills.length) * 60 : 0;
        
        const locScore = (selectedReq.targetState && r.state === selectedReq.targetState) ? 40 : 0;
        
        return { ...r, matchScore: Math.round(skillScore + locScore) };
      }).sort((a, b) => b.matchScore - a.matchScore);
    }

    setFiltered(data);
  }, [resumes, search, selectedReq]);

  const handleAddRequirement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hr_token');
      await axios.post(API_REQUIREMENTS, newReq, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewReq({ title: '', targetSkills: '', minExperience: 0, targetState: '' });
      setShowReqModal(false);
      fetchRequirements();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove record?')) return;
    try {
      const token = localStorage.getItem('hr_token');
      await axios.delete(`${API_RESUMES}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchResumes();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="reveal">
      <header className="hero-section" style={{marginBottom:'60px', display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
        <div>
          <h1>Talent Pipeline</h1>
          <p style={{color:'var(--text-muted)', fontSize:'18px', letterSpacing:'4px', textTransform:'uppercase'}}>AI-Powered Search & Scoring</p>
        </div>
        <div style={{display:'flex', gap:'16px'}}>
          <button onClick={() => setInboxModal(true)} className="btn-artisan" style={{padding:'12px 24px', background:'transparent', border:'1px solid var(--accent-copper)', color:'var(--accent-copper)'}}>📥 Inbox</button>
          <button onClick={() => setShowReqModal(true)} className="btn-artisan" style={{padding:'12px 24px'}}>New Requirement</button>
        </div>
      </header>

      {/* API Error Banner */}
      {apiError && (
        <div style={{
          background:'rgba(255,50,50,0.1)', border:'1px solid rgba(255,50,50,0.3)',
          borderRadius:'12px', padding:'16px 24px', marginBottom:'32px',
          color:'#ff6b6b', fontSize:'13px', display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <span>⚠ {apiError}</span>
          <button onClick={fetchResumes} style={{background:'transparent', border:'1px solid rgba(255,50,50,0.4)', color:'#ff6b6b', padding:'6px 16px', borderRadius:'20px', cursor:'pointer', fontSize:'11px'}}>Retry</button>
        </div>
      )}

      {/* Requirement Selector */}
      <div className="artisan-card" style={{marginBottom:'32px', padding:'24px 40px', display:'flex', gap:'24px', alignItems:'center'}}>
        <div style={{color:'var(--accent-gold)', fontSize:'12px', fontWeight:'800', letterSpacing:'1px'}}>ACTIVE REQUIREMENT:</div>
        <select 
          className="modern-input" 
          style={{width:'300px', marginBottom:0}} 
          onChange={(e) => setSelectedReq(requirements.find(r => r._id === e.target.value))}
          value={selectedReq?._id || ''}
        >
          <option value="">None (Generic View)</option>
          {requirements.map(r => <option key={r._id} value={r._id} style={{background:'#000'}}>{r.title}</option>)}
        </select>
        {selectedReq && (
          <div style={{fontSize:'12px', color:'var(--text-muted)'}}>
            Target: {selectedReq.targetSkills.join(', ')} | {selectedReq.targetState || 'Anywhere'}
          </div>
        )}
      </div>

      {/* Enhanced Control Bar */}
      <div className="artisan-card" style={{marginBottom:'48px', padding:'24px 40px', display:'flex', gap:'32px', alignItems:'center'}}>
        <div style={{flex:1}}>
          <div className="modern-input-group" style={{marginBottom:0}}>
            <input className="modern-input" placeholder=" " value={search} onChange={e=>setSearch(e.target.value)} />
            <label className="modern-label">Intelligent Fuzzy Search</label>
          </div>
        </div>
        
        <div style={{display:'flex', gap:'12px'}}>
          <button onClick={()=>setView('grid')} style={{
            background: view === 'grid' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border:'1px solid var(--border-refined)', color: view === 'grid' ? 'var(--accent-gold)' : 'var(--text-muted)',
            width:'40px', height:'40px', borderRadius:'8px'
          }}>⊞</button>
          <button onClick={()=>setView('feed')} style={{
            background: view === 'feed' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border:'1px solid var(--border-refined)', color: view === 'feed' ? 'var(--accent-gold)' : 'var(--text-muted)',
            width:'40px', height:'40px', borderRadius:'8px'
          }}>≡</button>
        </div>

        <select className="modern-input" style={{width:'180px', marginBottom:0}} value={state} onChange={e=>setState(e.target.value)}>
          <option value="">All Regions</option>
          {ALL_STATES.map(s=><option key={s} style={{background:'#000'}}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{textAlign:'center', padding:'100px', letterSpacing:'12px', opacity:0.3}}>SCANNING TALENT...</div>
      ) : (
        <div className={view === 'grid' ? 'artisan-grid' : ''} style={{display: view === 'feed' ? 'flex' : 'grid', flexDirection: 'column', gap: '20px'}}>
          {filtered.map(r => (
            <div key={r._id} className="artisan-card reveal" style={{
              padding: view === 'feed' ? '24px 40px' : '40px',
              display: 'flex',
              flexDirection: view === 'feed' ? 'row' : 'column',
              alignItems: view === 'feed' ? 'center' : 'stretch',
              justifyContent: 'space-between',
              gap: '24px',
              minHeight: view === 'grid' ? '380px' : 'auto'
            }}>
              <div style={{flex: view === 'feed' ? 1 : 'none'}}>
                <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom: view === 'feed' ? 0 : '24px'}}>
                  <div style={{
                    width:'48px', height:'48px', background:'rgba(255,255,255,0.03)', 
                    borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', 
                    fontSize:'20px', border: r.matchScore > 70 ? '1px solid var(--accent-gold)' : '1px solid var(--border-refined)'
                  }}>
                    {selectedReq ? <span style={{fontSize:'12px', fontWeight:'900', color:'var(--accent-gold)'}}>{r.matchScore}%</span> : '👤'}
                  </div>
                  <div>
                    <h3 style={{fontSize:'22px', margin:0}}>{r.name}</h3>
                    <div className="cand-loc" style={{fontSize:'10px', marginTop:'4px'}}>{r.state}</div>
                  </div>
                </div>
              </div>

              {view === 'grid' && (
                <div style={{color:'var(--text-muted)', fontSize:'13px', marginBottom:'24px', borderLeft:'2px solid var(--accent-copper)', paddingLeft:'16px'}}>
                  {r.email}
                </div>
              )}

              <div style={{flex: 1}}>
                <div className="tag-cloud" style={{marginTop:0}}>
                  {r.skills.split(',').slice(0, 4).map(sk=>(
                    <span key={sk} className="tag-item" style={{
                      fontSize:'10px',
                      borderColor: selectedReq?.targetSkills.some(ts => sk.toLowerCase().includes(ts.toLowerCase())) ? 'var(--accent-gold)' : 'var(--border-refined)'
                    }}>{sk.trim()}</span>
                  ))}
                </div>
              </div>

              <div style={{display:'flex', gap:'10px', marginTop: view === 'grid' ? 'auto' : 0, borderTop: view === 'grid' ? '1px solid var(--border-refined)' : 'none', paddingTop: view === 'grid' ? '24px' : 0, flexWrap:'wrap'}}>
                {r.resumeFile ? (
                  <a href={`${UPLOADS_URL}/${r.resumeFile}`} target="_blank" rel="noreferrer" className="btn-artisan" style={{flex:1, textAlign:'center', textDecoration:'none', padding:'12px', fontSize:'11px'}}>View Resume</a>
                ) : null}
                {r.email ? (
                  <button
                    onClick={() => { setEmailModal({ to: r.email, name: r.name }); setEmailForm({ subject: '', body: '', company: '' }); setEmailStatus(''); }}
                    className="btn-artisan"
                    style={{flex:1, padding:'12px', fontSize:'11px', background:'transparent', border:'1px solid var(--accent-copper)', color:'var(--accent-copper)'}}
                  >✉ Email</button>
                ) : null}
                <button onClick={()=>handleDelete(r._id)} style={{background:'transparent', border:'none', color:'#333', fontSize:'18px', padding:'0 8px'}}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requirement Modal */}
      {showReqModal && (
        <div className="login-artisan" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.9)', zIndex:2000}}>
          <div className="artisan-card reveal" style={{width:'500px'}}>
            <h2 style={{fontFamily:'var(--font-heading)', fontSize:'32px', marginBottom:'32px'}}>New Job Requirement</h2>
            <form onSubmit={handleAddRequirement}>
              <div className="modern-input-group">
                <input className="modern-input" placeholder=" " value={newReq.title} onChange={e=>setNewReq({...newReq, title:e.target.value})} required />
                <label className="modern-label">Job Title</label>
              </div>
              <div className="modern-input-group">
                <input className="modern-input" placeholder=" " value={newReq.targetSkills} onChange={e=>setNewReq({...newReq, targetSkills:e.target.value})} required />
                <label className="modern-label">Target Skills (comma separated)</label>
              </div>
              <div className="modern-input-group">
                <select className="modern-input" value={newReq.targetState} onChange={e=>setNewReq({...newReq, targetState:e.target.value})}>
                  <option value="">Any State</option>
                  {ALL_STATES.map(s=><option key={s} style={{background:'#000'}}>{s}</option>)}
                </select>
                <label className="modern-label">Target Location</label>
              </div>
              <div style={{display:'flex', gap:'16px', marginTop:'48px'}}>
                <button type="submit" className="btn-artisan" style={{flex:1}}>Create</button>
                <button type="button" onClick={()=>setShowReqModal(false)} className="btn-artisan" style={{background:'transparent', color:'white', border:'1px solid #333'}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Compose Modal */}
      {emailModal && (
        <div className="login-artisan" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.92)', zIndex:2000}}>
          <div className="artisan-card reveal" style={{width:'600px', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
              <div>
                <h2 style={{fontFamily:'var(--font-heading)', fontSize:'28px', margin:0}}>Compose Email</h2>
                <p style={{color:'var(--text-muted)', fontSize:'12px', margin:'4px 0 0'}}>To: {emailModal.name} &lt;{emailModal.to}&gt;</p>
              </div>
              <button onClick={() => setEmailModal(null)} style={{background:'transparent', border:'none', color:'#555', fontSize:'24px', cursor:'pointer'}}>✕</button>
            </div>

            {/* Quick Templates */}
            <div style={{marginBottom:'28px'}}>
              <div style={{fontSize:'10px', color:'var(--accent-gold)', letterSpacing:'2px', fontWeight:'800', marginBottom:'12px'}}>QUICK TEMPLATES</div>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                {EMAIL_TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => setEmailForm({ subject: t.subject, body: t.body })}
                    style={{padding:'6px 16px', background:'rgba(194,142,94,0.08)', border:'1px solid rgba(194,142,94,0.2)', borderRadius:'20px', color:'var(--accent-copper)', fontSize:'11px', cursor:'pointer', fontWeight:'800'}}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendEmail}>
              <div className="modern-input-group">
                <input className="modern-input" placeholder=" " value={emailForm.company} onChange={e => setEmailForm({...emailForm, company: e.target.value})} required />
                <label className="modern-label">Your Company Name (appears in email)</label>
              </div>
              <div className="modern-input-group">
                <input className="modern-input" placeholder=" " value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} required />
                <label className="modern-label">Subject</label>
              </div>
              <div style={{position:'relative', marginBottom:'24px'}}>
                <textarea
                  value={emailForm.body}
                  onChange={e => setEmailForm({...emailForm, body: e.target.value})}
                  required
                  rows={8}
                  placeholder="Write your message here..."
                  style={{width:'100%', background:'transparent', border:'none', borderBottom:'1px solid var(--border-refined)', padding:'12px 0', color:'var(--text-silk)', fontSize:'14px', fontFamily:'var(--font-body)', resize:'vertical', lineHeight:'1.7'}}
                />
              </div>

              {emailStatus && (
                <div style={{padding:'12px 16px', borderRadius:'8px', marginBottom:'20px', fontSize:'13px',
                  background: emailStatus === 'success' ? 'rgba(0,255,100,0.08)' : 'rgba(255,50,50,0.08)',
                  border: emailStatus === 'success' ? '1px solid rgba(0,255,100,0.2)' : '1px solid rgba(255,50,50,0.2)',
                  color: emailStatus === 'success' ? '#4ade80' : '#f87171'
                }}>
                  {emailStatus === 'success' ? '✓ Email sent successfully! The candidate will receive it shortly.' : `⚠ ${emailStatus}`}
                </div>
              )}

              <div style={{display:'flex', gap:'16px'}}>
                <button type="submit" className="btn-artisan" style={{flex:1}} disabled={emailSending}>
                  {emailSending ? 'Sending...' : '✉ Send Email'}
                </button>
                <button type="button" onClick={() => setEmailModal(null)} className="btn-artisan" style={{background:'transparent', color:'white', border:'1px solid #333'}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inbox Modal */}
      {inboxModal && (
        <div className="login-artisan" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.92)', zIndex:2000}}>
          <div className="artisan-card reveal" style={{width:'800px', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
              <h2 style={{fontFamily:'var(--font-heading)', fontSize:'28px', margin:0}}>Candidate Inbox</h2>
              <button onClick={() => setInboxModal(false)} style={{background:'transparent', border:'none', color:'#555', fontSize:'24px', cursor:'pointer'}}>✕</button>
            </div>
            
            {inboxError && <div style={{color:'#ff6b6b', marginBottom:'16px'}}>⚠ {inboxError}</div>}
            
            {inboxLoading ? (
              <div style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>Fetching emails...</div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                {inboxEmails.length === 0 ? (
                  <div style={{color:'var(--text-muted)'}}>No emails found.</div>
                ) : (
                  inboxEmails.map(msg => {
                    const senderInitial = msg.from ? msg.from.charAt(0).toUpperCase() : '?';
                    return (
                      <div key={msg.id} className="reveal" style={{
                        padding:'24px', 
                        border:'1px solid var(--border-refined)', 
                        borderRadius:'16px', 
                        background:'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
                        transition:'transform 0.2s ease, border-color 0.2s ease',
                        cursor:'pointer'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-refined)'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
                          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                            <div style={{
                              width:'40px', height:'40px', borderRadius:'50%', 
                              background:'rgba(194,142,94,0.1)', border:'1px solid var(--accent-copper)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color:'var(--accent-gold)', fontWeight:'900', fontSize:'16px'
                            }}>{senderInitial}</div>
                            <div>
                              <strong style={{color:'var(--text-silk)', fontSize:'15px', display:'block'}}>{msg.from}</strong>
                              <span style={{fontSize:'12px', color:'var(--text-muted)'}}>{new Date(msg.date).toLocaleString()}</span>
                            </div>
                          </div>
                          <div style={{background:'rgba(255,255,255,0.05)', padding:'4px 12px', borderRadius:'20px', fontSize:'11px', color:'var(--text-muted)', letterSpacing:'1px', textTransform:'uppercase'}}>
                            Received
                          </div>
                        </div>
                        <div style={{fontWeight:'800', marginBottom:'16px', fontSize:'16px', color:'white', letterSpacing:'0.5px'}}>{msg.subject}</div>
                        {msg.html ? (
                          <div style={{fontSize:'14px', color:'var(--text-silk)', lineHeight:'1.6', overflowX:'hidden', background:'rgba(0,0,0,0.2)', padding:'16px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.02)'}} dangerouslySetInnerHTML={{ __html: msg.html }} />
                        ) : (
                          <div style={{fontSize:'14px', color:'var(--text-silk)', lineHeight:'1.6', whiteSpace:'pre-wrap', background:'rgba(0,0,0,0.2)', padding:'16px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.02)'}}>{msg.text}</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}