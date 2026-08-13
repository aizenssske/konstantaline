"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { longDate, cn } from "@/lib/format";
import { ShopProvider, useShop } from "./shop-context";

const navItems = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/sales", label: "Savdolar", icon: ShoppingBag },
  { href: "/expenses", label: "Xarajatlar", icon: ReceiptText },
  { href: "/employees", label: "Ishchilar", icon: Users },
  { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/dashboard" aria-label="Moliya bosh sahifa">
      <span className="brand-mark"><CircleDollarSign size={24} strokeWidth={2.1} /></span>
      {!compact && <span><strong>Moliya</strong><small>do‘kon hisoboti</small></span>}
    </Link>
  );
}

function ShellContent({ children, username }: { children: React.ReactNode; username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { shops, selectedShopId, setSelectedShopId, loading, demoMode } = useShop();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", mobileOpen && "sidebar-open")}>
        <div className="sidebar-top">
          <Logo />
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-caption">BOSHQARUV</span>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn("nav-link", active && "nav-link-active")} onClick={() => setMobileOpen(false)}>
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-help">
          <span className="help-icon">?</span>
          <div><strong>Yordam kerakmi?</strong><p>Telegram bot orqali ham boshqaring</p></div>
        </div>
        <button className="logout-button" onClick={logout}><LogOut size={18} /> Tizimdan chiqish</button>
      </aside>

      {mobileOpen && <button className="sidebar-overlay" aria-label="Menyuni yopish" onClick={() => setMobileOpen(false)} />}

      <div className="shell-main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
          <div className="mobile-logo"><Logo compact /></div>
          <div className="shop-picker-wrap">
            <Building2 size={18} />
            <label>
              <span>Ko‘rsatilayotgan filial</span>
              <select value={selectedShopId} onChange={(event) => setSelectedShopId(event.target.value)} disabled={loading}>
                <option value="all">Barcha do‘konlar</option>
                {shops.map((shop) => <option value={shop.id} key={shop.id}>{shop.name}</option>)}
              </select>
            </label>
            <ChevronDown size={15} />
          </div>
          <div className="topbar-right">
            <span className="topbar-date">{longDate()}</span>
            <button className="icon-button notification-button" aria-label="Bildirishnomalar"><Bell size={19} /><i /></button>
            <div className="user-chip"><span>{username.slice(0, 1).toUpperCase()}</span><div><strong>{username}</strong><small>Administrator</small></div></div>
          </div>
        </header>
        {demoMode && <div className="demo-banner">Demo rejim: ma’lumotlar vaqtinchalik. Doimiy saqlash uchun Supabase’ni ulang.</div>}
        <main className="page-content">{children}</main>
      </div>

      <nav className="mobile-nav">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}><Icon size={20} /><span>{item.label.split("lar")[0]}</span></Link>;
        })}
      </nav>
    </div>
  );
}

export function AppShell({ children, username }: { children: React.ReactNode; username: string }) {
  return <ShopProvider><ShellContent username={username}>{children}</ShellContent></ShopProvider>;
}
