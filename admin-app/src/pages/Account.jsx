import { useState } from "react";
import QRCode from "qrcode";
import { api } from "../api.js";
import { useMeta, useToast } from "../context.jsx";
import { Button, Card, PageHead } from "../components/ui.jsx";
import { PERM_LABELS } from "../perms.js";

function TwoFactor({ me, reload, toast }) {
  const [setup, setSetup] = useState(null); // { secret, uri, qr }
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState(null);
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState(""); // "off" | "codes"

  const begin = async () => {
    try {
      const r = await api.post("/2fa/setup");
      const qr = await QRCode.toDataURL(r.uri, { margin: 1, width: 220 });
      setSetup({ ...r, qr }); setCode("");
    } catch (x) { toast(x.message, "err"); }
  };
  const enable = async (e) => {
    e.preventDefault();
    try { const r = await api.post("/2fa/enable", { code }); setCodes(r.codes); setSetup(null); toast("ორსაფეხურიანი შესვლა ჩაირთო"); reload(); } catch (x) { toast(x.message, "err"); }
  };
  const confirmPw = async (e) => {
    e.preventDefault();
    try {
      if (mode === "off") { await api.post("/2fa/disable", { password: pw }); toast("ორსაფეხურიანი შესვლა გამოირთო", "err"); reload(); }
      else { const r = await api.post("/2fa/codes", { password: pw }); setCodes(r.codes); }
      setMode(""); setPw("");
    } catch (x) { toast(x.message, "err"); }
  };
  const download = () => {
    const blob = new Blob(["Outsourcify CMS — სარეზერვო კოდები (@" + me.user + ")\nთითოეული ერთჯერადია.\n\n" + codes.join("\n") + "\n"], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "outsourcify-recovery-codes.txt"; a.click();
  };

  return (
    <Card title="ორსაფეხურიანი შესვლა (2FA)" desc="პაროლის გარდა, შესვლისას ტელეფონის აპლიკაციის 6-ციფრა კოდიც მოითხოვება — პაროლის მოპარვის შემთხვევაშიც კი ანგარიში დაცულია.">
      {codes ? (
        <div className="stack">
          <div className="alert" role="note">შეინახეთ ეს სარეზერვო კოდები უსაფრთხო ადგილას (მაგ. პაროლების მენეჯერში). ტელეფონის დაკარგვისას თითოეულით ერთხელ შეხვალთ. ეს სია მეორედ აღარ გამოჩნდება.</div>
          <pre className="codes">{codes.join("\n")}</pre>
          <div className="row-btns"><Button variant="ghost" icon="file-check" onClick={download}>ჩამოტვირთვა (.txt)</Button><Button icon="check" onClick={() => setCodes(null)}>შევინახე</Button></div>
        </div>
      ) : setup ? (
        <form onSubmit={enable} className="stack">
          <ol className="steps">
            <li>დააყენეთ ტელეფონზე <b>Google Authenticator</b>, <b>Microsoft Authenticator</b> ან <b>Authy</b>.</li>
            <li>აპლიკაციაში დააჭირეთ „+“ და დაასკანერეთ QR კოდი:</li>
          </ol>
          <img className="qr" src={setup.qr} alt="QR კოდი ავთენტიფიკატორისთვის" width="220" height="220" />
          <p className="muted small">ვერ ასკანერებთ? შეიყვანეთ გასაღები ხელით: <code className="secret">{setup.secret.match(/.{1,4}/g).join(" ")}</code></p>
          <label className="fld"><span className="fld__label">3. აპლიკაციაში გამოჩენილი 6-ციფრა კოდი</span><input value={code} onChange={(e) => setCode(e.target.value)} required inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="123456" /></label>
          <div className="row-btns"><Button variant="ghost" onClick={() => setSetup(null)}>გაუქმება</Button><button className="btn btn--primary"><span>ჩართვა</span></button></div>
        </form>
      ) : mode ? (
        <form onSubmit={confirmPw} className="stack">
          <label className="fld"><span className="fld__label">დაადასტურეთ პაროლით</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" autoFocus /></label>
          <div className="row-btns"><Button variant="ghost" onClick={() => { setMode(""); setPw(""); }}>გაუქმება</Button><button className={"btn " + (mode === "off" ? "btn--danger" : "btn--primary")}><span>{mode === "off" ? "გამორთვა" : "ახალი კოდები"}</span></button></div>
        </form>
      ) : me.twofa ? (
        <div className="stack">
          <p><span className="pill pill--ok">ჩართულია</span></p>
          <div className="row-btns"><Button variant="ghost" icon="lock" onClick={() => setMode("codes")}>ახალი სარეზერვო კოდები</Button><Button variant="danger" icon="x" onClick={() => setMode("off")}>გამორთვა</Button></div>
        </div>
      ) : (
        <div className="stack">
          <p><span className="pill pill--off">გამორთულია</span> — გირჩევთ ჩართოთ.</p>
          <Button icon="lock" onClick={begin}>ჩართვა</Button>
        </div>
      )}
    </Card>
  );
}

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
        <TwoFactor me={meta.me} reload={meta.reloadMeta} toast={toast} />
      </div>
    </>
  );
}
