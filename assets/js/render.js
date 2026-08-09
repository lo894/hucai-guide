/* ============================================================
   render.js — 各内容页面渲染（首页/概况/专业/校园/地图/清单/
   军训/电脑/政策/资源/FAQ）+ 专业详情弹窗
   依赖：kb.js（KB.data / KB.search）
   ============================================================ */
(function () {
  "use strict";

  // 全局 HTML 转义
  window.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  };
  const esc = window.esc;

  const D = () => KB.data; // 取原始数据

  // 通用小工具
  const tag = (t, c) => `<span class="tag ${c || ""}">${esc(t)}</span>`;
  const card = (html) => `<div class="card">${html}</div>`;
  const secH = (t, d, more) =>
    `<div class="sec-h"><h2>${esc(t)}</h2>${d ? `<span class="d">${esc(d)}</span>` : ""}${more || ""}</div>`;

  // 等级配色（清单 / 专业标签）
  const LV = { must: "#d64545", rec: "#c98a2e", buy: "#2e7d5b", no: "#7b7b8b" };
  const LVN = { must: "必带", rec: "建议带", buy: "到校再买", no: "别带" };

  function contactCard(s) {
    const c = (s && s.contact) || {};
    if (!c.qr && !c.wechat) return "";
    return `<div class="contact-card">
      <div class="contact-qr"><img src="${esc(c.qr || "")}" alt="微信二维码" loading="lazy"></div>
      <div class="contact-info">
        <div class="contact-name">${esc(c.name || "同学")}</div>
        <div class="contact-role">${esc(c.role || "本站建立者与维护者")}</div>
        <div class="contact-wx">微信号 / 昵称：<b>${esc(c.wechat || "")}</b></div>
        <div class="contact-note">${esc(c.note || "扫码加微信咨询")}</div>
        <div class="contact-busy">⏱ 本人较忙，消息不一定及时回复，见谅～</div>
      </div>
    </div>`;
  }

  function officePhones(s) {
    const o = (s && s.offices) || {};
    if (!o.groups || !o.groups.length) return "";
    const groups = o.groups.map(g => {
      const items = (g.items || []).map(it =>
        `<div class="oph-i"><div class="oph-n">${esc(it.name)}${it.mark ? `<span class="oph-mk">${esc(it.mark)}</span>` : ""}</div><div class="oph-p"><a href="tel:${esc(it.phone)}">${esc(it.phone)}</a></div></div>`
      ).join("");
      return `<div class="oph-g"><div class="oph-gt">${esc(g.title)}</div><div class="oph-list">${items}</div></div>`;
    }).join("");
    return `<div class="ophones">${groups}
      <div class="note tip"><span class="ni">ℹ️</span><div>${esc(o.note || "")}<br>来源：${esc(o.source || "")}（整理于 ${esc(o.updated || "")}）</div></div>
    </div>`;
  }

  /* ============================ 首页 ============================ */
  function home() {
    const s = D().school;
    const bless = (() => { try { return +(localStorage.getItem("hucai_reward") || 0) + +(localStorage.getItem("hucai_heart") || 0); } catch (e) { return 0; } })();
    const qf = (s.quickFacts || []).map(f =>
      `<div class="qf"><div class="qi">${esc(f.icon || "•")}</div><div class="ql">${esc(f.label)}</div><div class="qv">${esc(f.value)}</div><div class="qn">${esc(f.note || "")}</div></div>`
    ).join("");
    const stats = (s.overview.stats || []).map(st =>
      `<div class="stat"><div class="n">${esc(st.num)}<span>${esc(st.unit)}</span></div><div class="l">${esc(st.label)}</div></div>`
    ).join("");

    const entries = [
      { id: "about", ic: "🏫", t: "学校概况", d: "校史 · 校区 · 学费 · 校历" },
      { id: "majors", ic: "🎓", t: "专业培养", d: "51 个本科专业培养方案" },
      { id: "campus", ic: "🌳", t: "校园生活", d: "宿舍 · 食堂 · 设施 · 周边" },
      { id: "map", ic: "🗺️", t: "校园地图", d: "两校区建筑点位导览" },
      { id: "checklist", ic: "📋", t: "入学清单", d: "勾选式行李准备表" },
      { id: "training", ic: "🎖️", t: "军训指南", d: "安排 · 装备 · 生存法则" },
      { id: "laptop", ic: "💻", t: "电脑选购", d: "按专业给你配配置" },
      { id: "policies", ic: "📑", t: "政策文件", d: "学籍 · 奖助 · 考试" },
      { id: "resources", ic: "📚", t: "学习资源", d: "平台 · 证书 · 竞赛" },
      { id: "feed", ic: "📰", t: "最新动态", d: "网站自动抓取更新" },
      { id: "faq", ic: "💡", t: "常见问题", d: "新生最关心的问答" },
    ].map(e =>
      `<div class="entry" onclick="go('${e.id}')"><div class="ei">${e.ic}</div><div class="et">${e.t}</div><div class="ed">${esc(e.d)}</div></div>`
    ).join("");

    return `
    <div class="hero">
      <div class="hero-in">
        <span class="yr">2026 迎新季</span>
        <div class="sl">${esc(s.tagline || "岳麓山下 · 湘江之滨")}</div>
        <h1>湖南财政经济学院<br>新生入学指南</h1>
        <div class="ds">${esc(s.overview.intro.slice(0, 70))}……这里整理了 51 个专业培养计划、校园环境、宿舍、军训、政策与入学清单，还有一个随时能问的 AI 学长。</div>
        <div class="hero-btns">
          <div class="btn" onclick="go('majors')">查看专业培养 →</div>
          <div class="btn o" onclick="go('checklist')">入学准备清单</div>
          <div class="btn o" onclick="openAI()">🎓 问问 AI 学长</div>
        </div>
      </div>
    </div>

    <div class="sec">
      <div class="sec-h"><h2>新生速查</h2><span class="d">报到前先看这一屏</span></div>
      <div class="grid g6">${qf}</div>
    </div>

    <div class="sec">
      <div class="sec-h"><h2>联系我</h2><span class="d">有问题可以加微信 · 备注「湖财新生」</span></div>
      ${contactCard(s)}
      <div class="note tip" style="margin-top:12px"><span class="ni">📞</span><div>各部门 / 各学院办公电话（含你所在学院）已整理在 <a href="javascript:void(0)" onclick="go('about')">「学校概况」页</a> 底部，可随时查看。</div></div>
    </div>

    <div class="sec">
      <div class="sec-h"><h2>数说湖财</h2><span class="d">${esc(s.type)}</span></div>
      <div class="grid g4">${stats}</div>
    </div>

    <div class="sec">
      <div class="sec-h"><h2>快速入口</h2><span class="d">点一下直达</span></div>
      <div class="grid g3">${entries}</div>
    </div>

    <div class="note tip"><span class="ni">ℹ️</span>
      <div>本站为<b>非官方</b>新生互助指南，由 <b>L.大王</b> 用 <b>vibe coding</b> 方式独立搭建；内容均为<b>人工整理</b>（综合学校官网、招生网、公开攻略及个人查找等来源），<b>非 AI 生成</b>；另附自动同步自官方渠道的最新动态（见「最新动态」）。涉及缴费、录取、转专业等重大事项，<b>一律以学校官方通知为准</b>。如有错漏欢迎指正。</div>
    </div>

    <div class="sec maker-note">
      <div class="maker-card">
        <div class="maker-em">🌙☕️</div>
        <div class="maker-bd">
          <div class="maker-tt">🌟 作者碎碎念：这份指南，来得不容易</div>
          <p class="maker-tx">为了让你报到前少踩坑，站长 <b>L.大王</b> 熬了<b>一整个通宵</b> 🌙：把 51 个专业、宿舍、军训、政策、交通、证件清单……一条条翻出来、核对、排版。屏幕亮到天亮，咖啡凉了又热 ☕️。</p>
          <p class="maker-tx">它不是学校官方发布，却是一份「把自己踩过的坑，提前替你填平」的私心。制作不易，请你<b>好好珍惜、按需取用</b>，也欢迎顺手转给同校的新生朋友 🤝。</p>
          <div class="maker-acts">
            <button class="maker-btn" id="blessBtn">💛 为作者加油</button>
            <span class="maker-cnt">已经收到 <b id="blessNum">${bless}</b> 份鼓励 🎉</span>
          </div>
          <div class="maker-tip">👉 左下角有「🪙 打赏 +1 / 💗 比个心」，点点试试，有惊喜音效～</div>
          <div class="maker-tip">🔄 若无特殊情况，本网站会<b>持续更新</b>，开学前后的重要信息和政策都会及时补上，记得常回来看看～</div>
        </div>
      </div>
    </div>`;
  }

  /* ============================ 学校概况 ============================ */
  function about() {
    const s = D().school;
    const o = s.overview;
    const campusCards = s.campuses.map(c =>
      `<div class="dorm-c"><div class="dorm-h"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.address)}</div></div>
       <div class="dorm-b"><div class="dt"><div class="r1"><span class="nm">就读对象</span></div><div class="nt">${esc(c.who)}</div></div>
       ${c.features.map(f => `<div class="dt"><div class="fc">· ${esc(f)}</div></div>`).join("")}</div></div>`
    ).join("");

    const strengths = (o.strengths || []).map(x => `<li>${esc(x)}</li>`).join("");
    const history = (o.history || []).map(h =>
      `<div class="tl-i"><div class="tl-t">${esc(h.year)}</div><div class="tl-c">${esc(h.event)}</div></div>`
    ).join("");
    const tuitionRows = s.tuition.map(t =>
      `<tr><td><b>${esc(t.type)}</b></td><td>${esc(t.majors)}</td><td style="color:var(--red);font-weight:700">${t.fee} 元/年</td></tr>`
    ).join("");
    const report = s.reportFlow.map(r =>
      `<div class="tl-i"><div class="tl-t">第 ${r.step} 步 · ${esc(r.title)}</div><div class="tl-c"><p style="margin:0 0 5px">${esc(r.desc)}</p><span class="tag gold">提示</span> ${esc(r.tip)}</div></div>`
    ).join("");
    const calendar = s.calendar.map(c =>
      `<tr><td><b>${esc(c.time)}</b></td><td>${esc(c.event)}</td><td>${({ key: tag("重要", "red"), warn: tag("注意", "gold"), normal: tag("常规", "navy") })[c.type || "normal"] || ""}</td></tr>`
    ).join("");
    const routes = s.routes.map(r =>
      `<tr><td><b>${esc(r.from)}</b></td><td>${esc(r.route)}</td><td>${esc(r.time)}</td><td>${esc(r.cost)}</td></tr>`
    ).join("");
    const onlineReportHtml = (() => {
      const o = s.onlineReport || {};
      if (!o.steps) return "";
      const steps = o.steps.map(x =>
        `<div class="tl-i"><div class="tl-t">${esc(x.title)}</div><div class="tl-c"><p style="margin:0 0 5px">${esc(x.desc)}</p><span class="tag gold">提示</span> ${esc(x.tip)}</div></div>`
      ).join("");
      const tips = (o.tips || []).map(t => `<li>${esc(t)}</li>`).join("");
      const prep = (o.prepChecklist || []).length ? `<div style="margin-top:14px"><div style="font-weight:700;color:var(--navy);margin-bottom:8px">📋 线上填报前先备好这些电子材料</div><div class="card"><ul class="lst">${o.prepChecklist.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>` : "";
      const apps = o.apps ? `<div class="note tip" style="margin-top:12px"><span class="ni">📱</span><div>${esc(o.apps)}</div></div>` : "";
      return `<p style="line-height:1.85;margin:0 0 12px">${esc(o.intro || "")}</p><div class="tl">${steps}</div>${prep}${apps}${tips ? `<div class="card" style="margin-top:12px"><ul class="lst">${tips}</ul></div>` : ""}`;
    })();
    const documentsHtml = (() => {
      const d = s.documents || {};
      if (!d.must) return "";
      const grp = (arr) => (arr || []).map(x =>
        `<div class="doc-i"><div class="doc-n">${esc(x.name)}</div><div class="doc-t">${esc(x.note)}</div></div>`
      ).join("");
      return `<p style="line-height:1.85;margin:0 0 12px">${esc(d.intro || "")}</p>
        <div style="font-weight:700;color:var(--navy);margin:4px 0 8px">📌 必须携带</div>
        <div class="grid g2">${grp(d.must)}</div>
        <div style="font-weight:700;color:var(--navy);margin:14px 0 8px">👜 建议 / 按需携带</div>
        <div class="grid g2">${grp(d.recommended)}</div>`;
    })();
    const transportHtml = (() => {
      const t = s.transport || {};
      const card = (key) => {
        const d = t[key]; if (!d) return "";
        const lines = [["🚇 地铁", d.metro], ["🚌 公交", d.bus], ["🚕 打车", d.taxi], ["🚗 自驾", d.drive]].filter(x => x[1]);
        const body = lines.map(x => `<div class="dt"><div class="r1"><span class="nm">${x[0]}</span></div><div class="nt">${esc(x[1])}</div></div>`).join("");
        const tips = (d.tips || []).map(x => `<div class="dt"><div class="fc">· ${esc(x)}</div></div>`).join("");
        return `<div class="dorm-c"><div class="dorm-h"><div class="t">${esc(d.campus)}</div></div><div class="dorm-b">${body}${tips}</div></div>`;
      };
      return `${card("main")}${card("leifeng")}`;
    })();
    const transportExtraHtml = (() => {
      const t = s.transport || {};
      if (!t.around && !(t.safety || []).length) return "";
      const around = t.around ? `
        <div class="grid g2" style="margin-top:14px">
          <div class="dorm-c"><div class="dorm-h"><div class="t">主校区 · 周边生活</div></div><div class="dorm-b"><p style="margin:0;line-height:1.85">${esc(t.around.main).replace(/\n/g, "<br>")}</p></div></div>
          <div class="dorm-c"><div class="dorm-h"><div class="t">雷锋校区 · 周边生活</div></div><div class="dorm-b"><p style="margin:0;line-height:1.85">${esc(t.around.leifeng).replace(/\n/g, "<br>")}</p></div></div>
        </div>` : "";
      const safety = (t.safety || []).length ? `<div class="note warn" style="margin-top:12px"><span class="ni">⚠️</span><div><b style="display:block;margin-bottom:6px">出行安全贴士</b><ul class="lst">${t.safety.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>` : "";
      const interCampus = t.interCampus ? `<div class="dorm-c" style="margin-top:14px"><div class="dorm-h"><div class="t">${esc(t.interCampus.title)}</div></div><div class="dorm-b"><p style="margin:0;line-height:1.85">${esc(t.interCampus.body).replace(/\n/g, "<br>")}</p></div></div>` : "";
      const payment = t.payment ? `<div class="dorm-c" style="margin-top:14px"><div class="dorm-h"><div class="t">${esc(t.payment.title)}</div></div><div class="dorm-b"><ul class="lst">${(t.payment.items || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>` : "";
      const landmarks = (t.landmarks || []).length ? `<div class="tw" style="margin-top:14px"><table class="tb"><thead><tr><th>常用目的地</th><th>主校区（枫林二路）</th><th>雷锋校区</th><th>耗时</th><th>费用</th></tr></thead><tbody>${t.landmarks.map(l => `<tr><td><b>${esc(l.place)}</b></td><td>${esc(l.main)}</td><td>${esc(l.leifeng)}</td><td>${esc(l.time)}</td><td>${esc(l.cost)}</td></tr>`).join("")}</tbody></table></div>` : "";
      return around + interCampus + payment + safety + landmarks;
    })();
    const platforms = (s.platforms || []).map(p =>
      `<div class="res"><div class="rt">${esc(p.name)} ${p.url ? `<a class="rl" href="${esc(p.url)}" target="_blank" rel="noopener">↗ 访问</a>` : ""}</div><div class="rd">${esc(p.use)}</div></div>`
    ).join("");

    return `
    <div class="sec">${secH("学校简介", s.abbr + " · 校训「" + s.slogan + "」")}
      <div class="card"><p style="margin:0;line-height:1.9">${esc(o.intro)}</p></div>
    </div>

    <div class="sec">${secH("校区分布", "大一在雷锋校区，大二起搬主校区")}
      <div class="grid g2">${campusCards}</div>
    </div>

    <div class="sec">${secH("学科实力", "一流专业建设点")}
      <div class="card"><ul class="lst">${strengths}</ul></div>
    </div>

    <div class="sec">${secH("历史沿革", "从 1933 到今天")}
      <div class="tl">${history}</div>
    </div>

    <div class="sec">${secH("学费与住宿费", "单位：元/年")}
      <div class="tw"><table class="tb"><thead><tr><th>类别</th><th>涵盖专业</th><th>学费</th></tr></thead><tbody>${tuitionRows}</tbody></table></div>
      <div class="note warn" style="margin-top:12px"><span class="ni">💡</span><div>住宿费：${esc(s.accommodationFee)}。</div></div>
    </div>

    <div class="sec">${secH("报到流程", "建议提前完成网上预报到")}
      <div class="tl">${report}</div>
    </div>

    <div class="sec">${secH("线上报到准备（预报到）", "正式报到前手机 / 电脑就能完成")}
      ${onlineReportHtml}
    </div>

    <div class="sec">${secH("报到携带证件材料", "装一个文件袋，和录取通知书放一起")}
      ${documentsHtml}
    </div>

    <div class="grid g2">
      <div class="sec" style="margin:0">${secH("校历节点", "")}
        <div class="tw"><table class="tb"><thead><tr><th>时间</th><th>事项</th><th></th></tr></thead><tbody>${calendar}</tbody></table></div>
      </div>
      <div class="sec" style="margin:0">${secH("来校交通（速查）", "")}
        <div class="tw"><table class="tb"><thead><tr><th>出发地</th><th>路线</th><th>耗时</th><th>费用</th></tr></thead><tbody>${routes}</tbody></table></div>
      </div>
    </div>

    <div class="sec">${secH("交通详情", "主校区 · 雷锋校区出行全攻略")}
      <div class="grid g2">${transportHtml}</div>
      ${transportExtraHtml}
      <div class="note tip" style="margin-top:12px"><span class="ni">🚌</span><div>${esc((s.transport || {}).pickup || "")}</div></div>
    </div>

    <div class="sec">${secH("联系我", "本站建立者与维护者，欢迎咨询")}
      ${contactCard(s)}
      <div class="note tip" style="margin-top:12px"><span class="ni">ℹ️</span><div>学校官方招生电话：${esc((s.hotline || []).join(" / "))}；重大事项请以学校官方通知为准。</div></div>
    </div>

    <div class="sec">${secH("常用办公电话", "各部门 / 各学院 · 整理自学校官网")}
      ${officePhones(s)}
    </div>

    <div class="sec">${secH("常用平台与网址", "")}
      <div class="grid g2">${platforms}</div>
    </div>`;
  }

  /* ============================ 专业培养 ============================ */
  const mjCol = { v: "" }, mjKw = { v: "" };
  function majors() {
    const M = D().majors;
    const colleges = M.colleges || [];
    let total = 0; colleges.forEach(c => total += (c.majors || []).length);

    const chips = [`<span class="chip on" data-c="" onclick="Render._mjF('')">全部 ${total}</span>`]
      .concat(colleges.map(c => `<span class="chip" data-c="${esc(c.name)}" onclick="Render._mjF('${esc(c.name)}')">${esc(c.name)} ${c.majors.length}</span>`))
      .join("");

    const html = `
    <div class="sec" style="margin-bottom:14px">${secH("本科专业培养计划", "共 " + colleges.length + " 个学院 · " + total + " 个专业")}
      <div class="flt">
        <div class="flt-r"><span class="flt-l">学院</span>${chips}</div>
        <div class="flt-r"><span class="flt-l">搜索</span><input id="mjSearch" class="fld" style="flex:1;min-width:180px;padding:7px 12px;border:1px solid var(--line);border-radius:8px;outline:none" placeholder="输入专业名 / 关键词，如「会计」「计算机」" oninput="Render._mjK(this.value)"></div>
      </div>
    </div>
    <div id="mjList"></div>`;
    return html;
  }
  // 渲染专业网格（被 filter 调用）
  function mjGrid() {
    const M = D().majors;
    const colleges = M.colleges || [];
    const col = mjCol.v, kw = (mjKw.v || "").trim().toLowerCase();
    let out = "";
    colleges.forEach(c => {
      if (col && c.name !== col) return;
      const ms = (c.majors || []).filter(m =>
        !kw || (m.name + " " + (m.subject || "") + " " + (m.goal || "")).toLowerCase().includes(kw)
      );
      if (!ms.length) return;
      const cards = ms.map(m => `
        <div class="mj" onclick="openMajor('${esc(m.name)}')">
          ${m.level ? `<span class="mj-lv n">${esc(m.level.replace("国家级一流本科专业建设点", "国家级一流").replace("省级一流本科专业建设点", "省级一流"))}</span>` : ""}
          <div class="mj-t"><div class="mj-n">${esc(m.name)}</div></div>
          <div class="mj-m">${tag(m.subject || "")}${tag(m.degree || "")}${tag(m.years || "")}</div>
          <div class="mj-g">${esc((m.goal || "").slice(0, 60))}…</div>
          <div class="mj-f"><span class="fee">${m.tuition} 元/年</span><span>选科：${esc(m.selection || "—")}</span><span class="go">查看培养方案 →</span></div>
        </div>`).join("");
      out += `<div class="sec" style="margin-bottom:18px"><div class="sec-h" style="border:none;margin-bottom:10px;padding-bottom:4px"><h2 style="font-size:16px">${esc(c.name)}</h2><span class="d">${ms.length} 个专业</span></div>
        <div class="grid g3">${cards}</div></div>`;
    });
    if (!out) out = `<div class="empty"><div class="ei">🔍</div>没有匹配的专业，换个关键词试试</div>`;
    const box = document.getElementById("mjList");
    if (box) box.innerHTML = out;
    // 更新学院 chip 选中态
    document.querySelectorAll("#p-majors .chip").forEach(ch => {
      ch.classList.toggle("on", ch.getAttribute("data-c") === (col || ""));
    });
  }
  function _mjF(name) { mjCol.v = name; mjGrid(); }
  function _mjK(v) { mjKw.v = v; mjGrid(); }

  /* ============================ 校园生活 ============================ */
  function campus() {
    const cl = D()["campus-life"];
    const gal = (cl.gallery || []).map(g =>
      `<div class="gal-i"><img src="${esc(g.src)}" alt="${esc(g.title)}" loading="lazy"><div class="gal-c"><div class="t">${esc(g.title)}</div><div class="d">${esc(g.desc)}</div></div></div>`
    ).join("");

    const dormBlock = (d, key) => {
      const types = (d[key].types || []).map(t =>
        `<div class="dt"><div class="r1"><span class="nm">${esc(t.name)}</span><span class="fc">${esc(t.people)} · ${esc(t.layout)}</span></div><div class="fc">${esc(t.facility)}</div><div class="nt">${esc(t.note)}</div></div>`
      ).join("");
      return `<div class="dorm-c"><div class="dorm-h"><div class="t">${esc(d[key].campus)}</div><div class="s">${esc(d[key].highlight)}</div></div><div class="dorm-b">${types}</div></div>`;
    };
    const std = (cl.dorms.standard || []).map(x =>
      `<div class="fac"><span class="fi">${esc(x.icon || "✓")}</span><div><div class="ft">${esc(x.item)}</div><div class="fd">${esc(x.desc)}</div></div></div>`
    ).join("");

    const canteenRows = (cl.canteen.prices || []).map(p =>
      `<tr><td><b>${esc(p.meal)}</b></td><td>${esc(p.items)}</td><td style="color:var(--red);font-weight:700">${esc(p.price)}</td></tr>`
    ).join("");
    const monthly = (cl.canteen.monthly || []).map(m =>
      `<div class="stat"><div class="n" style="font-size:16px">${esc(m.range)}</div><div class="l">${esc(m.level)} · ${esc(m.desc)}</div></div>`
    ).join("");

    const fac = (cl.facilities || []).map(f =>
      `<div class="fac"><span class="fi">${esc(f.icon || "📌")}</span><div><div class="ft">${esc(f.name)}</div><div class="fd">${f.items.map(esc).join("；")}</div></div></div>`
    ).join("");

    const around = (title, arr) => arr.map(b =>
      `<div class="res"><div class="rt">${esc(b.name)} <span class="tag navy">${esc(b.dist || "")}</span></div><div class="rd">${esc(b.desc)}</div></div>`
    ).join("");

    const sch = cl.scholarship;
    const awards = (sch.awards || []).map(a =>
      `<div class="dt"><div class="r1"><span class="nm">${esc(a.name)}</span><span class="fc" style="color:var(--red);font-weight:700">${esc(a.amount)}</span></div><div class="fc">面向：${esc(a.who)}</div><div class="nt">${esc(a.note)}</div></div>`
    ).join("");
    const aid = (sch.aid || []).map(a => `<li><b>${esc(a.name)}：</b>${esc(a.desc)}</li>`).join("");

    const tr = cl.transfer;
    const clubs = (cl.activities.clubs || []).map(c =>
      `<div class="res"><div class="rt">${esc(c.type)}</div><div class="rd">${c.list.map(esc).join("、")}</div></div>`
    ).join("");
    const events = (cl.activities.events || []).map(e =>
      `<span class="tag gold" style="margin:0 6px 6px 0;display:inline-block">${esc(e.name)} · ${esc(e.desc)}</span>`
    ).join("");
    const clubLinks = (cl.activities.clubLinks || []).map(l =>
      `<a href="${esc(l.url)}" target="_blank" rel="noopener" style="display:inline-block;margin:0 8px 6px 0;color:var(--blue,#2b6cb0)">${esc(l.name)} ↗</a>`
    ).join("");
    const clubProcess = (cl.activities.clubProcess || []).map(x => `<li>${esc(x)}</li>`).join("");

    return `
    <div class="sec">${secH("校园风光", "两个校区，各有味道")}
      <div class="gal">${gal}</div>
    </div>

    <div class="sec">${secH("宿舍条件", cl.dorms.intro)}
      <div class="grid g2">${dormBlock(cl.dorms, "leifeng")}${dormBlock(cl.dorms, "main")}</div>
      <div class="grid g3" style="margin-top:14px">${std}</div>
      <div class="note tip" style="margin-top:12px"><span class="ni">📌</span>
        <div><b>规定：</b>${cl.dorms.rules.map(esc).join("；")}<br><b>贴士：</b>${cl.dorms.tips.map(esc).join("；")}</div></div>
      <button onclick="go('dorm')" style="margin-top:12px;background:var(--green,#2e8d6b);color:#fff;border:none;padding:9px 16px;border-radius:10px;font-size:14px;cursor:pointer;font-family:inherit">🛏️ 完整宿舍攻略（床品尺寸 · 好物清单 · 避雷避坑）→</button>
    </div>

    <div class="sec">${secH("食堂与生活费", cl.canteen.intro)}
      <div class="grid g2">
        <div class="tw"><table class="tb"><thead><tr><th>餐次</th><th>内容</th><th>参考价</th></tr></thead><tbody>${canteenRows}</tbody></table></div>
        <div style="display:flex;flex-direction:column;gap:10px">${monthly}<div class="note warn" style="margin:0"><span class="ni">🍜</span><div>推荐：${cl.canteen.recommend.map(esc).join("；")}<br>${cl.canteen.tips.map(esc).join("；")}</div></div></div>
      </div>
    </div>

    <div class="sec">${secH("校园设施", "")}
      <div class="grid g2">${fac}</div>
    </div>

    <div class="grid g3">
      <div class="sec" style="margin:0">${secH("周边商圈", "")}<div class="grid" style="gap:8px">${around("商圈", cl.surroundings.business)}</div></div>
      <div class="sec" style="margin:0">${secH("景点", "")}<div class="grid" style="gap:8px">${around("景点", cl.surroundings.scenery)}</div></div>
      <div class="sec" style="margin:0">${secH("医院", "")}<div class="grid" style="gap:8px">${around("医院", cl.surroundings.hospital)}</div></div>
    </div>

    <div class="sec">${secH("奖学金与资助", sch.system)}
      <div class="dorm-c" style="margin-bottom:14px"><div class="dorm-h"><div class="t">奖助学金</div></div><div class="dorm-b">${awards}</div></div>
      <div class="card"><ul class="lst">${aid}</ul></div>
    </div>

    <div class="sec">${secH("转专业政策", tr.intro)}
      <div class="card">
        <p style="margin:0 0 8px"><b>申请时间：</b>${esc(tr.time)}</p>
        <p style="margin:0 0 6px"><b>条件：</b></p><ul class="lst">${tr.conditions.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <p style="margin:10px 0 6px"><b>考核方式：</b></p><ul class="lst">${tr.exam.map(e => `<li><b>${esc(e.type)}：</b>${esc(e.way)} — ${esc(e.content)}</li>`).join("")}</ul>
        <p style="margin:10px 0 6px"><b>限制：</b></p><ul class="lst">${tr.restrictions.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="note ok" style="margin-top:10px"><span class="ni">✅</span><div>${esc(tr.advice)}</div></div>
      </div>
    </div>

    <div class="sec">${secH("社团与活动", cl.activities.honor)}
      <div class="card" style="margin-bottom:12px">${events}</div>
      ${cl.activities.clubsIntro ? `<div class="card" style="margin-bottom:12px"><p style="margin:0 0 6px"><b>校学社联</b></p><p style="margin:0;line-height:1.85">${esc(cl.activities.clubsIntro)}</p></div>` : ""}
      ${cl.activities.clubRecruit ? `<div class="note ok" style="margin-bottom:12px"><span class="ni">🎯</span><div><b>百团大绽·社团招新：</b>${esc(cl.activities.clubRecruit)}</div></div>` : ""}
      <div class="grid g2">${clubs}</div>
      ${clubLinks ? `<div class="card" style="margin-top:12px"><p style="margin:0 0 6px"><b>官方渠道直达</b></p><div>${clubLinks}</div></div>` : ""}
      ${clubProcess ? `<div class="card" style="margin-top:12px"><p style="margin:0 0 6px"><b>📜 想自己成立社团？流程如下</b></p><ul class="lst">${clubProcess}</ul></div>` : ""}
      <div class="note tip" style="margin-top:12px"><span class="ni">💡</span><div>${esc(cl.activities.advice)}</div></div>
    </div>`;
  }

  /* ============================ 入学清单 ============================ */
  function checklist() {
    const ck = D().checklist;
    const groups = ck.groups.map((g, gi) => {
      const items = g.items.map((it, ii) => {
        const lv = LV[it.level] || "#7b7b8b";
        return `<div class="ck-i" data-k="${esc(g.name + "/" + it.name)}" onclick="App.toggleCk(this)">
          <div class="ck-box">✓</div>
          <div class="ck-ct"><div class="cn">${esc(it.name)} <span class="lvt" style="background:${lv}">${LVN[it.level] || ""}</span></div><div class="cd">${esc(it.desc)}</div></div>
        </div>`;
      }).join("");
      return `<div class="ck-g"><div class="ck-gh"><span class="gi">${esc(g.icon || "•")}</span><span class="gn">${esc(g.name)}</span><span class="gc">${g.items.length} 项</span></div>
        <div class="ck-gn">${esc(g.note || "")}</div><div class="ck-b">${items}</div></div>`;
    }).join("");
    const tl = (ck.timeline || []).map(t =>
      `<div class="tl-i"><div class="tl-t">${esc(t.when)}</div><div class="tl-c"><ul class="lst">${t.todo.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>`
    ).join("");

    return `
    <div class="sec" style="margin-bottom:14px">${secH("入学准备清单", ck.intro)}
      <div class="ck-bar">
        <div class="ck-pg"><div class="lb"><span>已准备</span><b id="ckNum">0 / 0</b></div><div class="ck-bg"><div class="ck-fl" id="ckBar"></div></div></div>
        <button class="btn sm gh" onclick="App.resetCk()">重置勾选</button>
        <button class="btn sm" onclick="App.exportCk()">导出进度</button>
        <button class="btn sm" onclick="App.importCk()">导入进度</button>
      </div>
    </div>
    <div id="ckGroups">${groups}</div>
    <div class="sec" style="margin-top:24px">${secH("准备时间轴", "照着做不慌")}
      <div class="tl">${tl}</div>
    </div>`;
  }

  /* ============================ 军训指南 ============================ */
  function training() {
    const tr = D().training;
    const basic = (tr.basic || []).map(b =>
      `<div class="stat"><div class="n" style="font-size:18px">${esc(b.value)}</div><div class="l">${esc(b.label)} · ${esc(b.note || "")}</div></div>`
    ).join("");
    const phases = (tr.schedule || []).map(s =>
      `<div class="phase"><div class="ph">${esc(s.phase)}</div><div class="pt">${esc(s.title)}</div>
       <ul class="lst">${s.content.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
       <div class="note warn" style="margin-top:8px"><span class="ni">💡</span><div>${esc(s.tip)}</div></div></div>`
    ).join("");
    const gear = (tr.gear || []).map(g =>
      `<div class="gr"><div class="gr-h"><span class="gt">${esc(g.group)}</span><span class="tag ${g.priority === "极高" ? "red" : g.priority === "高" ? "gold" : "navy"}">优先级 ${esc(g.priority)}</span></div>
       <div class="gr-b">${g.items.map(i => `<div class="gi-i"><div class="n">${esc(i.name)} <span class="s">${esc(i.spec || "")}</span></div><div class="w">${esc(i.why)}</div></div>`).join("")}</div></div>`
    ).join("");
    const rules = (tr.rules || []).map(r =>
      `<div class="acc"><div class="acc-h" onclick="this.parentElement.classList.toggle('on')"><span class="ai">📌</span><span class="at">${esc(r.type)}</span><span class="ax">▾</span></div><div class="acc-b">${r.items.map(x => `<div class="pol"><div class="ps">${esc(x)}</div></div>`).join("")}</div></div>`
    ).join("");
    const faq = (tr.faq || []).map(f =>
      `<div class="acc"><div class="acc-h" onclick="this.parentElement.classList.toggle('on')"><span class="ai">❓</span><span class="at">${esc(f.q)}</span><span class="ax">▾</span></div><div class="acc-b"><div class="pol"><div class="ps">${esc(f.a)}</div></div></div></div>`
    ).join("");
    const surv = (tr.survival || []).map(s => `<div class="surv">${esc(s)}</div>`).join("");

    return `
    <div class="note tip" style="margin-bottom:16px"><span class="ni">ℹ️</span><div>${esc(tr.intro)}</div></div>
    <div class="sec">${secH("基本安排", "")}<div class="grid g3">${basic}</div></div>
    <div class="sec">${secH("训练进度", "四个阶段")}<div class="grid g2">${phases}</div></div>
    <div class="sec">${secH("装备清单", "按优先级准备")}<div class="grid g2">${gear}</div></div>
    <div class="sec">${secH("纪律与请假", "")}<div class="grid g2">${rules}</div></div>
    <div class="sec">${secH("常见问题", "")}<div class="grid g2">${faq}</div></div>
    <div class="sec">${secH("军训生存法则", "")}<div class="grid g2">${surv}</div></div>`;
  }

  /* ============================ 电脑选购 ============================ */
  function laptop() {
    const lp = D().laptop;
    const pr = (lp.principles || []).map(p =>
      `<div class="gr"><div class="gr-h"><span class="gt">${p.rank}. ${esc(p.name)}</span></div><div class="gr-b"><div class="gi-i"><div class="w">${esc(p.desc)}</div></div></div></div>`
    ).join("");
    const warn = (lp.warnings || []).map(w =>
      `<div class="gr"><div class="gr-h"><span class="ai">${esc(w.icon || "⚠️")}</span><span class="gt">${esc(w.title)}</span></div><div class="gr-b"><div class="gi-i"><div class="w">${esc(w.desc)}</div></div></div></div>`
    ).join("");
    const by = (lp.byMajor || []).map(b => {
      const rows = [["CPU", b.cpu], ["内存", b.ram], ["硬盘", b.disk], ["显卡", b.gpu], ["屏幕", b.screen], ["重量", b.weight], ["预算", b.budget]]
        .map(([k, v]) => `<tr><td style="white-space:nowrap"><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("");
      return `<div class="card" style="margin-bottom:12px">
        <div class="sec-h" style="border:none;margin-bottom:8px;padding:0"><h2 style="font-size:16px">${esc(b.group)}</h2><span class="d">${b.majors.length} 个专业</span></div>
        <div class="tag gold" style="margin-bottom:8px">适用：${b.majors.map(esc).join("、")}</div>
        <p style="margin:4px 0 8px;color:var(--tx2)"><b>需求：</b>${esc(b.need)}</p>
        <div class="tw" style="margin-bottom:8px"><table class="tb"><tbody>${rows}</tbody></table></div>
        <div class="note ok" style="margin:0"><span class="ni">✅</span><div>${esc(b.note)}</div></div>
      </div>`;
    }).join("");
    const timing = (lp.buyTiming || []).map(t =>
      `<tr><td><b>${esc(t.time)}</b></td><td>${esc(t.reason)}</td><td>${tag(t.score, t.score === "推荐" ? "green" : t.score === "老手推荐" ? "purple" : "navy")}</td></tr>`
    ).join("");
    const cl = (lp.checklist || []).map(x => `<li>${esc(x)}</li>`).join("");
    const faq = (lp.faq || []).map(f =>
      `<div class="acc"><div class="acc-h" onclick="this.parentElement.classList.toggle('on')"><span class="ai">❓</span><span class="at">${esc(f.q)}</span><span class="ax">▾</span></div><div class="acc-b"><div class="pol"><div class="ps">${esc(f.a)}</div></div></div></div>`
    ).join("");

    return `
    <div class="note tip" style="margin-bottom:16px"><span class="ni">💻</span><div>${esc(lp.intro)}</div></div>
    <div class="sec">${secH("选购五大原则", "")}<div class="grid g3">${pr}</div></div>
    <div class="sec">${secH("避坑要点", "")}<div class="grid g3">${warn}</div></div>
    <div class="sec">${secH("按专业配电脑", "直接看这一节")}${by}</div>
    <div class="grid g2">
      <div class="sec" style="margin:0">${secH("购买时机", "")}<div class="tw"><table class="tb"><thead><tr><th>时间</th><th>说明</th><th></th></tr></thead><tbody>${timing}</tbody></table></div></div>
      <div class="sec" style="margin:0">${secH("验机清单", "")}<div class="card"><ul class="lst">${cl}</ul></div></div>
    </div>
    <div class="sec">${secH("常见问题", "")}<div class="grid g2">${faq}</div></div>
    <div class="note warn" style="margin-top:8px"><span class="ni">📝</span><div>${esc(lp.source || "")}</div></div>`;
  }

  /* ============================ 政策文件 ============================ */
  function policies() {
    const P = D().policies;
    const cats = (P.categories || []).map(c => {
      const items = c.items.map(it =>
        `<div class="pol"><div class="pt">${esc(it.title)} ${it.tags ? it.tags.slice(0, 4).map(t => tag(t, "navy")).join("") : ""}</div>
         <div class="ps">${esc(it.summary)}</div>
         <ul class="lst">${(it.points || []).map(p => `<li>${esc(p)}</li>`).join("")}</ul>
         ${it.link ? `<a class="lk" href="${esc(it.link)}" target="_blank" rel="noopener">查看官方文件 ↗</a>` : ""}
         <div style="font-size:11px;color:var(--tx3);margin-top:5px">来源：${esc(it.source || "综合整理")}</div>
        </div>`
      ).join("");
      return `<div class="sec" id="pol-${esc(c.id)}">${secH(c.name + " " + (c.icon || ""), "")}<div class="card">${items}</div></div>`;
    }).join("");
    const nav = (P.categories || []).map(c =>
      `<span class="chip" onclick="document.getElementById('pol-${esc(c.id)}').scrollIntoView({behavior:'smooth'})">${esc(c.icon || "")} ${esc(c.name)}</span>`
    ).join("");

    return `
    <div class="note warn" style="margin-bottom:14px"><span class="ni">⚠️</span><div>${esc(P.note || "要点为新生可读版摘要，金额比例以学校最新通知与官方文件为准。")}</div></div>
    <div class="flt" style="margin-bottom:16px"><div class="flt-r"><span class="flt-l">分类</span>${nav}</div></div>
    ${cats}`;
  }

  /* ============================ 学习资源 ============================ */
  function resources() {
    const R = D().resources;
    const groups = (R.groups || []).map(g => {
      const items = g.items.map(it =>
        `<div class="res"><div class="rt">${esc(it.title)} ${it.tag ? `<span class="tag navy">${esc(it.tag)}</span>` : ""} ${it.url ? `<a class="rl" href="${esc(it.url)}" target="_blank" rel="noopener">↗</a>` : ""}</div><div class="rd">${esc(it.desc)}</div></div>`
      ).join("");
      return `<div class="sec">${secH(g.icon + " " + g.name, "")}<div class="grid g2">${items}</div></div>`;
    }).join("");
    return `<div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>${esc(R.note || "")}</div></div>${groups}`;
  }

  /* ============================ 工程软件专业资料 ============================ */
  function engsoft() {
    const S = {
      title: "工程软件专业新生资料",
      intro: "工程软件是「工程 + 软件」的交叉方向：既要懂工程领域的建模、仿真与流程，又要能用代码、工具和系统思维把工程问题变成可运行的软件。这个板块为湖财工程软件方向的萌新整理了一套「学什么、用什么、怎么学、往哪走」的私房指南。",
      abilities: [
        { icon: "💻", name: "编程开发", desc: "Python / C++ / Java，能把需求写成代码" },
        { icon: "📐", name: "工程建模", desc: "CAD、BIM、三维建模，把工程对象数字化" },
        { icon: "🔬", name: "仿真分析", desc: "有限元、数值计算，验证设计方案" },
        { icon: "🧩", name: "软件工程", desc: "需求、架构、版本控制、团队协作" }
      ],
      roadmap: [
        { year: "大一", theme: "打底子", items: ["学好高数、线代、程序设计基础", "养成英文文档阅读习惯", "练熟一门语言（推荐 Python 入门，C++ 打基础）", "尝试完成 1-2 个小项目，理解「从需求到代码」"] },
        { year: "大二", theme: "进专业", items: ["数据结构、数据库、计算机图形学", "接触 AutoCAD / SolidWorks / Revit 等建模工具", "加入实验室或竞赛队伍", "尝试用 Git 管理代码"] },
        { year: "大三", theme: "做项目", items: ["深入学习数值方法、有限元、BIM 开发", "参与一个完整工程软件项目或开源贡献", "准备实习或科研经历", "明确考研 / 就业方向"] },
        { year: "大四", theme: "出成果", items: ["毕业设计（工程软件方向作品最佳）", "整理作品集、刷面试题", "投递工业软件 / BIM / 互联网岗位", "完成从学生到工程师的过渡"] }
      ],
      tools: [
        { group: "编程开发", items: ["VS Code", "JetBrains 全家桶", "Git / GitHub", "Postman", "Docker"] },
        { group: "工程建模", items: ["AutoCAD", "SolidWorks", "Revit", "SketchUp", "Blender"] },
        { group: "仿真与计算", items: ["MATLAB", "ANSYS", "Abaqus", "COMSOL", "Python + NumPy/SciPy"] },
        { group: "协作与文档", items: ["飞书 / 钉钉", "Notion / 语雀", "Markdown", "Draw.io", "XMind"] }
      ],
      certs: [
        { name: "全国计算机等级考试（二级/三级）", note: "基础门槛，建议大二前拿下" },
        { name: "软件设计师（中级）", note: "软考中级，对软件开发岗位有帮助" },
        { name: "BIM 相关证书", note: "如 Revit 认证、BIM 等级考试，建筑/土木方向加分" },
        { name: "CAD / SolidWorks 认证", note: "机械/工业设计方向的敲门砖" },
        { name: "蓝桥杯 / 数学建模竞赛", note: "简历亮点，锻炼实战能力" }
      ],
      jobs: [
        { name: "工业软件研发", desc: "CAD/CAM/CAE 平台、国产工业软件开发，门槛高、前景好" },
        { name: "BIM 工程师", desc: "建筑信息模型建模、二次开发、协同管理" },
        { name: "仿真分析工程师", desc: "用 ANSYS/Abaqus 等做结构/流体/热分析" },
        { name: "游戏/图形开发", desc: "Unity、Unreal、图形渲染、数字孪生" },
        { name: "互联网后端 / 数据开发", desc: "工程软件背景转软件开发也很常见" }
      ],
      resources: [
        { title: "中国大学 MOOC", url: "https://www.icourse163.org/", desc: "程序设计、数据结构、计算机图形学等慕课" },
        { title: "B 站大学", url: "https://www.bilibili.com/", desc: "搜「Python」「SolidWorks」「Revit」「ANSYS」找实操视频" },
        { title: "GitHub", url: "https://github.com/", desc: "开源项目、代码管理、建立个人作品集" },
        { title: "CSDN / 掘金 / 知乎", url: "https://www.csdn.net/", desc: "查报错、看工程软件行业经验" },
        { title: "《代码整洁之道》", url: "", desc: "程序员必读，培养代码品味" },
        { title: "《人月神话》", url: "", desc: "软件工程经典，理解团队协作" }
      ],
      tips: [
        "不要只学软件操作，要理解背后的工程原理。",
        "早点准备一个 GitHub 账号，把课程作业和小项目传上去。",
        "工程软件方向英语很重要，很多工具文档只有英文。",
        "多参加一个竞赛或项目，比刷很多证书更有说服力。",
        "不要局限在课本，工业软件行业变化很快，保持好奇心。"
      ],
      pc: {
        cpu: "Intel i5 / AMD R5 起步，做仿真建议 i7/R7",
        ram: "16GB 起步，32GB 更舒服",
        disk: "512GB SSD 起步，工程文件很大",
        gpu: "建模/渲染选独显；纯开发核显也能用",
        screen: "14-16 英寸，2K 屏看图纸更爽",
        os: "Windows 为主；开发可装 WSL 或双系统"
      }
    };

    const abilities = S.abilities.map(a =>
      `<div class="stat"><div class="n" style="font-size:22px">${a.icon}</div><div class="l" style="font-weight:700">${esc(a.name)}</div><div class="l" style="color:var(--tx2);font-size:12px">${esc(a.desc)}</div></div>`
    ).join("");

    const roadmap = S.roadmap.map(r =>
      `<div class="phase"><div class="ph">${esc(r.year)}</div><div class="pt">${esc(r.theme)}</div><ul class="lst">${r.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`
    ).join("");

    const tools = S.tools.map(g =>
      `<div class="card" style="margin-bottom:12px"><div class="sec-h" style="border:none;margin-bottom:8px;padding:0"><h2 style="font-size:15px">${esc(g.group)}</h2></div><div class="crs">${g.items.map(i => `<span>${esc(i)}</span>`).join("")}</div></div>`
    ).join("");

    const certs = S.certs.map(c =>
      `<div class="dt"><div class="r1"><span class="nm">${esc(c.name)}</span></div><div class="nt">${esc(c.note)}</div></div>`
    ).join("");

    const jobs = S.jobs.map(j =>
      `<div class="gr"><div class="gr-h"><span class="gt">${esc(j.name)}</span></div><div class="gr-b"><div class="gi-i"><div class="w">${esc(j.desc)}</div></div></div></div>`
    ).join("");

    const resources = S.resources.map(r =>
      `<div class="res"><div class="rt">${esc(r.title)} ${r.url ? `<a class="rl" href="${esc(r.url)}" target="_blank" rel="noopener">↗</a>` : ""}</div><div class="rd">${esc(r.desc)}</div></div>`
    ).join("");

    const tips = S.tips.map(t => `<li>${esc(t)}</li>`).join("");

    return `
    <div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>${esc(S.intro)}</div></div>

    <div class="sec">${secH("核心能力图谱", "工程软件人需要点亮哪些技能")}
      <div class="grid g4">${abilities}</div>
    </div>

    <div class="sec">${secH("大学四年学习路线", "按年级打卡")}
      <div class="grid g2">${roadmap}</div>
    </div>

    <div class="sec">${secH("常用软件工具", "按场景分类，按需安装")}
      <div class="grid g2">${tools}</div>
    </div>

    <div class="grid g2">
      <div class="sec" style="margin:0">${secH("考证与竞赛", "给简历加分的方向")}
        <div class="dorm-c"><div class="dorm-h"><div class="t">推荐</div></div><div class="dorm-b">${certs}</div></div>
      </div>
      <div class="sec" style="margin:0">${secH("电脑配置建议", "工程软件专业版")}
        <div class="card"><div class="tw"><table class="tb"><tbody>
          <tr><td style="white-space:nowrap"><b>CPU</b></td><td>${esc(S.pc.cpu)}</td></tr>
          <tr><td style="white-space:nowrap"><b>内存</b></td><td>${esc(S.pc.ram)}</td></tr>
          <tr><td style="white-space:nowrap"><b>硬盘</b></td><td>${esc(S.pc.disk)}</td></tr>
          <tr><td style="white-space:nowrap"><b>显卡</b></td><td>${esc(S.pc.gpu)}</td></tr>
          <tr><td style="white-space:nowrap"><b>屏幕</b></td><td>${esc(S.pc.screen)}</td></tr>
          <tr><td style="white-space:nowrap"><b>系统</b></td><td>${esc(S.pc.os)}</td></tr>
        </tbody></table></div></div>
      </div>
    </div>

    <div class="sec">${secH("就业方向", "工程软件毕业能干啥")}
      <div class="grid g2">${jobs}</div>
    </div>

    <div class="sec">${secH("学习资源推荐", "网站 · 课程 · 书籍")}
      <div class="grid g2">${resources}</div>
    </div>

    <div class="sec">${secH("给大一的 5 条建议", "私心版")}
      <div class="card"><ul class="lst">${tips}</ul></div>
    </div>`;
  }

  /* ============================ 选课攻略 ============================ */
  function courseSelection() {
    const C = D()['course-selection'];
    if (!C) return "";
    const sys = C.system;
    const sysCard = `<div class="card" style="border-left:4px solid var(--gold)">
      <div class="ci" style="font-size:15px;font-weight:700;margin-bottom:8px">🖥️ 选课系统：${esc(sys.name)}</div>
      <div class="grid g2" style="gap:10px 24px">
        <div>🌐 网址：<a href="${esc(sys.url)}" target="_blank" rel="noopener">${esc(sys.url)}</a></div>
        <div>👤 登录账号：<b>${esc(sys.account)}</b></div>
        <div>🔑 初始密码：<b>${esc(sys.initPassword)}</b></div>
        <div>🧭 推荐浏览器：<b>${esc(sys.browser)}</b></div>
      </div>
      <div style="margin-top:10px;color:var(--tx3);font-size:13px">系统功能：${(sys.functions||[]).map(f=>`<span class="tag" style="margin:2px 4px 2px 0;display:inline-block">${esc(f)}</span>`).join("")}</div>
    </div>`;

    const rounds = (C.rounds||[]).map(r=>
      `<div class="card" style="border-left:4px solid var(--navy)">
        <div style="font-weight:700;color:var(--navy)">${esc(r.name)}</div>
        <div style="font-size:13px;color:var(--tx3);margin:2px 0 6px">⏰ ${esc(r.time)}</div>
        <div>${esc(r.content)}</div>
        <div class="note tip" style="margin-top:8px"><span class="ni">💡</span><div>${esc(r.tip)}</div></div>
      </div>`).join("");

    const types = (C.courseTypes||[]).map(t=>
      `<div class="card">
        <div style="font-weight:700">${esc(t.name)}</div>
        <div class="tag" style="margin:4px 0">${esc(t.credit)}</div>
        <div style="font-size:13px;color:var(--tx3)">${esc(t.desc)}</div>
      </div>`).join("");

    const ci = C.creditInfo;
    const credit = `<div class="grid g3">
      <div class="card"><div style="font-weight:700;margin-bottom:4px">📊 总学分</div><div style="font-size:13px;color:var(--tx3)">${esc(ci.total)}</div></div>
      <div class="card"><div style="font-weight:700;margin-bottom:4px">🎯 绩点 GPA</div><div style="font-size:13px;color:var(--tx3)">${esc(ci.gpa)}</div></div>
      <div class="card"><div style="font-weight:700;margin-bottom:4px">⚠️ 红线</div><div style="font-size:13px;color:var(--tx3)">${esc(ci.rule)}</div></div>
    </div>`;

    const tips = (C.tips||[]).map(t=>`<li>${esc(t)}</li>`).join("");
    const avoid = (C.avoid||[]).map(a=>
      `<div class="card" style="border-left:4px solid #c0392b">
        <div style="font-weight:700;color:#c0392b">⛔ ${esc(a.name)}</div>
        <div style="font-size:13px;color:var(--tx3);margin-top:4px">${esc(a.desc)}</div>
      </div>`).join("");

    const tl = (C.timeline||[]).map(t=>
      `<div class="tl-i"><div class="tl-dot"></div><div class="tl-c"><div class="tl-t">${esc(t.when)}</div><div class="tl-d">${t.todo.map(x=>`<div>· ${esc(x)}</div>`).join("")}</div></div></div>`).join("");

    const fq = (C.faq||[]).map(f=>
      `<div class="acc"><div class="acc-h" onclick="this.parentElement.classList.toggle('on')"><span class="ai">❓</span><span class="at">${esc(f.q)}</span><span class="ax">▾</span></div>
       <div class="acc-b"><div class="pol"><div class="ps">${esc(f.a)}</div></div></div></div>`).join("");

    const pe = C.publicElective;
    const peSec = pe ? `
    <div class="sec">${secH("公选课怎么选（红黑榜）", "水课和神仙课，差别巨大")}
      <div class="note tip"><span class="ni">📌</span><div>${esc(pe.intro)}</div></div>
      <div class="grid g2">
        <div class="card" style="border-left:4px solid #27ae60">
          <div style="font-weight:700;color:#27ae60;margin-bottom:6px">✅ 红榜特征（值得选）</div>
          ${(pe.greenFlags||[]).map(x=>`<div style="margin:5px 0">· ${esc(x)}</div>`).join("")}
        </div>
        <div class="card" style="border-left:4px solid #c0392b">
          <div style="font-weight:700;color:#c0392b;margin-bottom:6px">⛔ 黑榜特征（慎选）</div>
          ${(pe.redFlags||[]).map(x=>`<div style="margin:5px 0">· ${esc(x)}</div>`).join("")}
        </div>
      </div>
      <div style="margin-top:14px"><div style="font-weight:700;margin-bottom:8px">🧭 公选课常见方向</div>
        <div class="grid g2">${(pe.directions||[]).map(d=>`<div class="card"><div style="font-weight:700">${esc(d.name)}</div><div style="font-size:13px;color:var(--tx3);margin-top:4px">${esc(d.desc)}</div></div>`).join("")}</div>
      </div>
      <div class="note" style="margin-top:10px"><span class="ni">ℹ️</span><div>${esc(pe.note)}</div></div>
    </div>` : "";

    const fd = C.foundation;
    const stars = n => { n = Math.max(0, Math.min(5, n|0)); return "★".repeat(n) + "☆".repeat(5 - n); };
    const fdSec = fd ? `
    <div class="sec">${secH("大学基础课难度地图", "各专业大一都要面对的通修课")}
      <div class="note tip"><span class="ni">📌</span><div>${esc(fd.intro)}</div></div>
      <div class="grid g2">
        ${(fd.courses||[]).map(c=>`<div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <div style="font-weight:700">${esc(c.name)}</div>
            <div style="color:var(--gold);font-size:14px;letter-spacing:1px;white-space:nowrap">${stars(c.level)}</div>
          </div>
          <div class="tag" style="margin:5px 0">${esc(c.scope)}</div>
          <div style="font-size:13px;color:var(--tx3)">💡 ${esc(c.tip)}</div>
        </div>`).join("")}
      </div>
      <div class="note" style="margin-top:10px"><span class="ni">🔗</span><div>想看<b>自己专业</b>的核心课与学习难度提示？去「专业培养」页点开你的专业即可查看。</div></div>
    </div>` : "";

    const mt = C.majorTip;
    const mtSec = mt ? `
    <div class="sec">${secH("工程软件专业选课贴士", "你的专业，多留点心")}
      <div class="note tip"><span class="ni">🎯</span><div>${esc(mt.intro)}</div></div>
      <div class="card"><ul class="lst">${(mt.tips || []).map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>
      <div class="mt-grid">
        <div class="card">
          <div class="mt-h">📚 推荐书单</div>
          <div class="mt-books">${(mt.books||[]).map(b=>`<div class="mt-book"><div class="mt-bn">${esc(b.name)}</div><div class="mt-bw">${esc(b.why)}</div></div>`).join("")}</div>
        </div>
        <div class="card">
          <div class="mt-h">🗺️ 入门路线</div>
          <div class="mt-route">${(mt.route||[]).map(r=>`<div class="mt-step"><span class="mt-sn">${esc(r.step)}</span><span class="mt-sw">${esc(r.what)}</span></div>`).join("")}</div>
        </div>
      </div>
      <div class="note tip" style="margin-top:14px"><span class="ni">🎓</span><div>${esc(mt.teachers||"")}</div></div>
    </div>` : "";

    return `
    <div class="sec">${secH("选课攻略", "大学第一场硬仗 · 看完不慌")}
      <div class="note tip"><span class="ni">📌</span><div>${esc(C.intro)}</div></div>
    </div>

    <div class="sec">${secH("选课系统与登录", "开学第一周就要用")}
      ${sysCard}
    </div>

    <div class="sec">${secH("选课轮次", "三轮走完，课表成型")}
      <div class="grid g3">${rounds}</div>
    </div>

    <div class="sec">${secH("课程类型与学分构成", "知道每门课是什么分量")}
      <div class="grid g2">${types}</div>
      <div style="margin-top:14px">${credit}</div>
    </div>

    ${peSec}

    <div class="sec">${secH("选课技巧", "学长学姐踩过的坑都在这")}
      <div class="card"><ul class="lst">${tips}</ul></div>
    </div>

    <div class="sec">${secH("常见避坑", "这些雷别踩")}
      <div class="grid g2">${avoid}</div>
    </div>

    ${fdSec}

    ${mtSec}

    <div class="sec">${secH("选课准备时间轴", "按节奏来就不乱")}
      <div class="tl">${tl}</div>
    </div>

    <div class="sec">${secH("选课问答", "新生最常问")}
      <div class="card" style="box-shadow:none">${fq}</div>
    </div>

    <div class="note" style="margin-top:8px"><span class="ni">ℹ️</span><div>以上为通用经验与学校公开信息整理，具体选课时间、轮次、课程清单以教务处（教务系统）当期通知为准。</div></div>`;
  }

  /* ============================ FAQ ============================ */
  function faq() {
    const F = D().faq;
    const cats = (F.categories || []).map(c => {
      const items = c.items.map(it =>
        `<div class="acc"><div class="acc-h" onclick="this.parentElement.classList.toggle('on')"><span class="ai">${esc(c.icon || "❓")}</span><span class="at">${esc(it.q)}</span>${it.tags ? `<span class="ac">${esc(it.tags[0] || "")}</span>` : ""}<span class="ax">▾</span></div>
         <div class="acc-b"><div class="pol"><div class="ps">${esc(it.a)}</div></div></div></div>`
      ).join("");
      return `<div class="sec">${secH(c.icon + " " + c.name, "")}<div class="card" style="box-shadow:none">${items}</div></div>`;
    }).join("");
    return cats;
  }

  /* ====================== 专业详情弹窗（全局） ====================== */
  function findMajor(name) {
    const M = D().majors;
    for (const c of (M.colleges || [])) {
      const m = (c.majors || []).find(x => x.name === name);
      if (m) return { c, m };
    }
    return null;
  }
  function majorHTML(name) {
    const f = findMajor(name);
    if (!f) return null;
    const { c, m } = f;
    const courses = (m.coreCourses || []).map(x => `<span>${esc(x)}</span>`).join("");
    const careers = (m.careers || []).map(x => `<li>${esc(x)}</li>`).join("");
    const certs = (m.certs || []).map(x => `<span>${esc(x)}</span>`).join("");
    const head = `<div class="mhead"><h3>${esc(m.name)}</h3>
      <div class="ms"><span>${esc(c.name)}</span><span>专业代码 ${esc(m.code || "—")}</span><span>${esc(m.degree)}</span><span>${esc(m.years)}</span>${m.level ? `<span style="color:var(--gold-l)">${esc(m.level)}</span>` : ""}</div>
      <button class="mclose" onclick="closeModal()">✕</button></div>`;
    const body = `<div class="mbody">
      <div class="mrow"><h4>基本信息</h4><p>
        ${tag("门类：" + (m.subject || "—"), "navy")} ${tag("学费：" + m.tuition + " 元/年", "red")} ${tag("选科：" + (m.selection || "—"))}
        <br><span style="color:var(--tx3)">来源：${esc(m.source || "官网")}</span></p></div>
      <div class="mrow"><h4>培养目标</h4><p>${esc(m.goal || "")}</p></div>
      <div class="mrow"><h4>核心课程</h4><div class="crs">${courses}</div></div>
      <div class="mrow"><h4>就业方向</h4><ul class="lst">${careers}</ul></div>
      <div class="mrow"><h4>建议考取证书</h4><div class="crs">${certs || "<span style='color:var(--tx3)'>暂未整理</span>"}</div></div>
      <div class="mrow"><h4>考研 / 升学</h4><p>${esc(m.postgrad || "暂无特别说明")}</p></div>
      <div class="mrow"><h4>学习难度提示</h4><p>${esc(m.difficulty || "—")}</p></div>
      <div class="note tip"><span class="ni">ℹ️</span><div>以上培养方案整理自学校官网与公开资料，具体课程与学分以入学院系发放的《人才培养方案》为准。</div></div>
    </div>`;
    return head + body;
  }
  window.openMajor = function (name) {
    const h = majorHTML(name);
    if (!h) return;
    document.getElementById("mbox").innerHTML = h;
    document.getElementById("modal").classList.add("on");
    document.getElementById("ovl").classList.add("on");
  };

  /* ============================ 宿舍攻略 ============================ */
  function dorm() {
    const d = D().dorm;
    if (!d) return "";
    const c = d.campus, bed = d.bed;

    const campusSec = `
    <div class="sec">${secH("宿舍概况", "先搞清楚你在哪个校区")}
      <div class="grid g2">
        <div class="card"><div class="sec-h" style="border:none;padding:0;margin-bottom:8px"><h2 style="font-size:15px">🏫 大一 · 雷锋校区</h2></div>
          <p style="margin:0 0 8px;color:var(--tx2)">${esc(c.freshman)}</p>
          <div class="note tip" style="margin:0 0 10px"><span class="ni">✨</span><div>${esc(c.leifeng.highlight)}</div></div>
          <ul class="lst">${c.leifeng.roomTypes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>
        <div class="card"><div class="sec-h" style="border:none;padding:0;margin-bottom:8px"><h2 style="font-size:15px">🏫 大二起 · 主校区</h2></div>
          <p style="margin:0 0 8px;color:var(--tx2)">${esc(c.sophomore)}</p>
          <div class="note ok" style="margin:0"><span class="ni">✅</span><div>主校区在长沙市区，出行、实习、吃喝玩乐都更方便，大二搬过去会明显感觉「进城了」。</div></div>
        </div>
      </div>
      <div class="note warn" style="margin-top:12px"><span class="ni">⚠️</span><div><b>宿舍规定（雷锋校区）：</b>${esc(c.leifeng.rules.join("；"))}</div></div>
      <div class="note tip" style="margin-top:8px"><span class="ni">💡</span><div>${esc(c.leifeng.tips.join("；"))}</div></div>
    </div>`;

    const bedNum = [
      ["0.9m", "宽 / 90cm"], ["2.0m", "长 / 200cm"],
      ["≈45cm", "下铺离地"], ["8–10cm", "床垫厚"]
    ].map(x => `<div class="bn"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join("");

    const bedSec = `
    <div class="sec">${secH("床铺尺寸详解", "买床品前先量床")}
      <div class="grid g2">
        <div class="bed-fig">
          <div class="bf-lab">长 2.0 m（200 cm）</div>
          <div class="bf-bed">
            <div class="bf-w">宽<br>0.9 m<br>(90 cm)</div>
            <div class="bf-in">上下铺<br>床底可放行李箱</div>
          </div>
        </div>
        <div class="grid g2" style="align-content:start;gap:10px">${bedNum}</div>
      </div>
      <div class="note tip" style="margin-top:12px"><span class="ni">📏</span><div>${esc(bed.note)} <b>${esc(bed.type)}</b> ${esc(bed.lowerHeight)} ${esc(bed.mattress)}</div></div>
    </div>`;

    const beddingRows = d.bedding.map(b =>
      `<tr><td style="white-space:nowrap"><b>${esc(b.item)}</b></td><td>${esc(b.size)}</td><td style="color:var(--tx2)">${esc(b.note)}</td></tr>`).join("");
    const beddingSec = `
    <div class="sec">${secH("床上用品采购清单", "按这个尺寸买不踩雷")}
      <div class="tw"><table class="tb"><thead><tr><th>物品</th><th>推荐尺寸</th><th>说明</th></tr></thead><tbody>${beddingRows}</tbody></table></div>
    </div>`;

    const goodSec = `
    <div class="sec">${secH("学长学姐好物推荐", "提升幸福感的小东西（分类清单）")}
      <div class="grid g2">${d.goodItems.map(g => `
        <div class="card" style="margin-bottom:0">
          <div class="sec-h" style="border:none;padding:0;margin-bottom:8px"><h2 style="font-size:15px">${esc(g.icon)} ${esc(g.cat)}</h2></div>
          ${g.items.map(it => `
            <div class="gi" style="padding:8px 0;border-top:1px solid var(--line2)">
              <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b>${esc(it.name)}</b><span class="tag navy" style="white-space:nowrap;font-size:10.5px">${esc(it.spec)}</span></div>
              <div style="color:var(--tx2);font-size:13px;margin-top:2px">${esc(it.why)}</div>
            </div>`).join("")}
        </div>`).join("")}</div>
    </div>`;

    const avoidSec = `
    <div class="sec">${secH("🚫 避雷 & 违禁清单", "这些别买、别带")}
      <div class="grid g2">
        <div class="card"><div class="sec-h" style="border:none;padding:0;margin-bottom:8px"><h2 style="font-size:15px">智商税 / 别买</h2></div>
          <ul class="lst">${d.avoid.map(a => `<li><b>${esc(a.name)}</b>：${esc(a.why)}</li>`).join("")}</ul>
        </div>
        <div class="card"><div class="sec-h" style="border:none;padding:0;margin-bottom:8px"><h2 style="font-size:15px">宿舍违禁电器</h2></div>
          <ul class="lst">${d.forbidden.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
          <div class="note warn" style="margin-top:8px"><span class="ni">⚠️</span><div>违禁电器一旦被查到，轻则没收、重则记过，得不偿失。</div></div>
        </div>
      </div>
    </div>`;

    const settleSec = `
    <div class="sec">${secH("入住整理 6 步走", "报到当天不抓瞎")}
      <div class="tl">${d.settle.map(s => `
        <div class="tl-i"><div class="tl-t">${esc(s.step)}</div><div class="tl-c"><b>${esc(s.title)}</b><ul class="lst"><li>${esc(s.detail)}</li></ul></div></div>`).join("")}</div>
    </div>`;

    const sizeRows = d.sizeTable.map(r =>
      `<tr><td style="white-space:nowrap"><b>${esc(r.item)}</b></td><td>${esc(r.size)}</td></tr>`).join("");
    const sizeSec = `
    <div class="sec">${secH("尺寸速查表", "一表搞定采购")}
      <div class="tw"><table class="tb"><thead><tr><th>物品</th><th>推荐尺寸</th></tr></thead><tbody>${sizeRows}</tbody></table></div>
    </div>`;

    const tipsSec = `
    <div class="sec">${secH("宿舍生活小贴士", "过来人的真心话")}
      <div class="card"><ul class="lst">${d.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </div>`;

    return `
    <div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>${esc(d.intro)}</div></div>
    ${campusSec}
    ${bedSec}
    ${beddingSec}
    ${goodSec}
    ${avoidSec}
    ${settleSec}
    ${sizeSec}
    ${tipsSec}`;
  }

  /* ============================ 大学四年时间轴 ============================ */
  function timeline() {
    const T = D().timeline;
    if (!T) return "";
    const yrs = (T.years || []).map(y => `
      <div class="card" style="border-left:4px solid var(--${y.color || 'navy'})">
        <div class="sec-h" style="border:none;padding:0;margin-bottom:10px"><h2 style="font-size:16px">${esc(y.year)}</h2><span class="d">${esc(y.tag || "")}</span></div>
        <div style="margin-bottom:8px"><b style="color:var(--tx2)">🎯 目标</b><div class="crs" style="margin-top:4px">${(y.goals || []).map(g => `<span>${esc(g)}</span>`).join("")}</div></div>
        <div style="margin-bottom:8px"><b style="color:var(--green)">✅ 该做</b><ul class="lst">${(y.do || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div><b style="color:var(--red)">⛔ 别踩</b><ul class="lst">${(y.avoid || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>`).join("");
    const cps = (T.checkpoints || []).map(c =>
      `<div class="tl-i"><div class="tl-t">${esc(c.when)} · ${esc(c.title)}</div><div class="tl-c"><div class="tl-d">${esc(c.desc)}</div></div></div>`).join("");
    return `
    <div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>${esc(T.intro)}</div></div>
    <div class="sec">${secH("分年级路线图", "大一到大四每年该抓什么")}
      <div class="grid g2">${yrs}</div>
    </div>
    <div class="sec">${secH("大学四年关键节点", "照着这张表走不慌")}
      <div class="tl">${cps}</div>
    </div>`;
  }

  /* ============================ 考证指南 ============================ */
  function cert() {
    const C = D().cert;
    if (!C) return "";
    const lvCls = { "高优先级": "red", "建议": "green", "加分": "purple", "按需": "navy", "就业向": "gold", "高阶": "red", "进阶": "navy", "高含金量": "gold" };
    const cats = (C.categories || []).map(c => {
      const items = c.items.map(it => `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
            <div style="font-weight:700">${esc(it.name)}</div>
            <span class="tag ${lvCls[it.level] || 'navy'}">${esc(it.level || "")}</span>
          </div>
          <div class="note tip" style="margin:8px 0"><span class="ni">⏰</span><div>建议时间：${esc(it.when || "—")}</div></div>
          <div style="font-size:13px;color:var(--tx3);line-height:1.7">${esc(it.why || "")}</div>
          ${it.tip ? `<div class="note ok" style="margin-top:8px"><span class="ni">✅</span><div>${esc(it.tip)}</div></div>` : ""}
        </div>`).join("");
      return `<div class="sec">${secH(c.icon + " " + c.name, "")}<div class="grid g2">${items}</div></div>`;
    }).join("");
    const plan = (C.plan || []).map(p =>
      `<div class="dt"><div class="r1"><span class="nm">${esc(p.grade)}</span></div><div class="nt">${(p.do || []).map(x => `· ${esc(x)}`).join("；")}</div></div>`).join("");
    const tips = (C.tips || []).map(t => `<li>${esc(t)}</li>`).join("");
    return `
    <div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>${esc(C.intro)}</div></div>
    ${cats}
    <div class="grid g2">
      <div class="sec" style="margin:0">${secH("按年级考证节奏", "")}<div class="dorm-c"><div class="dorm-h"><div class="t">规划</div></div><div class="dorm-b">${plan}</div></div></div>
      <div class="sec" style="margin:0">${secH("考证避坑建议", "")}<div class="card"><ul class="lst">${tips}</ul></div></div>
    </div>`;
  }

  /* ============================ 信息渠道 ============================ */
  function channels() {
    const R = D().channels;
    if (!R) return "";
    const groups = (R.groups || []).map(g => {
      const items = g.items.map(it =>
        `<div class="res"><div class="rt">${esc(it.name)} ${it.url ? `<a class="rl" href="${esc(it.url)}" target="_blank" rel="noopener">↗</a>` : ""}</div><div class="rd">${esc(it.use)}</div></div>`).join("");
      return `<div class="sec">${secH(g.icon + " " + g.name, "")}<div class="grid g2">${items}</div></div>`;
    }).join("");
    const tips = (R.tips || []).map(t => `<li>${esc(t)}</li>`).join("");
    return `
    <div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>${esc(R.intro)}</div></div>
    ${groups}
    <div class="sec">${secH("信息获取小贴士", "")}<div class="card"><ul class="lst">${tips}</ul></div></div>`;
  }

  /* ============================ 考研保研 ============================ */
  function postgrad() {
    const P = D().postgrad;
    if (!P) return "";
    const paths = (P.paths || []).map(p => `
      <div class="card" style="margin-bottom:12px">
        <div class="sec-h" style="border:none;padding:0;margin-bottom:8px"><h2 style="font-size:16px">${esc(p.icon || "")} ${esc(p.name)}</h2></div>
        <p style="margin:0 0 10px;font-size:13px;color:var(--tx3)">${esc(p.desc || "")}</p>
        ${(p.sections || []).map(s => `<div style="margin-bottom:8px"><b style="color:var(--navy)">${esc(s.t)}</b><div style="font-size:13px;color:var(--tx2);line-height:1.7;margin-top:2px">${esc(s.d)}</div></div>`).join("")}
      </div>`).join("");
    const tl = (P.timeline || []).map(t =>
      `<div class="tl-i"><div class="tl-t">${esc(t.when)} · ${esc(t.t)}</div><div class="tl-c"><div class="tl-d">${esc(t.d)}</div></div></div>`).join("");
    const tips = (P.tips || []).map(t => `<li>${esc(t)}</li>`).join("");
    return `
    <div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>${esc(P.intro)}</div></div>
    <div class="sec">${secH("两条路怎么选", "考研 vs 保研")}<div class="grid g2">${paths}</div></div>
    <div class="sec">${secH("全流程时间轴", "从大一到大四上")}<div class="tl">${tl}</div></div>
    ${P.forEngSoft ? `<div class="note ok" style="margin-bottom:14px"><span class="ni">🛠️</span><div><b>工程软件方向：</b>${esc(P.forEngSoft)}</div></div>` : ""}
    <div class="sec">${secH("考研保研避坑", "")}<div class="card"><ul class="lst">${tips}</ul></div></div>`;
  }

  /* ============================ 实习求职 ============================ */
  function job() {
    const J = D().job;
    if (!J) return "";
    const tl = (J.timeline || []).map(t =>
      `<div class="tl-i"><div class="tl-t">${esc(t.when)} · ${esc(t.t)}</div><div class="tl-c"><div class="tl-d">${esc(t.d)}</div></div></div>`).join("");
    const resume = (J.resume || []).map(t => `<li>${esc(t)}</li>`).join("");
    const channels = (J.channels || []).map(c =>
      `<div class="res"><div class="rt">${esc(c.name)} ${c.url ? `<a class="rl" href="${esc(c.url)}" target="_blank" rel="noopener">↗</a>` : ""}</div><div class="rd">${esc(c.use)}</div></div>`).join("");
    const interview = (J.interview || []).map(t => `<li>${esc(t)}</li>`).join("");
    const tips = (J.tips || []).map(t => `<li>${esc(t)}</li>`).join("");
    return `
    <div class="note tip" style="margin-bottom:14px"><span class="ni">ℹ️</span><div>${esc(J.intro)}</div></div>
    <div class="sec">${secH("校招时间线", "从大二就开始准备")}<div class="tl">${tl}</div></div>
    <div class="grid g2">
      <div class="sec" style="margin:0">${secH("简历要点", "")}<div class="card"><ul class="lst">${resume}</ul></div></div>
      <div class="sec" style="margin:0">${secH("面试准备", "")}<div class="card"><ul class="lst">${interview}</ul></div></div>
    </div>
    <div class="sec">${secH("求职渠道", "")}<div class="grid g2">${channels}</div></div>
    ${J.forEngSoft ? `<div class="note ok" style="margin-bottom:14px"><span class="ni">🛠️</span><div><b>工程软件方向：</b>${esc(J.forEngSoft)}</div></div>` : ""}
    <div class="sec">${secH("求职避坑", "")}<div class="card"><ul class="lst">${tips}</ul></div></div>`;
  }

  // 暴露给 map / ai / app 使用
  window.Render = {
    home, about, majors, engsoft, campus, dorm, checklist, training, laptop, policies, resources, courseSelection, faq,
    timeline, cert, channels, postgrad, job,
    majorHTML, findMajor,
    _mjF, _mjK,
    mjGrid, // 供首次渲染后调用
  };
})();
