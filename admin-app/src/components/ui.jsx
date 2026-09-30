import { useEffect, useRef } from "react";
import { useMeta } from "../context.jsx";

/** ხატულა სერვერის ICONS-იდან (იგივე ნაკრები, რაც საიტზე) */
export function Icon({ name, size = 20, className = "" }) {
  const meta = useMeta();
  const body = (meta && meta.icons[name]) || "";
  return (
    <svg className={"ico " + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: body }} />
  );
}

export function Button({ variant = "primary", size, icon, children, className = "", ...rest }) {
  return (
    <button type="button" className={`btn btn--${variant}${size ? " btn--" + size : ""} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function PageHead({ title, back, children, sub }) {
  return (
    <header className="phead">
      <div className="phead__txt">
        {back}
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      <div className="phead__act">{children}</div>
    </header>
  );
}

export function Card({ title, desc, actions, children, className = "" }) {
  return (
    <section className={"card " + className}>
      {(title || actions) && (
        <div className="card__head">
          <div>{title && <h2>{title}</h2>}{desc && <p className="muted small">{desc}</p>}</div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    ref.current && ref.current.focus();
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={"modal__box" + (wide ? " modal__box--wide" : "")} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal__head"><h2>{title}</h2><button type="button" className="iconbtn" onClick={onClose} aria-label="დახურვა"><Icon name="x" /></button></div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export const Pill = ({ tone = "", children }) => <span className={"pill pill--" + tone}>{children}</span>;

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, label, count]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} onClick={() => onChange(k)}>
          {label}{count !== undefined && <b>{count}</b>}
        </button>
      ))}
    </div>
  );
}

export const Loading = () => <div className="loading"><span className="spinner" />იტვირთება…</div>;

export function Empty({ icon = "folder", title, children }) {
  return <div className="empty"><span className="empty__ico"><Icon name={icon} size={26} /></span><b>{title}</b>{children && <p className="muted">{children}</p>}</div>;
}

/** SEO სიგრძის შეფასება */
export function lenTone(n, min, max) {
  return n === 0 ? "bad" : n < min || n > max + 8 ? "warn" : "ok";
}

export const L = (v, l = "ka") => (v && typeof v === "object" && !Array.isArray(v) ? v[l] || v.ka || "" : v || "");
