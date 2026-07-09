import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 8080;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

const db = {
  projects: [
    {
      id: 'wylie-live-nation',
      name: 'Wylie - Live Nation Pittsburgh',
      status: 'Startup / Commissioning Coordination',
      health: 72,
      owner: 'Live Nation',
      gc: 'PJ Dick',
      milestones: [
        'Bar deliveries 7/13-7/15/2026',
        'Level 3 kitchen ready by end of 7/18/2026',
        'Level 2 bars set by end of 7/24/2026',
        'Operational readiness target 8/5/2026',
        'Health inspection 8/19/2026'
      ],
      risks: [
        'Accurex hood commissioning checklist required before technician scheduling',
        'ANSUL final depends on hood commissioning and Fire Marshal sequence',
        'Bova must return to complete equipment setting and walk-in panels',
        'MEP contractors need direct coordination with Bova for connection parts'
      ]
    },
    {
      id: 'galaxy',
      name: 'Galaxy / Angel Lagoon',
      status: 'ANSUL / Startup Coordination',
      health: 61,
      milestones: ['Trade coordination meeting', 'ANSUL install estimated one day after architect response'],
      risks: ['ANSUL held pending architect response to Fire Marshal questions']
    },
    {
      id: 'waller-creek',
      name: 'Waller Creek Hotel',
      status: 'Warranty / Turnover Support',
      health: 68,
      milestones: ['Punch items walked', 'Owner training / stock phase'],
      risks: ['Owner disputes final acceptance', 'Warranty calls need ASA routing and contract clarity']
    }
  ],
  equipment: [
    {
      id: 'eq-hood-accurex-01', projectId: 'wylie-live-nation', item: 'Hood System', manufacturer: 'Accurex', model: 'Control Panel / Hood Package', room: 'Level 3 Kitchen',
      startup: 'Blocked - checklist required', delivery: 'Installed', warranty: 'Pending turnover',
      utilities: { electric: 'Needed', gas: 'N/A', water: 'N/A', drain: 'N/A', vent: 'Verified', ansul: 'Missing/Unknown' },
      notes: ['Complete Accurex commissioning checklist', 'Confirm hood power, MUA, exhaust, shunt, and ANSUL bottles']
    },
    {
      id: 'eq-walkin-01', projectId: 'wylie-live-nation', item: 'Walk-in Cooler/Freezer', manufacturer: 'TBD', model: 'Project Package', room: 'Level 3 Kitchen',
      startup: 'Blocked - panels/MEP coordination', delivery: 'Partially installed', warranty: 'Pending startup',
      utilities: { electric: 'Needed', gas: 'N/A', water: 'N/A', drain: 'Needed', vent: 'N/A', refrigeration: 'Needed' },
      notes: ['Bova to complete walk-in panels', 'Fazio refrigeration startup depends on MEP completion']
    },
    {
      id: 'eq-ice-01', projectId: 'wylie-live-nation', item: 'Ice Machines', manufacturer: 'TBD', model: 'Level 2 Bars', room: 'Level 2 Bars',
      startup: 'Pending MEP', delivery: 'Set target 7/24/2026', warranty: 'Pending startup',
      utilities: { electric: 'Needed', water: 'Needed', drain: 'Needed', refrigeration: 'Unknown' },
      notes: ['Set in place target 7/24; startup depends on MEP readiness']
    }
  ],
  actions: [
    { id: 'a1', projectId: 'wylie-live-nation', priority: 'High', title: 'Return completed Accurex commissioning checklist', owner: 'TriMark / GC coordination', status: 'Open' },
    { id: 'a2', projectId: 'wylie-live-nation', priority: 'High', title: 'Confirm ANSUL bottle location and Fire Marshal sequence', owner: 'Summit / GC / Mechanical', status: 'Open' },
    { id: 'a3', projectId: 'galaxy', priority: 'High', title: 'Get architect response to Fire Marshal ANSUL questions', owner: 'GC / Architect', status: 'Open' }
  ],
  documents: [],
  audit: []
};

function audit(type, message, payload = {}) {
  db.audit.unshift({ id: uuid(), type, message, payload, at: new Date().toISOString() });
}

function buildContext(projectId = 'wylie-live-nation') {
  const project = db.projects.find(p => p.id === projectId) || db.projects[0];
  const equipment = db.equipment.filter(e => e.projectId === project.id);
  const actions = db.actions.filter(a => a.projectId === project.id);
  const docs = db.documents.filter(d => d.projectId === project.id);
  return { project, equipment, actions, docs };
}

function localKintaAnswer(question, projectId) {
  const { project, equipment, actions } = buildContext(projectId);
  const blockers = [...project.risks, ...equipment.filter(e => String(e.startup).toLowerCase().includes('blocked')).map(e => `${e.item}: ${e.startup}`)];
  return {
    answer: `For ${project.name}, the main focus is ${project.status}. The current project health is ${project.health}%. The biggest blockers are: ${blockers.join('; ')}. Recommended next step: close the highest-priority startup blockers first, especially Accurex checklist, ANSUL sequence, and MEP verification before committing startup dates.`,
    recommendations: actions.map(a => `${a.priority}: ${a.title} (${a.owner})`),
    citations: ['Seeded project memory', 'Equipment DNA records', 'Action Center'],
    mode: 'local-fallback'
  };
}

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'KINTA Enterprise API', ai: Boolean(openai), time: new Date().toISOString() }));
app.get('/api/projects', (req, res) => res.json(db.projects));
app.get('/api/projects/:id/brain', (req, res) => res.json(buildContext(req.params.id)));
app.get('/api/audit', (req, res) => res.json(db.audit.slice(0, 100)));

app.post('/api/equipment', (req, res) => {
  const item = { id: uuid(), ...req.body, updatedAt: new Date().toISOString() };
  db.equipment.push(item);
  audit('equipment.created', `Created equipment ${item.item || item.id}`, item);
  res.json(item);
});

app.put('/api/equipment/:id', (req, res) => {
  const idx = db.equipment.findIndex(e => e.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Equipment not found' });
  db.equipment[idx] = { ...db.equipment[idx], ...req.body, updatedAt: new Date().toISOString() };
  audit('equipment.updated', `Updated equipment ${db.equipment[idx].item}`, db.equipment[idx]);
  res.json(db.equipment[idx]);
});

app.post('/api/actions', (req, res) => {
  const action = { id: uuid(), status: 'Open', ...req.body };
  db.actions.unshift(action);
  audit('action.created', `Created action ${action.title}`, action);
  res.json(action);
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  const doc = {
    id: uuid(),
    projectId: req.body.projectId || 'wylie-live-nation',
    filename: req.file?.originalname || 'manual-entry.txt',
    type: req.body.type || 'Unclassified',
    size: req.file?.size || 0,
    linkedEquipmentId: req.body.linkedEquipmentId || null,
    uploadedAt: new Date().toISOString(),
    summary: req.body.summary || 'Document uploaded for future indexing.'
  };
  db.documents.unshift(doc);
  audit('document.uploaded', `Uploaded ${doc.filename}`, doc);
  res.json(doc);
});

app.post('/api/ask', async (req, res) => {
  const { question, projectId = 'wylie-live-nation' } = req.body;
  const context = buildContext(projectId);
  if (!openai) return res.json(localKintaAnswer(question, projectId));
  try {
    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: 'You are KINTA, a commercial kitchen PM operating system. Answer from project context, give actions, cite sources, and say what is missing.' },
        { role: 'user', content: `Project context: ${JSON.stringify(context)}\n\nQuestion: ${question}` }
      ]
    });
    audit('ai.ask', `Ask KINTA: ${question}`, { projectId });
    res.json({ answer: response.output_text, mode: 'live-ai', citations: ['Project database context'] });
  } catch (err) {
    res.json({ ...localKintaAnswer(question, projectId), warning: err.message });
  }
});

app.post('/api/brief', (req, res) => {
  const { projectId = 'wylie-live-nation' } = req.body;
  const { project, equipment, actions } = buildContext(projectId);
  const blocked = equipment.filter(e => String(e.startup).toLowerCase().includes('blocked') || Object.values(e.utilities || {}).includes('Needed'));
  res.json({
    title: `${project.name} Daily Brief`,
    health: project.health,
    status: project.status,
    priorities: actions.filter(a => a.status === 'Open').slice(0, 5),
    blockers: blocked.map(e => ({ item: e.item, startup: e.startup, utilities: e.utilities })),
    recommendedEmail: `Team,\n\nCurrent focus is startup readiness for ${project.name}. The priority blockers remain MEP verification, startup checklist completion, and trade coordination. Please confirm responsible-party status today so we can protect the readiness milestones.\n\nThanks,\nRick`
  });
});

app.listen(port, () => console.log(`KINTA API running on ${port}`));
