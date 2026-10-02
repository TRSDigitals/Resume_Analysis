import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowRight, BarChart3, CheckCircle2, FileText, Gauge,
  History, Lightbulb, Loader2, Moon, Search, ShieldCheck, Sparkles,
  Target, Upload, XCircle, Zap
} from "lucide-react";
import "./index.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5050";

const sampleJob = `Frontend Developer
React, JavaScript, TypeScript, REST API, Git, HTML, CSS.
Build responsive interfaces, collaborate with backend teams, write tests, and deploy applications.`;

function ScoreRing({ score }) {
  return (
    <div className="relative grid h-40 w-40 place-items-center rounded-full"
      style={{ background: `conic-gradient(#8b5cf6 ${score * 3.6}deg, #1e293b 0deg)` }}>
      <div className="grid h-32 w-32 place-items-center rounded-full bg-slate-950">
        <div className="text-center"><div className="text-4xl font-black">{score}</div><div className="text-xs text-slate-400">/ 100</div></div>
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [job, setJob] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(true);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("trs-history") || "[]"));

  const displayHistory = useMemo(() => history.slice(0, 5), [history]);

  function saveHistory(data) {
    const next = [{ fileName: data.fileName, score: data.score, analyzedAt: data.analyzedAt }, ...history].slice(0, 10);
    setHistory(next); localStorage.setItem("trs-history", JSON.stringify(next));
  }

  async function analyze() {
    if (!file) return setError("Choose a PDF or DOCX resume first.");
    setError(""); setLoading(true); setResult(null);
    const form = new FormData();
    form.append("resume", file);
    form.append("jobDescription", job);
    try {
      const res = await fetch(`${API}/api/analyze`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data); saveHistory(data);
    } catch (e) { setError(`${e.message} Make sure the backend is running on port 5050.`); }
    finally { setLoading(false); }
  }

  return (
    <div className={dark ? "min-h-screen bg-slate-950 text-white" : "min-h-screen bg-slate-100 text-slate-900"}>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/20"><Sparkles size={20}/></div>
            <div><div className="font-black tracking-tight">TRS <span className="text-violet-400">DIGITALS</span></div><div className="text-[10px] uppercase tracking-[.25em] text-slate-500">AI Resume Analyzer</div></div>
          </div>
          <button onClick={() => setDark(!dark)} className="rounded-xl border border-white/10 p-2.5 text-slate-300 hover:bg-white/5"><Moon size={18}/></button>
        </div>
      </header>

      <main className="grid-bg mx-auto max-w-7xl px-5 py-10">
        <section className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-semibold text-violet-300"><Zap size={14}/> Smart ATS-style resume analysis</div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Turn your resume into a <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">stronger application.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-slate-400">Upload your resume, compare it with a job description, and get actionable feedback from TRS Digitals.</p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="glass glow rounded-3xl p-6">
            <div className="mb-5 flex items-center gap-3"><FileText className="text-violet-400"/><div><h2 className="font-bold">1. Upload resume</h2><p className="text-sm text-slate-500">PDF or DOCX · max 5 MB</p></div></div>
            <label className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-900/50 p-6 text-center hover:border-violet-400/60">
              <input className="hidden" type="file" accept=".pdf,.docx" onChange={e => {setFile(e.target.files?.[0] || null); setError("");}}/>
              {file ? <><CheckCircle2 size={42} className="text-emerald-400"/><div className="mt-3 font-semibold">{file.name}</div><div className="mt-1 text-xs text-slate-500">Ready to analyze</div></> :
              <><Upload size={42} className="text-violet-400 transition group-hover:scale-110"/><div className="mt-3 font-semibold">Drop your resume or click to browse</div><div className="mt-1 text-sm text-slate-500">Your file is processed by your configured backend.</div></>}
            </label>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="mb-5 flex items-center gap-3"><Target className="text-cyan-400"/><div><h2 className="font-bold">2. Target job</h2><p className="text-sm text-slate-500">Optional, but recommended</p></div></div>
            <textarea value={job} onChange={e=>setJob(e.target.value)} placeholder={sampleJob} className="h-56 w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200 outline-none transition focus:border-violet-400"/>
            <button onClick={analyze} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 font-bold shadow-lg shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 className="animate-spin" size={18}/> Analyzing…</> : <>Analyze Resume <ArrowRight size={18}/></>}
            </button>
          </div>
        </section>

        {error && <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"><XCircle className="mr-2 inline" size={17}/>{error}</div>}

        {result && <section className="mt-10 space-y-5">
          <div className="glass rounded-3xl p-6">
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <ScoreRing score={result.score}/>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">{result.source || "AI analysis"}</span><span className="text-xs text-slate-500">{result.fileName}</span></div>
                <h2 className="mt-3 text-2xl font-black">Resume analysis complete</h2>
                <p className="mt-2 max-w-2xl text-slate-400">{result.summary}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Metric icon={<Gauge/>} title="ATS Score" value={result.atsScore}/>
            <Metric icon={<Search/>} title="Keyword Match" value={result.keywordScore}/>
            <Metric icon={<BarChart3/>} title="Detected Skills" value={result.skills.detected.length}/>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Section scores" icon={<Activity/>}>
              <div className="space-y-4">{Object.entries(result.sections).map(([key,val])=><div key={key}><div className="mb-1 flex justify-between text-sm"><span className="capitalize text-slate-300">{key}</span><span className="font-bold">{val}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{width:`${val}%`}}/></div></div>)}</div>
            </Panel>
            <Panel title="Job match" icon={<Target/>}>
              <div className="mb-4 text-xs uppercase tracking-widest text-slate-500">Matched</div>
              <div className="flex flex-wrap gap-2">{result.skills.matched.length ? result.skills.matched.map(s=><span key={s} className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">{s}</span>) : <span className="text-sm text-slate-500">Add a job description to compare skills.</span>}</div>
              <div className="mb-4 mt-6 text-xs uppercase tracking-widest text-slate-500">Missing / useful keywords</div>
              <div className="flex flex-wrap gap-2">{result.skills.missing.map(s=><span key={s} className="rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">{s}</span>)}</div>
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Issues to fix" icon={<ShieldCheck/>}>{result.issues.length ? result.issues.map((x,i)=><div key={i} className="mb-3 flex gap-3 rounded-xl bg-slate-900/70 p-3 text-sm text-slate-300"><XCircle className="mt-0.5 shrink-0 text-amber-400" size={17}/>{x}</div>) : <div className="text-sm text-emerald-300">No major issues detected.</div>}</Panel>
            <Panel title="Actionable suggestions" icon={<Lightbulb/>}>{result.suggestions.map((x,i)=><div key={i} className="mb-3 flex gap-3 rounded-xl bg-slate-900/70 p-3 text-sm text-slate-300"><CheckCircle2 className="mt-0.5 shrink-0 text-cyan-400" size={17}/>{x}</div>)}</Panel>
          </div>
        </section>}

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="glass rounded-3xl p-6"><div className="mb-4 flex items-center gap-3"><History className="text-violet-400"/><h2 className="font-bold">Recent analyses</h2></div>{displayHistory.length ? displayHistory.map((x,i)=><div key={i} className="flex items-center justify-between border-b border-white/5 py-3 text-sm"><span className="truncate pr-4 text-slate-300">{x.fileName}</span><span className="font-black text-violet-300">{x.score}</span></div>) : <p className="text-sm text-slate-500">Your recent analyses will appear here.</p>}</div>
          <div className="glass rounded-3xl p-6"><div className="mb-4 flex items-center gap-3"><ShieldCheck className="text-emerald-400"/><h2 className="font-bold">Privacy-first setup</h2></div><p className="text-sm leading-6 text-slate-400">API keys remain on the backend. Resume files are processed in memory by the included server and are not intentionally stored by this application.</p></div>
        </section>

        <footer className="py-12 text-center text-xs text-slate-600">© {new Date().getFullYear()} TRS Digitals · AI Resume Analyzer</footer>
      </main>
    </div>
  );
}

function Metric({icon,title,value}) { return <div className="glass rounded-2xl p-5"><div className="mb-3 text-violet-400">{icon}</div><div className="text-3xl font-black">{value}{title !== "Detected Skills" && "%"}</div><div className="mt-1 text-sm text-slate-500">{title}</div></div>; }
function Panel({title,icon,children}) { return <div className="glass rounded-3xl p-6"><div className="mb-5 flex items-center gap-3"><span className="text-violet-400">{icon}</span><h2 className="font-bold">{title}</h2></div>{children}</div>; }

createRoot(document.getElementById("root")).render(<App />);
