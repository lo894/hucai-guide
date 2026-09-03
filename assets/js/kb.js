/* ============================================================
   kb.js — 数据加载 · 知识库构建 · 中文检索引擎（BM25）
   ============================================================ */

// 全局 HTML 转义（最早定义，供后续所有脚本使用）
window.esc = function (s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
};

const KB = (() => {
  const FILES = ['school','majors','campus-life','campus-map','checklist','training','laptop','policies','resources','faq','feed','course-selection','dorm','timeline','cert','channels','postgrad','job','transfer','competitions','skills','plan','class-campaign'];
  const D = {};                 // 原始数据
  let docs = [];                // 知识片段
  let idx = new Map();          // 倒排索引 term -> [{d,tf}]
  let avgLen = 0;

  /* ---------- 同义词，提升召回 ---------- */
  const SYN = {
    '宿舍':['住宿','寝室','住','床','舍友','室友','公寓','住宿费'],
    '食堂':['吃饭','伙食','餐','菜','饭','就餐','外卖','食物'],
    '军训':['训练','教官','队列','军事训练','站军姿'],
    '学费':['费用','收费','多少钱','贵','缴费','交钱'],
    '奖学金':['奖金','助学金','资助','贫困','补助','贷款'],
    '转专业':['换专业','调专业','转系'],
    '专业':['学科','系','培养','课程','就业'],
    '报到':['入学','开学','注册','迎新','新生报到'],
    '交通':['地铁','公交','怎么去','路线','出行','火车站','机场'],
    '校区':['雷锋校区','主校区','校园'],
    '选课':['教务','排课','抢课','课表'],
    '电脑':['笔记本','计算机','电脑配置','买电脑','装备'],
    '清单':['带什么','准备','行李','物品','需要带'],
    '考研':['升学','读研','研究生'],
    '就业':['工作','找工作','岗位','职业','薪资'],
    '天气':['气候','冷','热','衣服','穿什么'],
    '社团':['活动','组织','学生会','俱乐部'],
    '图书馆':['自习','借书','看书','藏书'],
    '证书':['考证','资格证','职称','考试'],
    '空调':['热水','洗衣机','设施','配套'],
    '地图':['位置','在哪','怎么走','建筑','楼']
  };
  const expand = q => {
    let r = q;
    for (const [k, vs] of Object.entries(SYN)) {
      if (q.includes(k)) r += ' ' + vs.join(' ');
      else for (const v of vs) if (q.includes(v)) { r += ' ' + k + ' ' + vs.join(' '); break; }
    }
    return r;
  };

  /* ---------- 中文分词：单字 + bigram + 英数词 ---------- */
  function tok(s) {
    if (!s) return [];
    s = String(s).toLowerCase();
    const out = [];
    (s.match(/[a-z]+|\d+/g) || []).forEach(w => out.push(w));
    const cn = s.replace(/[^\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean);
    cn.forEach(seg => {
      for (let i = 0; i < seg.length; i++) {
        out.push(seg[i]);
        if (i < seg.length - 1) out.push(seg.slice(i, i + 2));
      }
    });
    return out;
  }

  function addDoc(o) {
    o.id = docs.length;
    o.text = (o.text || '').replace(/\s+/g, ' ').trim();
    if (!o.text && !o.title) return;
    docs.push(o);
  }

  /* ---------- 把 JSON 展开成知识片段 ---------- */
  function build() {
    docs = [];
    const s = D.school;
    if (s) {
      addDoc({ title: '学校概况', page: 'about', module: '学校概况', w: 1.2,
        text: `${s.name}（${s.enName}，${s.abbr}），校训「${s.slogan}」。${s.overview.intro} 学校代码${s.code}，${s.type}，主管部门${s.authority}。占地${s.overview.area}，${s.overview.students}，${s.overview.faculty}。招生咨询电话 ${s.hotline.join('、')}，官网 ${s.website}。` });
      addDoc({ title: '学科实力与一流专业', page: 'about', module: '学校概况', w: 1.1,
        text: s.overview.strengths.join('；') });
      addDoc({ title: '办学历史沿革', page: 'about', module: '学校概况',
        text: s.overview.history.map(h => `${h.year} ${h.event}`).join('；') });
      s.campuses.forEach(c => addDoc({ title: `${c.name}情况`, page: 'about', module: '校区', w: 1.2,
        text: `${c.name}位于${c.address}，${c.who}在此就读。${c.features.join('。')}` }));
      addDoc({ title: '学费标准', page: 'about', module: '费用', w: 1.2,
        text: '各专业学费标准（元/年）：' + s.tuition.map(t => `${t.type} ${t.fee}元（${t.majors}）`).join('；') + `。住宿费${s.accommodationFee}。` });
      addDoc({ title: '报到流程', page: 'about', module: '报到', w: 1.2,
        text: s.reportFlow.map(r => `第${r.step}步 ${r.title}：${r.desc} 提示：${r.tip}`).join(' ') });
      addDoc({ title: '校历与重要时间节点', page: 'about', module: '校历', w: 1.1,
        text: s.calendar.map(c => `${c.time} ${c.event}`).join('；') });
      addDoc({ title: '来校交通路线', page: 'about', module: '交通', w: 1.2,
        text: s.routes.map(r => `从${r.from}：${r.route}，${r.time}，约${r.cost}`).join('；') });
      const tr = s.transport || {};
      if (tr.main) addDoc({ title: '主校区交通与周边生活', page: 'about', module: '交通', w: 1.1,
        text: `主校区（${tr.main.campus}）：地铁 ${tr.main.metro} 公交 ${tr.main.bus} 打车 ${tr.main.taxi} 自驾 ${tr.main.drive}。周边生活：${tr.around ? tr.around.main : ''} 迎新接站：${tr.pickup || ''}` });
      if (tr.leifeng) addDoc({ title: '雷锋校区交通与周边生活', page: 'about', module: '交通', w: 1.1,
        text: `雷锋校区（${tr.leifeng.campus}）：地铁 ${tr.leifeng.metro} 公交 ${tr.leifeng.bus} 打车 ${tr.leifeng.taxi} 自驾 ${tr.leifeng.drive}。周边生活：${tr.around ? tr.around.leifeng : ''}` });
      if ((tr.safety || []).length) addDoc({ title: '出行交通安全贴士', page: 'about', module: '交通', w: 1.1,
        text: '交通出行安全：' + tr.safety.join('；') });
      if (tr.around) addDoc({ title: '快递与行李寄送指南', page: 'about', module: '交通', w: 1.3,
        text: '新生大件行李可提前快递到校区菜鸟驿站/快递柜，报到日人车密集、轻装到校最省心；主校区东门附近、雷锋校区校内均有菜鸟驿站，凭取件码领取；贵重物品随身带，行李箱贴姓名电话防丢；周边医院、商圈、银行ATM分布见各校区周边生活说明。' });
      addDoc({ title: '常用信息平台与网址', page: 'resources', module: '平台',
        text: s.platforms.map(p => `${p.name} ${p.url} —— ${p.use}`).join('；') });
      addDoc({ title: '新生速查表', page: 'home', module: '速查', w: 1.1,
        text: s.quickFacts.map(q => `${q.label}：${q.value}（${q.note}）`).join('；') });
    }

    (D.majors?.colleges || []).forEach(c => {
      addDoc({ title: `${c.name}·学院介绍`, page: 'majors', module: '学院', ref: c.name,
        text: `${c.name}：${c.intro} 开设专业：${c.majors.map(m => m.name).join('、')}。` });
      c.majors.forEach(m => addDoc({
        title: `${m.name}（${c.name}）`, page: 'majors', module: '专业', ref: m.name, w: 1.3,
        text: `${m.name}专业属于${c.name}，${m.subject}门类，授${m.degree}，学制${m.years}，学费${m.tuition}元/年，选科要求：${m.selection}。${m.level ? '专业层次：' + m.level + '。' : ''}培养目标：${m.goal} 核心课程：${(m.coreCourses || []).join('、')}。就业方向：${(m.careers || []).join('；')}。建议考取证书：${(m.certs || []).join('、')}。考研方向：${m.postgrad || ''} 学习难度：${m.difficulty || ''}`
      }));
    });

    const cl = D['campus-life'];
    if (cl) {
      addDoc({ title: '宿舍条件总览', page: 'campus', module: '宿舍', w: 1.3,
        text: `${cl.dorms.intro} 雷锋校区（大一）：${cl.dorms.leifeng.highlight}，宿舍类型有${cl.dorms.leifeng.types.map(t => `${t.name}（${t.people}，${t.layout}，${t.facility}，${t.note}）`).join('；')}。主校区（大二起）：${cl.dorms.main.types.map(t => `${t.name}（${t.people}，${t.facility}，${t.note}）`).join('；')}。宿舍标配：${cl.dorms.standard.map(x => x.item + '—' + x.desc).join('；')}。` });
      addDoc({ title: '宿舍管理规定与住宿贴士', page: 'campus', module: '宿舍', w: 1.1,
        text: '宿舍规定：' + cl.dorms.rules.join('；') + '。实用贴士：' + cl.dorms.tips.join('；') });
      addDoc({ title: '食堂餐饮与生活费', page: 'campus', module: '食堂', w: 1.2,
        text: `${cl.canteen.intro} 价格参考：${cl.canteen.prices.map(p => `${p.meal} ${p.items} ${p.price}`).join('；')}。月生活费：${cl.canteen.monthly.map(m => `${m.level} ${m.range}（${m.desc}）`).join('；')}。推荐：${cl.canteen.recommend.join('；')}。${cl.canteen.tips.join('；')}` });
      cl.facilities.forEach(f => addDoc({ title: `校园设施·${f.name}`, page: 'campus', module: '设施', text: f.items.join('；') }));
      addDoc({ title: '周边商圈景点与医院', page: 'campus', module: '周边', w: 1.1,
        text: '商圈：' + cl.surroundings.business.map(b => `${b.name}（${b.dist}）${b.desc}`).join('；') + '。景点：' + cl.surroundings.scenery.map(b => `${b.name}（${b.dist}）${b.desc}`).join('；') + '。医院：' + cl.surroundings.hospital.map(b => `${b.name}（${b.level}）${b.desc}`).join('；') });
      addDoc({ title: '奖学金与资助体系', page: 'policies', module: '奖助', w: 1.3,
        text: '奖学金：' + cl.scholarship.awards.map(a => `${a.name} ${a.amount}，面向${a.who}，${a.note}`).join('；') + '。资助：' + cl.scholarship.aid.map(a => `${a.name}—${a.desc}`).join('；') + '。' + cl.scholarship.system });
      addDoc({ title: '转专业政策详解', page: 'policies', module: '转专业', w: 1.4,
        text: `${cl.transfer.intro} 申请时间：${cl.transfer.time}。条件：${cl.transfer.conditions.join('；')}。考核方式：${cl.transfer.exam.map(e => `${e.type}—${e.way}，${e.content}`).join('；')}。限制：${cl.transfer.restrictions.join('；')}。建议：${cl.transfer.advice}` });
      addDoc({ title: '社团活动与校园文化', page: 'campus', module: '社团', w: 1.1,
        text: '特色活动：' + cl.activities.events.map(e => `${e.name}—${e.desc}`).join('；') + '。学生组织与社团：' + cl.activities.clubs.map(c => c.type + '：' + c.list.join('、')).join('；') + '。' + cl.activities.honor + ' ' + cl.activities.advice });
    }

    (D['campus-map']?.campuses || []).forEach(c => {
      addDoc({ title: `${c.name}位置与交通`, page: 'map', module: '地图', w: 1.1,
        text: `${c.name}地址：${c.address}。${c.desc}。交通：${(c.transport || []).join('；')}` });
      addDoc({ title: `${c.name}建筑与功能点分布`, page: 'map', module: '地图',
        text: c.points.map(p => `${p.name}：${p.desc}${p.tips ? '（' + p.tips + '）' : ''}`).join('；') });
    });

    const ck = D.checklist;
    if (ck) {
      ck.groups.forEach(g => addDoc({ title: `入学清单·${g.name}`, page: 'checklist', module: '清单', w: 1.2,
        text: `${g.note} ${g.items.map(i => `${i.name}【${({ must: '必带', rec: '建议带', buy: '到校再买', no: '别带' })[i.level]}】${i.desc}`).join('；')}` }));
      addDoc({ title: '入学准备时间轴', page: 'checklist', module: '清单', w: 1.1,
        text: ck.timeline.map(t => `${t.when}：${t.todo.join('；')}`).join('。') });
    }

    const tr = D.training;
    if (tr) {
      addDoc({ title: '军训基本安排', page: 'training', module: '军训', w: 1.4,
        text: `${tr.intro} ${tr.basic.map(b => `${b.label}：${b.value}（${b.note}）`).join('；')}` });
      addDoc({ title: '军训进度与各阶段安排', page: 'training', module: '军训', w: 1.1,
        text: tr.schedule.map(s => `${s.phase}${s.title}：${s.content.join('、')}。提示：${s.tip}`).join(' ') });
      tr.gear.forEach(g => addDoc({ title: `军训装备·${g.group}`, page: 'training', module: '军训', w: 1.2,
        text: g.items.map(i => `${i.name}（${i.spec}）——${i.why}`).join('；') }));
      addDoc({ title: '军训纪律与请假规定', page: 'training', module: '军训', w: 1.2,
        text: tr.rules.map(r => `${r.type}：${r.items.join('；')}`).join('。') });
      addDoc({ title: '军训生存法则', page: 'training', module: '军训', text: tr.survival.join(' ') });
      tr.faq.forEach(f => addDoc({ title: f.q, page: 'training', module: '军训问答', w: 1.2, text: f.q + ' ' + f.a }));
    }

    const lp = D.laptop;
    if (lp) {
      addDoc({ title: '电脑选购五大原则', page: 'laptop', module: '电脑', w: 1.2,
        text: lp.intro + ' ' + lp.principles.map(p => `${p.rank}.${p.name}：${p.desc}`).join(' ') });
      addDoc({ title: '电脑选购避坑要点', page: 'laptop', module: '电脑', w: 1.2,
        text: lp.warnings.map(w => `${w.title}：${w.desc}`).join('；') });
      lp.byMajor.forEach(b => addDoc({ title: `电脑配置推荐·${b.group}`, page: 'laptop', module: '电脑', w: 1.3,
        text: `适用专业：${b.majors.join('、')}。使用需求：${b.need}。推荐配置：CPU ${b.cpu}；内存 ${b.ram}；硬盘 ${b.disk}；显卡 ${b.gpu}；屏幕 ${b.screen}；重量 ${b.weight}；预算 ${b.budget}。${b.note}` }));
      addDoc({ title: '电脑购买时机与验机清单', page: 'laptop', module: '电脑',
        text: lp.buyTiming.map(t => `${t.time}（${t.score}）：${t.reason}`).join('；') + '。验机清单：' + lp.checklist.join('；') });
      lp.faq.forEach(f => addDoc({ title: f.q, page: 'laptop', module: '电脑问答', w: 1.2, text: f.q + ' ' + f.a }));
    }

    (D.policies?.categories || []).forEach(c => c.items.forEach(i => addDoc({
      title: i.title, page: 'policies', module: '政策·' + c.name, w: 1.25,
      text: `${i.summary} ${(i.points || []).join('；')} ${i.link ? '文件链接：' + i.link : ''}`, link: i.link
    })));

    (D.resources?.groups || []).forEach(g => addDoc({
      title: `学习资源·${g.name}`, page: 'resources', module: '资源',
      text: g.items.map(i => `${i.title}（${i.url}）：${i.desc}`).join('；')
    }));

    (D.faq?.categories || []).forEach(c => c.items.forEach(i => addDoc({
      title: i.q, page: 'faq', module: 'FAQ·' + c.name, w: 1.5, text: i.q + ' ' + i.a, answer: i.a
    })));

    const cs = D['course-selection'];
    if (cs) {
      addDoc({ title: '选课系统与登录', page: 'course', module: '选课', w: 1.3,
        text: `选课在${cs.system.name}（${cs.system.url}）进行，登录账号为${cs.system.account}，初始密码${cs.system.initPassword}。建议使用${cs.system.browser}。系统功能包括：${cs.system.functions.join('、')}。` });
      addDoc({ title: '选课轮次与流程', page: 'course', module: '选课', w: 1.2,
        text: cs.rounds.map(r => `${r.name}（${r.time}）：${r.content} 提示：${r.tip}`).join(' ') });
      addDoc({ title: '课程类型与学分构成', page: 'course', module: '选课', w: 1.2,
        text: cs.courseTypes.map(c => `${c.name}（${c.credit}）：${c.desc}`).join('；') + '。' + cs.creditInfo.total + ' ' + cs.creditInfo.gpa + ' ' + cs.creditInfo.rule });
      addDoc({ title: '选课技巧与避坑', page: 'course', module: '选课', w: 1.2,
        text: '选课技巧：' + cs.tips.join('；') + '。常见坑：' + cs.avoid.map(a => `${a.name}—${a.desc}`).join('；') });
      cs.faq.forEach(f => addDoc({ title: f.q, page: 'course', module: '选课问答', w: 1.3, text: f.q + ' ' + f.a }));
      if (cs.publicElective) addDoc({ title: '公选课怎么选（红黑榜）', page: 'course', module: '选课·公选', w: 1.3,
        text: cs.publicElective.intro + ' 红榜特征：' + cs.publicElective.greenFlags.join('；') + '。黑榜特征：' + cs.publicElective.redFlags.join('；') + '。' + cs.publicElective.note });
      if (cs.foundation) addDoc({ title: '大学基础课难度地图', page: 'course', module: '选课·基础课', w: 1.3,
        text: cs.foundation.intro + ' ' + cs.foundation.courses.map(c => c.name + '（难度' + '★'.repeat(c.level) + '☆'.repeat(Math.max(0, 5 - c.level)) + '，适用' + c.scope + '）：' + c.tip).join(' ') });
    }

    (D.feed?.items || []).slice(0, 60).forEach(f => addDoc({
      title: f.title, page: 'feed', module: '最新动态', text: `${f.title} ${f.summary || ''}（${f.source}，${f.date}）`, link: f.url
    }));

    /* 宿舍攻略 */
    const dm = D.dorm;
    if (dm) {
      addDoc({ title: '宿舍概况与校区分布', page: 'dorm', module: '宿舍', w: 1.2,
        text: `${dm.campus.freshman}；${dm.campus.sophomore}。${dm.campus.leifeng.highlight} 宿舍类型：${dm.campus.leifeng.roomTypes.join('；')} 宿舍规定：${dm.campus.leifeng.rules.join('；')}` });
      addDoc({ title: '宿舍床铺尺寸（长宽高）', page: 'dorm', module: '宿舍·床品', w: 1.5,
        text: `湖财宿舍床尺寸为${dm.bed.sizeText}（长${dm.bed.lengthCm}cm × 宽${dm.bed.widthCm}cm），${dm.bed.type} ${dm.bed.lowerHeight} ${dm.bed.mattress}` });
      addDoc({ title: '被子、被套买多大（床上用品尺寸）', page: 'dorm', module: '宿舍·床品', w: 1.5,
        text: dm.bedding.map(b => `${b.item}：${b.size}（${b.note}）`).join('；') });
      addDoc({ title: '宿舍好物推荐清单（学长学姐）', page: 'dorm', module: '宿舍·好物', w: 1.3,
        text: dm.goodItems.map(g => `${g.cat}：` + g.items.map(i => `${i.name}（${i.spec}）—${i.why}`).join('；')).join(' ') });
      addDoc({ title: '宿舍避雷与违禁电器', page: 'dorm', module: '宿舍·避雷', w: 1.4,
        text: '别买/避雷：' + dm.avoid.map(a => `${a.name}—${a.why}`).join('；') + '。违禁电器：' + dm.forbidden.join('；') });
      addDoc({ title: '宿舍入住整理 6 步走', page: 'dorm', module: '宿舍·整理',
        text: dm.settle.map(s => `第${s.step}步 ${s.title}：${s.detail}`).join(' ') });
      addDoc({ title: '宿舍用品尺寸速查表', page: 'dorm', module: '宿舍·尺寸', w: 1.4,
        text: dm.sizeTable.map(r => `${r.item} ${r.size}`).join('；') });
    }

    /* 大学四年时间轴 */
    const T = D.timeline;
    if (T) {
      addDoc({ title: '大学四年时间轴总览', page: 'timeline', module: '时间轴', w: 1.2,
        text: T.intro + ' ' + (T.years || []).map(y => `${y.year}：${(y.goals || []).join('；')}`).join(' ') });
      (T.checkpoints || []).forEach(c => addDoc({ title: c.title, page: 'timeline', module: '关键节点', w: 1.1, text: c.when + ' ' + c.desc }));
    }

    /* 考证指南 */
    const CT = D.cert;
    if (CT) {
      addDoc({ title: '考证指南总览', page: 'cert', module: '考证', w: 1.2,
        text: CT.intro + ' ' + (CT.categories || []).flatMap(c => c.items.map(i => `${i.name}：${i.why}`)).join('；') });
      (CT.categories || []).forEach(c => c.items.forEach(it => addDoc({ title: it.name, page: 'cert', module: '考证·' + c.name, w: 1.3, text: `${it.level} ${it.when} ${it.why} ${it.tip || ''}` })));
      addDoc({ title: '按年级考证节奏', page: 'cert', module: '考证·规划', text: (CT.plan || []).map(p => `${p.grade}：${(p.do || []).join('；')}`).join(' ') });
    }

    /* 信息渠道 */
    const CH = D.channels;
    if (CH) {
      addDoc({ title: '信息渠道汇总', page: 'channels', module: '渠道', w: 1.2,
        text: CH.intro + ' ' + (CH.groups || []).flatMap(g => g.items.map(i => `${i.name}：${i.use}`)).join('；') });
      (CH.groups || []).forEach(g => g.items.forEach(it => addDoc({ title: it.name, page: 'channels', module: '渠道·' + g.name, text: it.use + (it.url ? (' 网址 ' + it.url) : '') })));
    }

    /* 考研保研 */
    const PG = D.postgrad;
    if (PG) {
      addDoc({ title: '考研保研总览', page: 'postgrad', module: '升学', w: 1.3,
        text: PG.intro + ' ' + (PG.paths || []).map(p => `${p.name}：${p.desc}`).join(' ') });
      (PG.timeline || []).forEach(t => addDoc({ title: t.t, page: 'postgrad', module: '考研时间轴', w: 1.1, text: t.when + ' ' + t.d }));
      if (PG.forEngSoft) addDoc({ title: '工程软件方向考研保研', page: 'postgrad', module: '升学·工程软件', text: PG.forEngSoft });
    }

    /* 实习求职 */
    const JB = D.job;
    if (JB) {
      addDoc({ title: '实习求职总览', page: 'job', module: '就业', w: 1.3,
        text: JB.intro + ' ' + (JB.timeline || []).map(t => `${t.t}：${t.d}`).join(' ') });
      (JB.channels || []).forEach(c => addDoc({ title: c.name, page: 'job', module: '求职渠道', text: c.use + (c.url ? (' 网址 ' + c.url) : '') }));
      if (JB.forEngSoft) addDoc({ title: '工程软件方向就业', page: 'job', module: '就业·工程软件', text: JB.forEngSoft });
    }

    /* 转专业（工程软件 → 大数据 重点） */
    const TR = D.transfer;
    if (TR) {
      const p = TR.policy || {};
      addDoc({ title: '转专业政策与申请条件', page: 'transfer', module: '转专业', w: 1.4,
        text: (p.basis || '') + ' ' + (p.principles || []).join('；') + ' 可申请：' + (p.eligible || []).join('；') + ' 不可转：' + (p.ineligible || []).join('；') + ' 考核：' + (p.exam || []).join('；') });
      (p.timeline || []).forEach(t => addDoc({ title: '转专业时间线·' + t.title, page: 'transfer', module: '转专业', text: t.desc }));
      const bd = TR.bigdata || {};
      (bd.colleges || []).forEach(c => addDoc({ title: '大数据相关专业·' + c.name, page: 'transfer', module: '大数据', w: 1.3,
        text: c.intro + ' 专业：' + (c.majors || []).map(m => m.name + '—' + m.note).join('；') }));
      const r = TR.route || {};
      addDoc({ title: '工程软件转大数据路线', page: 'transfer', module: '转专业·工程软件', w: 1.4,
        text: (r.why || '') + ' 建议课程：' + (r.courses || []).join('、') + ' 目标专业：' + (r.targets || []).join('、') + ' 准备：' + (r.prepare || []).join('；') });
      (TR.checklist || []).forEach(g => addDoc({ title: '转专业准备·' + g.group, page: 'transfer', module: '转专业', text: (g.items || []).map(i => i.name + '—' + i.why).join('；') }));
      (TR.faq || []).forEach(f => addDoc({ title: f.q, page: 'transfer', module: '转专业问答', w: 1.3, text: f.q + ' ' + f.a }));
    }

    /* 竞赛地图 */
    const CP = D.competitions;
    if (CP) {
      addDoc({ title: '竞赛地图总览', page: 'compete', module: '竞赛', w: 1.2,
        text: CP.intro + ' ' + (CP.groups || []).flatMap(g => (g.items || []).map(i => `${i.name}（${i.url}）：${i.fit} 时间${i.time}`)).join('；') });
      (CP.groups || []).forEach(g => (g.items || []).forEach(it => addDoc({ title: it.name, page: 'compete', module: '竞赛·' + g.name, w: 1.35,
        text: `${it.name}：${it.fit} 报名时间${it.time} 级别${it.level || ''} 网址 ${it.url || ''}` })));
      const SC = CP.scoring;
      if (SC) {
        addDoc({ title: '学科竞赛计分办法', page: 'compete', module: '竞赛·计分', w: 1.4,
          text: SC.lead + ' ' + (SC.categories || []).map(c => `${c.code}类：${c.desc}`).join('；') + ' ' + (SC.notes || []).join('；') + ' ' + (SC.incentives || []).map(i => `${i.t}：${i.d}`).join('；') + ' ' + (SC.aList || []).map(a => a.name).join(' ') });
        (SC.aList || []).forEach(a => addDoc({ title: a.name, page: 'compete', module: '竞赛·A类清单', w: 1.2, text: `${a.name}：${a.org}${a.hot ? ' 大数据相关' : ''}` }));
      }
    }

    /* 技能成长 */
    const SK = D.skills;
    if (SK) {
      addDoc({ title: '技能成长总览', page: 'skills', module: '技能', w: 1.2,
        text: SK.intro + ' ' + (SK.paths || []).map(p => `${p.name}：${p.desc}`).join('；') });
      (SK.paths || []).forEach(p => {
        addDoc({ title: p.name, page: 'skills', module: '技能', w: 1.3, text: `${p.name}：${p.desc} ${(p.steps || []).join('；')}` });
        (p.resources || []).forEach(r => addDoc({ title: r.title, page: 'skills', module: '技能·资源', text: r.title + ' ' + r.desc + ' ' + (r.url || '') }));
      });
    }

    /* 学业规划 */
    const PL = D.plan;
    if (PL) {
      addDoc({ title: '学业规划总览', page: 'plan', module: '规划', w: 1.2,
        text: PL.intro + ' ' + (PL.grades || []).map(g => `${g.year}：${(g.focus || []).join('；')}`).join(' ') });
      (PL.grades || []).forEach(g => {
        addDoc({ title: g.year + '学业重点', page: 'plan', module: '规划', w: 1.2, text: `${g.year}（${g.theme || ''}）：${(g.focus || []).join('；')} 建议去做：${(g.todo || []).join('；')}` });
        (g.todo || []).forEach(t => addDoc({ title: g.year + '·' + t, page: 'plan', module: '规划', text: t }));
      });
    }

    /* 竞选班干部 */
    const CC = D['class-campaign'];
    if (CC) {
      addDoc({ title: '竞选班干部总览', page: 'classCampaign', module: '班委', w: 1.3,
        text: CC.intro + ' ' + (CC.roles || []).map(r => `${r.name}：${r.duty} ${r.why}`).join('；') });
      (CC.roles || []).forEach(r => addDoc({ title: '班委·' + r.name, page: 'classCampaign', module: '班委', w: 1.2, text: `${r.name}：${r.duty} ${r.why}` }));
      (CC.steps || []).forEach(s => addDoc({ title: '竞选步骤·' + s.step, page: 'classCampaign', module: '班委', text: s.detail }));
      (CC.faq || []).forEach(f => addDoc({ title: f.q, page: 'classCampaign', module: '班委问答', w: 1.2, text: f.q + ' ' + f.a }));
    }

    /* 建索引 */
    idx = new Map(); let total = 0;
    docs.forEach(d => {
      const ts = tok((d.title + ' ').repeat(3) + d.text);
      d.len = ts.length; total += ts.length;
      const tf = new Map();
      ts.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
      tf.forEach((n, t) => {
        if (!idx.has(t)) idx.set(t, []);
        idx.get(t).push({ d: d.id, tf: n });
      });
    });
    avgLen = total / (docs.length || 1);
    return docs.length;
  }

  /* ---------- BM25 检索 ---------- */
  function search(q, topK = 6) {
    if (!q || !q.trim()) return [];
    const ts = tok(expand(q));
    const uniq = [...new Set(ts)];
    const N = docs.length, k1 = 1.5, b = 0.72;
    const score = new Map();
    uniq.forEach(t => {
      const post = idx.get(t); if (!post) return;
      const w = t.length > 1 ? 1.9 : 0.55;                 // bigram 权重更高
      const idf = Math.log(1 + (N - post.length + .5) / (post.length + .5));
      post.forEach(({ d, tf }) => {
        const dl = docs[d].len;
        const s = idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avgLen)) * w;
        score.set(d, (score.get(d) || 0) + s);
      });
    });
    // 标题精确命中加成
    const ql = q.toLowerCase();
    score.forEach((v, d) => {
      const doc = docs[d];
      let m = doc.w || 1;
      if (doc.title.toLowerCase().includes(ql)) m += .55;
      if (doc.ref && ql.includes(doc.ref.toLowerCase())) m += .8;
      score.set(d, v * m);
    });
    return [...score.entries()].sort((a, b2) => b2[1] - a[1]).slice(0, topK)
      .map(([d, s]) => ({ ...docs[d], score: +s.toFixed(2) }));
  }

  /* ---------- 加载 ---------- */
  async function load() {
    await Promise.all(FILES.map(async f => {
      try {
        const r = await fetch(`data/${f}.json?t=${Date.now()}`);
        if (r.ok) D[f] = await r.json();
      } catch (e) { console.warn('load fail', f, e.message); }
    }));
    if (!D.feed) D.feed = { updated: '', items: [], sources: [] };
    const n = build();
    console.log(`[KB] 知识库就绪：${n} 条片段`);
    return D;
  }

  return { load, build, search, tok, get data() { return D; }, get docs() { return docs; } };
})();
