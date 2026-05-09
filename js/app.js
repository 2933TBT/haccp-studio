// HACCP Studio — メインアプリ (状態管理・ルーティング・イベント配線)
import { renderWizard, getWizardSteps, calcCompleteness } from "./wizard.js";
import { renderDoc } from "./render.js";
import { renderPrinciple } from "./principles.js";
import { renderDashboard } from "./dashboard.js";
import { exportJson, importJson, exportPdfViaPrint, exportXlsx } from "./export.js";
import { SAMPLE_FROZEN_KARAAGE } from "./samples.js";
import { PROCESS_TYPES, TEAM_ROLES } from "./data.js";
import { TEMPLATE_GENERATORS, generateAllTemplates } from "./templates.js";

const STORAGE_KEY = "haccp-studio.state.v2";
const WIZ_STEP_KEY = "haccp-studio.wizard.step";

const state = {
    data: ensureSchema(loadState() || initialState()),
    wizardStep: parseInt(localStorage.getItem(WIZ_STEP_KEY) || "0", 10),
};

function initialState() {
    return ensureSchema({
        organization: { name: "", address: "", license: "", scale: "small", approach: "考え方を取り入れた衛生管理" },
        team: { leader: "", members: TEAM_ROLES.map(r => ({ role: r.role, name: "", trained: false, note: r.responsibility })) },
        product: {
            name: "", productGroup: "",
            spec: { category: "", standard: "" },
            packaging: "", netWeight: "", storage: "", shelfLife: "",
            heating: { tempC: "", timeSec: "" },
            allergens: [], intendedUse: "", targetUser: "", targetAge: "", consumerAdvice: "",
        },
        ingredients: [],
        steps: [],
        version: 2,
        createdAt: new Date().toISOString().slice(0, 10),
    });
}

// 旧スキーマや欠落フィールドを補正
function ensureSchema(d) {
    d.organization       ??= { name: "", address: "", license: "", scale: "small", approach: "考え方を取り入れた衛生管理" };
    d.organization.name  ??= "";
    d.organization.address ??= "";
    d.team               ??= { leader: "", members: [] };
    d.team.leader        ??= "";
    d.team.members       ??= [];
    d.product            ??= { name: "", productGroup: "", spec: {}, packaging: "", netWeight: "", storage: "", shelfLife: "", heating: {}, allergens: [], intendedUse: "", targetUser: "", targetAge: "", consumerAdvice: "" };
    d.product.name       ??= "";
    d.product.spec       ??= {};
    d.product.allergens  ??= [];
    d.product.heating    ??= {};
    d.ingredients        ??= [];
    d.steps              ??= [];
    d.hazardExtractions    ??= [];
    d.hazardEvaluations    ??= [];
    d.controlMeasures      ??= [];
    d.ccpPlan              ??= [];
    d.oprp                 ??= [];
    d.verifications        ??= [];
    d.ccpMonitoringLog     ??= [];
    d.receivingLog         ??= [];
    d.sanitationLog        ??= [];
    d.healthLog            ??= [];
    d.waterLog             ??= [];
    d.trainingLog          ??= [];
    d.temperatureLog       ??= [];
    d.calibrationLog       ??= [];
    d.allergenLog          ??= [];
    d.productTestLog       ??= [];
    d.shipmentLog          ??= [];
    d.complaintLog         ??= [];
    d.nonconformanceLog    ??= [];
    d.nonconformanceActions ??= [];
    d.correctiveActions    ??= [];
    d.internalAuditLog     ??= [];
    d.supplierAuditLog     ??= [];
    d.recallLog            ??= [];
    d.productionLog        ??= [];
    d.labelCheckLog        ??= [];
    d.environmentLog       ??= [];
    d.pestControlLog       ??= [];
    d.facilityLog          ??= [];
    d.documentRegister     ??= [];
    d.annualReview         ??= {};
    return d;
}

function loadState() {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; }
    catch { return null; }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
        localStorage.setItem(WIZ_STEP_KEY, String(state.wizardStep));
        flashSaved();
    } catch (e) {
        console.warn("Save failed:", e);
        if (e.name === "QuotaExceededError" || e.code === 22) {
            const el = document.getElementById("save-status");
            if (el) { el.textContent = "⚠ 保存容量超過"; el.classList.remove("saved"); el.classList.add("error"); }
            toast("ストレージ容量が不足しています。JSONエクスポートでデータを保存してからリセットしてください。", 6000);
        }
    }
}

let saveTimer = null;
function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 400);
}

function flashSaved() {
    const el = document.getElementById("save-status");
    if (!el) return;
    el.textContent = `保存済 ${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
    el.classList.add("saved");
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => {
        el.classList.remove("saved");
        el.textContent = "自動保存待機中";
    }, 3000);
}

function toast(msg, ms = 2200) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => el.hidden = true, ms);
}

// =================== ROUTING ===================
function getRoute() {
    const hash = location.hash || "#/wizard";
    const m = hash.match(/^#\/(wizard|dashboard|doc|p)(?:\/(.*))?$/);
    if (!m) return { type: "wizard" };
    if (m[1] === "wizard")    return { type: "wizard" };
    if (m[1] === "dashboard") return { type: "dashboard" };
    if (m[1] === "p")         return { type: "principle", key: m[2] || "ingredient-desc" };
    return { type: "doc", key: m[2] || "team" };
}

function navigate(route) { location.hash = route; }

function bindTableFilters(root) {
    root.querySelectorAll(".editable-table").forEach(table => {
        const tbody = table.querySelector("tbody");
        if (!tbody || tbody.rows.length < 4) return;
        const block = table.closest(".section-block") || table.parentElement;
        if (!block || block.querySelector(".table-filter")) return;

        const div = document.createElement("div");
        div.className = "table-filter no-print";
        div.innerHTML = `<input type="text" placeholder="🔍 テーブル内検索..." class="table-filter-input"><span class="table-filter-count"></span>`;
        block.insertBefore(div, table);

        const input  = div.querySelector(".table-filter-input");
        const countEl = div.querySelector(".table-filter-count");

        const rowText = row => {
            const parts = [];
            row.querySelectorAll("td").forEach(td => {
                const ctrl = td.querySelector("input, select, textarea");
                parts.push(ctrl ? (ctrl.value || "") : td.textContent.trim());
            });
            return parts.join(" ").toLowerCase();
        };
        const refresh = () => {
            const q = input.value.toLowerCase().trim();
            let shown = 0;
            Array.from(tbody.rows).forEach(row => {
                const match = !q || rowText(row).includes(q);
                row.style.display = match ? "" : "none";
                if (match) shown++;
            });
            countEl.textContent = q ? `${shown} / ${tbody.rows.length} 件` : `${tbody.rows.length} 件`;
        };
        input.addEventListener("input", refresh);
        refresh();
    });
}

function render() {
    const root = document.getElementById("content");
    const route = getRoute();
    try {
        if (route.type === "wizard") {
            root.innerHTML = renderWizard(state.data, state.wizardStep);
            bindWizardEvents(root);
        } else if (route.type === "dashboard") {
            root.innerHTML = renderDashboard(state.data);
        } else if (route.type === "principle") {
            root.innerHTML = renderPrinciple(route.key, state.data);
            bindCommonListEvents(root);
            bindDocEvents(root);
            bindTableFilters(root);
        } else {
            root.innerHTML = renderDoc(route.key, state.data);
            bindDocEvents(root);
            bindTableFilters(root);
        }
    } catch (err) {
        console.error("Render error:", err);
        const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        root.innerHTML = `
            <div style="padding:48px 32px;text-align:center;max-width:600px;margin:0 auto">
                <div style="font-size:48px;margin-bottom:16px">⚠️</div>
                <h2 style="color:var(--c-danger);margin-bottom:8px">表示エラーが発生しました</h2>
                <p style="color:var(--c-text-muted);margin-bottom:24px">このページの表示中に予期しないエラーが発生しました。データは保持されています。</p>
                <pre style="font-size:11px;background:#f8f8f8;padding:12px;border-radius:6px;text-align:left;overflow:auto;margin-bottom:24px;border:1px solid var(--c-border)">${esc(String(err))}</pre>
                <div style="display:flex;gap:12px;justify-content:center">
                    <button class="btn btn-ghost" onclick="location.hash='#/wizard'">ウィザードに戻る</button>
                    <button class="btn btn-primary" onclick="location.reload()">ページを再読み込み</button>
                </div>
            </div>`;
    }
    updateSidebarActive();
    updatePageTitle();
    root.setAttribute("tabindex", "-1");
    root.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
}

function updatePageTitle() {
    const route = getRoute();
    const prod = state.data.product?.name ? ` — ${state.data.product.name}` : "";
    let label;
    if (route.type === "wizard") {
        label = "ウィザード";
    } else if (route.type === "dashboard") {
        label = "ダッシュボード";
    } else {
        const routeKey = route.type === "principle" ? `#/p/${route.key}` : `#/doc/${route.key}`;
        const navEl = document.querySelector(`.nav-item[data-route="${routeKey}"]`);
        label = navEl?.textContent?.trim().replace(/^[\d]+[.:]\s*/, "").replace(/[📝📊📅🔍📋]/g, "").trim() || route.key;
    }
    document.title = `${label}${prod} — HACCP Studio`;
}

function updateSidebarActive() {
    const route = getRoute();
    let cur;
    if (route.type === "wizard")    cur = "#/wizard";
    else if (route.type === "dashboard") cur = "#/dashboard";
    else if (route.type === "principle") cur = `#/p/${route.key}`;
    else cur = `#/doc/${route.key}`;
    document.querySelectorAll(".nav-item").forEach(n => {
        n.classList.toggle("active", n.dataset.route === cur);
    });
    updateSidebarBadges();
}

function updateSidebarBadges() {
    const d = state.data;
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFail = (list, dateKey, passKey) => (list || []).filter(r =>
        r[dateKey] && new Date(r[dateKey]) >= sevenDaysAgo &&
        (r[passKey] === false || r[passKey] === "false")
    ).length;
    const sanitFail = (d.sanitationLog || []).filter(r => {
        if (!r.date || new Date(r.date) < sevenDaysAgo) return false;
        return ["facility","machines","waste","personnel","pest"].some(k => r[k] === false || r[k] === "false");
    }).length;
    const healthFail = (d.healthLog || []).filter(r =>
        r.date && new Date(r.date) >= sevenDaysAgo && r.status && r.status !== "良好"
    ).length;

    const badges = [
        { route: "#/p/hazard-extractions",  count: d.hazardExtractions?.length || 0 },
        { route: "#/p/hazard-evaluations",  count: d.hazardEvaluations?.length || 0 },
        { route: "#/p/control-measures",    count: d.controlMeasures?.length || 0 },
        { route: "#/p/oprp-plan",           count: d.oprp?.length || 0 },
        { route: "#/p/ccp-plan",            count: d.ccpPlan?.length || 0 },
        { route: "#/p/verifications",       count: d.verifications?.length || 0 },
        { route: "#/p/ccp-monitoring-log",  count: d.ccpMonitoringLog?.length || 0, alert: recentFail(d.ccpMonitoringLog, "date", "passed") },
        { route: "#/p/receiving-log",       count: d.receivingLog?.length || 0,     alert: recentFail(d.receivingLog, "date", "passed") },
        { route: "#/p/sanitation-log",      count: d.sanitationLog?.length || 0,    alert: sanitFail },
        { route: "#/p/health-log",          count: d.healthLog?.length || 0,         alert: healthFail },
        { route: "#/p/water-log",           count: d.waterLog?.length || 0,          alert: recentFail(d.waterLog, "date", "passed") },
        { route: "#/p/temperature-log",    count: d.temperatureLog?.length || 0,   alert: recentFail(d.temperatureLog, "date", "passed") },
        { route: "#/p/calibration-log",    count: d.calibrationLog?.length || 0 },
        { route: "#/p/allergen-log",       count: d.allergenLog?.length || 0,      alert: recentFail(d.allergenLog, "date", "passed") },
        { route: "#/p/product-test-log",   count: d.productTestLog?.length || 0 },
        { route: "#/p/shipment-log",       count: d.shipmentLog?.length || 0 },
        { route: "#/p/complaint-log",      count: d.complaintLog?.length || 0,    alert: (d.complaintLog||[]).filter(r=>r.status==="対応中"||r.status==="未着手").length },
        { route: "#/p/training-log",        count: d.trainingLog?.length || 0 },
        { route: "#/p/nonconformance-log",    count: d.nonconformanceLog?.length || 0 },
        { route: "#/p/nonconformance-actions", count: d.nonconformanceActions?.length || 0, alert: (d.nonconformanceActions||[]).filter(r=>r.disposition!=="廃棄完了"&&r.disposition!=="再加工完了"&&r.disposition!=="出荷可").length },
        { route: "#/p/corrective-actions",  count: d.correctiveActions?.length || 0, alert: (d.correctiveActions||[]).filter(r=>r.status!=="完了"&&r.status!=="有効性確認済み").length },
        { route: "#/p/internal-audit",  count: d.internalAuditLog?.length || 0, alert: (d.internalAuditLog||[]).filter(r=>r.status!=="完了").length },
        { route: "#/p/supplier-audit",  count: d.supplierAuditLog?.length || 0, alert: (d.supplierAuditLog||[]).filter(r=>r.result==="条件付き適合"||r.result==="不適合").length },
        { route: "#/p/recall-log",      count: d.recallLog?.length || 0,        alert: (d.recallLog||[]).filter(r=>r.status==="対応中").length },
        { route: "#/p/production-log",  count: d.productionLog?.length || 0,   alert: (d.productionLog||[]).filter(r=>r.ccpOk==="不合格").length },
        { route: "#/p/label-check-log", count: d.labelCheckLog?.length || 0,   alert: (d.labelCheckLog||[]).filter(r=>r.result==="不合格"||r.result==="要確認").length },
        { route: "#/p/environment-log",  count: d.environmentLog?.length || 0,   alert: (d.environmentLog||[]).filter(r=>r.result==="不合格").length },
        { route: "#/p/pest-control-log", count: d.pestControlLog?.length || 0,  alert: (d.pestControlLog||[]).filter(r=>r.found && r.found!=="なし").length },
        { route: "#/p/facility-log",     count: d.facilityLog?.length || 0,     alert: (d.facilityLog||[]).filter(r=>r.status==="要修繕"||r.status==="使用停止").length },
        { route: "#/p/document-register", count: d.documentRegister?.length || 0 },
    ];

    badges.forEach(({ route, count, alert = 0 }) => {
        const navItem = document.querySelector(`.nav-item[data-route="${route}"]`);
        if (!navItem) return;
        let badge = navItem.querySelector(".nav-badge");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "nav-badge";
            navItem.appendChild(badge);
        }
        if (alert > 0) {
            badge.textContent = `⚠ ${alert}`;
            badge.className = "nav-badge alert";
            badge.hidden = false;
        } else if (count > 0) {
            badge.textContent = count;
            badge.className = "nav-badge";
            badge.hidden = false;
        } else {
            badge.hidden = true;
        }
    });

    // Wizard completeness badge
    const wizPct     = calcCompleteness(d);
    const wizNavItem = document.querySelector('.nav-item[data-route="#/wizard"]');
    if (wizNavItem) {
        let wizBadge = wizNavItem.querySelector(".nav-badge");
        if (!wizBadge) {
            wizBadge = document.createElement("span");
            wizBadge.className = "nav-badge";
            wizNavItem.appendChild(wizBadge);
        }
        if (wizPct >= 100) {
            wizBadge.textContent = "✓";
            wizBadge.className   = "nav-badge";
            wizBadge.hidden      = false;
        } else {
            wizBadge.textContent = `${wizPct}%`;
            wizBadge.className   = wizPct < 50 ? "nav-badge alert" : "nav-badge";
            wizBadge.hidden      = false;
        }
    }
}

// =================== COMMON LIST EVENTS (used by principles) ===================
function bindCommonListEvents(root) {
    // 編集 (data-list-edit を持つ input/select/textarea)
    root.querySelectorAll("[data-list-edit]").forEach(el => {
        const handler = () => {
            const listKey = el.dataset.list;
            const idx = parseInt(el.dataset.index, 10);
            const key = el.dataset.key;
            const list = getList(listKey);
            const item = list[idx];
            if (!item) return;
            const value = parseValue(el);
            setNested(item, key, value);
            debouncedSave();
        };
        el.addEventListener("input", handler);
        el.addEventListener("change", handler);
    });

    // 不適合処置: ラジオボタン (sub-option)
    root.querySelectorAll("[data-nc-sub]").forEach(el => {
        el.addEventListener("change", () => {
            const idx = parseInt(el.dataset.index, 10);
            const dispType = el.dataset.dispType;
            const list = getList("nonconformanceActions");
            const item = list[idx];
            if (!item) return;
            if (!item.disposition) item.disposition = {};
            item.disposition.type = dispType;
            item.disposition.subOption = el.value;
            debouncedSave();
            render(); // ハイライト更新のため再描画
        });
    });

    // 原料記述書: アレルゲンチェックボックス
    root.querySelectorAll("[data-ing-allergen]").forEach(el => {
        el.addEventListener("change", () => {
            const idx = parseInt(el.dataset.index, 10);
            const list = getList("ingredients");
            const item = list[idx];
            if (!item) return;
            const set = new Set(item.allergens || []);
            if (el.checked) set.add(el.value); else set.delete(el.value);
            item.allergens = [...set];
            debouncedSave();
        });
    });

    // 削除
    root.querySelectorAll("[data-list-action='remove']").forEach(b => b.addEventListener("click", () => {
        const listKey = b.dataset.list;
        const idx = parseInt(b.dataset.index, 10);
        if (!confirm("この行を削除します。よろしいですか？")) return;
        const list = getList(listKey);
        list.splice(idx, 1);
        saveState(); render();
    }));

    // 追加
    root.querySelectorAll("[data-list-add]").forEach(b => b.addEventListener("click", () => {
        const listKey = b.dataset.listAdd;
        const list = getList(listKey);
        let template = {};
        if (b.dataset.template) {
            try { template = JSON.parse(b.dataset.template.replace(/&#39;/g, "'")); } catch (e) { console.warn(e); }
        }
        list.push(template);
        saveState(); render();
    }));

    // テーブル検索フィルター — 既存のdata-table-search属性から
    root.querySelectorAll("[data-table-search]").forEach(input => {
        const tableId = input.dataset.tableSearch;
        const table = root.querySelector(`[data-table-id="${tableId}"]`);
        if (!table) return;
        input.addEventListener("input", () => {
            const q = input.value.trim().toLowerCase();
            table.querySelectorAll("tbody tr").forEach(tr => {
                tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? "" : "none";
            });
        });
    });

    // 編集テーブルに動的に検索ボックス＆ソートを追加 (行数が5件以上のテーブル)
    root.querySelectorAll(".editable-table").forEach((table) => {
        const tbody = table.querySelector("tbody");
        if (!tbody || tbody.querySelectorAll("tr").length < 5) return;
        if (table.previousElementSibling?.classList?.contains("table-search-bar")) return;

        // 検索バー
        const bar = document.createElement("div");
        bar.className = "table-search-bar no-print";
        bar.style.cssText = "margin-bottom:6px;display:flex;align-items:center;gap:6px";
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "🔍 絞り込み検索...";
        input.style.cssText = "font-size:12px;padding:4px 8px;border:1px solid var(--c-border);border-radius:4px;width:200px;outline:none";
        const countSpan = document.createElement("span");
        countSpan.style.cssText = "font-size:11px;color:var(--c-text-muted)";
        const totalRows = tbody.querySelectorAll("tr").length;
        countSpan.textContent = `${totalRows}件`;
        const updateFilter = () => {
            const q = input.value.trim().toLowerCase();
            let visible = 0;
            tbody.querySelectorAll("tr").forEach(tr => {
                const show = !q || tr.textContent.toLowerCase().includes(q);
                tr.style.display = show ? "" : "none";
                if (show) visible++;
            });
            countSpan.textContent = q ? `${visible} / ${totalRows}件` : `${totalRows}件`;
        };
        input.addEventListener("input", updateFilter);
        bar.appendChild(input);
        bar.appendChild(countSpan);
        table.parentElement.insertBefore(bar, table);

        // カラムソート — クリックで昇順/降順切替
        const sortState = { col: -1, asc: true };
        table.querySelectorAll("thead th").forEach((th, colIdx) => {
            th.style.cursor = "pointer";
            th.title = "クリックでソート";
            th.addEventListener("click", () => {
                if (sortState.col === colIdx) sortState.asc = !sortState.asc;
                else { sortState.col = colIdx; sortState.asc = true; }
                const rows = [...tbody.querySelectorAll("tr")];
                rows.sort((a, b) => {
                    const aText = a.cells[colIdx]?.textContent?.trim() || "";
                    const bText = b.cells[colIdx]?.textContent?.trim() || "";
                    const aNum = parseFloat(aText); const bNum = parseFloat(bText);
                    const cmp = (!isNaN(aNum) && !isNaN(bNum)) ? aNum - bNum : aText.localeCompare(bText, "ja");
                    return sortState.asc ? cmp : -cmp;
                });
                rows.forEach(r => tbody.appendChild(r));
                table.querySelectorAll("thead th").forEach((h, i) => {
                    h.textContent = h.textContent.replace(/ [▲▼]$/, "");
                    if (i === colIdx) h.textContent += sortState.asc ? " ▲" : " ▼";
                });
            });
        });
    });

    // ロット追跡照会 — 検索ボタン・Enterキー
    const lotBtn   = root.querySelector("#lot-trace-btn");
    const lotInput = root.querySelector("#lot-trace-input");
    if (lotBtn && lotInput) {
        const runLotSearch = () => {
            const q = lotInput.value.trim().toLowerCase();
            const el = root.querySelector("#lot-trace-results");
            if (!q || !el) return;
            const st = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            const results = [];
            const hit = v => String(v ?? "").toLowerCase().includes(q);
            const check = (label, route, list, fields) => {
                const matches = (list || []).filter(r => fields.some(f => hit(r[f])));
                if (matches.length) results.push({ label, route, matches });
            };
            check("原材料受入記録",       "#/p/receiving-log",          st.receivingLog,          ["lot","ingName","supplier","date","note"]);
            check("CCPモニタリング記録",  "#/p/ccp-monitoring-log",     st.ccpMonitoringLog,      ["lot","ccpNo","processName","date","note","measuredValue"]);
            check("衛生点検記録",         "#/p/sanitation-log",         st.sanitationLog,         ["date","shift","note"]);
            check("アレルゲン確認記録",   "#/p/allergen-log",           st.allergenLog,           ["date","prevProduct","type","note"]);
            check("製品検査記録",         "#/p/product-test-log",       st.productTestLog,        ["lot","testType","result","reportNo","note"]);
            check("製品出荷記録",         "#/p/shipment-log",           st.shipmentLog,           ["lot","productName","destination","date","note"]);
            check("クレーム対応記録",     "#/p/complaint-log",          st.complaintLog,          ["lot","claimNo","customer","category","content","receivedDate"]);
            check("不適合製品処置書",     "#/p/nonconformance-actions", st.nonconformanceActions, ["lot","identNo","productName","department","note"]);
            check("是正処置書",           "#/p/corrective-actions",     st.correctiveActions,     ["identNo","content","rootCause","source"]);
            check("製造工程日報",         "#/p/production-log",         st.productionLog,          ["date","lot","productName","operator","note"]);
            check("製品回収記録",         "#/p/recall-log",             st.recallLog,              ["recallNo","lot","productName","cause","destination","note"]);
            check("食品表示確認記録",     "#/p/label-check-log",        st.labelCheckLog,          ["date","lot","productName","checker","note"]);
            check("環境モニタリング記録", "#/p/environment-log",        st.environmentLog,         ["date","testType","location","target","tester","note"]);
            check("害虫防除記録",         "#/p/pest-control-log",       st.pestControlLog,         ["date","checkType","location","pestType","action","note"]);
            check("施設設備点検記録",     "#/p/facility-log",           st.facilityLog,            ["date","area","target","detail","action","note"]);
            if (!results.length) {
                el.innerHTML = `<div style="color:var(--c-text-muted);padding:16px 0">「${q}」に一致する記録は見つかりませんでした。</div>`;
                return;
            }
            const total = results.reduce((s, r) => s + r.matches.length, 0);
            const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const mark = v => String(v).replace(new RegExp(`(${esc(q)})`, "gi"), '<mark style="background:#fef08a">$1</mark>');
            let html = `<div style="font-weight:600;margin-bottom:12px;color:var(--c-success)">✅ ${total}件の記録が見つかりました</div>`;
            results.forEach(({ label, route, matches }) => {
                html += `<div style="margin-bottom:16px">`;
                html += `<div style="font-weight:700;font-size:12px;color:var(--c-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${label} (${matches.length}件) <a href="${route}" style="font-weight:400;font-size:11px;color:var(--c-primary);text-decoration:none">→ 開く</a></div>`;
                html += `<table style="width:100%;border-collapse:collapse;font-size:12px"><tbody>`;
                matches.forEach(r => {
                    const cells = Object.entries(r)
                        .filter(([k, v]) => k !== "id" && v && hit(v))
                        .slice(0, 4)
                        .map(([, v]) => `<td style="padding:4px 8px;border:1px solid var(--c-border)">${mark(v)}</td>`)
                        .join("");
                    html += `<tr>${cells}</tr>`;
                });
                html += `</tbody></table></div>`;
            });
            el.innerHTML = html;
        };
        lotBtn.addEventListener("click", runLotSearch);
        lotInput.addEventListener("keydown", e => { if (e.key === "Enter") runLotSearch(); });
    }

    // 雛形生成 (✨ ボタン)
    root.querySelectorAll("[data-template-gen]").forEach(b => b.addEventListener("click", () => {
        const key = b.dataset.templateGen;
        const gen = TEMPLATE_GENERATORS[key];
        if (!gen) return;
        // 前提条件チェック
        const preCheck = checkTemplatePrereq(key, state.data);
        if (preCheck) { alert(preCheck); return; }
        if (!confirm(`${gen.label}\n\n既存の編集行は保持し、未生成の項目を追加します。実行しますか？`)) return;
        const result = gen.fn(state.data);
        saveState(); render();
        toast(`雛形を ${result.added} 件追加しました（合計 ${result.total} 件）`);
    }));
}

function checkTemplatePrereq(key, d) {
    if (key === "ingredient-desc"     && !(d.ingredients?.length)) return "原材料が未入力です。先にウィザードから原材料を登録してください。";
    if (key === "hazard-extractions"  && !(d.ingredients?.length) && !(d.steps?.length)) return "原材料・工程が未入力です。先にウィザードから登録してください。";
    if (key === "hazard-evaluations"  && !(d.hazardExtractions?.length)) return "危害抽出書が未入力です。先に「危害抽出書」タブで雛形を生成してください。";
    if (key === "control-measures"    && !(d.hazardEvaluations?.length)) return "ハザード評価表が未入力です。先に「ハザード評価表」タブで雛形を生成してください。";
    if (key === "oprp-plan"           && !(d.controlMeasures?.length)) return "管理手段選択分類表が未入力です。先に「管理手段選択分類表」タブで雛形を生成してください。";
    if (key === "ccp-monitoring-log" && !(d.ccpPlan?.length))         return "HACCPプランが未入力です。先に「HACCPプラン」タブで雛形を生成してください。";
    if (key === "receiving-log"      && !(d.ingredients?.length))     return "原材料が未入力です。先にウィザードから原材料を登録してください。";
    if (key === "sanitation-log"     && !(d.product?.name))           return "製品情報が未入力です。先にウィザードから入力してください。";
    if (key === "health-log"         && !(d.product?.name))           return "製品情報が未入力です。先にウィザードから入力してください。";
    if (key === "water-log"          && !(d.product?.name))           return "製品情報が未入力です。先にウィザードから入力してください。";
    if (key === "training-log"       && !(d.product?.name))           return "製品情報が未入力です。先にウィザードから入力してください。";
    if (key === "temperature-log"    && !(d.product?.name))           return "製品情報が未入力です。先にウィザードから入力してください。";
    if (key === "calibration-log"    && !(d.product?.name))           return "製品情報が未入力です。先にウィザードから入力してください。";
    if (key === "ccp-plan"            && !(d.controlMeasures?.length)) return "管理手段選択分類表が未入力です。先に「管理手段選択分類表」タブで雛形を生成してください。";
    if (key === "verifications"       && !(d.ccpPlan?.length)) return "HACCPプランが未入力です。先に「HACCPプラン」タブで雛形を生成してください。";
    if (key === "production-log"      && !(d.product?.name))  return "製品情報が未入力です。先にウィザードから入力してください。";
    if (key === "nonconformance-log"  && !(d.nonconformanceActions?.length)) return "不適合処置書（4-2）が未入力です。先に「不適合製品処置書」タブで記録を追加してください。";
    return null;
}

function setNested(obj, path, value) {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (cur[parts[i]] === undefined || cur[parts[i]] === null) cur[parts[i]] = {};
        cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
}

// =================== WIZARD EVENTS ===================
function bindWizardEvents(root) {
    root.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", e => {
        const i = parseInt(e.currentTarget.dataset.goto, 10);
        state.wizardStep = i; saveState(); render();
    }));
    root.querySelectorAll("[data-wizard-action]").forEach(b => b.addEventListener("click", e => {
        const action = e.currentTarget.dataset.wizardAction;
        const total = getWizardSteps().length;
        if (action === "prev" && state.wizardStep > 0) state.wizardStep -= 1;
        else if (action === "next" && state.wizardStep < total - 1) state.wizardStep += 1;
        else if (action === "finish") {
            saveState();
            const hasAnyPrincipleData = (state.data.hazardExtractions?.length || 0) + (state.data.hazardEvaluations?.length || 0) + (state.data.ccpPlan?.length || 0) > 0;
            if (!hasAnyPrincipleData) {
                if (confirm("入力した原材料・工程から、原則1〜7の各様式（危害抽出書・ハザード評価表・管理手段選択分類表・HACCPプラン・検証記録）の雛形を一括生成しますか？\n\n生成後は各タブで自由に編集できます。")) {
                    const r = generateAllTemplates(state.data);
                    saveState();
                    toast(r.summary, 5000);
                }
            }
            navigate("#/dashboard");
            return;
        }
        saveState(); render();
    }));
    root.querySelectorAll("[data-bind]").forEach(el => {
        el.addEventListener("input", () => { setNested(state.data, el.dataset.bind, parseValue(el)); debouncedSave(); });
        el.addEventListener("change", () => { setNested(state.data, el.dataset.bind, parseValue(el)); debouncedSave(); });
    });
    root.querySelectorAll("[data-bind-allergen]").forEach(el => {
        el.addEventListener("change", () => {
            const set = new Set(state.data.product.allergens || []);
            if (el.checked) set.add(el.value); else set.delete(el.value);
            state.data.product.allergens = [...set];
            debouncedSave();
        });
    });
    // noAllergens toggle — gray out allergen grid immediately without waiting for full re-render
    const noAllergenCb = root.querySelector("[data-bind='product.noAllergens']");
    if (noAllergenCb) {
        const allergenGrid = root.querySelector(".checkbox-grid");
        const applyToggle = () => {
            if (allergenGrid) {
                allergenGrid.style.opacity       = noAllergenCb.checked ? "0.4" : "";
                allergenGrid.style.pointerEvents = noAllergenCb.checked ? "none" : "";
            }
        };
        noAllergenCb.addEventListener("change", applyToggle);
    }
    root.querySelectorAll("[data-list]").forEach(rowEl => {
        const listKey = rowEl.dataset.list;
        const idx = parseInt(rowEl.dataset.index, 10);
        rowEl.querySelectorAll("[data-bind-list]").forEach(input => {
            const handler = () => updateListItem(listKey, idx, input.dataset.bindList, parseValue(input));
            input.addEventListener("input", handler);
            input.addEventListener("change", handler);
        });
        rowEl.querySelectorAll("[data-bind-list-allergen]").forEach(cb => {
            cb.addEventListener("change", () => {
                const list = getList(listKey);
                const item = list[idx];
                const set = new Set(item.allergens || []);
                if (cb.checked) set.add(cb.value); else set.delete(cb.value);
                item.allergens = [...set];
                debouncedSave();
            });
        });
        rowEl.querySelectorAll("[data-list-action]").forEach(b => b.addEventListener("click", e => {
            const action = e.currentTarget.dataset.listAction;
            const list = getList(listKey);
            if (action === "remove") list.splice(idx, 1);
            else if (action === "up" && idx > 0) [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
            else if (action === "down" && idx < list.length - 1) [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
            renumberSteps();
            saveState(); render();
        }));
    });
    root.querySelectorAll("[data-list-add]").forEach(b => b.addEventListener("click", e => {
        const key = e.currentTarget.dataset.listAdd;
        const list = getList(key);
        if (key === "team")        list.push({ role: "新規メンバー", name: "", trained: false, note: "" });
        if (key === "ingredients") list.push({ ingNo: "", catNo: "", name: "", supplier: "", origin: "", spec: "", allergens: [], desc: {} });
        if (key === "steps") {
            const seq = list.length + 1;
            list.push({ seq, type: "prep", name: "新規工程", params: "" });
        }
        saveState(); render();
    }));
}

function updateListItem(listKey, idx, field, value) {
    const list = getList(listKey);
    const item = list[idx];
    if (!item) return;
    if (listKey === "steps" && field === "type") {
        const def = PROCESS_TYPES.find(p => p.code === value);
        if (def && (!item.params || item.params === "")) item.params = def.defaultParam;
        if (!item.name || item.name === "新規工程" || PROCESS_TYPES.some(p => p.name === item.name)) {
            item.name = def?.name || item.name;
        }
    }
    if (field === "trained") value = (value === "true" || value === true);
    item[field] = value;
    debouncedSave();
}

function getList(key) {
    if (key === "team") {
        if (!state.data.team) state.data.team = { leader: "", members: [] };
        if (!state.data.team.members) state.data.team.members = [];
        return state.data.team.members;
    }
    if (!state.data[key]) state.data[key] = [];
    return state.data[key];
}

function renumberSteps() {
    (state.data.steps || []).forEach((s, i) => s.seq = i + 1);
}

function parseValue(el) {
    if (el.type === "checkbox") return el.checked;
    if (el.type === "radio") return el.value;
    if (el.type === "number") { const n = parseFloat(el.value); return Number.isNaN(n) ? "" : n; }
    return el.value;
}

// =================== DOC EVENTS ===================
function buildDocumentList(d) {
    const leader = d.team?.leader || "HACCP責任者";
    const yr = new Date().getFullYear();
    const reviewDate = `${yr + 1}-03-31`;
    const today = new Date().toISOString().slice(0, 10);
    return [
        { docId:"HD-01", docName:"HACCPチーム名簿",           category:"HACCP計画",  revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-02", docName:"製品説明書",                 category:"HACCP計画",  revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-03", docName:"フローダイアグラム",          category:"HACCP計画",  revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-04", docName:"危害要因分析表",             category:"HACCP計画",  revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-05", docName:"HACCPプラン",               category:"HACCP計画",  revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-06", docName:"O-PRPプラン",               category:"HACCP計画",  revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-07", docName:"ハザード評価表",             category:"HACCP計画",  revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"PP-01", docName:"一般衛生管理計画（PRP）",    category:"管理計画",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"衛生管理フォルダ", note:"" },
        { docId:"PP-02", docName:"アレルゲン管理手順",         category:"管理計画",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"衛生管理フォルダ", note:"" },
        { docId:"RC-01", docName:"CCPモニタリング記録",        category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-02", docName:"原材料受入記録",             category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-03", docName:"衛生点検・清掃消毒記録",     category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-04", docName:"従事者健康確認記録",         category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-05", docName:"冷蔵・冷凍温度記録",        category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-06", docName:"機器校正記録",               category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-07", docName:"製品検査記録",               category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-08", docName:"製品出荷記録",               category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-09", docName:"クレーム対応記録",           category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-10", docName:"教育訓練記録",               category:"運用記録",   revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"NC-01", docName:"不適合製品処置書（4-2）",    category:"不適合管理", revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"不適合管理フォルダ", note:"" },
        { docId:"NC-02", docName:"不適合管理表（4-3）",        category:"不適合管理", revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"不適合管理フォルダ", note:"" },
        { docId:"NC-03", docName:"是正処置書（5-1）",          category:"不適合管理", revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"不適合管理フォルダ", note:"" },
        { docId:"VF-01", docName:"検証記録（原則6）",          category:"検証・監査", revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"検証フォルダ", note:"" },
        { docId:"VF-02", docName:"内部監査チェックリスト",     category:"検証・監査", revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"検証フォルダ", note:"" },
        { docId:"VF-03", docName:"仕入先評価記録",             category:"検証・監査", revision:"1.0", approvedDate:today, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"検証フォルダ", note:"" },
    ];
}

function bindDocEvents(root) {
    const monthInput = root.querySelector("[data-monthly-month]");
    if (monthInput) {
        monthInput.addEventListener("change", () => {
            state.data.monthlyReportMonth = monthInput.value;
            render();
        });
    }

    const calYearSel = root.querySelector("[data-annual-calendar-year]");
    if (calYearSel) {
        calYearSel.addEventListener("change", () => {
            state.data.annualCalendarYear = calYearSel.value;
            render();
        });
    }

    root.querySelectorAll("[data-annual-review]").forEach(el => {
        el.addEventListener("change", () => {
            const key = el.dataset.annualReview;
            if (!state.data.annualReview) state.data.annualReview = {};
            state.data.annualReview[key] = el.type === "checkbox" ? el.checked : el.value;
            debouncedSave();
            if (key === "reviewYear") render();
        });
        el.addEventListener("input", () => {
            const key = el.dataset.annualReview;
            if (!state.data.annualReview) state.data.annualReview = {};
            state.data.annualReview[key] = el.value;
            debouncedSave();
        });
    });

    root.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", e => {
        const action = e.currentTarget.dataset.action;
        const docEl = e.currentTarget.closest(".doc");
        const sel = docEl ? `.doc[data-doc="${docEl.dataset.doc}"]` : null;
        if (action === "print") exportPdfViaPrint(sel);
        if (action === "excel") exportXlsx(state.data);
        if (action === "init-document-register") {
            if (!confirm("自動生成した文書リストを台帳に登録します。登録後は版番号・承認日などを編集できます。\n\n（既存の台帳データは置き換えられます）")) return;
            state.data.documentRegister = buildDocumentList(state.data);
            saveState(); render();
            toast(`文書管理台帳を初期化しました（${state.data.documentRegister.length} 件）`);
        }
    }));
}

// =================== TOPBAR ACTIONS ===================
function bindTopbar() {
    document.getElementById("btn-load-sample").addEventListener("click", () => {
        if (!confirm("現在の入力を破棄して、サンプル「冷凍唐揚げ」を読み込みます。よろしいですか？")) return;
        state.data = ensureSchema(JSON.parse(JSON.stringify(SAMPLE_FROZEN_KARAAGE)));
        state.wizardStep = 6;
        saveState();
        navigate("#/dashboard");
        toast("サンプル「冷凍唐揚げ」を読み込みました");
    });

    document.getElementById("btn-new").addEventListener("click", () => {
        if (!confirm("現在の入力をすべて消去して新規作成を開始します。よろしいですか？")) return;
        state.data = initialState();
        state.wizardStep = 0;
        saveState(); navigate("#/wizard"); render();
        toast("新規作成を開始しました — ウィザードに製品情報を入力してください");
    });

    document.getElementById("btn-gen-all").addEventListener("click", () => {
        const d = state.data;
        if (!(d.ingredients?.length) && !(d.steps?.length)) {
            alert("ウィザードで原材料と工程を先に入力してください。");
            navigate("#/wizard");
            return;
        }
        if (!confirm("ウィザード入力（原材料・工程・アレルゲン）を元に、原則1〜7の全様式（原料記述書・危害抽出書・ハザード評価表・管理手段選択分類表・HACCPプラン・検証記録）の雛形を一括生成します。\n\n既存の編集行は保持され、未生成の項目だけが追加されます。実行しますか？")) return;
        const r = generateAllTemplates(d);
        saveState(); render();
        toast(r.summary, 6000);
    });

    document.getElementById("btn-export-json").addEventListener("click", () => exportJson(state.data));

    document.getElementById("btn-import").addEventListener("click", () => document.getElementById("file-import").click());
    document.getElementById("file-import").addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await importJson(file);
            state.data = ensureSchema(data);
            saveState(); render();
            toast("JSONを取り込みました");
        } catch (err) { alert("JSONの読み込みに失敗しました: " + err.message); }
        e.target.value = "";
    });

    document.getElementById("btn-export-excel").addEventListener("click", () => exportXlsx(state.data));
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        navigate("#/doc/all");
        setTimeout(() => exportPdfViaPrint(), 300);
    });

    document.getElementById("btn-reset").addEventListener("click", () => {
        if (!confirm("すべての入力を消去します。よろしいですか？")) return;
        state.data = initialState();
        state.wizardStep = 0;
        saveState(); navigate("#/wizard"); render();
        toast("入力を初期化しました");
    });

    document.querySelectorAll(".nav-item").forEach(n => n.addEventListener("click", () => {
        const route = n.dataset.route;
        if (route) navigate(route);
        closeSidebar();
    }));

    const toggleBtn = document.getElementById("btn-sidebar-toggle");
    const overlay   = document.getElementById("sidebar-overlay");
    const sidebar   = document.getElementById("sidebar");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("open");
            toggleBtn.setAttribute("aria-expanded", String(isOpen));
            overlay.classList.toggle("active", isOpen);
            overlay.hidden = !isOpen;
        });
    }
    if (overlay) {
        overlay.addEventListener("click", closeSidebar);
    }
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeSidebar();
    });
}

function closeSidebar() {
    const sidebar   = document.getElementById("sidebar");
    const overlay   = document.getElementById("sidebar-overlay");
    const toggleBtn = document.getElementById("btn-sidebar-toggle");
    sidebar?.classList.remove("open");
    overlay?.classList.remove("active");
    if (overlay) overlay.hidden = true;
    toggleBtn?.setAttribute("aria-expanded", "false");
}

// =================== PRINT PRE/POST PROCESSING ===================
// Before printing: replace form controls with plain text so editable tables look clean
window.addEventListener("beforeprint", () => {
    // Inject company / approval header into each printed document
    const d = state.data;
    const org  = d.organization?.name  || "—";
    const lead = d.team?.leader        || "—";
    const prod = d.product?.name       || "—";
    const today = new Date().toISOString().slice(0, 10);
    document.querySelectorAll(".doc").forEach(doc => {
        if (doc.querySelector(".doc-print-header")) return;
        const title = doc.querySelector(".doc-title")?.textContent || "";
        const hdr = document.createElement("div");
        hdr.className = "doc-print-header";
        hdr.innerHTML = `
          <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px;border:1px solid #555">
            <tbody>
              <tr>
                <td style="border:1px solid #555;padding:3px 6px;width:14%;font-weight:700">事業者名</td>
                <td style="border:1px solid #555;padding:3px 6px;width:36%">${String(org).replace(/[&<>"']/g,c=>({...{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}}[c]))}</td>
                <td style="border:1px solid #555;padding:3px 6px;width:14%;font-weight:700">管理責任者</td>
                <td style="border:1px solid #555;padding:3px 6px;width:36%">${String(lead).replace(/[&<>"']/g,c=>({...{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}}[c]))}</td>
              </tr>
              <tr>
                <td style="border:1px solid #555;padding:3px 6px;font-weight:700">対象製品</td>
                <td style="border:1px solid #555;padding:3px 6px">${String(prod).replace(/[&<>"']/g,c=>({...{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}}[c]))}</td>
                <td style="border:1px solid #555;padding:3px 6px;font-weight:700">出力日</td>
                <td style="border:1px solid #555;padding:3px 6px">${today}</td>
              </tr>
              <tr>
                <td style="border:1px solid #555;padding:3px 6px;font-weight:700">確認者</td>
                <td style="border:1px solid #555;padding:3px 6px">&nbsp;</td>
                <td style="border:1px solid #555;padding:3px 6px;font-weight:700">承認者</td>
                <td style="border:1px solid #555;padding:3px 6px">&nbsp;</td>
              </tr>
            </tbody>
          </table>`;
        doc.insertBefore(hdr, doc.firstChild);
    });

    document.querySelectorAll(".editable-table").forEach(table => {
        // Replace form controls with plain text spans
        table.querySelectorAll("td").forEach(td => {
            const el = td.querySelector("input, select, textarea");
            if (!el) return;
            let text;
            if (el.type === "checkbox") text = el.checked ? "○" : "—";
            else if (el.tagName === "SELECT") text = el.options[el.selectedIndex]?.text || "";
            else text = el.value;
            const span = document.createElement("span");
            span.className = "__pv";
            span.style.cssText = "font-size:12px;white-space:pre-wrap;word-break:break-word";
            span.textContent = text;
            td.insertBefore(span, el);
            el.classList.add("__ph");
        });
        // Hide delete column (last th/td in each row)
        table.querySelectorAll("tr").forEach(tr => {
            const last = tr.lastElementChild;
            if (last) last.classList.add("__ph");
        });
    });
    // Hide dynamic search/filter bars injected by bindCommonListEvents / bindTableFilters
    document.querySelectorAll(".table-search-bar, .table-filter").forEach(el => el.classList.add("__ph"));
});

window.addEventListener("afterprint", () => {
    document.querySelectorAll(".__pv").forEach(s => s.remove());
    document.querySelectorAll(".__ph").forEach(el => el.classList.remove("__ph"));
    document.querySelectorAll(".doc-print-header").forEach(el => el.remove());
});

// =================== KEYBOARD SHORTCUTS ===================
document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        exportJson(state.data);
        toast("JSONをダウンロードしました (Ctrl+S)");
    }
    // Wizard: left/right arrow keys on stepper buttons change steps
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const focused = document.activeElement;
        if (!focused?.classList?.contains("stepper-pill")) return;
        const pills = [...document.querySelectorAll(".stepper-pill")];
        const idx = pills.indexOf(focused);
        if (e.key === "ArrowRight" && idx < pills.length - 1) pills[idx + 1].focus();
        if (e.key === "ArrowLeft"  && idx > 0)               pills[idx - 1].focus();
    }
});

// =================== INIT ===================
window.addEventListener("hashchange", render);
const SIDEBAR_COLLAPSE_KEY = "haccp-studio.sidebar.collapsed";

function bindSidebarCollapse() {
    const saved = (() => { try { return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_KEY) || "[]"); } catch { return []; } })();
    document.querySelectorAll(".sidebar-section").forEach((section, i) => {
        if (saved.includes(i)) section.classList.add("collapsed");
        const title = section.querySelector(".sidebar-title");
        if (!title) return;
        title.addEventListener("click", () => {
            section.classList.toggle("collapsed");
            const collapsed = [];
            document.querySelectorAll(".sidebar-section").forEach((s, j) => { if (s.classList.contains("collapsed")) collapsed.push(j); });
            localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(collapsed));
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    bindTopbar();
    bindSidebarCollapse();
    if (!location.hash) location.hash = "#/wizard";
    render();
    if (!state.data.product?.name) {
        setTimeout(() => toast("「サンプル読込」ボタンで冷凍唐揚げのデモを試せます"), 600);
    } else {
        flashSaved();
    }
});
