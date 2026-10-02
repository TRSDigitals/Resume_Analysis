import express from "express";
import cors from "cors";
import multer from "multer";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import "dotenv/config";

const app = express();
const port = Number(process.env.PORT || 5050);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const skillBank = [
  "javascript","typescript","react","node.js","node","express","python","java","c++",
  "sql","mysql","postgresql","mongodb","git","github","docker","aws","azure","gcp",
  "rest api","api","html","css","tailwind","figma","machine learning","data analysis",
  "iot","embedded systems","arduino","esp32","linux","testing","agile","communication"
];

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9+#./ -]/g, " ");
}

function extractSkills(text) {
  const n = normalize(text);
  return [...new Set(skillBank.filter(s => n.includes(s)))];
}

function analyzeLocal(resume, job = "") {
  const n = normalize(resume);
  const words = resume.trim().split(/\s+/).filter(Boolean).length;
  const sections = {
    contact: /(email|phone|linkedin|github)/i.test(resume) ? 100 : 55,
    summary: /(summary|profile|objective)/i.test(resume) ? 100 : 45,
    experience: /(experience|internship|employment)/i.test(resume) ? 100 : 40,
    education: /(education|university|college|degree|bachelor|master)/i.test(resume) ? 100 : 45,
    skills: /(skills|technologies|technical skills)/i.test(resume) ? 100 : 45,
    projects: /(projects|project)/i.test(resume) ? 100 : 35
  };

  const resumeSkills = extractSkills(resume);
  const jobSkills = extractSkills(job);
  const matched = jobSkills.filter(s => resumeSkills.includes(s));
  const missing = jobSkills.filter(s => !resumeSkills.includes(s));

  const keywordScore = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : 70;
  const lengthScore = words >= 350 && words <= 1100 ? 100 : words >= 200 ? 75 : 50;
  const sectionAvg = Math.round(Object.values(sections).reduce((a,b)=>a+b,0)/6);
  const score = Math.min(100, Math.round(sectionAvg * 0.45 + keywordScore * 0.35 + lengthScore * 0.20));

  const issues = [];
  if (!sections.summary) issues.push("Add a concise professional summary.");
  if (!sections.projects) issues.push("Add 2–4 relevant projects with measurable outcomes.");
  if (words < 350) issues.push("Your resume appears short; add relevant evidence rather than filler.");
  if (jobSkills.length && missing.length) issues.push(`Consider adding evidence for relevant skills: ${missing.slice(0,5).join(", ")}.`);

  const suggestions = [
    "Use action verbs and quantify outcomes where possible.",
    "Keep formatting consistent across headings, dates and bullet points.",
    "Tailor your summary and skills to the target role.",
    "Prefer specific project outcomes over generic responsibilities."
  ];

  return {
    score,
    atsScore: Math.min(100, score + 3),
    keywordScore,
    sections,
    skills: { matched, missing, detected: resumeSkills },
    issues,
    suggestions,
    summary: "The resume has a usable foundation. Tailor it to the target role and strengthen evidence with measurable results.",
    source: "Local heuristic analyzer"
  };
}

async function extractText(file) {
  const type = file.mimetype || "";
  if (type.includes("pdf") || file.originalname.toLowerCase().endsWith(".pdf")) {
    const result = await pdfParse(file.buffer);
    return result.text;
  }
  if (
    type.includes("word") ||
    type.includes("officedocument") ||
    file.originalname.toLowerCase().endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
  throw new Error("Only PDF and DOCX files are supported.");
}

async function analyzeWithAI(resume, job) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `You are a resume analysis assistant. Analyze the supplied resume against the job description.
Return ONLY valid JSON with this shape:
{
  "score": number,
  "atsScore": number,
  "keywordScore": number,
  "sections": {"contact":number,"summary":number,"experience":number,"education":number,"skills":number,"projects":number},
  "skills": {"matched":string[],"missing":string[],"detected":string[]},
  "issues": string[],
  "suggestions": string[],
  "summary": string
}
Use 0-100 scores. Do not invent experience or skills.
RESUME:
${resume.slice(0, 30000)}
JOB DESCRIPTION:
${job.slice(0, 12000)}`;

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-6-luna",
    input: prompt
  });

  const raw = response.output_text?.trim() || "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

app.get("/api/health", (_req, res) => res.json({ ok: true, brand: "TRS Digitals" }));

app.post("/api/analyze", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Please upload a PDF or DOCX resume." });

    const resume = await extractText(req.file);
    if (!resume.trim()) return res.status(400).json({ error: "No readable text was found in the resume." });

    const job = String(req.body.jobDescription || "");
    let result = null;

    try {
      result = await analyzeWithAI(resume, job);
    } catch (error) {
      console.warn("AI analysis unavailable; using local analyzer:", error.message);
    }

    if (!result) result = analyzeLocal(resume, job);

    res.json({
      ...result,
      fileName: req.file.originalname,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Analysis failed." });
  }
});

app.listen(port, () => console.log(`TRS Digitals API running on http://localhost:${port}`));
