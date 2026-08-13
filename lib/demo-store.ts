import type { Employee, Expense, Sale, SalaryPayment, Shop } from "./types";
import { createId } from "./id";
import { currentMonthTashkent, daysAgoDate, todayTashkent } from "./format";

type DemoStore = {
  shops: Shop[];
  sales: Sale[];
  expenses: Expense[];
  employees: Employee[];
  salaryPayments: SalaryPayment[];
};

declare global {
  var __moliyaDemoStore: DemoStore | undefined;
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

function seedStore(): DemoStore {
  const now = new Date().toISOString();
  const shops: Shop[] = [
    { id: "demo-shop-1", name: "Chilonzor filiali", address: "Chilonzor tumani", is_active: true, created_at: now },
    { id: "demo-shop-2", name: "Yunusobod filiali", address: "Yunusobod tumani", is_active: true, created_at: now },
  ];

  const sales: Sale[] = [];
  for (let day = 48; day >= 0; day -= 1) {
    for (let shop = 0; shop < shops.length; shop += 1) {
      const base = shop === 0 ? 5_800_000 : 4_350_000;
      const weekendBoost = (day + shop) % 7 < 2 ? 1.18 : 1;
      const total = Math.round((base + pseudoRandom(day * 5 + shop) * 2_700_000) * weekendBoost / 10_000) * 10_000;
      const cashPart = 0.38 + pseudoRandom(day * 3 + shop) * 0.2;
      const cash = Math.round((total * cashPart) / 10_000) * 10_000;
      sales.push({
        id: `demo-sale-${day}-${shop}`,
        shop_id: shops[shop].id,
        sale_date: daysAgoDate(day),
        cash_amount: cash,
        card_amount: total - cash,
        description: day === 0 ? "Kunlik savdo" : "",
        created_at: now,
      });
    }
  }

  const expenseTemplates = [
    ["Mahsulot", "Yetkazib beruvchiga to‘lov"],
    ["Transport", "Mahsulot yetkazish"],
    ["Kommunal", "Elektr va internet"],
    ["Reklama", "Ijtimoiy tarmoq reklamasi"],
    ["Boshqa", "Do‘kon ehtiyojlari"],
  ];
  const expenses: Expense[] = [];
  for (let day = 44; day >= 0; day -= 3) {
    const shop = day % 2;
    const template = expenseTemplates[day % expenseTemplates.length];
    expenses.push({
      id: `demo-expense-${day}`,
      shop_id: shops[shop].id,
      expense_date: daysAgoDate(day),
      amount: Math.round((250_000 + pseudoRandom(day + 21) * 1_350_000) / 10_000) * 10_000,
      category: template[0],
      description: template[1],
      created_at: now,
    });
  }

  const employees: Employee[] = [
    { id: "demo-employee-1", shop_id: shops[0].id, full_name: "Aziz Karimov", role: "Sotuvchi", phone: "+998 90 123 45 67", monthly_salary: 3_500_000, hired_at: "2025-02-10", is_active: true, created_at: now },
    { id: "demo-employee-2", shop_id: shops[0].id, full_name: "Dilnoza Aliyeva", role: "Kassir", phone: "+998 93 234 56 78", monthly_salary: 4_000_000, hired_at: "2025-04-01", is_active: true, created_at: now },
    { id: "demo-employee-3", shop_id: shops[1].id, full_name: "Javohir Rasulov", role: "Sotuvchi", phone: "+998 99 345 67 89", monthly_salary: 3_500_000, hired_at: "2025-06-15", is_active: true, created_at: now },
  ];

  const salaryPayments: SalaryPayment[] = [
    { id: "demo-payment-1", employee_id: employees[0].id, shop_id: shops[0].id, payment_date: todayTashkent(), salary_month: currentMonthTashkent(), amount: 1_000_000, payment_type: "advance", description: "Oylik avans", created_at: now },
    { id: "demo-payment-2", employee_id: employees[1].id, shop_id: shops[0].id, payment_date: daysAgoDate(2), salary_month: currentMonthTashkent(), amount: 1_200_000, payment_type: "advance", description: "Oylik avans", created_at: now },
  ];

  return { shops, sales, expenses, employees, salaryPayments };
}

export function getDemoStore() {
  if (!globalThis.__moliyaDemoStore) globalThis.__moliyaDemoStore = seedStore();
  return globalThis.__moliyaDemoStore;
}

export function resetDemoStore() {
  globalThis.__moliyaDemoStore = seedStore();
}

export function demoInsert<T extends keyof DemoStore>(collection: T, value: DemoStore[T][number]) {
  (getDemoStore()[collection] as Array<DemoStore[T][number]>).unshift(value);
  return value;
}

export function withNewRecord<T extends object>(value: T) {
  return { ...value, id: createId(), created_at: new Date().toISOString() };
}
