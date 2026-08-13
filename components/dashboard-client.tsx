"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Plus,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "./page-header";
import { useShop } from "./shop-context";
import { Button, EmptyState, LoadingBlock } from "./ui";
import { formatMoney, formatNumber, longDate } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const tooltipFormatter = (value: unknown) => formatMoney(Number(value ?? 0), true);

export function DashboardClient() {
  const { selectedShopId, selectedShop, loading: shopsLoading } = useShop();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = selectedShopId === "all" ? "" : `?shop_id=${selectedShopId}`;
      const response = await fetch(`/api/dashboard${query}`);
      if (response.ok) setData(await response.json());
    } finally {
      setLoading(false);
    }
  }, [selectedShopId]);

  useEffect(() => { if (!shopsLoading) void load(); }, [load, shopsLoading]);

  const summary = data?.summary;
  const maxPerformance = Math.max(...(data?.shopPerformance.map((item) => item.sales) ?? [1]), 1);

  return (
    <>
      <PageHeader
        eyebrow={longDate()}
        title="Assalomu alaykum!"
        description={`${selectedShop ? selectedShop.name : "Barcha do‘konlar"} bo‘yicha eng muhim moliyaviy ko‘rsatkichlar.`}
        actions={<><Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Yangilash</Button><Link href="/sales" className="button button-primary"><Plus size={16} /> Savdo kiritish</Link></>}
      />

      <section className="stats-grid">
        <article className="card stat-card">
          <div className="stat-card-top"><span className="stat-label">Bugungi jami savdo</span><span className="stat-icon green"><CircleDollarSign size={18} /></span></div>
          <div className="stat-value">{loading ? "—" : formatMoney(summary?.todayTotal ?? 0)}</div>
          <div className="stat-meta">
            {summary?.comparedToYesterday != null ? <span className={summary.comparedToYesterday >= 0 ? "trend-up" : "trend-down"}>{summary.comparedToYesterday >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(summary.comparedToYesterday).toFixed(1)}%</span> : <CalendarDays size={12} />}
            <span>kechagi kunga nisbatan</span>
          </div>
        </article>
        <article className="card stat-card">
          <div className="stat-card-top"><span className="stat-label">Naqd pul</span><span className="stat-icon amber"><Banknote size={18} /></span></div>
          <div className="stat-value">{loading ? "—" : formatMoney(summary?.todayCash ?? 0)}</div>
          <div className="stat-meta"><span>{summary?.todayTotal ? `${((summary.todayCash / summary.todayTotal) * 100).toFixed(0)}%` : "0%"}</span><span>bugungi savdodan</span></div>
        </article>
        <article className="card stat-card">
          <div className="stat-card-top"><span className="stat-label">Plastik orqali</span><span className="stat-icon blue"><CreditCard size={18} /></span></div>
          <div className="stat-value">{loading ? "—" : formatMoney(summary?.todayCard ?? 0)}</div>
          <div className="stat-meta"><span>{summary?.todayTotal ? `${((summary.todayCard / summary.todayTotal) * 100).toFixed(0)}%` : "0%"}</span><span>bugungi savdodan</span></div>
        </article>
        <article className="card stat-card">
          <div className="stat-card-top"><span className="stat-label">Oylik sof qoldiq</span><span className="stat-icon green"><TrendingUp size={18} /></span></div>
          <div className="stat-value">{loading ? "—" : formatMoney(summary?.monthNet ?? 0)}</div>
          <div className="stat-meta"><span>savdo − xarajat − oyliklar</span></div>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-left">
          <article className="card">
            <header className="card-header">
              <div><h2>7 kunlik pul oqimi</h2><p>Kunlik savdo va xarajatlar dinamikasi</p></div>
              <div className="chart-legend"><span><i /> Savdo</span><span><i /> Xarajat</span></div>
            </header>
            {loading ? <LoadingBlock rows={4} /> : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data?.chart ?? []} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16785d" stopOpacity={0.22} /><stop offset="100%" stopColor="#16785d" stopOpacity={0.01} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="#edf1ef" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7f8c85", fontSize: 10 }} dy={8} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7f8c85", fontSize: 9 }} tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} width={34} />
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ border: "1px solid #e1e9e5", borderRadius: 10, boxShadow: "0 8px 25px rgba(16,45,34,.08)", fontSize: 11 }} />
                    <Area type="monotone" dataKey="sales" name="Savdo" stroke="#16785d" strokeWidth={2.2} fill="url(#salesFill)" />
                    <Bar dataKey="expenses" name="Xarajat" fill="#e7a24d" radius={[4, 4, 0, 0]} barSize={12} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <div className="quick-actions">
            <Link className="quick-action" href="/sales"><span><ShoppingBag size={17} /></span><div><strong>Savdo qo‘shish</strong><small>Naqd va plastik</small></div></Link>
            <Link className="quick-action" href="/expenses"><span><ReceiptText size={17} /></span><div><strong>Xarajat yozish</strong><small>Izoh va kategoriya</small></div></Link>
            <Link className="quick-action" href="/employees"><span><UserRound size={17} /></span><div><strong>Avans berish</strong><small>Ishchi to‘lovlari</small></div></Link>
          </div>

          <article className="card">
            <header className="card-header"><div><h2>So‘nggi operatsiyalar</h2><p>Yaqinda kiritilgan ma’lumotlar</p></div><Link href="/reports" className="button button-ghost">Barchasi <ArrowUpRight size={14} /></Link></header>
            {loading ? <LoadingBlock rows={4} /> : !data?.recent.length ? <EmptyState icon={<WalletCards size={20} />} title="Operatsiyalar yo‘q" text="Birinchi savdo yoki xarajatni kiriting." /> : (
              <div className="recent-list">{data.recent.map((item) => {
                const Icon = item.type === "sale" ? ShoppingBag : item.type === "expense" ? ReceiptText : UserRound;
                return <div className="recent-item" key={`${item.type}-${item.id}`}><span className={`recent-item-icon ${item.type}`}><Icon size={16} /></span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div><span className={`recent-amount ${item.type}`}>{item.type === "sale" ? "+" : "−"}{formatMoney(item.amount)}</span></div>;
              })}</div>
            )}
          </article>
        </div>

        <div className="dashboard-right">
          <article className="card">
            <header className="card-header"><div><h2>Oylik holat</h2><p>Joriy oy bo‘yicha</p></div><BarChart3 size={17} color="#16785d" /></header>
            <div className="card-body">
              <div className="salary-line"><span>Jami savdo</span><strong>{formatMoney(summary?.monthTotal ?? 0)}</strong></div>
              <div className="salary-line"><span>Xarajatlar</span><strong style={{ color: "#cf4a4a" }}>− {formatMoney(summary?.monthExpenses ?? 0)}</strong></div>
              <div className="salary-line"><span>Oylik va avanslar</span><strong style={{ color: "#cf4a4a" }}>− {formatMoney(summary?.monthSalaries ?? 0)}</strong></div>
              <div className="salary-line" style={{ borderTop: "1px solid #e4ebe7", paddingTop: 11 }}><span>Sof qoldiq</span><strong style={{ color: "#0d604a" }}>{formatMoney(summary?.monthNet ?? 0)}</strong></div>
            </div>
          </article>

          <article className="card">
            <header className="card-header"><div><h2>Filiallar natijasi</h2><p>Joriy oydagi savdo</p></div></header>
            {loading ? <LoadingBlock rows={3} /> : (
              <div className="performance-list">{data?.shopPerformance.map((item) => (
                <div className="performance-row" key={item.shopId}>
                  <div className="performance-title"><strong>{item.shopName}</strong><span>{formatMoney(item.sales, true)}</span></div>
                  <div className="progress"><i style={{ width: `${(item.sales / maxPerformance) * 100}%` }} /></div>
                  <div className="performance-sub"><span>Xarajat: {formatMoney(item.expenses, true)}</span><span>Sof: {formatMoney(item.sales - item.expenses, true)}</span></div>
                </div>
              ))}</div>
            )}
          </article>

          <article className="card info-card">
            <h3>Qisqa ko‘rsatkich</h3>
            <div className="info-list">
              <div><span>Bugungi tushum</span><strong>{formatMoney(summary?.todayTotal ?? 0)}</strong></div>
              <div><span>Oylik xarajat ulushi</span><strong>{summary?.monthTotal ? `${formatNumber(((summary.monthExpenses + summary.monthSalaries) / summary.monthTotal) * 100)}%` : "0%"}</strong></div>
              <div><span>Faol filiallar</span><strong>{data?.shopPerformance.length ?? 0} ta</strong></div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
