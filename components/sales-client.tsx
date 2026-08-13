"use client";

import { Banknote, CreditCard, Plus, Search, ShoppingBag, Trash2, WalletCards } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { useShop } from "./shop-context";
import { Button, EmptyState, Field, LoadingBlock, Modal } from "./ui";
import { currentMonthTashkent, formatMoney, monthRange, todayTashkent } from "@/lib/format";
import type { Sale } from "@/lib/types";

function displayDate(date: string) {
  return new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00+05:00`));
}

export function SalesClient() {
  const { shops, selectedShopId, loading: shopsLoading } = useShop();
  const [month, setMonth] = useState(currentMonthTashkent());
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const range = monthRange(month);
    const params = new URLSearchParams(range);
    if (selectedShopId !== "all") params.set("shop_id", selectedShopId);
    try {
      const response = await fetch(`/api/sales?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSales(result.sales);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Savdolarni olib bo‘lmadi");
    } finally {
      setLoading(false);
    }
  }, [month, selectedShopId]);

  useEffect(() => { if (!shopsLoading) void load(); }, [load, shopsLoading]);

  const shopMap = useMemo(() => new Map(shops.map((shop) => [shop.id, shop.name])), [shops]);
  const filtered = sales.filter((sale) => `${sale.description} ${shopMap.get(sale.shop_id)}`.toLowerCase().includes(search.toLowerCase()));
  const totalCash = sales.reduce((sum, sale) => sum + sale.cash_amount, 0);
  const totalCard = sales.reduce((sum, sale) => sum + sale.card_amount, 0);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shop_id: form.get("shop_id"), sale_date: form.get("sale_date"),
          cash_amount: form.get("cash_amount"), card_amount: form.get("card_amount"),
          description: form.get("description"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success("Savdo muvaffaqiyatli kiritildi");
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Savdoni saqlab bo‘lmadi");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (sale: Sale) => {
    if (!confirm(`${formatMoney(sale.cash_amount + sale.card_amount)} savdoni o‘chirasizmi?`)) return;
    const response = await fetch(`/api/sales/${sale.id}`, { method: "DELETE" });
    if (response.ok) { toast.success("Savdo o‘chirildi"); await load(); } else toast.error("O‘chirishda xatolik");
  };

  return (
    <>
      <PageHeader title="Savdolar" description="Naqd va plastik orqali tushgan kunlik savdolarni boshqaring." actions={<Button onClick={() => setOpen(true)} disabled={!shops.length}><Plus size={16} /> Savdo kiritish</Button>} />
      <section className="card summary-strip">
        <div><span>Jami savdo</span><strong>{formatMoney(totalCash + totalCard)}</strong></div>
        <div><span>Naqd tushum</span><strong>{formatMoney(totalCash)}</strong></div>
        <div><span>Plastik tushum</span><strong>{formatMoney(totalCard)}</strong></div>
      </section>
      <div className="toolbar">
        <div className="search-box"><Search size={16} /><input className="field-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Savdolar ichidan qidirish..." /></div>
        <div className="toolbar-spacer" />
        <input className="field-input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Oy" />
      </div>
      <section className="card table-card">
        {loading ? <LoadingBlock rows={6} /> : !filtered.length ? <EmptyState icon={<ShoppingBag size={21} />} title="Savdo topilmadi" text="Tanlangan davr uchun savdo ma’lumoti yo‘q." /> : (
          <table className="data-table">
            <thead><tr><th>Sana va filial</th><th>Izoh</th><th>Naqd</th><th>Plastik</th><th>Jami</th><th /></tr></thead>
            <tbody>{filtered.map((sale) => (
              <tr key={sale.id}>
                <td><div className="table-primary">{displayDate(sale.sale_date)}</div><div className="table-secondary">{shopMap.get(sale.shop_id) ?? "—"}</div></td>
                <td>{sale.description || <span style={{ color: "#a1aba6" }}>Izohsiz</span>}</td>
                <td><span className="badge badge-amber"><Banknote size={12} />{formatMoney(sale.cash_amount)}</span></td>
                <td><span className="badge badge-blue"><CreditCard size={12} />{formatMoney(sale.card_amount)}</span></td>
                <td className="table-amount">{formatMoney(sale.cash_amount + sale.card_amount)}</td>
                <td><button className="table-action" onClick={() => void remove(sale)} aria-label="O‘chirish"><Trash2 size={15} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {!loading && <footer className="table-footer"><span>{filtered.length} ta yozuv</span><span>Jami: {formatMoney(totalCash + totalCard)}</span></footer>}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi savdo" description="Kunlik naqd va plastik tushumni kiriting.">
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field label="Do‘kon"><select name="shop_id" defaultValue={selectedShopId === "all" ? shops[0]?.id : selectedShopId} required>{shops.map((shop) => <option value={shop.id} key={shop.id}>{shop.name}</option>)}</select></Field>
            <Field label="Savdo sanasi"><input name="sale_date" type="date" defaultValue={todayTashkent()} required /></Field>
            <Field label="Naqd savdo"><div className="currency-input"><input name="cash_amount" type="number" min="0" step="1000" defaultValue="0" inputMode="numeric" /><span>so‘m</span></div></Field>
            <Field label="Plastik orqali"><div className="currency-input"><input name="card_amount" type="number" min="0" step="1000" defaultValue="0" inputMode="numeric" /><span>so‘m</span></div></Field>
            <div className="full"><Field label="Izoh" hint="Ixtiyoriy"><textarea name="description" placeholder="Masalan: kunlik savdo, aksiya kuni..." /></Field></div>
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button><Button type="submit" disabled={saving}><WalletCards size={15} />{saving ? "Saqlanmoqda..." : "Savdoni saqlash"}</Button></div>
        </form>
      </Modal>
    </>
  );
}
