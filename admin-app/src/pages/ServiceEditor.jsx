import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useMeta, useSaveShortcut, useToast, useUnsaved } from "../context.jsx";
import { FieldSet, emptyRecord } from "../components/Fields.jsx";
import { Button, Card, Icon, L, Loading, PageHead, Tabs } from "../components/ui.jsx";

const GROUPS = [
  ["main", "ძირითადი", ["title", "slug", "hidden", "icon", "image", "image_alt", "short", "intro"]],
  ["content", "გვერდის შინაარსი", ["body", "audience", "includes", "benefits"]],
  ["faq", "FAQ", ["faq"]],
  ["seo", "SEO", ["seo_title", "seo_desc", "keywords"]],
];

export default function ServiceEditor({ isNew }) {
  const meta = useMeta();
  const toast = useToast();
  const nav = useNavigate();
  const { id } = useParams();
  const defs = meta.recordDefs.service;
  const [s, setS] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("main");
  useUnsaved(dirty);

  useEffect(() => {
    setS(null);
    setDirty(false);
    if (isNew) setS({ ...emptyRecord(defs), icon: "briefcase" });
    else api.get("/services/" + id).then(setS).catch((e) => toast(e.message, "err"));
  }, [id, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async () => {
    if (!s || busy) return;
    setBusy(true);
    try {
      const r = isNew ? await api.post("/services", s) : await api.put("/services/" + id, s);
      setDirty(false);
      toast(isNew ? "სერვისი შეიქმნა" : "სერვისი შენახულია");
      meta.reloadMeta();
      if (isNew) nav("/services/" + r.id, { replace: true });
      else setS((x) => ({ ...x, urls: r.urls }));
    } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }, [s, busy, isNew, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useSaveShortcut(save);

  if (!s) return <Loading />;
  const group = GROUPS.find((g) => g[0] === tab);
  return (
    <>
      <PageHead title={isNew ? "ახალი სერვისი" : L(s.title)} back={<Link className="back" to="/services"><Icon name="chevron-left" size={16} />სერვისები</Link>}>
        {s.urls && <a className="btn btn--ghost" href={s.urls.ka} target="_blank" rel="noreferrer"><Icon name="arrow-up-right" /><span>ქართ</span></a>}
        {s.urls && <a className="btn btn--ghost" href={s.urls.en} target="_blank" rel="noreferrer"><Icon name="arrow-up-right" /><span>ENG</span></a>}
        <Button onClick={save} disabled={busy || (!dirty && !isNew)} icon="check">{busy ? "ინახება…" : dirty || isNew ? "შენახვა" : "შენახულია"}</Button>
      </PageHead>
      <Tabs tabs={GROUPS.map(([k, l]) => [k, l])} value={tab} onChange={setTab} />
      <Card>
        <FieldSet defs={defs} only={group[2]} value={s} onChange={(v) => { setS(v); setDirty(true); }} />
      </Card>
    </>
  );
}
