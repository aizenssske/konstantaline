"use client";

import { Plus, ReceiptText, Search, Tags, Trash2, Wallet } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { useShop } from "./shop-context";
import { MoneyInput } from "./money-input";
import { Button, EmptyState, Field, LoadingBlock, Modal } from "./ui";
import { currentMonthTashkent, formatMoney, monthRange, todayTashkent } from "@/lib/format";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/types";

function displayDate(date: string) {
  return new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00+05:00`));
}

export function ExpensesClient() {
  const { shops, selectedShopId, loading: shopsLoading } = useShop();
  const [month, setMonth] = useState(currentMonthTashkent());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(monthRange(month));
    if (selectedShopId !== "all") params.set("shop_id", selectedShopId);
    try {
      const response = await fetch(`/api/expenses?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setExpenses(result.expenses);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xarajatlarni olib bo‘lmadi");
    } finally { setLoading(false); }
  }, [month, selectedShopId]);

  useEffect(() => { if (!shopsLoading) void load(); }, [load, shopsLoading]);
  const shopMap = useMemo(() => new Map(shops.map((shop) => [shop.id, shop.name])), [shops]);
  const filtered = expenses.filter((item) => category === "all" || item.category === category).filter((item) => `${item.description} ${item.category} ${shopMap.get(item.shop_id)}`.toLowerCase().includes(search.toLowerCase()));
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const largest = Math.max(...expenses.map((item) => item.amount), 0);
  const categoryCount = new Set(expenses.map((item) => item.category)).size;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/expenses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ shop_id: form.get("shop_id"), expense_date: form.get("expense_date"), amount: form.get("amount"), category: form.get("category"), description: form.get("description") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success("Xarajat saqlandi"); setOpen(false); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Xarajatni saqlab bo‘lmadi"); }
    finally { setSaving(false); }
  };

  const remove = async (item: Expense) => {
    if (!confirm(`${item.description} xarajatini o‘chirasizmi?`)) return;
    const response = await fetch(`/api/expenses/${item.id}`, { method: "DELETE" });
    if (response.ok) { toast.success("Xarajat o‘chirildi"); await load(); } else toast.error("O‘chirishda xatolik");
  };

  return (
    <>
      <PageHeader title="Xarajatlar" description="Har bir chiqimni kategoriya va aniq izoh bilan nazorat qiling." actions={<Button onClick={() => setOpen(true)} disabled={!shops.length}><Plus size={16} /> Xarajat kiritish</Button>} />
      <section className="card summary-strip">
        <div><span>Jami xarajat</span><strong style={{ color: "#cf4a4a" }}>{formatMoney(total)}</strong></div>
        <div><span>Eng katta xarajat</span><strong>{formatMoney(largest)}</strong></div>
        <div><span>Kategoriyalar</span><strong>{categoryCount} ta</strong></div>
      </section>
      <div className="toolbar">
        <div className="search-box"><Search size={16} /><input className="field-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Izoh yoki kategoriya bo‘yicha..." /></div>
        <div className="toolbar-spacer" />
        <select className="field-input" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Kategoriya"><option value="all">Barcha kategoriyalar</option>{EXPENSE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
        <input className="field-input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Oy" />
      </div>
      <section className="card table-card">
        {loading ? <LoadingBlock rows={6} /> : !filtered.length ? <EmptyState icon={<ReceiptText size={21} />} title="Xarajat topilmadi" text="Tanlangan davr uchun xarajat yozuvi yo‘q." /> : (
          <table className="data-table"><thead><tr><th>Sana va filial</th><th>Kategoriya</th><th>Izoh</th><th>Summa</th><th /></tr></thead><tbody>{filtered.map((item) => (
            <tr key={item.id}><td><div className="table-primary">{displayDate(item.expense_date)}</div><div className="table-secondary">{shopMap.get(item.shop_id) ?? "—"}</div></td><td><span className="badge badge-amber"><Tags size={12} />{item.category}</span></td><td>{item.description}</td><td className="table-amount" style={{ color: "#cf4a4a" }}>− {formatMoney(item.amount)}</td><td><button className="table-action" onClick={() => void remove(item)} aria-label="O‘chirish"><Trash2 size={15} /></button></td></tr>
          ))}</tbody></table>
        )}
        {!loading && <footer className="table-footer"><span>{filtered.length} ta yozuv</span><span>Jami: {formatMoney(total)}</span></footer>}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi xarajat" description="Xarajat tafsilotlarini to‘liq kiriting.">
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field label="Do‘kon"><select name="shop_id" defaultValue={selectedShopId === "all" ? shops[0]?.id : selectedShopId} required>{shops.map((shop) => <option value={shop.id} key={shop.id}>{shop.name}</option>)}</select></Field>
            <Field label="Xarajat sanasi"><input name="expense_date" type="date" defaultValue={todayTashkent()} required /></Field>
            <Field label="Kategoriya"><select name="category" defaultValue="Mahsulot" required>{EXPENSE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Summa"><MoneyInput name="amount" required /></Field>
            <div className="full"><Field label="Xarajat izohi"><textarea name="description" placeholder="Nima uchun va kimga to‘landi?" required /></Field></div>
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button><Button type="submit" disabled={saving}><Wallet size={15} />{saving ? "Saqlanmoqda..." : "Xarajatni saqlash"}</Button></div>
        </form>
      </Modal>
    </>
  );
}
