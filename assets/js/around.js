/* ============================================================
   around.js — 校园周边生活栏位（好吃 / 好玩 / 景点 / 生活 / 健身 / 购物 / 医疗 / 出行）
   一排分类栏位，点击展开该类地点；未补充的类别显示投稿占位
   依赖：kb.js（KB.data['around']）
   由 map.js 在 render() 后调用 Around.mount(host)
   ============================================================ */
(function () {
  "use strict";
  const WX = "Rat_millet5015";
  let cur = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function data() {
    try { return (typeof KB !== "undefined" && KB.data && KB.data["around"]) || null; }
    catch (e) { return null; }
  }

  function copyWx() {
    if (window.copyText) window.copyText(WX);
    else navigator.clipboard && navigator.clipboard.writeText(WX);
  }

  function itemCard(it) {
    return `<div class="ar-item">
      <div class="ar-it-h"><b>${esc(it.name)}</b>${it.tag ? `<span class="ar-tag">${esc(it.tag)}</span>` : ""}</div>
      <div class="ar-it-d">${esc(it.desc || "")}</div>
      <div class="ar-it-m">
        ${it.where ? `<span>📍 ${esc(it.where)}</span>` : ""}
        ${it.dist ? `<span>🚶 ${esc(it.dist)}</span>` : ""}
      </div>
      ${it.tips ? `<div class="ar-it-t">💡 ${esc(it.tips)}</div>` : ""}
    </div>`;
  }

  function render() {
    const D = data();
    const host = document.getElementById("arHost");
    if (!host || !D) return;
    const cats = D.cats || [];
    if (!cur || !cats.find(c => c.id === cur)) cur = (cats[0] || {}).id;

    const chips = cats.map(c =>
      `<span class="ar-chip${c.id === cur ? " on" : ""}" data-k="${esc(c.id)}"><span class="ar-ci">${c.icon}</span>${esc(c.name)}</span>`
    ).join("");

    const c = cats.find(x => x.id === cur) || { items: [] };
    const list = (c.items || []).length
      ? c.items.map(itemCard).join("")
      : `<div class="ar-empty">
           <div class="ar-em-i">${c.icon || "📍"}</div>
           <div class="ar-em-t">「${esc(c.name)}」还没补充</div>
           <div class="ar-em-d">${esc(c.desc || "")}——你知道附近好店 / 好地方？微信告诉站长，立刻加进地图，还能领邀请福利。</div>
           <button type="button" class="ar-em-b" onclick="Around.copy()">复制站长微信 ${esc(WX)}</button>
         </div>`;

    host.innerHTML = `
      <div class="sec-h"><h2>校园周边 · 生活指南</h2><span class="d">点分类看详情 · 持续补充中</span></div>
      <div class="ar-chips">${chips}</div>
      <div class="ar-list">${list}</div>
      <div class="note" style="margin-top:10px"><span class="ni">📍</span><div>${esc(D.note || "")}</div></div>`;

    host.querySelectorAll(".ar-chip").forEach(ch => {
      ch.addEventListener("click", () => { cur = ch.dataset.k; render(); });
    });
  }

  window.Around = { mount: render, copy: copyWx };
})();
