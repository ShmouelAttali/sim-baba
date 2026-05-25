interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  note?: string;
  highlight?: boolean;
}

export default function CounterControl({ label, value, onChange, note, highlight }: Props) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${highlight ? "bg-amber-50" : ""}`}>
      <span className="text-stone-600 text-sm w-24 text-right">{label}</span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded font-bold text-lg leading-none transition-colors flex items-center justify-center"
      >
        −
      </button>
      <span className="counter-value font-bold text-stone-800 text-base">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded font-bold text-lg leading-none transition-colors flex items-center justify-center"
      >
        +
      </button>
      {note && <span className="text-xs text-stone-400 mr-1">{note}</span>}
    </div>
  );
}
