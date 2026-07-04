/* ============================================================
   アプリ開発リサーチ資料 共通スクリプト
   ============================================================ */
"use strict";

/* ---------- ユーティリティ ---------- */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const shortLabel = (s) => String(s).split("(")[0].split("(")[0];

function dots(n, max, label) {
  let h = '<span class="dots" title="' + esc(label) + " " + n + "/" + max + '">';
  for (let i = 1; i <= max; i++) h += '<i class="' + (i <= n ? "on" : "") + '"></i>';
  h += '</span><span class="dots-label">' + esc(label) + " " + n + "/" + max + "</span>";
  return h;
}

function kv(label, value, isList) {
  if (value == null || (Array.isArray(value) && value.length === 0)) return "";
  let body;
  if (isList || Array.isArray(value)) {
    body = "<ul>" + value.map((v) => "<li>" + esc(v) + "</li>").join("") + "</ul>";
  } else {
    body = '<div class="kv-value">' + esc(value) + "</div>";
  }
  return '<div class="kv"><div class="kv-label">' + esc(label) + "</div>" + body + "</div>";
}

function timeline(plan) {
  if (!plan || !plan.length) return "";
  return (
    '<ol class="timeline">' +
    plan.map((p) =>
      '<li><span class="tl-phase">' + esc(p.phase) + '</span><span class="tl-dur">' + esc(p.duration) + '</span><div class="tl-goals">' + esc(p.goals) + "</div></li>"
    ).join("") +
    "</ol>"
  );
}

function diveSec(title, inner, full) {
  if (!inner) return "";
  return '<div class="dive-sec' + (full ? " full" : "") + '"><div class="sec-title">' + esc(title) + "</div>" + inner + "</div>";
}

/* ---------- スコア表示・ソート ---------- */
function recommendBadge(it) {
  if (it.recommend == null) return "";
  const cls = it.recommend >= 8 ? "b-green" : it.recommend >= 6 ? "b-amber" : "b-gray";
  return '<span class="badge ' + cls + '">おすすめ ' + it.recommend + "/10</span>";
}

function scoreDetail(it, dims) {
  if (it.recommend == null) return "";
  const parts = dims
    .filter(([, key]) => it[key] != null)
    .map(([label, key]) => label + " " + it[key] + "/5")
    .join("・");
  const line = parts + "・総合おすすめ " + it.recommend + "/10";
  return (
    '<div class="kv"><div class="kv-label">スコア(AI採点)</div><div class="kv-value">' +
    esc(line) + (it.rationale ? "<br><span class=\"muted\">" + esc(it.rationale) + "</span>" : "") +
    "</div></div>"
  );
}

function sortItems(items, sortVal, get) {
  if (!sortVal || sortVal === "default") return;
  const [field, dir] = sortVal.split(":");
  const sign = dir === "asc" ? 1 : -1;
  items.sort((a, b) => {
    const av = get(a)[field] ?? -1;
    const bv = get(b)[field] ?? -1;
    return (av - bv) * sign;
  });
}
const ulOf = (arr) => (arr && arr.length ? "<ul>" + arr.map((v) => "<li>" + esc(v) + "</li>").join("") + "</ul>" : "");
const pOf = (s) => (s ? "<p>" + esc(s) + "</p>" : "");

/* ---------- サイドバー(モバイル) ---------- */
function initNav() {
  const btn = document.querySelector(".nav-toggle");
  if (btn) btn.addEventListener("click", () => document.body.classList.toggle("nav-open"));
}

/* ---------- 開閉(イベント委譲) ---------- */
function initToggles() {
  document.addEventListener("click", (e) => {
    const head = e.target.closest(".x-head, .dive-head, .acc-head");
    if (!head) return;
    const card = head.closest(".x-card, .dive-card, .acc");
    if (card) card.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-expand-all]");
    if (!btn) return;
    const wrap = document.querySelector(btn.dataset.expandAll);
    if (!wrap) return;
    const cards = wrap.querySelectorAll(".x-card, .dive-card, .acc");
    const anyClosed = Array.from(cards).some((c) => !c.classList.contains("open"));
    cards.forEach((c) => c.classList.toggle("open", anyClosed));
    wrap.querySelectorAll("details").forEach((d) => (d.open = anyClosed));
    btn.textContent = anyClosed ? "すべて閉じる" : "すべて展開";
  });
}

/* ============================================================
   和風アプリレポート
   ============================================================ */
function renderWafu(data) {
  /* --- アイデアをワークフローと同じ順序でフラット化(topPicks の index に対応) --- */
  const all = [];
  data.ideasByGenre.forEach((g) => g.ideas.forEach((i) => all.push({ ...i, genre: g.genre })));
  data.wildcardIdeas.forEach((w) => w.ideas.forEach((i) => all.push({ ...i, genre: w.genre })));
  const pickIdx = new Set(data.topPicks.map((p) => p.index));
  const genres = [...new Set(all.map((i) => i.genre))];
  const totalApps = data.research.reduce((n, r) => n + r.apps.length, 0);

  /* --- 統計 --- */
  document.getElementById("stats").innerHTML = [
    [data.totalIdeaCount + "案", "生成したアイデア"],
    [genres.length + "視点", "8ジャンル+3つの発想切り口"],
    [totalApps + "本", "調査した国内外アプリ"],
    [data.deepDives.length + "案", "詳細実装設計(トップ6)"],
  ].map(([v, l]) => '<div class="stat"><div class="stat-value">' + v + '</div><div class="stat-label">' + l + "</div></div>").join("");

  /* --- トップ6詳細設計 --- */
  document.getElementById("dives").innerHTML = data.deepDives.map((d, i) => {
    const screens = d.screens && d.screens.length
      ? "<ul>" + d.screens.map((s) => "<li><strong>" + esc(s.name) + "</strong>: " + esc(s.description) + "</li>").join("") + "</ul>" : "";
    const aso = d.asoKeywords && d.asoKeywords.length ? pOf(d.asoKeywords.join("、")) : "";
    return (
      '<div class="dive-card">' +
      '<button class="dive-head" type="button">' +
      '<span class="dive-num">' + (i + 1) + "</span>" +
      '<span style="flex:1;min-width:0">' +
      '<span class="dive-title">' + esc(d.title) + "</span>" +
      '<div class="dive-tagline">' + esc(d.tagline) + "</div>" +
      '<div class="dive-meta"><span class="badge">' + esc(shortLabel(d.genre || "")) + "</span></div>" +
      "</span><span class=\"chev\">▶</span></button>" +
      '<div class="dive-body">' +
      '<div class="reason-box"><div class="sec-title">選定理由</div>' + esc(d.pickReason || "") + "</div>" +
      '<div class="dive-grid">' +
      diveSec("画面構成", screens, true) +
      diveSec("ユーザー体験の流れ", pOf(d.userFlow), true) +
      diveSec("MVP機能(最初のリリース)", ulOf(d.mvpFeatures)) +
      diveSec("将来の拡張", ulOf(d.futureFeatures)) +
      diveSec("推奨技術スタック", ulOf(d.techStack), true) +
      diveSec("データソース・API", ulOf(d.dataSources), true) +
      diveSec("収益化", pOf(d.monetization)) +
      diveSec("開発計画", timeline(d.devPlan)) +
      diveSec("リスクと対策", ulOf(d.risks), true) +
      diveSec("ASO(ストア検索)キーワード案", aso, true) +
      "</div></div></div>"
    );
  }).join("");

  /* --- アイデアカタログ(フィルタ・ソート) --- */
  const state = { genre: "all", diff: "all", q: "", sort: "default" };
  const chipsEl = document.getElementById("genre-chips");
  chipsEl.innerHTML =
    '<button class="chip active" data-genre="all" type="button">すべて</button>' +
    genres.map((g) => '<button class="chip" data-genre="' + esc(g) + '" type="button">' + esc(shortLabel(g)) + "</button>").join("");
  chipsEl.addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    state.genre = c.dataset.genre;
    chipsEl.querySelectorAll(".chip").forEach((x) => x.classList.toggle("active", x === c));
    renderIdeas();
  });
  document.getElementById("diff-select").addEventListener("change", (e) => { state.diff = e.target.value; renderIdeas(); });
  document.getElementById("idea-search").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); renderIdeas(); });
  const ideaSort = document.getElementById("idea-sort");
  if (ideaSort) ideaSort.addEventListener("change", (e) => { state.sort = e.target.value; renderIdeas(); });

  function renderIdeas() {
    const items = all
      .map((idea, idx) => ({ idea, idx }))
      .filter(({ idea }) => state.genre === "all" || idea.genre === state.genre)
      .filter(({ idea }) => state.diff === "all" || String(idea.difficulty) === state.diff)
      .filter(({ idea }) => {
        if (!state.q) return true;
        return (idea.title + idea.concept + idea.implementation + idea.differentiation + idea.genre).toLowerCase().includes(state.q);
      });
    sortItems(items, state.sort, (o) => o.idea);
    document.getElementById("idea-count").textContent = "表示中 " + items.length + " / " + all.length + " 案";
    document.getElementById("idea-list").innerHTML = items.map(({ idea, idx }) => {
      const pick = pickIdx.has(idx);
      return (
        '<div class="x-card' + (pick ? " is-pick" : "") + '">' +
        '<button class="x-head" type="button"><span class="x-main">' +
        '<div class="x-title">' + (pick ? '<span class="star-pick">★ </span>' : "") + esc(idea.title) + "</div>" +
        '<div class="x-sub">' + esc(idea.concept) + "</div>" +
        '<div class="x-meta"><span class="badge b-gray">' + esc(shortLabel(idea.genre)) + "</span>" +
        dots(idea.difficulty, 5, "難易度") +
        recommendBadge(idea) +
        (pick ? '<span class="badge b-gold">トップ6選出</span>' : "") +
        "</div></span><span class=\"chev\">▶</span></button>" +
        '<div class="x-body">' +
        scoreDetail(idea, [["需要度", "demand"], ["収益性", "revenue"], ["独自性", "uniqueness"]]) +
        kv("ターゲット", idea.target) +
        kv("コア機能", idea.coreFeatures) +
        kv("四季・和風要素の活かし方", idea.seasonalElement) +
        kv("収益化", idea.monetization) +
        kv("実装イメージ", idea.implementation) +
        kv("既存アプリとの差別化", idea.differentiation) +
        "</div></div>"
      );
    }).join("");
  }
  renderIdeas();

  /* --- 市場調査 --- */
  document.getElementById("research").innerHTML = data.research.map((r) => (
    '<div class="acc">' +
    '<button class="acc-head" type="button"><span class="acc-title">' + esc(r.genre) + '</span><span class="badge b-gray">' + r.apps.length + "アプリ</span><span class=\"chev\">▶</span></button>" +
    '<div class="acc-body">' +
    '<div class="insight-box gap-box"><div class="sec-title">個人開発で狙えるギャップ</div><ul>' + r.gaps.map((g) => "<li>" + esc(g) + "</li>").join("") + "</ul></div>" +
    '<div class="insight-box"><div class="sec-title">市場の気づき</div><ul>' + r.marketInsights.map((m) => "<li>" + esc(m) + "</li>").join("") + "</ul></div>" +
    "<h3>調査した人気アプリ</h3>" +
    r.apps.map((a) => (
      '<details class="app-item"><summary>' +
      '<span class="app-name">' + esc(a.name) + "</span>" +
      '<span class="badge ' + (String(a.region).startsWith("日本") ? "b-rose" : "b-blue") + '">' + esc(a.region) + "</span>" +
      '<span class="app-summary">' + esc(a.summary) + "</span></summary>" +
      '<div class="app-detail">' +
      kv("なぜ人気か", a.whyPopular) +
      kv("和風・季節との関連", a.relevance) +
      "</div></details>"
    )).join("") +
    "</div></div>"
  )).join("");
}

/* ============================================================
   海外ビジネスアプリレポート
   ============================================================ */
function renderBiz(data) {
  const all = [];
  data.research.forEach((r) => r.services.forEach((s) => all.push({ ...s, category: r.category })));
  const pickIdx = new Set(data.topPicks.map((p) => p.index));
  const cats = [...new Set(all.map((s) => s.category))];

  document.getElementById("stats").innerHTML = [
    [data.totalServiceCount + "件", "調査した海外サービス"],
    [data.research.length + "分野", "9カテゴリ+2横断スカウト"],
    [all.filter((s) => s.soloDevFeasibility >= 4).length + "件", "個人開発の実現性4以上"],
    [data.deepDives.length + "案", "日本版プロダクト詳細設計"],
  ].map(([v, l]) => '<div class="stat"><div class="stat-value">' + v + '</div><div class="stat-label">' + l + "</div></div>").join("");

  /* --- 日本版詳細設計 --- */
  document.getElementById("dives").innerHTML = data.deepDives.map((d, i) => (
    '<div class="dive-card">' +
    '<button class="dive-head" type="button">' +
    '<span class="dive-num">' + (i + 1) + "</span>" +
    '<span style="flex:1;min-width:0">' +
    '<span class="dive-title">' + esc(d.productName) + "</span>" +
    '<div class="dive-tagline">' + esc(d.tagline) + "</div>" +
    '<div class="dive-meta"><span class="badge">参考: ' + esc(shortLabel(d.referenceService)) + '</span><span class="badge b-gray">' + esc(shortLabel(d.category || "")) + "</span></div>" +
    "</span><span class=\"chev\">▶</span></button>" +
    '<div class="dive-body">' +
    '<div class="reason-box"><div class="sec-title">選定理由</div>' + esc(d.pickReason || "") + "</div>" +
    '<div class="dive-grid">' +
    diveSec("コンセプト", pOf(d.concept), true) +
    diveSec("ターゲット", pOf(d.targetUsers)) +
    diveSec("なぜ今か(追い風)", pOf(d.whyNow)) +
    diveSec("日本の商習慣への適応", ulOf(d.japanAdaptation), true) +
    diveSec("MVP機能セット", ulOf(d.mvpFeatures)) +
    diveSec("将来の拡張", ulOf(d.futureFeatures)) +
    diveSec("日本の競合と勝ち筋", ulOf(d.competitors), true) +
    diveSec("価格・収益モデル", pOf(d.pricing)) +
    diveSec("顧客獲得戦略(GTM)", ulOf(d.gtm)) +
    diveSec("推奨技術スタック", ulOf(d.techStack), true) +
    diveSec("開発計画", timeline(d.devPlan), true) +
    diveSec("リスクと対策", ulOf(d.risks), true) +
    "</div></div></div>"
  )).join("");

  /* --- サービスカタログ(フィルタ・ソート) --- */
  const state = { cat: "all", feas: "all", q: "", sort: "default" };
  const chipsEl = document.getElementById("cat-chips");
  chipsEl.innerHTML =
    '<button class="chip active" data-cat="all" type="button">すべて</button>' +
    cats.map((c) => '<button class="chip" data-cat="' + esc(c) + '" type="button">' + esc(shortLabel(c)) + "</button>").join("");
  chipsEl.addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    state.cat = c.dataset.cat;
    chipsEl.querySelectorAll(".chip").forEach((x) => x.classList.toggle("active", x === c));
    renderServices();
  });
  document.getElementById("feas-select").addEventListener("change", (e) => { state.feas = e.target.value; renderServices(); });
  document.getElementById("svc-search").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); renderServices(); });
  const svcSort = document.getElementById("svc-sort");
  if (svcSort) svcSort.addEventListener("change", (e) => { state.sort = e.target.value; renderServices(); });

  function renderServices() {
    const items = all
      .map((svc, idx) => ({ svc, idx }))
      .filter(({ svc }) => state.cat === "all" || svc.category === state.cat)
      .filter(({ svc }) => state.feas === "all" || svc.soloDevFeasibility >= Number(state.feas))
      .filter(({ svc }) => {
        if (!state.q) return true;
        return (svc.name + svc.summary + svc.opportunity + svc.japaneseCompetitors + svc.category).toLowerCase().includes(state.q);
      });
    sortItems(items, state.sort, (o) => o.svc);
    document.getElementById("svc-count").textContent = "表示中 " + items.length + " / " + all.length + " 件";
    document.getElementById("svc-list").innerHTML = items.map(({ svc, idx }) => {
      const pick = pickIdx.has(idx);
      return (
        '<div class="x-card' + (pick ? " is-pick" : "") + '">' +
        '<button class="x-head" type="button"><span class="x-main">' +
        '<div class="x-title">' + (pick ? '<span class="star-pick">★ </span>' : "") + esc(svc.name) +
        ' <span class="muted">(' + esc(svc.origin) + ")</span></div>" +
        '<div class="x-sub">' + esc(svc.summary) + "</div>" +
        '<div class="x-meta"><span class="badge b-gray">' + esc(shortLabel(svc.category)) + "</span>" +
        dots(svc.soloDevFeasibility, 5, "個人開発の実現性") +
        recommendBadge(svc) +
        (pick ? '<span class="badge b-gold">日本版設計あり</span>' : "") +
        "</div></span><span class=\"chev\">▶</span></button>" +
        '<div class="x-body">' +
        scoreDetail(svc, [["需要度", "demand"], ["参入余地", "gap"], ["収益性", "revenue"]]) +
        kv("海外での実績", svc.traction) +
        kv("日本での状況", svc.japanStatus) +
        kv("日本の競合", svc.japaneseCompetitors) +
        kv("日本版を作るチャンス", svc.opportunity) +
        "</div></div>"
      );
    }).join("");
  }
  renderServices();

  /* --- 分野別トレンドと空白 --- */
  document.getElementById("research").innerHTML = data.research.map((r) => (
    '<div class="acc">' +
    '<button class="acc-head" type="button"><span class="acc-title">' + esc(r.category) + '</span><span class="badge b-gray">' + r.services.length + "サービス</span><span class=\"chev\">▶</span></button>" +
    '<div class="acc-body">' +
    '<div class="insight-box gap-box"><div class="sec-title">日本市場の空白として有望な切り口</div><ul>' + r.opportunities.map((o) => "<li>" + esc(o) + "</li>").join("") + "</ul></div>" +
    '<div class="insight-box"><div class="sec-title">海外で高まっているトレンド</div><ul>' + r.trends.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul></div>" +
    "</div></div>"
  )).join("");
}

/* ---------- 起動 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initToggles();
  const page = document.body.dataset.page;
  if (page === "wafu" && window.WAFU_DATA) renderWafu(window.WAFU_DATA);
  if (page === "biz" && window.BIZ_DATA) renderBiz(window.BIZ_DATA);
});
