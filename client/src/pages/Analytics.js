import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_RESUMES } from '../config';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

export default function Analytics() {
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

  // Data Aggregation
  const getSkillsData = () => {
    const skills = {};
    resumes.forEach(r => {
      r.skills?.split(',').forEach(s => {
        const name = s.trim();
        if (name) skills[name] = (skills[name] || 0) + 1;
      });
    });
    return Object.entries(skills).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value).slice(0, 8);
  };

  const getStatusData = () => {
    const status = { 'New': 0, 'Reviewing': 0, 'Shortlisted': 0, 'Interviewed': 0, 'Rejected': 0, 'Offer': 0, 'Hired': 0 };
    resumes.forEach(r => {
      const s = r.status || 'New';
      if (status[s] !== undefined) status[s]++;
    });
    return Object.entries(status).map(([name, value]) => ({ name, value }));
  };

  const getGeoData = () => {
    const geo = {};
    resumes.forEach(r => {
      const name = r.state || 'Unknown';
      geo[name] = (geo[name] || 0) + 1;
    });
    return Object.entries(geo).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value).slice(0, 5);
  };

  const COLORS = ['#c28e5e', '#e2b07e', '#808070', '#f5f5f1', '#a0a0a0'];

  if (loading) return <div style={{textAlign:'center', padding:'100px', letterSpacing:'12px', opacity:0.3}}>AGGREGATING DATA...</div>;

  return (
    <div className="reveal">
      <header className="hero-section" style={{marginBottom:'60px'}}>
        <h1>Intelligence Analytics</h1>
        <p style={{color:'var(--text-muted)', fontSize:'18px', letterSpacing:'4px', textTransform:'uppercase'}}>Enterprise Hiring Insights</p>
      </header>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px', marginBottom:'32px'}}>
        {/* Funnel Conversion */}
        <div className="artisan-card" style={{height:'450px'}}>
          <h3 style={{fontSize:'12px', letterSpacing:'2px', color:'var(--text-muted)', marginBottom:'40px'}}>HIRING FUNNEL</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={getStatusData()} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#808070" fontSize={10} width={80} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background:'#0f0f0f', border:'1px solid #222'}} />
              <Bar dataKey="value" fill="var(--accent-copper)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Distribution */}
        <div className="artisan-card" style={{height:'450px'}}>
          <h3 style={{fontSize:'12px', letterSpacing:'2px', color:'var(--text-muted)', marginBottom:'40px'}}>TOP SKILLS IN RESERVOIR</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={getSkillsData()} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {getSkillsData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{background:'#0f0f0f', border:'1px solid #222'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'32px'}}>
        {/* Geo Distribution */}
        <div className="artisan-card" style={{height:'400px'}}>
          <h3 style={{fontSize:'12px', letterSpacing:'2px', color:'var(--text-muted)', marginBottom:'40px'}}>GEOGRAPHIC SPREAD</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={getGeoData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#808070" fontSize={10} />
              <YAxis stroke="#808070" fontSize={10} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background:'#0f0f0f', border:'1px solid #222'}} />
              <Bar dataKey="value" fill="var(--accent-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Insights */}
        <div className="artisan-card" style={{height:'400px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center'}}>
          <div style={{fontSize:'10px', letterSpacing:'4px', color:'var(--accent-copper)', fontWeight:'900', marginBottom:'16px'}}>PLATFORM HEALTH</div>
          <div style={{fontSize:'64px', fontWeight:'900', color:'var(--text-silk)'}}>{resumes.length}</div>
          <div style={{fontSize:'12px', color:'var(--text-muted)'}}>Total Talent Records</div>
          <div style={{marginTop:'40px', fontSize:'12px', color:'var(--accent-gold)', fontWeight:'800'}}>
            {Math.round((resumes.filter(r=>r.status==='Hired').length / resumes.length) * 100) || 0}% Conversion Rate
          </div>
        </div>
      </div>
    </div>
  );
}
