"use client";

import { Bot, Building2, CheckCircle2, Database, Pencil, Plus, ShieldCheck, Store } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { useShop } from "./shop-context";
import { Button, Field, LoadingBlock, Modal } from "./ui";
import type { Shop } from "@/lib/types";

export function SettingsClient() {
  const { demoMode, refreshShops } = useShop();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/shops?all=true"); const result = await response.json(); if (response.ok) setShops(result.shops); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(editing ? `/api/shops/${editing.id}` : "/api/shops", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), address: form.get("address") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      toast.success(editing ? "Filial yangilandi" : "Yangi filial qo‘shildi"); setOpen(false); setEditing(null); await Promise.all([load(), refreshShops()]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Filialni saqlab bo‘lmadi"); }
    finally { setSaving(false); }
  };

  const toggle = async (shop: Shop) => {
    if (shop.is_active && !confirm(`${shop.name} filialini nofaol qilasizmi? Oldingi ma’lumotlar o‘chmaydi.`)) return;
    const response = await fetch(`/api/shops/${shop.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ is_active: !shop.is_active }) });
    if (response.ok) { toast.success(shop.is_active ? "Filial nofaol qilindi" : "Filial faollashtirildi"); await Promise.all([load(), refreshShops()]); }
    else toast.error("Holatni o‘zgartirib bo‘lmadi");
  };

  const edit = (shop: Shop) => { setEditing(shop); setOpen(true); };

  return (
    <>
      <PageHeader title="Sozlamalar" description="Filiallar va tizim integratsiyalari holatini boshqaring." actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Filial qo‘shish</Button>} />
      <section className="settings-grid">
        <article className="card"><header className="card-header"><div><h2>Do‘konlar</h2><p>Hozirgi va kelajakdagi barcha filiallar</p></div><span className="badge badge-green">{shops.filter((shop) => shop.is_active).length} ta faol</span></header>
          {loading ? <LoadingBlock rows={4} /> : <div className="shop-list">{shops.map((shop) => <div className="shop-row" key={shop.id}><span><Store size={18} /></span><div><h3>{shop.name}</h3><p>{shop.address || "Manzil kiritilmagan"}</p></div><div style={{ display: "flex", alignItems: "center", gap: 7 }}><span className={`badge ${shop.is_active ? "badge-green" : "badge-red"}`}>{shop.is_active ? "Faol" : "Nofaol"}</span><button className="icon-button" onClick={() => edit(shop)} aria-label="Tahrirlash"><Pencil size={15} /></button><Button variant="ghost" onClick={() => void toggle(shop)}>{shop.is_active ? "O‘chirish" : "Faollashtirish"}</Button></div></div>)}</div>}
        </article>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <article className="card info-card"><h3>Integratsiyalar holati</h3><div className="info-list"><div><span style={{ display: "flex", alignItems: "center", gap: 7 }}><Database size={14} /> Ma’lumotlar bazasi</span><strong style={{ color: demoMode ? "#ae741c" : "#0d604a" }}>{demoMode ? "Demo rejim" : "Supabase ulangan"}</strong></div><div><span style={{ display: "flex", alignItems: "center", gap: 7 }}><Bot size={14} /> Telegram bot</span><strong>API ko‘prigi tayyor</strong></div><div><span style={{ display: "flex", alignItems: "center", gap: 7 }}><ShieldCheck size={14} /> Himoya</span><strong>Server orqali</strong></div></div></article>
          <article className="card info-card"><div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}><span className="stat-icon green"><CheckCircle2 size={17} /></span><div><h3 style={{ marginBottom: 5 }}>Kengayishga tayyor</h3><p style={{ margin: 0, color: "#6e7d75", fontSize: 10.5, lineHeight: 1.6 }}>Yangi filial qo‘shilganda savdo, xarajat va ishchilar avtomatik ravishda alohida hisoblanadi. Umumiy hisobot esa barcha filiallarni birlashtiradi.</p></div></div></article>
          <article className="card info-card"><h3>Joylashtirish</h3><div className="info-list"><div><span>Web ilova</span><strong>Vercel</strong></div><div><span>Telegram bot</span><strong>Render</strong></div><div><span>Ma’lumotlar</span><strong>Supabase PostgreSQL</strong></div></div></article>
        </div>
      </section>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? "Filialni tahrirlash" : "Yangi filial"} description="Filial ma’lumotlarini kiriting. Hisobotlarda shu nom ko‘rinadi.">
        <form onSubmit={submit} key={editing?.id ?? "new"}><div className="form-grid"><div className="full"><Field label="Filial nomi"><input name="name" defaultValue={editing?.name ?? ""} placeholder="Masalan: Sergeli filiali" required /></Field></div><div className="full"><Field label="Manzil" hint="Ixtiyoriy"><textarea name="address" defaultValue={editing?.address ?? ""} placeholder="Tuman, ko‘cha va mo‘ljal" /></Field></div></div><div className="form-actions"><Button type="button" variant="secondary" onClick={() => { setOpen(false); setEditing(null); }}>Bekor qilish</Button><Button type="submit" disabled={saving}><Building2 size={15} />{saving ? "Saqlanmoqda..." : "Filialni saqlash"}</Button></div></form>
      </Modal>
    </>
  );
}
