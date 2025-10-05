/* kasir.js - input per jam, nominal sales, save to localStorage, export, copy */
const K_KEY = 'kasir_report_template_v1';
const $ = id => document.getElementById(id);

const DEFAULT_SLOTS = {
  "10:00": {PWP:0, PSM:0, SG:0, SEGER:0, CEBAN:0, NEWMEMBER:0, FIGURIN:0, FIFA:0, CASHBACK:0, SALES_NOMINAL:null},
  "12:00": {PWP:0, PSM:0, SG:0, SEGER:0, CEBAN:0, NEWMEMBER:0, FIGURIN:0, FIFA:0, CASHBACK:0, SALES_NOMINAL:null},
  "15:00": {PWP:0, PSM:0, SG:0, SEGER:0, CEBAN:0, NEWMEMBER:0, FIGURIN:0, FIFA:0, CASHBACK:0, SALES_NOMINAL:0},
  "18:00": {PWP:0, PSM:0, SG:0, SEGER:0, CEBAN:0, NEWMEMBER:0, FIGURIN:0, FIFA:0, CASHBACK:0, SALES_NOMINAL:null},
  "20:00": {PWP:0, PSM:0, SG:0, SEGER:0, CEBAN:0, NEWMEMBER:0, FIGURIN:0, FIFA:0, CASHBACK:0, SALES_NOMINAL:null},
  "23:00": {PWP:0, PSM:0, SG:0, SEGER:0, CEBAN:0, NEWMEMBER:0, FIGURIN:0, FIFA:0, CASHBACK:0, SALES_NOMINAL:0}
};

let state = loadState();

// load or initialize
function loadState(){
  const raw = localStorage.getItem(K_KEY);
  if (!raw) {
    return { date: new Date().toISOString().slice(0,10), cashier:'', slots: JSON.parse(JSON.stringify(DEFAULT_SLOTS)) };
  }
  try { return JSON.parse(raw); } catch(e){ return { date: new Date().toISOString().slice(0,10), cashier:'', slots: JSON.parse(JSON.stringify(DEFAULT_SLOTS)) }; }
}

function saveState(){ localStorage.setItem(K_KEY, JSON.stringify(state)); }

// render slot inputs
function renderSlots(){
  const container = $('slots'); container.innerHTML = '';
  for (const jam of Object.keys(state.slots)){
    const slot = state.slots[jam];
    const box = document.createElement('div'); box.className='slot';
    box.innerHTML = `<h3>Jam ${jam}</h3>`;
    for (const key of Object.keys(slot)){
      const row = document.createElement('div'); row.className='row';
      const label = document.createElement('label'); label.textContent = key;
      const inc = document.createElement('button'); inc.className='btn'; inc.textContent='+';
      inc.onclick = ()=> { if (slot[key] === null) slot[key] = 0; slot[key] = Number(slot[key]||0)+1; saveState(); renderSlots(); };
      const dec = document.createElement('button'); dec.className='btn'; dec.textContent='-';
      dec.onclick = ()=> { if (slot[key] === null) slot[key]=0; slot[key] = Math.max(0, Number(slot[key]||0)-1); saveState(); renderSlots(); };
      const inp = document.createElement('input'); inp.type='number'; inp.value = slot[key]===null ? '' : slot[key]; inp.min=0;
      inp.onchange = (e)=>{ const v = e.target.value; slot[key] = v === '' ? null : Math.max(0, parseInt(v,10) || 0); saveState(); renderSlots(); };
      if (key === 'SALES_NOMINAL' && slot[key] === null){
        const span = document.createElement('span'); span.className='small'; span.textContent='(tidak berlaku)';
        row.append(label, span);
      } else {
        // format SALES_NOMINAL with placeholder
        if (key === 'SALES_NOMINAL'){ inp.placeholder='nominal (Rp)'; inp.style.width='140px'; }
        row.append(label, inc, dec, inp);
      }
      box.appendChild(row);
    }
    container.appendChild(box);
  }
  // fill cashier name
  $('cashierName').value = state.cashier || '';
}

// build shift report text
function fmtRp(n){ return n===null || n===undefined || n==='' ? '' : Number(n).toLocaleString('id-ID'); }
function buildShiftReport() {
  const name = state.cashier || '(nama kasir)';
  const s1 = ["10:00","12:00","15:00"];
  const s2 = ["18:00","20:00","23:00"];
  const lines = [];

  // fungsi bantu untuk render satu shift
  function addShift(title, jamList) {
    lines.push(`*FORMAT LAPORAN SIFT ${title.toUpperCase()} ${name.toUpperCase()}*`);
    for (const jam of jamList) {
      const s = state.slots[jam];
      if (!s) continue;
      lines.push('');
      lines.push(`*JAM ${jam.replace(':', '.')}*`);
      if (jam === "15:00" || jam === "23:00") {
        lines.push(`- SALES : ${s.SALES_NOMINAL ? fmtRp(s.SALES_NOMINAL) : ''}`);
      }
      lines.push(`- PWP (30) : ${s.PWP || 0}`);
      lines.push(`- PSM (94) : ${s.PSM || 0}`);
      lines.push(`- SG (10) : ${s.SG || 0}`);
      lines.push(`- SUEGER (20) : ${s.SEGER || 0}`);
      lines.push(`- CEBAN (5) : ${s.CEBAN || 0}`);
      lines.push(`- NEW MEMBER (2) : ${s.NEWMEMBER || 0}`);
      lines.push(`- FIGURIN (2) : ${s.FIGURIN || 0}`);
      lines.push(`- FIFA (1) : ${s.FIFA || 0}`);
      lines.push(`- CASHBACK : ${s.CASHBACK || 0}`);
    }
    lines.push('');
  }

  addShift('1', s1);
  addShift('2', s2);

  return lines.join('\n');
}

// build CSV and export
function exportCSV(){
  const rows = [['Tanggal','Kasir','Jam','PWP','PSM','SG','SEGER','CEBAN','NEW_MEMBER','FIGURIN','FIFA','CASHBACK','SALES_NOMINAL']];
  for (const jam of Object.keys(state.slots)){
    const s = state.slots[jam];
    rows.push([state.date, state.cashier, jam, s.PWP, s.PSM, s.SG, s.SEGER, s.CEBAN, s.NEWMEMBER, s.FIGURIN, s.FIFA, s.CASHBACK, s.SALES_NOMINAL===null?'':s.SALES_NOMINAL]);
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`laporan_kasir_${state.date}.csv`; a.click(); URL.revokeObjectURL(url);
}

// UI actions
function generateAndShow(){
  state.cashier = $('cashierName').value || '';
  saveState();
  $('report').textContent = buildShiftReport();
}

function resetAll(){
  if (!confirm('Reset semua data hari ini?')) return;
  state = { date: new Date().toISOString().slice(0,10), cashier:'', slots: JSON.parse(JSON.stringify(DEFAULT_SLOTS)) };
  saveState(); renderSlots(); $('report').textContent='';
  $('cashierName').value='';
}

function copyReport(){ navigator.clipboard.writeText($('report').textContent).then(()=> alert('Laporan disalin ke clipboard')); }

// init
document.addEventListener('DOMContentLoaded', ()=>{
  renderSlots();
  $('btnGenerate').onclick = ()=> generateAndShow();
  $('btnSave').onclick = ()=> { state.cashier = $('cashierName').value || ''; saveState(); alert('Data tersimpan.'); };
  $('btnReset').onclick = ()=> resetAll();
  $('btnCopyShift').onclick = ()=> copyReport();
  $('btnExportCSV').onclick = ()=> exportCSV();
  // autogenerate on load so preview visible
  generateAndShow();
});
