import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getDemoStore, withNewRecord } from "./demo-store";
import { isDemoMode, readyDb } from "./db";
import { employees, expenses, salaryPayments, sales, shops } from "./db/schema";
import {
  currentMonthTashkent,
  daysAgoDate,
  monthRange,
  previousMonth,
  shortDate,
  todayTashkent,
} from "./format";
import type {
  DashboardData,
  Employee,
  Expense,
  MonthlyReport,
  PaymentType,
  Sale,
  SalaryPayment,
  Shop,
} from "./types";

type DateFilter = { shopId?: string; from?: string; to?: string };

const asNumber = (value: unknown) => {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

const moneyValue = (value: number) => {
  if (!Number.isFinite(value)) throw new Error("Noto‘g‘ri summa");
  return Math.round(value * 100) / 100;
};

function asIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return new Date().toISOString();
}

function asDateOnly(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  return String(value);
}

function requireRow<T>(row: T | undefined, message: string): T {
  if (!row) throw new Error(message);
  return row;
}

function normalizeShop(row: typeof shops.$inferSelect): Shop {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    is_active: row.is_active,
    created_at: asIso(row.created_at),
  };
}

function normalizeSale(row: typeof sales.$inferSelect): Sale {
  return {
    id: row.id,
    shop_id: row.shop_id,
    sale_date: asDateOnly(row.sale_date),
    cash_amount: asNumber(row.cash_amount),
    card_amount: asNumber(row.card_amount),
    description: row.description,
    created_at: asIso(row.created_at),
  };
}

function normalizeExpense(row: typeof expenses.$inferSelect): Expense {
  return {
    id: row.id,
    shop_id: row.shop_id,
    expense_date: asDateOnly(row.expense_date),
    amount: asNumber(row.amount),
    category: row.category,
    description: row.description,
    created_at: asIso(row.created_at),
  };
}

function normalizeEmployee(row: typeof employees.$inferSelect): Employee {
  return {
    id: row.id,
    shop_id: row.shop_id,
    full_name: row.full_name,
    role: row.role,
    phone: row.phone,
    monthly_salary: asNumber(row.monthly_salary),
    hired_at: asDateOnly(row.hired_at),
    is_active: row.is_active,
    created_at: asIso(row.created_at),
  };
}

function normalizePayment(row: typeof salaryPayments.$inferSelect): SalaryPayment {
  return {
    id: row.id,
    employee_id: row.employee_id,
    shop_id: row.shop_id,
    payment_date: asDateOnly(row.payment_date),
    salary_month: row.salary_month,
    amount: asNumber(row.amount),
    payment_type: row.payment_type,
    description: row.description,
    created_at: asIso(row.created_at),
  };
}

export async function listShops(includeInactive = false): Promise<Shop[]> {
  if (isDemoMode()) {
    return getDemoStore()
      .shops.filter((shop) => includeInactive || shop.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const db = await readyDb();
  const rows = includeInactive
    ? await db.select().from(shops).orderBy(shops.name)
    : await db.select().from(shops).where(eq(shops.is_active, true)).orderBy(shops.name);
  return rows.map(normalizeShop);
}

export async function createShop(input: Pick<Shop, "name" | "address">): Promise<Shop> {
  if (isDemoMode()) {
    const record = withNewRecord({ ...input, is_active: true }) as Shop;
    getDemoStore().shops.push(record);
    return record;
  }
  const [row] = await (await readyDb())
    .insert(shops)
    .values({ ...input, is_active: true })
    .returning();
  return normalizeShop(requireRow(row, "Filialni saqlab bo‘lmadi"));
}

export async function updateShop(
  id: string,
  input: Partial<Pick<Shop, "name" | "address" | "is_active">>,
): Promise<Shop> {
  if (isDemoMode()) {
    const shop = getDemoStore().shops.find((item) => item.id === id);
    if (!shop) throw new Error("Do‘kon topilmadi");
    Object.assign(shop, input);
    return shop;
  }
  const [row] = await (await readyDb()).update(shops).set(input).where(eq(shops.id, id)).returning();
  return normalizeShop(requireRow(row, "Do‘kon topilmadi"));
}

export async function listSales(filter: DateFilter = {}): Promise<Sale[]> {
  if (isDemoMode()) {
    return getDemoStore()
      .sales.filter((item) => !filter.shopId || item.shop_id === filter.shopId)
      .filter((item) => !filter.from || item.sale_date >= filter.from)
      .filter((item) => !filter.to || item.sale_date <= filter.to)
      .sort((a, b) => b.sale_date.localeCompare(a.sale_date) || b.created_at.localeCompare(a.created_at));
  }
  const conditions = [
    filter.shopId ? eq(sales.shop_id, filter.shopId) : undefined,
    filter.from ? gte(sales.sale_date, filter.from) : undefined,
    filter.to ? lte(sales.sale_date, filter.to) : undefined,
  ].filter(Boolean);

  const rows = await (await readyDb())
    .select()
    .from(sales)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sales.sale_date), desc(sales.created_at));
  return rows.map(normalizeSale);
}

export async function createSale(input: Omit<Sale, "id" | "created_at">): Promise<Sale> {
  const payload = {
    ...input,
    cash_amount: moneyValue(input.cash_amount),
    card_amount: moneyValue(input.card_amount),
  };
  if (isDemoMode()) {
    const record = withNewRecord(payload) as Sale;
    getDemoStore().sales.unshift(record);
    return record;
  }
  const [row] = await (await readyDb()).insert(sales).values(payload).returning();
  return normalizeSale(requireRow(row, "Savdoni saqlab bo‘lmadi"));
}

export async function deleteSale(id: string) {
  if (isDemoMode()) {
    const store = getDemoStore();
    store.sales = store.sales.filter((item) => item.id !== id);
    return;
  }
  await (await readyDb()).delete(sales).where(eq(sales.id, id));
}

export async function listExpenses(filter: DateFilter = {}): Promise<Expense[]> {
  if (isDemoMode()) {
    return getDemoStore()
      .expenses.filter((item) => !filter.shopId || item.shop_id === filter.shopId)
      .filter((item) => !filter.from || item.expense_date >= filter.from)
      .filter((item) => !filter.to || item.expense_date <= filter.to)
      .sort(
        (a, b) =>
          b.expense_date.localeCompare(a.expense_date) || b.created_at.localeCompare(a.created_at),
      );
  }
  const conditions = [
    filter.shopId ? eq(expenses.shop_id, filter.shopId) : undefined,
    filter.from ? gte(expenses.expense_date, filter.from) : undefined,
    filter.to ? lte(expenses.expense_date, filter.to) : undefined,
  ].filter(Boolean);

  const rows = await (await readyDb())
    .select()
    .from(expenses)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(expenses.expense_date), desc(expenses.created_at));
  return rows.map(normalizeExpense);
}

export async function createExpense(input: Omit<Expense, "id" | "created_at">): Promise<Expense> {
  const payload = { ...input, amount: moneyValue(input.amount) };
  if (isDemoMode()) {
    const record = withNewRecord(payload) as Expense;
    getDemoStore().expenses.unshift(record);
    return record;
  }
  const [row] = await (await readyDb()).insert(expenses).values(payload).returning();
  return normalizeExpense(requireRow(row, "Xarajatni saqlab bo‘lmadi"));
}

export async function deleteExpense(id: string) {
  if (isDemoMode()) {
    const store = getDemoStore();
    store.expenses = store.expenses.filter((item) => item.id !== id);
    return;
  }
  await (await readyDb()).delete(expenses).where(eq(expenses.id, id));
}

export async function listEmployees(shopId?: string, includeInactive = false): Promise<Employee[]> {
  if (isDemoMode()) {
    return getDemoStore()
      .employees.filter((item) => !shopId || item.shop_id === shopId)
      .filter((item) => includeInactive || item.is_active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }
  const conditions = [
    shopId ? eq(employees.shop_id, shopId) : undefined,
    includeInactive ? undefined : eq(employees.is_active, true),
  ].filter(Boolean);

  const rows = await (await readyDb())
    .select()
    .from(employees)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(employees.full_name);
  return rows.map(normalizeEmployee);
}

export async function createEmployee(
  input: Omit<Employee, "id" | "created_at" | "is_active">,
): Promise<Employee> {
  const payload = { ...input, monthly_salary: moneyValue(input.monthly_salary), is_active: true };
  if (isDemoMode()) {
    const record = withNewRecord(payload) as Employee;
    getDemoStore().employees.push(record);
    return record;
  }
  const [row] = await (await readyDb()).insert(employees).values(payload).returning();
  return normalizeEmployee(requireRow(row, "Ishchini saqlab bo‘lmadi"));
}

export async function updateEmployee(
  id: string,
  input: Partial<Pick<Employee, "full_name" | "role" | "phone" | "monthly_salary" | "is_active">>,
): Promise<Employee> {
  const payload = {
    ...input,
    monthly_salary:
      input.monthly_salary === undefined ? undefined : moneyValue(input.monthly_salary),
  };
  if (isDemoMode()) {
    const employee = getDemoStore().employees.find((item) => item.id === id);
    if (!employee) throw new Error("Ishchi topilmadi");
    Object.assign(employee, payload);
    return employee;
  }
  const [row] = await (await readyDb()).update(employees).set(payload).where(eq(employees.id, id)).returning();
  return normalizeEmployee(requireRow(row, "Ishchi topilmadi"));
}

export async function listSalaryPayments(
  filter: { shopId?: string; employeeId?: string; month?: string } = {},
): Promise<SalaryPayment[]> {
  if (isDemoMode()) {
    return getDemoStore()
      .salaryPayments.filter((item) => !filter.shopId || item.shop_id === filter.shopId)
      .filter((item) => !filter.employeeId || item.employee_id === filter.employeeId)
      .filter((item) => !filter.month || item.salary_month === filter.month)
      .sort(
        (a, b) =>
          b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at),
      );
  }
  const conditions = [
    filter.shopId ? eq(salaryPayments.shop_id, filter.shopId) : undefined,
    filter.employeeId ? eq(salaryPayments.employee_id, filter.employeeId) : undefined,
    filter.month ? eq(salaryPayments.salary_month, filter.month) : undefined,
  ].filter(Boolean);

  const rows = await (await readyDb())
    .select()
    .from(salaryPayments)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(salaryPayments.payment_date), desc(salaryPayments.created_at));
  return rows.map(normalizePayment);
}

export async function createSalaryPayment(
  input: Omit<SalaryPayment, "id" | "created_at">,
): Promise<SalaryPayment> {
  const payload = {
    ...input,
    amount: moneyValue(input.amount),
    payment_type: input.payment_type as PaymentType,
  };
  if (isDemoMode()) {
    const record = withNewRecord(payload) as SalaryPayment;
    getDemoStore().salaryPayments.unshift(record);
    return record;
  }
  const [row] = await (await readyDb()).insert(salaryPayments).values(payload).returning();
  return normalizePayment(requireRow(row, "To‘lovni saqlab bo‘lmadi"));
}

const sum = <T>(items: T[], picker: (item: T) => number) =>
  items.reduce((total, item) => total + picker(item), 0);
const saleTotal = (sale: Sale) => sale.cash_amount + sale.card_amount;

export async function getDashboard(shopId?: string): Promise<DashboardData> {
  const today = todayTashkent();
  const month = currentMonthTashkent();
  const { from: monthStart, to: monthEnd } = monthRange(month);
  const weekStart = daysAgoDate(6);
  const yesterday = daysAgoDate(1);

  const [shopList, monthSales, monthExpenses, payments, weekSales, weekExpenses, yesterdaySales, employeeList] =
    await Promise.all([
      listShops(),
      listSales({ shopId, from: monthStart, to: monthEnd }),
      listExpenses({ shopId, from: monthStart, to: monthEnd }),
      listSalaryPayments({ shopId, month }),
      listSales({ shopId, from: weekStart, to: today }),
      listExpenses({ shopId, from: weekStart, to: today }),
      listSales({ shopId, from: yesterday, to: yesterday }),
      listEmployees(shopId),
    ]);

  const todaySales = monthSales.filter((item) => item.sale_date === today);
  const todayTotal = sum(todaySales, saleTotal);
  const yesterdayTotal = sum(yesterdaySales, saleTotal);
  const monthTotal = sum(monthSales, saleTotal);
  const monthExpenseTotal = sum(monthExpenses, (item) => item.amount);
  const salaryTotal = sum(
    payments.filter((item) => item.payment_type !== "deduction"),
    (item) => item.amount,
  );

  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = daysAgoDate(6 - index);
    return {
      date,
      label: shortDate(date),
      sales: sum(
        weekSales.filter((item) => item.sale_date === date),
        saleTotal,
      ),
      expenses: sum(
        weekExpenses.filter((item) => item.expense_date === date),
        (item) => item.amount,
      ),
    };
  });

  const relevantShops = shopId ? shopList.filter((shop) => shop.id === shopId) : shopList;
  const shopPerformance = relevantShops.map((shop) => ({
    shopId: shop.id,
    shopName: shop.name,
    sales: sum(
      monthSales.filter((item) => item.shop_id === shop.id),
      saleTotal,
    ),
    expenses: sum(
      monthExpenses.filter((item) => item.shop_id === shop.id),
      (item) => item.amount,
    ),
  }));

  const shopMap = new Map(shopList.map((shop) => [shop.id, shop.name]));
  const employeeMap = new Map(employeeList.map((employee) => [employee.id, employee.full_name]));
  const recent: DashboardData["recent"] = [
    ...monthSales.slice(0, 8).map((item) => ({
      id: item.id,
      type: "sale" as const,
      title: "Savdo kiritildi",
      subtitle: `${shopMap.get(item.shop_id) ?? "Do‘kon"} · ${item.description || "Kunlik savdo"}`,
      amount: saleTotal(item),
      date: item.created_at,
    })),
    ...monthExpenses.slice(0, 8).map((item) => ({
      id: item.id,
      type: "expense" as const,
      title: item.category,
      subtitle: `${shopMap.get(item.shop_id) ?? "Do‘kon"} · ${item.description}`,
      amount: item.amount,
      date: item.created_at,
    })),
    ...payments.slice(0, 6).map((item) => ({
      id: item.id,
      type: "salary" as const,
      title: item.payment_type === "advance" ? "Avans berildi" : "Oylik to‘landi",
      subtitle: employeeMap.get(item.employee_id) ?? "Ishchi",
      amount: item.amount,
      date: item.created_at,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return {
    summary: {
      todayTotal,
      todayCash: sum(todaySales, (item) => item.cash_amount),
      todayCard: sum(todaySales, (item) => item.card_amount),
      monthTotal,
      monthExpenses: monthExpenseTotal,
      monthSalaries: salaryTotal,
      monthNet: monthTotal - monthExpenseTotal - salaryTotal,
      comparedToYesterday: yesterdayTotal ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : null,
    },
    chart,
    shopPerformance,
    recent,
  };
}

export async function getMonthlyReport(month: string, shopId?: string): Promise<MonthlyReport> {
  const range = monthRange(month);
  const previous = previousMonth(month);
  const previousRange = monthRange(previous);
  const [monthSales, monthExpenses, payments, shopList, previousSales] = await Promise.all([
    listSales({ shopId, ...range }),
    listExpenses({ shopId, ...range }),
    listSalaryPayments({ shopId, month }),
    listShops(),
    listSales({ shopId, ...previousRange }),
  ]);

  const totalSales = sum(monthSales, saleTotal);
  const expenseTotal = sum(monthExpenses, (item) => item.amount);
  const salaryTotal = sum(
    payments.filter((item) => item.payment_type !== "deduction"),
    (item) => item.amount,
  );
  const previousTotal = sum(previousSales, saleTotal);
  const lastDay = Number(range.to.slice(-2));
  const daily = Array.from({ length: lastDay }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    return {
      date,
      label: String(index + 1),
      sales: sum(
        monthSales.filter((item) => item.sale_date === date),
        saleTotal,
      ),
      expenses: sum(
        monthExpenses.filter((item) => item.expense_date === date),
        (item) => item.amount,
      ),
    };
  });

  const categoryMap = new Map<string, number>();
  for (const item of monthExpenses) {
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.amount);
  }
  const categories = [...categoryMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const relevantShops = shopId ? shopList.filter((item) => item.id === shopId) : shopList;
  const shopResults = relevantShops.map((shop) => {
    const shopSales = sum(
      monthSales.filter((item) => item.shop_id === shop.id),
      saleTotal,
    );
    const shopExpenses = sum(
      monthExpenses.filter((item) => item.shop_id === shop.id),
      (item) => item.amount,
    );
    const shopSalaries = sum(
      payments.filter((item) => item.shop_id === shop.id && item.payment_type !== "deduction"),
      (item) => item.amount,
    );
    return {
      name: shop.name,
      sales: shopSales,
      expenses: shopExpenses + shopSalaries,
      net: shopSales - shopExpenses - shopSalaries,
    };
  });

  return {
    month,
    summary: {
      totalSales,
      cash: sum(monthSales, (item) => item.cash_amount),
      card: sum(monthSales, (item) => item.card_amount),
      expenses: expenseTotal,
      salaries: salaryTotal,
      net: totalSales - expenseTotal - salaryTotal,
      previousSales: previousTotal,
      growth: previousTotal ? ((totalSales - previousTotal) / previousTotal) * 100 : null,
      saleDays: new Set(monthSales.map((item) => item.sale_date)).size,
    },
    daily,
    categories,
    shops: shopResults,
  };
}
