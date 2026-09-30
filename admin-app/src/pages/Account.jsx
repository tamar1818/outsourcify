import { useState } from "react";
import { api } from "../api.js";
import { useToast } from "../context.jsx";
import { Card, PageHead } from "../components/ui.jsx";

export default function Account() {
  const toast = useToast();
  const [f, setF] = useState({ current: "", new: "", new2: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (f.new !== f.new2) return toast("ახალი პაროლები არ ემთხვევა", "err");
    try { await api.post("/password", { current: f.current, new: f.new }); toast("პაროლი შეიცვალა"); setF({ current: "", new: "", new2: "" }); } catch (x) { toast(x.message, "err"); }
  };
  return (
    <>
      <PageHead title="პაროლის შეცვლა" />
      <Card className="narrow">
        <form onSubmit={submit}>
          <label className="fld"><span className="fld__label">მიმდინარე პაროლი</span><input type="password" value={f.current} onChange={set("current")} required autoComplete="current-password" /></label>
          <label className="fld"><span className="fld__label">ახალი პაროლი (მინ. 10)</span><input type="password" value={f.new} onChange={set("new")} required minLength={10} autoComplete="new-password" /></label>
          <label className="fld"><span className="fld__label">გაიმეორეთ</span><input type="password" value={f.new2} onChange={set("new2")} required autoComplete="new-password" /></label>
          <button className="btn btn--primary"><span>შეცვლა</span></button>
        </form>
      </Card>
    </>
  );
}
