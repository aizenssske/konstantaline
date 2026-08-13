"use client";

import { Bot, KeyRound, Link2, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { Button, EmptyState, Field, LoadingBlock } from "./ui";
import type { TelegramLink } from "@/lib/types";

function displayName(link: TelegramLink) {
  return link.first_name || (link.username ? `@${link.username}` : `ID ${link.telegram_id}`);
}

function linkedWhen(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function BotClient() {
  const [links, setLinks] = useState<TelegramLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/telegram-links");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setLinks(result.links);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ulangan profillarni olib bo‘lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/telegram-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success(`${displayName(result.link)} ulandi`);
      setCode("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kodni tasdiqlab bo‘lmadi");
    } finally {
      setSaving(false);
    }
  };

  const unlink = async (link: TelegramLink) => {
    if (!confirm(`${displayName(link)} profilini botdan uzasizmi?`)) return;
    const response = await fetch(`/api/telegram-links/${link.id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Profil uzildi");
      await load();
    } else toast.error("Profilni uzib bo‘lmadi");
  };

  return (
    <>
      <PageHeader
        title="Telegram bot"
        description="Faqat shu yerda ulangan Telegram profillar botdan foydalana oladi."
      />

      <section className="settings-grid">
        <article className="card">
          <header className="card-header">
            <div>
              <h2>Profilni ulash</h2>
              <p>Botdan olingan 1 daqiqalik kodni kiriting</p>
            </div>
            <span className="badge badge-green">{links.length} ta ulangan</span>
          </header>

          <ol className="bot-steps">
            <li>Telegram’da botni oching va <code>/start</code> bosing</li>
            <li><code>/kod</code> buyrug‘ini yuboring</li>
            <li>Kelgan 6 xonali kodni 1 daqiqa ichida shu yerga yozing</li>
          </ol>

          <form onSubmit={submit} className="link-code-form">
            <Field label="Vaqtinchalik kod" hint="Kod 60 soniyadan so‘ng o‘z kuchini yo‘qotadi">
              <input
                className="link-code-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </Field>
            <Button type="submit" disabled={saving || code.length !== 6}>
              <KeyRound size={15} />
              {saving ? "Tekshirilmoqda..." : "Profilni ulash"}
            </Button>
          </form>
        </article>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <article className="card info-card">
            <h3>Qanday ishlaydi</h3>
            <div className="info-list">
              <div>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Bot size={14} /> Bot
                </span>
                <strong>/start va /kod</strong>
              </div>
              <div>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <KeyRound size={14} /> Kod
                </span>
                <strong>1 daqiqa</strong>
              </div>
              <div>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <ShieldCheck size={14} /> Ruxsat
                </span>
                <strong>Faqat ulanganlar</strong>
              </div>
            </div>
          </article>
          <article className="card info-card">
            <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span className="stat-icon green">
                <Link2 size={17} />
              </span>
              <div>
                <h3 style={{ marginBottom: 5 }}>Ulanmagan profil ishlamaydi</h3>
                <p style={{ margin: 0, color: "#6e7d75", fontSize: 10.5, lineHeight: 1.6 }}>
                  Bot savdo, xarajat va hisobotlarni faqat shu ro‘yxatdagi Telegram hisoblariga ochadi.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="card table-card" style={{ marginTop: 16 }}>
        <header className="card-header">
          <div>
            <h2>Ulangan profillar</h2>
            <p>Botga ruxsati bor Telegram hisoblar</p>
          </div>
          <UserRound size={18} color="#16785d" />
        </header>
        {loading ? (
          <LoadingBlock rows={4} />
        ) : !links.length ? (
          <EmptyState
            icon={<Bot size={21} />}
            title="Hali hech kim ulanmagan"
            text="Botdan /kod oling va yuqoridagi maydonga kiriting."
          />
        ) : (
          <div className="shop-list">
            {links.map((link) => (
              <div className="shop-row" key={link.id}>
                <span>
                  <UserRound size={18} />
                </span>
                <div>
                  <h3>{displayName(link)}</h3>
                  <p>
                    {link.username ? `@${link.username} · ` : ""}
                    ID {link.telegram_id} · {linkedWhen(link.linked_at)}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => void unlink(link)}>
                  <Trash2 size={14} /> Uzish
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
