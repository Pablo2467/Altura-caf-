import { useTranslation } from "react-i18next";
import type { Branch } from "../types";
import ProductImage from "./ProductImage";

interface Props {
  branches: Branch[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose?: () => void;
}

export default function BranchPicker({
  branches,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-cafe">
              {t("chooseBranch")}
            </h2>
            <p className="text-sm text-cafe-oscuro/70">
              {t("chooseBranchSub")}
            </p>
          </div>
          {onClose && selectedId && (
            <button
              onClick={onClose}
              className="text-2xl leading-none text-cafe/60"
              aria-label="close"
            >
              ×
            </button>
          )}
        </div>

        <div className="space-y-3">
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`w-full rounded-2xl border p-4 text-left transition hover:border-caramelo ${
                b.id === selectedId
                  ? "border-caramelo bg-caramelo/10"
                  : "border-cafe/15"
              }`}
            >
              <ProductImage
                src={b.imageUrl}
                alt={b.name}
                fallback="☕"
                className="mb-3 h-24 w-full rounded-xl"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{b.name}</span>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                    b.isOpen
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {b.isOpen ? t("open") : t("closed")}
                </span>
              </div>
              <p className="mt-1 text-sm text-cafe-oscuro/70">📍 {b.address}</p>
              <p className="mt-1 text-xs text-cafe-oscuro/60">
                🕒{" "}
                {b.isOpen
                  ? t("until", { time: b.closeTime })
                  : t("opensAt", { time: b.openTime })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
