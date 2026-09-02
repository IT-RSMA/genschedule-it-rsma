"use client";

import { useState } from "react";
import { Calendar, Printer, Shield, Wifi } from "lucide-react";

// Data Tim SIMRS & Jaringan
const simrsMembers = [
  { name: "Viviani Rosmala Dewi", phone: "082340650647" },
  { name: "Anna Mawaddah", phone: "085337262947" },
  { name: "Riskia Annisa", phone: "082341959185" },
  { name: "Bagus Risqi Martono", phone: "081339668877" },
  { name: "Muhammad Dhafa Maulana", phone: "087855893156" },
  { name: "Muhammad Athallariq Wiratama", phone: "082342134354" },
];

const jaringanMembers = [
  { name: "Ivandi Shaputra", phone: "0818242029" },
  { name: "Andi Ardiansyah", phone: "082340110248" },
  { name: "Sahipuddin", phone: "081723376675" },
  { name: "Imanollah", phone: "087754339509" },
];

const dayInitials = ["M", "S", "S", "R", "K", "J", "S"]; // 0: Miu, 1: Sen, 2: Sel, 3: Rab, 4: Kam, 5: Jum, 6: Sab

export default function ScheduleMatrixPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-10");

  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const daysInMonth = new Date(year, month, 0).getDate();

  // Membangun struktur data tanggal
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(year, month - 1, dayNum);
    const dayOfWeek = dateObj.getDay(); // 0: Sunday, 6: Saturday
    return {
      dayNum,
      dayOfWeek,
      initial: dayInitials[dayOfWeek],
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
      isFriday: dayOfWeek === 5,
    };
  });

  // Generasi Jadwal berdasarkan Logika
  let simrsPiketIdx = 0;
  let jarPiketIdx = 0;
  let simrsPJIdx = 0;
  let jarPJIdx = 0;

  // Struktur penampung: scheduleMap[nama][tgl] = 'P' | 'L' | 'A'
  const scheduleMap = {};
  [...simrsMembers, ...jaringanMembers].forEach((m) => {
    scheduleMap[m.name] = {};
  });

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();

    // 1. Shift PJ Malam Standby (Setiap hari)
    const pjS = simrsMembers[simrsPJIdx % simrsMembers.length].name;
    const pjJ = jaringanMembers[jarPJIdx % jaringanMembers.length].name;
    scheduleMap[pjS][d] = "A";
    scheduleMap[pjJ][d] = "A";
    simrsPJIdx++;
    jarPJIdx++;

    // 2. Piket Sabtu & Libur Jumat Kompensasi
    if (dayOfWeek === 6) { // Sabtu
      const pS = simrsMembers[simrsPiketIdx % simrsMembers.length].name;
      const pJ = jaringanMembers[jarPiketIdx % jaringanMembers.length].name;
      simrsPiketIdx++;
      jarPiketIdx++;

      scheduleMap[pS][d] = "P";
      scheduleMap[pJ][d] = "P";

      if (d > 1) { // Libur Jumat Sebelumnya
        scheduleMap[pS][d - 1] = "L";
        scheduleMap[pJ][d - 1] = "L";
      }
    }
  }

  // Menghitung Total Shift per Anggota
  const getTotals = (memberName) => {
    let pCount = 0;
    let aCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const code = scheduleMap[memberName][d];
      if (code === "P") pCount++;
      if (code === "A") aCount++;
    }
    return { pCount, aCount };
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12 print:bg-white print:pb-0">
      {/* Dynamic Print CSS untuk A4 Landscape */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          main {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Navbar Upper Controls */}
      <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Calendar className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Jadwal IT RSMA</h1>
              <p className="text-xs text-emerald-200">Laporan Penjadwalan Matriks Bulanan</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-emerald-950 border border-emerald-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            />
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-4 py-2 rounded-lg transition-all text-sm shadow cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF Matrix</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[98%] mx-auto py-6 print:py-0">
        {/* Header Dokumen Laporan (Tampil di PDF) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-200 mb-4 print:shadow-none print:border-none print:p-0 print:mb-2">
          <div className="flex justify-between items-end border-b border-emerald-800/20 pb-3 print:pb-1">
            <div>
              <h1 className="text-xl font-extrabold text-emerald-950 tracking-wide print:text-base">
                JADWAL KERJA, PIKET & LIBUR IT RSMA
              </h1>
              <p className="text-xs text-emerald-700 font-medium print:text-[9px]">
                Periode Bulan: <span className="font-bold">{selectedMonth}</span> | Jam Operasional Reguler: Senin - Jumat (07:00 - 16:00 WITA)
              </p>
            </div>

            {/* Keterangan / Simbol Legend Hijau Modern */}
            <div className="flex items-center space-x-3 text-xs print:text-[8px]">
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-5 h-5 bg-yellow-500 text-white flex items-center justify-center rounded font-bold text-[10px] print:w-3.5 print:h-3.5 print:text-[7px]">P</span>
                <span>Piket Sabtu</span>
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-5 h-5 bg-rose-500 text-white flex items-center justify-center rounded font-bold text-[10px] print:w-3.5 print:h-3.5 print:text-[7px]">L</span>
                <span>Libur Jumat</span>
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-5 h-5 bg-emerald-600 text-white flex items-center justify-center rounded font-bold text-[10px] print:w-3.5 print:h-3.5 print:text-[7px]">A</span>
                <span>ON Call</span>
              </span>
            </div>
          </div>
        </div>

        {/* Matriks Tabel Utama */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden print:border-slate-300">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-[11px] print:text-[8px]">
              <thead>
                {/* Baris Angka Tanggal (1-31) */}
                <tr className="bg-emerald-950 text-white">
                  <th className="p-1.5 text-left pl-3 font-semibold w-48 border-r border-emerald-800 print:w-36 print:p-1">
                    Nama Petugas
                  </th>
                  {daysArray.map((d) => (
                    <th
                      key={d.dayNum}
                      className={`p-1 border-r border-emerald-800/50 font-bold ${
                        d.isSunday ? "bg-rose-900 text-rose-200" : ""
                      }`}
                    >
                      {d.dayNum}
                    </th>
                  ))}
                  <th colSpan={2} className="p-1 font-bold bg-emerald-900 border-l border-emerald-800">
                    Total
                  </th>
                </tr>

                {/* Baris Inisial Hari (S, M, S, R, K, J, S) */}
                <tr className="bg-emerald-800 text-emerald-100 border-b border-emerald-700">
                  <th className="p-1 text-left pl-3 font-normal text-[10px] border-r border-emerald-700 print:text-[7px]">
                    Hari
                  </th>
                  {daysArray.map((d) => (
                    <th
                      key={d.dayNum}
                      className={`p-0.5 border-r border-emerald-700 font-semibold ${
                        d.isSunday ? "text-rose-300 bg-rose-950/40" : ""
                      }`}
                    >
                      {d.initial}
                    </th>
                  ))}
                  <th className="p-0.5 font-bold text-[9px] w-6 bg-emerald-850 border-l border-emerald-700">P</th>
                  <th className="p-0.5 font-bold text-[9px] w-6 bg-emerald-850">A</th>
                </tr>
              </thead>

              <tbody>
                {/* --- SEKSI TIM SIMRS --- */}
                <tr className="bg-emerald-100/70 text-emerald-950 font-bold text-left border-y border-emerald-200">
                  <td colSpan={daysInMonth + 3} className="px-3 py-1 text-[10px] tracking-wider print:py-0.5 print:text-[8px]">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-700 no-print" /> TIM SIMRS
                    </span>
                  </td>
                </tr>
                {simrsMembers.map((m, idx) => {
                  const totals = getTotals(m.name);
                  return (
                    <tr
                      key={m.name}
                      className={`border-b border-slate-200 hover:bg-emerald-50/50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      <td className="p-1 text-left pl-3 font-medium text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {m.name}
                      </td>
                      {daysArray.map((d) => {
                        const code = scheduleMap[m.name][d.dayNum];
                        return (
                          <td
                            key={d.dayNum}
                            className={`p-0.5 border-r border-slate-200/80 ${
                              d.isSunday ? "bg-rose-50/40" : ""
                            }`}
                          >
                            {code === "P" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-white font-bold rounded text-[10px] shadow-sm print:w-3.5 print:h-3.5 print:text-[7px]">
                                P
                              </span>
                            )}
                            {code === "L" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-500 text-white font-bold rounded text-[10px] shadow-sm print:w-3.5 print:h-3.5 print:text-[7px]">
                                L
                              </span>
                            )}
                            {code === "A" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-600 text-white font-bold rounded text-[10px] shadow-sm print:w-3.5 print:h-3.5 print:text-[7px]">
                                A
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-1 font-bold text-emerald-800 bg-emerald-50/50 border-l border-slate-200">{totals.pCount}</td>
                      <td className="p-1 font-bold text-teal-800 bg-teal-50/50">{totals.aCount}</td>
                    </tr>
                  );
                })}

                {/* --- SEKSI TIM JARINGAN --- */}
                <tr className="bg-teal-100/70 text-teal-950 font-bold text-left border-y border-teal-200">
                  <td colSpan={daysInMonth + 3} className="px-3 py-1 text-[10px] tracking-wider print:py-0.5 print:text-[8px]">
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-teal-700 no-print" /> TIM JARINGAN
                    </span>
                  </td>
                </tr>
                {jaringanMembers.map((m, idx) => {
                  const totals = getTotals(m.name);
                  return (
                    <tr
                      key={m.name}
                      className={`border-b border-slate-200 hover:bg-teal-50/50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      <td className="p-1 text-left pl-3 font-medium text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {m.name}
                      </td>
                      {daysArray.map((d) => {
                        const code = scheduleMap[m.name][d.dayNum];
                        return (
                          <td
                            key={d.dayNum}
                            className={`p-0.5 border-r border-slate-200/80 ${
                              d.isSunday ? "bg-rose-50/40" : ""
                            }`}
                          >
                            {code === "P" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-white font-bold rounded text-[10px] shadow-sm print:w-3.5 print:h-3.5 print:text-[7px]">
                                P
                              </span>
                            )}
                            {code === "L" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-500 text-white font-bold rounded text-[10px] shadow-sm print:w-3.5 print:h-3.5 print:text-[7px]">
                                L
                              </span>
                            )}
                            {code === "A" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-600 text-white font-bold rounded text-[10px] shadow-sm print:w-3.5 print:h-3.5 print:text-[7px]">
                                A
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-1 font-bold text-emerald-800 bg-emerald-50/50 border-l border-slate-200">{totals.pCount}</td>
                      <td className="p-1 font-bold text-teal-800 bg-teal-50/50">{totals.aCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Catatan / Keterangan Tambahan */}
        <div className="mt-4 p-3 bg-white border border-emerald-200 rounded-xl text-base text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-2 print:mt-2 print:p-1.5 print:text-[8px] print:rounded-lg">
          <div><b className="text-yellow-500">P = Piket Sabtu:</b> Bertugas jam 07:00 - 16:00 WITA</div>
          <div><b className="text-rose-700">L = Libur Jumat:</b> Piket Sabtu</div>
          <div><b className="text-emerald-600">A = PJ:</b> On-call jam 16:00 - 07:00 WITA</div>
        </div>
      </main>
    </div>
  );
}