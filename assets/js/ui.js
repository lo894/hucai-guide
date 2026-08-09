/* 滚动渐入 + 微交互（与主题一致，尊重 prefers-reduced-motion） */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // 用户偏好减少动效：不做渐入，内容直接可见

  var SEL = '.sec';
  function inView(el){ var r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; }

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

  function observe(el){
    if (el.dataset.rev) return;
    el.dataset.rev = '1';
    el.classList.add('reveal');
    if (inView(el)) el.classList.add('in'); else io.observe(el);
  }
  function scan(root){ (root || document).querySelectorAll(SEL).forEach(observe); }
  function revealVisible(){ document.querySelectorAll('.reveal:not(.in)').forEach(function(el){ if (inView(el)) el.classList.add('in'); }); }

  scan(document);

  // 监听动态渲染（app.js 切换页面会替换 .main 内容）
  var main = document.querySelector('.main');
  if (main) {
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) { if (n.matches && n.matches(SEL)) observe(n); scan(n); }
        });
      });
    }).observe(main, { childList: true, subtree: true });
  }

  window.addEventListener('load', function(){ scan(document); revealVisible(); });
  window.addEventListener('scroll', revealVisible, { passive: true });
  setTimeout(revealVisible, 600);
  setTimeout(revealVisible, 1500);
})();
