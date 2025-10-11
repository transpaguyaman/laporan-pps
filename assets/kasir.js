/* kasir.js - versi sinkron dengan HTML laporan-kasir.html */

const K_KEY = 'kasir_report_data';

// Data default laporan
const defaultReport = {
  shift: 1,
  kasir: '',
  jam: ['10.00', '12.00', '15.00', '18.00', '20.00', '23.00'],
  promo: [
    { nama: 'PWP', tgt: 30 },
    { nama: 'PSM', tgt: 94 },
    { nama: 'SEGA', tgt: 10 },
    { nama: 'CEBAN', tgt: 5 },
    { nama: 'SUEGER', tgt: 20 },
    { nama: 'NEW MEMBER', tgt: 2 },
    { nama: 'FIGURIN', tgt: 2 },
    { nama: 'FIFA', tgt: 1 }
  ],
  cashback: [
    { nama: 'SUSU HEBAT', tgt: 2 },
    { nama: 'SETUJU', tgt: 3 },
    { nama: 'HOME CARE', tgt: 2 },
    { nama: 'DIAPRES', tgt: 2 }
  ]
};

let laporan = JSON.parse(localStorage.getItem(K_KEY)) || defaultReport;

// Inisialisasi halaman
document.addEventListener('DOMContentLoaded', () => {
  renderForm();
  updatePreview();

  document.getElementById('saveReport').addEventListener('click', saveReport);
  document.getElementById('exportText').addEventListener('click', exportText);
  document.getElementById('clearData').addEventListener('click', clearData);
  document.getElementById('btnCopyShift').addEventListener('click', copyPreview);
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);

  document.getElementById('kasirName').value = laporan.kasir || '';
  document.getElementById('shiftNum').value = laporan.shift || 1;
});

// Render form laporan ke dalam #slots
function renderForm() {
  const container = document.getElementById('slots');
  container.innerHTML = '';

  laporan.jam.forEach(jam => {
    const section = document.createElement('section');
    section.className = 'jam-section card-inner';
    section.innerHTML = `<h3>🕒 JAM ${jam}</h3>`;

    // PROMO section
    const promoTitle = document.createElement('h4');
    promoTitle.textContent = '🎯 PROMO / TARGET / JUAL / %';
    section.appendChild(promoTitle);
    section.appendChild(makeTable(laporan.promo, jam, 'Promo'));

    // CASHBACK section
    section.appendChild(document.createElement('hr'));
    const cashTitle = document.createElement('h4');
    cashTitle.textContent = '💰 CASHBACK';
    section.appendChild(cashTitle);
    section.appendChild(makeTable(laporan.cashback, jam, 'Cashback'));

    container.appendChild(section);
  });
}

// Buat tabel input tambah/kurang
function makeTable(items, jam, tipe) {
  const table = document.createElement('table');
  table.className = 'laporan-table';
  const tbody = document.createElement('tbody');

  items.forEach(item => {
    const row = document.createElement('tr');
    const key = `${tipe}_${jam}_${item.nama}`;
    const value = laporan[key] || 0;

    row.innerHTML = `
      <td>${item.nama} (${item.tgt})</td>
      <td class="count-cell">
        <button class="minus" onclick="changeValue('${key}', -1)">−</button>
        <span id="${key}" class="count">${value}</span>
        <button class="plus" onclick="changeValue('${key}', 1)">+</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

// Tombol tambah/kurang
function changeValue(key, delta) {
  const current = laporan[key] || 0;
  laporan[key] = Math.max(0, current + delta);
  document.getElementById(key).textContent = laporan[key];
  localStorage.setItem(K_KEY, JSON.stringify(laporan));
  updatePreview();
}

// Simpan laporan
function saveReport() {
  laporan.kasir = document.getElementById('kasirName').value || 'Tanpa Nama';
  laporan.shift = document.getElementById('shiftNum').value || 1;
  localStorage.setItem(K_KEY, JSON.stringify(laporan));
  alert('✅ Laporan kasir disimpan!');
  updatePreview();
}

// Buat teks laporan (tanpa salin otomatis)
function generateReportText() {
  const lines = [];
  lines.push(`*FORMAT LAPORAN SHIFT ${laporan.shift} ${laporan.kasir.toUpperCase()}*`);

  laporan.jam.forEach(jam => {
    lines.push(`\n*JAM ${jam}*`);
    laporan.promo.forEach(p => {
      const key = `Promo_${jam}_${p.nama}`;
      lines.push(`- ${p.nama} (${p.tgt}) : ${laporan[key] || 0}`);
    });
    lines.push('');
    lines.push('*CASHBACK*');
    laporan.cashback.forEach(c => {
      const key = `Cashback_${jam}_${c.nama}`;
      lines.push(`- ${c.nama} (${c.tgt}) : ${laporan[key] || 0}`);
    });
  });

  return lines.join('\n');
}

// Update preview laporan di bawah
function updatePreview() {
  document.getElementById('report').textContent = generateReportText();
}

// Tombol “Salin Laporan”
function exportText() {
  const text = generateReportText();
  navigator.clipboard.writeText(text);
  alert('📋 Laporan kasir telah disalin ke clipboard!');
}

// Tombol “Copy Laporan Shift” (di preview)
function copyPreview() {
  const text = document.getElementById('report').textContent;
  navigator.clipboard.writeText(text);
  alert('📄 Laporan shift telah disalin!');
}

// Export ke CSV
function exportCSV() {
  let csv = 'JAM,TIPE,PROMO/CASHBACK,TARGET,JUAL\n';
  laporan.jam.forEach(jam => {
    laporan.promo.forEach(p => {
      const key = `Promo_${jam}_${p.nama}`;
      csv += `${jam},Promo,${p.nama},${p.tgt},${laporan[key] || 0}\n`;
    });
    laporan.cashback.forEach(c => {
      const key = `Cashback_${jam}_${c.nama}`;
      csv += `${jam},Cashback,${c.nama},${c.tgt},${laporan[key] || 0}\n`;
    });
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan_shift${laporan.shift}_${laporan.kasir}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Hapus semua data
function clearData() {
  if (confirm('Yakin ingin hapus semua data laporan kasir?')) {
    localStorage.removeItem(K_KEY);
    laporan = JSON.parse(JSON.stringify(defaultReport));
    renderForm();
    updatePreview();
  }
}
