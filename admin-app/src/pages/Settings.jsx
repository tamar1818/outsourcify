import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { useMeta, useSaveShortcut, useToast, useUnsaved } from "../context.jsx";
import { Field, FieldSet, Repeater } from "../components/Fields.jsx";
import { Button, Card, Loading, PageHead, Tabs } from "../components/ui.jsx";

const TABS = [["contacts", "კონტაქტები"], ["seo", "SEO და ანალიტიკა"], ["booking", "დაჯავშნის განრიგი"], ["process", "პროცესი და CTA"], ["ui", "ინტერფეისის ტექსტები"]];
const CONTACT_KEYS = ["company", "phone", "email", "notify_email", "address", "city", "hours", "map_embed", "facebook", "linkedin", "instagram", "footer_text"];
const SEO_KEYS = ["domain", "ga_id", "gsc_verification", "gsc_file", "noindex_all"];

export default function Settings() {
  const meta = useMeta();
  const toast = useToast();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") || "contacts");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  useUnsaved(dirty);
  useEffect(() => { api.get("/settings").then(setD); }, []);
  const set = (k) => (v) => { setD((x) => ({ ...x, [k]: v })); setDirty(true); };

  const save = useCallback(async () => {
    if (!d || busy) return;
    setBusy(true);
    try { await api.put("/settings", d); setDirty(false); toast("პარამეტრები შენახულია"); } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }, [d, busy]); // eslint-disable-line react-hooks/exhaustive-deps
  useSaveShortcut(save);

  if (!d) return <Loading />;
  const bk = d.booking;
  const setBk = (k, v) => set("booking")({ ...bk, [k]: v });

  return (
    <>
      <PageHead title="პარამეტრები">
        <Button onClick={save} disabled={busy || !dirty} icon="check">{busy ? "ინახება…" : dirty ? "შენახვა" : "შენახულია"}</Button>
      </PageHead>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "contacts" && <Card><FieldSet defs={meta.settingsDefs} only={CONTACT_KEYS} value={d.settings} onChange={set("settings")} /></Card>}

      {tab === "seo" && (
        <>
          <Card><FieldSet defs={meta.settingsDefs} only={SEO_KEYS} value={d.settings} onChange={set("settings")} /></Card>
          <Card title="კომპანიის აღწერა (Organization schema)">
            <Field def={{ type: "textarea", label: "აღწერა", i18n: true }} value={d.seo.org_description} onChange={(v) => set("seo")({ ...d.seo, org_description: v })} />
          </Card>
          <Card title="ტექნიკური SEO — ავტომატურად">
            <ul className="bullets">
              <li><a href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml</a> — ყოველთვის აქტუალური, ორივე ენის ალტერნატივებით</li>
              <li><a href="/robots.txt" target="_blank" rel="noreferrer">/robots.txt</a></li>
              <li>Schema.org: Organization / AccountingService, WebSite, WebPage, BreadcrumbList, Service, FAQPage</li>
              <li>hreflang (ka / en / x-default) და canonical ყველა გვერდზე</li>
            </ul>
          </Card>
        </>
      )}

      {tab === "booking" && (
        <Card title="კონსულტაციის განრიგი" desc="დროები თბილისის დროით. „გაუქმებული“ ჯავშანი დროს ისევ ათავისუფლებს.">
          <div className="fld">
            <span className="fld__label">სამუშაო დღეები</span>
            <div className="days">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button type="button" key={n} className={"day" + (bk.days.includes(n) ? " on" : "")} aria-pressed={bk.days.includes(n)}
                  onClick={() => setBk("days", bk.days.includes(n) ? bk.days.filter((x) => x !== n) : [...bk.days, n].sort())}>{meta.weekdays[n]}</button>
              ))}
            </div>
          </div>
          <div className="row2">
            <label className="fld"><span className="fld__label">დაწყება</span><input type="time" value={bk.start} onChange={(e) => setBk("start", e.target.value)} /></label>
            <label className="fld"><span className="fld__label">დასრულება</span><input type="time" value={bk.end} onChange={(e) => setBk("end", e.target.value)} /></label>
          </div>
          <div className="row3">
            <label className="fld"><span className="fld__label">ხანგრძლივობა (წთ)</span><input type="number" min="15" max="120" step="5" value={bk.slot} onChange={(e) => setBk("slot", +e.target.value)} /></label>
            <label className="fld"><span className="fld__label">მინ. საათი ჯავშნამდე</span><input type="number" min="0" max="72" value={bk.notice} onChange={(e) => setBk("notice", +e.target.value)} /></label>
            <label className="fld"><span className="fld__label">რამდენი დღით წინ</span><input type="number" min="1" max="90" value={bk.ahead} onChange={(e) => setBk("ahead", +e.target.value)} /></label>
          </div>
          <label className="fld"><span className="fld__label">დაკეტილი თარიღები (უქმეები, შვებულება)</span><small className="hint">ფორმატი 2026-01-01 — თითო ხაზზე</small>
            <textarea rows="3" value={(Array.isArray(bk.blocked) ? bk.blocked : []).join("\n")} onChange={(e) => setBk("blocked", e.target.value.split("\n"))} />
          </label>
        </Card>
      )}

      {tab === "process" && (
        <>
          <Card title="საერთო პროცესი" desc="„პროცესი“ ბლოკებში (საერთო ნაბიჯები) და ყველა სერვისის გვერდზე">
            <Repeater def={{ label: "ნაბიჯები", fields: meta.recordDefs.step, add: "ნაბიჯის დამატება" }} value={d.process} onChange={set("process")} />
          </Card>
          <Card title="საერთო CTA ბლოკი" desc="ჩნდება სერვისების გვერდების ბოლოს">
            <FieldSet defs={meta.blockDefs.cta.fields} value={d.cta} onChange={set("cta")} />
          </Card>
        </>
      )}

      {tab === "ui" && (
        <Card title="ინტერფეისის ტექსტები" desc="ღილაკები, ფორმის ლეიბლები, ჩატის კითხვები. ცარიელი = ნაგულისხმევი ტექსტი (ნაცრისფრად ჩანს). {name} — კლიენტის სახელი.">
          <div className="search search--wide"><input placeholder="ძებნა გასაღებით ან ტექსტით…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="ui-list">
            {Object.entries(meta.strings).filter(([k, v]) => !q || (k + v.ka + v.en).toLowerCase().includes(q.toLowerCase())).map(([k, v]) => (
              <div className="fld" key={k}>
                <span className="fld__label mono small">{k}</span>
                <div className="i18n">
                  {["ka", "en"].map((l) => (
                    <div className="i18n__col" key={l}><span className={"flag flag--" + l}>{l === "ka" ? "ქართ" : "ENG"}</span>
                      <input type="text" placeholder={v[l]} value={(d.ui[k] || {})[l] || ""} onChange={(e) => set("ui")({ ...d.ui, [k]: { ...(d.ui[k] || {}), [l]: e.target.value } })} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
