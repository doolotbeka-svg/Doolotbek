import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ImageUp, Plus, Trash2 } from 'lucide-react';
import { isImageKey, labelFor, SELECT_OPTIONS } from './labels';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface EditorContext {
  uploadImage: (file: File) => Promise<string>;
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-[#0A0A0C] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#8B5CF6] focus:outline-none';

function isObject(v: unknown): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Builds an empty item shaped like an existing one (used for “Add”). */
function blankLike(sample: Json): Json {
  if (Array.isArray(sample)) return [];
  if (isObject(sample)) {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(sample)) out[k] = blankLike(v);
    return out;
  }
  if (typeof sample === 'number') return 0;
  return '';
}

function itemTitle(item: Json, index: number): string {
  if (typeof item === 'string') return item || `#${index + 1}`;
  if (isObject(item)) {
    const ru = item.ru;
    const candidates = [
      isObject(ru) ? ru.title : undefined,
      item.name,
      item.title,
      item.value && item.label ? `${item.value} — ${item.label}` : undefined,
      item.id,
    ];
    const hit = candidates.find((c) => typeof c === 'string' && c.trim());
    if (typeof hit === 'string') return hit;
  }
  return `#${index + 1}`;
}

export function FieldEditor({
  fieldKey,
  value,
  onChange,
  ctx,
  depth = 0,
}: {
  fieldKey: string;
  value: Json;
  onChange: (next: Json) => void;
  ctx: EditorContext;
  depth?: number;
}) {
  if (Array.isArray(value)) {
    return <ArrayEditor fieldKey={fieldKey} value={value} onChange={onChange} ctx={ctx} depth={depth} />;
  }
  if (isObject(value)) {
    return <ObjectEditor fieldKey={fieldKey} value={value} onChange={onChange} ctx={ctx} depth={depth} />;
  }
  if (isImageKey(fieldKey)) {
    return <ImageField label={labelFor(fieldKey)} value={String(value ?? '')} onChange={onChange} ctx={ctx} />;
  }
  return <ScalarField fieldKey={fieldKey} value={value} onChange={onChange} />;
}

function ScalarField({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: Json;
  onChange: (next: Json) => void;
}) {
  const label = labelFor(fieldKey);
  const options = SELECT_OPTIONS[fieldKey];

  if (typeof value === 'number') {
    return (
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-white/60">{label}</span>
        <input type="number" className={inputCls} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </label>
    );
  }

  const text = String(value ?? '');
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-white/60">{label}</span>}
      {options ? (
        <select className={inputCls} value={text} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : text.length > 70 ? (
        <textarea
          className={`${inputCls} min-h-[84px] resize-y leading-relaxed`}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input className={inputCls} value={text} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function ImageField({
  label,
  value,
  onChange,
  ctx,
}: {
  label: string;
  value: string;
  onChange: (next: Json) => void;
  ctx: EditorContext;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await ctx.uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-white/60">{label}</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0C]">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder="URL картинки" />
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:border-[#00F0C8] disabled:opacity-50"
          >
            <ImageUp className="h-4 w-4 text-[#00F0C8]" aria-hidden="true" />
            {busy ? 'Загрузка…' : 'Загрузить с компьютера'}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function ObjectEditor({
  fieldKey,
  value,
  onChange,
  ctx,
  depth,
}: {
  fieldKey: string;
  value: Record<string, Json>;
  onChange: (next: Json) => void;
  ctx: EditorContext;
  depth: number;
}) {
  const entries = Object.entries(value);
  const body = (
    <div className="space-y-4">
      {entries.map(([k, v]) => (
        <FieldEditor
          key={k}
          fieldKey={k}
          value={v}
          ctx={ctx}
          depth={depth + 1}
          onChange={(next) => onChange({ ...value, [k]: next })}
        />
      ))}
    </div>
  );

  if (depth === 0 || !fieldKey) return body;

  return (
    <details className="group rounded-xl border border-white/[0.08] bg-white/[0.02]" open={depth < 2}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-white">
        {labelFor(fieldKey)}
        <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-white/[0.06] p-4">{body}</div>
    </details>
  );
}

function ArrayEditor({
  fieldKey,
  value,
  onChange,
  ctx,
  depth,
}: {
  fieldKey: string;
  value: Json[];
  onChange: (next: Json) => void;
  ctx: EditorContext;
  depth: number;
}) {
  const simple = value.every((v) => typeof v === 'string');

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const remove = (i: number) => {
    if (!window.confirm('Удалить этот элемент?')) return;
    onChange(value.filter((_, idx) => idx !== i));
  };
  const add = () => {
    const sample = value[value.length - 1];
    onChange([...value, sample === undefined ? '' : blankLike(sample)]);
  };

  const controls = (i: number) => (
    <div className="flex shrink-0 items-center gap-1">
      <IconBtn label="Выше" onClick={() => move(i, i - 1)} disabled={i === 0}>
        <ArrowUp className="h-3.5 w-3.5" />
      </IconBtn>
      <IconBtn label="Ниже" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}>
        <ArrowDown className="h-3.5 w-3.5" />
      </IconBtn>
      <IconBtn label="Удалить" onClick={() => remove(i)} danger>
        <Trash2 className="h-3.5 w-3.5" />
      </IconBtn>
    </div>
  );

  const list = simple ? (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className={inputCls}
            value={String(item)}
            onChange={(e) => onChange(value.map((v, idx) => (idx === i ? e.target.value : v)))}
          />
          {controls(i)}
        </div>
      ))}
    </div>
  ) : (
    <div className="space-y-3">
      {value.map((item, i) => (
        <details key={i} className="group rounded-xl border border-white/[0.08] bg-[#0A0A0C]/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0 truncate text-sm font-medium text-white">
              <span className="mr-2 text-white/40">{i + 1}.</span>
              {itemTitle(item, i)}
            </span>
            <span onClick={(e) => e.preventDefault()}>{controls(i)}</span>
          </summary>
          <div className="border-t border-white/[0.06] p-4">
            <FieldEditor
              fieldKey=""
              value={item}
              ctx={ctx}
              depth={depth + 1}
              onChange={(next) => onChange(value.map((v, idx) => (idx === i ? next : v)))}
            />
          </div>
        </details>
      ))}
    </div>
  );

  const addBtn = (
    <button
      type="button"
      onClick={add}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-[#00F0C8] hover:text-white"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Добавить
    </button>
  );

  if (depth === 0 || !fieldKey) {
    return (
      <div>
        {list}
        {addBtn}
      </div>
    );
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-white/60">{labelFor(fieldKey)}</span>
      {list}
      {addBtn}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/60 hover:text-white disabled:opacity-30 ${
        danger ? 'hover:border-red-400/60 hover:text-red-300' : 'hover:border-white/30'
      }`}
    >
      {children}
    </button>
  );
}

export type { Json };
