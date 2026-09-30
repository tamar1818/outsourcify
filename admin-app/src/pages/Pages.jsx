import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Icon, L, Loading, PageHead, Pill, lenTone } from "../components/ui.jsx";

export default function Pages() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  useEffect(() => { api.get("/pages").then(setList); }, []);
  if (!list) return <Loading />;
  const shown = list.filter((p) => !q || (L(p.title) + " " + L(p.title, "en")).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title="გვერდები" sub="ყველა გვერდი იკრიბება ბლოკებისგან — ორივე ენაზე ერთი და იგივე სტრუქტურით">
        <Link className="btn btn--primary" to="/pages/new"><Icon name="plus" /><span>ახალი გვერდი</span></Link>
      </PageHead>
      <div className="toolbar"><div className="search"><Icon name="search" /><input placeholder="ძებნა…" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      <div className="rows">
        {shown.map((p) => {
          const t = L((p.seo || {}).title);
          const d = L((p.seo || {}).description);
          return (
            <Link key={p.id} to={"/pages/" + p.id} className="row">
              <span className="row__ico"><Icon name={p.template === "home" ? "star" : "layers"} /></span>
              <span className="row__main">
                <b>{L(p.title)} {p.hidden && <Pill tone="off">დამალული</Pill>} {p.noindex && <Pill tone="warn">noindex</Pill>}</b>
                <small className="muted">{p.urls.ka} · {p.urls.en} · {p.blocks} ბლოკი</small>
              </span>
              <span className="row__meta"><Pill tone={lenTone(t.length, 30, 60)}>T {t.length}</Pill><Pill tone={lenTone(d.length, 120, 160)}>D {d.length}</Pill></span>
              <Icon name="chevron-right" className="row__go" />
            </Link>
          );
        })}
      </div>
    </>
  );
}
