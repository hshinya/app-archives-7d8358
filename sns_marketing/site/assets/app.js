/* ============================================================
   SNS戦略ガイド 共通スクリプト
   - ナビのアクティブ表示 / モバイルドロワー
   - チェックリストのlocalStorage永続化+進捗バー
   - テンプレートのコピー / アコーディオン / カードフィルタ
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "sns_guide_checks_v1";

  /* ---------- ナビ: 現在ページをハイライト ---------- */
  function initNav() {
    var path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("#")[0];
      if (href === path) a.classList.add("active");
    });
  }

  /* ---------- モバイルドロワー ---------- */
  function initDrawer() {
    var sidebar = document.querySelector(".sidebar");
    var toggle = document.querySelector(".nav-toggle");
    if (!sidebar || !toggle) return;

    var scrim = document.createElement("div");
    scrim.className = "scrim";
    document.body.appendChild(scrim);

    function close() { sidebar.classList.remove("open"); scrim.classList.remove("show"); }
    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
      scrim.classList.toggle("show", sidebar.classList.contains("open"));
    });
    scrim.addEventListener("click", close);
    sidebar.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
  }

  /* ---------- チェックリスト永続化 ---------- */
  function loadChecks() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveChecks(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* private mode等 */ }
  }

  function updateGroupProgress(group) {
    var boxes = group.querySelectorAll('input[type="checkbox"][data-id]');
    if (!boxes.length) return;
    var done = 0;
    boxes.forEach(function (b) { if (b.checked) done++; });
    var fill = group.querySelector(".progress-fill");
    var count = group.querySelector(".checklist-count");
    var pct = Math.round((done / boxes.length) * 100);
    if (fill) fill.style.width = pct + "%";
    if (count) count.textContent = done + " / " + boxes.length + " 完了";
    group.classList.toggle("all-done", done === boxes.length);
  }

  function initChecklists() {
    var boxes = document.querySelectorAll('input[type="checkbox"][data-id]');
    if (!boxes.length) return;
    var state = loadChecks();

    boxes.forEach(function (box) {
      if (state[box.dataset.id]) box.checked = true;
      box.addEventListener("change", function () {
        var data = loadChecks();
        if (box.checked) data[box.dataset.id] = true;
        else delete data[box.dataset.id];
        saveChecks(data);
        var group = box.closest(".checklist-group");
        if (group) updateGroupProgress(group);
        updateTotalProgress();
      });
    });

    document.querySelectorAll(".checklist-group").forEach(updateGroupProgress);
    updateTotalProgress();

    var resetBtn = document.querySelector("[data-reset-checks]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (!confirm("チェック状態をすべてリセットしますか?")) return;
        saveChecks({});
        boxes.forEach(function (b) { b.checked = false; });
        document.querySelectorAll(".checklist-group").forEach(updateGroupProgress);
        updateTotalProgress();
      });
    }
  }

  function updateTotalProgress() {
    var el = document.querySelector("[data-total-progress]");
    if (!el) return;
    var boxes = document.querySelectorAll('input[type="checkbox"][data-id]');
    var done = 0;
    boxes.forEach(function (b) { if (b.checked) done++; });
    var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
    el.textContent = pct + "%";
    var fill = document.querySelector("[data-total-fill]");
    if (fill) fill.style.width = pct + "%";
  }

  /* ---------- コピーStudio ---------- */
  function initCopy() {
    document.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tpl = btn.closest(".tpl");
        var pre = tpl ? tpl.querySelector("pre") : null;
        if (!pre) return;
        var text = pre.textContent.trim();

        function ok() {
          var prev = btn.textContent;
          btn.textContent = "✓ コピーしました";
          btn.classList.add("copied");
          setTimeout(function () { btn.textContent = prev; btn.classList.remove("copied"); }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(ok, function () { fallback(); });
        } else { fallback(); }

        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); ok(); } catch (e) { /* noop */ }
          document.body.removeChild(ta);
        }
      });
    });
  }

  /* ---------- アコーディオン ---------- */
  function initAccordion() {
    document.querySelectorAll(".acc-head").forEach(function (head) {
      head.addEventListener("click", function () {
        head.closest(".acc-item").classList.toggle("open");
      });
    });
  }

  /* ---------- フィルタ(参考アカウント等) ---------- */
  function initFilters() {
    var pills = document.querySelectorAll(".pill[data-filter]");
    if (!pills.length) return;
    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        var f = pill.dataset.filter;
        document.querySelectorAll("[data-cat]").forEach(function (el) {
          el.hidden = (f !== "all" && el.dataset.cat !== f);
        });
      });
    });
  }

  /* ---------- ページトップへ ---------- */
  function initTopBtn() {
    var btn = document.createElement("button");
    btn.className = "btn-top";
    btn.textContent = "↑";
    btn.setAttribute("aria-label", "ページ上部へ");
    document.body.appendChild(btn);
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    window.addEventListener("scroll", function () {
      btn.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initDrawer();
    initChecklists();
    initCopy();
    initAccordion();
    initFilters();
    initTopBtn();
  });
})();
