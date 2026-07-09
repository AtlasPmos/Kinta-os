insert into organizations (id, name) values ('00000000-0000-0000-0000-000000000001','KINTA Demo Organization') on conflict do nothing;
insert into projects (id, organization_id, name, status, health, owner, gc, metadata) values
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Wylie - Live Nation Pittsburgh','Startup / Commissioning Coordination',72,'Live Nation','PJ Dick','{"milestones":["Operational readiness 2026-08-05","Health inspection 2026-08-19"]}'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Galaxy / Angel Lagoon','ANSUL / Startup Coordination',61,null,null,'{}'),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','Waller Creek Hotel','Warranty / Turnover Support',68,null,null,'{}')
on conflict do nothing;
