import { forwardRef, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useMeta, useToast } from "../context.jsx";
import { Button, Icon, Modal, lenTone, L } from "./ui.jsx";

const LANG_LABEL = { ka: "ქართ", en: "ENG" };
const isMap = (v) => v && typeof v === "object" && !Array.isArray(v);

/** ცარიელი მნიშვნელობა სქემის მიხედვით (ახალი ბლოკის/ჩანაწერისთვის) */
export function emptyValue(def) {
  const base = { check: false, number: 0, list: [], repeater: [] }[def.type] ?? "";
  if (def.type === "select") return Object.keys(def.options || { "": "" })[0];
  if (def.i18n) return { ka: Array.isArray(base) ? [] : base, en: Array.isArray(base) ? [] : base };
  return base;
}
export function emptyRecord(fields) {
  const o = {};
  for (const [k, d] of Object.entries(fields)) o[k] = emptyValue(d);
  return o;
}

/** სქემიდან ველების ნაკრები */
export function FieldSet({ defs, value, onChange, only }) {
  const keys = only || Object.keys(defs);
  return keys.filter((k) => defs[k]).map((k) => (
    <Field key={k} name={k} def={defs[k]} value={(value || {})[k]} onChange={(v) => onChange({ ...(value || {}), [k]: v })} />
  ));
}

export function Field({ name, def, value, onChange }) {
  if (def.type === "repeater") return <Repeater def={def} value={Array.isArray(value) ? value : []} onChange={onChange} />;
  if (def.type === "check") {
    return (
      <label className="fld fld--check">
        <span className="switch"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><i /></span>
        <span>{def.label}</span>
      </label>
    );
  }
  if (def.i18n) {
    const v = isMap(value) ? value : { ka: value ?? "", en: "" };
    return (
      <div className="fld">
        <span className="fld__label">{def.label}</span>
        {def.hint && <small className="hint">{def.hint}</small>}
        <div className="i18n">
          {["ka", "en"].map((l) => (
            <div className="i18n__col" key={l}>
              <span className={"flag flag--" + l}>{LANG_LABEL[l]}</span>
              <Control def={def} value={v[l]} lang={l} onChange={(x) => onChange({ ...v, [l]: x })} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="fld">
      <span className="fld__label">{def.label}</span>
      {def.hint && <small className="hint">{def.hint}</small>}
      <Control def={def} value={value} onChange={onChange} />
    </div>
  );
}

function Counter({ value, max }) {
  const n = String(value || "").length;
  return <span className={"counter counter--" + lenTone(n, max === 60 ? 30 : 120, max)}>{n} / {max}</span>;
}

function Control({ def, value, onChange, lang }) {
  const str = value === null || value === undefined || typeof value === "object" ? "" : String(value);
  switch (def.type) {
    case "textarea":
      return <div className="ctl"><AutoText value={str} onChange={onChange} lang={lang} />{def.counter && <Counter value={str} max={def.counter} />}</div>;
    case "rich": return <RichField value={str} onChange={onChange} lang={lang} />;
    case "list":
      return <AutoText value={(Array.isArray(value) ? value : []).join("\n")} lang={lang} placeholder="თითო ხაზზე ერთი" onChange={(t) => onChange(t.split("\n"))} rows={3} />;
    case "number": return <input type="number" min="0" max="999" value={parseInt(value, 10) || 0} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} />;
    case "select":
      return <select value={str} onChange={(e) => onChange(e.target.value)}>{Object.entries(def.options || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
    case "link": return <LinkField value={str} onChange={onChange} />;
    case "image": return <ImageField value={str} onChange={onChange} />;
    case "icon": return <IconField value={str} onChange={onChange} />;
    default:
      return <div className="ctl"><input type="text" lang={lang} value={str} onChange={(e) => onChange(e.target.value)} />{def.counter && <Counter value={str} max={def.counter} />}</div>;
  }
}

/** textarea, რომელიც შიგთავსთან ერთად იზრდება */
const AutoText = forwardRef(function AutoText({ value, onChange, rows = 2, ...rest }, outer) {
  const ref = useRef(null);
  const setRef = (el) => {
    ref.current = el;
    if (typeof outer === "function") outer(el);
    else if (outer) outer.current = el;
  };
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight + 2, 420) + "px"; }
  }, [value]);
  return <textarea ref={setRef} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
});

function RichField({ value, onChange, lang }) {
  const ref = useRef(null);
  const wrap = (before, after, fallback = "ტექსტი") => {
    const el = ref.current;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = value.slice(s, e) || fallback;
    const ins = before + sel + after;
    onChange(value.slice(0, s) + ins + value.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + ins.length, s + ins.length); });
  };
  const list = () => {
    const el = ref.current;
    const sel = value.slice(el.selectionStart, el.selectionEnd) || "პუნქტი 1\nპუნქტი 2";
    const html = "\n<ul>\n" + sel.split("\n").filter(Boolean).map((l) => "  <li>" + l + "</li>").join("\n") + "\n</ul>\n";
    onChange(value.slice(0, el.selectionStart) + html + value.slice(el.selectionEnd));
  };
  const link = () => {
    const href = window.prompt("ბმულის მისამართი (https://…)", "https://");
    if (href) wrap('<a href="' + href.replace(/"/g, "") + '">', "</a>", href);
  };
  return (
    <div className="rich">
      <div className="rich__bar" role="toolbar">
        <button type="button" onClick={() => wrap("<strong>", "</strong>")}><b>B</b></button>
        <button type="button" onClick={() => wrap("<em>", "</em>")}><i>I</i></button>
        <button type="button" onClick={() => wrap("\n<h2>", "</h2>\n", "ქვესათაური")}>H2</button>
        <button type="button" onClick={() => wrap("\n<h3>", "</h3>\n", "ქვესათაური")}>H3</button>
        <button type="button" onClick={list}>• სია</button>
        <button type="button" onClick={link}>🔗 ბმული</button>
      </div>
      <AutoText value={value} onChange={onChange} rows={8} className="mono" lang={lang} ref={ref} />
    </div>
  );
}
function LinkField({ value, onChange }) {
  const meta = useMeta();
  const known = meta.linkOptions.some((g) => g.items.some((i) => i.value === value));
  const [custom, setCustom] = useState(!known && value !== "");
  return (
    <div className="lnk">
      <select value={custom ? "__custom" : value} onChange={(e) => {
        if (e.target.value === "__custom") { setCustom(true); onChange(""); } else { setCustom(false); onChange(e.target.value); }
      }}>
        <option value="">— ბმულის გარეშე —</option>
        {meta.linkOptions.map((g) => <optgroup key={g.group} label={g.group}>{g.items.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}</optgroup>)}
        <option value="__custom">სხვა მისამართი (URL, tel:, mailto:)…</option>
      </select>
      {custom && <input type="text" placeholder="https://… ან tel:+995…" value={value} onChange={(e) => onChange(e.target.value)} autoFocus />}
    </div>
  );
}

function ImageField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const fileRef = useRef(null);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await api.upload("/media", file);
      onChange(r.file);
      toast("ფოტო აიტვირთა");
    } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  };
  return (
    <div className="img">
      <button type="button" className="img__prev" onClick={() => setOpen(true)} title="ბიბლიოთეკიდან არჩევა">
        {busy ? <span className="spinner" /> : value ? <img src={value} alt="" /> : <span><Icon name="folder" /> არჩევა</span>}
      </button>
      <div className="img__ctl">
        <input type="text" value={value} placeholder="/assets/img/… ან /uploads/…" onChange={(e) => onChange(e.target.value)} />
        <div className="img__btns">
          <Button size="sm" variant="ghost" icon="folder" onClick={() => setOpen(true)}>ბიბლიოთეკა</Button>
          <Button size="sm" variant="ghost" icon="arrow-up-right" onClick={() => fileRef.current.click()}>ატვირთვა</Button>
          {value && <button type="button" className="link link--danger" onClick={() => onChange("")}>წაშლა</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files[0]); e.target.value = ""; }} />
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(u) => { onChange(u); setOpen(false); }} />
    </div>
  );
}

export function MediaPicker({ open, onClose, onPick }) {
  const [items, setItems] = useState(null);
  useEffect(() => { if (open) api.get("/media").then(setItems).catch(() => setItems([])); }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="ფოტოს არჩევა" wide>
      {!items ? <p className="muted">იტვირთება…</p> : !items.length ? <p className="muted">ფოტოები არ არის — ატვირთეთ „ფოტოები“ განყოფილებაში.</p> : (
        <div className="picker">
          {items.map((m) => <button type="button" key={m.url} onClick={() => onPick(m.url)} title={m.name}><img src={m.url} alt="" loading="lazy" /><span>{m.name}</span></button>)}
        </div>
      )}
    </Modal>
  );
}

const SKIP_ICONS = ["menu", "x", "plus", "minus", "chevron-down", "chevron-left", "chevron-right", "facebook", "linkedin", "instagram"];
function IconField({ value, onChange }) {
  const meta = useMeta();
  const [open, setOpen] = useState(false);
  return (
    <div className="icp">
      <button type="button" className="icp__cur" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="icp__box">{value ? <Icon name={value} /> : "—"}</span>{value || "ხატულის არჩევა"}<Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <div className="icp__grid">
          <button type="button" onClick={() => { onChange(""); setOpen(false); }} title="ხატულის გარეშე">—</button>
          {Object.keys(meta.icons).filter((n) => !SKIP_ICONS.includes(n)).map((n) => (
            <button type="button" key={n} title={n} className={n === value ? "on" : ""} onClick={() => { onChange(n); setOpen(false); }}><Icon name={n} /></button>
          ))}
        </div>
      )}
    </div>
  );
}

/** ჩანაწერების სია: დამატება, წაშლა, დუბლირება, რიგი (↑↓ და drag), აკეცვა */
export function Repeater({ def, value, onChange }) {
  const [open, setOpen] = useState(() => (value.length > 3 ? {} : Object.fromEntries(value.map((_, i) => [i, true]))));
  const drag = useRef(null);
  const set = (i, v) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const a = [...value];
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
    setOpen((o) => ({ ...o, [i]: o[j], [j]: o[i] }));
  };
  const title = (it) => {
    for (const k of ["title", "q", "label", "criterion", "name", "value"]) if (it[k] !== undefined) return L(it[k]).replace(/<[^>]*>/g, "");
    return "";
  };
  return (
    <div className="rep">
      <div className="rep__head"><span className="fld__label">{def.label}</span><span className="count">{value.length}</span></div>
      <div className="rep__items">
        {value.map((it, i) => (
          <div key={i} className={"rep-item" + (open[i] ? " is-open" : "")} draggable
            onDragStart={() => { drag.current = i; }} onDragOver={(e) => e.preventDefault()}
            onDrop={() => { const from = drag.current; if (from === null || from === i) return; const a = [...value]; const [x] = a.splice(from, 1); a.splice(i, 0, x); onChange(a); drag.current = null; }}>
            <div className="rep-item__bar">
              <span className="grip" title="გადაათრიეთ">⋮⋮</span>
              <button type="button" className="rep-item__toggle" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))} aria-expanded={!!open[i]}>
                <span className="rep-item__n">{i + 1}</span>{title(it) || "ახალი ჩანაწერი"}
              </button>
              <span className="tools">
                <button type="button" onClick={() => move(i, -1)} title="ზემოთ" disabled={i === 0}>↑</button>
                <button type="button" onClick={() => move(i, 1)} title="ქვემოთ" disabled={i === value.length - 1}>↓</button>
                <button type="button" onClick={() => onChange([...value.slice(0, i + 1), JSON.parse(JSON.stringify(it)), ...value.slice(i + 1)])} title="დუბლირება">⧉</button>
                <button type="button" className="danger" onClick={() => window.confirm("წავშალოთ?") && onChange(value.filter((_, j) => j !== i))} title="წაშლა">✕</button>
              </span>
            </div>
            {open[i] && <div className="rep-item__body"><FieldSet defs={def.fields} value={it} onChange={(v) => set(i, v)} /></div>}
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" icon="plus" onClick={() => { onChange([...value, emptyRecord(def.fields)]); setOpen((o) => ({ ...o, [value.length]: true })); }}>{def.add || "დამატება"}</Button>
    </div>
  );
}
