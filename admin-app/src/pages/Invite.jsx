import { useEffect, useState } from "react";
import { api, setCsrf } from "../api.js";
import { Loading } from "../components/ui.jsx";

/** /admin/invite/:token — მოწვევის მიღება ან პაროლის აღდგენა */
export default function Invite({ token, onDone }) {
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ user: "", name: "", password: "", password2: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => {
    api.get("/invite/" + encodeURIComponent(token))
      .then((r) => { setInfo(r); setF((x) => ({ ...x, name: r.name || "", user: r.kind === "invite" && r.email ? r.email.split("@")[0].replace(/[^\w.-]/g, "") : "" })); })
      .catch((x) => setInfo({ error: x.message }));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (f.password !== f.password2) return setErr("პაროლები არ ემთხვევა");
    setBusy(true);
    try {
      const r = await api.post("/invite/" + encodeURIComponent(token), { user: f.user, name: f.name, password: f.password });
      setCsrf(r.csrf);
      window.history.replaceState(null, "", "/admin/");
      await onDone();
    } catch (x) { setErr(x.message); setBusy(false); }
  };

  if (!info) return <Loading />;
  const reset = info.kind === "reset";
  return (
    <div className="auth">
      <div className="auth__art" aria-hidden="true">
        <img src="/assets/img/brand/outsourcify-logo-white.svg" alt="" />
        <p>კონტენტის მართვის სისტემა</p>
      </div>
      {info.error ? (
        <div className="auth__card">
          <img className="auth__logo" src="/assets/img/brand/outsourcify-logo.svg" alt="Outsourcify" />
          <h1>ბმული არ მუშაობს</h1>
          <div className="alert alert--err" role="alert">{info.error}</div>
          <p className="muted">სთხოვეთ ადმინისტრატორს ახალი მოწვევის ბმული.</p>
          <a className="btn btn--ghost btn--block" href="/admin/"><span>შესვლის გვერდი</span></a>
        </div>
      ) : (
        <form className="auth__card" onSubmit={submit}>
          <img className="auth__logo" src="/assets/img/brand/outsourcify-logo.svg" alt="Outsourcify" />
          <h1>{reset ? "ახალი პაროლი" : "მოწვევის მიღება"}</h1>
          <p className="muted">{reset ? <>ანგარიში: <b>{info.user}</b></> : <>თქვენ მოგიწვიეს Outsourcify-ის მართვის პანელში{info.email ? <> ({info.email})</> : null}. შექმენით ანგარიში.</>}</p>
          {err && <div className="alert alert--err" role="alert">{err}</div>}
          {!reset && <>
            <label className="fld"><span className="fld__label">სახელი და გვარი</span><input value={f.name} onChange={set("name")} required autoComplete="name" /></label>
            <label className="fld"><span className="fld__label">მომხმარებლის სახელი (შესვლისთვის)</span><input value={f.user} onChange={set("user")} required minLength={3} pattern="[A-Za-z0-9._@\-]{3,40}" title="ლათინური ასოები, ციფრები, . _ - @" autoComplete="username" /></label>
          </>}
          <label className="fld"><span className="fld__label">პაროლი (მინ. 10 სიმბოლო)</span><input type="password" value={f.password} onChange={set("password")} required minLength={10} autoComplete="new-password" /></label>
          <label className="fld"><span className="fld__label">გაიმეორეთ პაროლი</span><input type="password" value={f.password2} onChange={set("password2")} required autoComplete="new-password" /></label>
          <button className="btn btn--primary btn--block" disabled={busy}><span>{busy ? "…" : reset ? "პაროლის შენახვა" : "ანგარიშის შექმნა"}</span></button>
        </form>
      )}
    </div>
  );
}
