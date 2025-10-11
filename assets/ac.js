/* ac.js — versi sinkron dengan kasir.js */
const K_KEY = 'kasir_report_data'; // gunakan data dari kasir.js
const $ = id => document.getElementById(id);

// Target default promo & cashback
const DEFAULT_TARGETS = {
  PSM: 94, PWP: 30, SEGA: 10, SEGER: 20, CEBAN: 5,
  FIGURIN: 2, FIFA: 1, "NEW MEMBER": 2,
  "SUSU HEBAT": 2, SETUJU: 3, "HOME CARE": 2, DIAPRES: 2
};

// Ambil data laporan kasir
function loadKasirData() {
  try {
    return JSON.parse(localStorage.getItem(K_KEY)) || {};
  } catch {
    return {};
  }
}

// Hitung total jual dari seluruh jam untuk 1 promo/cashback
function sumByName(name) {
  const data = loadKasirData();
  if (!data || !data.jam) return 0;

  let total = 0;
  // Loop setiap jam dan tipe data (Promo/Cashback)
  data.jam.forEach(jam => {
    const keyPromo = `Promo_${jam}_${name}`;
    const keyCash = `Cashback_${jam}_${name}`;
    if (data[keyPromo]) total += Number(data[keyPromo]) || 0;
    if (data[keyCash]) total += Number(data[keyCash]) || 0;
  });
  return total;
}

// Buat laporan AC format teks siap kirim
function buildACReport() {
  const laporan = loadKasirData();
  const date = $('acDate').value || new Date().toISOString().slice(0, 10);
  const store = $('storeName').value || 'TRAP 1YU8';
  const shift = laporan.shift || 1;

  const promoList = ["PSM", "PWP", "SEGA", "SEGER", "CEBAN", "FIGURIN", "FIFA", "NEW MEMBER"];
  const cashbackList = ["SUSU HEBAT", "SETUJU", "HOME CARE", "DIAPRES"];

  const lines = [];
  lines.push('Semangat pagi...');
  lines.push('');
  lines.push('*Format laporan pershif* (isi targetnya / shift)');
  lines.push(`Tanggal : ${date}`);
  lines.push(`Toko : ${store}`);
  lines.push(`Shift : ${shift}`);
  lines.push('');
  lines.push('*Promo / tgt / jual / %*');

  promoList.forEach(name => {
    const tgt = DEFAULT_TARGETS[name] || 0;
    const jual = sumByName(name);
    const pct = tgt > 0 ? Math.round((jual / tgt) * 100) : 0;
    lines.push(`${name}/${tgt}/${jual}/${pct}%`);
  });

  lines.push('');
  lines.push('*Cashback / target / reedem / %*');

  cashbackList.forEach(name => {
    const tgt = DEFAULT_TARGETS[name] || 0;
    const jual = sumByName(name);
    const pct = tgt > 0 ? Math.round((jual / tgt) * 100) : 0;
    lines.push(`${name}/${tgt}/${jual}/${pct}%`);
  });

  lines.push('');
  lines.push('*KASIR LANGSUNG LAPORAN KE AC MAX JAM 15.30 dan jam 22.00 / SEBELUM KLEREK*');

  return lines.join('\n');
}

// Inisialisasi halaman
document.addEventListener('DOMContentLoaded', () => {
  $('acDate').value = new Date().toISOString().slice(0, 10);
  $('storeName').value = 'TRAP 1YU8';

  // Tombol generate laporan
  $('btnGenerateAC').onclick = () => {
    $('reportAC').textContent = buildACReport();
  };

  // Tombol copy laporan
  $('btnCopyAC').onclick = () => {
    navigator.clipboard.writeText($('reportAC').textContent)
      .then(() => alert('📋 Laporan AC disalin ke clipboard!'));
  };

  // Auto tampilkan laporan saat halaman dibuka
  $('reportAC').textContent = buildACReport();
});
