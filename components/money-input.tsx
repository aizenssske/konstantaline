"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { digitsFromSomInput, formatSomInput } from "@/lib/format";

export function MoneyInput({
  name,
  defaultValue,
  required = false,
  allowZero = false,
  placeholder = "0.0",
}: {
  name: string;
  defaultValue?: number | string;
  required?: boolean;
  allowZero?: boolean;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [digits, setDigits] = useState(() => {
    const amount = typeof defaultValue === "number" ? defaultValue : Number(defaultValue);
    if (!Number.isFinite(amount) || amount < 0) return allowZero ? "0" : "";
    return String(Math.round(amount));
  });

  const display = digits ? formatSomInput(Number(digits)) : "";
  const numeric = digits === "" ? (allowZero ? "0" : "") : digits;

  useLayoutEffect(() => {
    const field = inputRef.current;
    if (!field || document.activeElement !== field) return;
    const dot = field.value.lastIndexOf(".");
    if (dot >= 0) field.setSelectionRange(dot, dot);
  }, [display]);

  return (
    <div className="currency-input">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={display}
        onChange={(event) => {
          const next = digitsFromSomInput(event.target.value);
          if (next.length > 12) return;
          setDigits(next);
        }}
        required={required}
        aria-label="Summa"
      />
      <input type="hidden" name={name} value={numeric} />
      <span>so‘m</span>
    </div>
  );
}
