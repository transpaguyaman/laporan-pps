/* ac.js - read kasir data from localStorage (same key), compute totals vs target, render AC report */
const K_KEY = 'kasir_report_template_v1';
const $ = id => document.getElementById(id);

// default targets
const DEFAULT_TARGETS = { PSM:58, PWP:20, SEGA:6, SEGER:10, CEBAN:5, "NEW MEMBER":2, FIGURIN:1, Cashback:3 };

function loadState(){
  try { return JSON.parse(localStorage.getItem(K_KEY) || '{}'); } catch(e){ return {}; }
}
function saveTargets(targets){
  // persist only targets in a separate key
  localStorage.setItem('kasir_targets_v1', JSON.stringify(targets));
}

function loadTargets(){
  const raw = localStorage.getItem('kasir_targets_v1');
  if (!raw) return Object.assign({}, DEFAULT_TARGETS);
  try { return Object.assign({}, DEFAULT_TARGETS, JSON.parse(raw)); } catch(e){ return Object.assign({}, DEFAULT_TARGETS); }
}

// render targets UI
function renderTargetsUI(){
  const box = $('targets'); box.innerHTML = '';
  const targets = loadTargets();
  for (const key of Object.keys(targets)){
    const row = document.createElement('div'); row.className='target-row';
    const lbl = document.createElement('label'); lbl.textContent = key;
    const inp = document.createElement('input'); inp.type='number'; inp.min=0; inp.value = targets[key];
    inp.onchange = (e)=>{ targets[key] = Math.max(0, parseInt(e.target.value||0,10)); saveTargets(targets); };
    row.append(lbl, inp); box.appendChild(row);
  }
}

// compute totals from kasir data
function sumField(field){
  const st = loadState();
  if (!st || !st.slots) return 0;
  return Object.values(st.slots).reduce((acc,s)=> acc + (Number(s[field] || 0) || 0), 0);
}

function formatRp(n){ return (Number(n)||0).toLocaleString('id-ID'); }

// build AC report
function buildACReport(){
  const targets = loadTargets();
  const mapping = [
    {label:'PSM',field:'PSM'},
    {label:'PWP',field:'PWP'},
    {label:'SEGA',field:'SG'},
    {label:'SEGER',field:'SEGER'},
    {label:'CEBAN',field:'CEBAN'},
    {label:'NEW MEMBER',field:'NEWMEMBER'},
    {label:'FIGURIN',field:'FIGURIN'},
    {label:'Cashback',field:'CASHBACK'}
  ];
  const lines = [];
  const st = loadState();
  const date = $('acDate').value || (st.date || new Date().toISOString().slice(0,10));
  const store = $('storeName').value || 'TRAP 1YU8';
  lines.push('Semangat pagi...');
  lines.push('');
  lines.push('Format laporan pershif');
  lines.push(`Tanggal: ${date}`);
  lines.push(`Toko : ${store}`);
  lines.push('');
  lines.push('PROMO / TGT / AKTUAL / %');

  for (const m of mapping){
    const tgt = Number(targets[m.label] || 0);
    const actual = sumField(m.field);
    const pct = tgt>0 ? Math.round((actual / tgt) * 100) : 0;
    lines.push(`${m.label} /${tgt}/ ${actual}/ ${pct}%`);
  }

  const totalNom = sumField('SALES_NOMINAL');
  lines.push('');
  lines.push(`Total Nominal SALES (Rp): ${formatRp(totalNom)}`);
  lines.push('');
  lines.push('kasir langsung laporan ke AC MAX JAM 16.30');
  return lines.join('\n');
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderTargetsUI();
  // set default date/store
  const st = loadState(); $('acDate').value = st.date || new Date().toISOString().slice(0,10);
  $('storeName').value = 'TRAP 1YU8';
  $('btnGenerateAC').onclick = ()=> { $('reportAC').textContent = buildACReport(); };
  $('btnCopyAC').onclick = ()=> { navigator.clipboard.writeText($('reportAC').textContent).then(()=> alert('Laporan AC disalin ke clipboard')); };
  // initial render
  $('reportAC').textContent = buildACReport();
});