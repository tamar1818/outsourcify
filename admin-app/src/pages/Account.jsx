import { useState } from "react";
import { api } from "../api.js";
import { useMeta, useToast } from "../context.jsx";
import { Card, PageHead } from "../components/ui.jsx";
import { PERM_LABELS } from "../perms.js";

export default function Account() {
  const meta = useMeta();
  const toast = useToast();
  const [p, setP] = useState({ name: meta.me.name, email: meta.me.email });
  const [f, setF] = useState({ current: "", new: "", new2: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const saveProfile = async (e) => {
    e.preventDefault();
    try { await api.put("/me", p); toast("შენახულია"); meta.reloadMeta(); } catch (x) { toast(x.message, "err"); }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (f.new !== f.new2) return toast("ახალი პაროლები არ ემთხვევა", "err");
    try { await api.post("/password", { current: f.current, new: f.new }); toast("პაროლი შეიცვალა — სხვა მოწყობილობებზე სესია დასრულდა"); setF({ current: "", new: "", new2: "" }); } catch (x) { toast(x.message, "err"); }
  };
  return (
    <>
      <PageHead title="ჩემი ანგარიში" sub={"შესვლა: @" + meta.me.user + (meta.me.owner ? " · მფლობელი" : "")} />
      <div className="grid2">
        <Card title="პროფილი">
          <form onSubmit={saveProfile}>
            <label className="fld"><span className="fld__label">სახელი და გვარი</span><input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} required /></label>
            <label className="fld"><span className="fld__label">ელფოსტა (შესვლაც შეიძლება ელფოსტით)</span><input type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></label>
            <button className="btn btn--primary"><span>შენახვა</span></button>
          </form>
          <p className="muted small" style={{ marginTop: 16 }}>თქვენი უფლებები: {meta.me.perms.map((x) => (PERM_LABELS[x] || [x])[0]).join(", ")}</p>
        </Card>
        <Card title="პაროლის შეცვლა">
          <form onSubmit={submit}>
            <label className="fld"><span className="fld__label">მიმდინარე პაროლი</span><input type="password" value={f.current} onChange={set("current")} required autoComplete="current-password" /></label>
            <label className="fld"><span className="fld__label">ახალი პაროლი (მინ. 10)</span><input type="password" value={f.new} onChange={set("new")} required minLength={10} autoComplete="new-password" /></label>
            <label className="fld"><span className="fld__label">გაიმეორეთ</span><input type="password" value={f.new2} onChange={set("new2")} required autoComplete="new-password" /></label>
            <button className="btn btn--primary"><span>შეცვლა</span></button>
          </form>
        </Card>
      </div>
    </>
  );
}
