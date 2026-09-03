/* ============================================================
   map.js — 校园地图（SVG 交互）
   两校区建筑点位导览，点击点位查看说明
   依赖：kb.js（KB.data['campus-map']）
   ============================================================ */
(function () {
  "use strict";
  const esc = window.esc;
  let cur = "main";
  const hidden = new Set();

  const TYPE = {
    gate:     { c: "#c0392b", name: "校门" },
    teaching: { c: "#2c6ecb", name: "教学楼" },
    library:  { c: "#6b4fa0", name: "图书馆" },
    landmark: { c: "#c2953c", name: "地标广场" },
    sports:   { c: "#2e7d5b", name: "体育场馆" },
    canteen:  { c: "#e67e22", name: "食堂" },
    dorm:     { c: "#16a085", name: "宿舍" },
    medical:  { c: "#e74c3c", name: "医疗" },
    service:  { c: "#7f8c8d", name: "生活服务" },
    admin:    { c: "#34495e", name: "行政楼" },
  };

  const W = 680, H = 460, PX = 20, PY = 24;
  const sx = x => PX + (x / 100) * (W - 2 * PX);
  const sy = y => PY + (y / 100) * (H - 2 * PY);

  function campus() {
    const M = KB.data["campus-map"] || { campuses: [] };
    return (M.campuses || []).find(c => c.id === cur) || M.campuses[0];
  }

  function render() {
    const box = document.getElementById("p-map");
    if (!box) return;
    const M = KB.data["campus-map"] || { campuses: [] };
    const c = campus();

    const chips = M.campuses.map(cm =>
      `<span class="chip ${cm.id === cur ? "on g" : ""}" onclick="MapView.switch('${cm.id}')">${esc(cm.name)}</span>`
    ).join("");

    const legend = Object.entries(TYPE).map(([k, v]) =>
      `<div class="lg ${hidden.has(k) ? "off" : ""}" onclick="MapView.toggleType('${k}')"><span class="dot" style="background:${v.c}"></span>${esc(v.name)}</div>`
    ).join("");

    const panoramaSec = (c.id === "main") ? `
    <div class="sec">${secH("🌍 主校区 720° 全景航拍", "身临其境逛校园")}
      <div class="vr-wrap" style="position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden">
        <iframe src="https://www.720yun.com/t/54ejzztktn7" style="position:absolute;inset:0;width:100%;height:100%;border:0" loading="lazy" allowfullscreen allow="fullscreen;accelerometer;gyroscope"></iframe>
      </div>
      <div class="note tip" style="margin-top:10px"><span class="ni">🧭</span><div>这是<b>主校区</b>的 720° 航拍全景，可拖动旋转、点击地面箭头行走；如上方未加载，<a href="https://www.720yun.com/t/54ejzztktn7" target="_blank" rel="noopener">点这里在新窗口打开 ↗</a>。雷锋校区暂无全景。</div></div>
    </div>` : "";

    box.innerHTML = `
    ${panoramaSec}

    <div class="sec">${secH("校园地图导览", "示意图，非精确测绘")}
      <div class="flt" style="margin-bottom:14px"><div class="flt-r"><span class="flt-l">校区</span>${chips}</div></div>
      <div class="grid g2">
        <div class="map-w">
          ${svg(c)}
          <div class="map-info" id="mapInfo"></div>
        </div>
        <div>
          <div class="sec-h" style="border:none;margin-bottom:8px;padding:0"><h2 style="font-size:15px">${esc(c.name)}点位</h2><span class="d">${esc(c.address)}</span></div>
          <div id="mapList" style="display:flex;flex-direction:column;gap:7px">${listItems(c)}</div>
        </div>
      </div>
      <div class="map-legend">${legend}</div>
      <div class="note tip" style="margin-top:12px"><span class="ni">📍</span><div>${esc(c.desc || "")}<br>交通：${(c.transport || []).map(esc).join("；")}<br><span style="color:var(--tx3)">${esc(M.note || "")}</span></div></div>
    </div>`;
  }

  function secH(t, d) {
    return `<div class="sec-h"><h2>${esc(t)}</h2>${d ? `<span class="d">${esc(d)}</span>` : ""}</div>`;
  }

  function svg(c) {
    const ground = `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="18" fill="#eef4ec" stroke="#cdd9c9"/>
      <path d="M40 ${H - 60} Q ${W / 2} ${H / 2 - 40} ${W - 40} 70" stroke="#d6e2d4" stroke-width="10" fill="none" stroke-linecap="round"/>
      <text x="40" y="${H - 22}" font-size="12" fill="#9bb09a">${esc(c.name)} · 平面示意</text>`;
    const pts = (c.points || []).map((p, i) => {
      if (hidden.has(p.type)) return "";
      const col = (TYPE[p.type] || { c: "#888" }).c;
      const x = sx(p.x), y = sy(p.y);
      const lx = x > W - 130 ? x - 8 : x + 14;
      const anchor = x > W - 130 ? "end" : "start";
      return `<g class="mpt" data-i="${i}" onclick="MapView.tap(${i})">
        <circle cx="${x}" cy="${y}" r="9" fill="${col}" stroke="#fff" stroke-width="2.5"/>
        <text x="${lx}" y="${y + 4}" font-size="11.5" fill="#2b3a2b" text-anchor="${anchor}">${esc(p.name)}</text>
      </g>`;
    }).join("");
    return `<svg class="map-sv" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${ground}${pts}</svg>`;
  }

  function listItems(c) {
    return (c.points || []).map((p, i) => {
      if (hidden.has(p.type)) return "";
      return `<div class="mpl" data-i="${i}" onclick="MapView.tap(${i})">
        <div class="h"><span class="dot" style="width:9px;height:9px;border-radius:50%;background:${(TYPE[p.type] || { c: "#888" }).c};display:inline-block"></span><span class="n">${esc(p.name)}</span></div>
        <div class="d">${esc(p.desc)}</div></div>`;
    }).join("");
  }

  function tap(i) {
    const c = campus();
    const p = (c.points || [])[i];
    if (!p) return;
    // 高亮
    document.querySelectorAll("#p-map .mpt").forEach(g => g.classList.toggle("on", +g.getAttribute("data-i") === i));
    document.querySelectorAll("#p-map .mpl").forEach(g => g.style.borderColor = +g.getAttribute("data-i") === i ? "var(--navy-l)" : "");
    const info = document.getElementById("mapInfo");
    if (info) {
      info.innerHTML = `<div class="t">${esc(p.name)}</div><div class="d">${esc(p.desc)}</div>${p.tips ? `<div class="p">💡 ${esc(p.tips)}</div>` : ""}`;
      info.classList.add("on");
      const x = sx(p.x), y = sy(p.y);
      info.style.left = Math.min(Math.max(x - 60, 8), W - 260) + "px";
      info.style.top = (y + 14) + "px";
      clearTimeout(tap._t);
      tap._t = setTimeout(() => info.classList.remove("on"), 4200);
    }
  }

  function switchCampus(id) {
    cur = id; hidden.clear(); render();
  }
  function toggleType(k) {
    if (hidden.has(k)) hidden.delete(k); else hidden.add(k);
    render();
  }

  window.MapView = { render, switch: switchCampus, toggleType, tap };
})();
