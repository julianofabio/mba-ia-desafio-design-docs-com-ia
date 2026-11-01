import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const text = readFileSync(join(root, 'docs', 'TRACKER.md'), 'utf8');
const valid = new Set();
for (const l of readFileSync(join(root, 'TRANSCRICAO.md'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\[(\d\d:\d\d)\] ([^:*]+):/);
  if (m) valid.add(`[${m[1]}] ${m[2]}`);
}
const TIPOS = new Set(['Requisito Funcional', 'Requisito Não Funcional', 'Decisão', 'Restrição', 'Trade-off', 'Alternativa Descartada', 'Questão em Aberto', 'Fora de Escopo', 'Contrato', 'Erro', 'Integração', 'Risco', 'Métrica']);
let problems = 0;
const report = (m) => { problems++; console.log(m); };

const tables = text.match(/^\| ID \|/gm) ?? [];
if (tables.length !== 1) report(`tabelas: ${tables.length}`);
if (!text.includes('| ID | Documento | Tipo | Conteúdo (resumo) | Fonte | Localização |')) report('cabeçalho fora do formato');

const rows = text.split('\n').filter((l) => /^\| (ADR|RFC|FDD|PRD)-/.test(l));
const seen = new Set();
const counts = { TRANSCRICAO: 0, CODIGO: 0 };
const byDoc = {};
for (const r of rows) {
  const c = r.slice(2, -2).split(' | ');
  if (c.length !== 6) { report(`colunas (${c.length}): ${r.slice(0, 60)}`); continue; }
  const [id, doc, tipo, conteudo, fonte, loc] = c;
  if (seen.has(id)) report(`ID duplicado: ${id}`);
  seen.add(id);
  if (!existsSync(join(root, doc))) report(`documento inexistente: ${doc}`);
  else if (!readFileSync(join(root, doc), 'utf8').includes(id)) report(`${id} não está em ${doc}`);
  if (!TIPOS.has(tipo)) report(`tipo inválido em ${id}: ${tipo}`);
  if ((conteudo.match(/`/g) ?? []).length % 2) report(`crase desbalanceada em ${id}`);
  if (!conteudo.trim()) report(`conteúdo vazio em ${id}`);
  if (!(fonte in counts)) { report(`fonte inválida em ${id}: ${fonte}`); continue; }
  counts[fonte]++;
  byDoc[doc.includes('adrs') ? 'ADRs' : doc] = (byDoc[doc.includes('adrs') ? 'ADRs' : doc] ?? 0) + 1;
  for (const raw of loc.split(', ')) {
    const l = raw.replace(/`/g, '');
    if (fonte === 'TRANSCRICAO' && !valid.has(l)) report(`citação inválida em ${id}: ${l}`);
    if (fonte === 'CODIGO' && !existsSync(join(root, l))) report(`caminho inválido em ${id}: ${l}`);
  }
}
console.log(`Linhas: ${rows.length} | TRANSCRICAO: ${counts.TRANSCRICAO} (${((counts.TRANSCRICAO / rows.length) * 100).toFixed(1)}%) | CODIGO: ${counts.CODIGO}`);
console.log(JSON.stringify(byDoc));
console.log(problems ? `PROBLEMAS: ${problems}` : 'OK: nenhum problema');
