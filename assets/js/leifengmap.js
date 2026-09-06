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

  /* ================= 页内导航（示意路网 + 最短路径） ================= */
  let routeLayer = null;

  function distM(a, b, W) {
    const dx = (a[0] - b[0]) * W.scale.x;
    const dy = (a[1] - b[1]) * W.scale.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function adjacency(W) {
    const g = {};
    Object.keys(W.nodes).forEach(k => g[k] = []);
    W.edges.forEach(([a, b]) => {
      const d = distM(W.nodes[a], W.nodes[b], W);
      g[a].push([b, d]); g[b].push([a, d]);
    });
    return g;
  }

  function shortest(W, s, e) {
    const g = adjacency(W);
    const dist = {}, prev = {}, seen = new Set();
    Object.keys(g).forEach(k => dist[k] = Infinity);
    dist[s] = 0;
    while (true) {
      let u = null, best = Infinity;
      Object.keys(dist).forEach(k => { if (!seen.has(k) && dist[k] < best) { best = dist[k]; u = k; } });
      if (u === null || u === e) break;
      seen.add(u);
      g[u].forEach(([v, w]) => { if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } });
    }
    if (!isFinite(dist[e])) return null;
    const path = []; let cur = e;
    while (cur) { path.unshift(cur); cur = prev[cur]; }
    return { path, meters: dist[e] };
  }

  function bearing(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    return (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  }
  function dirName(deg) {
    const names = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
    return names[Math.round(deg / 45) % 8];
  }

  function mPt(p) {
    const x = Array.isArray(p) ? p[0] : p.x;   /* 路线点是 [x,y]，POI 是 {x,y} */
    const y = Array.isArray(p) ? p[1] : p.y;
    return [x * 9.0, y * 12.85];
  }

  /* 计算每个建筑到路线的最短距离 / 沿线位置 / 在行进方向的左侧还是右侧 */
  function routeSights(pts, P) {
    const mp = pts.map(mPt);
    const cum = [0];
    for (let i = 1; i < mp.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(mp[i][0] - mp[i - 1][0], mp[i][1] - mp[i - 1][1]));
    }
    const out = [];
    P.forEach(poi => {
      const q = mPt(poi);
      let best = { d: Infinity, t: 0, side: "right" };
      for (let i = 0; i < mp.length - 1; i++) {
        const a = mp[i], b = mp[i + 1];
        const vx = b[0] - a[0], vy = b[1] - a[1];
        const len2 = vx * vx + vy * vy || 1;
        let t = ((q[0] - a[0]) * vx + (q[1] - a[1]) * vy) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = a[0] + t * vx, py = a[1] + t * vy;
        const d = Math.hypot(q[0] - px, q[1] - py);
        if (d < best.d) {
          const cross = vx * (q[1] - a[1]) - vy * (q[0] - a[0]);
          best = { d, t: cum[i] + t * Math.sqrt(len2), side: cross > 0 ? "right" : "left" };
        }
      }
      if (best.d < 85) out.push({ poi, d: best.d, t: best.t, side: best.side });
    });
    return out.sort((a, b) => a.t - b.t);
  }

  function stepsOf(pts) {
    const segs = [];
    let run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot((pts[i + 1][0] - pts[i][0]) * 9.0, (pts[i + 1][1] - pts[i][1]) * 12.85);
      const t0 = run; run += d;
      if (d < 8) continue; /* 忽略零碎段 */
      segs.push({ b: bearing(pts[i], pts[i + 1]), d, t0, t1: run });
    }
    if (!segs.length) return [];
    const out = [];
    let acc = segs[0].d, curB = segs[0].b, t0 = segs[0].t0, t1 = segs[0].t1;
    const label = t => t > 0 ? "right" : "left";
    const push = (turn, from, to) => out.push({ turn, dir: dirName(curB), m: acc, t0: from, t1: to });
    for (let i = 1; i < segs.length; i++) {
      const turn = ((segs[i].b - curB + 540) % 360) - 180;
      if (Math.abs(turn) <= 35) { acc += segs[i].d; t1 = segs[i].t1; }
      else {
        push(out.length ? label(turn) : "go", t0, t1);
        acc = segs[i].d; curB = segs[i].b; t0 = segs[i].t0; t1 = segs[i].t1;
      }
    }
    const finalTurn = segs.length > 1 ? (((segs[segs.length - 1].b - curB + 540) % 360) - 180) : 0;
    push(out.length && Math.abs(finalTurn) > 35 ? label(finalTurn) : "go", t0, t1);
    return out;
  }

  function clearRoute() {
    if (routeLayer && map) { map.removeLayer(routeLayer); routeLayer = null; }
    const r = document.getElementById("lfRoute");
    if (r) r.innerHTML = "";
  }

  function goRoute() {
    const D = data();
    if (!D || !map || !D.ways) return;
    const f = document.getElementById("lfFrom").value;
    const t = document.getElementById("lfTo").value;
    const P = D.points || [];
    const A = P.find(p => p.id === f), B = P.find(p => p.id === t);
    if (!A || !B || A.id === B.id) {
      document.getElementById("lfRoute").innerHTML = `<div class="lf-rt-err">请选择两个不同的地点</div>`;
      return;
    }
    const W = D.ways;
    let r = A.node === B.node ? { path: [A.node], meters: 0 } : shortest(W, A.node, B.node);
    if (!r) { document.getElementById("lfRoute").innerHTML = `<div class="lf-rt-err">这两点之间暂无可走路线</div>`; return; }
    const nodePts = r.path.map(k => W.nodes[k]);
    const pts = [[A.x, A.y]].concat(nodePts, [[B.x, B.y]]);
    const total = pts.slice(1).reduce((s, p, i) => s + Math.hypot((p[0] - pts[i][0]) * 9.0, (p[1] - pts[i][1]) * 12.85), 0);
    const mins = Math.max(1, Math.round(total / (W.speed || 80)));

    clearRoute();
    const ll = pts.map(p => pt({ x: p[0], y: p[1] }, D));
    routeLayer = L.layerGroup([
      L.polyline(ll, { color: "#1565C0", weight: 7, opacity: .85, lineCap: "round" }),
      L.polyline(ll, { color: "#FFFFFF", weight: 2, opacity: .8, dashArray: "2 10" }),
      L.circleMarker(ll[0], { radius: 9, color: "#fff", weight: 3, fillColor: "#E53935", fillOpacity: 1 }),
      L.circleMarker(ll[ll.length - 1], { radius: 9, color: "#fff", weight: 3, fillColor: "#1E88E5", fillOpacity: 1 })
    ]).addTo(map);
    map.fitBounds(L.latLngBounds(ll).pad(0.25));

    const st = stepsOf(pts);
    const sights = routeSights(pts, P).filter(s => s.poi.id !== A.id && s.poi.id !== B.id);
    const sideTx = s => (s.side === "right" ? "右手边" : "左手边");
    const announced = new Set([A.id, B.id]); /* 同一栋楼只播报一次 */
    const rows = st.map((s, i) => {
      const act = i === 0 ? "出发" : (s.turn === "right" ? "右转" : (s.turn === "left" ? "左转" : "继续"));
      const inStep = x => x.t >= s.t0 - 3 && x.t <= s.t1 + 3 && !announced.has(x.poi.id);
      const pass = sights.filter(x => x.d < 45 && inStep(x)).slice(0, 5);
      pass.forEach(x => announced.add(x.poi.id));
      const refs = sights.filter(x => x.d >= 45 && x.d < 95 && inStep(x)).slice(0, 3);
      refs.forEach(x => announced.add(x.poi.id));
      const passTx = pass.map(x =>
        `走约 <b>${Math.max(5, Math.round(x.t - s.t0))}</b> 米，${sideTx(x)}经过 <b>【${esc(x.poi.name)}】</b>`
      ).join("<br>");
      const refL = refs.filter(x => x.side === "left"), refR = refs.filter(x => x.side === "right");
      const nm = x => `【${esc(x.poi.name)}】`;
      const parts = [];
      if (refL.length) parts.push(`左手边可见 ${refL.map(nm).join("、")}`);
      if (refR.length) parts.push(`右手边可见 ${refR.map(nm).join("、")}`);
      const refTx = parts.length ? `参照：${parts.join("；")}` : "";
      return `<div class="lf-step">
        <span class="lf-step-i">${i + 1}</span>
        <span class="lf-step-t"><b>${act}</b> · 向${s.dir}走约 <b>${Math.round(s.m)}</b> 米
          <span class="lf-cum">（已走 ${Math.round(s.t1)} / ${Math.round(total)} 米）</span>
          ${passTx ? `<div class="lf-pass">${passTx}</div>` : ""}
          ${refTx ? `<div class="lf-pass ref">${refTx}</div>` : ""}
        </span></div>`;
    }).join("")
      + `<div class="lf-step"><span class="lf-step-i end">✓</span><span class="lf-step-t"><b>到达</b> <b>【${esc(B.name)}】</b></span></div>`;
    document.getElementById("lfRoute").innerHTML = `
      <div class="lf-rt-h">🚶 ${esc(A.name)} → ${esc(B.name)}</div>
      <div class="lf-rt-s">全程约 <b>${Math.round(total)}</b> 米 · 步行约 <b>${mins}</b> 分钟（按 80 米/分钟估算）</div>
      <div class="lf-steps">${rows}</div>
      <div class="lf-rt-n">路线按示意路网计算，实际以校内道路与路牌为准。</div>`;
    document.getElementById("lfRoute").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function renderNavPanel(D) {
    const P = D.points || [];
    const opts = P.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
    const box = document.getElementById("lfNav");
    if (!box) return;
    box.innerHTML = `
      <div class="lf-nav-row">
        <span class="lf-nav-l">从</span><select id="lfFrom" class="lf-sel">${opts}</select>
        <button type="button" class="lf-swap" id="lfSwap" title="交换起终点">⇅</button>
        <span class="lf-nav-l">到</span><select id="lfTo" class="lf-sel">${opts}</select>
        <button type="button" class="lf-btn" id="lfGo">🚶 开始导航</button>
        <button type="button" class="lf-li" id="lfClear">清除路线</button>
      </div>
      <div id="lfRoute"></div>`;
    const gate = P.find(p => p.type === "gate") || P[0];
    const zc = P.find(p => p.id === "zc") || P[1];
    document.getElementById("lfFrom").value = gate.id;
    document.getElementById("lfTo").value = zc.id;
    document.getElementById("lfGo").addEventListener("click", goRoute);
    document.getElementById("lfClear").addEventListener("click", clearRoute);
    document.getElementById("lfSwap").addEventListener("click", () => {
      const a = document.getElementById("lfFrom"), b = document.getElementById("lfTo");
      const v = a.value; a.value = b.value; b.value = v;
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
      <div class="lf-nav" id="lfNav"></div>
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
    renderNavPanel(D);

    /* 容器尺寸变化后重算（手机旋转/切页） */
    setTimeout(() => { if (map) map.invalidateSize(); }, 60);
  }

  function unmount() {
    if (map) { map.remove(); map = null; }
    markers = [];
    filter = "all";
    routeLayer = null;
  }

  window.LeifengMap = { mount, unmount, flyTo };
})();
