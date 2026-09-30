import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useMeta, useToast } from "../context.jsx";
import { Empty, Icon, Loading, PageHead } from "../components/ui.jsx";
import { ImportUrl } from "../components/Fields.jsx";

export default function Media() {
  const meta = useMeta();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const load = () => api.get("/media").then(setItems);
  useEffect(() => { load(); }, []);

  const upload = async (files) => {
    setBusy(true);
    for (const f of Array.from(files || [])) {
      try { await api.upload("/media", f); toast("აიტვირთა: " + f.name); } catch (e) { toast(f.name + ": " + e.message, "err"); }
    }
    setBusy(false);
    load();
  };
  const del = async (m) => {
    if (!window.confirm("წავშალოთ ფოტო? შეამოწმეთ, რომ არსად გამოიყენება.")) return;
    try { await api.del("/media/" + encodeURIComponent(m.name)); toast("ფოტო წაიშალა"); load(); } catch (e) { toast(e.message, "err"); }
  };
  const copy = (u) => { navigator.clipboard?.writeText(u); toast("მისამართი დაკოპირდა"); };

  return (
    <>
      <PageHead title="ფოტოები" sub={"JPG, PNG, WebP, SVG — მაქს. 8 MB." + (meta.hasSharp ? " დიდი ფოტოები ავტომატურად მცირდება (2000px) და WebP-ად გარდაიქმნება." : "")} />
      <button type="button" className={"drop" + (over ? " is-over" : "")} onClick={() => input.current.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}>
        {busy ? <span className="spinner" /> : <Icon name="arrow-up-right" size={26} />}
        <b>{busy ? "იტვირთება…" : "ჩააგდეთ ფოტოები აქ ან დააჭირეთ ასარჩევად"}</b>
        <span className="muted small">ფაილის სახელი SEO-სთვის ორიგინალიდან აიღება — დაარქვით აღწერითი სახელი (მაგ. accountant-office-tbilisi.jpg)</span>
      </button>
      <ImportUrl onDone={load} />
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
      {!items ? <Loading /> : !items.length ? <Empty title="ფოტოები არ არის" /> : (
        <div className="media-grid">
          {items.map((m) => (
            <figure key={m.url} className="shot">
              <img src={m.url} alt="" loading="lazy" />
              <figcaption>
                <code title={m.name}>{m.name}</code>
                <div className="shot__act">
                  <button type="button" className="link" onClick={() => copy(m.url)}>კოპირება</button>
                  {m.deletable ? <button type="button" className="link link--danger" onClick={() => del(m)}>წაშლა</button> : <span className="muted small">ბრენდის ფოტო</span>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
