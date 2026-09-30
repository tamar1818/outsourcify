import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useMeta, useSaveShortcut, useToast, useUnsaved } from "../context.jsx";
import { FieldSet, emptyRecord } from "../components/Fields.jsx";
import { Button, Card, Icon, L, Loading, Modal, PageHead } from "../components/ui.jsx";

const blank = (meta) => ({
  meta: { title: { ka: "", en: "" }, slug: { ka: "", en: "" }, seo_title: { ka: "", en: "" }, seo_desc: { ka: "", en: "" }, keywords: { ka: "", en: "" }, og_image: "", hidden: false, noindex: false },
  blocks: [
    { type: "page_hero", hidden: false, ...emptyRecord(meta.blockDefs.page_hero.fields) },
    { type: "richtext", hidden: false, ...emptyRecord(meta.blockDefs.richtext.fields) },
  ],
});

export default function PageEditor({ isNew }) {
  const meta = useMeta();
  const toast = useToast();
  const nav = useNavigate();
  const { id } = useParams();
  const [page, setPage] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState({});
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [lang, setLang] = useState("ka");
  const drag = useRef(null);
  useUnsaved(dirty);

  useEffect(() => {
    setPage(null);
    setDirty(false);
    if (isNew) setPage({ id: "", template: "page", system: false, urls: null, ...blank(meta) });
    else api.get("/pages/" + id).then(setPage).catch((e) => toast(e.message, "err"));
  }, [id, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch) => { setPage((p) => ({ ...p, ...patch })); setDirty(true); };
  const setBlocks = (blocks) => update({ blocks });

  const save = useCallback(async () => {
    if (!page || busy) return;
    setBusy(true);
    try {
      if (isNew) {
        const r = await api.post("/pages", { meta: page.meta, blocks: page.blocks });
        setDirty(false);
        toast("გვერდი შეიქმნა");
        meta.reloadMeta();
        nav("/pages/" + r.id, { replace: true });
      } else {
        const r = await api.put("/pages/" + page.id, { meta: page.meta, blocks: page.blocks });
        setDirty(false);
        setPage((p) => ({ ...p, urls: r.urls }));
        setPreviewKey((k) => k + 1);
        toast("გვერდი შენახულია");
      }
    } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }, [page, busy, isNew]); // eslint-disable-line react-hooks/exhaustive-deps
  useSaveShortcut(save);

  if (!page) return <Loading />;
  const defs = meta.blockDefs;
  const metaDefs = { ...meta.pageMetaDefs };
  if (page.template === "home") { delete metaDefs.hidden; metaDefs.slug = { ...metaDefs.slug, hint: "მთავარ გვერდს მისამართი არ აქვს" }; }

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= page.blocks.length) return;
    const b = [...page.blocks];
    [b[i], b[j]] = [b[j], b[i]];
    setBlocks(b);
    setOpen((o) => ({ ...o, [i]: o[j], [j]: o[i] }));
  };
  const addBlock = (type) => {
    const b = { type, hidden: false, ...emptyRecord(defs[type].fields) };
    setBlocks([...page.blocks, b]);
    setOpen((o) => ({ ...o, [page.blocks.length]: true }));
    setAdding(false);
    setTimeout(() => document.querySelector(".blk:last-child")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const del = async () => {
    if (!window.confirm("წავშალოთ გვერდი? ამის დაბრუნება შეუძლებელია.")) return;
    try { await api.del("/pages/" + page.id); setDirty(false); toast("გვერდი წაიშალა"); meta.reloadMeta(); nav("/pages"); } catch (e) { toast(e.message, "err"); }
  };

  return (
    <div className={"editor" + (preview && page.urls ? " editor--preview" : "")}>
      <div className="editor__main">
        <PageHead title={isNew ? "ახალი გვერდი" : L(page.meta.title) || "გვერდი"} back={<Link className="back" to="/pages"><Icon name="chevron-left" size={16} />გვერდები</Link>}>
          {page.urls && <a className="btn btn--ghost" href={page.urls.ka} target="_blank" rel="noreferrer"><Icon name="arrow-up-right" /><span>ქართ</span></a>}
          {page.urls && <a className="btn btn--ghost" href={page.urls.en} target="_blank" rel="noreferrer"><Icon name="arrow-up-right" /><span>ENG</span></a>}
          {page.urls && <Button variant={preview ? "dark" : "ghost"} icon="layers" onClick={() => setPreview(!preview)}>პრევიუ</Button>}
          <Button onClick={save} disabled={busy || (!dirty && !isNew)} icon="check">{busy ? "ინახება…" : dirty ? "შენახვა" : "შენახულია"}</Button>
        </PageHead>

        <Card title="გვერდის პარამეტრები და SEO" desc="სახელი, მისამართი, Google-ის სათაური და აღწერა" className="card--collapse">
          <details open={isNew}><summary>გახსნა / დაკეცვა</summary>
            <FieldSet defs={metaDefs} value={page.meta} onChange={(m) => update({ meta: m })} />
          </details>
        </Card>

        <div className="blocks-head">
          <h2>ბლოკები <span className="count">{page.blocks.length}</span></h2>
          <div className="blocks-head__act">
            <button type="button" className="link" onClick={() => setOpen(Object.fromEntries(page.blocks.map((_, i) => [i, true])))}>ყველას გაშლა</button>
            <button type="button" className="link" onClick={() => setOpen({})}>დაკეცვა</button>
          </div>
        </div>

        <div className="blocks">
          {page.blocks.map((b, i) => {
            const d = defs[b.type];
            if (!d) return null;
            return (
              <div key={i} className={"blk" + (b.hidden ? " is-hidden" : "") + (open[i] ? " is-open" : "")} draggable={!open[i]}
                onDragStart={() => { drag.current = i; }} onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const from = drag.current;
                  if (from === null || from === i) return;
                  const arr = [...page.blocks];
                  const [x] = arr.splice(from, 1);
                  arr.splice(i, 0, x);
                  setBlocks(arr);
                  setOpen({});
                  drag.current = null;
                }}>
                <div className="blk__bar">
                  <span className="grip" title="გადაათრიეთ რიგის შესაცვლელად">⋮⋮</span>
                  <button type="button" className="blk__toggle" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))} aria-expanded={!!open[i]}>
                    <span className="blk__type">{d.label}</span>
                    <span className="blk__sum">{L(b.title, lang).replace(/<[^>]*>/g, "") || d.desc}</span>
                  </button>
                  <span className="tools">
                    <label className="vis" title="საიტზე ჩვენება">
                      <span className="switch switch--sm"><input type="checkbox" checked={!b.hidden} onChange={(e) => setBlocks(page.blocks.map((x, j) => (j === i ? { ...x, hidden: !e.target.checked } : x)))} /><i /></span>
                    </label>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="ზემოთ">↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === page.blocks.length - 1} title="ქვემოთ">↓</button>
                    <button type="button" title="დუბლირება" onClick={() => setBlocks([...page.blocks.slice(0, i + 1), JSON.parse(JSON.stringify(b)), ...page.blocks.slice(i + 1)])}>⧉</button>
                    <button type="button" className="danger" title="წაშლა" onClick={() => window.confirm("წავშალოთ ბლოკი?") && setBlocks(page.blocks.filter((_, j) => j !== i))}>✕</button>
                  </span>
                </div>
                {open[i] && (
                  <div className="blk__body">
                    <p className="muted small">{d.desc}</p>
                    <FieldSet defs={d.fields} value={b} onChange={(v) => setBlocks(page.blocks.map((x, j) => (j === i ? { ...v, type: b.type, hidden: b.hidden } : x)))} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" className="add-block" onClick={() => setAdding(true)}><Icon name="plus" /><span>ბლოკის დამატება</span></button>

        {!isNew && !page.system && <div className="danger-zone"><button type="button" className="link link--danger" onClick={del}>გვერდის წაშლა</button></div>}
        <div className="summary-lang">ბლოკების სათაურები: <button type="button" className={lang === "ka" ? "on" : ""} onClick={() => setLang("ka")}>ქართ</button><button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button></div>
      </div>

      {preview && page.urls && (
        <aside className="preview">
          <div className="preview__bar"><span>პრევიუ {dirty && <em>— შეუნახავი ცვლილებები</em>}</span>
            <span><button type="button" className={lang === "ka" ? "on" : ""} onClick={() => setLang("ka")}>ქართ</button><button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button></span>
          </div>
          <iframe key={previewKey + lang} src={page.urls[lang]} title="პრევიუ" />
        </aside>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="ბლოკის დამატება" wide>
        <div className="block-types">
          {Object.entries(defs).map(([k, d]) => (
            <button type="button" key={k} onClick={() => addBlock(k)}><b>{d.label}</b><span>{d.desc}</span></button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
