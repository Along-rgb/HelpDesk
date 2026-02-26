"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSelectCategories } from "./hooks/useSelectCategories";
import { useCategoryIconsSelect } from "../MenuApps/hooks/useCategoryIconsSelect";
import { getCategoryIconProxyUrl } from "../MenuApps/utils/iconUrl";
import { MenuCard } from "./MenuCard";

export default function GroupProblemPage() {
  const { items: categoryItems, loading: categoryLoading, error: categoryError } = useSelectCategories(true);
  const { items: categoryIconSelectItems } = useCategoryIconsSelect(null, true);

  const categoryIconMap = useMemo(() => {
    const m = new Map<number, string>();
    categoryIconSelectItems.forEach((i) =>
      m.set(i.id, getCategoryIconProxyUrl(i.catIcon ?? ""))
    );
    return m;
  }, [categoryIconSelectItems]);

  const isLoading = categoryLoading;

  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <i className="pi pi-spin pi-spinner text-4xl" />
      </div>
    );
  }

  if (categoryError) {
    return (
      <div className="flex justify-content-center align-items-center h-screen p-4">
        <div className="text-center text-600">
          <i className="pi pi-exclamation-triangle text-4xl mb-3" />
          <p className="m-0">{categoryError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card mb-0 bg-blue-50">
          <div className="flex flex-column align-items-center justify-content-center mb-4 text-center">
            <h3 className="m-0">ແຈ້ງບັນຫາ</h3>
            <h5 className="m-0 mt-2">
              ກະລຸນາເລືອກໝວດບັນຫາຂອງທ່ານ
            </h5>
          </div>

          <div className="grid">
            {categoryItems.map((item) => (
              <Link
                key={item.id}
                href={`/uikit/ticket?categoryId=${item.id}`}
                className="col-12 md:col-4 p-0 no-underline"
                style={{ display: "contents" }}
              >
                <MenuCard
                  title={item.title}
                  description={item.description}
                  iconUrl={
                    item.catIcon
                      ? getCategoryIconProxyUrl(item.catIcon)
                      : (item.catIconId != null ? categoryIconMap.get(item.catIconId) ?? "" : "")
                  }
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
