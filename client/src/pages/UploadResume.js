import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_RESUMES } from '../config';

export default function UploadResume() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const addFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter(f => f.name.match(/\.(pdf|doc|docx)$/i));
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const fresh = valid.filter(f => !existingNames.has(f.name));
      return [...prev, ...fresh].slice(0, 50);
    });
  }, []);

  const handleSubmit = async () => {
    if (!files.length) return;
    setUploading(true);
    const uploadResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
      const data = new FormData();
      data.append('resumeFile', file);
      data.append('name', cleanName || 'Candidate');
      data.append('country', 'India');

      try {
        const token = localStorage.getItem('hr_token');
        await axios.post(API_RESUMES, data, {
          headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
        });
        uploadResults.push({ name: file.name, status: 'success' });
      } catch (err) {
        uploadResults.push({ name: file.name, status: 'error' });
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setResults(uploadResults);
    setUploading(false);
    setDone(true);
  };

  if (done) return (
    <div className="reveal">
      <div className="artisan-card" style={{maxWidth:'700px', margin:'0 auto', textAlign:'center', padding:'80px'}}>
        <h1 style={{fontSize:'64px', marginBottom:'24px', letterSpacing:'-2px'}}>SUCCESS</h1>
        <p style={{color:'var(--text-muted)', fontSize:'18px', marginBottom:'64px'}}>The resumes have been uploaded and processed.</p>
        
        <div style={{display:'flex', gap:'32px', justifyContent:'center', marginBottom:'64px'}}>
          <div style={{flex:1, borderRight:'1px solid var(--border-refined)'}}>
            <div style={{fontSize:'48px', fontWeight:'900', color:'var(--accent-gold)'}}>{results.filter(r=>r.status==='success').length}</div>
            <div style={{fontSize:'11px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'2px'}}>Uploaded</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:'48px', fontWeight:'900', color:'#444'}}>{results.filter(r=>r.status==='error').length}</div>
            <div style={{fontSize:'11px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'2px'}}>Failed</div>
          </div>
        </div>

        <div style={{display:'flex', gap:'20px', justifyContent:'center'}}>
          <button onClick={()=>{setDone(false); setFiles([]); setResults([]);}} className="btn-artisan" style={{background:'transparent', border:'1px solid var(--border-refined)', color:'var(--text-silk)'}}>Upload More</button>
          <button onClick={()=>navigate('/')} className="btn-artisan">Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reveal">
      <header className="hero-section">
        <h1>Resume Upload</h1>
        <p style={{color:'var(--text-muted)', fontSize:'18px', letterSpacing:'4px', textTransform:'uppercase'}}>Import Candidates to Pipeline</p>
      </header>

      <div
        className="artisan-card"
        onClick={() => inputRef.current.click()}
        style={{height:'400px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderStyle:'dashed', borderColor:'#222', cursor:'pointer'}}
      >
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
        <div style={{fontSize:'64px', marginBottom:'24px', opacity:0.3}}>✦</div>
        <h2 style={{fontFamily:'var(--font-heading)', fontSize:'32px', marginBottom:'16px'}}>Select Resumes</h2>
        <p style={{color:'var(--text-muted)', fontSize:'14px'}}>Drop PDF or DOCX files here</p>
      </div>

      {files.length > 0 && !uploading && (
        <div className="artisan-card reveal" style={{marginTop:'48px'}}>
          <h3 style={{fontFamily:'var(--font-heading)', fontSize:'24px', marginBottom:'40px'}}>Selected Files ({files.length})</h3>
          <div style={{display:'flex', flexWrap:'wrap', gap:'12px', marginBottom:'64px'}}>
            {files.map(f=>(
              <div key={f.name} style={{background:'rgba(255,255,255,0.02)', padding:'12px 24px', borderRadius:'8px', border:'1px solid var(--border-refined)', fontSize:'13px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'12px'}}>
                {f.name}
                <button onClick={(e)=>{e.stopPropagation(); setFiles(files.filter(x=>x!==f))}} style={{background:'transparent', color:'#444', border:'none', cursor:'pointer'}}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} className="btn-artisan" style={{width:'100%'}}>Start Upload</button>
        </div>
      )}

      {uploading && (
        <div className="artisan-card reveal" style={{marginTop:'48px', textAlign:'center'}}>
          <h2 style={{fontFamily:'var(--font-heading)', fontSize:'32px', marginBottom:'32px', letterSpacing:'4px'}}>UPLOADING...</h2>
          <div style={{height:'2px', background:'#111', borderRadius:'2px', overflow:'hidden', marginBottom:'16px'}}>
            <div style={{width:`${progress}%`, height:'100%', background:'var(--accent-copper)', transition:'width 0.3s'}}></div>
          </div>
          <p style={{fontSize:'12px', color:'var(--accent-copper)', fontWeight:'800'}}>{progress}% COMPLETED</p>
        </div>
      )}
    </div>
  );
}