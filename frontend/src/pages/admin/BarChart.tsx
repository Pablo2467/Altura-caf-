export interface Bar {
  key: string;
  label: string;
  value: number;
  tooltip: string;
}

interface Props {
  bars: Bar[];
  emptyText: string;
}

export default function BarChart({ bars, emptyText }: Props) {
  const max = Math.max(0, ...bars.map((b) => b.value));
  if (max === 0) {
    return <p className="py-10 text-center text-sm text-zinc-500">{emptyText}</p>;
  }
  const step = Math.ceil(bars.length / 16); // evita que las etiquetas se encimen

  return (
    <div>
      <div className="flex h-44 items-end gap-1">
        {bars.map((b) => (
          <div key={b.key} title={b.tooltip} className="flex h-full min-w-0 flex-1 items-end">
            <div
              className={`w-full rounded-t-md transition-colors ${
                b.value > 0 ? 'bg-caramelo/80 hover:bg-caramelo' : 'bg-white/5'
              }`}
              style={{ height: `${b.value > 0 ? Math.max((b.value / max) * 100, 3) : 2}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1">
        {bars.map((b, i) => (
          <span key={b.key} className="flex min-w-0 flex-1 justify-center text-[10px] text-zinc-500">
            <span className="whitespace-nowrap">{i % step === 0 ? b.label : ''}</span>
          </span>
        ))}
      </div>
    </div>
  );
}