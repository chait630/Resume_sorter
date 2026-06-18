import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_RESUMES } from '../config';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

export default function HiringPipeline() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hr_token');
      const res = await axios.get(API_RESUMES, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(res.data.resumes || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const updateStage = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('hr_token');
      // Re-using the status patch route
      await axios.patch(`${API_RESUMES}/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchResumes();
      // In a real app, this would trigger an email automation here
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{textAlign:'center', padding:'100px', letterSpacing:'12px', opacity:0.3}}>LOADING PIPELINE...</div>;

  return (
    <div className="reveal">
      <header className="hero-section" style={{marginBottom:'60px'}}>
        <h1>Hiring Pipeline</h1>
        <p style={{color:'var(--text-muted)', fontSize:'18px', letterSpacing:'4px', textTransform:'uppercase'}}>Visual Workflow Management</p>
      </header>

      <div style={{display:'flex', gap:'20px', overflowX:'auto', paddingBottom:'40px', minHeight:'70vh'}}>
        {STAGES.map(stage => {
          const candidates = resumes.filter(r => (r.status || 'New') === (stage === 'Applied' ? 'New' : stage));
          return (
            <div key={stage} className="artisan-card" style={{
              minWidth:'320px', flex:1, background:'rgba(255,255,255,0.01)', 
              display:'flex', flexDirection:'column', gap:'20px', padding:'24px'
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                <h3 style={{fontSize:'14px', fontWeight:'900', letterSpacing:'2px', color:'var(--accent-gold)'}}>{stage.toUpperCase()}</h3>
                <span style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'800'}}>{candidates.length}</span>
              </div>
              
              <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                {candidates.map(c => (
                  <div key={c._id} className="artisan-card" style={{
                    padding:'20px', background:'var(--bg-surface)', cursor:'grab',
                    border: c.score > 80 ? '1px solid rgba(194,142,94,0.3)' : '1px solid var(--border-refined)'
                  }}>
                    <div style={{fontSize:'14px', fontWeight:'800', marginBottom:'4px'}}>{c.name}</div>
                    <div style={{fontSize:'10px', color:'var(--text-muted)', marginBottom:'12px'}}>{c.skills.split(',')[0]}</div>
                    
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{fontSize:'10px', color:'var(--accent-copper)', fontWeight:'900'}}>{c.score}% Match</div>
                      <select 
                        value={stage === 'Applied' ? 'New' : stage} 
                        onChange={(e) => updateStage(c._id, e.target.value)}
                        style={{background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'10px', fontWeight:'800'}}
                      >
                        {STAGES.map(s => <option key={s} value={s === 'Applied' ? 'New' : s} style={{background:'#000'}}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {candidates.length === 0 && (
                <div style={{textAlign:'center', padding:'40px', fontSize:'12px', color:'var(--text-muted)', border:'1px dashed #222', borderRadius:'12px', opacity:0.5}}>
                  No candidates
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
