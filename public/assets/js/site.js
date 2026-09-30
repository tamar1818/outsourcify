/* ==========================================================================
   Outsourcify — ინტერაქცია (გარე ბიბლიოთეკების გარეშე)
   ნავიგაცია · mega-menu · გამოჩენის ანიმაცია · ფორმა · ჩატ-დაჯავშნა
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cfgEl = document.getElementById("chat-config");
  var CFG = cfgEl ? JSON.parse(cfgEl.textContent) : { str: {}, services: [], support: [], icons: {} };
  var S = CFG.str || {};
  var store = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ------------------------------------------------------------ ჰედერი */
  var hdr = $("[data-header]");
  var onScroll = function () { if (hdr) hdr.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mega menu: hover (დესკტოპი), დაჭერა, Esc, ფოკუსის გასვლა */
  $$("[data-mega]").forEach(function (item) {
    var btn = $(".nav__caret", item);
    var t;
    var set = function (open) {
      clearTimeout(t);
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    item.addEventListener("mouseenter", function () { clearTimeout(t); t = setTimeout(function () { set(true); }, 60); });
    item.addEventListener("mouseleave", function () { clearTimeout(t); t = setTimeout(function () { set(false); }, 180); });
    btn.addEventListener("click", function () { set(!item.classList.contains("is-open")); });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && item.classList.contains("is-open")) { set(false); btn.focus(); }
    });
    item.addEventListener("focusout", function (e) { if (!item.contains(e.relatedTarget)) set(false); });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) set(false); });
  });

  /* მობილური მენიუ */
  var burger = $(".burger");
  var drawer = $("#drawer");
  var setDrawer = function (open) {
    if (!burger || !drawer) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.hidden = !open;
    drawer.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(drawer.hidden); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setDrawer(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !drawer.hidden) { setDrawer(false); burger.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 1140 && !drawer.hidden) setDrawer(false); });
  }

  /* ---------------------------------------------------- გამოჩენის ანიმაცია */
  var reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* FAQ: ერთის გახსნისას დანარჩენები იკეცება (ძველ ბრაუზერებშიც, სადაც <details name> არ მუშაობს) */
  $$("[data-accordion]").forEach(function (list) {
    list.addEventListener("toggle", function (ev) {
      var d = ev.target;
      if (!d.open || d.parentNode !== list) return;
      $$("details[open]", list).forEach(function (o) { if (o !== d) o.open = false; });
    }, true);
  });

  /* სერვისების ჩანართები: დაჭერა + ისრები / Home / End (WAI-ARIA tabs) */
  $$("[data-tabs]").forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (tab.scrollIntoView && tab.parentNode.scrollWidth > tab.parentNode.clientWidth) {
        tab.parentNode.scrollTo({ left: tab.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" });
      }
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (ev) {
        var k = ev.key, n = null;
        if (k === "ArrowDown" || k === "ArrowRight") n = (i + 1) % tabs.length;
        else if (k === "ArrowUp" || k === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        else if (k === "Home") n = 0;
        else if (k === "End") n = tabs.length - 1;
        if (n === null) return;
        ev.preventDefault();
        select(tabs[n], true);
      });
    });
  });

  /* ნაბიჯების ხაზი ივსება სკროლთან ერთად */
  var stepsEls = $$("[data-steps]");
  if (stepsEls.length) {
    var tick = false;
    var upd = function () {
      tick = false;
      var vh = window.innerHeight;
      stepsEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (vh * 0.5)));
        el.style.setProperty("--p", p.toFixed(3));
        var items = $$(".step", el);
        items.forEach(function (s, i) { s.classList.toggle("is-active", items.length < 2 || i / (items.length - 1) <= p + 0.001); });
      });
    };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* კარუსელი (შეფასებები) */
  $$("[data-carousel]").forEach(function (c) {
    var track = $("[data-carousel-track]", c);
    var prev = $("[data-carousel-prev]", c);
    var next = $("[data-carousel-next]", c);
    if (!track || !prev || !next) return;
    var step = function () { var f = track.firstElementChild; return f ? f.getBoundingClientRect().width + 20 : 300; };
    var sync = function () {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }); });
    track.addEventListener("scroll", sync, { passive: true });
    sync();
  });

  /* ------------------------------------------------------ საკონტაქტო ფორმა */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var phoneOk = function (v) { return v.replace(/\D/g, "").length >= 7; };

  $$("[data-lead-form]").forEach(function (form) {
    var status = $(".form__status", form);
    var btn = $("button[type=submit]", form);
    var check = function (input) {
      var field = input.closest(".field");
      var err = field ? $(".field__err", field) : null;
      var v = input.type === "checkbox" ? (input.checked ? "yes" : "") : input.value.trim();
      var msg = "";
      if (input.required && !v) msg = S.f_required;
      else if (input.type === "email" && v && !EMAIL_RE.test(v)) msg = S.f_bad_email;
      else if (input.type === "tel" && v && !phoneOk(v)) msg = S.f_bad_phone;
      if (field) field.classList.toggle("is-invalid", !!msg);
      if (err) err.textContent = msg || "";
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };
    $$("input[required], input[type=email], input[type=tel]", form).forEach(function (i) {
      i.addEventListener("blur", function () { if (i.value || i.type === "checkbox") check(i); });
      i.addEventListener("input", function () { if (i.closest(".field").classList.contains("is-invalid")) check(i); });
      i.addEventListener("change", function () { if (i.type === "checkbox") check(i); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = $$("input[required], input[type=email], input[type=tel]", form);
      var bad = inputs.filter(function (i) { return !check(i); });
      if (bad.length) { bad[0].focus(); return; }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.page = location.pathname;
      var label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = "<span>" + esc(S.f_sending || "…") + "</span>";
      status.textContent = ""; status.className = "form__status";
      fetch(form.getAttribute("action"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error("fail");
          var done = document.createElement("div");
          done.className = "form-done";
          done.setAttribute("tabindex", "-1");
          done.innerHTML = doneCheck() + "<h3>" + esc(S.f_ok_title) + "</h3><p>" + esc(S.f_ok_text) + "</p>";
          form.replaceWith(done);
          done.focus();
        })
        .catch(function () {
          btn.disabled = false; btn.innerHTML = label;
          status.textContent = S.f_error; status.className = "form__status is-error";
        });
    });
  });

  function doneCheck() {
    return '<svg class="done__check" viewBox="0 0 84 84" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="42" cy="42" r="39"/><path d="M26 43.5l11 11L59 31"/></svg>';
  }

  /* ======================================================================
     ჩატ-დაჯავშნა
     ====================================================================== */
  var KEY = "os_booking_v1";

  function Chat(mount, mode) {
    this.mount = mount;
    this.mode = mode;
    this.i = 0;
    this.a = {};
    this.lb = {};
    this.days = null;
    this.day = null;
    this.busy = false;
    this.build();
  }

  Chat.prototype.steps = function () {
    var svc = CFG.services.map(function (s) { return { id: s.id, title: s.title, icon: s.icon }; });
    svc.push({ id: "other", title: S.chat_other });
    return [
      { key: "service", type: "chips", q: S.chat_q_service, options: svc },
      { key: "business", type: "text", multi: true, q: S.chat_q_business, ph: S.chat_business_ph, min: 3 },
      { key: "support", type: "multi", q: S.chat_q_support, options: CFG.support },
      { key: "slot", type: "date", q: S.chat_q_date },
      { key: "name", type: "text", q: S.chat_q_name, ph: S.f_name, auto: "name", min: 2 },
      { key: "email", type: "text", q: S.chat_q_email, ph: S.f_email, input: "email", auto: "email", check: "email" },
      { key: "phone", type: "text", q: S.chat_q_phone, ph: S.f_phone, input: "tel", auto: "tel", check: "phone" },
      { key: "message", type: "text", multi: true, q: S.chat_q_message, ph: S.chat_message_ph, optional: true },
      { key: "summary", type: "summary", q: S.chat_q_summary }
    ];
  };

  Chat.prototype.build = function () {
    var ic = CFG.icons;
    var panel = document.createElement("section");
    panel.className = "chat__panel";
    panel.setAttribute("aria-label", S.chat_title);
    if (this.mode === "float") { panel.id = "chat-panel"; panel.setAttribute("role", "dialog"); panel.hidden = true; }
    panel.innerHTML =
      '<header class="chat__head"><span class="chat__avatar" aria-hidden="true">' + CFG.mark + '</span>' +
      '<span class="chat__who"><b>' + esc(S.chat_title) + '</b><small>' + esc(S.chat_sub) + '</small></span>' +
      '<button class="chat__x" type="button" aria-label="' + esc(S.close) + '">' + ic.x + '</button></header>' +
      '<div class="chat__progress"><span class="chat__bar" aria-hidden="true"><i></i></span><span class="chat__count" aria-live="polite"></span></div>' +
      '<div class="chat__log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="chat__dock"></div>';
    this.panel = panel;
    this.log = $(".chat__log", panel);
    this.dock = $(".chat__dock", panel);
    this.bar = $(".chat__bar", panel);
    this.count = $(".chat__count", panel);
    this.S = this.steps();
    var me = this;
    panel.addEventListener("pointerdown", function () { me.touched = true; });
    panel.addEventListener("keydown", function () { me.touched = true; });

    if (this.mode === "float") {
      var self = this;
      this.mount.innerHTML =
        '<p class="chat__nudge" hidden><button type="button" class="chat__nudge-x" aria-label="' + esc(S.close) + '">' + ic.x + '</button>' + esc(S.chat_nudge) + '</p>' +
        '<button class="chat__launcher" type="button" aria-expanded="false" aria-controls="chat-panel" aria-label="' + esc(S.chat_open) + '">' + ic.msg + '</button>';
      this.mount.appendChild(panel);
      this.launcher = $(".chat__launcher", this.mount);
      this.nudge = $(".chat__nudge", this.mount);
      this.launcher.addEventListener("click", function () { self.isOpen() ? self.close() : self.open(); });
      $(".chat__x", panel).addEventListener("click", function () { self.close(); });
      this.nudge.addEventListener("click", function (e) {
        self.nudge.hidden = true;
        store.set("os_nudge", 1);
        if (!e.target.closest(".chat__nudge-x")) self.open();
      });
      panel.addEventListener("keydown", function (e) { if (e.key === "Escape") self.close(); });
      if (!store.get("os_nudge")) {
        setTimeout(function () { if (!self.isOpen() && !store.get("os_nudge")) self.nudge.hidden = false; }, 14000);
      }
    } else {
      this.mount.innerHTML = "";
      this.mount.appendChild(panel);
      this.start();
    }
  };

  Chat.prototype.isOpen = function () { return this.panel && !this.panel.hidden; };

  Chat.prototype.open = function (service) {
    if (this.mode !== "float") return;
    if (this.nudge) this.nudge.hidden = true;
    this.panel.hidden = false;
    this.mount.classList.add("is-open");
    this.launcher.setAttribute("aria-expanded", "true");
    this.launcher.innerHTML = CFG.icons.x;
    if (window.innerWidth <= 760) document.body.classList.add("menu-open");
    if (!this.started) this.start(service);
    else if (service && this.i === 0) this.pick("service", service);
    this.focusDock();
  };

  Chat.prototype.close = function () {
    if (this.mode !== "float") return;
    this.panel.hidden = true;
    this.mount.classList.remove("is-open");
    this.launcher.setAttribute("aria-expanded", "false");
    this.launcher.innerHTML = CFG.icons.msg;
    document.body.classList.remove("menu-open");
    this.launcher.focus();
  };

  Chat.prototype.start = function (service) {
    this.started = true;
    var saved = store.get(KEY);
    if (saved && saved.a && typeof saved.i === "number" && saved.i < this.S.length) {
      this.a = saved.a; this.lb = saved.lb || {}; this.i = saved.i;
      this.render(false);
      return;
    }
    this.i = 0;
    this.render(true);
    if (service) {
      var self = this;
      setTimeout(function () { self.pick("service", service); }, reduce ? 0 : 700);
    }
  };

  Chat.prototype.save = function () { store.set(KEY, { i: this.i, a: this.a, lb: this.lb }); };

  Chat.prototype.progress = function () {
    var total = this.S.length - 1;
    var cur = Math.min(this.i, total);
    this.bar.style.setProperty("--p", (cur / total).toFixed(3));
    this.count.textContent = this.i >= total ? "" : (S.chat_step + " " + (cur + 1) + " " + S.chat_of + " " + total);
  };

  Chat.prototype.bubble = function (who, html, anim, editIndex) {
    var m = document.createElement("div");
    m.className = "msg msg--" + who;
    if (!anim) m.style.animation = "none";
    m.innerHTML = html;
    if (who === "user" && typeof editIndex === "number") {
      var b = document.createElement("button");
      b.type = "button"; b.className = "msg__edit"; b.textContent = S.chat_edit;
      var self = this;
      b.addEventListener("click", function () { self.go(editIndex); });
      m.appendChild(b);
    }
    this.log.appendChild(m);
    return m;
  };

  Chat.prototype.scroll = function () {
    var log = this.log;
    requestAnimationFrame(function () { log.scrollTop = log.scrollHeight; });
  };

  /* მთელი საუბრის ხელახლა აგება მიმდინარე ნაბიჯამდე */
  Chat.prototype.render = function (animate) {
    this.log.innerHTML = "";
    this.dock.innerHTML = "";
    for (var j = 0; j < this.i; j++) {
      this.bubble("bot", esc(this.q(this.S[j])), false);
      if (this.lb[this.S[j].key] !== undefined) {
        this.bubble("user", esc(this.lb[this.S[j].key]) || "—", false, j);
      }
    }
    this.progress();
    this.ask(animate);
  };

  Chat.prototype.q = function (st) { return String(st.q || "").replace("{name}", (this.a.name || "").split(" ")[0]); };

  Chat.prototype.ask = function (animate) {
    var self = this;
    var st = this.S[this.i];
    var show = function () {
      self.bubble("bot", esc(self.q(st)), animate);
      if (st.type === "summary") self.summary();
      self.controls(st);
      self.scroll();
    };
    if (animate && !reduce) {
      var t = this.bubble("bot", "<i></i><i></i><i></i>", true);
      t.classList.add("msg--typing");
      t.setAttribute("aria-hidden", "true");
      this.scroll();
      setTimeout(function () { t.remove(); show(); self.focusDock(); }, 650);
    } else {
      show();
    }
  };

  Chat.prototype.focusDock = function () {
    var dock = this.dock;
    // inline ჩატი გვერდის ჩატვირთვისას ფოკუსს არ იპარავს — მხოლოდ მომხმარებლის ქმედების შემდეგ
    if (this.mode === "float" ? !this.isOpen() : !this.touched) return;
    setTimeout(function () {
      var el = $("textarea, input, .chip:not(:disabled), .cal__day:not(:disabled), .btn", dock);
      if (el) el.focus({ preventScroll: true });
    }, 60);
  };

  Chat.prototype.navRow = function (st, extraRight) {
    var self = this;
    var row = document.createElement("div");
    row.className = "chat__nav";
    var left = this.i > 0 ? '<button type="button" class="chat__back">' + CFG.icons.back + esc(S.chat_back) + '</button>' : "<span></span>";
    row.innerHTML = left + (extraRight || "");
    var back = $(".chat__back", row);
    if (back) back.addEventListener("click", function () { self.go(self.i - 1); });
    return row;
  };

  Chat.prototype.controls = function (st) {
    var self = this;
    var ic = CFG.icons;
    var wrap = document.createElement("div");
    wrap.className = "chat__dock-in";

    if (st.type === "chips" || st.type === "multi") {
      var multi = st.type === "multi";
      var chosen = multi ? (this.a[st.key] || []).slice() : [];
      var box = document.createElement("div");
      box.className = "chat__chips";
      box.setAttribute("role", "group");
      st.options.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "chip";
        b.innerHTML = (o.icon || "") + "<span>" + esc(o.title) + "</span>";
        if (multi) b.setAttribute("aria-pressed", chosen.indexOf(o.id) > -1 ? "true" : "false");
        else if (self.a[st.key] === o.id) b.setAttribute("aria-pressed", "true");
        b.addEventListener("click", function () {
          if (!multi) { self.answer(st, o.id, o.title); return; }
          var k = chosen.indexOf(o.id);
          if (k > -1) chosen.splice(k, 1); else chosen.push(o.id);
          b.setAttribute("aria-pressed", k > -1 ? "false" : "true");
          go.disabled = !chosen.length;
        });
        box.appendChild(b);
      });
      wrap.appendChild(box);
      var right = multi ? '<button type="button" class="btn btn--primary chat__go"><span>' + esc(S.chat_continue) + "</span></button>" : "";
      var nav = this.navRow(st, right);
      var go = $(".chat__go", nav);
      if (go) {
        go.disabled = !chosen.length;
        go.addEventListener("click", function () {
          var titles = st.options.filter(function (o) { return chosen.indexOf(o.id) > -1; }).map(function (o) { return o.title; });
          self.answer(st, chosen, titles.join(", "));
        });
      }
      wrap.appendChild(nav);
    }

    if (st.type === "text") {
      var form = document.createElement("form");
      form.noValidate = true;
      var id = "chat-in-" + this.mode + "-" + st.key;
      var field = st.multi
        ? '<textarea id="' + id + '" class="chat__input" rows="2" placeholder="' + esc(st.ph || S.chat_placeholder) + '"></textarea>'
        : '<input id="' + id + '" class="chat__input" type="' + (st.input || "text") + '" placeholder="' + esc(st.ph || S.chat_placeholder) + '"' + (st.auto ? ' autocomplete="' + st.auto + '"' : "") + (st.input === "tel" ? ' inputmode="tel"' : "") + (st.input === "email" ? ' inputmode="email"' : "") + ">";
      form.innerHTML = '<label class="sr-only" for="' + id + '">' + esc(this.q(st)) + '</label><div class="chat__row">' + field +
        '<button class="chat__send" type="submit" aria-label="' + esc(S.chat_send) + '">' + ic.send + '</button></div><p class="chat__hint" role="alert"></p>';
      var inp = $(".chat__input", form);
      var hint = $(".chat__hint", form);
      if (this.a[st.key]) inp.value = this.a[st.key];
      var grow = function () { if (st.multi) { inp.style.height = "auto"; inp.style.height = Math.min(inp.scrollHeight, 140) + "px"; } };
      inp.addEventListener("input", function () { grow(); inp.classList.remove("is-invalid"); hint.textContent = ""; });
      if (st.multi) {
        inp.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 760) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); }
        });
      }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = inp.value.trim();
        var err = "";
        if (!v && !st.optional) err = S.f_required;
        else if (v && st.min && v.length < st.min) err = S.f_required;
        else if (v && st.check === "email" && !EMAIL_RE.test(v)) err = S.f_bad_email;
        else if (v && st.check === "phone" && !phoneOk(v)) err = S.f_bad_phone;
        if (err) { hint.textContent = err; inp.classList.add("is-invalid"); inp.focus(); return; }
        self.answer(st, v, v || "—");
      });
      wrap.appendChild(form);
      var skip = st.optional ? '<button type="button" class="chat__skip">' + esc(S.chat_skip) + "</button>" : "";
      var nav2 = this.navRow(st, skip);
      var sk = $(".chat__skip", nav2);
      if (sk) sk.addEventListener("click", function () { self.answer(st, "", S.chat_skip); });
      wrap.appendChild(nav2);
      setTimeout(grow, 0);
    }

    if (st.type === "date") {
      var cal = document.createElement("div");
      cal.className = "cal";
      cal.innerHTML = '<div class="cal__days" role="group"></div><div class="cal__times" role="group"></div>' +
        '<div class="cal__flex"><button type="button" class="chip">' + ic.msg + "<span>" + esc(S.chat_flexible) + "</span></button></div>";
      wrap.appendChild(cal);
      $(".cal__flex .chip", cal).addEventListener("click", function () {
        self.a.date = ""; self.a.time = ""; self.a.flexible = true;
        self.answer(st, "flex", S.chat_flexible);
      });
      wrap.appendChild(this.navRow(st));
      this.loadDays(cal);
    }

    if (st.type === "summary") {
      var box2 = document.createElement("div");
      box2.innerHTML = '<p class="chat__consent">' + esc(S.f_consent) + ' <a href="' + esc(CFG.privacy) + '" target="_blank" rel="noopener">↗</a></p><p class="chat__hint" role="alert"></p>';
      wrap.appendChild(box2);
      var nav3 = this.navRow(st, '<button type="button" class="btn btn--primary chat__go"><span>' + esc(S.chat_confirm) + "</span>" + ic.check + "</button>");
      var conf = $(".chat__go", nav3);
      conf.addEventListener("click", function () { self.submit(conf, $(".chat__hint", box2)); });
      wrap.appendChild(nav3);
    }

    this.dock.innerHTML = "";
    this.dock.appendChild(wrap);
  };

  Chat.prototype.loadDays = function (cal) {
    var self = this;
    var daysEl = $(".cal__days", cal);
    var timesEl = $(".cal__times", cal);
    var paint = function () {
      daysEl.innerHTML = "";
      var any = false;
      (self.days || []).forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "cal__day";
        b.disabled = !d.slots.length;
        if (d.slots.length) any = true;
        b.setAttribute("aria-pressed", self.day && self.day.date === d.date ? "true" : "false");
        b.setAttribute("aria-label", d.dow + " " + d.day + " " + d.month);
        b.innerHTML = "<small>" + esc(d.dow) + "</small><b>" + d.day + "</b><small>" + esc(d.month) + "</small>";
        b.addEventListener("click", function () { self.day = d; paint(); });
        daysEl.appendChild(b);
      });
      if (!self.day || !self.day.slots.length) {
        self.day = (self.days || []).filter(function (d) { return d.slots.length; })[0] || null;
        if (self.day) { paint(); return; }
      }
      timesEl.innerHTML = "";
      if (!any || !self.day) { timesEl.innerHTML = '<p class="cal__empty">' + esc(S.chat_no_slots) + "</p>"; return; }
      self.day.slots.forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "cal__time"; b.textContent = t;
        b.addEventListener("click", function () {
          self.a.date = self.day.date; self.a.time = t; self.a.flexible = false;
          self.answer(self.S[self.i], self.day.date + " " + t, self.day.dow + ", " + self.day.day + " " + self.day.month + " · " + t);
        });
        timesEl.appendChild(b);
      });
      var on = $('.cal__day[aria-pressed="true"]', daysEl);
      if (on) on.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    if (this.days) { paint(); return; }
    timesEl.innerHTML = '<p class="cal__empty">…</p>';
    fetch(CFG.slots, { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (j) { self.days = j.days || []; paint(); self.scroll(); })
      .catch(function () { self.days = []; paint(); });
  };

  Chat.prototype.answer = function (st, value, label) {
    if (this.busy) return;
    this.a[st.key] = value;
    this.lb[st.key] = label;
    this.dock.innerHTML = "";
    this.bubble("user", esc(label) || "—", true, this.i);
    this.i++;
    this.save();
    this.progress();
    this.ask(true);
  };

  Chat.prototype.pick = function (key, id) {
    var st = this.S[0];
    var o = st.options.filter(function (x) { return x.id === id; })[0];
    if (o && this.i === 0) this.answer(st, o.id, o.title);
  };

  Chat.prototype.go = function (index) {
    if (index < 0 || this.busy) return;
    this.i = index;
    this.save();
    this.render(false);
    this.focusDock();
  };

  Chat.prototype.summary = function () {
    var self = this;
    var rows = [
      [S.chat_s_service, this.lb.service, 0],
      [S.chat_s_business, this.lb.business, 1],
      [S.chat_s_support, this.lb.support, 2],
      [S.chat_s_time, this.lb.slot, 3],
      [S.chat_s_contact, [this.a.name, this.a.email, this.a.phone].join("\n"), 4],
      [S.chat_s_message, this.lb.message, 7]
    ];
    var dl = document.createElement("dl");
    dl.className = "sum";
    rows.forEach(function (r) {
      if (!r[1] || r[1] === "—" || (r[2] === 7 && !self.a.message)) return;
      var d = document.createElement("div");
      d.innerHTML = "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + '</dd><button type="button">' + esc(S.chat_edit) + "</button>";
      $("button", d).addEventListener("click", function () { self.go(r[2]); });
      dl.appendChild(d);
    });
    this.log.appendChild(dl);
  };

  Chat.prototype.submit = function (btn, hint) {
    var self = this;
    if (this.busy) return;
    this.busy = true;
    var html = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "<span>" + esc(S.chat_sending) + "</span>";
    hint.textContent = "";
    var sup = (this.a.support || []).map(function (id) {
      var o = CFG.support.filter(function (x) { return x.id === id; })[0];
      return o ? o.title : id;
    });
    var payload = {
      service: this.a.service, service_label: this.lb.service, business: this.a.business, support: sup,
      date: this.a.flexible ? "" : this.a.date, time: this.a.flexible ? "" : this.a.time, flexible: !!this.a.flexible,
      name: this.a.name, email: this.a.email, phone: this.a.phone, message: this.a.message || "",
      lang: CFG.lang, page: location.pathname, company_website: ""
    };
    fetch(CFG.book, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        self.busy = false;
        if (res.status === 409) {
          self.days = null; self.day = null;
          var slotIndex = 3;
          self.i = slotIndex; self.save(); self.render(false);
          self.bubble("bot", esc(S.chat_taken), true);
          self.scroll();
          return;
        }
        if (!res.j.ok) throw new Error("fail");
        self.done(res.j);
      })
      .catch(function () {
        self.busy = false;
        btn.disabled = false; btn.innerHTML = html;
        hint.textContent = S.f_error;
      });
  };

  Chat.prototype.done = function (res) {
    var self = this;
    var name = (this.a.name || "").split(" ")[0];
    store.del(KEY);
    this.bar.style.setProperty("--p", "1");
    this.count.textContent = "";
    this.dock.innerHTML = "";
    this.log.innerHTML = "";
    var d = document.createElement("div");
    d.className = "done";
    d.setAttribute("tabindex", "-1");
    d.innerHTML = doneCheck() + "<h3>" + esc(S.chat_done_title) + "</h3>" +
      (res.label ? '<span class="done__when">' + CFG.icons.cal + esc(res.label) + "</span>" : "") +
      "<p>" + esc((res.flexible ? S.chat_done_flex : S.chat_done_text).replace("{name}", name)) + "</p>" +
      '<div class="done__actions">' +
      (res.gcal ? '<a class="btn btn--primary" href="' + esc(res.gcal) + '" target="_blank" rel="noopener"><span>' + esc(S.chat_gcal) + "</span>" + CFG.icons.cal + "</a>" : "") +
      '<button type="button" class="btn btn--ghost" data-restart><span>' + esc(S.chat_restart) + "</span></button></div>";
    this.log.appendChild(d);
    $("[data-restart]", d).addEventListener("click", function () { self.a = {}; self.lb = {}; self.i = 0; self.days = null; self.day = null; self.render(true); });
    d.focus({ preventScroll: true });
  };

  /* მიმაგრება */
  var inline = $("[data-chat-inline]");
  var chat = null;
  if (cfgEl) {
    if (inline) {
      chat = new Chat(inline, "inline");
    } else {
      var host = document.createElement("div");
      host.className = "chat chat--float";
      document.body.appendChild(host);
      chat = new Chat(host, "float");
    }
  }

  /* „დაჯავშნის“ ღილაკები ხსნის ჩატს (JS-ის გარეშე — ჩვეულებრივი ბმული დაჯავშნის გვერდზე) */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-open-chat], a[data-service]");
    if (!el || !chat) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    var service = el.getAttribute("data-service");
    if (chat.mode === "inline") {
      if (service && chat.i === 0) chat.pick("service", service);
      inline.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      chat.focusDock();
    } else {
      chat.open(service);
    }
  });
})();
