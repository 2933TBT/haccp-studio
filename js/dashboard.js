// HACCP Studio — ダッシュボード (進捗・アラート概要)
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

function recentDays(list, dateKey, days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return (list || []).filter(r => r[dateKey] && new Date(r[dateKey]) >= cutoff);
}

function dashCard(title, label, icon, route, cssExtra = "") {
    return `<div class="dash-card${cssExtra ? " " + cssExtra : ""}" onclick="location.hash='${route}'" style="cursor:pointer" role="button" tabindex="0">
      <div class="dash-card-icon">${icon}</div>
      <div>
        <div class="dash-card-title">${esc(title)}</div>
        <div class="dash-card-count">${esc(String(label))}</div>
      </div>
    </div>`;
}

export function renderDashboard(state) {
    const today = new Date().toISOString().slice(0, 10);

    const planItems = [
        { label: "危害抽出書", key: "hazardExtractions", route: "#/p/hazard-extractions", icon: "📋" },
        { label: "ハザード評価表", key: "hazardEvaluations", route: "#/p/hazard-evaluations", icon: "⚖️" },
        { label: "管理手段選択", key: "controlMeasures", route: "#/p/control-measures", icon: "🔧" },
        { label: "O-PRPプラン", key: "oprp", route: "#/p/oprp-plan", icon: "📝" },
        { label: "HACCPプラン", key: "ccpPlan", route: "#/p/ccp-plan", icon: "🎯" },
        { label: "検証記録", key: "verifications", route: "#/p/verifications", icon: "✅" },
    ];

    const r7ccp    = recentDays(state.ccpMonitoringLog, "date");
    const r7recv   = recentDays(state.receivingLog, "date");
    const r7san    = recentDays(state.sanitationLog, "date");
    const r7health = recentDays(state.healthLog, "date");
    const r7water  = recentDays(state.waterLog, "date");
    const r7temp    = recentDays(state.temperatureLog, "date");
    const r30train   = recentDays(state.trainingLog, "date", 30);
    const r90calib   = recentDays(state.calibrationLog, "date", 90);
    const r30test    = recentDays(state.productTestLog, "date", 30);
    const r7allergen = recentDays(state.allergenLog, "date");
    const r30ship    = recentDays(state.shipmentLog, "date", 30);
    const allComplaints = state.complaintLog || [];
    const allNcActions  = state.nonconformanceActions || [];
    const allNcLog      = state.nonconformanceLog || [];
    const allCa         = state.correctiveActions || [];
    const r30pest       = recentDays(state.pestControlLog, "date", 30);
    const r30facility   = recentDays(state.facilityLog, "date", 30);
    const r30env        = recentDays(state.environmentLog, "date", 30);
    const r30label      = recentDays(state.labelCheckLog, "date", 30);

    const SANIT_KEYS = ["facility", "machines", "waste", "personnel", "pest"];
    const failCcp    = r7ccp.filter(r => r.passed === false || r.passed === "false");
    const failRecv   = r7recv.filter(r => r.passed === false || r.passed === "false");
    const failSan    = r7san.filter(r => SANIT_KEYS.some(k => r[k] === false || r[k] === "false"));
    const failHealth = r7health.filter(r => r.status && r.status !== "良好");
    const failWater  = r7water.filter(r => r.passed === false || r.passed === "false");
    const failTemp    = r7temp.filter(r => r.passed === false || r.passed === "false");
    const failCalib    = r90calib.filter(r => r.result === "不合格" || r.result === "要調整");
    const failTest     = r30test.filter(r => r.judgment === "不合格" || r.judgment === "陽性");
    const failAllergen = r7allergen.filter(r => r.passed === false || r.passed === "false");
    const openComplaints  = allComplaints.filter(r => r.status === "対応中" || r.status === "未着手");
    const openNcActions   = allNcActions.filter(r => r.disposition !== "廃棄完了" && r.disposition !== "再加工完了" && r.disposition !== "出荷可");
    const openCa          = allCa.filter(r => r.status !== "完了" && r.status !== "有効性確認済み");
    const foundPest       = r30pest.filter(r => r.found && r.found !== "なし");
    const failFacility    = r30facility.filter(r => r.status === "要修繕" || r.status === "使用停止");
    const failEnv         = r30env.filter(r => r.result === "不合格");
    const failLabel       = r30label.filter(r => r.result !== "合格" && r.result);
    const openRecalls     = (state.recallLog || []).filter(r => r.status === "対応中");

    const alerts = [];
    failCcp.forEach(r     => alerts.push({ date: r.date, level: "danger", text: `CCPモニタリング不合格 — ${r.ccpNo || ""} ${r.processName || ""}（測定値: ${r.measuredValue || "—"}）` }));
    failRecv.forEach(r    => alerts.push({ date: r.date, level: "danger", text: `原材料受入不合格 — ${r.ingName || ""}（${r.supplier || ""}）` }));
    failSan.forEach(r     => alerts.push({ date: r.date, level: "warn",   text: `衛生点検 異常あり — ${r.date} ${r.shift || ""}` }));
    failHealth.forEach(r  => alerts.push({ date: r.date, level: "danger", text: `健康確認 要注意 — ${r.name || ""}: ${r.status || ""}` }));
    failWater.forEach(r   => alerts.push({ date: r.date, level: "warn",   text: `使用水確認 不適合 — ${r.date}` }));
    failTemp.forEach(r    => alerts.push({ date: r.date, level: "warn",   text: `温度管理 不適合 — ${r.date} ${r.unit || ""} (${r.measured || "—"}℃)` }));
    failCalib.forEach(r   => alerts.push({ date: r.date, level: "danger", text: `機器校正 要注意 — ${r.equipment || ""}: ${r.result || ""}` }));
    failAllergen.forEach(r=> alerts.push({ date: r.date, level: "danger", text: `アレルゲン確認 NG — ${r.date} ${r.type || ""} (${r.prevProduct || ""})` }));
    failTest.forEach(r    => alerts.push({ date: r.date, level: "danger", text: `製品検査 不合格 — ${r.testType || ""} / ${r.lot || ""}: ${r.result || ""}` }));
    failEnv.forEach(r     => alerts.push({ date: r.date, level: "danger", text: `環境モニタリング 不合格 — ${r.testType || ""} / ${r.location || ""}: ${r.resultValue || ""}` }));
    failLabel.forEach(r   => alerts.push({ date: r.date, level: "warn",   text: `食品表示確認 NG — ${r.lot || ""} ${r.productName || ""} (${r.result || ""})` }));
    foundPest.forEach(r   => alerts.push({ date: r.date, level: "warn",   text: `害虫侵入確認 — ${r.location || ""}: ${r.pestType || ""} (${r.found || ""})` }));
    failFacility.forEach(r=> alerts.push({ date: r.date, level: "warn",   text: `施設設備 ${r.status || "要対応"} — ${r.area || ""} ${r.target || ""}` }));
    openComplaints.forEach(r  => alerts.push({ date: r.receivedDate || "", level: "warn",   text: `クレーム対応中 — ${r.claimNo || ""}: ${r.category || ""} (${r.customer || ""})` }));
    openNcActions.forEach(r   => alerts.push({ date: r.occurredAt?.slice(0, 10) || "", level: "danger", text: `不適合処置 未完了 — ${r.identNo || ""}: ${r.productName || ""} (${r.lot || ""})` }));
    openCa.forEach(r          => alerts.push({ date: r.date || "", level: "warn", text: `是正処置 対応中 — ${r.identNo || ""}: ${r.content?.slice(0, 40) || ""}` }));
    openRecalls.forEach(r     => alerts.push({ date: r.detectedDate || "", level: "danger", text: `製品回収 対応中 — ${r.recallNo || ""}: ${r.productName || ""} (${r.lot || ""})` }));
    (state.supplierAuditLog||[]).filter(r=>r.result==="不適合").forEach(r => alerts.push({ date: r.auditDate||r.date||"", level: "danger", text: `仕入先評価 不適合 — ${r.supplierName||r.supplier||""} (${r.auditDate||r.date||""})` }));
    (state.supplierAuditLog||[]).filter(r=>r.result==="条件付き適合").forEach(r => alerts.push({ date: r.auditDate||r.date||"", level: "warn", text: `仕入先評価 条件付き適合 — ${r.supplierName||r.supplier||""} (${r.auditDate||r.date||""})` }));

    // Expiring ingredient batches
    const sevenDaysLater = new Date(); sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const expiryAlert = sevenDaysLater.toISOString().slice(0, 10);
    const expiringBatches = (state.receivingLog || []).filter(r => r.expiryDate && r.expiryDate <= expiryAlert);
    const expiredBatches  = expiringBatches.filter(r => r.expiryDate < today);
    const soonBatches     = expiringBatches.filter(r => r.expiryDate >= today);
    if (expiredBatches.length) alerts.push({ date: "", level: "danger", text: `原材料 期限切れ — ${expiredBatches.length}件: ${expiredBatches.slice(0,2).map(r=>`${r.ingName||""}(${r.lot||"—"}, 期限:${r.expiryDate})`).join("、")}` });
    if (soonBatches.length)   alerts.push({ date: "", level: "warn",   text: `原材料 期限間近(7日以内) — ${soonBatches.length}件: ${soonBatches.slice(0,2).map(r=>`${r.ingName||""}(${r.lot||"—"}, 期限:${r.expiryDate})`).join("、")}` });

    // Overdue alerts
    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Group calibrations by equipment, find overdue ones
    const calibByEquip = {};
    (state.calibrationLog || []).forEach(r => {
        const key = r.equipmentId || r.equipment || "—";
        if (!calibByEquip[key] || r.date > calibByEquip[key].date) calibByEquip[key] = r;
    });
    const overdueCalib = Object.values(calibByEquip).filter(r =>
        r.nextDate ? r.nextDate < today : (r.date && new Date(r.date) < ninetyDaysAgo)
    );
    if (overdueCalib.length) alerts.push({ date: "", level: "warn", text: `機器校正 期限超過 — ${overdueCalib.length}件: ${overdueCalib.slice(0,3).map(r=>r.equipment||r.equipmentId||"機器").join("、")}` });
    const pastDueCa = allCa.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "完了" && r.status !== "有効性確認済み");
    pastDueCa.forEach(r => alerts.push({ date: r.dueDate || "", level: "danger", text: `是正処置 期限超過 — ${r.identNo || ""} (期限: ${r.dueDate || ""})` }));
    const overdueTraining = (state.trainingLog || []).filter(r => r.date && new Date(r.date) < thirtyDaysAgo && (r.result === "未確認" || !r.result));
    if (overdueTraining.length) alerts.push({ date: "", level: "warn", text: `教育訓練 未実施 — ${overdueTraining.length}件が予定日を過ぎています` });
    // Internal audit overdue
    const overdueAudit = (state.internalAuditLog||[]).filter(r => r.nextDate && r.nextDate < today && r.status !== "完了");
    if (overdueAudit.length) alerts.push({ date: "", level: "warn", text: `内部監査 期限超過 — ${overdueAudit.length}件の次回監査期限が過ぎています` });
    // Supplier reaudit overdue
    const overdueSupplier = (state.supplierAuditLog||[]).filter(r => r.nextDate && r.nextDate < today);
    if (overdueSupplier.length) alerts.push({ date: "", level: "warn", text: `仕入先再評価 期限超過 — ${overdueSupplier.length}件: ${overdueSupplier.slice(0,2).map(r=>r.supplierName||r.supplier||"仕入先").join("、")}` });
    // Document register overdue reviews
    const overdueDoc = (state.documentRegister || []).filter(r => r.nextReviewDate && r.nextReviewDate <= today && r.status !== "廃止");
    if (overdueDoc.length) alerts.push({ date: "", level: "warn", text: `文書レビュー期限超過 — ${overdueDoc.length}件: ${overdueDoc.slice(0, 3).map(r => r.docName || r.docId).join("、")}` });
    alerts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    const planCompletedCount = planItems.filter(item => (state[item.key] || []).length > 0).length;
    const planCompletionPct  = Math.round(planCompletedCount / planItems.length * 100);

    const planCards = planItems.map(item => {
        const list = state[item.key] || [];
        const css = list.length > 0 ? "dash-card-ok" : "dash-card-empty";
        return dashCard(item.label, list.length > 0 ? `${list.length}件` : "未入力", item.icon, item.route, css);
    }).join("");

    const recordDefs = [
        { title: "CCPモニタリング",  list: r7ccp,    fails: failCcp,    route: "#/p/ccp-monitoring-log", icon: "🎯" },
        { title: "原材料受入",        list: r7recv,   fails: failRecv,   route: "#/p/receiving-log",      icon: "📦" },
        { title: "衛生点検",          list: r7san,    fails: failSan,    route: "#/p/sanitation-log",     icon: "🧹" },
        { title: "健康確認",          list: r7health, fails: failHealth, route: "#/p/health-log",         icon: "👤" },
        { title: "冷蔵・冷凍温度",   list: r7temp,   fails: failTemp,   route: "#/p/temperature-log",    icon: "🌡" },
        { title: "使用水確認",        list: r7water,  fails: failWater,  route: "#/p/water-log",          icon: "💧" },
        { title: "アレルゲン確認",    list: r7allergen,fails: failAllergen,route: "#/p/allergen-log",       icon: "⚠️" },
        { title: "機器校正 (90日)",   list: r90calib, fails: failCalib,  route: "#/p/calibration-log",    icon: "🔬" },
        { title: "製品検査 (30日)",   list: r30test,      fails: failTest,       route: "#/p/product-test-log",   icon: "🧫" },
        { title: "出荷記録 (30日)",   list: r30ship,      fails: [],             route: "#/p/shipment-log",       icon: "🚚" },
        { title: "クレーム対応",      list: allComplaints, fails: openComplaints, route: "#/p/complaint-log",           icon: "📢" },
        { title: "教育訓練 (30日)",   list: r30train,      fails: [],             route: "#/p/training-log",            icon: "📚" },
        { title: "不適合処置書",      list: allNcActions,  fails: openNcActions,  route: "#/p/nonconformance-actions",  icon: "🚫" },
        { title: "不適合管理表",      list: allNcLog,      fails: [],             route: "#/p/nonconformance-log",      icon: "📋" },
        { title: "是正処置書",        list: allCa,         fails: openCa,         route: "#/p/corrective-actions",      icon: "🔄" },
        { title: "製造工程日報",      list: state.productionLog||[], fails: (state.productionLog||[]).filter(r=>r.ccpOk==="不合格"), route: "#/p/production-log", icon: "🏭" },
        { title: "製品回収記録",      list: state.recallLog||[], fails: (state.recallLog||[]).filter(r=>r.status==="対応中"), route: "#/p/recall-log", icon: "🚨" },
        { title: "食品表示確認",      list: state.labelCheckLog||[], fails: (state.labelCheckLog||[]).filter(r=>r.result!=="合格"), route: "#/p/label-check-log", icon: "🏷" },
        { title: "環境モニタリング",  list: state.environmentLog||[], fails: (state.environmentLog||[]).filter(r=>r.result==="不合格"), route: "#/p/environment-log", icon: "🔬" },
        { title: "害虫防除",          list: state.pestControlLog||[], fails: (state.pestControlLog||[]).filter(r=>r.found&&r.found!=="なし"), route: "#/p/pest-control-log", icon: "🐛" },
        { title: "施設設備点検",      list: state.facilityLog||[],    fails: (state.facilityLog||[]).filter(r=>r.status==="要修繕"||r.status==="使用停止"), route: "#/p/facility-log", icon: "🏗" },
        { title: "内部監査",          list: state.internalAuditLog||[], fails: (state.internalAuditLog||[]).filter(r=>r.status!=="完了"), route: "#/p/internal-audit", icon: "🔍" },
        { title: "仕入先評価",        list: state.supplierAuditLog||[], fails: (state.supplierAuditLog||[]).filter(r=>r.result==="不適合"), route: "#/p/supplier-audit", icon: "🏭" },
    ];

    const recordCards = recordDefs.map(({ title, list, fails, route, icon }) => {
        const css = fails.length > 0 ? "dash-card-fail" : list.length > 0 ? "dash-card-ok" : "dash-card-empty";
        const label = list.length === 0 ? "記録なし" : fails.length > 0 ? `${list.length}件（要確認${fails.length}件）` : `${list.length}件`;
        return dashCard(title, label, icon, route, css);
    }).join("");

    const alertHtml = alerts.slice(0, 20).map(a =>
        `<div class="dash-alert dash-alert-${a.level}"><span class="dash-alert-date">${esc(a.date || "")}</span><span>${esc(a.text)}</span></div>`
    ).join("") + (alerts.length > 20 ? `<div style="font-size:11px;color:var(--c-text-muted);padding:4px 8px">他 ${alerts.length - 20} 件...</div>` : "")
    || `<div style="color:var(--c-text-muted);font-size:13px;padding:8px 0">直近7日間に問題は検出されていません</div>`;

    // Today's checklist — CCP-plan-aware coverage
    const ccpPlanItems    = state.ccpPlan || [];
    const todayCcpRecs    = (state.ccpMonitoringLog || []).filter(r => r.date === today);
    const ccpCoveredCount = ccpPlanItems.length > 0
        ? ccpPlanItems.filter(cp => todayCcpRecs.some(m => m.ccpNo === cp.ccpNo)).length
        : null;
    const ccpLabel = ccpCoveredCount !== null
        ? `CCPモニタリング (${ccpCoveredCount}/${ccpPlanItems.length})`
        : "CCPモニタリング";
    const ccpDone  = ccpCoveredCount !== null
        ? ccpCoveredCount === ccpPlanItems.length && ccpPlanItems.length > 0
        : todayCcpRecs.length > 0;

    const todayChecks = [
        { label: "従事者健康確認", done: (state.healthLog||[]).some(r => r.date === today), route: "#/p/health-log", warn: failHealth.some(r => r.date === today) },
        { label: "衛生点検（朝）", done: (state.sanitationLog||[]).some(r => r.date === today && r.shift === "朝"), route: "#/p/sanitation-log" },
        { label: "使用水確認（朝）", done: (state.waterLog||[]).some(r => r.date === today && r.shift === "朝"), route: "#/p/water-log" },
        { label: "温度確認（朝）", done: (state.temperatureLog||[]).some(r => r.date === today && r.shift === "朝"), route: "#/p/temperature-log" },
        { label: "機器校正確認", done: (state.calibrationLog||[]).some(r => r.date === today), route: "#/p/calibration-log" },
        { label: "アレルゲン確認", done: (state.allergenLog||[]).some(r => r.date === today), route: "#/p/allergen-log" },
        { label: ccpLabel, done: ccpDone, route: "#/p/ccp-monitoring-log", warn: failCcp.some(r => r.date === today) },
        { label: "衛生点検（終業）", done: (state.sanitationLog||[]).some(r => r.date === today && r.shift === "終業"), route: "#/p/sanitation-log" },
        { label: "使用水確認（終業）", done: (state.waterLog||[]).some(r => r.date === today && r.shift === "終業"), route: "#/p/water-log" },
        { label: "温度確認（終業）", done: (state.temperatureLog||[]).some(r => r.date === today && r.shift === "終業"), route: "#/p/temperature-log" },
        { label: "製造工程日報", done: (state.productionLog||[]).some(r => r.date === today), route: "#/p/production-log" },
    ];
    const checklistHtml = todayChecks.map(c => {
        const icon = c.warn ? "⚠️" : c.done ? "✅" : "⬜";
        const css = c.warn ? "color:var(--c-danger)" : c.done ? "color:var(--c-success)" : "color:var(--c-text-muted)";
        return `<span onclick="location.hash='${c.route}'" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;border:1px solid var(--c-border);font-size:12px;${css};margin:3px;white-space:nowrap">${icon} ${esc(c.label)}</span>`;
    }).join("");

    const hasProduct = !!state.product?.name;
    const productLine = hasProduct
        ? `${esc(state.organization?.name || "")}${state.organization?.name ? " ／ " : ""}管理責任者: ${esc(state.team?.leader || "—")} ／ ${today}`
        : `<span style="color:var(--c-warn)">製品情報が未入力です — ウィザードから入力を開始してください</span>`;

    // Wizard setup completeness (inlined subset of wizard.js calcCompleteness)
    const wizPct = (() => {
        const s = state;
        const checks = [
            !!s.organization?.name,   !!s.organization?.address,
            !!s.team?.leader,          (s.team?.members || []).length > 0,
            !!s.product?.name,         !!s.product?.productGroup,
            !!s.product?.storage,      !!s.product?.shelfLife,
            (s.ingredients || []).length > 0, (s.steps || []).length > 0,
            !!s.product?.intendedUse,
            (s.product?.allergens || []).length > 0 || s.product?.noAllergens,
        ];
        return Math.round(checks.filter(Boolean).length / checks.length * 100);
    })();
    const wizMissing = [
        [!state.organization?.name,   "事業者名"],
        [!state.organization?.address,"所在地"],
        [!state.team?.leader,         "チームリーダー"],
        [!state.product?.name,        "製品名"],
        [!state.product?.productGroup,"製品群"],
        [!state.product?.storage,     "保存方法"],
        [!state.product?.shelfLife,   "賞味期限"],
        [!(state.ingredients||[]).length, "原材料"],
        [!(state.steps||[]).length,       "製造工程"],
    ].filter(([missing]) => missing).map(([, label]) => label);

    // KPI: compliance rates
    const kpiRate = (list, fails) => list.length === 0 ? null : Math.round((list.length - fails.length) / list.length * 100);

    // Record sufficiency: % of last 30 days with all 4 critical daily records present
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        return d.toISOString().slice(0, 10);
    });
    const sufficiencyDays = last30Days.filter(day =>
        (state.ccpMonitoringLog || []).some(r => r.date === day) &&
        (state.healthLog        || []).some(r => r.date === day) &&
        (state.sanitationLog    || []).some(r => r.date === day) &&
        (state.temperatureLog   || []).some(r => r.date === day)
    ).length;
    const hasAnySufficiencyData = last30Days.some(day =>
        (state.ccpMonitoringLog || []).some(r => r.date === day) ||
        (state.healthLog        || []).some(r => r.date === day)
    );
    const sufficiencyRate = hasAnySufficiencyData ? Math.round(sufficiencyDays / 30 * 100) : null;

    const kpiHtml = (() => {
        const r30prod = (state.productionLog || []).filter(r => r.date >= thirtyDaysAgo.toISOString().slice(0,10));
        const prodTotal = r30prod.reduce((s,r) => s + (parseFloat(r.actualQty)||0), 0);
        const prodDefect = r30prod.reduce((s,r) => s + (parseFloat(r.defectQty)||0), 0);
        const prodYield = r30prod.length === 0 ? null : (prodTotal > 0 ? Math.round((prodTotal - prodDefect) / prodTotal * 100) : null);
        const openRecalls = (state.recallLog || []).filter(r => r.status === "対応中").length;
        const items = [
            { label: "CCP合格率(7日)", rate: kpiRate(r7ccp, failCcp), total: r7ccp.length },
            { label: "受入合格率(7日)", rate: kpiRate(r7recv, failRecv), total: r7recv.length },
            { label: "健康確認良好率(7日)", rate: kpiRate(r7health, failHealth), total: r7health.length },
            { label: "温度合格率(7日)", rate: kpiRate(r7temp, failTemp), total: r7temp.length },
            { label: "使用水合格率(7日)", rate: kpiRate(r7water, failWater), total: r7water.length },
            { label: "衛生点検合格率(7日)", rate: kpiRate(r7san, failSan), total: r7san.length },
            { label: "アレルゲン確認合格率(7日)", rate: kpiRate(r7allergen, failAllergen), total: r7allergen.length },
            { label: "製品検査合格率(30日)", rate: kpiRate(r30test, failTest), total: r30test.length },
            { label: "良品率(30日)", rate: prodYield, total: r30prod.length, unit: "日分" },
            { label: "記録充足率(30日)", rate: sufficiencyRate, total: sufficiencyDays, unit: "/30日" },
            ...(openRecalls > 0 ? [{ label: "進行中の回収", rate: 0, total: openRecalls, isAlert: true }] : []),
        ];
        return items.map(({ label, rate, total, unit, isAlert }) => {
            if (isAlert) return `<div class="kpi-card" style="border-color:#ef4444;background:#fff1f2"><div class="kpi-label">${esc(label)}</div><div class="kpi-value" style="color:#ef4444">${total}</div><div class="kpi-sub">対応中</div></div>`;
            if (rate === null) return `<div class="kpi-card kpi-empty"><div class="kpi-label">${esc(label)}</div><div class="kpi-value">—</div><div class="kpi-sub">記録なし</div></div>`;
            const color = rate >= 95 ? "var(--c-success)" : rate >= 80 ? "var(--c-warn)" : "var(--c-danger)";
            return `<div class="kpi-card"><div class="kpi-label">${esc(label)}</div><div class="kpi-value" style="color:${color}">${rate}%</div><div class="kpi-sub">${total}${unit||"件"}</div></div>`;
        }).join("");
    })();

    // Overall compliance grade (computed after kpiRate is defined)
    const kpiRates = [
        kpiRate(r7ccp, failCcp), kpiRate(r7recv, failRecv),
        kpiRate(r7health, failHealth), kpiRate(r7temp, failTemp),
        kpiRate(r7water, failWater), kpiRate(r7san, failSan),
        kpiRate(r7allergen, failAllergen), sufficiencyRate,
    ].filter(r => r !== null);
    const avgRate = kpiRates.length > 0 ? Math.round(kpiRates.reduce((a, b) => a + b, 0) / kpiRates.length) : null;
    const grade = avgRate === null ? "—" : avgRate >= 95 ? "A" : avgRate >= 85 ? "B" : avgRate >= 70 ? "C" : "D";
    const gradeColor = grade === "A" ? "var(--c-success)" : grade === "B" ? "#16a34a" : grade === "C" ? "var(--c-warn)" : grade === "D" ? "var(--c-danger)" : "var(--c-text-muted)";
    const totalAlerts = alerts.length;

    // 14-day trend bars for CCP and temperature
    const trendHtml = (() => {
        const days = 14;
        const dates = Array.from({ length: days }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
            return d.toISOString().slice(0, 10);
        });
        const trendSeries = [
            { label: "CCPモニタリング", route: "#/p/ccp-monitoring-log", list: state.ccpMonitoringLog || [], passKey: "passed" },
            { label: "温度管理",         route: "#/p/temperature-log",    list: state.temperatureLog || [],  passKey: "passed" },
            { label: "衛生点検",         route: "#/p/sanitation-log",     list: state.sanitationLog || [],   passKey: null, failFn: r => SANIT_KEYS.some(k => r[k] === false || r[k] === "false") },
            { label: "原材料受入",       route: "#/p/receiving-log",      list: state.receivingLog || [],    passKey: "passed" },
            { label: "アレルゲン確認",   route: "#/p/allergen-log",       list: state.allergenLog || [],     passKey: "passed" },
            { label: "環境モニタリング", route: "#/p/environment-log",    list: state.environmentLog || [],  passKey: null, failFn: r => r.result === "不合格" },
            { label: "食品表示確認",     route: "#/p/label-check-log",    list: state.labelCheckLog || [],   passKey: null, failFn: r => r.result !== "合格" && r.result },
            { label: "害虫防除",         route: "#/p/pest-control-log",   list: state.pestControlLog || [],  passKey: null, failFn: r => r.found && r.found !== "なし" },
        ];
        return trendSeries.map(({ label, route, list, passKey, failFn }) => {
            const bars = dates.map(date => {
                const dayRecs = list.filter(r => r.date === date);
                if (dayRecs.length === 0) return `<div class="trend-bar trend-bar-none" title="${date}: 記録なし"></div>`;
                const anyFail = passKey
                    ? dayRecs.some(r => r[passKey] === false || r[passKey] === "false")
                    : (failFn ? dayRecs.some(failFn) : false);
                const cls = anyFail ? "trend-bar-fail" : "trend-bar-ok";
                const ratio = Math.min(1, dayRecs.length / 4);
                return `<div class="trend-bar ${cls}" style="height:${Math.max(4, Math.round(ratio * 32))}px" title="${date}: ${dayRecs.length}件${anyFail ? " (要確認あり)" : " (全合格)"}"></div>`;
            }).join("");
            return `<div class="trend-series" onclick="location.hash='${route}'" style="cursor:pointer" title="${label}ページを開く">
              <div class="trend-label">${esc(label)}</div>
              <div class="trend-bars">${bars}</div>
              <div class="trend-dates"><span>${esc(dates[0].slice(5))}</span><span style="margin-left:auto">${esc(dates[dates.length-1].slice(5))}</span></div>
            </div>`;
        }).join("");
    })();

    // 8-week compliance trend (SVG line chart)
    const weekTrendHtml = (() => {
        const WEEKS = 8;
        const W = 480, H = 120, PAD_L = 32, PAD_R = 12, PAD_T = 10, PAD_B = 24;
        const innerW = W - PAD_L - PAD_R;
        const innerH = H - PAD_T - PAD_B;

        // Build ISO week start dates (Monday) for the past WEEKS weeks
        const weekStarts = Array.from({ length: WEEKS }, (_, i) => {
            const d = new Date();
            const dow = (d.getDay() + 6) % 7; // Mon=0
            d.setDate(d.getDate() - dow - (WEEKS - 1 - i) * 7);
            return d.toISOString().slice(0, 10);
        });
        const weekEnds = weekStarts.map((ws, i) => {
            const d = new Date(ws); d.setDate(d.getDate() + 6);
            return d.toISOString().slice(0, 10);
        });

        const weekRate = (list, failFn) => weekStarts.map((ws, i) => {
            const recs = (list || []).filter(r => r.date >= ws && r.date <= weekEnds[i]);
            if (!recs.length) return null;
            const fails = recs.filter(failFn).length;
            return Math.round((recs.length - fails) / recs.length * 100);
        });

        const series = [
            { label: "CCP", color: "#b91c1c",
              data: weekRate(state.ccpMonitoringLog, r => r.passed === false || r.passed === "false") },
            { label: "温度", color: "#1d4ed8",
              data: weekRate(state.temperatureLog,   r => r.passed === false || r.passed === "false") },
            { label: "受入", color: "#15803d",
              data: weekRate(state.receivingLog,     r => r.passed === false || r.passed === "false") },
            { label: "衛生", color: "#7c3aed",
              data: weekRate(state.sanitationLog,    r => SANIT_KEYS.some(k => r[k] === false || r[k] === "false")) },
        ];

        const anyData = series.some(s => s.data.some(v => v !== null));
        if (!anyData) return `<div style="color:var(--c-text-muted);font-size:13px;padding:12px 0">運用記録が蓄積されると週別推移グラフが表示されます。</div>`;

        const xPos = i => PAD_L + (i / (WEEKS - 1)) * innerW;
        const yPos = v => PAD_T + innerH - (v / 100) * innerH;

        let svgContent = "";
        // Grid lines at 70, 80, 90, 100%
        [70, 80, 90, 100].forEach(pct => {
            const y = yPos(pct);
            svgContent += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
            svgContent += `<text x="${PAD_L - 3}" y="${y + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${pct}</text>`;
        });
        // 90% threshold line
        svgContent += `<line x1="${PAD_L}" y1="${yPos(90)}" x2="${W - PAD_R}" y2="${yPos(90)}" stroke="#d97706" stroke-width="1" stroke-dasharray="4,3"/>`;

        // Week labels on x-axis
        weekStarts.forEach((ws, i) => {
            svgContent += `<text x="${xPos(i)}" y="${H - 5}" text-anchor="middle" font-size="9" fill="#94a3b8">${ws.slice(5)}</text>`;
        });

        // Series lines and dots
        series.forEach(({ label, color, data }) => {
            const points = data.map((v, i) => v !== null ? [xPos(i), yPos(v)] : null);
            // Line segments
            let pathD = "";
            points.forEach((pt, i) => {
                if (!pt) return;
                const prev = points.slice(0, i).reverse().find(p => p);
                if (prev) pathD += ` L${pt[0]},${pt[1]}`;
                else       pathD += ` M${pt[0]},${pt[1]}`;
            });
            if (pathD) svgContent += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
            // Dots
            points.forEach((pt, i) => {
                if (!pt) return;
                const v = data[i];
                const fill = v < 90 ? "#ef4444" : v < 95 ? "#f59e0b" : color;
                svgContent += `<circle cx="${pt[0]}" cy="${pt[1]}" r="3.5" fill="${fill}" stroke="white" stroke-width="1.5"><title>${label} ${weekStarts[i]}: ${v}%</title></circle>`;
            });
        });

        const legendHtml = series.map(s =>
            `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px"><span style="width:12px;height:3px;background:${s.color};display:inline-block;border-radius:2px"></span>${s.label}</span>`
        ).join("&nbsp;&nbsp;");

        return `<div>
          <div style="font-size:11px;color:var(--c-text-muted);margin-bottom:4px">適合率 % &nbsp;${legendHtml}&nbsp;&nbsp;<span style="color:#d97706;font-size:10px">— 90%ライン</span></div>
          <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;overflow:visible">${svgContent}</svg>
        </div>`;
    })();

    // Monthly record coverage calendar
    const calHtml = (() => {
        const now = new Date();
        const yr  = now.getFullYear();
        const mo  = now.getMonth();
        const daysInMonth = new Date(yr, mo + 1, 0).getDate();
        const firstDow    = new Date(yr, mo, 1).getDay();       // 0=Sun
        const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Mon=0 offset

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const d       = i + 1;
            const dateStr = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dow     = new Date(yr, mo, d).getDay();
            const isWeekend = dow === 0 || dow === 6;
            if (dateStr > today) return { d, cls: "cal-future", title: "" };

            const hasCcp    = (state.ccpMonitoringLog || []).some(r => r.date === dateStr);
            const hasHealth = (state.healthLog        || []).some(r => r.date === dateStr);
            const hasTemp   = (state.temperatureLog   || []).some(r => r.date === dateStr);
            const hasSan    = (state.sanitationLog    || []).some(r => r.date === dateStr);
            const hasAny    = hasCcp || hasHealth || hasTemp || hasSan;

            const failCcp    = (state.ccpMonitoringLog || []).some(r => r.date === dateStr && (r.passed === false || r.passed === "false"));
            const failHealth = (state.healthLog        || []).some(r => r.date === dateStr && r.status && r.status !== "良好");
            const failTemp   = (state.temperatureLog   || []).some(r => r.date === dateStr && (r.passed === false || r.passed === "false"));
            const failSan    = (state.sanitationLog    || []).some(r => r.date === dateStr && SANIT_KEYS.some(k => r[k] === false || r[k] === "false"));

            let cls, title;
            if (!hasAny && isWeekend)  { cls = "cal-weekend"; title = `${dateStr}: 週末`; }
            else if (!hasAny)          { cls = "cal-missing"; title = `${dateStr}: 記録なし`; }
            else if (failCcp || failHealth) { cls = "cal-danger"; title = `${dateStr}: 重要要確認`; }
            else if (failTemp || failSan)   { cls = "cal-warn";   title = `${dateStr}: 要確認`; }
            else                       { cls = "cal-ok";      title = `${dateStr}: 全OK`; }
            return { d, cls, title };
        });

        const DOW_LABELS  = ["月", "火", "水", "木", "金", "土", "日"];
        const headerCells = DOW_LABELS.map(l => `<div class="cal-dow">${l}</div>`).join("");
        const blanks      = Array.from({ length: startOffset }, () => `<div class="cal-blank"></div>`).join("");
        const dayCells    = days.map(({ d, cls, title }) =>
            `<div class="cal-day ${cls}" title="${esc(title)}">${d}</div>`
        ).join("");

        const legend = [
            ["cal-ok", "全OK"], ["cal-warn", "要確認"], ["cal-danger", "重要"],
            ["cal-missing", "記録なし"], ["cal-weekend", "週末"],
        ].map(([c, l]) => `<span class="cal-legend-item"><span class="cal-day-mini ${c}"></span>${l}</span>`).join("");

        const gapCount = days.filter(({ cls }) => cls === "cal-missing").length;
        const gapNote  = gapCount > 0
            ? `<span style="color:var(--c-danger);font-weight:600;font-size:11px">⚠ 記録なし: ${gapCount}日</span>`
            : `<span style="color:var(--c-success);font-weight:600;font-size:11px">✅ ギャップなし</span>`;

        return `<div>
          <div style="font-size:12px;color:var(--c-text-muted);margin-bottom:6px">${yr}年${mo + 1}月 — キー記録カバレッジ &nbsp;${gapNote}</div>
          <div style="font-size:10px;color:var(--c-text-muted);margin-bottom:8px">CCP・健康確認・温度管理・衛生点検</div>
          <div class="cal-grid">${headerCells}${blanks}${dayCells}</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">${legend}</div>
        </div>`;
    })();

    // Upcoming tasks (next 7 days + overdue)
    const upcomingHtml = (() => {
        const next7Str = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();
        const items = [];
        const add = (date, level, icon, text, route) => items.push({ date, level, icon, text, route });

        Object.values(calibByEquip).forEach(r => {
            if (!r.nextDate) return;
            if (r.nextDate < today) add(r.nextDate, "warn", "🔬", `機器校正 期限超過 — ${r.equipment || r.equipmentId || "機器"}`, "#/p/calibration-log");
            else if (r.nextDate <= next7Str) add(r.nextDate, "info", "🔬", `機器校正 予定 — ${r.equipment || r.equipmentId || "機器"}`, "#/p/calibration-log");
        });
        allCa.filter(r => r.dueDate && r.dueDate <= next7Str && r.status !== "完了" && r.status !== "有効性確認済み").forEach(r =>
            add(r.dueDate, r.dueDate < today ? "danger" : "info", "🔄", `是正処置 期限 — ${r.identNo || ""} (${r.content?.slice(0, 30) || ""})`, "#/p/corrective-actions")
        );
        (state.supplierAuditLog || []).filter(r => r.nextDate && r.nextDate <= next7Str).forEach(r =>
            add(r.nextDate, r.nextDate < today ? "warn" : "info", "🏭", `仕入先評価 予定 — ${r.supplier || r.supplierName || ""}`, "#/p/supplier-audit")
        );
        (state.internalAuditLog || []).filter(r => r.nextDate && r.nextDate <= next7Str && r.status !== "完了").forEach(r =>
            add(r.nextDate, r.nextDate < today ? "warn" : "info", "📋", `内部監査 予定 — ${r.scope || r.date || ""}`, "#/p/internal-audit")
        );
        (state.documentRegister || []).filter(r => r.nextReviewDate && r.nextReviewDate <= next7Str && r.status !== "廃止").forEach(r =>
            add(r.nextReviewDate, r.nextReviewDate < today ? "warn" : "info", "📄", `文書レビュー期限 — ${r.docName || r.docId || ""}`, "#/p/document-register")
        );
        (state.trainingLog || []).filter(r => r.date && r.date > today && r.date <= next7Str).forEach(r =>
            add(r.date, "info", "📚", `教育訓練 予定 — ${r.theme || "訓練"} (${r.participants || ""})`, "#/p/training-log")
        );

        if (!items.length) return `<div style="color:var(--c-text-muted);font-size:12px;padding:6px 0">今後7日間の予定はありません</div>`;
        items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        const colorMap  = { danger: "#dc2626", warn: "#d97706", info: "var(--c-primary)" };
        const bgMap     = { danger: "#fef2f2", warn: "#fffbeb", info: "var(--c-surface)" };
        const borderMap = { danger: "#fca5a5", warn: "#fde68a", info: "var(--c-border)" };
        return items.map(u =>
            `<div onclick="location.hash='${u.route}'" style="display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:6px;border:1px solid ${borderMap[u.level]};background:${bgMap[u.level]};cursor:pointer;font-size:12px;margin-bottom:4px">
               <span style="font-size:14px">${u.icon}</span>
               <span style="font-weight:600;min-width:75px;color:#64748b;flex-shrink:0">${esc(u.date || "")}</span>
               <span style="color:${colorMap[u.level]}">${esc(u.text)}</span>
             </div>`
        ).join("");
    })();

    const doneCount = todayChecks.filter(c => c.done).length;
    const warnCount = todayChecks.filter(c => c.warn).length;
    const checklistSummary = warnCount > 0
        ? `<span style="color:var(--c-danger);font-weight:600">⚠ ${warnCount}件要確認</span>`
        : doneCount === todayChecks.length
        ? `<span style="color:var(--c-success);font-weight:600">✅ 本日の全チェック完了</span>`
        : `<span style="color:var(--c-text-muted)">${doneCount} / ${todayChecks.length} 完了</span>`;

    return `
      <div style="max-width:1100px">
        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:24px">
          <div style="flex:1">
            <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">${esc(state.product?.name || "（製品名未入力）")} — 管理ダッシュボード</h2>
            <div style="font-size:13px;color:var(--c-text-muted)">${productLine}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
            ${totalAlerts > 0 ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:11px;color:var(--c-danger)">要対応アラート</div><div style="font-size:22px;font-weight:700;color:var(--c-danger)">${totalAlerts}</div></div>` : ""}
            <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:8px 14px;text-align:center">
              <div style="font-size:11px;color:var(--c-text-muted)">総合評価</div>
              <div style="font-size:32px;font-weight:800;color:${gradeColor};line-height:1">${grade}</div>
              ${avgRate !== null ? `<div style="font-size:10px;color:var(--c-text-muted)">${avgRate}% 平均適合率</div>` : ""}
            </div>
          </div>
        </div>

        ${wizPct < 100 ? (() => {
            const pctColor = wizPct === 0 ? "#dc2626" : wizPct < 50 ? "#d97706" : "#2563eb";
            const bgColor  = wizPct === 0 ? "#fef2f2" : wizPct < 50 ? "#fffbeb" : "#eff6ff";
            const bdColor  = wizPct === 0 ? "#fca5a5" : wizPct < 50 ? "#fde68a" : "#93c5fd";
            const msg = wizPct === 0
                ? "製品情報が未入力です。ウィザードから入力を開始してください。"
                : `セットアップが未完了です（${wizPct}%）。残り: ${wizMissing.join("、")}`;
            return `<div style="background:${bgColor};border:1px solid ${bdColor};border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
              <div style="flex:1;min-width:200px">
                <div style="font-size:13px;color:${pctColor};font-weight:600;margin-bottom:4px">${wizPct === 0 ? "🚀 セットアップを開始" : "⚠ セットアップ未完了"}</div>
                <div style="font-size:12px;color:#64748b">${esc(msg)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
                <div style="text-align:center">
                  <div style="font-size:20px;font-weight:700;color:${pctColor}">${wizPct}%</div>
                  <div style="background:#e2e8f0;border-radius:999px;height:4px;width:80px;overflow:hidden;margin-top:2px">
                    <div style="background:${pctColor};height:100%;width:${wizPct}%;border-radius:999px"></div>
                  </div>
                </div>
                <button class="btn btn-primary" onclick="location.hash='#/wizard'" style="flex-shrink:0">ウィザードへ →</button>
              </div>
            </div>`;
        })() : ""}

        <section style="margin-bottom:28px">
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">本日の作業チェックリスト &nbsp;${checklistSummary}</h3>
          <div style="display:flex;flex-wrap:wrap;gap:0">${checklistHtml}</div>
        </section>

        <section style="margin-bottom:28px">
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">適合率 KPI</h3>
          <div class="kpi-grid">${kpiHtml}</div>
        </section>

        <section style="margin-bottom:28px">
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">8週間 適合率推移</h3>
          ${weekTrendHtml}
        </section>

        <section style="margin-bottom:28px">
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">14日間トレンド</h3>
          <div style="display:flex;flex-wrap:wrap;gap:16px">${trendHtml}</div>
        </section>

        <section style="margin-bottom:28px">
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">今月の記録カバレッジ</h3>
          ${calHtml}
        </section>

        <section style="margin-bottom:28px">
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 10px;text-transform:uppercase;letter-spacing:.06em">今後7日間の予定・期限</h3>
          ${upcomingHtml}
        </section>

        <section style="margin-bottom:28px">
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">
            HACCPプラン — 進捗状況 &nbsp;
            <span style="font-weight:600;color:${planCompletionPct===100?'var(--c-success)':planCompletionPct>=67?'var(--c-warn)':'var(--c-danger)'}">${planCompletedCount}/${planItems.length} 完了 (${planCompletionPct}%)</span>
          </h3>
          <div style="background:#e2e8f0;border-radius:4px;height:4px;margin-bottom:12px;overflow:hidden">
            <div style="background:${planCompletionPct===100?'var(--c-success)':planCompletionPct>=67?'var(--c-warn)':'var(--c-danger)'};height:100%;width:${planCompletionPct}%;transition:width 0.3s"></div>
          </div>
          <div class="dash-grid">${planCards}</div>
        </section>

        <section style="margin-bottom:28px">
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">直近の運用記録</h3>
          <div class="dash-grid">${recordCards}</div>
        </section>

        <section>
          <h3 style="font-size:12px;font-weight:700;color:var(--c-text-muted);margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">アラート — 直近7日間</h3>
          ${alertHtml}
        </section>
      </div>`;
}
