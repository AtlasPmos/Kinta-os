import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Brain, ClipboardCheck, FileText, Flame, LayoutDashboard, Plus, Send, ShieldAlert, UploadCloud, Wrench } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function App(){
  const [projects,setProjects]=useState([]);
  const [selected,setSelected]=useState('wylie-live-nation');
  const [brain,setBrain]=useState(null);
  const [question,setQuestion]=useState('What is blocking startup readiness today?');
  const [answer,setAnswer]=useState(null);
  const [brief,setBrief]=useState(null);
  const [newAction,setNewAction]=useState('');

  async function load(){
    const p=await fetch(`${API}/api/projects`).then(r=>r.json());
    setProjects(p);
    const b=await fetch(`${API}/api/projects/${selected}/brain`).then(r=>r.json());
    setBrain(b);
  }
  useEffect(()=>{load()},[selected]);

  async function ask(){
    const r=await fetch(`${API}/api/ask`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,projectId:selected})}).then(r=>r.json());
    setAnswer(r);
  }
  async function getBrief(){
    const r=await fetch(`${API}/api/brief`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:selected})}).then(r=>r.json());
    setBrief(r);
  }
  async function addAction(){
    if(!newAction.trim())return;
    await fetch(`${API}/api/actions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:selected,title:newAction,priority:'High',owner:'Rick / Team'})});
    setNewAction(''); load();
  }

  const project=projects.find(p=>p.id===selected)||projects[0];
  return <div className="app">
    <aside>
      <div className="brand"><div className="logo">K</div><div><h1>KINTA</h1><p>Enterprise v1.0</p></div></div>
      <button className="nav active"><LayoutDashboard/> Command Center</button>
      <button className="nav"><Brain/> Ask KINTA</button>
      <button className="nav"><Wrench/> Equipment DNA</button>
      <button className="nav"><ClipboardCheck/> MEP Verification</button>
      <button className="nav"><UploadCloud/> Upload Vault</button>
      <button className="nav"><FileText/> Reports</button>
      <div className="selectLabel">Project</div>
      <select value={selected} onChange={e=>setSelected(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
    </aside>
    <main>
      <header>
        <div><h2>{project?.name||'Loading project'}</h2><p>{project?.status}</p></div>
        <button onClick={getBrief}><Flame/> Generate Daily Brief</button>
      </header>

      <section className="grid three">
        <Card title="Project Health" value={`${project?.health||0}%`} sub="Auto-updated from blockers and verification" />
        <Card title="Open Actions" value={brain?.actions?.filter(a=>a.status==='Open').length||0} sub="Startup, delivery, warranty, GC coordination" />
        <Card title="Equipment Records" value={brain?.equipment?.length||0} sub="Linked to DNA, MEP, startup, warranty" />
      </section>

      <section className="panel ask">
        <h3><Brain/> Ask KINTA</h3>
        <div className="row"><input value={question} onChange={e=>setQuestion(e.target.value)} /><button onClick={ask}><Send/> Ask</button></div>
        {answer&&<div className="answer"><b>Answer mode: {answer.mode}</b><p>{answer.answer}</p>{answer.recommendations&&<ul>{answer.recommendations.map((x,i)=><li key={i}>{x}</li>)}</ul>}<small>Citations: {(answer.citations||[]).join(', ')}</small></div>}
      </section>

      {brief&&<section className="panel"><h3>Daily Brief</h3><p><b>Status:</b> {brief.status}</p><p><b>Health:</b> {brief.health}%</p><h4>Priorities</h4><ul>{brief.priorities.map(a=><li key={a.id}>{a.priority}: {a.title} — {a.owner}</li>)}</ul><h4>Email Draft</h4><pre>{brief.recommendedEmail}</pre></section>}

      <section className="grid two">
        <section className="panel">
          <h3><ShieldAlert/> Action Center</h3>
          <div className="row"><input placeholder="Add action item..." value={newAction} onChange={e=>setNewAction(e.target.value)}/><button onClick={addAction}><Plus/> Add</button></div>
          <div className="list">{brain?.actions?.map(a=><div className="item" key={a.id}><b>{a.title}</b><span>{a.priority} • {a.owner} • {a.status}</span></div>)}</div>
        </section>
        <section className="panel">
          <h3><Wrench/> Equipment DNA</h3>
          <div className="list">{brain?.equipment?.map(e=><div className="item" key={e.id}><b>{e.item}</b><span>{e.room} • {e.manufacturer} • Startup: {e.startup}</span><code>{Object.entries(e.utilities||{}).map(([k,v])=>`${k}:${v}`).join(' | ')}</code></div>)}</div>
        </section>
      </section>
    </main>
  </div>
}
function Card({title,value,sub}){return <div className="card"><span>{title}</span><strong>{value}</strong><p>{sub}</p></div>}

createRoot(document.getElementById('root')).render(<App/>);
