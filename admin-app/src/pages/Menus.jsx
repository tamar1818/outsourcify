import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { useMeta, useSaveShortcut, useToast, useUnsaved } from "../context.jsx";
import { Field, Repeater } from "../components/Fields.jsx";
import { Button, Card, Loading, PageHead } from "../components/ui.jsx";

export default function Menus() {
  const meta = useMeta();
  const toast = useToast();
  const [m, setM] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsaved(dirty);
  useEffect(() => { api.get("/menus").then(setM); }, []);
  const set = (k) => (v) => { setM((x) => ({ ...x, [k]: v })); setDirty(true); };

  const save = useCallback(async () => {
    if (!m || busy) return;
    setBusy(true);
    try { await api.put("/menus", m); setDirty(false); toast("მენიუ შენახულია"); } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }, [m, busy]); // eslint-disable-line react-hooks/exhaustive-deps
  useSaveShortcut(save);

  if (!m) return <Loading />;
  const full = meta.recordDefs.menu;
  const plain = meta.recordDefs.menuPlain;
  const colTitle = { type: "text", label: "სვეტის სათაური", i18n: true };
  return (
    <>
      <PageHead title="მენიუ და ფუტერი" sub="სერვისების სვეტი და საკონტაქტო ინფორმაცია ფუტერში ავტომატურად ივსება">
        <Button onClick={save} disabled={busy || !dirty} icon="check">{busy ? "ინახება…" : dirty ? "შენახვა" : "შენახულია"}</Button>
      </PageHead>
      <Card title="მთავარი მენიუ (ჰედერი)" desc="„სერვისების ჩამოსაშლელი მენიუ“ ავტომატურად აჩვენებს ყველა სერვისს">
        <Repeater def={{ label: "პუნქტები", fields: full, add: "პუნქტის დამატება" }} value={m.header || []} onChange={set("header")} />
      </Card>
      <div className="grid2">
        <Card title="ფუტერი — სვეტი 1">
          <Field def={colTitle} value={m.footer_company_title} onChange={set("footer_company_title")} />
          <Repeater def={{ label: "ბმულები", fields: plain, add: "ბმულის დამატება" }} value={m.footer_company || []} onChange={set("footer_company")} />
        </Card>
        <Card title="ფუტერი — სვეტი 2">
          <Field def={colTitle} value={m.footer_legal_title} onChange={set("footer_legal_title")} />
          <Repeater def={{ label: "ბმულები", fields: plain, add: "ბმულის დამატება" }} value={m.footer_legal || []} onChange={set("footer_legal")} />
        </Card>
      </div>
    </>
  );
}
