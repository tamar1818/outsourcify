import { useState } from "react";
import { api, setCsrf } from "../api.js";

export default function Login({ installed, onDone }) {
  const [f, setF] = useState({ user: "", password: "", password2: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!installed && f.password !== f.password2) return setErr("პაროლები არ ემთხვევა");
    setBusy(true);
    try {
      if (!installed) await api.post("/setup", { user: f.user, password: f.password });
      const r = await api.post("/login", { user: f.user, password: f.password });
      setCsrf(r.csrf);
      await onDone();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__art" aria-hidden="true">
        <img src="/assets/img/brand/outsourcify-logo-white.svg" alt="" />
        <p>კონტენტის მართვის სისტემა</p>
      </div>
      <form className="auth__card" onSubmit={submit}>
        <img className="auth__logo" src="/assets/img/brand/outsourcify-logo.svg" alt="Outsourcify" />
        <h1>{installed ? "შესვლა" : "CMS-ის პირველი გაშვება"}</h1>
        <p className="muted">{installed ? "შედით მართვის პანელში" : "შექმენით ადმინისტრატორის ანგარიში"}</p>
        {err && <div className="alert alert--err" role="alert">{err}</div>}
        <label className="fld"><span className="fld__label">მომხმარებელი</span><input name="user" value={f.user} onChange={set("user")} required autoComplete="username" autoFocus /></label>
        <label className="fld"><span className="fld__label">პაროლი{installed ? "" : " (მინ. 10 სიმბოლო)"}</span><input name="password" type="password" value={f.password} onChange={set("password")} required minLength={installed ? undefined : 10} autoComplete={installed ? "current-password" : "new-password"} /></label>
        {!installed && <label className="fld"><span className="fld__label">გაიმეორეთ პაროლი</span><input name="password2" type="password" value={f.password2} onChange={set("password2")} required autoComplete="new-password" /></label>}
        <button className="btn btn--primary btn--block" disabled={busy}><span>{busy ? "…" : installed ? "შესვლა" : "ანგარიშის შექმნა"}</span></button>
      </form>
    </div>
  );
}
