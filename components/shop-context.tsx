"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Shop } from "@/lib/types";

type ShopContextValue = {
  shops: Shop[];
  selectedShopId: string;
  setSelectedShopId: (id: string) => void;
  selectedShop: Shop | null;
  loading: boolean;
  demoMode: boolean;
  refreshShops: () => Promise<void>;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopIdState] = useState("all");
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const refreshShops = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/shops");
      if (!response.ok) return;
      const result = await response.json();
      setShops(result.shops);
      setDemoMode(Boolean(result.demoMode));
      const saved = localStorage.getItem("moliya-selected-shop");
      if (saved && (saved === "all" || result.shops.some((shop: Shop) => shop.id === saved))) {
        setSelectedShopIdState(saved);
      } else {
        setSelectedShopIdState("all");
        localStorage.setItem("moliya-selected-shop", "all");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshShops();
  }, [refreshShops]);

  const setSelectedShopId = (id: string) => {
    setSelectedShopIdState(id);
    localStorage.setItem("moliya-selected-shop", id);
  };

  const value = useMemo(
    () => ({
      shops,
      selectedShopId,
      setSelectedShopId,
      selectedShop: shops.find((shop) => shop.id === selectedShopId) ?? null,
      loading,
      demoMode,
      refreshShops,
    }),
    [shops, selectedShopId, loading, demoMode, refreshShops],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used inside ShopProvider");
  return context;
}
