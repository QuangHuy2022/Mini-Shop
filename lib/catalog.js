"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import { mapProductRow } from "./admin-domain.mjs";

export function useCatalog() {
  const [catalog, setCatalog] = useState({
    products: [],
    categories: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const supabase = createClient();
        const [productsResult, categoriesResult] = await Promise.all([
          supabase
            .from("products")
            .select("id,name,price_vnd,category_id,description,image_path,is_active")
            .eq("is_active", true)
            .order("id"),
          supabase
            .from("categories")
            .select("id,name,icon,sort_order")
            .order("sort_order"),
        ]);

        if (productsResult.error) throw productsResult.error;
        if (categoriesResult.error) throw categoriesResult.error;

        if (!cancelled) {
          setCatalog({
            products: productsResult.data.map(mapProductRow),
            categories: [
              { id: "all", label: "Tất cả", icon: "▦" },
              ...categoriesResult.data.map((category) => ({
                id: category.id,
                label: category.name,
                icon: category.icon,
              })),
            ],
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setCatalog((current) => ({
            ...current,
            loading: false,
            error: error instanceof Error ? error.message : String(error),
          }));
        }
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  return catalog;
}
