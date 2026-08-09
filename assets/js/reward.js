/* ============================================================
   reward.js — 互动打赏 / 比心（纯前端，无后端依赖）
   · Web Audio 生成音效，无需外部音频文件
   · 计数存入 localStorage，刷新不丢失
   · 浮字 + 粒子爆裂动画
   依赖：index.html 中的 #rewardBtn #heartBtn #muteBtn 与首页 #blessBtn
   ============================================================ */
(function () {
  "use strict";

  var K_R = "hucai_reward", K_H = "hucai_heart", K_M = "hucai_mute";
  function get(k) { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
  function set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  var muted = (function () { try { return localStorage.getItem(K_M) === "1"; } catch (e) { return false; } })();

  /* ---- 音效：Web Audio 即时合成 ---- */
  var ctx;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
    if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function tone(freq, start, dur, type, vol) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    var v = (vol == null ? 0.18 : vol);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(v, c.currentTime + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.03);
  }
  // 金币音：两声清脆方块波
  function sndCoin() { if (muted) return; tone(987.77, 0, 0.09, "square", 0.15); tone(1318.51, 0.07, 0.13, "square", 0.13); }
  // 比心音：柔和正弦上扬
  function sndHeart() { if (muted) return; tone(523.25, 0, 0.12, "sine", 0.16); tone(783.99, 0.08, 0.18, "sine", 0.14); }

  function updateCount() {
    var n = get(K_R) + get(K_H);
    var el = document.getElementById("blessNum");
    if (el) el.textContent = n;
  }

  /* ---- 浮字 + 粒子 ---- */
  function fly(btn, text, cls) {
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    var f = document.createElement("div");
    f.className = "rw-fly " + (cls || "");
    f.textContent = text;
    f.style.left = (r.left + r.width / 2) + "px";
    f.style.top = (r.top) + "px";
    document.body.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 950);
  }
  function burst(btn, chars) {
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    for (var i = 0; i < chars.length; i++) {
      (function (ch) {
        var p = document.createElement("div");
        p.className = "rw-pop";
        p.textContent = ch;
        var ang = (-90 + (Math.random() * 70 - 35)) * Math.PI / 180;
        var dist = 38 + Math.random() * 46;
        p.style.left = (r.left + r.width / 2) + "px";
        p.style.top = (r.top + r.height / 2) + "px";
        p.style.setProperty("--dx", (Math.cos(ang) * dist) + "px");
        p.style.setProperty("--dy", (Math.sin(ang) * dist) + "px");
        document.body.appendChild(p);
        setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1000);
      })(chars[i]);
    }
  }

  function add(kind, btn) {
    if (kind === "reward") {
      set(K_R, get(K_R) + 1); sndCoin();
      fly(btn, "🪙 +1", "coin"); burst(btn, ["🪙", "✨", "💛", "⭐"]);
    } else {
      set(K_H, get(K_H) + 1); sndHeart();
      fly(btn, "💗 +1", "heart"); burst(btn, ["💗", "💛", "🌟", "✨"]);
    }
    updateCount();
  }

  function init() {
    var rb = document.getElementById("rewardBtn");
    var hb = document.getElementById("heartBtn");
    var mb = document.getElementById("muteBtn");
    if (rb) rb.addEventListener("click", function () { add("reward", rb); });
    if (hb) hb.addEventListener("click", function () { add("heart", hb); });
    if (mb) {
      mb.textContent = muted ? "🔇" : "🔊";
      mb.addEventListener("click", function () {
        muted = !muted;
        try { localStorage.setItem(K_M, muted ? "1" : "0"); } catch (e) {}
        mb.textContent = muted ? "🔇" : "🔊";
        if (!muted) sndHeart();
      });
    }
    // 首页「为作者加油」按钮（渲染后才存在，用事件委托）
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.closest) {
        var b = t.closest("#blessBtn");
        if (b) add("heart", b);
      }
    });
    updateCount();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
