/* ============================================================
   app.js — 导航 / 搜索 / 清单勾选 / 弹窗 / 移动端侧栏 / 初始化
   依赖：kb.js · render.js · map.js · collector.js · ai.js
   ============================================================ */
(function () {
  "use strict";
  const esc = window.esc;
  const $ = id => document.getElementById(id);
  const pg = id => document.getElementById("p-" + id);

  const PAGES = [
    { id: "home", name: "首页", icon: "🏠", sub: "入学速览" },
    { id: "about", name: "学校概况", icon: "🏫", sub: "校史·校区·学费" },
    { id: "dorm", name: "宿舍攻略", icon: "🛏️", sub: "床品·好物·整理" },
    { id: "cards", name: "办卡指南", icon: "📱", sub: "校园卡·流量卡" },
    { id: "errands", name: "代办", icon: "📋", sub: "PPT代做·校园服务" },
    { id: "checklist", name: "入学清单", icon: "📋", sub: "勾选准备" },
    { id: "majors", name: "专业培养", icon: "🎓", sub: "56 个专业" },
    { id: "campus", name: "校园生活", icon: "🌳", sub: "宿舍·食堂·设施" },
    { id: "map", name: "校园地图", icon: "🗺️", sub: "两校区导览" },
    { id: "training", name: "军训指南", icon: "🎖️", sub: "安排·装备" },
    { id: "laptop", name: "电脑选购", icon: "💻", sub: "按专业配" },
    { id: "policies", name: "政策文件", icon: "📑", sub: "学籍·奖助" },
    { id: "transfer", name: "转专业", icon: "🔁", sub: "政策·路线·准备" },
    { id: "resources", name: "学习资源", icon: "📚", sub: "平台·证书" },
    { id: "compete", name: "竞赛地图", icon: "🏅", sub: "数据·计算机·双创" },
    { id: "skills", name: "技能成长", icon: "🚀", sub: "Python·SQL·ML" },
    { id: "plan", name: "学业规划", icon: "🧭", sub: "大一到大四" },
    { id: "classCampaign", name: "竞选班干部", icon: "🗳️", sub: "班委·竞选" },
    { id: "fees", name: "缴费指南", icon: "💰", sub: "学费·住宿·银行卡" },
    { id: "antiScam", name: "防骗指南", icon: "🛡️", sub: "开学季必看" },
    { id: "course", name: "选课攻略", icon: "🗓️", sub: "系统·轮次·技巧" },
    { id: "timeline", name: "四年时间轴", icon: "🧭", sub: "大一到大四路线" },
    { id: "cert", name: "考证指南", icon: "📜", sub: "证书怎么考" },
    { id: "channels", name: "信息渠道", icon: "📡", sub: "官方·校内·平台" },
    { id: "postgrad", name: "考研保研", icon: "🎯", sub: "升学全攻略" },
    { id: "job", name: "实习求职", icon: "💼", sub: "校招·简历·面试" },
    { id: "feed", name: "最新动态", icon: "📰", sub: "自主收集" },
    { id: "faq", name: "常见问题", icon: "💡", sub: "FAQ" },
  ];
  window.PAGES = PAGES; // 供 render.js 生成首页快速入口（自动同步，新增板块无需再改两处）
  const rendered = new Set();

  /* ---------------- 导航 ---------------- */
  function buildNav() {
    const nav = $("nav");
    if (!nav) return;
    nav.innerHTML = PAGES.map(p =>
      `<div class="nav-i" data-id="${p.id}" onclick="go('${p.id}')"><span class="ic">${p.icon}</span><span>${esc(p.name)}</span><span class="bd" id="bd-${p.id}" style="display:none"></span></div>`
    ).join("");
  }

  /* 自动补齐缺失的页面容器：防御旧版入口 HTML 被浏览器强缓存，
     导致新增页面（如宿舍攻略）无容器、渲染空白的问题 */
  function ensureContainers() {
    const main = document.querySelector(".main") || document.body;
    PAGES.forEach(p => {
      if (!pg(p.id)) {
        const sec = document.createElement("section");
        sec.className = "page";
        sec.id = "p-" + p.id;
        main.appendChild(sec);
      }
    });
  }

  function renderPage(id) {
    if (id === "map") return MapView.render();
    if (id === "feed") return Collector.render();
    const fns = { home: Render.home, about: Render.about, majors: Render.majors, engsoft: Render.engsoft, campus: Render.campus, dorm: Render.dorm, checklist: Render.checklist, training: Render.training, laptop: Render.laptop, policies: Render.policies, transfer: Render.transfer, resources: Render.resources, course: Render.courseSelection, faq: Render.faq, timeline: Render.timeline, cert: Render.cert, channels: Render.channels, postgrad: Render.postgrad, job: Render.job, compete: Render.compete, skills: Render.skills, plan: Render.plan, classCampaign: Render.classCampaign, antiScam: Render.antiScam, fees: Render.fees, cards: Render.simCards, errands: Render.errands };
    const el = pg(id);
    if (el && fns[id]) el.innerHTML = fns[id]();
    if (id === "majors" && Render.mjGrid) Render.mjGrid();
    if (id === "checklist" && App.updateCk) {
      let s = "all";
      try { s = localStorage.getItem("hucai_checklist_sex") || "all"; } catch (e) {}
      App.setCkSex(s);
    }
  }

  function navigate(id) {
    const p = PAGES.find(x => x.id === id) || PAGES[0];
    id = p.id;
    // 离开校园地图页时，主动清空 iframe 容器，断开 720yun 全景的音视频线程
    if (id !== "map") {
      const mp = pg("map");
      if (mp && mp.innerHTML) { mp.innerHTML = ""; rendered.delete("map"); }
    }
    document.querySelectorAll(".page").forEach(s => s.classList.remove("on"));
    const el = pg(id);
    if (el) el.classList.add("on");
    if (!rendered.has(id)) { renderPage(id); rendered.add(id); }
    $("pgTitle").textContent = p.name;
    $("pgSub").textContent = p.sub || "";
    document.querySelectorAll(".nav-i").forEach(n => n.classList.toggle("on", n.getAttribute("data-id") === id));
    const c = document.querySelector(".content"); if (c) c.scrollTop = 0;
    window.scrollTo(0, 0);
    hideSug();
    closeSidebar();
  }
  window.go = navigate;

  /* ---------------- 搜索 ---------------- */
  function bindSearch() {
    const gs = $("gs"), sug = $("sug");
    if (!gs) return;
    gs.addEventListener("input", () => {
      const q = gs.value.trim();
      if (q.length < 1) return hideSug();
      const hits = KB.search(q, 8);
      if (!hits.length) { sug.innerHTML = `<div class="sug-i"><div class="sd">没有匹配的条目，换个关键词或问问 AI 学长～</div></div>`; sug.classList.add("on"); return; }
      sug.innerHTML = hits.map((h, i) =>
        `<div class="sug-i" data-i="${i}"><div class="st">${esc(h.title)}</div><div class="sd">${esc((h.text || "").slice(0, 46))}…</div><div class="sm">${esc(h.module || "")}</div></div>`
      ).join("");
      sug.querySelectorAll(".sug-i").forEach(node => {
        node.addEventListener("click", () => {
          const h = hits[+node.getAttribute("data-i")];
          hideSug();
          if (h.module === "专业" && h.ref) { navigate("majors"); setTimeout(() => openMajor(h.ref), 60); }
          else navigate(h.page || "home");
        });
      });
      sug.classList.add("on");
    });
    gs.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const first = sug.querySelector(".sug-i[data-i]");
        if (first && sug.classList.contains("on")) first.click();
      } else if (e.key === "Escape") hideSug();
    });
    document.addEventListener("click", e => { if (!e.target.closest(".tb-search")) hideSug(); });
  }
  function hideSug() { const s = $("sug"); if (s) s.classList.remove("on"); }

  /* ---------------- 弹窗 ---------------- */
  function closeModal() {
    $("modal").classList.remove("on");
    $("ovl").classList.remove("on");
  }
  window.closeModal = closeModal;
  function bindModal() {
    $("ovl").addEventListener("click", () => { closeModal(); closeSidebar(); });
    $("modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  }

  /* ---------------- 移动端导航抽屉 ---------------- */
  function openSidebar() { const h = $("header"); if (h) h.classList.add("nav-open"); }
  function closeSidebar() { const h = $("header"); if (h) h.classList.remove("nav-open"); }
  function bindMenu() {
    const mb = $("menuBtn");
    if (mb) mb.addEventListener("click", () => {
      const h = $("header");
      if (h) h.classList.toggle("nav-open");
    });
  }

  /* ---------------- 清单勾选（本地存储） ---------------- */
  const CK_KEY = "hucai_checklist_v1";
  function ckLoad() { try { return JSON.parse(localStorage.getItem(CK_KEY) || "{}"); } catch (e) { return {}; } }
  function ckSave(o) { localStorage.setItem(CK_KEY, JSON.stringify(o)); }
  const App = {
    toggleCk(el) {
      const k = el.getAttribute("data-k");
      const store = ckLoad();
      store[k] = !store[k];
      ckSave(store);
      el.classList.toggle("done", !!store[k]);
      App.updateCk();
    },
    updateCk() {
      const store = ckLoad();
      const sex = App.ckSex || "all";
      const vis = el => !el.dataset.sex || el.dataset.sex === "all" || el.dataset.sex === sex;
      let total = 0, done = 0;
      document.querySelectorAll("#ckGroups .ck-g").forEach(g => {
        let gt = 0, gd = 0;
        g.querySelectorAll(".ck-i").forEach(el => {
          const on = !!store[el.getAttribute("data-k")];
          el.classList.toggle("done", on);
          if (vis(el)) { gt++; if (on) gd++; }
        });
        const gc = g.querySelector(".gc");
        if (gc) gc.textContent = gt + " 项";
        total += gt; done += gd;
      });
      const num = $("ckNum"), bar = $("ckBar");
      if (num) num.textContent = done + " / " + total;
      if (bar) bar.style.width = (total ? (done / total * 100) : 0) + "%";
    },
    setCkSex(sex) {
      App.ckSex = sex || "all";
      const root = document.getElementById("ckGroups");
      if (root) root.setAttribute("data-sex", App.ckSex);
      document.querySelectorAll("#ckSex .ck-sex-i").forEach(b => b.classList.toggle("on", b.getAttribute("data-sex") === App.ckSex));
      try { localStorage.setItem("hucai_checklist_sex", App.ckSex); } catch (e) {}
      App.updateCk();
    },
    resetCk() {
      if (!confirm("确定要清空所有勾选记录吗？")) return;
      localStorage.removeItem(CK_KEY);
      App.updateCk();
    },
    exportCk() {
      const store = ckLoad();
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(store))));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(
          () => alert("进度码已复制到剪贴板，到另一台设备点「导入进度」粘贴即可。"),
          () => prompt("复制下面的进度码，到另一台设备点「导入进度」粘贴：", code)
        );
      } else {
        prompt("复制下面的进度码，到另一台设备点「导入进度」粘贴：", code);
      }
    },
    importCk() {
      const v = prompt("粘贴从另一台设备导出的进度码：");
      if (!v) return;
      try {
        const o = JSON.parse(decodeURIComponent(escape(atob(v.trim()))));
        ckSave(o);
        App.updateCk();
        alert("进度导入成功，已同步勾选状态 ✓");
      } catch (e) { alert("进度码无效，请检查后重试。"); }
    },
  };
  window.App = App;

  /* 复制文本小工具（办卡页微信号复制等） */
  window.copyText = function(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(() => alert("已复制：" + t), () => prompt("复制下面的内容：", t));
    } else {
      prompt("复制下面的内容：", t);
    }
  };

  /* ---------------- 初始化 ---------------- */
  function updateBadges() {
    const M = KB.data.majors;
    let total = 0; (M.colleges || []).forEach(c => total += (c.majors || []).length);
    const bdM = $("bd-majors"); if (bdM) { bdM.textContent = total + " 专业"; bdM.style.display = "inline-block"; }
    const feed = KB.data.feed || {};
    const bdF = $("bd-feed"); if (bdF && feed.freshmanCount) { bdF.textContent = (feed.freshmanCount || 0) + " 新"; bdF.style.display = "inline-block"; }
  }

  async function start() {
    buildNav(); ensureContainers(); bindSearch(); bindModal(); bindMenu();
    try {
      await KB.load();
    } catch (e) {
      console.error("KB load error", e);
    }
    const upd = (KB.data.feed && KB.data.feed.updated) || (KB.data.school && KB.data.school.updated) || "2026-08-06";
    if ($("upd")) $("upd").textContent = upd;
    if (window.AI) AI.init();
    updateBadges();
    navigate("home");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
