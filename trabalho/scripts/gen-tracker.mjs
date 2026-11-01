import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2];
const write = process.argv[3] === '--write';
const here = dirname(fileURLToPath(import.meta.url));
const overrides = existsSync(join(here, 'tracker-overrides.json'))
  ? JSON.parse(readFileSync(join(here, 'tracker-overrides.json'), 'utf8'))
  : { sources: {}, unsourced: {} };

const valid = new Set();
for (const l of readFileSync(join(root, 'TRANSCRICAO.md'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\[(\d\d:\d\d)\] ([^:*]+):/);
  if (m) valid.add(`[${m[1]}] ${m[2]}`);
}

const CITE = /\[\d\d:\d\d\] [A-Z][a-zçã]+/g;
const PATH = /(?:src|prisma|tests)\/[\w./-]*\w|package\.json|docker-compose\.yml|vitest\.config\.ts/g;
const uniq = (a) => [...new Set(a)];
const clean = (s) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\(?`\[\d\d:\d\d\] [^`]+`(?:, `\[\d\d:\d\d\] [^`]+`)*\)?/g, '')
    .replace(/,?\s*⚠️ ?\*{0,2}INF-\d\d(?::[^|)]*)?\*{0,2}/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
    .replace(/[.,;:]$/, '');
const shorten = (s, max = 170) => {
  if (s.length <= max) return s;
  const firstStop = s.search(/[.;:] /);
  if (firstStop > 40 && firstStop <= max) return s.slice(0, firstStop);
  const cut = s.slice(0, max);
  const short = cut.slice(0, cut.lastIndexOf(' '));
  return `${short}${(short.match(/`/g) ?? []).length % 2 ? '`' : ''}…`;
};
const cells = (l) => l.split(/\s\|\s/).map((c) => c.replace(/^\|\s*/, '').replace(/\s*\|$/, '').trim());

const TYPES = [
  [/^ADR-\d{3}$/, 'Decisão'], [/^ADR-\d{3}-D-/, 'Decisão'], [/^ADR-\d{3}-ALT-/, 'Alternativa Descartada'],
  [/^RFC-COMP-/, 'Decisão'], [/^RFC-GAR-/, 'Decisão'], [/^RFC-FORA-/, 'Fora de Escopo'], [/^RFC-ALT-/, 'Alternativa Descartada'],
  [/^RFC-Q-/, 'Questão em Aberto'], [/^RFC-IMP-/, 'Integração'], [/^RFC-OP-/, 'Restrição'], [/^RFC-RISCO-/, 'Risco'],
  [/^FDD-OBJ-/, 'Métrica'], [/^FDD-FLUXO-/, 'Decisão'], [/^FDD-CONTRATO-/, 'Contrato'], [/^FDD-ERR-/, 'Erro'], [/^FDD-INT-/, 'Integração'],
  [/^FDD-DEP-/, 'Restrição'], [/^FDD-CA-/, 'Requisito Funcional'], [/^FDD-RISCO-/, 'Risco'], [/^FDD-LAC-/, 'Questão em Aberto'],
  [/^PRD-PUB-/, 'Requisito Funcional'], [/^PRD-CEN-/, 'Requisito Funcional'], [/^PRD-OBJ-/, 'Métrica'], [/^PRD-ESC-/, 'Requisito Funcional'],
  [/^PRD-FORA-/, 'Fora de Escopo'], [/^PRD-FR-/, 'Requisito Funcional'], [/^PRD-NFR-/, 'Requisito Não Funcional'], [/^PRD-DEC-/, 'Trade-off'],
  [/^PRD-DEP-/, 'Restrição'], [/^PRD-RISCO-/, 'Risco'], [/^PRD-CA-/, 'Requisito Funcional'], [/^PRD-TST-/, 'Restrição'],
];
const typeOf = (id) => TYPES.find(([re]) => re.test(id))?.[1];

const SUMMARY = {
  'ADR-D': (c) => `${c[1]}: ${c[3]}`, 'ADR-ALT': (c) => c[1], 'RFC-COMP': (c) => `${c[1]}: ${c[2]}`, 'RFC-GAR': (c) => c[1], 'RFC-FORA': (c) => c[1],
  'RFC-ALT': (c) => `${c[1]}: ${c[2]}`, 'RFC-Q': (c) => c[1], 'RFC-IMP': (c) => `${c[1]}: ${c[2]}`, 'RFC-OP': (c) => c[1], 'RFC-RISCO': (c) => c[1],
  'FDD-OBJ': (c) => `${c[1]}: ${c[2]}`, 'FDD-CONTRATO': (c) => c[1], 'FDD-ERR': (c) => `${c[1]}: ${c[3]}`, 'FDD-INT': (c) => `${c[2]}: ${c[4]}`,
  'FDD-DEP': (c) => `${c[1]}: ${c[2]}`, 'FDD-CA': (c) => `Dado ${c[1]}, então ${c[3]}`, 'FDD-RISCO': (c) => c[1], 'FDD-LAC': (c) => c[1],
  'PRD-PUB': (c) => `Público: ${c[1]}`, 'PRD-CEN': (c) => `Cenário: ${c[1]}`, 'PRD-OBJ': (c) => `${c[1]}: ${c[3]}`, 'PRD-ESC': (c) => `Escopo: ${c[1]}`,
  'PRD-FORA': (c) => `${c[1]}: ${c[2]}`, 'PRD-FR': (c) => c[1], 'PRD-NFR': (c) => `${c[1]}: ${c[2]}`, 'PRD-DEC': (c) => c[1], 'PRD-DEP': (c) => c[1],
  'PRD-RISCO': (c) => c[1], 'PRD-CA': (c) => c[1], 'PRD-TST': (c) => `${c[1]}: ${c[2]}`,
};

const items = new Map();
const add = (id, doc, content, line) => {
  if (items.has(id)) return;
  items.set(id, { id, doc, content, cites: uniq(line.match(CITE) ?? []), paths: uniq(line.match(PATH) ?? []).filter((p) => !/^(src\/worker\.ts|src\/modules\/webhooks|tests\/webhooks)/.test(p)), infs: uniq(line.match(/INF-\d\d/g) ?? []) });
};

const adrFiles = readdirSync(join(root, 'docs', 'adrs')).filter((f) => /^ADR-\d{3}-/.test(f)).sort();
const docs = [...adrFiles.map((f) => `docs/adrs/${f}`), 'docs/RFC.md', 'docs/FDD.md', 'docs/PRD.md'];
const texts = Object.fromEntries(docs.map((d) => [d, readFileSync(join(root, d), 'utf8')]));

for (const doc of docs) {
  for (const line of texts[doc].split(/\r?\n/)) {
    let m;
    if ((m = line.match(/^# (ADR-\d{3}): (.+)$/))) { add(m[1], doc, m[2], ''); continue; }
    if ((m = line.match(/^(?:- )?\*\*(ADR-\d{3}-D-\d\d):\*\* (.+)$/))) { add(m[1], doc, m[2], line); continue; }
    if ((m = line.match(/^### 4\.\d (FDD-FLUXO-\d\d): (.+)$/))) { add(m[1], doc, m[2], ''); continue; }
    if ((m = line.match(/^### (FDD-CONTRATO-\d\d): (.+)$/))) { if (!items.has(m[1])) add(m[1], doc, m[2], ''); continue; }
    if ((m = line.match(/^\| ((?:ADR-\d{3}-(?:D|ALT)|RFC-[A-Z]+|FDD-[A-Z]+|PRD-[A-Z]+)-\d\d) \|/))) {
      const c = cells(line);
      const key = m[1].startsWith('ADR') ? `ADR-${m[1].match(/-(D|ALT)-/)[1]}` : m[1].replace(/-\d\d$/, '');
      const fn = SUMMARY[key];
      if (!fn) { console.log(`sem regra de resumo: ${m[1]}`); continue; }
      add(m[1], doc, fn(c), line);
    }
  }
}

const rows = [];
const unsourced = [];
for (const it of items.values()) {
  const ov = overrides.sources[it.id];
  let cites = it.cites;
  let paths = it.paths;
  if (ov) {
    cites = uniq(ov.filter((x) => /^\[/.test(x)));
    paths = uniq(ov.filter((x) => !/^\[/.test(x)));
  }
  const wantsCode = /^(FDD-INT|RFC-IMP-04)/.test(it.id) && paths.length;
  let fonte;
  let loc;
  if (!wantsCode && cites.length) { fonte = 'TRANSCRICAO'; loc = cites.slice(0, 3); }
  else if (paths.length) { fonte = 'CODIGO'; loc = paths.slice(0, 3); }
  else { unsourced.push(it); continue; }
  it.infs = overrides.infsOnly?.[it.id] ?? uniq([...it.infs, ...(overrides.infs?.[it.id] ?? [])]).sort();
  const mark = it.infs.length ? ` (⚠️ ${it.infs.join(', ')})` : '';
  let tipo = typeOf(it.id);
  if (/^ADR-002-ALT-04|^ADR-008-ALT-02/.test(it.id)) tipo = 'Questão em Aberto';
  const summary = overrides.text?.[it.id] ?? shorten(clean(it.content));
  const capitalized = summary.charAt(0).toUpperCase() + summary.slice(1);
  rows.push({ ...it, tipo, fonte, loc, text: `${capitalized}${mark}`.replace(/\|/g, '/') });
}

if (!write) {
  console.log(`Itens: ${items.size} | sem fonte na linha: ${unsourced.length}`);
  for (const u of unsourced) console.log(`  ${u.id}: ${shorten(clean(u.content), 90)}`);
  process.exit(0);
}

// Validação
const problems = [];
for (const r of rows) {
  if (!r.tipo) problems.push(`sem tipo: ${r.id}`);
  for (const l of r.loc) {
    if (r.fonte === 'TRANSCRICAO' && !valid.has(l)) problems.push(`citação inválida em ${r.id}: ${l}`);
    if (r.fonte === 'CODIGO' && !existsSync(join(root, l))) problems.push(`caminho inexistente em ${r.id}: ${l}`);
  }
}
for (const u of unsourced) if (!overrides.unsourced[u.id]) problems.push(`sem fonte e sem justificativa: ${u.id}`);
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }

const all = new Set(Object.values(texts).flatMap((t) => t.match(/\b(?:ADR-\d{3}(?:-(?:D|ALT)-\d\d)?|(?:RFC|FDD|PRD)-[A-Z]+-\d\d)\b/g) ?? []));
const missing = [...all].filter((id) => !items.has(id));
const nT = rows.filter((r) => r.fonte === 'TRANSCRICAO').length;
const nC = rows.filter((r) => r.fonte === 'CODIGO').length;
const pct = (a, b) => `${((a / b) * 100).toFixed(1)}%`;

const inv = readFileSync(join(root, 'trabalho', 'INVENTARIO.md'), 'utf8');
const infBullets = [...inv.matchAll(/^\| (INF-\d\d) \| (.+?) \| (.+?) \| .+? \|$/gm)].map(([, id, desc, apoio]) => {
  const where = docs.filter((d) => texts[d].includes(id));
  const pending = /sem aceite/.test(desc);
  const raw = desc.replace(/^(?:Adicionada na )?Etapa \d, (?:ainda )?sem aceite: /, '').replace(/\.$/, '');
  const text = raw.charAt(0).toUpperCase() + raw.slice(1);
  return `- **${id}** (${pending ? 'sem aceite' : 'aceita em 2026-10-31'}): ${text}. Apoio: ${apoio}. Em: ${where.length ? where.join(', ') : 'nenhum documento'}.`;
});

const header = '| ID | Documento | Tipo | Conteúdo (resumo) | Fonte | Localização |\n|----|-----------|------|-------------------|-------|-------------|';
const body = rows.map((r) => `| ${r.id} | ${r.doc} | ${r.tipo} | ${r.text} | ${r.fonte} | ${r.loc.map((l) => `\`${l}\``).join(', ')} |`).join('\n');
const unsourcedBullets = unsourced.map((u) => `- **${u.id}** (${u.doc}): ${shorten(clean(u.content))}. ⚠️ ${overrides.unsourced[u.id]}`).join('\n');

const md = `# Tracker

Rastreabilidade de cada item com ID do pacote até a origem na reunião ou no código. Itens marcados com ⚠️ se apoiam em uma inferência: a localização indica o ponto de apoio, não uma decisão da reunião.

${header}
${body}

## Cobertura

Contagens obtidas por script sobre \`docs/PRD.md\`, \`docs/RFC.md\`, \`docs/FDD.md\` e \`docs/adrs/ADR-*.md\`.

- **Itens identificáveis:** ${all.size} IDs distintos nos documentos.
- **Itens com linha na tabela:** ${rows.length} de ${all.size} (${pct(rows.length, all.size)}). Meta: ≥ 80%.
- **Linhas com Fonte = TRANSCRICAO e timestamp válido:** ${nT} de ${rows.length} (${pct(nT, rows.length)}). Meta: ≥ 70%.
- **Linhas com Fonte = CODIGO e caminho existente:** ${nC}. Meta: ≥ 5.
- **IDs citados sem definição:** ${missing.length ? missing.join(', ') : 'nenhum'}.
- **Linhas com ⚠️:** ${rows.filter((r) => r.infs.length).length}.

**Limites desta contagem:** as seções de trade-off e as consequências dos ADRs não têm ID próprio, então não têm linha; os trade-offs aparecem em \`PRD-DEC-01\` a \`08\`. A lista de tipos não tem categoria para público, cenário, escopo e critério de aceite, que entram como Requisito Funcional. Fluxos e componentes entram como Decisão; dependências e etapas de validação, como Restrição. Duas alternativas adiadas nos ADRs, \`ADR-002-ALT-04\` e \`ADR-008-ALT-02\`, entram como Questão em Aberto. A contagem cobre só itens com ID: as regras de campo do FDD (seção 5), as linhas de resiliência (seção 8), as métricas e os logs (seção 9) e a tabela de arquivos novos não têm ID nem linha.

**Lacunas identificadas na elaboração:** \`RFC-Q-07\` a \`RFC-Q-09\`, \`RFC-Q-12\`, \`FDD-LAC-01\` a \`FDD-LAC-03\`, \`RFC-RISCO-01\`, \`PRD-RISCO-05\` e \`FDD-RISCO-02\` não foram discutidos na reunião. A localização delas aponta para a fala que definiu o comportamento relacionado, por exemplo o replay em \`[09:18] Diego\`, e não para uma discussão da lacuna. O mesmo vale para \`PRD-DEP-06\`, que agrupa as lacunas.

### Itens sem fonte

Só contém itens marcados com ⚠️: surgiram na elaboração, sem fala nem arquivo que os sustente diretamente.

${unsourcedBullets}

### Inferências (sem fonte direta)

Nenhuma foi decidida na reunião.

${infBullets.join('\n')}
`;
writeFileSync(join(root, 'docs', 'TRACKER.md'), md);
console.log(`Linhas: ${rows.length} de ${all.size} (${pct(rows.length, all.size)}) | TRANSCRICAO: ${nT} (${pct(nT, rows.length)}) | CODIGO: ${nC} | sem fonte: ${unsourced.length} | IDs sem definição: ${missing.length ? missing.join(', ') : 'nenhum'} | INF: ${infBullets.length}`);
