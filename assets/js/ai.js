/* ============================================================
   ai.js — AI 新生问答
   · 默认本地 BM25 检索（离线可用）
   · 可配置 OpenAI 兼容大模型（RAG 增强）
   依赖：kb.js（KB.search / KB.data）
   ============================================================ */
(function () {
  "use strict";
  const esc = window.esc;
  const KEY = "hucai_ai_v1";
  const PAGE_NAME = { home: "首页", about: "学校概况", majors: "专业培养", campus: "校园生活", map: "校园地图", checklist: "入学清单", training: "军训指南", laptop: "电脑选购", policies: "政策文件", resources: "学习资源", feed: "最新动态", faq: "常见问题" };
  const pageName = p => PAGE_NAME[p] || p;

  function getCfg() {
    try { return Object.assign({ useLLM: false, url: "", key: "", model: "deepseek-chat", style: "normal" }, JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return { useLLM: false, url: "", key: "", model: "deepseek-chat", style: "normal" }; }
  }
  function setCfg(c) { localStorage.setItem(KEY, JSON.stringify(c)); }

  /* ---------- markdown 轻量渲染 ---------- */
  function mdToHtml(s) {
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    const lines = s.split(/\n+/);
    let html = "", inUl = false;
    for (const raw of lines) {
      const t = raw.trim();
      if (!t) continue;
      if (/^[-·•]\s+/.test(t)) {
        if (!inUl) { html += "<ul>"; inUl = true; }
        html += "<li>" + t.replace(/^[-·•]\s+/, "") + "</li>";
      } else {
        if (inUl) { html += "</ul>"; inUl = false; }
        html += "<p>" + t + "</p>";
      }
    }
    if (inUl) html += "</ul>";
    return html;
  }

  /* ---------- 本地检索回答 ---------- */
  function localAnswer(q) {
    const hits = KB.search(q, 6);
    if (!hits.length) {
      return { text: "抱歉，我在现有知识库里没找到直接对应的内容 🤔 你可以换个说法，或到「政策文件」「最新动态」里查查；涉及录取、缴费、转专业等重大事项，请以学校官方通知为准。", sources: [] };
    }
    const top = hits.slice(0, 4);
    let text = top[0].text;
    const extra = top.slice(1).filter(h => h.title !== top[0].title);
    if (extra.length) text += "\n\n补充：\n" + extra.slice(0, 2).map(h => "· " + h.title + "：" + h.text).join("\n");
    if (text.length > 540) text = text.slice(0, 540) + "…（更多细节可在对应栏目查看）";
    return { text, sources: hits.slice(0, 5).map(h => ({ title: h.title, page: h.page, link: h.link })) };
  }

  /* ---------- 大模型 RAG 回答 ---------- */
  async function llmAnswer(q) {
    const cfg = getCfg();
    const hits = KB.search(q, 5);
    const ctx = hits.map((h, i) => `${i + 1}.（来自「${h.module}」）${h.text}`).join("\n\n");
    const sys = `你是湖南财政经济学院的新生学长 AI 助手，语气亲切像学长学姐。只依据下方【参考资料】用简洁友好的中文回答，可适度分点；资料不足时如实说明"建议以学校官方通知为准"，不要编造数据或政策。\n\n【参考资料】\n${ctx}`;
    const body = { model: cfg.model || "deepseek-chat", messages: [{ role: "system", content: sys }, { role: "user", content: q }], temperature: cfg.style === "short" ? 0.2 : cfg.style === "detail" ? 0.7 : 0.5, stream: false };
    const r = await fetch(cfg.url, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.key }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const ans = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!ans) throw new Error("empty");
    return { text: ans, sources: hits.slice(0, 5).map(h => ({ title: h.title, page: h.page, link: h.link })) };
  }

  /* ---------- 消息渲染 ---------- */
  function addMsg(role, html) {
    const body = document.getElementById("chatBody");
    if (!body) return;
    const el = document.createElement("div");
    el.className = "msg " + role;
    el.innerHTML = `<div class="mav">${role === "a" ? "🎓" : "🐾"}</div><div class="mc"><div class="bub">${html}</div></div>`;
    body.appendChild(el);
    scrollChat();
  }
  function scrollChat() { const b = document.getElementById("chatBody"); if (b) b.scrollTop = b.scrollHeight; }
  function showTyping() {
    const b = document.getElementById("chatBody");
    if (!b || document.getElementById("typing")) return;
    const t = document.createElement("div");
    t.className = "msg a"; t.id = "typing";
    t.innerHTML = `<div class="mav">🎓</div><div class="mc"><div class="typing"><i></i><i></i><i></i></div></div>`;
    b.appendChild(t); scrollChat();
  }
  function hideTyping() { const t = document.getElementById("typing"); if (t) t.remove(); }

  const SUG = ["会计学主要学什么？", "宿舍有空调吗？", "军训要带哪些东西？", "怎么转专业？", "学费和生活费多少？", "计算机专业买什么电脑？"];

  function welcome() {
    const body = document.getElementById("chatBody");
    if (!body) return;
    body.innerHTML = `<div class="msg a"><div class="mav">🎓</div><div class="mc"><div class="bub"><p>嗨，我是湖财 AI 新生助手 👋</p><p>你问我答，专业、宿舍、军训、转专业、电脑选购都能聊。下面是几个常问的：</p></div></div></div>
      <div class="qk">${SUG.map(s => `<span onclick="AI.send('${esc(s)}')">${esc(s)}</span>`).join("")}</div>`;
  }

  async function send(qRaw) {
    const input = document.getElementById("chatIn");
    let q = (qRaw || "").trim() || (input ? input.value.trim() : "");
    if (!q) return;
    if (input) input.value = "";
    // 清掉欢迎语里的建议
    addMsg("u", esc(q));
    showTyping();
    let res;
    const cfg = getCfg();
    if (cfg.useLLM && cfg.url && cfg.key) {
      try { res = await llmAnswer(q); }
      catch (e) { res = localAnswer(q); res.note = "大模型调用失败，已切换本地知识库回答（" + esc(e.message) + "）"; }
    } else {
      res = localAnswer(q);
    }
    hideTyping();
    let html = mdToHtml(res.text);
    if (res.note) html += `<div class="note warn" style="margin:8px 0 0;font-size:11px;padding:7px 10px">${res.note}</div>`;
    if (res.sources && res.sources.length) {
      html += '<div class="src"><b>参考来源：</b>' + res.sources.map(s => {
        const txt = esc(s.title) + (s.page ? " · " + esc(pageName(s.page)) : "");
        return s.link ? `<a href="${esc(s.link)}" target="_blank" rel="noopener">${txt}</a>` : `<a onclick="go('${s.page || "home"}')">${txt}</a>`;
      }).join("") + "</div>";
    }
    addMsg("a", html);
  }

  /* ---------- 设置面板 ---------- */
  function applyCfg() {
    const cfg = getCfg();
    const sw = document.getElementById("swLLM");
    const fields = document.getElementById("llmFields");
    if (sw) sw.classList.toggle("on", !!cfg.useLLM);
    if (fields) fields.style.display = cfg.useLLM ? "block" : "none";
    if (document.getElementById("cfgUrl")) document.getElementById("cfgUrl").value = cfg.url || "";
    if (document.getElementById("cfgKey")) document.getElementById("cfgKey").value = cfg.key || "";
    if (document.getElementById("cfgModel")) document.getElementById("cfgModel").value = cfg.model || "deepseek-chat";
    if (document.getElementById("cfgStyle")) document.getElementById("cfgStyle").value = cfg.style || "normal";
    const mode = document.getElementById("aiMode");
    const dot = document.getElementById("aiDot");
    if (mode) mode.textContent = cfg.useLLM ? "大模型增强模式" : "本地知识库模式";
    if (dot) dot.style.background = cfg.useLLM ? "#7ed6a5" : "#7ed6a5";
    const cnt = document.getElementById("kbCount");
    if (cnt) cnt.textContent = (KB.docs || []).length;
  }
  function saveCfg() {
    const cfg = getCfg();
    cfg.useLLM = document.getElementById("swLLM").classList.contains("on");
    cfg.url = document.getElementById("cfgUrl").value.trim();
    cfg.key = document.getElementById("cfgKey").value.trim();
    cfg.model = document.getElementById("cfgModel").value.trim() || "deepseek-chat";
    cfg.style = document.getElementById("cfgStyle").value;
    setCfg(cfg);
    applyCfg();
    const p = document.getElementById("cfgPanel");
    if (p) p.classList.remove("on");
  }

  /* ---------- 开合 ---------- */
  function open() { const c = document.getElementById("chat"); if (c) c.classList.add("on"); const h = document.getElementById("aiHint"); if (h) h.style.display = "none"; }
  function close() { const c = document.getElementById("chat"); if (c) c.classList.remove("on"); const h = document.getElementById("aiHint"); if (h) h.style.display = ""; }
  function toggle() { const c = document.getElementById("chat"); if (c) c.classList.toggle("on"); }
  function big() { const c = document.getElementById("chat"); if (c) c.classList.toggle("big"); }
  function clearChat() { welcome(); }

  function init() {
    applyCfg();
    const bind = (id, ev, fn) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, fn); };
    bind("fab", "click", toggle);
    bind("chatX", "click", close);
    bind("chatBig", "click", big);
    bind("chatClr", "click", clearChat);
    bind("chatCfg", "click", () => { const p = document.getElementById("cfgPanel"); if (p) p.classList.add("on"); });
    bind("cfgBack", "click", () => { const p = document.getElementById("cfgPanel"); if (p) p.classList.remove("on"); });
    bind("cfgSave", "click", saveCfg);
    bind("swLLM", "click", () => { const sw = document.getElementById("swLLM"); sw.classList.toggle("on"); document.getElementById("llmFields").style.display = sw.classList.contains("on") ? "block" : "none"; });
    bind("chatSend", "click", () => send());
    bind("chatIn", "keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
    welcome();
  }

  window.AI = { init, open, close, toggle, send, clearChat };
})();
