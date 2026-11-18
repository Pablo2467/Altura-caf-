import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet } from "../../services/api";
import type { Branch, Category } from "../../types";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import BranchPicker from "../../components/BranchPicker";
import { Link } from "react-router-dom";

const ICONS = ["☕", "🧊", "🥤", "🍰"];

export default function PublicMenu() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.resolvedLanguage === "en";

  const [branchId, setBranchId] = useState<number | null>(() => {
    const saved = localStorage.getItem("branchId");
    return saved ? Number(saved) : null;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiGet<Branch[]>("/public/branches"),
  });
  const menu = useQuery({
    queryKey: ["menu"],
    queryFn: () => apiGet<Category[]>("/public/menu"),
  });

  const branch = branches.data?.find((b) => b.id === branchId) ?? null;
  const showPicker = pickerOpen || (branches.isSuccess && !branch);

  const selectBranch = (id: number) => {
    setBranchId(id);
    localStorage.setItem("branchId", String(id));
    setPickerOpen(false);
  };

  const money = (n: number) =>
    new Intl.NumberFormat(isEn ? "en-US" : "es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (menu.data ?? [])
      .filter((c) => activeCat === "all" || c.id === activeCat)
      .map((c) => ({
        ...c,
        products: c.products.filter(
          (p) => !q || (isEn ? p.nameEn : p.nameEs).toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.products.length > 0);
  }, [menu.data, activeCat, search, isEn]);

  return (
    <div className="min-h-screen">
      {/* Encabezado */}
      <header className="sticky top-0 z-40 border-b border-cafe/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-xl font-bold text-cafe">☕ {t("brand")}</span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-cafe hover:underline"
            >
              {t("staffAccess")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        {/* Hero */}
        <section className="py-8">
          <h1 className="text-3xl font-bold text-cafe sm:text-4xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-1 text-cafe-oscuro/70">{t("heroSub")}</p>
        </section>

        {/* Sede actual */}
        {branch && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cafe/10 bg-white p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">📍 {branch.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    branch.isOpen
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {branch.isOpen ? t("open") : t("closed")}
                </span>
              </div>
              <p className="text-sm text-cafe-oscuro/60">{branch.address}</p>
            </div>
            <button
              onClick={() => setPickerOpen(true)}
              className="rounded-full border border-cafe px-4 py-1.5 text-sm font-semibold text-cafe hover:bg-cafe hover:text-white"
            >
              {t("change")}
            </button>
          </div>
        )}

        {/* Categorías y búsqueda */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCat("all")}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                activeCat === "all"
                  ? "bg-cafe text-white"
                  : "bg-white text-cafe"
              }`}
            >
              {t("all")}
            </button>
            {menu.data?.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                  activeCat === c.id
                    ? "bg-cafe text-white"
                    : "bg-white text-cafe"
                }`}
              >
                {isEn ? c.nameEn : c.nameEs}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full rounded-full border border-cafe/15 bg-white px-5 py-2.5 outline-none focus:border-caramelo"
          />
        </div>

        {/* Estados */}
        {menu.isLoading && <p>{t("loading")}</p>}
        {menu.isError && <p className="text-red-600">{t("error")}</p>}
        {menu.isSuccess && visible.length === 0 && (
          <p className="text-cafe-oscuro/60">{t("noResults")}</p>
        )}

        {/* Productos */}
        {visible.map((c) => (
          <section key={c.id} className="mb-10">
            <h2 className="mb-4 text-2xl font-bold text-cafe">
              {isEn ? c.nameEn : c.nameEs}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.products.map((p) => (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-cafe/10 bg-white shadow-sm"
                >
                  <div className="flex h-32 items-center justify-center bg-linear-to-br from-caramelo/20 to-cafe/20 text-5xl">
                    {ICONS[(c.sortOrder - 1) % ICONS.length]}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">
                      {isEn ? p.nameEn : p.nameEs}
                    </h3>
                    <p className="mt-1 min-h-10 text-sm text-cafe-oscuro/65">
                      {isEn ? p.descriptionEn : p.descriptionEs}
                    </p>
                    <p className="mt-3 text-lg font-bold text-caramelo">
                      {money(p.price)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Selector de sede */}
      {showPicker && branches.data && (
        <BranchPicker
          branches={branches.data}
          selectedId={branchId}
          onSelect={selectBranch}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
