"use client";

import { Banknote, CalendarClock, Phone, Plus, UserPlus, Users, WalletCards } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { useShop } from "./shop-context";
import { Button, EmptyState, Field, LoadingBlock, Modal } from "./ui";
import { currentMonthTashkent, formatMoney, todayTashkent } from "@/lib/format";
import type { Employee, PaymentType, SalaryPayment } from "@/lib/types";

const typeLabel: Record<PaymentType, string> = { advance: "Avans", salary: "Oylik", bonus: "Bonus", deduction: "Ushlanma" };

export function EmployeesClient() {
  const { shops, selectedShopId, loading: shopsLoading } = useShop();
  const [month, setMonth] = useState(currentMonthTashkent());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [paymentEmployee, setPaymentEmployee] = useState<Employee | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (selectedShopId !== "all") params.set("shop_id", selectedShopId);
    try {
      const response = await fetch(`/api/employees?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEmployees(result.employees); setPayments(result.payments);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Ishchilarni olib bo‘lmadi"); }
    finally { setLoading(false); }
  }, [month, selectedShopId]);

  useEffect(() => { if (!shopsLoading) void load(); }, [load, shopsLoading]);
  const shopMap = useMemo(() => new Map(shops.map((shop) => [shop.id, shop.name])), [shops]);
  const employeeMap = useMemo(() => new Map(employees.map((employee) => [employee.id, employee.full_name])), [employees]);
  const totalPlanned = employees.reduce((sum, employee) => sum + employee.monthly_salary, 0);
  const totalPaid = payments.filter((item) => item.payment_type !== "deduction").reduce((sum, item) => sum + item.amount, 0);
  const deductions = payments.filter((item) => item.payment_type === "deduction").reduce((sum, item) => sum + item.amount, 0);

  const employeePayment = (id: string) => {
    const own = payments.filter((item) => item.employee_id === id);
    const paid = own.filter((item) => item.payment_type !== "deduction" && item.payment_type !== "bonus").reduce((sum, item) => sum + item.amount, 0);
    const advance = own.filter((item) => item.payment_type === "advance").reduce((sum, item) => sum + item.amount, 0);
    const deduction = own.filter((item) => item.payment_type === "deduction").reduce((sum, item) => sum + item.amount, 0);
    return { paid, advance, deduction };
  };

  const submitEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/employees", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ shop_id: form.get("shop_id"), full_name: form.get("full_name"), role: form.get("role"), phone: form.get("phone"), monthly_salary: form.get("monthly_salary"), hired_at: form.get("hired_at") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      toast.success("Yangi ishchi qo‘shildi"); setEmployeeOpen(false); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Ishchini saqlab bo‘lmadi"); }
    finally { setSaving(false); }
  };

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!paymentEmployee) return; setSaving(true); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/salary-payments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ employee_id: paymentEmployee.id, shop_id: paymentEmployee.shop_id, payment_date: form.get("payment_date"), salary_month: form.get("salary_month"), amount: form.get("amount"), payment_type: form.get("payment_type"), description: form.get("description") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      toast.success("To‘lov saqlandi"); setPaymentEmployee(null); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "To‘lovni saqlab bo‘lmadi"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Ishchilar va oyliklar" description="Ishchi maoshi, avans va oylik to‘lovlarini bir joyda yuriting." actions={<Button onClick={() => setEmployeeOpen(true)} disabled={!shops.length}><UserPlus size={16} /> Ishchi qo‘shish</Button>} />
      <section className="card summary-strip">
        <div><span>Faol ishchilar</span><strong>{employees.length} ta</strong></div>
        <div><span>Rejadagi oyliklar</span><strong>{formatMoney(totalPlanned)}</strong></div>
        <div><span>Shu oy to‘langan</span><strong style={{ color: "#0d604a" }}>{formatMoney(totalPaid)}</strong></div>
      </section>
      <div className="toolbar"><div className="toolbar-spacer" /><label style={{ color: "#6e7d75", fontSize: 11 }}>Hisob-kitob oyi</label><input className="field-input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>
      {loading ? <section className="card"><LoadingBlock rows={5} /></section> : !employees.length ? <section className="card"><EmptyState icon={<Users size={21} />} title="Ishchilar yo‘q" text="Yangi ishchi qo‘shib oylik hisobini boshlang." /></section> : (
        <section className="employee-grid">{employees.map((employee) => {
          const state = employeePayment(employee.id);
          const remaining = Math.max(employee.monthly_salary - state.paid - state.deduction, 0);
          const progress = Math.min(((state.paid + state.deduction) / employee.monthly_salary) * 100, 100);
          return (
            <article className="card employee-card" key={employee.id}>
              <div className="employee-head"><span className="avatar">{employee.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><h3>{employee.full_name}</h3><p>{employee.role} · {shopMap.get(employee.shop_id)}</p></div><span className="badge badge-green">Faol</span></div>
              {employee.phone && <div className="table-secondary" style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12 }}><Phone size={12} />{employee.phone}</div>}
              <div className="salary-box">
                <div className="salary-line"><span>Oylik maosh</span><strong>{formatMoney(employee.monthly_salary)}</strong></div>
                <div className="salary-line"><span>Avans berildi</span><strong>{formatMoney(state.advance)}</strong></div>
                <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                <div className="salary-line"><span>Qolgan to‘lov</span><strong style={{ color: remaining ? "#ae741c" : "#0d604a" }}>{formatMoney(remaining)}</strong></div>
              </div>
              <div className="employee-actions"><Button variant="secondary" onClick={() => setPaymentEmployee(employee)}><Banknote size={14} /> To‘lov berish</Button></div>
            </article>
          );
        })}</section>
      )}

      <section className="card table-card" style={{ marginTop: 16 }}>
        <header className="card-header"><div><h2>To‘lovlar tarixi</h2><p>{month} oyi uchun oylik, avans va bonuslar</p></div><CalendarClock size={18} color="#16785d" /></header>
        {!payments.length ? <EmptyState icon={<WalletCards size={21} />} title="To‘lovlar yo‘q" text="Tanlangan oyda ishchilarga to‘lov kiritilmagan." /> : (
          <table className="data-table"><thead><tr><th>Sana</th><th>Ishchi</th><th>To‘lov turi</th><th>Izoh</th><th>Summa</th></tr></thead><tbody>{payments.map((item) => (
            <tr key={item.id}><td>{item.payment_date}</td><td className="table-primary">{employeeMap.get(item.employee_id) ?? "—"}</td><td><span className={`badge ${item.payment_type === "deduction" ? "badge-red" : item.payment_type === "advance" ? "badge-amber" : "badge-green"}`}>{typeLabel[item.payment_type]}</span></td><td>{item.description || "—"}</td><td className="table-amount">{item.payment_type === "deduction" ? "− " : ""}{formatMoney(item.amount)}</td></tr>
          ))}</tbody></table>
        )}
        {!!deductions && <footer className="table-footer"><span>Ushlanmalar</span><span>{formatMoney(deductions)}</span></footer>}
      </section>

      <Modal open={employeeOpen} onClose={() => setEmployeeOpen(false)} title="Yangi ishchi" description="Ishchi va uning oylik ma’lumotlarini kiriting.">
        <form onSubmit={submitEmployee}><div className="form-grid">
          <div className="full"><Field label="F.I.Sh."><input name="full_name" placeholder="Ism va familiya" required /></Field></div>
          <Field label="Do‘kon"><select name="shop_id" defaultValue={selectedShopId === "all" ? shops[0]?.id : selectedShopId} required>{shops.map((shop) => <option value={shop.id} key={shop.id}>{shop.name}</option>)}</select></Field>
          <Field label="Lavozim"><input name="role" placeholder="Masalan: sotuvchi" required /></Field>
          <Field label="Telefon"><input name="phone" placeholder="+998 90 123 45 67" /></Field>
          <Field label="Ishga kirgan sana"><input name="hired_at" type="date" defaultValue={todayTashkent()} required /></Field>
          <div className="full"><Field label="Oylik maosh"><div className="currency-input"><input name="monthly_salary" type="number" min="1" step="1000" required /><span>so‘m</span></div></Field></div>
        </div><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setEmployeeOpen(false)}>Bekor qilish</Button><Button type="submit" disabled={saving}><Plus size={15} />{saving ? "Saqlanmoqda..." : "Ishchini saqlash"}</Button></div></form>
      </Modal>

      <Modal open={Boolean(paymentEmployee)} onClose={() => setPaymentEmployee(null)} title={`${paymentEmployee?.full_name ?? "Ishchi"} uchun to‘lov`} description="Avans, oylik, bonus yoki ushlanmani qayd eting.">
        <form onSubmit={submitPayment}><div className="form-grid">
          <Field label="To‘lov turi"><select name="payment_type" defaultValue="advance"><option value="advance">Avans</option><option value="salary">Oylik</option><option value="bonus">Bonus</option><option value="deduction">Ushlanma</option></select></Field>
          <Field label="To‘lov sanasi"><input name="payment_date" type="date" defaultValue={todayTashkent()} required /></Field>
          <Field label="Qaysi oy uchun"><input name="salary_month" type="month" defaultValue={month} required /></Field>
          <Field label="Summa"><div className="currency-input"><input name="amount" type="number" min="1" step="1000" required /><span>so‘m</span></div></Field>
          <div className="full"><Field label="Izoh" hint="Ixtiyoriy"><textarea name="description" placeholder="Masalan: avgust oyi avansi" /></Field></div>
        </div><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setPaymentEmployee(null)}>Bekor qilish</Button><Button type="submit" disabled={saving}><WalletCards size={15} />{saving ? "Saqlanmoqda..." : "To‘lovni saqlash"}</Button></div></form>
      </Modal>
    </>
  );
}
