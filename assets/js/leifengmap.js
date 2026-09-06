/* ============================================================
   leifengmap.js — 雷锋校区精细电子地图（Leaflet + 官方平面图底图）
   可缩放拖拽 · 全量楼栋标注 · 分类筛选 · 一键唤起手机地图导航
   依赖：leaflet（assets/vendor）、kb.js（KB.data['leifeng-map']）
   由 map.js 在 render() 后调用 LeifengMap.mount(host)
   ============================================================ */
(function () {
  "use strict";
  let map = null;
  let markers = [];
  let filter = "all";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function data() {
    try { return (typeof KB !== "undefined" && KB.data && KB.data["leifeng-map"]) || null; }
    catch (e) { return null; }
  }

  /* 图片百分比坐标 → Leaflet CRS.Simple 坐标 */
  function pt(p, D) {
    const W = D.imgW || 987, H = D.imgH || 1410;
    return [H * (1 - p.y / 100), W * (p.x / 100)];
  }

  function navUrl(kind, D, name) {
    const g = D.geo.southGate; // [lng, lat]
    const lng = g[0], lat = g[1];
    const n = encodeURIComponent(name || "雷锋校区南门");
    if (kind === "tx") {
      return D.nav.tx.replace("{name}", n).replace("{lat}", lat).replace("{lng}", lng);
    }
    return D.nav.gd.replace("{name}", n).replace("{lng}", lng).replace("{lat}", lat);
  }

  function iconHtml(p, D) {
    const col = (D.types[p.type] || { c: "#888" }).c;
    return `<div class="lf-mk"><span class="lf-dot" style="background:${col}"></span><span class="lf-tx">${esc(p.name)}</span></div>`;
  }

  function popupHtml(p, D) {
    const t = D.types[p.type] || { name: "地点" };
    return `<div class="lf-pop">
      <div class="lf-pop-h"><b>${esc(p.name)}</b><span class="lf-tag" style="background:${t.c}">${esc(t.name)}</span></div>
      <div class="lf-pop-d">${esc(p.desc || "")}</div>
      ${p.tips ? `<div class="lf-pop-t">💡 ${esc(p.tips)}</div>` : ""}
      <div class="lf-pop-nav">
        <a class="lf-btn" href="${navUrl("tx", D)}" target="_blank" rel="noopener">🧭 到这去 · 步行导航</a>
        <a class="lf-btn2" href="${navUrl("gd", D)}" target="_blank" rel="noopener">用高德导航</a>
      </div>
      <div class="lf-pop-n">导航至「雷锋校区南门」，入校后按平面图与路牌步行 ${esc(p.name)}</div>
    </div>`;
  }

  function addMarkers(D) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    (D.points || []).forEach(p => {
      if (filter !== "all" && p.type !== filter) return;
      const col = (D.types[p.type] || { c: "#888" }).c;
      const m = L.marker(pt(p, D), {
        icon: L.divIcon({
          className: "lf-mk-wrap",
          html: iconHtml(p, D),
          iconSize: [0, 0],
          iconAnchor: [7, 7]
        })
      }).addTo(map);
      m.bindPopup(popupHtml(p, D), { maxWidth: 300, minWidth: 220, closeButton: true, autoPan: true });
      m.on("click", () => highlight(p.id));
      markers.push({ id: p.id, m });
    });
  }

  function highlight(id) {
    const list = document.getElementById("lfList");
    if (!list) return;
    list.querySelectorAll(".lf-li").forEach(el => {
      el.classList.toggle("on", el.dataset.id === id);
    });
    const on = list.querySelector(".lf-li.on");
    if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function flyTo(id) {
    const D = data();
    if (!D || !map) return;
    const p = (D.points || []).find(x => x.id === id);
    if (!p) return;
    map.flyTo(pt(p, D), Math.max(map.getZoom(), 0.5), { duration: 0.5 });
    const mk = markers.find(x => x.id === id);
    if (mk) setTimeout(() => mk.m.openPopup(), 550);
  }

  function renderList(D) {
    const list = document.getElementById("lfList");
    if (!list) return;
    const groups = {};
    (D.points || []).forEach(p => {
      if (filter !== "all" && p.type !== filter) return;
      (groups[p.type] = groups[p.type] || []).push(p);
    });
    const t = D.types || {};
    list.innerHTML = Object.keys(t).filter(k => groups[k]).map(k => `
      <div class="lf-grp">
        <div class="lf-grp-h"><span class="dot" style="background:${t[k].c}"></span>${esc(t[k].name)}</div>
        <div class="lf-grp-b">${groups[k].map(p =>
          `<button class="lf-li" data-id="${esc(p.id)}" type="button">${esc(p.name.replace(/（.*?）/g, ""))}</button>`).join("")}</div>
      </div>`).join("");
    list.querySelectorAll(".lf-li").forEach(btn => {
      btn.addEventListener("click", () => flyTo(btn.dataset.id));
    });
  }

  function renderChips(D) {
    const box = document.getElementById("lfChips");
    if (!box) return;
    const items = [["all", "全部", "#333"]].concat(Object.keys(D.types || {}).map(k => [k, D.types[k].name, D.types[k].c]));
    box.innerHTML = items.map(([k, n, c]) =>
      `<span class="lf-chip ${filter === k ? "on" : ""}" data-k="${k}"><span class="dot" style="background:${c}"></span>${esc(n)}</span>`).join("");
    box.querySelectorAll(".lf-chip").forEach(ch => {
      ch.addEventListener("click", () => {
        filter = ch.dataset.k;
        renderChips(D); renderList(D); addMarkers(D);
      });
    });
  }

  function mount(host) {
    const D = data();
    if (!host || !D || typeof L === "undefined") {
      if (host) host.innerHTML = `<div class="note tip"><span class="ni">🗺️</span><div>电子地图组件加载失败，请刷新重试。</div></div>`;
      return;
    }
    if (map) { map.remove(); map = null; }
    const W = D.imgW || 987, H = D.imgH || 1410;
    const bounds = [[0, 0], [H, W]];

    const chips = `<div class="lf-chips" id="lfChips"></div>`;
    host.innerHTML = `
      <div class="sec-h"><h2>雷锋书院 · 精细电子地图</h2><span class="d">官方平面图 · 双指缩放 · 点图钉看详情导航</span></div>
      <div class="lf-topbar">
        <a class="lf-btn" href="${navUrl("tx", D, "雷锋校区")}" target="_blank" rel="noopener">🧭 导航到雷锋校区</a>
        <a class="lf-btn2" href="${navUrl("gd", D, "雷锋校区")}" target="_blank" rel="noopener">高德导航</a>
        <a class="lf-btn2" href="tel:${esc(D.geo.phone)}">📞 ${esc(D.geo.phone)}</a>
      </div>
      ${chips}
      <div class="lf-mapwrap"><div id="lfmap" class="lf-map"></div></div>
      <div class="lf-list" id="lfList"></div>
      <div class="note tip" style="margin-top:12px"><span class="ni">🚖</span><div><b>怎么到校：</b>${(D.arrival || []).map(esc).join("<br>· ")}</div></div>
      <div class="note tip" style="margin-top:8px"><span class="ni">📝</span><div><b>报到安排：</b>${esc(D.report || "")}</div></div>
      <div class="note" style="margin-top:8px"><span class="ni">📍</span><div>${esc(D.note || "")}</div></div>
    `;

    map = L.map("lfmap", {
      crs: L.CRS.Simple,
      minZoom: -2.5,
      maxZoom: 1.5,
      zoomSnap: 0.25,
      zoomControl: true,
      attributionControl: false,
      maxBounds: L.latLngBounds(bounds).pad(0.3),
      maxBoundsViscosity: 0.8
    });
    L.imageOverlay("assets/img/leifeng-map.jpg", bounds).addTo(map);
    map.fitBounds(bounds, { padding: [4, 4] });

    renderChips(D);
    renderList(D);
    addMarkers(D);

    /* 容器尺寸变化后重算（手机旋转/切页） */
    setTimeout(() => { if (map) map.invalidateSize(); }, 60);
  }

  window.LeifengMap = { mount, flyTo };
})();
