import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { useMeta, useSaveShortcut, useToast, useUnsaved } from "../context.jsx";
import { Repeater } from "../components/Fields.jsx";
import { Button, Card, Loading, PageHead } from "../components/ui.jsx";

const CFG = {
  faqs: ["FAQ", "faq", "კითხვის დამატება", "კითხვები FAQ გვერდზე, მთავარ გვერდსა და სხვა გვერდების FAQ ბლოკებში. კატეგორია განსაზღვრავს, სად გამოჩნდება. FAQ schema ავტომატურად იქმნება."],
  testimonials: ["შეფასებები", "testimonial", "შეფასების დამატება", "ბლოკი საიტზე მხოლოდ მაშინ ჩნდება, როცა ერთი შეფასება მაინც არის. დაამატეთ მხოლოდ რეალური კლიენტების შეფასებები, მათი თანხმობით."],
  industries: ["ვისთან ვმუშაობთ", "industry", "ჩანაწერის დამატება", "კლიენტების ტიპები „ვისთან ვმუშაობთ“ ბლოკისთვის."],
};

export default function Collection({ name }) {
  const meta = useMeta();
  const toast = useToast();
  const [title, def, add, note] = CFG[name];
  const [items, setItems] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsaved(dirty);
  useEffect(() => { setItems(null); setDirty(false); api.get("/collections/" + name).then(setItems); }, [name]);

  const save = useCallback(async () => {
    if (!items || busy) return;
    setBusy(true);
    try { await api.put("/collections/" + name, { items }); setDirty(false); toast("შენახულია"); } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }, [items, busy, name]); // eslint-disable-line react-hooks/exhaustive-deps
  useSaveShortcut(save);

  if (!items) return <Loading />;
  return (
    <>
      <PageHead title={title} sub={note}>
        <Button onClick={save} disabled={busy || !dirty} icon="check">{busy ? "ინახება…" : dirty ? "შენახვა" : "შენახულია"}</Button>
      </PageHead>
      <Card>
        <Repeater key={name} def={{ label: "ჩანაწერები", fields: meta.recordDefs[def], add }} value={items} onChange={(v) => { setItems(v); setDirty(true); }} />
      </Card>
    </>
  );
}
