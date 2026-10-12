"use client";

import { useState, useEffect } from "react";
import { Calendar, Printer, Shield, Wifi, RotateCcw, Edit3 } from "lucide-react";

// Data Tim SIMRS (Dipisah Pria & Wanita)
const simrsMaleMembers = [
  { name: "Muhammad Athallariq Wiratama", phone: "082342134354" },
  { name: "Bagus Risqi Martono", phone: "081339668877" },
  { name: "Muhammad Dhafa Maulana", phone: "087855893156" },
];

const simrsFemaleMembers = [
  { name: "Viviani Rosmala Dewi", phone: "082340650647" },
  { name: "Anna Mawaddah", phone: "085337262947" },
  { name: "Riskia Annisa", phone: "082341959185" },
];

const simrsMembers = [...simrsFemaleMembers, ...simrsMaleMembers];

// Data Tim Jaringan
const jaringanMembers = [
  { name: "Ivandi Shaputra", phone: "0818242029" }, // Kepala Ruangan
  { name: "Imanollah", phone: "087754339509" },
  { name: "Andi Ardiansyah", phone: "082340110248" },
  { name: "Sahipuddin", phone: "081723376675" },
];

const jaringanPiketMembers = jaringanMembers.filter(
  (m) => m.name !== "Ivandi Shaputra"
);

const dayInitials = ["M", "S", "S", "R", "K", "J", "S"];

export default function ScheduleMatrix() {
  const [selectedMonth, setSelectedMonth] = useState("2026-10");
  const [customSchedule, setCustomSchedule] = useState({});

  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const daysInMonth = new Date(year, month, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(year, month - 1, dayNum);
    const dayOfWeek = dateObj.getDay();
    return {
      dayNum,
      dayOfWeek,
      initial: dayInitials[dayOfWeek],
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
      isFriday: dayOfWeek === 5,
    };
  });

  // Fungsi Generasi Jadwal Otomatis
  const generateAutoSchedule = () => {
    let simrsPiketIdx = 0;
    let jarPiketIdx = 0;
    let simrsPJIdx = 0;
    let jarPJIdx = 0;

    const scheduleMap = {};
    const piketDutyMembers = new Set();

    [...simrsMembers, ...jaringanMembers].forEach((m) => {
      scheduleMap[m.name] = {};
    });

    // STEP 1: Plot Piket Sabtu & Libur Jumat
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();

      if (dayOfWeek === 6) {
        const pS = simrsMaleMembers[simrsPiketIdx % simrsMaleMembers.length].name;
        const pJ = jaringanPiketMembers[jarPiketIdx % jaringanPiketMembers.length].name;

        simrsPiketIdx++;
        jarPiketIdx++;

        scheduleMap[pS][d] = "P";
        scheduleMap[pJ][d] = "P";

        if (d > 1) {
          scheduleMap[pS][d - 1] = "L";
          scheduleMap[pJ][d - 1] = "L";
        }

        piketDutyMembers.add(`${pS}_${d - 1}`);
        piketDutyMembers.add(`${pS}_${d}`);
        piketDutyMembers.add(`${pS}_${d + 1}`);

        piketDutyMembers.add(`${pJ}_${d - 1}`);
        piketDutyMembers.add(`${pJ}_${d}`);
        piketDutyMembers.add(`${pJ}_${d + 1}`);
      }
    }

    // STEP 2: Plot On Call Standby (A)
    for (let d = 1; d <= daysInMonth; d++) {
      // TIM SIMRS
      for (let attempts = 0; attempts < simrsMembers.length; attempts++) {
        const candidateIndex = (simrsPJIdx + attempts) % simrsMembers.length;
        const candidateName = simrsMembers[candidateIndex].name;

        const isProtected = piketDutyMembers.has(`${candidateName}_${d}`);
        const hasExistingStatus = scheduleMap[candidateName][d];

        if (!hasExistingStatus && !isProtected) {
          scheduleMap[candidateName][d] = "A";
          simrsPJIdx = candidateIndex + 1;
          break;
        }
      }

      // TIM JARINGAN
      if (d === 1) {
        scheduleMap["Imanollah"][d] = "A";
        const idxAndi = jaringanMembers.findIndex((m) => m.name === "Andi Ardiansyah");
        jarPJIdx = idxAndi;
      } else if (d === 2) {
        scheduleMap["Ivandi Shaputra"][d] = "A";
      } else {
        for (let attempts = 0; attempts < jaringanMembers.length; attempts++) {
          const candidateIndex = (jarPJIdx + attempts) % jaringanMembers.length;
          const candidateName = jaringanMembers[candidateIndex].name;

          const isProtected = piketDutyMembers.has(`${candidateName}_${d}`);
          const hasExistingStatus = scheduleMap[candidateName][d];

          if (!hasExistingStatus && !isProtected) {
            scheduleMap[candidateName][d] = "A";
            jarPJIdx = candidateIndex + 1;
            break;
          }
        }
      }
    }

    return scheduleMap;
  };

  // Generate ulang ketika bulan berubah
  useEffect(() => {
    setCustomSchedule(generateAutoSchedule());
  }, [selectedMonth]);

  // Handler untuk mengubah shift saat sel diklik (Siklus: Kosong -> A -> P -> L -> Kosong)
  const handleCellClick = (memberName, dayNum) => {
    const currentCode = customSchedule[memberName]?.[dayNum] || "";
    let nextCode = "";

    if (currentCode === "") nextCode = "A";
    else if (currentCode === "A") nextCode = "P";
    else if (currentCode === "P") nextCode = "L";
    else nextCode = "";

    setCustomSchedule((prev) => ({
      ...prev,
      [memberName]: {
        ...prev[memberName],
        [dayNum]: nextCode,
      },
    }));
  };

  // Hitung Total
  const getTotals = (memberName) => {
    let pCount = 0;
    let aCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const code = customSchedule[memberName]?.[d];
      if (code === "P") pCount++;
      if (code === "A") aCount++;
    }
    return { pCount, aCount };
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12 print:bg-white print:pb-0">
      {/* Header Controls */}
      <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Calendar className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Jadwal IT RSMA</h1>
              <p className="text-xs text-emerald-200">Mode Interaktif: Klik Sel untuk Mengubah Shift</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCustomSchedule(generateAutoSchedule())}
              className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Reset ke Jadwal Otomatis"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Otomatis</span>
            </button>

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
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[98%] mx-auto py-6 print:py-0">
        {/* Banner Instruksi Edit */}
        {/* <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2 rounded-lg mb-3 text-xs flex items-center justify-between no-print shadow-sm">
          <span className="flex items-center gap-2 font-medium">
            <Edit3 className="w-4 h-4 text-emerald-700" />
            <b>Petunjuk Edit Manual:</b> Klik pada kotak sel mana saja untuk mengganti status:
            <span className="font-bold text-emerald-800">[Kosong] → A (On Call) → P (Piket) → L (Libur) → [Kosong]</span>
          </span>
        </div> */}

        {/* Dokumen Header */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-200 mb-4 print:shadow-none print:border-none print:p-0 print:mb-2">
          <div className="flex justify-between items-end border-b border-emerald-800/20 pb-3 print:pb-1">
            <div>
              <h1 className="text-xl font-extrabold text-emerald-950 tracking-wide print:text-base">
                JADWAL KERJA, PIKET & LIBUR IT RSMA
              </h1>
              <p className="text-xs text-emerald-700 font-medium print:text-[9px]">
                Periode Bulan: <span className="font-bold">{selectedMonth}</span> | Jam Operasional: Senin - Jumat (07:00 - 16:00 WITA)
              </p>
            </div>

            {/* Legend */}
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

        {/* Tabel Utama */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden print:border-slate-300">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-[11px] print:text-[8px]">
              <thead>
                <tr className="bg-emerald-950 text-white">
                  <th className="p-1.5 text-left pl-3 font-semibold w-48 border-r border-emerald-800 print:w-36 print:p-1">
                    Nama Petugas
                  </th>
                  {daysArray.map((d) => (
                    <th
                      key={d.dayNum}
                      className={`p-1 border-r border-emerald-800/50 font-bold ${d.isSunday ? "bg-rose-900 text-rose-200" : ""}`}
                    >
                      {d.dayNum}
                    </th>
                  ))}
                  <th colSpan={2} className="p-1 font-bold bg-emerald-900 border-l border-emerald-800">
                    Total
                  </th>
                </tr>

                <tr className="bg-emerald-800 text-emerald-100 border-b border-emerald-700">
                  <th className="p-1 text-left pl-3 font-normal text-[10px] border-r border-emerald-700 print:text-[7px]">
                    Hari
                  </th>
                  {daysArray.map((d) => (
                    <th
                      key={d.dayNum}
                      className={`p-0.5 border-r border-emerald-700 font-semibold ${d.isSunday ? "text-rose-300 bg-rose-950/40" : ""}`}
                    >
                      {d.initial}
                    </th>
                  ))}
                  <th className="p-0.5 font-bold text-[9px] w-6 bg-emerald-850 border-l border-emerald-700">P</th>
                  <th className="p-0.5 font-bold text-[9px] w-6 bg-emerald-850">A</th>
                </tr>
              </thead>

              <tbody>
                {/* TIM SIMRS */}
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
                      className={`border-b border-slate-200 hover:bg-emerald-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                    >
                      <td className="p-1 text-left pl-3 border-r border-slate-200 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {m.name}
                        </div>
                        <div className="text-[9px] text-slate-500 font-normal leading-none mt-0.5 print:text-[7px]">
                          {m.phone}
                        </div>
                      </td>
                      {daysArray.map((d) => {
                        const code = customSchedule[m.name]?.[d.dayNum] || "";
                        return (
                          <td
                            key={d.dayNum}
                            onClick={() => handleCellClick(m.name, d.dayNum)}
                            className={`p-0.5 border-r border-slate-200/80 cursor-pointer select-none hover:bg-emerald-100/50 transition-all ${d.isSunday ? "bg-rose-50/40" : ""}`}
                            title="Klik untuk ganti shift"
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

                {/* TIM JARINGAN */}
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
                      className={`border-b border-slate-200 hover:bg-teal-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                    >
                      <td className="p-1 text-left pl-3 border-r border-slate-200 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {m.name} {m.name === "Ivandi Shaputra" && "(Karu)"}
                        </div>
                        <div className="text-[9px] text-slate-500 font-normal leading-none mt-0.5 print:text-[7px]">
                          {m.phone}
                        </div>
                      </td>
                      {daysArray.map((d) => {
                        const code = customSchedule[m.name]?.[d.dayNum] || "";
                        return (
                          <td
                            key={d.dayNum}
                            onClick={() => handleCellClick(m.name, d.dayNum)}
                            className={`p-0.5 border-r border-slate-200/80 cursor-pointer select-none hover:bg-teal-100/50 transition-all ${d.isSunday ? "bg-rose-50/40" : ""}`}
                            title="Klik untuk ganti shift"
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

        {/* Footer Keterangan */}
        <div className="mt-4 p-3 bg-white border border-emerald-200 rounded-xl text-base text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-2 print:mt-2 print:p-1.5 print:text-[8px] print:rounded-lg">
          <div><b className="text-yellow-500">P = Piket Sabtu:</b> 07:00 - 16:00 WITA</div>
          <div><b className="text-rose-700">L = Libur Jumat</b></div>
          <div><b className="text-emerald-600">A = On-call: 16:00 - 07:00 WITA | Hari Minggu 07:00 WITA </b></div>
        </div>
      </main>
    </div>
  );
}