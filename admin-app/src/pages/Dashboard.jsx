import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useMeta } from "../context.jsx";
import { Card, Empty, Icon, Loading, PageHead, Pill } from "../components/ui.jsx";

export default function Dashboard() {
  const meta = useMeta();
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/dashboard").then(setD); }, []);
  if (!d) return <Loading />;
  const has = (p) => meta.me.perms.includes(p);
  const tiles = [
    has("inbox") && ["/inbox", d.newCount, "ახალი განაცხადი / ჯავშანი", "mail"],
    has("inbox") && ["/inbox", d.upcomingCount, "მომავალი კონსულტაცია", "calendar"],
    has("content") && ["/pages", d.pages, "გვერდი", "layers"],
    has("content") && ["/services", d.services, "სერვისი", "briefcase"],
  ].filter(Boolean);
  return (
    <>
      <PageHead title={"გამარჯობა, " + meta.user + " 👋"} sub="საიტის მოკლე მიმოხილვა" />
      <div className="tiles">
        {tiles.map(([to, n, label, icon], i) => (
          <Link key={i} to={to} className="tile">
            <span className="tile__ico"><Icon name={icon} /></span>
            <b>{n}</b><span>{label}</span>
          </Link>
        ))}
      </div>
      <div className="grid2">
        {has("inbox") && <Card title="მომავალი კონსულტაციები" actions={<Link className="link" to="/inbox">ყველა →</Link>}>
          {!d.upcoming.length ? <Empty icon="calendar" title="ჯერ ჯავშანი არ არის" /> : (
            <ul className="list">
              {d.upcoming.map((b) => (
                <li key={b.id}><span className="list__ico"><Icon name="calendar" /></span><div><b>{b.label}</b><span className="muted">{b.name} · {b.service}</span></div></li>
              ))}
            </ul>
          )}
        </Card>}
        {has("content") && <Card title="SEO შემოწმება" desc="სათაური 30–60, აღწერა 120–160 სიმბოლო — ორივე ენაზე">
          {!d.seo.length ? <p className="ok-line">✓ ყველა გვერდის SEO სათაური და აღწერა რეკომენდებულ ფარგლებშია.</p> : (
            <ul className="seo-list">
              {d.seo.map((x, i) => (
                <li key={i}>
                  <Link to={(x.kind === "page" ? "/pages/" : "/services/") + x.id}>{x.name}</Link>
                  <span className={"flag flag--" + x.lang}>{x.lang === "ka" ? "ქართ" : "ENG"}</span>
                  <Pill tone={x.ct}>სათაური {x.title}</Pill><Pill tone={x.cd}>აღწერა {x.desc}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>}
      </div>
      {has("content") && <Card title="სწრაფი მოქმედებები">
        <div className="quick">
          <Link className="btn btn--ghost" to="/pages/home"><Icon name="layers" /><span>მთავარი გვერდის რედაქტირება</span></Link>
          <Link className="btn btn--ghost" to="/services/new"><Icon name="plus" /><span>ახალი სერვისი</span></Link>
          <Link className="btn btn--ghost" to="/pages/new"><Icon name="plus" /><span>ახალი გვერდი</span></Link>
          <Link className="btn btn--ghost" to="/settings"><Icon name="phone" /><span>კონტაქტები</span></Link>
          <a className="btn btn--ghost" href="/sitemap.xml" target="_blank" rel="noreferrer"><Icon name="globe" /><span>sitemap.xml</span></a>
        </div>
      </Card>}
    </>
  );
}
