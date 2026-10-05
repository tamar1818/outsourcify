"use strict";
/**
 * კომპონენტების (ბლოკების) და ჩანაწერების სქემები.
 * ერთი წყარო ადმინის ფორმებისთვის (ველები ავტომატურად იხატება) და შენახვისას გასუფთავებისთვის.
 *
 * ველის ტიპები: text · textarea · rich · image · link · icon · select · check · number · list · repeater
 * i18n: true — ველს აქვს ქართული და ინგლისური ვერსია.
 */
const { LANGS, richHtml, stripTags } = require("./core");
const { ICONS } = require("./icons");

const f = (type, label, extra = {}) => ({ type, label, ...extra });

const fHead = () => ({
  eyebrow: f("text", "ზედა წარწერა (eyebrow)", { i18n: true }),
  title: f("text", "სათაური", { i18n: true, hint: "აქცენტისთვის: <em>სიტყვა</em>" }),
  text: f("textarea", "აღწერა", { i18n: true }),
});

const fCta = (n = "", label = "ღილაკი") => ({
  [`cta${n}_label`]: f("text", `${label} — ტექსტი`, { i18n: true }),
  [`cta${n}_link`]: f("link", `${label} — ბმული`),
});

const faqCategories = () => ({ general: "ზოგადი", services: "სერვისები", process: "თანამშრომლობა", booking: "კონსულტაცია" });

let blockCache = null;
function blockDefs() {
  if (blockCache) return blockCache;
  const itemCard = { icon: f("icon", "ხატულა"), title: f("text", "სათაური", { i18n: true }), text: f("textarea", "ტექსტი", { i18n: true }) };
  return (blockCache = {
    hero: { label: "მთავარი Hero", desc: "მთავარი გვერდის პირველი ეკრანი", fields: {
      ...fHead(), ...fCta("1", "მთავარი ღილაკი"), ...fCta("2", "მეორე ღილაკი"), ...fCta("3", "მესამე ღილაკი (ბმული)"),
      points: f("list", "მოკლე უპირატესობები (თითო ხაზზე ერთი)", { i18n: true }),
      image: f("image", "სურათი"),
      image_alt: f("text", "სურათის alt ტექსტი", { i18n: true }),
      card1: f("text", "მცურავი ბარათი 1", { i18n: true }),
      card2: f("text", "მცურავი ბარათი 2", { i18n: true }),
      card3: f("text", "მცურავი ბარათი 3", { i18n: true }),
    } },
    page_hero: { label: "გვერდის სათაური", desc: "შიდა გვერდის ზედა ბლოკი ბილიკით", fields: {
      ...fHead(), ...fCta("", "ღილაკი"),
      image: f("image", "სურათი (არასავალდებულო)"),
      image_alt: f("text", "სურათის alt ტექსტი", { i18n: true }),
    } },
    cards: { label: "ბარათები", desc: "უპირატესობები, ღირებულებები, მახასიათებლები", fields: {
      ...fHead(),
      variant: f("select", "სტილი", { options: { grid: "ბადე (თეთრი ბარათები)", strip: "ზოლი (კომპაქტური)", bento: "მუქი bento", numbered: "დანომრილი სია" } }),
      items: f("repeater", "ბარათები", { fields: itemCard, add: "ბარათის დამატება" }),
      ...fCta("", "ღილაკი"),
    } },
    services: { label: "სერვისების ბადე", desc: "სერვისები ავტომატურად — „სერვისები“ განყოფილებიდან", fields: {
      ...fHead(),
      layout: f("select", "განლაგება", { options: { grid: "ბარათები", list: "ინტერაქტიული სია" } }),
      limit: f("number", "რაოდენობა (0 = ყველა)"),
      ...fCta("", "ღილაკი"),
    } },
    split: { label: "სურათი + ტექსტი", desc: "მონაცვლე სექცია სურათითა და სიით", fields: {
      ...fHead(),
      points: f("list", "პუნქტები (თითო ხაზზე ერთი)", { i18n: true }),
      image: f("image", "სურათი"),
      image_alt: f("text", "სურათის alt ტექსტი", { i18n: true }),
      reverse: f("check", "სურათი მარცხნივ"),
      badge_title: f("text", "სურათზე ბარათი — სათაური", { i18n: true }),
      badge_text: f("text", "სურათზე ბარათი — ტექსტი", { i18n: true }),
      ...fCta("", "ღილაკი"),
    } },
    steps: { label: "პროცესი / ნაბიჯები", desc: "როგორ ვმუშაობთ", fields: {
      ...fHead(),
      use_global: f("check", "საერთო ნაბიჯები (პარამეტრები → პროცესი)"),
      items: f("repeater", "საკუთარი ნაბიჯები", { fields: { title: f("text", "სათაური", { i18n: true }), text: f("textarea", "ტექსტი", { i18n: true }) }, add: "ნაბიჯის დამატება" }),
      ...fCta("", "ღილაკი"),
    } },
    compare: { label: "შედარების ცხრილი", desc: "მაგ. შიდა ბუღალტერი vs აუთსორსინგი", fields: {
      ...fHead(),
      col_a: f("text", "სვეტი A (სათაური)", { i18n: true }),
      col_b: f("text", "სვეტი B (სათაური, გამოკვეთილი)", { i18n: true }),
      rows: f("repeater", "სტრიქონები", { fields: {
        criterion: f("text", "კრიტერიუმი", { i18n: true }), a: f("text", "A", { i18n: true }), b: f("text", "B", { i18n: true }),
      }, add: "სტრიქონის დამატება" }),
    } },
    industries: { label: "ვისთან ვმუშაობთ", desc: "კლიენტების ტიპები — „ინდუსტრიები“ განყოფილებიდან", fields: { ...fHead(), ...fCta("", "ღილაკი") } },
    testimonials: { label: "შეფასებები", desc: "ჩნდება მხოლოდ მაშინ, როცა შეფასება დამატებულია", fields: fHead() },
    faq: { label: "FAQ", desc: "კითხვები „FAQ“ განყოფილებიდან + FAQ schema", fields: {
      ...fHead(),
      category: f("select", "კატეგორია", { options: { "": "ყველა", ...faqCategories() } }),
      limit: f("number", "რაოდენობა (0 = ყველა)"),
      ...fCta("", "ღილაკი"),
    } },
    cta: { label: "CTA ბლოკი", desc: "დიდი მოწოდება მოქმედებისკენ", fields: {
      ...fHead(), ...fCta("1", "მთავარი ღილაკი"), ...fCta("2", "მეორე ღილაკი"),
      image: f("image", "სურათი (არასავალდებულო — ბანერის მარჯვენა მხარე)"),
      image_alt: f("text", "სურათის alt ტექსტი", { i18n: true }),
    } },
    showcase: { label: "სერვისების ჩანართები", desc: "ინტერაქტიული ჩანართები სურათითა და დეტალებით (ცარიელ სიაზე — სერვისები ავტომატურად)", fields: {
      ...fHead(), ...fCta("", "ღილაკი"),
      items: f("repeater", "საკუთარი ჩანართები (არასავალდებულო)", { fields: {
        icon: f("icon", "ხატულა"),
        title: f("text", "სათაური", { i18n: true }),
        text: f("textarea", "აღწერა", { i18n: true }),
        points: f("list", "პუნქტები (თითო ხაზზე ერთი)", { i18n: true }),
        image: f("image", "სურათი"),
        image_alt: f("text", "სურათის alt ტექსტი", { i18n: true }),
        link: f("link", "ბმული „დეტალურად“ ღილაკისთვის (არასავალდებულო)"),
      }, add: "ჩანართის დამატება" }),
    } },
    pricing: { label: "ფასები", desc: "ფასების ცხრილი ჩანართებით: ჯგუფი → ქვეჯგუფი → სტრიქონები", fields: {
      ...fHead(),
      groups: f("repeater", "ჯგუფები (ჩანართები)", { fields: {
        title: f("text", "ჯგუფის სახელი (მაგ. შპს-ის ბუღალტრული მომსახურება)", { i18n: true }),
        sections: f("repeater", "ქვეჯგუფები", { fields: {
          title: f("text", "ქვეჯგუფის სახელი (მაგ. ვაჭრობა; შეიძლება ცარიელი)", { i18n: true }),
          rows: f("repeater", "სტრიქონები", { fields: {
            label: f("text", "დასახელება", { i18n: true }),
            price: f("text", "ფასი ლარში (მაგ. 1 500). ცარიელზე სტრიქონი ქვესათაურად გამოჩნდება"),
          }, add: "სტრიქონის დამატება" }),
        }, add: "ქვეჯგუფის დამატება" }),
      }, add: "ჯგუფის დამატება" }),
      note: f("textarea", "შენიშვნა ცხრილის ქვეშ", { i18n: true }),
      ...fCta("", "ღილაკი"),
    } },
    statement: { label: "მისია / განცხადება", desc: "დიდი ტექსტი ცენტრში — მისია, ციტატა", fields: {
      eyebrow: f("text", "ზედა წარწერა", { i18n: true }),
      text: f("textarea", "ტექსტი", { i18n: true }),
    } },
    team: { label: "გუნდი (სლაიდერი)", desc: "გუნდის წევრები „გუნდი“ განყოფილებიდან — სლაიდერი ღილაკით", fields: {
      ...fHead(), ...fCta("", "ღილაკი (მაგ. კონსულტაციის დაჯავშნა)"),
    } },
    logos: { label: "კლიენტების ლოგოები", desc: "მოძრავი ზოლი ლოგოებით — „კლიენტები“ განყოფილებიდან", fields: {
      title: f("text", "სათაური (მაგ. ჩვენ გვენდობიან)", { i18n: true }),
    } },
    marquee: { label: "მოძრავი ზოლი", desc: "ჰორიზონტალურად მოძრავი წარწერები (ცარიელზე — სერვისების სახელები)", fields: {
      items: f("list", "წარწერები (თითო ხაზზე ერთი)", { i18n: true }),
    } },
    stats: { label: "ციფრები", desc: "მხოლოდ რეალური, დადასტურებული ციფრებისთვის", fields: {
      ...fHead(),
      items: f("repeater", "ციფრები", { fields: { value: f("text", "მნიშვნელობა (მაგ. 120+)"), label: f("text", "აღწერა", { i18n: true }) }, add: "ციფრის დამატება" }),
    } },
    richtext: { label: "ტექსტური ბლოკი", desc: "სტატია, წესები, პოლიტიკა", fields: {
      eyebrow: f("text", "ზედა წარწერა", { i18n: true }),
      title: f("text", "სათაური", { i18n: true }),
      body: f("rich", "ტექსტი", { i18n: true, hint: "ცარიელი ხაზი = ახალი აბზაცი. შეგიძლიათ HTML: <h2>, <ul>, <strong>, <a>" }),
      toc: f("check", "სარჩევის ჩვენება (h2-ებიდან)"),
    } },
    booking: { label: "დაჯავშნის ჩატი", desc: "ინტერაქტიული ჩატ-დაჯავშნა", fields: { ...fHead(), points: f("list", "რას უნდა ელოდოთ (თითო ხაზზე)", { i18n: true }) } },
    contact: { label: "კონტაქტი + ფორმა", desc: "საკონტაქტო ბარათები, ფორმა და რუკა", fields: {
      ...fHead(),
      form_title: f("text", "ფორმის სათაური", { i18n: true }),
      show_map: f("check", "რუკის ჩვენება (პარამეტრები → რუკა)"),
    } },
  });
}

function recordDefs() {
  const card = { icon: f("icon", "ხატულა"), title: f("text", "სათაური", { i18n: true }), text: f("textarea", "ტექსტი", { i18n: true }) };
  return {
    service: {
      title: f("text", "სახელი", { i18n: true }),
      slug: f("text", "URL (slug)", { i18n: true, hint: "მხოლოდ ლათინური, ციფრები და „-“. ცარიელზე ავტომატურად შეიქმნება სახელიდან" }),
      hidden: f("check", "დამალვა საიტზე"),
      icon: f("icon", "ხატულა"),
      image: f("image", "სურათი"),
      image_alt: f("text", "სურათის alt ტექსტი", { i18n: true }),
      short: f("textarea", "მოკლე აღწერა (ბარათისთვის)", { i18n: true }),
      intro: f("textarea", "შესავალი (გვერდის თავში)", { i18n: true }),
      body: f("rich", "დეტალური აღწერა", { i18n: true }),
      includes: f("repeater", "რას მოიცავს", { fields: card, add: "პუნქტის დამატება" }),
      audience: f("list", "ვისთვისაა (თითო ხაზზე ერთი)", { i18n: true }),
      benefits: f("repeater", "სარგებელი", { fields: card, add: "სარგებლის დამატება" }),
      faq: f("repeater", "სერვისის კითხვები (FAQ schema)", { fields: { q: f("text", "კითხვა", { i18n: true }), a: f("textarea", "პასუხი", { i18n: true }) }, add: "კითხვის დამატება" }),
      seo_title: f("text", "SEO სათაური", { i18n: true, counter: 60 }),
      seo_desc: f("textarea", "Meta აღწერა", { i18n: true, counter: 160 }),
      keywords: f("text", "საკვანძო სიტყვები (შიდა შენიშვნა)", { i18n: true }),
    },
    faq: {
      category: f("select", "კატეგორია", { options: faqCategories() }),
      q: f("text", "კითხვა", { i18n: true }),
      a: f("textarea", "პასუხი", { i18n: true }),
      hidden: f("check", "დამალვა"),
    },
    testimonial: {
      name: f("text", "სახელი"),
      role: f("text", "პოზიცია, კომპანია", { i18n: true }),
      quote: f("textarea", "შეფასება", { i18n: true }),
      photo: f("image", "ფოტო / ლოგო"),
      hidden: f("check", "დამალვა"),
    },
    member: {
      name: f("text", "სახელი და გვარი", { i18n: true }),
      role: f("text", "პოზიცია (არასავალდებულო)", { i18n: true }),
      photo: f("image", "ფოტო (კვადრატული, მინ. 800×800)"),
      email: f("text", "ელფოსტა (არასავალდებულო)"),
      linkedin: f("text", "LinkedIn ბმული (არასავალდებულო)"),
      hidden: f("check", "დამალვა"),
    },
    client: {
      name: f("text", "კომპანიის სახელი (ლოგოს alt ტექსტი)"),
      logo: f("image", "ლოგო (SVG ან გამჭვირვალე PNG/WebP)"),
      url: f("text", "ვებსაიტი (არასავალდებულო, https://…)"),
      hidden: f("check", "დამალვა"),
    },
    industry: { icon: f("icon", "ხატულა"), title: f("text", "სათაური", { i18n: true }), text: f("textarea", "ტექსტი", { i18n: true }), hidden: f("check", "დამალვა") },
    menu: { label: f("text", "წარწერა", { i18n: true }), link: f("link", "ბმული"), desc: f("text", "მოკლე აღწერა (ჩანს ჩამოსაშლელ მენიუში)", { i18n: true }), mega: f("check", "სერვისების ჩამოსაშლელი მენიუ") },
    step: { title: f("text", "სათაური", { i18n: true }), text: f("textarea", "ტექსტი", { i18n: true }) },
  };
}

/* ------------------------------------------------------------ გასუფთავება */
const str = (v) => (v === null || v === undefined || typeof v === "object" ? "" : String(v));

function cleanValue(def, v) {
  switch (def.type) {
    case "check": return !!v && v !== "false" && v !== "0";
    case "number": return Math.max(0, Math.min(999, parseInt(v, 10) || 0));
    case "icon": return typeof v === "string" && ICONS[v] ? v : "";
    case "select": {
      const opts = def.options || { "": "" };
      v = str(v);
      return Object.prototype.hasOwnProperty.call(opts, v) ? v : Object.keys(opts)[0];
    }
    case "link": {
      v = str(v).trim();
      return /^((page|service):[a-z0-9_-]+(#[\w-]+)?|https?:\/\/\S+|mailto:\S+|tel:[\d+\s()-]+|\/\S*|#[\w-]*)$/i.test(v) ? v : "";
    }
    case "image": {
      v = str(v).trim();
      return /^(\/?(assets|uploads)\/[\w./-]+|https:\/\/\S+)$/i.test(v) && !v.includes("..") ? v : "";
    }
    case "rich": return richHtml(str(v));
    case "list": {
      const arr = Array.isArray(v) ? v : str(v).split(/\r?\n/);
      return arr.map((x) => stripTags(str(x)).trim().slice(0, 400)).filter(Boolean);
    }
    case "textarea": return stripTags(str(v), ["em", "strong", "br"]).trim().slice(0, 6000);
    case "repeater": return (Array.isArray(v) ? v : []).filter((x) => x && typeof x === "object").map((x) => clean(def.fields, x));
    default: return stripTags(str(v), ["em", "strong", "br"]).trim().slice(0, 600);
  }
}

/** მონაცემების გასუფთავება სქემის მიხედვით (უცნობი ველები იშლება) */
function clean(fields, data) {
  data = data && typeof data === "object" ? data : {};
  const out = {};
  for (const [key, def] of Object.entries(fields)) {
    const raw = data[key];
    if (def.i18n) {
      out[key] = {};
      const isMap = raw && typeof raw === "object" && !Array.isArray(raw);
      for (const l of LANGS) out[key][l] = cleanValue(def, isMap ? raw[l] ?? "" : l === "ka" ? raw : "");
    } else {
      out[key] = cleanValue(def, raw);
    }
  }
  return out;
}

function cleanBlocks(blocks) {
  const defs = blockDefs();
  return (Array.isArray(blocks) ? blocks : [])
    .filter((b) => b && defs[b.type])
    .map((b) => ({ type: b.type, hidden: !!b.hidden, ...clean(defs[b.type].fields, b) }));
}

module.exports = { f, blockDefs, recordDefs, faqCategories, cleanValue, clean, cleanBlocks };
