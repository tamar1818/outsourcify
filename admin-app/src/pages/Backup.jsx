import { useRef, useState } from "react";
import { api } from "../api.js";
import { useMeta, useToast } from "../context.jsx";
import { Button, Card, Icon, PageHead } from "../components/ui.jsx";

export default function Backup() {
  const meta = useMeta();
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const restore = async (file) => {
    if (!file || !window.confirm("აღდგენა გადაწერს მიმდინარე კონტენტს. გავაგრძელოთ?")) return;
    setBusy(true);
    try { const r = await api.upload("/backup", file); toast("აღდგენილია " + r.restored + " ფაილი"); meta.reloadMeta(); } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  };
  return (
    <>
      <PageHead title="სარეზერვო ასლი" sub="ჩამოტვირთეთ ყოველი დიდი ცვლილების შემდეგ და ყოველ ხელახალ დეპლოიმდე" />
      <div className="grid2">
        <Card title="ჩამოტვირთვა" desc="ერთ ფაილში: გვერდები, სერვისები, FAQ, შეფასებები, მენიუ, პარამეტრები, განაცხადები და ჯავშნები. ატვირთული ფოტოები ცალკე ინახება (DATA_DIR/uploads).">
          <a className="btn btn--primary" href="/admin/api/backup"><Icon name="folder" /><span>სარეზერვო ასლის ჩამოტვირთვა</span></a>
        </Card>
        <Card title="აღდგენა" desc="აირჩიეთ ადრე ჩამოტვირთული .json ფაილი. მიმდინარე კონტენტი გადაიწერება.">
          <Button variant="ghost" icon="history" disabled={busy} onClick={() => input.current.click()}>{busy ? "აღდგენა…" : "ფაილის არჩევა და აღდგენა"}</Button>
          <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => { restore(e.target.files[0]); e.target.value = ""; }} />
        </Card>
      </div>
    </>
  );
}
