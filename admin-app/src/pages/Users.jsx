import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useMeta, useToast } from "../context.jsx";
import { Button, Card, Icon, Loading, Modal, PageHead } from "../components/ui.jsx";
import { PERM_LABELS, ROLES, roleName } from "../perms.js";

const date = (t) => (t ? new Date(t).toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric" }) : "—");

function PermPicker({ value, onChange, disabled }) {
  const toggle = (p) => onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
  return (
    <div className="perms">
      <div className="perms__roles">
        {ROLES.map(([name, p]) => (
          <button type="button" key={name} disabled={disabled} className={"chipbtn" + (roleName(value) === name ? " on" : "")} onClick={() => onChange(p)}>{name}</button>
        ))}
      </div>
      {Object.entries(PERM_LABELS).map(([p, [label, desc]]) => (
        <label key={p} className={"perm" + (value.includes(p) ? " on" : "")}>
          <input type="checkbox" checked={value.includes(p)} disabled={disabled} onChange={() => toggle(p)} />
          <span><b>{label}</b><small>{desc}</small></span>
        </label>
      ))}
    </div>
  );
}

function LinkBox({ link, note }) {
  const toast = useToast();
  return (
    <div className="linkbox">
      <p className="muted small">{note}</p>
      <div className="linkbox__row">
        <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="ბმული" />
        <Button icon="file-check" onClick={() => { navigator.clipboard?.writeText(link); toast("ბმული დაკოპირდა"); }}>კოპირება</Button>
      </div>
    </div>
  );
}

export default function Users() {
  const meta = useMeta();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [inv, setInv] = useState(null);      // ახალი მოწვევის ფორმა
  const [made, setMade] = useState(null);    // შექმნილი ბმული
  const [edit, setEdit] = useState(null);    // რედაქტირებადი მომხმარებელი
  const load = () => api.get("/users").then(setData).catch((e) => toast(e.message, "err"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createInvite = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/invites", inv);
      setInv(null);
      setMade({ link: r.link, note: r.sent ? "მოწვევა გაიგზავნა ელფოსტით. ბმული აქაც შეგიძლიათ დააკოპიროთ:" : "გაუგზავნეთ ეს ბმული ადამიანს, ვისაც იწვევთ (ერთჯერადია, მოქმედებს 7 დღე):" });
      load();
    } catch (x) { toast(x.message, "err"); }
  };
  const saveUser = async () => {
    try { await api.put("/users/" + edit.id, { name: edit.name, email: edit.email, perms: edit.perms, disabled: edit.disabled }); toast("შენახულია"); setEdit(null); load(); }
    catch (x) { toast(x.message, "err"); }
  };
  const del = async (u) => {
    if (!window.confirm(`წავშალოთ ${u.name}-ის ანგარიში? მისი სესია მაშინვე დასრულდება.`)) return;
    try { await api.del("/users/" + u.id); toast("ანგარიში წაიშალა"); setEdit(null); load(); } catch (x) { toast(x.message, "err"); }
  };
  const reset = async (u) => {
    try { const r = await api.post("/users/" + u.id + "/reset"); setEdit(null); setMade({ link: r.link, note: `პაროლის აღდგენის ბმული (${u.name}) — ერთჯერადია, მოქმედებს 24 საათი:` }); load(); }
    catch (x) { toast(x.message, "err"); }
  };
  const revoke = async (i) => { try { await api.del("/invites/" + i.id); toast("ბმული გაუქმდა"); load(); } catch (x) { toast(x.message, "err"); } };

  if (!data) return <Loading />;
  const pending = data.invites;
  return (
    <>
      <PageHead title="ადმინისტრატორები" sub="ახალი ადმინისტრატორი მხოლოდ მოწვევის ბმულით რეგისტრირდება — საჯარო რეგისტრაცია გამორთულია.">
        <Button icon="plus" onClick={() => setInv({ name: "", email: "", perms: ROLES[1][1], send: true })}>ადმინისტრატორის მოწვევა</Button>
      </PageHead>

      <Card title={`ანგარიშები (${data.users.length})`}>
        <div className="ulist">
          {data.users.map((u) => (
            <div key={u.id} className={"urow" + (u.disabled ? " is-off" : "")}>
              <span className="urow__av" aria-hidden="true">{(u.name || u.user).charAt(0).toUpperCase()}</span>
              <div className="urow__main">
                <b>{u.name} {u.id === meta.me.id && <span className="pill">თქვენ</span>} {u.owner && <span className="pill pill--ok">მფლობელი</span>} {u.disabled && <span className="pill pill--off">გათიშული</span>}</b>
                <small className="muted">@{u.user}{u.email ? " · " + u.email : ""} · ბოლო შესვლა: {date(u.last)}</small>
              </div>
              <span className="urow__role">{u.owner ? "ყველა უფლება" : roleName(u.perms)}</span>
              <Button variant="ghost" size="sm" icon="settings" onClick={() => setEdit({ ...u })}>მართვა</Button>
            </div>
          ))}
        </div>
      </Card>

      {pending.length > 0 && (
        <Card title={`მოლოდინში მყოფი ბმულები (${pending.length})`} desc="ბმული ერთჯერადია. გაუქმებული ან გამოყენებული ბმული აღარ მუშაობს.">
          <div className="ulist">
            {pending.map((i) => (
              <div key={i.id} className="urow">
                <span className="urow__av urow__av--inv" aria-hidden="true"><Icon name={i.kind === "reset" ? "lock" : "mail"} size={18} /></span>
                <div className="urow__main">
                  <b>{i.kind === "reset" ? "პაროლის აღდგენა — " + i.name : (i.name || i.email || "მოწვევა")}</b>
                  <small className="muted">{i.kind === "invite" && (i.email ? i.email + " · " : "") + roleName(i.perms) + " · "}იწვევს: {i.by || "—"} · ვადა: {date(i.expires)}</small>
                </div>
                <Button variant="ghost" size="sm" icon="x" onClick={() => revoke(i)}>გაუქმება</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={!!inv} title="ადმინისტრატორის მოწვევა" onClose={() => setInv(null)}>
        {inv && (
          <form onSubmit={createInvite} className="stack">
            <label className="fld"><span className="fld__label">სახელი და გვარი</span><input value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} placeholder="მაგ. ნატალია ჯაფარიძე" /></label>
            <label className="fld"><span className="fld__label">ელფოსტა (არასავალდებულო)</span><input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="name@outsourcify.ge" /></label>
            {inv.email && <label className="check"><input type="checkbox" checked={inv.send} onChange={(e) => setInv({ ...inv, send: e.target.checked })} /> <span>მოწვევის გაგზავნა ელფოსტით (თუ SMTP კონფიგურირებულია)</span></label>}
            <div className="fld"><span className="fld__label">უფლებები</span><PermPicker value={inv.perms} onChange={(p) => setInv({ ...inv, perms: p })} /></div>
            <div className="modal__actions"><Button variant="ghost" onClick={() => setInv(null)}>გაუქმება</Button><button className="btn btn--primary"><Icon name="send" size={18} /><span>ბმულის შექმნა</span></button></div>
          </form>
        )}
      </Modal>

      <Modal open={!!made} title="ბმული მზადაა" onClose={() => setMade(null)}>
        {made && <LinkBox link={made.link} note={made.note} />}
      </Modal>

      <Modal open={!!edit} title={edit ? edit.name : ""} onClose={() => setEdit(null)}>
        {edit && (
          <div className="stack">
            <label className="fld"><span className="fld__label">სახელი და გვარი</span><input value={edit.name} disabled={edit.owner && edit.id !== meta.me.id} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label className="fld"><span className="fld__label">ელფოსტა</span><input type="email" value={edit.email} disabled={edit.owner && edit.id !== meta.me.id} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></label>
            {edit.owner ? <p className="muted small">მფლობელს ყოველთვის აქვს ყველა უფლება. მისი ანგარიშის წაშლა შეუძლებელია.</p> : (
              <>
                <div className="fld"><span className="fld__label">უფლებები</span><PermPicker value={edit.perms} onChange={(p) => setEdit({ ...edit, perms: p })} /></div>
                {edit.id !== meta.me.id && <label className="check"><input type="checkbox" checked={edit.disabled} onChange={(e) => setEdit({ ...edit, disabled: e.target.checked })} /> <span>ანგარიშის დროებით გათიშვა (ვეღარ შევა)</span></label>}
              </>
            )}
            <div className="modal__actions modal__actions--split">
              <div className="row-btns">
                {(!edit.owner || edit.id === meta.me.id) && <Button variant="ghost" size="sm" icon="lock" onClick={() => reset(edit)}>პაროლის აღდგენის ბმული</Button>}
                {!edit.owner && edit.id !== meta.me.id && <Button variant="danger" size="sm" icon="x" onClick={() => del(edit)}>წაშლა</Button>}
              </div>
              {(!edit.owner || edit.id === meta.me.id) && <Button icon="check" onClick={saveUser}>შენახვა</Button>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
