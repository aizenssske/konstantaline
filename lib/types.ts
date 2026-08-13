export type Shop = {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
  created_at: string;
};

export type Sale = {
  id: string;
  shop_id: string;
  sale_date: string;
  cash_amount: number;
  card_amount: number;
  description: string;
  created_at: string;
};

export const EXPENSE_CATEGORIES = [
  "Ijara",
  "Kommunal",
  "Mahsulot",
  "Transport",
  "Soliq",
  "Reklama",
  "Ta’mirlash",
  "Boshqa",
] as const;

export type Expense = {
  id: string;
  shop_id: string;
  expense_date: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
};

export type Employee = {
  id: string;
  shop_id: string;
  full_name: string;
  role: string;
  phone: string;
  monthly_salary: number;
  hired_at: string;
  is_active: boolean;
  created_at: string;
};

export const PAYMENT_TYPES = ["advance", "salary", "bonus", "deduction"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export type SalaryPayment = {
  id: string;
  employee_id: string;
  shop_id: string;
  payment_date: string;
  salary_month: string;
  amount: number;
  payment_type: PaymentType;
  description: string;
  created_at: string;
};

export type DashboardData = {
  summary: {
    todayTotal: number;
    todayCash: number;
    todayCard: number;
    monthTotal: number;
    monthExpenses: number;
    monthSalaries: number;
    monthNet: number;
    comparedToYesterday: number | null;
  };
  chart: Array<{
    date: string;
    label: string;
    sales: number;
    expenses: number;
  }>;
  shopPerformance: Array<{
    shopId: string;
    shopName: string;
    sales: number;
    expenses: number;
  }>;
  recent: Array<{
    id: string;
    type: "sale" | "expense" | "salary";
    title: string;
    subtitle: string;
    amount: number;
    date: string;
  }>;
};

export type MonthlyReport = {
  month: string;
  summary: {
    totalSales: number;
    cash: number;
    card: number;
    expenses: number;
    salaries: number;
    net: number;
    previousSales: number;
    growth: number | null;
    saleDays: number;
  };
  daily: Array<{ date: string; label: string; sales: number; expenses: number }>;
  categories: Array<{ name: string; value: number }>;
  shops: Array<{ name: string; sales: number; expenses: number; net: number }>;
};
