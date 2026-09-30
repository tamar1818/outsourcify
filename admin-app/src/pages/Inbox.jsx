import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../context.jsx";
import { Empty, Icon, Loading, PageHead, Pill, Tabs } from "../components/ui.jsx";

const STATUS = { new: ["ახალი", "bad"], contacted: ["დაკავშირებული", "warn"], done: ["დასრულებული", "ok"], cancelled: ["გაუქმებული", "off"] };
const FIELDS = {
  bookings: [["ელფოსტა", "email"], ["ტელეფონი", "phone"], ["ბიზნესი", "business"], ["მხარდაჭერა", "support"], ["შეტყობინება", "message"], ["ენა", "lang"], ["გაიგზავნა", "created"], ["გვერდი", "page"]],
  leads: [["ელფოსტა", "email"], ["ტელეფონი", "phone"], ["კომპანია", "company"], ["შეტყობინება", "message"], ["ენა", "lang"], ["გვერდი", "page"]],
};

export default function Inbox({ onChange }) {
  const toast = useToast();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState("bookings");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const load = () => api.get("/inbox").then((x) => {
    setD(x);
    onChange && onChange([...x.leads, ...x.bookings].filter((i) => (i.status || "new") === "new").length);
  });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return <Loading />;
  const rows = d[tab].filter((r) => filter === "all" || (r.status || "new") === filter);
  const setStatus = async (r, status) => {
    try { await api.patch(`/inbox/${tab}/${r.id}`, { status }); toast("სტატუსი შეიცვალა"); load(); } catch (e) { toast(e.message, "err"); }
  };
  const del = async (r) => {
    if (!window.confirm("წავშალოთ ჩანაწერი?")) return;
    try { await api.del(`/inbox/${tab}/${r.id}`); toast("წაიშალა"); load(); } catch (e) { toast(e.message, "err"); }
  };

  return (
    <>
      <PageHead title="განაცხადები და ჯავშნები" sub="ონლაინ დაჯავშნა და საკონტაქტო ფორმა">
        <a className="btn btn--ghost" href={`/admin/api/inbox/${tab}/export`}><Icon name="receipt" /><span>CSV ექსპორტი</span></a>
      </PageHead>
      <div className="toolbar">
        <Tabs tabs={[["bookings", "კონსულტაციები", d.bookings.length], ["leads", "საკონტაქტო ფორმა", d.leads.length]]} value={tab} onChange={(t) => { setTab(t); setOpen(null); }} />
        <select className="select-sm" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="სტატუსით ფილტრი">
          <option value="all">ყველა სტატუსი</option>
          {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      {!rows.length ? <Empty icon="mail" title="ჩანაწერი არ არის" /> : (
        <div className="entries">
          {rows.map((r) => {
            const st = r.status || "new";
            const isOpen = open === r.id;
            return (
              <div key={r.id} className={"entry entry--" + st + (isOpen ? " is-open" : "")}>
                <button type="button" className="entry__sum" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen}>
                  <span className="entry__avatar">{(r.name || "?").slice(0, 1)}</span>
                  <span className="entry__main"><b>{r.name}</b><span className="muted">{r.service || "—"}</span></span>
                  <span className="entry__when">{tab === "bookings" ? r.label : r.date}</span>
                  <Pill tone={STATUS[st][1]}>{STATUS[st][0]}</Pill>
                </button>
                {isOpen && (
                  <div className="entry__body">
                    <dl>
                      {FIELDS[tab].map(([lab, k]) => {
                        let v = r[k];
                        v = Array.isArray(v) ? v.join(", ") : String(v ?? "");
                        if (!v) return null;
                        return [<dt key={k + "t"}>{lab}</dt>, <dd key={k}>{k === "email" ? <a href={"mailto:" + v}>{v}</a> : k === "phone" ? <a href={"tel:" + v.replace(/[^\d+]/g, "")}>{v}</a> : v}</dd>];
                      })}
                    </dl>
                    <div className="entry__act">
                      <span className="muted small">სტატუსი:</span>
                      {Object.entries(STATUS).map(([k, [l]]) => (
                        <button type="button" key={k} className={"chip" + (st === k ? " on" : "")} onClick={() => setStatus(r, k)}>{l}</button>
                      ))}
                      <button type="button" className="link link--danger" onClick={() => del(r)}>წაშლა</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
