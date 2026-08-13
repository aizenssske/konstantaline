"use client";

import { CircleDollarSign, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, Field } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(process.env.NODE_ENV === "development" ? "admin" : "");
  const [password, setPassword] = useState(process.env.NODE_ENV === "development" ? "admin12345" : "");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-form-side">
        <div className="login-box">
          <Link className="brand" href="/">
            <span className="brand-mark"><CircleDollarSign size={24} /></span>
            <span><strong>Moliya</strong><small>do‘kon hisoboti</small></span>
          </Link>
          <h1>Xush kelibsiz</h1>
          <p>Do‘konlaringiz moliyaviy boshqaruv paneliga kirish uchun ma’lumotlaringizni kiriting.</p>
          <form className="login-form" onSubmit={submit}>
            <Field label="Foydalanuvchi nomi">
              <div className="password-wrap">
                <input className="field-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Login" autoComplete="username" required />
                <span className="password-toggle"><UserRound size={17} /></span>
              </div>
            </Field>
            <Field label="Parol">
              <div className="password-wrap">
                <input className="field-input" type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" required />
                <button className="password-toggle" type="button" onClick={() => setVisible(!visible)} aria-label="Parolni ko‘rsatish">
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <Button type="submit" disabled={loading}><LockKeyhole size={16} />{loading ? "Kirilmoqda..." : "Tizimga kirish"}</Button>
          </form>
          {process.env.NODE_ENV === "development" && <div className="login-hint"><strong>Demo kirish:</strong> admin / admin12345. Production’da bu ma’lumotlarni Vercel muhit o‘zgaruvchilarida albatta almashtiring.</div>}
          <div className="login-footer">© {new Date().getFullYear()} Moliya. Xavfsiz va sodda do‘kon boshqaruvi.</div>
        </div>
      </section>
      <section className="login-visual">
        <div className="visual-content">
          <div className="visual-kicker"><i /> Moliyaviy nazorat</div>
          <h2>Biznes raqamlarini bir qarashda ko‘ring.</h2>
          <p>Har bir savdo, xarajat va xodim to‘lovini tartibli yuriting. Qarorlarni aniq ma’lumotlar asosida qabul qiling.</p>
          <div className="visual-card">
            <div className="visual-card-top"><span>Oylik sof foyda</span><span>↑ 12.4%</span></div>
            <div className="visual-number">84 250 000 so‘m</div>
            <div className="visual-bars">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
