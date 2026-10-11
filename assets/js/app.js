/* =========================================================================
 *  app.js —— 页面渲染 + 交互 + 简历导出（v2）
 *  新增：受众视角切换 / 志愿服务板块 / 浏览器内编辑内容
 *  一般情况下你不需要改这个文件，改 data.js 或用页面上的「编辑内容」就够了。
 * ========================================================================= */
(function () {
  "use strict";

  var D = window.SITE_DATA || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------ 工具函数 ------------------------------ */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function setHTML(node, html) { if (node) node.innerHTML = html; }
  function txt(node, value) { if (node) node.textContent = value == null ? "" : value; }

  function deepGet(obj, path) {
    var cur = obj;
    var parts = String(path).split(".");
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }
  function deepSet(obj, path, value) {
    var parts = String(path).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (cur == null) return;
      cur = cur[parts[i]];
    }
    if (cur != null) cur[parts[parts.length - 1]] = value;
  }

  /* 自动生成渐变占位图（用于没有封面图的卡片） */
  function placeholder(text, seed) {
    var base = 0;
    String(text || "P").split("").forEach(function (c) { base += c.charCodeAt(0); });
    base += (seed || 0) * 37;
    var h1 = base % 360, h2 = (base * 7 + 140) % 360;
    var label = String(text || "P").trim().slice(0, 2);
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="hsl(' + h1 + ',74%,64%)"/>' +
          '<stop offset="100%" stop-color="hsl(' + h2 + ',70%,48%)"/>' +
        '</linearGradient></defs>' +
        '<rect width="640" height="360" fill="url(#g)"/>' +
        '<circle cx="548" cy="66" r="120" fill="rgba(255,255,255,.12)"/>' +
        '<circle cx="86" cy="310" r="90" fill="rgba(255,255,255,.10)"/>' +
        '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" ' +
          'font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="118" font-weight="700" ' +
          'fill="rgba(255,255,255,.92)">' + esc(label) + '</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ------------------------------ 图标 ------------------------------ */
  var I = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.6 6.5 8.4 6 8.4-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9Z"/></svg>',
    wechat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4C5.1 4 2 6.6 2 9.8c0 1.8 1 3.4 2.6 4.5L4 17l2.8-1.4c.7.2 1.4.3 2.2.3h.6"/><path d="M22 15.2c0-2.7-2.6-4.9-5.8-4.9s-5.8 2.2-5.8 4.9 2.6 4.9 5.8 4.9c.7 0 1.3-.1 1.9-.3L20.5 21l-.5-1.9c1.3-.9 2-2.4 2-3.9Z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L12.5 18"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.2 14 7 21.5l5-2.6 5 2.6L15.8 14"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8.5 12 4l9.5 4.5L12 13 2.5 8.5Z"/><path d="M6 10.7V16c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-5.3"/><path d="M21 9v5"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7.5" width="18" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 12.5h18"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.9 6.6 4.9c2 0 3.6 1.1 4.4 2.7h2c.8-1.6 2.4-2.7 4.4-2.7 3.2 0 5.2 3.1 3.9 6.4-1.8 4.6-9.3 9.2-9.3 9.2Z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20Z"/><path d="M13.5 6.5l3 3"/></svg>'
  };

  function contactIcon(key) {
    var map = { phone: I.phone, email: I.mail, workEmail: I.mail, city: I.pin, github: I.github, website: I.globe, wechat: I.wechat, jobTarget: I.briefcase, available: I.award };
    return map[key] || I.link;
  }

  var CONTACT_LABELS = {
    phone: "电话", email: "私人邮箱", workEmail: "对外邮箱", city: "城市", github: "GitHub",
    website: "个人站点", wechat: "微信", jobTarget: "求职意向", available: "到岗时间"
  };

  /* =======================================================================
   *  受众视角模式
   * ===================================================================== */
  var ALL_SECTIONS = ["education", "internship", "project", "media", "award", "certificate", "volunteer", "skill"];
  var MODES = (D.audience && D.audience.modes) || [];
  var currentModeKey = "default";
  var originalSummary = (D.profile && D.profile.summary) || "";

  function getMode(key) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i].key === key) return MODES[i];
    return MODES[0] || null;
  }

  function reorderSections() {
    var mode = getMode(currentModeKey) || {};
    var order = mode.order || ALL_SECTIONS;
    var main = $("main");
    if (!main) return;
    order.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) { sec.style.display = ""; main.appendChild(sec); }
    });
    /* order 里没提到的板块暂时隐藏 */
    ALL_SECTIONS.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec && order.indexOf(id) === -1) sec.style.display = "none";
    });
  }

  function renderAudienceBar() {
    var bar = $("#audienceBar");
    if (!bar) return;
    var intro = (D.audience && D.audience.intro) || "切换视角：";
    setHTML(bar,
      '<span class="aud-label">' + esc(intro) + '</span>' +
      '<div class="aud-btns" id="audBtns">' +
      MODES.map(function (m) {
        return '<button class="aud-btn' + (m.key === currentModeKey ? " active" : "") + '" data-key="' + esc(m.key) + '" type="button">' + esc(m.label) + '</button>';
      }).join("") +
      '</div>'
    );
    $$("#audBtns .aud-btn").forEach(function (b) {
      b.addEventListener("click", function () { applyMode(b.getAttribute("data-key")); });
    });
  }

  function applyMode(key) {
    currentModeKey = key;
    var mode = getMode(key) || {};
    if (D.profile) D.profile.summary = mode.summary || originalSummary;

    renderAudienceBar();
    renderProfile();
    reorderSections();

    var banner = $("#modeBanner");
    if (banner) {
      if (key === "default" || !mode.label) { banner.style.display = "none"; }
      else {
        banner.style.display = "";
        setHTML(banner, '<span>当前视角：<b>' + esc(mode.label) + '</b> — ' + esc(mode.note || "") + '</span>');
      }
    }
    var sc = $("#home");
    if (sc && key !== "default") sc.scrollIntoView({ behavior: "smooth" });
  }

  /* =======================================================================
   *  1. 首屏
   * ===================================================================== */
  function renderProfile() {
    var p = D.profile || {};
    txt($("#brandMark"), (p.name || "Z").trim().charAt(0).toUpperCase());
    txt($("#brandText"), p.name || "个人主页");
    txt($("#heroEyebrow"), p.eyebrow || "");
    txt($("#heroName"), p.name || "");
    txt($("#heroTitle"), p.title || "");
    txt($("#heroSummary"), p.summary || "");
    txt($("#heroBadge"), p.badge || "");
    txt($("#contactText"), D.contactText || "");
    txt($("#footerText"), D.footerText || "");

    var avatar = $("#heroAvatar");
    if (avatar) {
      avatar.src = p.avatar || placeholder(p.name || "ME", 3);
      avatar.alt = (p.name || "") + " 的头像";
      avatar.onerror = function () { this.onerror = null; this.src = placeholder(p.name || "ME", 3); };
    }
    document.title = (p.name || "个人主页") + " | " + (p.title || "个人主页");

    /* 首屏联系方式 */
    var keys = ["email", "workEmail", "city", "github"];
    setHTML($("#heroContacts"), keys.filter(function (k) { return p[k]; }).map(function (k) {
      return '<li>' + contactIcon(k) + esc(p[k]) + '</li>';
    }).join(""));
  }

  function renderStats() {
    setHTML($("#heroStats"), (D.stats || []).map(function (s) {
      return '<div class="stat-item">' +
        '<div class="stat-value">' + esc(s.value) + (s.unit ? '<small>' + esc(s.unit) + '</small>' : '') + '</div>' +
        '<div class="stat-label">' + esc(s.label) + '</div>' +
      '</div>';
    }).join(""));
  }

  /* =======================================================================
   *  2. 教育背景
   * ===================================================================== */
  function renderEducation() {
    txt($("#educationDesc"), D.educationDesc || "");
    var list = D.education || [];

    var first = list[0] || {};
    var cells = [];
    if (first.gpa) cells.push({ k: "加权 GPA", v: first.gpa });
    if (first.rank) cells.push({ k: "专业排名", v: first.rank });
    if (first.degree) cells.push({ k: "学位", v: first.degree });
    if (first.period) cells.push({ k: "在读时间", v: first.period });
    setHTML($("#gpaPanel"), cells.map(function (c) {
      return '<div class="gpa-cell"><div class="k">' + esc(c.k) + '</div><div class="v">' + esc(c.v) + '</div></div>';
    }).join(""));

    setHTML($("#educationList"), list.map(function (e) {
      var courses = (e.courses || []).map(function (c) {
        return '<span class="tag">' + esc(c.name) + (c.score ? " " + esc(c.score) : "") + '</span>';
      }).join("");
      var honors = (e.honors || []).map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("");
      return '<div class="tl-item reveal">' +
        '<div class="tl-head">' +
          '<span class="tl-title">' + esc(e.school) + '</span>' +
          '<span class="tl-sub">' + esc(e.major) + '</span>' +
          (e.period ? '<span class="tl-period">' + esc(e.period) + '</span>' : "") +
        '</div>' +
        '<div class="tl-meta">' + esc([e.college, e.degree, e.location].filter(Boolean).join(" · ")) + '</div>' +
        (e.rank ? '<div class="tl-meta">' + esc(e.rank) + '</div>' : "") +
        (courses ? '<div class="tag-row">' +
            (e.coursesLabel ? '<span class="tag tag-label">' + esc(e.coursesLabel) + '</span>' : "") +
            courses + '</div>' : "") +
        (e.minor ? '<div class="minor-box">' +
            '<div class="minor-head"><span class="minor-name">' + esc(e.minor.name) + '</span>' +
              (e.minor.period ? '<span class="tl-period">' + esc(e.minor.period) + '</span>' : "") + '</div>' +
            (e.minor.org ? '<div class="tl-meta">' + esc(e.minor.org) + '</div>' : "") +
            (e.minor.desc ? '<p class="tl-desc">' + esc(e.minor.desc) + '</p>' : "") +
            ((e.minor.courses || []).length ? '<div class="tag-row">' + e.minor.courses.map(function (c) {
                return '<span class="tag tag-brand">' + esc(c) + '</span>';
              }).join("") + '</div>' : "") +
          '</div>' : "") +
        (honors ? '<ul class="tl-points" style="margin-top:12px">' + honors + '</ul>' : "") +
      '</div>';
    }).join(""));
  }

  /* =======================================================================
   *  3. 实习经历
   * ===================================================================== */
  function renderInternships() {
    txt($("#internshipDesc"), D.internshipDesc || "");
    setHTML($("#internshipList"), (D.internships || []).map(function (it) {
      var pts = (it.points || []).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");
      var tags = (it.tags || []).map(function (t) { return '<span class="tag tag-plain">' + esc(t) + '</span>'; }).join("");
      return '<div class="tl-item reveal">' +
        '<div class="tl-head">' +
          '<span class="tl-title">' + esc(it.company) + '</span>' +
          '<span class="tl-sub">' + esc(it.role) + '</span>' +
          (it.period ? '<span class="tl-period">' + esc(it.period) + '</span>' : "") +
        '</div>' +
        (it.location ? '<div class="tl-meta">' + esc(it.location) + '</div>' : "") +
        (pts ? '<ul class="tl-points">' + pts + '</ul>' : "") +
        (tags ? '<div class="tag-row">' + tags + '</div>' : "") +
      '</div>';
    }).join(""));
  }

  /* =======================================================================
   *  4. 项目作品
   * ===================================================================== */
  var projectFilterKey = "全部";

  function renderProjectFilter() {
    var types = [];
    (D.projects || []).forEach(function (p) { if (p.type && types.indexOf(p.type) === -1) types.push(p.type); });
    if (types.length < 2) { setHTML($("#projectFilter"), ""); return; }
    var all = ["全部"].concat(types);
    setHTML($("#projectFilter"), all.map(function (t, i) {
      return '<button class="filter-btn' + (i === 0 ? " active" : "") + '" data-type="' + esc(t) + '" type="button">' + esc(t) + '</button>';
    }).join(""));
    $$("#projectFilter .filter-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        projectFilterKey = b.getAttribute("data-type");
        $$("#projectFilter .filter-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        renderProjects();
      });
    });
  }

  function renderProjects() {
    txt($("#projectDesc"), D.projectDesc || "");
    var list = (D.projects || []).filter(function (p) {
      return projectFilterKey === "全部" || p.type === projectFilterKey;
    });
    setHTML($("#projectList"), list.map(function (p, i) {
      var pending = !!p.pending;
      var cover = p.cover || placeholder(p.title || "P", i + 1);
      var hl = (p.highlights || []).map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("");
      var stack = (p.stack || []).map(function (s) { return '<span class="tag tag-plain">' + esc(s) + '</span>'; }).join("");
      var links = (p.links || []).map(function (l) {
        return '<a class="p-link" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + I.github + esc(l.label) + '</a>';
      }).join("");
      var cute = p.emoji
        ? '<span class="p-emoji" title="' + esc(p.badge || "可爱标识") + '">' + esc(p.emoji) + '</span>' +
          (p.badge ? '<span class="p-badge">' + esc(p.badge) + '</span>' : "")
        : "";
      return '<article class="p-card reveal' + (pending ? " is-pending" : "") + '">' +
        '<div class="p-cover">' +
          cute +
          (pending ? '<div class="p-pending-thumb">筹备中</div>'
                   : '<img src="' + esc(cover) + '" alt="' + esc(p.title) + '" loading="lazy">') +
        '</div>' +
        '<div class="p-body">' +
          '<div class="p-top">' +
            (p.type ? '<span class="p-type">' + esc(p.type) + '</span>' : "") +
            (p.period ? '<span class="p-period">' + esc(p.period) + '</span>' : "") +
          '</div>' +
          '<h3 class="p-title">' + esc(p.title) + '</h3>' +
          (p.summary ? '<p class="p-summary">' + esc(p.summary) + '</p>' : "") +
          (hl ? '<ul class="p-highlights">' + hl + '</ul>' : "") +
          (stack ? '<div class="tag-row">' + stack + '</div>' : "") +
          (links ? '<div class="p-links">' + links + '</div>' : "") +
        '</div>' +
      '</article>';
    }).join(""));
    observeReveal();
  }

  /* =======================================================================
   *  5. 自媒体
   * ===================================================================== */
  function renderMedia() {
    var m = D.media || {};
    txt($("#mediaDesc"), D.mediaDesc || "");
    var intro = m.intro ? '<p class="section-desc" style="margin-bottom:22px">' + esc(m.intro) + '</p>' : "";

    setHTML($("#platformList"), (m.platforms || []).map(function (p) {
      var hasMain = (p.main !== undefined && p.main !== null && p.main !== "");
      var big = hasMain ? p.main : (p.followers || "—");
      var bigLabel = p.mainLabel || (hasMain ? "内容成绩" : "粉丝数");
      var meta = (p.meta && p.meta.length)
        ? p.meta
        : [{ k: "作品", v: p.works || "—" }, { k: "点赞", v: p.likes || "—" }];
      return '<div class="platform-card">' +
        '<div class="platform-name">' + esc(p.name) + '</div>' +
        (p.handle ? '<div class="platform-handle">' + esc(p.handle) + '</div>' : "") +
        '<div class="platform-followers">' + esc(big) + '</div>' +
        '<div class="platform-followers-label">' + esc(bigLabel) + '</div>' +
        '<div class="platform-meta">' +
          meta.map(function (x) {
            return '<div>' + esc(x.k) + '<strong>' + esc(x.v) + '</strong></div>';
          }).join("") +
        '</div>' +
      '</div>';
    }).join(""));

    var introEl = $("#mediaIntroBox");
    if (!introEl) {
      introEl = document.createElement("div");
      introEl.id = "mediaIntroBox";
      var section = $("#media .container");
      var head = $("#media .section-head");
      if (section && head) section.insertBefore(introEl, head.nextSibling);
    }
    setHTML(introEl, intro);

    setHTML($("#mediaWorks"), (m.mediaWorks || []).map(function (w) {
      return '<a class="work-item" href="' + esc(w.url || "#") + '" target="_blank" rel="noopener">' +
        '<span class="work-platform">' + esc(w.platform) + '</span>' +
        '<span class="work-title">' + esc(w.title) + '</span>' +
        '<span class="work-metric">' + esc(w.metric) + '</span>' +
      '</a>';
    }).join(""));
  }

  /* =======================================================================
   *  6. 志愿服务
   * ===================================================================== */
  function renderVolunteers() {
    txt($("#volunteerDesc"), D.volunteerDesc || "");
    setHTML($("#volunteerList"), (D.volunteers || []).map(function (v) {
      return '<div class="tl-item reveal">' +
        '<div class="tl-head">' +
          '<span class="tl-title">' + I.heart + esc(v.title) + '</span>' +
          (v.role ? '<span class="tl-sub">' + esc(v.role) + '</span>' : "") +
          (v.period ? '<span class="tl-period">' + esc(v.period) + '</span>' : "") +
        '</div>' +
        '<div class="tl-meta">' + esc([v.org].filter(Boolean).join(" · ")) + '</div>' +
        (v.desc ? '<p class="tl-desc">' + esc(v.desc) + '</p>' : "") +
      '</div>';
    }).join(""));
  }

  /* =======================================================================
   *  7. 竞赛获奖
   * ===================================================================== */
  function renderAwards() {
    txt($("#awardDesc"), D.awardDesc || "");
    setHTML($("#awardList"), (D.awards || []).map(function (a) {
      return '<div class="award-item reveal">' +
        '<div class="award-medal">' + I.award + '</div>' +
        '<div class="award-main">' +
          '<div class="award-title">' + esc(a.title) + '</div>' +
          (a.desc ? '<div class="award-desc">' + esc(a.desc) + '</div>' : "") +
        '</div>' +
        '<div class="award-right">' +
          (a.level ? '<span class="award-level">' + esc(a.level) + '</span>' : "") +
          (a.date ? '<div class="award-date">' + esc(a.date) + '</div>' : "") +
        '</div>' +
      '</div>';
    }).join(""));
  }

  /* =======================================================================
   *  8. 证书
   * ===================================================================== */
  function renderCertificates() {
    txt($("#certificateDesc"), D.certificateDesc || "");
    setHTML($("#certList"), (D.certificates || []).map(function (c, i) {
      var img = c.cover || placeholder(c.name || "证书", i + 11);
      return '<div class="cert-card reveal">' +
        '<div class="cert-thumb"><img src="' + esc(img) + '" alt="' + esc(c.name) + '" loading="lazy"></div>' +
        '<div class="cert-body">' +
          '<div class="cert-name">' + esc(c.name) + '</div>' +
          (c.issuer ? '<div class="cert-issuer">' + esc(c.issuer) + '</div>' : "") +
          '<div class="cert-foot">' +
            (c.score ? '<span class="cert-score">' + esc(c.score) + '</span>' : "") +
            (c.date ? '<span class="cert-date">' + esc(c.date) + '</span>' : "") +
          '</div>' +
        '</div>' +
      '</div>';
    }).join(""));
  }

  /* =======================================================================
   *  9. 技能
   * ===================================================================== */
  function renderSkills() {
    txt($("#skillDesc"), D.skillDesc || "");
    setHTML($("#skillList"), (D.skills || []).map(function (g) {
      var rows = (g.items || []).map(function (s) {
        var lv = Math.max(0, Math.min(100, Number(s.level) || 0));
        return '<div class="skill-row">' +
          '<div class="skill-top"><span>' + esc(s.name) + '</span><span>' + lv + '%</span></div>' +
          '<div class="skill-bar"><div class="skill-fill" data-level="' + lv + '"></div></div>' +
        '</div>';
      }).join("");
      return '<div class="skill-card reveal">' +
        '<div class="skill-group">' + esc(g.group) + '</div>' + rows +
      '</div>';
    }).join(""));
  }

  /* =======================================================================
   *  10. 联系方式
   * ===================================================================== */
  function renderContacts() {
    var p = D.profile || {};
    var keys = ["email", "workEmail", "phone", "wechat", "city", "github", "website", "jobTarget", "available"];
    setHTML($("#contactList"), keys.filter(function (k) { return p[k]; }).map(function (k) {
      var isLink = (k === "github" || k === "website");
      var url = isLink ? (p[k].indexOf("http") === 0 ? p[k] : "https://" + p[k]) : null;
      var value = url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(p[k]) + '</a>' : esc(p[k]);
      return '<li class="contact-item">' +
        '<span class="ico">' + contactIcon(k) + '</span>' +
        '<span><span class="k">' + esc(CONTACT_LABELS[k] || k) + '</span><span class="v">' + value + '</span></span>' +
      '</li>';
    }).join(""));
  }

  /* =======================================================================
   *  11. 简历生成（一键导出，跟随当前受众视角）
   * ===================================================================== */
  function buildResume() {
    var p = D.profile || {};
    var secs = {};   /* 板块字典，按当前视角 order 拼接 */
    var mode = getMode(currentModeKey) || {};
    var order = mode.order || ALL_SECTIONS;

    /* ---- 头部 ---- */
    var contacts = [];
    if (p.phone) contacts.push('<span>' + I.phone + '<b>电话</b> ' + esc(p.phone) + '</span>');
    if (p.email) contacts.push('<span>' + I.mail + '<b>邮箱</b> ' + esc(p.email) + '</span>');
    if (p.workEmail) contacts.push('<span>' + I.mail + '<b>对外邮箱</b> ' + esc(p.workEmail) + '</span>');
    if (p.city) contacts.push('<span>' + I.pin + '<b>城市</b> ' + esc(p.city) + '</span>');
    if (p.github) contacts.push('<span>' + I.github + esc(p.github) + '</span>');
    if (p.website) contacts.push('<span>' + I.globe + esc(p.website) + '</span>');
    if (p.wechat) contacts.push('<span>' + I.wechat + '<b>微信</b> ' + esc(p.wechat) + '</span>');

    var head = '<div class="rs-head">' +
      '<div class="rs-name-row">' +
        '<span class="rs-name">' + esc(p.name) + '</span>' +
        (p.enName ? '<span class="rs-en">' + esc(p.enName) + '</span>' : '') +
      '</div>' +
      (p.title ? '<div class="rs-title">' + esc(p.title) + '</div>' : '') +
      '<div class="rs-contacts">' + contacts.join("") + '</div>' +
    '</div>';

    /* ---- 求职意向 / 概况 ---- */
    var kv = [];
    if (p.jobTarget) kv.push(['求职意向', p.jobTarget]);
    if (p.available) kv.push(['到岗时间', p.available]);
    var edu0 = (D.education || [])[0] || {};
    if (edu0.gpa) kv.push(['加权 GPA', edu0.gpa]);
    if (edu0.rank) kv.push(['专业排名', edu0.rank]);
    var overview = "";
    if (kv.length) {
      overview += '<div class="rs-sec"><div class="rs-sec-title">求职概况</div><div class="rs-cols">' +
        kv.map(function (x) {
          return '<div class="rs-kv"><span class="k">' + esc(x[0]) + '</span><span class="v">' + esc(x[1]) + '</span></div>';
        }).join("") + '</div></div>';
    }
    if (p.summary) {
      overview += '<div class="rs-sec"><div class="rs-sec-title">个人简介</div><p style="font-size:10pt;color:#2c3648">' + esc(p.summary) + '</p></div>';
    }

    /* ---- 教育背景 ---- */
    if ((D.education || []).length) {
      secs.education = '<div class="rs-sec"><div class="rs-sec-title">教育背景</div>' +
        D.education.map(function (e) {
          var courses = (e.courses || []).map(function (c) { return '<span class="rs-tag">' + esc(c.name) + (c.score ? " " + esc(c.score) : "") + '</span>'; }).join("");
          var honors = (e.honors || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
          return '<div class="rs-item">' +
            '<div class="rs-item-head">' +
              '<span class="rs-item-title">' + esc(e.school) + '</span>' +
              '<span class="rs-item-sub">' + esc(e.major) + '</span>' +
              '<span class="rs-item-date">' + esc(e.period) + '</span>' +
            '</div>' +
            '<div class="rs-item-meta">' + esc([e.college, e.degree, e.location].filter(Boolean).join(" · ")) + '</div>' +
            (courses ? '<div class="rs-tags">' + courses + '</div>' : "") +
            (e.minor ? '<div class="rs-item" style="margin-top:6px">' +
              '<div class="rs-item-head">' +
                '<span class="rs-item-title">' + esc(e.minor.name) + '</span>' +
                (e.minor.org ? '<span class="rs-item-sub">' + esc(e.minor.org) + '</span>' : "") +
                '<span class="rs-item-date">' + esc(e.minor.period || "") + '</span>' +
              '</div>' +
              (e.minor.desc ? '<div class="rs-item-meta">' + esc(e.minor.desc) + '</div>' : "") +
              ((e.minor.courses || []).length ? '<div class="rs-tags">' + e.minor.courses.map(function (c) {
                  return '<span class="rs-tag">' + esc(c) + '</span>';
                }).join("") + '</div>' : "") +
            '</div>' : "") +
            (honors ? '<ul class="rs-list">' + honors + '</ul>' : "") +
          '</div>';
        }).join("") + '</div>';
    }

    /* ---- 实习经历 ---- */
    if ((D.internships || []).length) {
      secs.internship = '<div class="rs-sec"><div class="rs-sec-title">实习经历</div>' +
        D.internships.map(function (it) {
          var pts = (it.points || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
          var tags = (it.tags || []).map(function (t) { return '<span class="rs-tag rs-tag-plain">' + esc(t) + '</span>'; }).join("");
          return '<div class="rs-item">' +
            '<div class="rs-item-head">' +
              '<span class="rs-item-title">' + esc(it.company) + '</span>' +
              '<span class="rs-item-sub">' + esc(it.role) + '</span>' +
              '<span class="rs-item-date">' + esc(it.period) + '</span>' +
            '</div>' +
            (pts ? '<ul class="rs-list">' + pts + '</ul>' : "") +
            (tags ? '<div class="rs-tags">' + tags + '</div>' : "") +
          '</div>';
        }).join("") + '</div>';
    }

    /* ---- 项目经历 ---- */
    if ((D.projects || []).length) {
      secs.project = '<div class="rs-sec"><div class="rs-sec-title">项目经历</div>' +
        D.projects.map(function (pr) {
          var pts = (pr.highlights || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
          var stack = (pr.stack || []).map(function (s) { return '<span class="rs-tag rs-tag-plain">' + esc(s) + '</span>'; }).join("");
          var linkTxt = (pr.links || []).map(function (l) { return esc(l.url); }).join(" ");
          return '<div class="rs-item">' +
            '<div class="rs-item-head">' +
              '<span class="rs-item-title">' + esc(pr.title) + '</span>' +
              (pr.type ? '<span class="rs-item-sub">' + esc(pr.type) + '</span>' : '') +
              '<span class="rs-item-date">' + esc(pr.period) + '</span>' +
            '</div>' +
            (pr.summary ? '<div class="rs-item-meta">' + esc(pr.summary) + '</div>' : "") +
            (linkTxt ? '<div class="rs-item-meta">开源地址：' + linkTxt + '</div>' : "") +
            (pts ? '<ul class="rs-list">' + pts + '</ul>' : "") +
            (stack ? '<div class="rs-tags">' + stack + '</div>' : "") +
          '</div>';
        }).join("") + '</div>';
    }

    /* ---- 志愿服务 ---- */
    if ((D.volunteers || []).length) {
      secs.volunteer = '<div class="rs-sec"><div class="rs-sec-title">志愿服务与社会实践</div><ul class="rs-list">' +
        D.volunteers.map(function (v) {
          return '<li><b>' + esc(v.title) + '</b>　' + esc(v.role || "") +
            (v.period ? '　<span style="color:#6b7a90">' + esc(v.period) + '</span>' : "") +
            (v.desc ? '<br><span style="color:#5a6780">' + esc(v.desc) + '</span>' : "") + '</li>';
        }).join("") + '</ul></div>';
    }

    /* ---- 竞赛荣誉 ---- */
    if ((D.awards || []).length) {
      secs.award = '<div class="rs-sec"><div class="rs-sec-title">竞赛荣誉</div><ul class="rs-list">' +
        D.awards.map(function (a) {
          return '<li><b>' + esc(a.title) + '</b>　' + esc(a.level || "") +
            (a.date ? '　<span style="color:#6b7a90">' + esc(a.date) + '</span>' : "") +
            (a.desc ? '<br><span style="color:#5a6780">' + esc(a.desc) + '</span>' : "") + '</li>';
        }).join("") + '</ul></div>';
    }

    /* ---- 证书 ---- */
    if ((D.certificates || []).length) {
      secs.certificate = '<div class="rs-sec"><div class="rs-sec-title">证书资质</div><div class="rs-cols">' +
        D.certificates.map(function (c) {
          return '<div class="rs-kv"><span class="k">' + esc(c.date || "") + '</span>' +
            '<span class="v">' + esc(c.name) + (c.score ? '（' + esc(c.score) + '）' : '') + '</span></div>';
        }).join("") + '</div></div>';
    }

    /* ---- 自媒体 ---- */
    var media = D.media || {};
    if ((media.platforms || []).length) {
      secs.media = '<div class="rs-sec"><div class="rs-sec-title">自媒体运营</div>' +
        (media.intro ? '<div class="rs-item-meta" style="margin-bottom:4px">' + esc(media.intro) + '</div>' : "") +
        '<div class="rs-cols">' +
        media.platforms.map(function (m) {
          var val = (m.main !== undefined && m.main !== null && m.main !== "")
            ? m.main
            : ("粉丝 " + (m.followers || "—"));
          return '<div class="rs-kv"><span class="k">' + esc(m.name) + '</span>' +
            '<span class="v">' + esc([m.handle, val].filter(Boolean).join(" · ")) + '</span></div>';
        }).join("") + '</div>' +
        ((media.mediaWorks || []).length
          ? '<ul class="rs-list" style="margin-top:5px">' + media.mediaWorks.map(function (w) {
              return '<li>' + esc(w.title) + '　<span style="color:#6b7a90">' + esc(w.platform || "") + ' · ' + esc(w.metric || "") + '</span></li>';
            }).join("") + '</ul>'
          : "") +
        '</div>';
    }

    /* ---- 技能 ---- */
    if ((D.skills || []).length) {
      secs.skill = '<div class="rs-sec"><div class="rs-sec-title">技能栈</div>' +
        D.skills.map(function (g) {
          var names = (g.items || []).map(function (s) { return s.name; }).join(" / ");
          return '<div class="rs-kv"><span class="k">' + esc(g.group) + '</span><span class="v">' + esc(names) + '</span></div>';
        }).join("") + '</div>';
    }

    /* ---- 按视角顺序拼接 ---- */
    var h = [head];
    if (overview) h.push(overview);
    order.forEach(function (id) { if (secs[id]) h.push(secs[id]); });
    /* order 之外的板块兜底追加，避免内容丢失 */
    Object.keys(secs).forEach(function (id) { if (order.indexOf(id) === -1) h.push(secs[id]); });

    h.push('<div class="rs-foot">本简历由个人主页一键生成 · ' + esc(p.name || "") + ' · ' +
      new Date().toLocaleDateString("zh-CN") + '</div>');

    return h.join("");
  }

  function openResume() {
    var sheet = $("#resumeSheet");
    if (!sheet) return;
    sheet.innerHTML = buildResume();
    var ov = $("#resumeOverlay");
    ov.classList.add("open");
    ov.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    var sc = $(".resume-scroll");
    if (sc) sc.scrollTop = 0;
  }

  function closeResume() {
    var ov = $("#resumeOverlay");
    ov.classList.remove("open");
    ov.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify(D, null, 2)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "my-portfolio-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  /* =======================================================================
   *  12. 浏览器内编辑内容
   *  把 data.js 里的所有文本字段列成表单，改动保存在浏览器 localStorage，
   *  刷新后依然生效；点「导出 data.js」可把修改落回文件永久保存。
   * ===================================================================== */
  var LS_KEY = "site-data-overrides-v2";
  var TEXTAREA_MIN = 46;   /* 长文本用 textarea */

  function loadOverrides() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveOverrides(map) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(map)); } catch (e) {}
  }

  function applyOverrides() {
    var map = loadOverrides();
    Object.keys(map).forEach(function (path) { deepSet(D, path, map[path]); });
  }

  /* 遍历所有字符串叶子节点，生成 {path, label, value} 列表 */
  function collectLeaves() {
    var out = [];
    (function walk(obj, prefix, depth) {
      if (depth > 5) return;
      if (Array.isArray(obj)) {
        obj.forEach(function (v, i) { walk(v, prefix ? prefix + "." + i : String(i), depth + 1); });
      } else if (obj && typeof obj === "object") {
        Object.keys(obj).forEach(function (k) {
          var v = obj[k];
          if (v && typeof v === "object") walk(v, prefix ? prefix + "." + k : k, depth + 1);
          else if (typeof v === "string" || typeof v === "number") {
            out.push({ path: prefix ? prefix + "." + k : k, value: String(v) });
          }
        });
      }
    })(D, "", 0);
    return out;
  }

  var SECTION_NAMES = {
    profile: "👤 个人信息", stats: "📊 首屏数字卡", audience: "🎯 受众视角",
    educationDesc: "🎓 教育", education: "🎓 教育背景",
    internshipDesc: "💼 实习", internships: "💼 实习经历",
    projectDesc: "🚀 项目", projects: "🚀 项目作品",
    mediaDesc: "📱 自媒体", media: "📱 自媒体",
    volunteerDesc: "❤️ 志愿", volunteers: "❤️ 志愿服务",
    awardDesc: "🏅 竞赛", awards: "🏅 竞赛荣誉",
    certificateDesc: "📜 证书", certificates: "📜 证书资质",
    skillDesc: "🛠 技能", skills: "🛠 技能栈", contactText: "💬 联系区", footerText: "🦶 页脚"
  };

  function openEditor() {
    var leaves = collectLeaves();
    var groups = {};
    leaves.forEach(function (f) {
      var top = f.path.split(".")[0];
      if (!groups[top]) groups[top] = [];
      groups[top].push(f);
    });
    var order = Object.keys(groups);

    setHTML($("#editorBody"),
      '<div class="ed-nav">' +
        order.map(function (k, i) {
          return '<button class="ed-tab' + (i === 0 ? " active" : "") + '" data-g="' + esc(k) + '" type="button">' +
            esc(SECTION_NAMES[k] || k) + '</button>';
        }).join("") +
      '</div>' +
      '<div class="ed-fields">' +
        order.map(function (k, gi) {
          return '<div class="ed-group' + (gi === 0 ? " active" : "") + '" data-g="' + esc(k) + '">' +
            '<h3>' + esc(SECTION_NAMES[k] || k) + '</h3>' +
            groups[k].map(function (f) {
              var isTa = f.value.length >= TEXTAREA_MIN || /summary|desc|intro|points|Text/.test(f.path);
              return '<label class="ed-field">' +
                '<span class="ed-path" title="' + esc(f.path) + '">' + esc(f.path) + '</span>' +
                (isTa
                  ? '<textarea data-path="' + esc(f.path) + '" rows="3">' + esc(f.value) + '</textarea>'
                  : '<input type="text" data-path="' + esc(f.path) + '" value="' + esc(f.value) + '">') +
              '</label>';
            }).join("") +
          '</div>';
        }).join("") +
      '</div>');

    $$("#editorBody .ed-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        $$("#editorBody .ed-tab").forEach(function (x) { x.classList.remove("active"); });
        $$("#editorBody .ed-group").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        var g = $('.ed-group[data-g="' + t.getAttribute("data-g").replace(/"/g, '\\"') + '"]', $("#editorBody"));
        if (g) g.classList.add("active");
      });
    });

    var ov = $("#editorOverlay");
    ov.classList.add("open");
    ov.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeEditor() {
    var ov = $("#editorOverlay");
    ov.classList.remove("open");
    ov.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  function saveEditor() {
    var map = loadOverrides();
    var inputs = $$("#editorBody [data-path]");
    var changed = 0;
    inputs.forEach(function (el) {
      var path = el.getAttribute("data-path");
      var val = el.value;
      var orig = deepGet(D, path);
      if (String(orig) !== val) {
        map[path] = val;
        deepSet(D, path, val);
        changed++;
      }
    });
    saveOverrides(map);
    rerenderAll();
    closeEditor();
    alert(changed > 0
      ? "已保存 " + changed + " 处修改（保存在此浏览器中，刷新后依然生效）。\n\n要永久保存到网站文件里，请点「编辑内容」→「导出 data.js」，用下载的文件替换 assets/js/data.js。"
      : "没有检测到修改。");
  }

  function resetEditor() {
    if (!confirm("确定要撤销所有在浏览器里做的修改吗？（不会影响 data.js 文件本身）")) return;
    saveOverrides({});
    location.reload();
  }

  function exportDataJs() {
    /* 把当前生效的数据（含浏览器内修改）导出成可替换的 data.js */
    var code = "/* data.js —— 由页面编辑器导出于 " + new Date().toLocaleString("zh-CN") +
      "（用本文件替换 assets/js/data.js 即可永久保存页面上的修改） */\n\nwindow.SITE_DATA = " +
      JSON.stringify(D, null, 2) + ";\n";
    var blob = new Blob([code], { type: "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function rerenderAll() {
    renderProfile();
    renderStats();
    renderEducation();
    renderInternships();
    renderProjectFilter();
    renderProjects();
    renderMedia();
    renderVolunteers();
    renderAwards();
    renderCertificates();
    renderSkills();
    renderContacts();
    renderAudienceBar();
    reorderSections();
    initSkills();
    observeReveal();
  }

  /* =======================================================================
   *  13. 交互：导航 / 主题 / 动画 / 灯箱
   * ===================================================================== */
  function initNav() {
    var header = $("#siteHeader");
    var nav = $("#nav");
    var menuBtn = $("#menuBtn");

    window.addEventListener("scroll", function () {
      if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    }, { passive: true });

    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () { nav.classList.toggle("open"); });
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) nav.classList.remove("open");
      });
    }

    var links = $$(".nav-link");
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id); });
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });

      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io2.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
      $$(".reveal").forEach(function (n) { io2.observe(n); });
    } else {
      $$(".reveal").forEach(function (n) { n.classList.add("in"); });
    }
  }

  function observeReveal() {
    var items = $$(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) { items.forEach(function (n) { n.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    items.forEach(function (n) { io.observe(n); });
  }

  function initSkills() {
    var bars = $$(".skill-fill");
    if (!bars.length) return;
    bars.forEach(function (b) { b.style.width = "0%"; });
    function fill() {
      bars.forEach(function (b, i) {
        setTimeout(function () { b.style.width = (b.getAttribute("data-level") || 0) + "%"; }, 60 + i * 70);
      });
    }
    if (!("IntersectionObserver" in window)) { fill(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { fill(); io.disconnect(); } });
    }, { threshold: 0.2 });
    var host = $("#skillList");
    if (host) io.observe(host);
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("site-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);

    var btn = $("#themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("site-theme", next); } catch (e) {}
    });
  }

  function initLightbox() {
    var lb = $("#lightbox");
    var img = $("#lightboxImg");
    if (!lb || !img) return;
    document.addEventListener("click", function (e) {
      var thumb = e.target.closest(".cert-thumb img");
      if (thumb) { img.src = thumb.src; lb.classList.add("open"); document.body.classList.add("no-scroll"); }
    });
    lb.addEventListener("click", function () {
      lb.classList.remove("open");
      if (!$("#resumeOverlay").classList.contains("open") && !$("#editorOverlay").classList.contains("open")) {
        document.body.classList.remove("no-scroll");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { lb.classList.remove("open"); closeResume(); closeEditor(); }
    });
  }

  function initResume() {
    ["#exportResumeTop", "#exportResumeHero", "#exportResumeBottom"].forEach(function (sel) {
      var b = $(sel);
      if (b) b.addEventListener("click", openResume);
    });
    var print = $("#resumePrint");
    if (print) print.addEventListener("click", function () { window.print(); });
    var close = $("#resumeClose");
    if (close) close.addEventListener("click", closeResume);
    var ov = $("#resumeOverlay");
    if (ov) ov.addEventListener("click", function (e) { if (e.target === ov) closeResume(); });
    var ej = $("#exportJson");
    if (ej) ej.addEventListener("click", exportJson);
  }

  function initEditor() {
    var open = $("#editOpen");
    if (open) open.addEventListener("click", openEditor);
    var save = $("#editorSave");
    if (save) save.addEventListener("click", saveEditor);
    var reset = $("#editorReset");
    if (reset) reset.addEventListener("click", resetEditor);
    var exportBtn = $("#editorExport");
    if (exportBtn) exportBtn.addEventListener("click", exportDataJs);
    var close = $("#editorClose");
    if (close) close.addEventListener("click", closeEditor);
    var ov = $("#editorOverlay");
    if (ov) ov.addEventListener("click", function (e) { if (e.target === ov) closeEditor(); });
  }

  /* =======================================================================
   *  启动
   * ===================================================================== */
  function boot() {
    applyOverrides();          /* 先应用浏览器里保存过的修改 */
    renderProfile();
    renderStats();
    renderAudienceBar();
    renderEducation();
    renderInternships();
    renderProjectFilter();
    renderProjects();
    renderMedia();
    renderVolunteers();
    renderAwards();
    renderCertificates();
    renderSkills();
    renderContacts();

    reorderSections();
    initTheme();
    initNav();
    initSkills();
    initLightbox();
    initResume();
    initEditor();
    observeReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
