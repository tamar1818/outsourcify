import { useCallback, useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { api, setCsrf } from "./api.js";
import { MetaContext } from "./context.jsx";
import { Icon, Loading } from "./components/ui.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Pages from "./pages/Pages.jsx";
import PageEditor from "./pages/PageEditor.jsx";
import Services from "./pages/Services.jsx";
import ServiceEditor from "./pages/ServiceEditor.jsx";
import Collection from "./pages/Collection.jsx";
import Menus from "./pages/Menus.jsx";
import Settings from "./pages/Settings.jsx";
import Media from "./pages/Media.jsx";
import Inbox from "./pages/Inbox.jsx";
import Backup from "./pages/Backup.jsx";
import Account from "./pages/Account.jsx";
import Users from "./pages/Users.jsx";
import Invite from "./pages/Invite.jsx";

// [მისამართი, სახელი, ხატულა, საჭირო უფლება]
const NAV = [
  ["კონტენტი", [
    ["/", "მთავარი", "bars", ""], ["/pages", "გვერდები", "layers", "content"], ["/services", "სერვისები", "briefcase", "content"],
    ["/faqs", "FAQ", "message", "content"], ["/testimonials", "შეფასებები", "quote", "content"], ["/team", "გუნდი", "users", "content"],
    ["/clients", "კლიენტები", "handshake", "content"], ["/industries", "ვისთან ვმუშაობთ", "building", "content"],
  ]],
  ["საიტი", [["/menus", "მენიუ და ფუტერი", "menu", "content"], ["/media", "ფოტოები", "folder", "media"], ["/settings", "პარამეტრები", "settings", "settings"]]],
  ["კლიენტები", [["/inbox", "განაცხადები", "mail", "inbox"]]],
  ["სისტემა", [["/users", "ადმინისტრატორები", "shield", "users"], ["/backup", "სარეზერვო ასლი", "folder", "backup"]]],
];
const inviteToken = () => (window.location.pathname.match(/^\/admin\/invite\/([\w-]+)/) || [])[1];

export default function App() {
  const [session, setSession] = useState(null);
  const [meta, setMeta] = useState(null);

  const refresh = useCallback(async () => {
    const s = await api.get("/session");
    setCsrf(s.csrf);
    setSession(s);
    if (s.user) setMeta(await api.get("/meta"));
  }, []);
  useEffect(() => { refresh().catch(() => setSession({ installed: true, user: null })); }, [refresh]);

  const token = inviteToken();
  if (token) return <Invite token={token} onDone={refresh} />;
  if (!session) return <Loading />;
  if (!session.user) return <Login installed={session.installed} onDone={refresh} />;
  if (!meta) return <Loading />;
  return (
    <MetaContext.Provider value={{ ...meta, reloadMeta: async () => setMeta(await api.get("/meta")) }}>
      <Shell user={session.user} perms={meta.me.perms} onLogout={async () => { await api.post("/logout"); setMeta(null); refresh(); }} />
    </MetaContext.Provider>
  );
}

function Shell({ user, perms, onLogout }) {
  const has = (p) => !p || perms.includes(p);
  const guard = (p, el) => (has(p) ? el : <Navigate to="/" replace />);
  const [badge, setBadge] = useState(0);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => { if (has("inbox")) api.get("/dashboard").then((d) => setBadge(d.newCount)).catch(() => {}); }, [loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [loc.pathname]);

  return (
    <div className="shell">
      <aside className={"side" + (menu ? " is-open" : "")}>
        <div className="side__top">
          <NavLink to="/" className="brand"><img src="/assets/img/brand/outsourcify-mark.svg" alt="" width="30" height="30" /><span>Outsourcify<small>CMS</small></span></NavLink>
          <button type="button" className="iconbtn side__burger" onClick={() => setMenu(!menu)} aria-label="მენიუ"><Icon name={menu ? "x" : "menu"} /></button>
        </div>
        <nav className="side__nav">
          {NAV.map(([group, all]) => [group, all.filter((x) => has(x[3]))]).filter(([, items]) => items.length).map(([group, items]) => (
            <div key={group} className="side__group">
              <p className="side__label">{group}</p>
              {items.map(([to, label, icon]) => (
                <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "on" : "")}>
                  <Icon name={icon} /><span>{label}</span>{to === "/inbox" && badge > 0 && <b className="badge">{badge}</b>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side__foot">
          <a href="/" target="_blank" rel="noreferrer"><Icon name="arrow-up-right" /><span>საიტის ნახვა</span></a>
          <NavLink to="/account"><Icon name="lock" /><span>{user}</span></NavLink>
          <button type="button" onClick={onLogout}><Icon name="x" /><span>გასვლა</span></button>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pages" element={guard("content", <Pages />)} />
          <Route path="/pages/new" element={guard("content", <PageEditor isNew />)} />
          <Route path="/pages/:id" element={guard("content", <PageEditor />)} />
          <Route path="/services" element={guard("content", <Services />)} />
          <Route path="/services/new" element={guard("content", <ServiceEditor isNew />)} />
          <Route path="/services/:id" element={guard("content", <ServiceEditor />)} />
          <Route path="/faqs" element={guard("content", <Collection name="faqs" />)} />
          <Route path="/testimonials" element={guard("content", <Collection name="testimonials" />)} />
          <Route path="/team" element={guard("content", <Collection name="team" />)} />
          <Route path="/clients" element={guard("content", <Collection name="clients" />)} />
          <Route path="/industries" element={guard("content", <Collection name="industries" />)} />
          <Route path="/menus" element={guard("content", <Menus />)} />
          <Route path="/settings" element={guard("settings", <Settings />)} />
          <Route path="/media" element={guard("media", <Media />)} />
          <Route path="/inbox" element={guard("inbox", <Inbox onChange={setBadge} />)} />
          <Route path="/backup" element={guard("backup", <Backup />)} />
          <Route path="/account" element={<Account />} />
          <Route path="/users" element={guard("users", <Users />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
