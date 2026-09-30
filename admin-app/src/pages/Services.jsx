import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useMeta, useToast } from "../context.jsx";
import { Icon, L, Loading, PageHead, Pill } from "../components/ui.jsx";

export default function Services() {
  const meta = useMeta();
  const toast = useToast();
  const [list, setList] = useState(null);
  const drag = useRef(null);
  useEffect(() => { api.get("/services").then(setList); }, []);
  if (!list) return <Loading />;

  const persist = async (next, hidden = {}) => {
    const prev = list;
    setList(next);
    try {
      await api.post("/services-order", { order: next.map((s) => s.id), hidden });
      meta.reloadMeta();
      toast("შენახულია");
    } catch (e) { setList(prev); toast(e.message, "err"); }
  };
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const a = [...list];
    [a[i], a[j]] = [a[j], a[i]];
    persist(a);
  };
  const toggle = (s) => persist(list.map((x) => (x.id === s.id ? { ...x, hidden: !x.hidden } : x)), { [s.id]: !s.hidden });
  const del = async (s) => {
    if (!window.confirm("წავშალოთ სერვისი „" + L(s.title) + "“?")) return;
    try { await api.del("/services/" + s.id); setList(list.filter((x) => x.id !== s.id)); meta.reloadMeta(); toast("სერვისი წაიშალა"); } catch (e) { toast(e.message, "err"); }
  };

  return (
    <>
      <PageHead title="სერვისები" sub="ავტომატურად ჩნდება მენიუში, მთავარ გვერდზე, ფუტერში, დაჯავშნის ჩატსა და sitemap-ში">
        <Link className="btn btn--primary" to="/services/new"><Icon name="plus" /><span>ახალი სერვისი</span></Link>
      </PageHead>
      <p className="muted small">რიგის შესაცვლელად გადაათრიეთ ⋮⋮ ან გამოიყენეთ ↑↓ — ცვლილება მაშინვე ინახება.</p>
      <div className="rows">
        {list.map((s, i) => (
          <div key={s.id} className={"row" + (s.hidden ? " is-hidden" : "")} draggable
            onDragStart={() => { drag.current = i; }} onDragOver={(e) => e.preventDefault()}
            onDrop={() => { const from = drag.current; if (from === null || from === i) return; const a = [...list]; const [x] = a.splice(from, 1); a.splice(i, 0, x); persist(a); drag.current = null; }}>
            <span className="grip">⋮⋮</span>
            <span className="row__ico"><Icon name={s.icon || "briefcase"} /></span>
            <Link to={"/services/" + s.id} className="row__main">
              <b>{L(s.title)} {s.hidden && <Pill tone="off">დამალული</Pill>}</b>
              <small className="muted">{L(s.title, "en")} · {s.urls.ka}</small>
            </Link>
            <span className="tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="ზემოთ">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} title="ქვემოთ">↓</button>
              <button type="button" onClick={() => toggle(s)} title={s.hidden ? "გამოჩენა" : "დამალვა"}>{s.hidden ? "👁" : "◌"}</button>
              <a href={s.urls.ka} target="_blank" rel="noreferrer" title="საიტზე ნახვა"><Icon name="arrow-up-right" size={16} /></a>
              <button type="button" className="danger" onClick={() => del(s)} title="წაშლა">✕</button>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
