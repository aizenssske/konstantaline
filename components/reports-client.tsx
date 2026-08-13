"use client";

import { ArrowDownRight, ArrowUpRight, Banknote, BrainCircuit, CreditCard, Download, ReceiptText, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "./page-header";
import { useShop } from "./shop-context";
import { Button, EmptyState, LoadingBlock } from "./ui";
import { currentMonthTashkent, formatMoney } from "@/lib/format";
import type { MonthlyReport } from "@/lib/types";

const tooltipFormatter = (value: unknown) => formatMoney(Number(value ?? 0), true);

export function ReportsClient() {
  const { selectedShopId, loading: shopsLoading } = useShop();
  const [month, setMonth] = useState(currentMonthTashkent());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (selectedShopId !== "all") params.set("shop_id", selectedShopId);
    try {
      const response = await fetch(`/api/reports/monthly?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setReport(result);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Hisobotni olib bo‘lmadi"); }
    finally { setLoading(false); }
  }, [month, selectedShopId]);

  useEffect(() => { if (!shopsLoading) void load(); }, [load, shopsLoading]);
  const summary = report?.summary;
  const maxCategory = Math.max(...(report?.categories.map((item) => item.value) ?? [1]), 1);
  const expenseRatio = summary?.totalSales ? ((summary.expenses + summary.salaries) / summary.totalSales) * 100 : 0;
  const margin = summary?.totalSales ? (summary.net / summary.totalSales) * 100 : 0;

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["OYLIK MOLIYAVIY HISOBOT", report.month],
      ["Jami savdo", report.summary.totalSales], ["Naqd", report.summary.cash], ["Plastik", report.summary.card],
      ["Xarajat", report.summary.expenses], ["Oylik va avans", report.summary.salaries], ["Sof qoldiq", report.summary.net],
      [], ["Filial", "Savdo", "Xarajat va oylik", "Sof qoldiq"],
      ...report.shops.map((shop) => [shop.name, shop.sales, shop.expenses, shop.net]),
      [], ["Kategoriya", "Summa"], ...report.categories.map((item) => [item.name, item.value]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = `moliya-hisobot-${report.month}.csv`; link.click(); URL.revokeObjectURL(link.href);
    toast.success("Hisobot CSV formatida yuklandi");
  };

  const insight = !summary ? "Ma’lumotlar tahlil qilinmoqda." : summary.totalSales === 0
    ? "Tanlangan oyda savdo ma’lumoti yo‘q. Kunlik savdolarni muntazam kiriting."
    : `${summary.growth == null ? "Oldingi oy bilan solishtirish uchun ma’lumot yetarli emas." : `Savdo oldingi oyga nisbatan ${Math.abs(summary.growth).toFixed(1)}% ${summary.growth >= 0 ? "oshgan" : "kamaygan"}.`} Umumiy chiqim savdoning ${expenseRatio.toFixed(1)}% ini tashkil etdi. Sof qoldiq marjasi ${margin.toFixed(1)}%.`;

  return (
    <>
      <PageHeader title="Oylik hisobot va tahlil" description="Savdo, xarajat, oylik va filiallar natijasini solishtiring." actions={<div className="report-controls"><input className="field-input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /><Button variant="secondary" onClick={exportCsv} disabled={!report}><Download size={15} /> CSV yuklash</Button></div>} />
      <section className="stats-grid">
        <article className="card stat-card"><div className="stat-card-top"><span className="stat-label">Oylik jami savdo</span><span className="stat-icon green"><TrendingUp size={18} /></span></div><div className="stat-value">{loading ? "—" : formatMoney(summary?.totalSales ?? 0)}</div><div className="stat-meta">{summary?.growth != null && <span className={summary.growth >= 0 ? "trend-up" : "trend-down"}>{summary.growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(summary.growth).toFixed(1)}%</span>}<span>oldingi oyga nisbatan</span></div></article>
        <article className="card stat-card"><div className="stat-card-top"><span className="stat-label">Naqd tushum</span><span className="stat-icon amber"><Banknote size={18} /></span></div><div className="stat-value">{loading ? "—" : formatMoney(summary?.cash ?? 0)}</div><div className="stat-meta"><span>{summary?.totalSales ? `${((summary.cash / summary.totalSales) * 100).toFixed(0)}% savdodan` : "Savdo yo‘q"}</span></div></article>
        <article className="card stat-card"><div className="stat-card-top"><span className="stat-label">Plastik tushum</span><span className="stat-icon blue"><CreditCard size={18} /></span></div><div className="stat-value">{loading ? "—" : formatMoney(summary?.card ?? 0)}</div><div className="stat-meta"><span>{summary?.totalSales ? `${((summary.card / summary.totalSales) * 100).toFixed(0)}% savdodan` : "Savdo yo‘q"}</span></div></article>
        <article className="card stat-card"><div className="stat-card-top"><span className="stat-label">Sof qoldiq</span><span className={`stat-icon ${Number(summary?.net) >= 0 ? "green" : "red"}`}><ReceiptText size={18} /></span></div><div className="stat-value">{loading ? "—" : formatMoney(summary?.net ?? 0)}</div><div className="stat-meta"><span>Xarajat: {formatMoney((summary?.expenses ?? 0) + (summary?.salaries ?? 0), true)}</span></div></article>
      </section>

      <section className="report-layout">
        <article className="card">
          <header className="card-header"><div><h2>Kunlar bo‘yicha dinamika</h2><p>{month} oyidagi savdo va xarajatlar</p></div><div className="chart-legend"><span><i /> Savdo</span><span><i /> Xarajat</span></div></header>
          {loading ? <LoadingBlock rows={5} /> : !summary?.totalSales ? <EmptyState icon={<TrendingUp size={21} />} title="Ma’lumot yetarli emas" text="Grafik uchun savdo ma’lumotlarini kiriting." /> : <div className="chart-wrap" style={{ height: 330 }}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={report?.daily}><defs><linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16785d" stopOpacity={.2} /><stop offset="100%" stopColor="#16785d" stopOpacity={.01} /></linearGradient></defs><CartesianGrid stroke="#edf1ef" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#7f8c85" }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#7f8c85" }} tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} width={34} /><Tooltip formatter={tooltipFormatter} contentStyle={{ border: "1px solid #e1e9e5", borderRadius: 10, fontSize: 11 }} /><Area type="monotone" dataKey="sales" name="Savdo" stroke="#16785d" strokeWidth={2} fill="url(#reportFill)" /><Bar dataKey="expenses" name="Xarajat" fill="#e7a24d" radius={[3,3,0,0]} barSize={8} /></ComposedChart></ResponsiveContainer></div>}
        </article>
        <div className="report-side">
          <article className="card insight"><div className="insight-icon"><BrainCircuit size={18} /></div><h3>Avtomatik tahlil</h3><p>{insight}</p></article>
          <article className="card"><header className="card-header"><div><h2>Xarajat tarkibi</h2><p>Kategoriyalar bo‘yicha</p></div></header><div className="category-list">{report?.categories.length ? report.categories.map((item) => <div className="category-row" key={item.name}><span>{item.name}</span><div className="progress"><i style={{ width: `${(item.value / maxCategory) * 100}%`, background: "#e7a24d" }} /></div><strong>{formatMoney(item.value, true)}</strong></div>) : <div style={{ padding: "30px 0", textAlign: "center", color: "#6e7d75", fontSize: 11 }}>Xarajatlar yo‘q</div>}</div></article>
          <article className="card info-card"><h3>Hisobot tarkibi</h3><div className="info-list"><div><span>Savdo kiritilgan kunlar</span><strong>{summary?.saleDays ?? 0} kun</strong></div><div><span>Sof marja</span><strong>{margin.toFixed(1)}%</strong></div><div><span>Oylik va avans</span><strong>{formatMoney(summary?.salaries ?? 0)}</strong></div></div></article>
        </div>
      </section>

      <section className="card table-card branch-table"><header className="card-header"><div><h2>Filiallar kesimida</h2><p>Do‘konlar natijasini o‘zaro solishtirish</p></div></header>{report?.shops.length ? <table className="data-table"><thead><tr><th>Filial</th><th>Jami savdo</th><th>Xarajat va oylik</th><th>Sof qoldiq</th><th>Rentabellik</th></tr></thead><tbody>{report.shops.map((shop) => <tr key={shop.name}><td className="table-primary">{shop.name}</td><td>{formatMoney(shop.sales)}</td><td style={{ color: "#cf4a4a" }}>− {formatMoney(shop.expenses)}</td><td className="table-amount" style={{ color: shop.net >= 0 ? "#0d604a" : "#cf4a4a" }}>{formatMoney(shop.net)}</td><td><span className={`badge ${shop.net >= 0 ? "badge-green" : "badge-red"}`}>{shop.sales ? `${((shop.net / shop.sales) * 100).toFixed(1)}%` : "0%"}</span></td></tr>)}</tbody></table> : <EmptyState icon={<ReceiptText size={21} />} title="Filial ma’lumoti yo‘q" text="Hisobot uchun do‘kon qo‘shing." />}</section>
    </>
  );
}
