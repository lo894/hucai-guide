/* ============================================================
   collector.js — 「最新动态」页：展示 AI 自动抓取的最新通知
   数据来自 data/feed.json（crawler/collect.py 生成）
   依赖：kb.js（KB.data.feed）
   ============================================================ */
(function () {
  "use strict";
  const esc = window.esc;
  let onlyFresh = false;

  function fmtDate(d) {
    if (!d) return { m: "--", day: "--" };
    const p = String(d).split("-");
    return { m: (p[1] || "01") + "月", day: p[2] || "01" };
  }

  function render() {
    const box = document.getElementById("p-feed");
    if (!box) return;
    const feed = KB.data.feed || { updated: "", total: 0, freshmanCount: 0, sources: [], items: [] };
    const items = feed.items || [];
    const sources = feed.sources || [];

    const srcChips = sources.map(s => {
      const ok = s.status === "ok";
      return `<div class="src-i"><div class="sn">${esc(s.name)}</div><div class="su">${esc(s.url || "")}</div>
        <div class="ss" style="color:${ok ? "#7ed6a5" : "#ff9a8b"}">${ok ? "✓ 抓取 " + (s.count || 0) + " 条" : "✗ " + esc((s.error || "失败").slice(0, 30))}</div></div>`;
    }).join("");

    const list = items.filter(it => !onlyFresh || it.freshman).map(it => {
      const dt = fmtDate(it.date);
      const tags = (it.tags || []).map(t => `<span class="tag gold">${esc(t)}</span>`).join("");
      const link = it.url ? `href="${esc(it.url)}" target="_blank" rel="noopener"` : "";
      return `<a class="feed" ${link} style="text-decoration:none;color:inherit">
        <div class="fd"><div class="m">${dt.m}</div><div class="d">${dt.day}</div></div>
        <div style="flex:1;min-width:0">
          <div class="ft">${esc(it.title)}</div>
          <div class="fm"><span>📡 ${esc(it.source || "")}</span>${it.category ? `<span class="tag navy">${esc(it.category)}</span>` : ""}${tags}${it.freshman ? `<span class="tag green">新生相关</span>` : ""}</div>
        </div></a>`;
    }).join("");

    box.innerHTML = `
    <div class="col-bar">
      <div>
        <div class="ct">🤖 自主收集 · 最新动态</div>
        <div class="cd">由网站内置爬虫定时抓取学校官网、招生网等 ${sources.length} 个来源，自动清洗去重、按关键词标记「新生相关」。</div>
      </div>
      <div class="cb">
        <button class="btn o" onclick="Collector.refresh()">↻ 立即抓取</button>
        <button class="btn ${onlyFresh ? "" : "o"}" onclick="Collector.toggleFresh()">${onlyFresh ? "显示全部" : "只看新生相关"}</button>
      </div>
    </div>

    <div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>
      数据更新于 <b>${esc(feed.updated || "—")}</b>，共 <b>${feed.total || 0}</b> 条，其中标记「新生相关」<b>${feed.freshmanCount || 0}</b> 条。
      本版本为静态托管，不自动抓取；官网发布新通知后，站长会手动更新本页，或联系站长 L.大王 协助更新。
    </div></div>

    <div class="sec" style="margin-bottom:14px">${sources.length ? `<div class="sec-h"><h2>数据来源</h2><span class="d">抓取状态</span></div><div class="grid g3">${srcChips}</div>` : ""}</div>

    <div class="sec-h"><h2>动态列表</h2><span class="d">${onlyFresh ? "仅新生相关" : "全部"}</span></div>
    <div id="feedList">${list || '<div class="empty"><div class="ei">📭</div>暂无动态，点「立即抓取」试试</div>'}</div>`;
  }

  // 切换「只看新生相关」
  function toggleFresh() {
    onlyFresh = !onlyFresh;
    render();
    // 重新滚到顶部
    const c = document.querySelector(".content");
    if (c) c.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // 静态版：无后端，无法直接抓取。改为提示联系站长更新。
  function refresh() {
    flash("本站为静态版本，暂不支持自动抓取。如需更新最新动态，请联系站长 L.大王（微信：手可摘月🌙亮）帮你更新；或在本机运行 python crawler/collect.py --once 后重新部署。");
  }
  function flash(msg) {
    const n = document.createElement("div");
    n.className = "note warn";
    n.style.marginBottom = "12px";
    n.innerHTML = `<span class="ni">⚠️</span><div>${esc(msg)}</div>`;
    const list = document.getElementById("feedList");
    if (list) list.parentNode.insertBefore(n, list);
    setTimeout(() => n.remove(), 6000);
  }

  window.Collector = { render, toggleFresh, refresh };
})();
