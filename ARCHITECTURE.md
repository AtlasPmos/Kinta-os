# Architecture Notes

KINTA-OS 10.5 is still GitHub Pages-compatible, but it is organized around the production product model:

- Project is the root record.
- Documents attach to a project and are categorized.
- Equipment records are Digital Twins.
- MEP checks attach to equipment.
- Startup status derives from MEP readiness.
- Ask KINTA checks local project memory first and asks for missing documents when knowledge is incomplete.

Future backend tables:
projects, documents, equipment, mep_checks, photos, rfis, punch_items, startup_events, warranty_events, knowledge_edges.
