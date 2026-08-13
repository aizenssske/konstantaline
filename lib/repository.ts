import { getDemoStore, withNewRecord } from "./demo-store";
import {
  currentMonthTashkent,
  daysAgoDate,
  monthRange,
  previousMonth,
  shortDate,
  todayTashkent,
} from "./format";
import { getSupabaseAdmin, isDemoMode } from "./supabase";
import type {
  DashboardData,
  Employee,
  Expense,
  MonthlyReport,
  Sale,
  SalaryPayment,
  Shop,
} from "./types";

type DateFilter = { shopId?: string; from?: string; to?: string };

const asNumber = (value: unknown) => Number(value ?? 0);

function normalizeSale(row: Record<string, unknown>): Sale {
  return { ...(row as unknown as Sale), cash_amount: asNumber(row.cash_amount), card_amount: asNumber(row.card_amount) };
}
function normalizeExpense(row: Record<string, unknown>): Expense {
  return { ...(row as unknown as Expense), amount: asNumber(row.amount) };
}
function normalizeEmployee(row: Record<string, unknown>): Employee {
  return { ...(row as unknown as Employee), monthly_salary: asNumber(row.monthly_salary) };
}
function normalizePayment(row: Record<string, unknown>): SalaryPayment {
  return { ...(row as unknown as SalaryPayment), amount: asNumber(row.amount) };
}

function assertData<T>(data: T | null, error: { message: string } | null) {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function listShops(includeInactive = false): Promise<Shop[]> {
  if (isDemoMode()) {
    return getDemoStore().shops
      .filter((shop) => includeInactive || shop.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  let query = getSupabaseAdmin()!.from("shops").select("*").order("name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  return assertData<Shop[]>(data as Shop[] | null, error);
}

export async function createShop(input: Pick<Shop, "name" | "address">): Promise<Shop> {
  if (isDemoMode()) {
    const record = withNewRecord({ ...input, is_active: true }) as Shop;
    getDemoStore().shops.push(record);
    return record;
  }
  const { data, error } = await getSupabaseAdmin()!
    .from("shops")
    .insert({ ...input, is_active: true })
    .select("*")
    .single();
  return assertData<Shop>(data as Shop | null, error);
}

export async function updateShop(id: string, input: Partial<Pick<Shop, "name" | "address" | "is_active">>): Promise<Shop> {
  if (isDemoMode()) {
    const shop = getDemoStore().shops.find((item) => item.id === id);
    if (!shop) throw new Error("Do‘kon topilmadi");
    Object.assign(shop, input);
    return shop;
  }
  const { data, error } = await getSupabaseAdmin()!
    .from("shops")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  return assertData<Shop>(data as Shop | null, error);
}

export async function listSales(filter: DateFilter = {}): Promise<Sale[]> {
  if (isDemoMode()) {
    return getDemoStore().sales
      .filter((item) => !filter.shopId || item.shop_id === filter.shopId)
      .filter((item) => !filter.from || item.sale_date >= filter.from)
      .filter((item) => !filter.to || item.sale_date <= filter.to)
      .sort((a, b) => b.sale_date.localeCompare(a.sale_date) || b.created_at.localeCompare(a.created_at));
  }
  let query = getSupabaseAdmin()!.from("sales").select("*").order("sale_date", { ascending: false }).order("created_at", { ascending: false });
  if (filter.shopId) query = query.eq("shop_id", filter.shopId);
  if (filter.from) query = query.gte("sale_date", filter.from);
  if (filter.to) query = query.lte("sale_date", filter.to);
  const { data, error } = await query;
  return assertData<Record<string, unknown>[]>(data, error).map(normalizeSale);
}

export async function createSale(input: Omit<Sale, "id" | "created_at">): Promise<Sale> {
  if (isDemoMode()) {
    const record = withNewRecord(input) as Sale;
    getDemoStore().sales.unshift(record);
    return record;
  }
  const { data, error } = await getSupabaseAdmin()!.from("sales").insert(input).select("*").single();
  return normalizeSale(assertData<Record<string, unknown>>(data, error));
}

export async function deleteSale(id: string) {
  if (isDemoMode()) {
    const store = getDemoStore();
    store.sales = store.sales.filter((item) => item.id !== id);
    return;
  }
  const { error } = await getSupabaseAdmin()!.from("sales").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listExpenses(filter: DateFilter = {}): Promise<Expense[]> {
  if (isDemoMode()) {
    return getDemoStore().expenses
      .filter((item) => !filter.shopId || item.shop_id === filter.shopId)
      .filter((item) => !filter.from || item.expense_date >= filter.from)
      .filter((item) => !filter.to || item.expense_date <= filter.to)
      .sort((a, b) => b.expense_date.localeCompare(a.expense_date) || b.created_at.localeCompare(a.created_at));
  }
  let query = getSupabaseAdmin()!.from("expenses").select("*").order("expense_date", { ascending: false }).order("created_at", { ascending: false });
  if (filter.shopId) query = query.eq("shop_id", filter.shopId);
  if (filter.from) query = query.gte("expense_date", filter.from);
  if (filter.to) query = query.lte("expense_date", filter.to);
  const { data, error } = await query;
  return assertData<Record<string, unknown>[]>(data, error).map(normalizeExpense);
}

export async function createExpense(input: Omit<Expense, "id" | "created_at">): Promise<Expense> {
  if (isDemoMode()) {
    const record = withNewRecord(input) as Expense;
    getDemoStore().expenses.unshift(record);
    return record;
  }
  const { data, error } = await getSupabaseAdmin()!.from("expenses").insert(input).select("*").single();
  return normalizeExpense(assertData<Record<string, unknown>>(data, error));
}

export async function deleteExpense(id: string) {
  if (isDemoMode()) {
    const store = getDemoStore();
    store.expenses = store.expenses.filter((item) => item.id !== id);
    return;
  }
  const { error } = await getSupabaseAdmin()!.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listEmployees(shopId?: string, includeInactive = false): Promise<Employee[]> {
  if (isDemoMode()) {
    return getDemoStore().employees
      .filter((item) => !shopId || item.shop_id === shopId)
      .filter((item) => includeInactive || item.is_active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }
  let query = getSupabaseAdmin()!.from("employees").select("*").order("full_name");
  if (shopId) query = query.eq("shop_id", shopId);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  return assertData<Record<string, unknown>[]>(data, error).map(normalizeEmployee);
}

export async function createEmployee(input: Omit<Employee, "id" | "created_at" | "is_active">): Promise<Employee> {
  const payload = { ...input, is_active: true };
  if (isDemoMode()) {
    const record = withNewRecord(payload) as Employee;
    getDemoStore().employees.push(record);
    return record;
  }
  const { data, error } = await getSupabaseAdmin()!.from("employees").insert(payload).select("*").single();
  return normalizeEmployee(assertData<Record<string, unknown>>(data, error));
}

export async function updateEmployee(id: string, input: Partial<Pick<Employee, "full_name" | "role" | "phone" | "monthly_salary" | "is_active">>): Promise<Employee> {
  if (isDemoMode()) {
    const employee = getDemoStore().employees.find((item) => item.id === id);
    if (!employee) throw new Error("Ishchi topilmadi");
    Object.assign(employee, input);
    return employee;
  }
  const { data, error } = await getSupabaseAdmin()!.from("employees").update(input).eq("id", id).select("*").single();
  return normalizeEmployee(assertData<Record<string, unknown>>(data, error));
}

export async function listSalaryPayments(filter: { shopId?: string; employeeId?: string; month?: string } = {}): Promise<SalaryPayment[]> {
  if (isDemoMode()) {
    return getDemoStore().salaryPayments
      .filter((item) => !filter.shopId || item.shop_id === filter.shopId)
      .filter((item) => !filter.employeeId || item.employee_id === filter.employeeId)
      .filter((item) => !filter.month || item.salary_month === filter.month)
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at));
  }
  let query = getSupabaseAdmin()!.from("salary_payments").select("*").order("payment_date", { ascending: false }).order("created_at", { ascending: false });
  if (filter.shopId) query = query.eq("shop_id", filter.shopId);
  if (filter.employeeId) query = query.eq("employee_id", filter.employeeId);
  if (filter.month) query = query.eq("salary_month", filter.month);
  const { data, error } = await query;
  return assertData<Record<string, unknown>[]>(data, error).map(normalizePayment);
}

export async function createSalaryPayment(input: Omit<SalaryPayment, "id" | "created_at">): Promise<SalaryPayment> {
  if (isDemoMode()) {
    const record = withNewRecord(input) as SalaryPayment;
    getDemoStore().salaryPayments.unshift(record);
    return record;
  }
  const { data, error } = await getSupabaseAdmin()!.from("salary_payments").insert(input).select("*").single();
  return normalizePayment(assertData<Record<string, unknown>>(data, error));
}

const sum = <T>(items: T[], picker: (item: T) => number) => items.reduce((total, item) => total + picker(item), 0);
const saleTotal = (sale: Sale) => sale.cash_amount + sale.card_amount;

export async function getDashboard(shopId?: string): Promise<DashboardData> {
  const today = todayTashkent();
  const month = currentMonthTashkent();
  const { from: monthStart, to: monthEnd } = monthRange(month);
  const weekStart = daysAgoDate(6);
  const yesterday = daysAgoDate(1);

  const [shops, monthSales, monthExpenses, payments, weekSales, weekExpenses, yesterdaySales, employees] = await Promise.all([
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
  const salaryTotal = sum(payments.filter((item) => item.payment_type !== "deduction"), (item) => item.amount);

  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = daysAgoDate(6 - index);
    return {
      date,
      label: shortDate(date),
      sales: sum(weekSales.filter((item) => item.sale_date === date), saleTotal),
      expenses: sum(weekExpenses.filter((item) => item.expense_date === date), (item) => item.amount),
    };
  });

  const relevantShops = shopId ? shops.filter((shop) => shop.id === shopId) : shops;
  const shopPerformance = relevantShops.map((shop) => ({
    shopId: shop.id,
    shopName: shop.name,
    sales: sum(monthSales.filter((item) => item.shop_id === shop.id), saleTotal),
    expenses: sum(monthExpenses.filter((item) => item.shop_id === shop.id), (item) => item.amount),
  }));

  const shopMap = new Map(shops.map((shop) => [shop.id, shop.name]));
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee.full_name]));
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
  const [sales, expenses, payments, shops, previousSales] = await Promise.all([
    listSales({ shopId, ...range }),
    listExpenses({ shopId, ...range }),
    listSalaryPayments({ shopId, month }),
    listShops(),
    listSales({ shopId, ...previousRange }),
  ]);

  const totalSales = sum(sales, saleTotal);
  const expenseTotal = sum(expenses, (item) => item.amount);
  const salaryTotal = sum(payments.filter((item) => item.payment_type !== "deduction"), (item) => item.amount);
  const previousTotal = sum(previousSales, saleTotal);
  const lastDay = Number(range.to.slice(-2));
  const daily = Array.from({ length: lastDay }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    return {
      date,
      label: String(index + 1),
      sales: sum(sales.filter((item) => item.sale_date === date), saleTotal),
      expenses: sum(expenses.filter((item) => item.expense_date === date), (item) => item.amount),
    };
  });

  const categoryMap = new Map<string, number>();
  for (const item of expenses) categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.amount);
  const categories = [...categoryMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const relevantShops = shopId ? shops.filter((item) => item.id === shopId) : shops;
  const shopResults = relevantShops.map((shop) => {
    const shopSales = sum(sales.filter((item) => item.shop_id === shop.id), saleTotal);
    const shopExpenses = sum(expenses.filter((item) => item.shop_id === shop.id), (item) => item.amount);
    const shopSalaries = sum(payments.filter((item) => item.shop_id === shop.id && item.payment_type !== "deduction"), (item) => item.amount);
    return { name: shop.name, sales: shopSales, expenses: shopExpenses + shopSalaries, net: shopSales - shopExpenses - shopSalaries };
  });

  return {
    month,
    summary: {
      totalSales,
      cash: sum(sales, (item) => item.cash_amount),
      card: sum(sales, (item) => item.card_amount),
      expenses: expenseTotal,
      salaries: salaryTotal,
      net: totalSales - expenseTotal - salaryTotal,
      previousSales: previousTotal,
      growth: previousTotal ? ((totalSales - previousTotal) / previousTotal) * 100 : null,
      saleDays: new Set(sales.map((item) => item.sale_date)).size,
    },
    daily,
    categories,
    shops: shopResults,
  };
}
