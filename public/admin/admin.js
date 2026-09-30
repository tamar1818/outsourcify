/* Outsourcify CMS — ფორმების აწყობა JSON-ად, repeater-ები, ბლოკები, ფოტოს ამრჩევი */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var CSRF = document.body.getAttribute("data-csrf") || "";

  /* ---------------------------------------------------------- მნიშვნელობის წაკითხვა */
  function readVal(el) {
    var t = el.getAttribute("data-type");
    if (t === "check") return el.checked;
    if (t === "link") {
      var sel = $(".lnk__sel", el);
      return sel.value === "__custom" ? $(".lnk__url", el).value.trim() : sel.value;
    }
    if (t === "image") return $(".img__url", el).value.trim();
    if (t === "icon") return el.getAttribute("data-value") || "";
    return el.value;
  }

  /* ფარგლის (scope) პირდაპირი ველები → ობიექტი; repeater → მასივი */
  function collect(scope) {
    var out = {};
    $$("[data-f]", scope).forEach(function (el) {
      if (el.closest("[data-scope]") !== scope) return;
      var key = el.getAttribute("data-f");
      var type = el.getAttribute("data-type");
      if (type === "repeater") {
        var items = $(".rep__items", el);
        out[key] = Array.prototype.slice.call(items.children).map(collect);
        return;
      }
      if (type === "multi") {
        out[key] = out[key] || [];
        if (el.checked) out[key].push(el.value);
        return;
      }
      var lang = el.getAttribute("data-lang");
      if (lang) {
        out[key] = out[key] && typeof out[key] === "object" ? out[key] : {};
        out[key][lang] = readVal(el);
      } else {
        out[key] = readVal(el);
      }
    });
    return out;
  }

  $$("form[data-editor]").forEach(function (form) {
    form.addEventListener("submit", function () {
      var data;
      var blocks = $("[data-blocks]", form);
      var groups = $$("[data-group]", form);
      if (blocks) {
        data = {
          meta: collect($("[data-meta]", form)),
          blocks: Array.prototype.slice.call(blocks.children).map(function (b) {
            var o = collect(b);
            o.type = b.getAttribute("data-block");
            return o;
          })
        };
      } else if (groups.length) {
        data = {};
        groups.forEach(function (g) {
          var name = g.getAttribute("data-group");
          var v = collect(g);
          if (name === "_root") Object.assign(data, v);
          else data[name] = Object.assign(data[name] || {}, v);
        });
      } else {
        data = collect($("[data-root]", form));
      }
      form.elements.payload.value = JSON.stringify(data);
      window.onbeforeunload = null;
    });
    // გაფრთხილება შეუნახავი ცვლილებებისას
    form.addEventListener("input", function () {
      window.onbeforeunload = function () { return "შეუნახავი ცვლილებები დაიკარგება"; };
    });
  });

  /* ---------------------------------------------------------- repeater / ბლოკები */
  function renumber(rep) {
    var c = $(".rep__count", rep);
    if (c) c.textContent = $(".rep__items", rep).children.length;
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    var add = t.closest("[data-rep-add]");
    if (add) {
      var rep = add.closest(".rep");
      var tpl = rep.querySelector(":scope > template");
      var node = tpl.content.firstElementChild.cloneNode(true);
      $(".rep__items", rep).appendChild(node);
      renumber(rep);
      var first = $("input, textarea, select", node);
      if (first) first.focus();
      return;
    }
    var item = t.closest(".rep-item, .blk");
    if (!item) return;
    if (t.closest("[data-up]") && item.previousElementSibling) { item.parentNode.insertBefore(item, item.previousElementSibling); mark(); }
    if (t.closest("[data-down]") && item.nextElementSibling) { item.parentNode.insertBefore(item.nextElementSibling, item); mark(); }
    if (t.closest("[data-dup]")) {
      var copy = item.cloneNode(true);
      // textarea/select მნიშვნელობები cloneNode-ით არ კოპირდება
      var src = $$("textarea, select", item), dst = $$("textarea, select", copy);
      src.forEach(function (s, i) { dst[i].value = s.value; });
      item.parentNode.insertBefore(copy, item.nextSibling);
      var r = item.closest(".rep"); if (r) renumber(r);
      mark();
    }
    if (t.closest("[data-del]") && confirm("წავშალოთ?")) {
      var r2 = item.closest(".rep");
      item.remove();
      if (r2) renumber(r2);
      mark();
    }
    var col = t.closest("[data-collapse]");
    if (col && col.parentNode.parentNode === item) {
      if (item.classList.contains("blk")) {
        var body = $(".blk__body", item);
        body.hidden = !body.hidden;
        col.setAttribute("aria-expanded", body.hidden ? "false" : "true");
      } else {
        item.classList.toggle("is-collapsed");
        col.setAttribute("aria-expanded", item.classList.contains("is-collapsed") ? "false" : "true");
      }
    }
  });
  function mark() { window.onbeforeunload = function () { return "შეუნახავი ცვლილებები დაიკარგება"; }; }

  // ბლოკის ხილვადობა
  document.addEventListener("change", function (e) {
    var v = e.target.closest(".blk__vis input");
    if (v) v.closest(".blk").classList.toggle("is-hidden", !v.checked);
  });

  // ახალი ბლოკი
  var addBtn = $("[data-add-block]");
  if (addBtn) {
    addBtn.addEventListener("click", function () {
      var type = $("[data-add-type]").value;
      var tpl = $('template[data-tpl="' + type + '"]');
      var node = tpl.content.firstElementChild.cloneNode(true);
      $("[data-blocks]").appendChild(node);
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      mark();
    });
  }

  // repeater-ის ჩანაწერები თავიდან აკეცილია, თუ ბევრია
  $$(".rep__items").forEach(function (list) {
    if (list.children.length > 3) {
      Array.prototype.forEach.call(list.children, function (it) {
        it.classList.add("is-collapsed");
        var b = $("[data-collapse]", it); if (b) b.setAttribute("aria-expanded", "false");
      });
    }
  });

  // სათაურის ცოცხალი განახლება repeater-ის ზოლში
  document.addEventListener("input", function (e) {
    var el = e.target;
    var item = el.closest(".rep-item");
    if (item && el.closest("[data-scope]") === item && (el.getAttribute("data-lang") === "ka" || !el.getAttribute("data-lang"))
        && ["title", "q", "label", "criterion", "name", "value"].indexOf(el.getAttribute("data-f")) > -1) {
      var tt = $(".rep-item__title", item);
      if (tt) tt.textContent = el.value || "ახალი ჩანაწერი";
    }
    counter(el);
  });

  /* ---------------------------------------------------------- SEO მთვლელი */
  function counter(el) {
    var max = +el.getAttribute("data-counter");
    if (!max) return;
    var c = el.parentNode.querySelector(".counter");
    if (!c) { c = document.createElement("span"); c.className = "counter"; el.parentNode.appendChild(c); }
    var n = el.value.length;
    var min = max === 60 ? 30 : 120;
    c.textContent = n + " / " + max;
    c.className = "counter " + (n === 0 ? "bad" : (n < min || n > max + 8 ? "warn" : "ok"));
  }
  $$("[data-counter]").forEach(counter);

  /* ---------------------------------------------------------- ბმული */
  document.addEventListener("change", function (e) {
    var sel = e.target.closest(".lnk__sel");
    if (sel) {
      var url = sel.parentNode.querySelector(".lnk__url");
      url.hidden = sel.value !== "__custom";
      if (!url.hidden) url.focus();
    }
  });

  /* ---------------------------------------------------------- ხატულა */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".icp__grid [data-icon]");
    if (!b) return;
    var box = b.closest(".icp");
    var name = b.getAttribute("data-icon");
    box.setAttribute("data-value", name);
    $(".icp__cur", box).innerHTML = name ? b.innerHTML : "—";
    $(".icp__name", box).textContent = name || "არჩევა";
    $$(".icp__grid button", box).forEach(function (x) { x.classList.toggle("on", x === b); });
    box.open = false;
    mark();
  });

  /* ---------------------------------------------------------- მდიდარი ტექსტი */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".rich__bar button");
    if (!b) return;
    var ta = b.closest(".rich").querySelector("textarea");
    var s = ta.selectionStart, en = ta.selectionEnd, sel = ta.value.slice(s, en);
    var ins;
    if (b.hasAttribute("data-wrap")) {
      var tag = b.getAttribute("data-wrap");
      ins = "<" + tag + ">" + (sel || "ტექსტი") + "</" + tag + ">";
      if (tag === "h2" || tag === "h3") ins = "\n" + ins + "\n";
    } else if (b.hasAttribute("data-list")) {
      var lines = (sel || "პუნქტი 1\nპუნქტი 2").split("\n").filter(Boolean);
      ins = "\n<ul>\n" + lines.map(function (l) { return "  <li>" + l + "</li>"; }).join("\n") + "\n</ul>\n";
    } else {
      var href = prompt("ბმულის მისამართი (https://…)", "https://");
      if (!href) return;
      ins = '<a href="' + href.replace(/"/g, "") + '">' + (sel || href) + "</a>";
    }
    ta.setRangeText(ins, s, en, "end");
    ta.focus();
    mark();
  });

  /* ---------------------------------------------------------- სურათი */
  function setImage(box, url) {
    $(".img__url", box).value = url;
    $(".img__prev", box).innerHTML = url ? '<img src="' + url.replace(/"/g, "") + '" alt="">' : "<span>სურათი არ არის</span>";
    mark();
  }
  document.addEventListener("input", function (e) {
    var u = e.target.closest(".img__url");
    if (u) setImage(u.closest(".img"), u.value.trim());
  });
  document.addEventListener("click", function (e) {
    var clr = e.target.closest("[data-img-clear]");
    if (clr) setImage(clr.closest(".img"), "");
    var pick = e.target.closest("[data-media-pick]");
    if (pick) openPicker(pick.closest(".img"));
    var copy = e.target.closest("[data-copy]");
    if (copy && navigator.clipboard) {
      navigator.clipboard.writeText(copy.getAttribute("data-copy"));
      copy.textContent = "✓ დაკოპირდა";
    }
  });
  document.addEventListener("change", function (e) {
    var inp = e.target.closest("[data-media-upload]");
    if (!inp || !inp.files[0]) return;
    var box = inp.closest(".img");
    var fd = new FormData();
    fd.append("file", inp.files[0]);
    fd.append("action", "upload");
    fd.append("ajax", "1");
    fd.append("_csrf", CSRF);
    $(".img__prev", box).innerHTML = "<span>იტვირთება…</span>";
    fetch("/admin?p=media", { method: "POST", body: fd, credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) setImage(box, j.file);
        else { alert(j.error || "ატვირთვა ვერ მოხერხდა"); setImage(box, $(".img__url", box).value); }
      })
      .catch(function () { alert("ატვირთვა ვერ მოხერხდა"); });
    inp.value = "";
  });

  var modal = $("#media-modal");
  var target = null;
  function openPicker(box) {
    target = box;
    var grid = $(".media-modal__grid", modal);
    grid.innerHTML = "<p>იტვირთება…</p>";
    modal.showModal();
    fetch("/admin?p=media_json", { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        grid.innerHTML = "";
        (j.items || []).forEach(function (m) {
          var b = document.createElement("button");
          b.type = "button";
          b.title = m.name;
          b.innerHTML = '<img src="' + m.url + '" alt="" loading="lazy">';
          b.addEventListener("click", function () { setImage(target, m.url); modal.close(); });
          grid.appendChild(b);
        });
        if (!j.items || !j.items.length) grid.innerHTML = "<p>ფოტოები არ არის — ატვირთეთ „ფოტოები“ განყოფილებაში.</p>";
      });
  }
  if (modal) $("[data-close]", modal).addEventListener("click", function () { modal.close(); });

  /* ---------------------------------------------------------- ჩანართები */
  $$(".tabs [data-tab]").forEach(function (t) {
    t.addEventListener("click", function () {
      var name = t.getAttribute("data-tab");
      $$(".tabs [data-tab]").forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); });
      $$("[data-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== name; });
      var h = $("input[name=tab]"); if (h) h.value = name;
      history.replaceState(null, "", "?p=settings&tab=" + name);
    });
  });
})();
