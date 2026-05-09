// PDF (印刷経由) / Excel (SheetJS) / JSON のエクスポート機能
import { ALLERGENS, PRODUCT_GROUPS, PROCESS_TYPES, PRP_ITEMS } from "./data.js";
import { buildHaccpPlan } from "./rules.js";

const allergenName = c => ALLERGENS.find(a => a.code === c)?.name || c;
const pgName = c => PRODUCT_GROUPS.find(p => p.code === c)?.name || c;
const ptName = c => PROCESS_TYPES.find(p => p.code === c)?.name || c;

// === JSON エクスポート ===
export function exportJson(state) {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    download(blob, `haccp-${slug(state.product?.name)}-${today()}.json`);
}

// === JSON インポート ===
export function importJson(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            try { resolve(JSON.parse(e.target.result)); } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsText(file, "utf-8");
    });
}

// === PDF (ブラウザの印刷ダイアログ経由) ===
export function exportPdfViaPrint(targetSelector) {
    // 現在の表示が all-docs / 単一doc どちらでも対応: 印刷時に @media print で no-print を非表示
    if (targetSelector) {
        const el = document.querySelector(targetSelector);
        if (!el) { window.print(); return; }
        // 一時的に他のdocを隠して印刷
        const allDocs = document.querySelectorAll("#content > .doc, #content .all-docs > .doc");
        const hidden = [];
        allDocs.forEach(d => {
            if (d !== el && !el.contains(d) && !d.contains(el)) {
                hidden.push([d, d.style.display]);
                d.style.display = "none";
            }
        });
        window.print();
        hidden.forEach(([d, prev]) => d.style.display = prev);
    } else {
        window.print();
    }
}

// === Excel (SheetJS / xlsx) ===
// ブラウザのCDNで読み込んだ window.XLSX を使用
export function exportXlsx(state) {
    if (!window.XLSX) { alert("Excelライブラリの読み込みに失敗しました。ネットワーク接続を確認してください。"); return; }
    const plan = buildHaccpPlan(state);
    const wb = window.XLSX.utils.book_new();

    // === 12手順 (自動生成版) ===
    addSheet(wb, "1.HACCPチーム", buildTeamRows(state));
    addSheet(wb, "2.製品説明書", buildSpecRows(state));
    addSheet(wb, "原材料一覧", buildIngredientRows(state));
    addSheet(wb, "3.使用方法", buildUsageRows(state));
    addSheet(wb, "4.工程一覧", buildStepsRows(state, plan));

    // === 原則1〜7 (TBT様式に準拠した編集データ) ===
    if ((state.ingredients || []).some(i => i.desc)) addSheet(wb, "原料記述書", buildIngredientDescRows(state));
    if ((state.hazardExtractions || []).length) addSheet(wb, "危害抽出表", buildHazardExtractionRows(state));
    if ((state.hazardEvaluations || []).length) addSheet(wb, "ハザード評価表", buildHazardEvalRows(state));
    if ((state.controlMeasures || []).length) addSheet(wb, "管理手段選択分類", buildControlMeasureRows(state));
    if ((state.ccpPlan || []).length) addSheet(wb, "HACCPプラン", buildCcpPlanRows(state));
    if ((state.verifications || []).length) addSheet(wb, "検証記録", buildVerificationListRows(state));

    if ((state.oprp || []).length) addSheet(wb, "O-PRPプラン", buildOprpPlanRows(state));

    // === 自動生成 (12手順の参考用) ===
    addSheet(wb, "6.危害要因分析(自動)", buildHazardRows(plan));
    addSheet(wb, "7.CCP整理(自動)",      buildCcpRows(plan));
    addSheet(wb, "8.管理基準CL(自動)",   buildClRows(plan));
    addSheet(wb, "9.モニタリング(自動)", buildMonitoringRows(plan));
    addSheet(wb, "10.改善措置(自動)",    buildCorrectiveRows(plan));
    addSheet(wb, "11.検証方法(自動)",    buildVerificationRows(plan));
    addSheet(wb, "12.記録一覧(自動)",    buildRecordsRows(plan));

    // === 運用記録 ===
    if ((state.ccpMonitoringLog || []).length)  addSheet(wb, "CCPモニタリング記録", buildCcpMonitoringLogRows(state));
    if ((state.receivingLog || []).length)      addSheet(wb, "原材料受入記録", buildReceivingLogRows(state));
    if ((state.sanitationLog || []).length)     addSheet(wb, "衛生点検記録", buildSanitationLogRows(state));
    if ((state.healthLog || []).length)         addSheet(wb, "従事者健康確認記録", buildHealthLogRows(state));
    if ((state.waterLog || []).length)          addSheet(wb, "使用水確認記録", buildWaterLogRows(state));
    if ((state.temperatureLog || []).length)    addSheet(wb, "冷蔵冷凍温度記録", buildTemperatureLogRows(state));
    if ((state.calibrationLog || []).length)    addSheet(wb, "機器校正記録", buildCalibrationLogRows(state));
    if ((state.allergenLog || []).length)       addSheet(wb, "アレルゲン確認記録", buildAllergenLogRows(state));
    if ((state.productTestLog || []).length)    addSheet(wb, "製品検査記録", buildProductTestLogRows(state));
    if ((state.shipmentLog || []).length)       addSheet(wb, "製品出荷記録", buildShipmentLogRows(state));
    if ((state.complaintLog || []).length)      addSheet(wb, "クレーム対応記録", buildComplaintLogRows(state));
    if ((state.trainingLog || []).length)       addSheet(wb, "教育訓練記録", buildTrainingLogRows(state));
    if ((state.nonconformanceLog || []).length) addSheet(wb, "不適合管理表", buildNcLogRows(state));
    if ((state.nonconformanceActions || []).length) addSheet(wb, "不適合処置書", buildNcActionRows(state));
    if ((state.correctiveActions || []).length) addSheet(wb, "是正処置書", buildCaRows(state));
    if ((state.internalAuditLog || []).length)  addSheet(wb, "内部監査記録", buildInternalAuditRows(state));
    if ((state.supplierAuditLog || []).length)  addSheet(wb, "仕入先評価記録", buildSupplierAuditRows(state));
    if ((state.recallLog || []).length)         addSheet(wb, "製品回収記録", buildRecallRows(state));
    if ((state.productionLog || []).length)     addSheet(wb, "製造工程日報", buildProductionRows(state));
    if ((state.labelCheckLog || []).length)     addSheet(wb, "食品表示確認記録", buildLabelCheckRows(state));
    if ((state.environmentLog || []).length)    addSheet(wb, "環境モニタリング記録", buildEnvironmentRows(state));
    if ((state.pestControlLog || []).length)    addSheet(wb, "害虫防除記録", buildPestControlRows(state));
    if ((state.facilityLog || []).length)       addSheet(wb, "施設設備点検記録", buildFacilityRows(state));
    if ((state.documentRegister || []).length)  addSheet(wb, "文書管理台帳", buildDocumentRegisterRows(state));
    if (state.annualReview && Object.keys(state.annualReview).length) addSheet(wb, "年次HACCPレビュー", buildAnnualReviewRows(state));

    addSheet(wb, "PRP", buildPrpRows());

    const fname = `haccp-${slug(state.product?.name)}-${today()}.xlsx`;
    window.XLSX.writeFile(wb, fname);
}

// 原則1: 原料記述書
function buildIngredientDescRows(state) {
    const rows = [["原料No", "カテゴリ", "原料名", "仕入先", "原産地", "アレルゲン",
        "a)生物的", "a)化学的", "a)物理的", "b)組成", "c)由来", "d)製造方法", "e)包装", "f)シェルフライフ", "g)準備", "h)受入基準"]];
    (state.ingredients || []).forEach(i => {
        const d = i.desc || {};
        rows.push([i.ingNo || "", i.catNo || "", i.name || "", i.supplier || "", i.origin || "",
            (i.allergens || []).map(c => allergenName(c)).join("・"),
            d.biological || "", d.chemical || "", d.physical || "", d.composition || "",
            d.source || "", d.method || "", d.packaging || "", d.shelfLife || "", d.prep || "", d.criteria || ""]);
    });
    return rows;
}

// 原則1: 危害抽出表
function buildHazardExtractionRows(state) {
    const rows = [["対象区分", "対象No", "対象名", "区分(B/C/P/A)", "No.", "危害名", "理由", "定常", "非定常", "緊急"]];
    (state.hazardExtractions || []).forEach(h => rows.push([
        h.source === "ingredient" ? "原料" : (h.source === "equipment" ? "機械・器具" : "プロセス"),
        h.refNo || "", h.refName || "", h.category || "", h.no || "",
        h.name || "", h.reason || "",
        h.routine ? "○" : "", h.abnormal ? "○" : "", h.emergency ? "○" : "",
    ]));
    return rows;
}

// 原則1: ハザード評価表
function buildHazardEvalRows(state) {
    const rows = [["危害名", "抽出元ID", "許容水準", "決定理由", "発生源", "頻度", "特性", "重大性", "除去低減", "管理手段"]];
    (state.hazardEvaluations || []).forEach(h => rows.push([
        h.hazardName || "", h.srcId || "", h.acceptableLimit || "", h.limitBasis || "",
        h.riskSource || "", h.riskFreq || "", h.riskCharacter || "", h.severity || "",
        h.needsRemoval || "", h.needsSpecialControl || "",
    ]));
    return rows;
}

// 原則2: 管理手段選択分類表
function buildControlMeasureRows(state) {
    const rows = [["ハザード", "管理手段",
        "①相乗効果", "②有効性", "③モニタリング", "④機能不全/工程変動", "⑤工程内位置関係", "⑥重大さ", "⑦特別な手段か",
        "判定 (PRP/O-PRP/HACCP)"]];
    (state.controlMeasures || []).forEach(m => rows.push([
        m.hazardName || "", m.measure || "",
        m.q1Synergy || "", m.q2Effective || "", m.q3Monitor || "", m.q4Variation || "", m.q5Position || "", m.q6Severity || "", m.q7Special || "",
        m.decision || "",
    ]));
    return rows;
}

// 原則3-7: HACCPプラン (TBT 12-19)
function buildCcpPlanRows(state) {
    const rows = [["(1)CCP", "(2)工程", "(3)重要な食品安全危害", "(4)CL", "(5)監視:何を", "(5)監視:どのように", "(5)監視:頻度", "(5)監視:誰が", "(6)修正処置", "(7)記録", "(8)検証"]];
    (state.ccpPlan || []).forEach(c => rows.push([
        c.ccpNo || "", c.processName || "", c.hazard || "", c.cl || "",
        c.monWhat || "", c.monHow || "", c.monFreq || "", c.monWho || "",
        c.correction || "", c.record || "", c.verification || "",
    ]));
    return rows;
}

// 原則6: 検証記録
function buildVerificationListRows(state) {
    const rows = [["検証対象", "検証方法", "頻度", "責任者", "最終実施日", "結果", "エビデンス"]];
    (state.verifications || []).forEach(v => rows.push([
        v.target || "", v.method || "", v.frequency || "", v.responsible || "",
        v.lastDate || "", v.result || "", v.evidence || "",
    ]));
    return rows;
}

// 衛生点検・清掃消毒記録
function buildSanitationLogRows(state) {
    const rows = [["日付", "区分", "施設・設備清掃", "機械・器具消毒", "廃棄物処理", "従事者衛生", "防虫防鼠", "残留塩素(mg/L)", "担当者", "確認者", "所見・備考"]];
    const boolStr = v => (v === true || v === "true") ? "○" : (v === false || v === "false" ? "✕" : "");
    (state.sanitationLog || []).forEach(r => rows.push([
        r.date || "", r.shift || "",
        boolStr(r.facility), boolStr(r.machines), boolStr(r.waste), boolStr(r.personnel), boolStr(r.pest),
        r.chlorine || "", r.inspector || "", r.verifiedBy || "", r.note || "",
    ]));
    return rows;
}

// 従事者健康確認記録
function buildHealthLogRows(state) {
    const rows = [["日付", "氏名", "体温(℃)", "健康状態", "出勤可否", "確認者", "備考・措置"]];
    (state.healthLog || []).forEach(r => rows.push([
        r.date || "", r.name || "", r.temperature || "", r.status || "",
        (r.worksToday === true || r.worksToday === "true") ? "出勤" : "出勤停止",
        r.verifiedBy || "", r.note || "",
    ]));
    return rows;
}

// CCPモニタリング記録
function buildCcpMonitoringLogRows(state) {
    const rows = [["日付", "ロット", "CCP No.", "工程名", "管理基準(CL)", "時刻", "測定値", "合否", "是正措置", "担当者", "確認者", "備考"]];
    (state.ccpMonitoringLog || []).forEach(r => {
        const passed = r.passed === true || r.passed === "true" ? "合格" : (r.passed === false || r.passed === "false" ? "不合格" : "");
        rows.push([r.date || "", r.lot || "", r.ccpNo || "", r.processName || "", r.cl || "",
            r.time || "", r.measuredValue || "", passed, r.correction || "", r.measuredBy || "", r.verifiedBy || "", r.note || ""]);
    });
    return rows;
}

// 原材料受入記録
function buildReceivingLogRows(state) {
    const rows = [["受入日", "原料No", "原料名", "仕入先", "ロット", "数量", "温度(℃)", "外観", "消費・賞味期限", "合否", "担当者", "備考"]];
    (state.receivingLog || []).forEach(r => {
        const passed = r.passed === true || r.passed === "true" ? "合格" : (r.passed === false || r.passed === "false" ? "不合格" : "");
        rows.push([r.date || "", r.ingNo || "", r.ingName || "", r.supplier || "", r.lot || "",
            r.quantity || "", r.temperature || "", r.appearance || "", r.expiryDate || "",
            passed, r.receivedBy || "", r.note || ""]);
    });
    return rows;
}

// O-PRPプラン
function buildOprpPlanRows(state) {
    const rows = [["O-PRP No.", "管理対象工程", "管理が必要なハザード", "管理手段", "許容水準",
        "監視:何を", "監視:どのように", "監視:頻度", "監視:誰が", "是正措置", "記録"]];
    (state.oprp || []).forEach(o => rows.push([
        o.oprpNo || "", o.processName || "", o.hazard || "", o.measure || "", o.acceptableLevel || "",
        o.monWhat || "", o.monHow || "", o.monFreq || "", o.monWho || "",
        o.correction || "", o.record || "",
    ]));
    return rows;
}

// 冷蔵・冷凍温度記録
function buildTemperatureLogRows(state) {
    const rows = [["日付", "区分", "保管庫・機器名", "設定温度(℃)", "測定温度(℃)", "適否判定", "担当者", "備考"]];
    const passStr = v => (v === true || v === "true") ? "適合" : (v === false || v === "false" ? "不適合" : "");
    (state.temperatureLog || []).forEach(r => rows.push([
        r.date || "", r.shift || "", r.unit || "", r.setTemp || "",
        r.measured || "", passStr(r.passed), r.inspector || "", r.note || "",
    ]));
    return rows;
}

// 機器校正記録
function buildCalibrationLogRows(state) {
    const rows = [["実施日", "機器名", "機器ID", "校正方法", "校正前値", "基準値", "校正後値", "結果", "次回実施日", "実施者", "備考"]];
    (state.calibrationLog || []).forEach(r => rows.push([
        r.date || "", r.equipment || "", r.equipmentId || "", r.method || "",
        r.beforeValue || "", r.refValue || "", r.afterValue || "", r.result || "",
        r.nextDate || "", r.performedBy || "", r.note || "",
    ]));
    return rows;
}

// アレルゲン切替確認記録
function buildAllergenLogRows(state) {
    const allergenKeys = state.product?.allergens || ["wheat", "egg", "milk", "soybean"];
    const ANAMES = { wheat:"小麦",buckwheat:"そば",egg:"卵",milk:"乳",peanut:"落花生",walnut:"くるみ",shrimp:"えび",crab:"かに",chicken:"鶏肉",beef:"牛肉",pork:"豚肉",soybean:"大豆" };
    const header = ["日付","区分","直前製品", ...allergenKeys.map(k => ANAMES[k]||k), "洗浄","判定","担当者","備考"];
    const rows = [header];
    (state.allergenLog || []).forEach(r => {
        const allergenChecks = allergenKeys.map(k => r.allergens?.[k] ? "○" : "—");
        const passStr = (r.passed === true || r.passed === "true") ? "OK" : (r.passed === false || r.passed === "false" ? "NG" : "");
        rows.push([r.date||"", r.type||"", r.prevProduct||"", ...allergenChecks, r.cleaning||"", passStr, r.inspector||"", r.note||""]);
    });
    return rows;
}

// 製品検査記録
function buildProductTestLogRows(state) {
    const rows = [["実施日","ロット","検査項目","検体区分","実施区分","結果","基準値","判定","検査機関","報告書No","備考"]];
    (state.productTestLog || []).forEach(r => rows.push([
        r.date||"", r.lot||"", r.testType||"", r.sampleType||"", r.method||"",
        r.result||"", r.standard||"", r.judgment||"", r.testLab||"", r.reportNo||"", r.note||"",
    ]));
    return rows;
}

// 使用水確認記録
function buildWaterLogRows(state) {
    const rows = [["日付", "区分", "色調", "臭気", "残留塩素(mg/L)", "適否判定", "担当者", "備考・是正措置"]];
    const passStr = v => (v === true || v === "true") ? "適合" : (v === false || v === "false" ? "不適合" : "");
    (state.waterLog || []).forEach(r => rows.push([
        r.date || "", r.shift || "", r.appearance || "", r.odor || "",
        r.chlorine || "", passStr(r.passed), r.inspector || "", r.note || "",
    ]));
    return rows;
}

// 教育訓練記録
function buildTrainingLogRows(state) {
    const rows = [["実施日", "訓練テーマ", "訓練内容", "対象者", "時間数", "講師", "実施形式", "確認結果", "確認者", "備考"]];
    (state.trainingLog || []).forEach(r => rows.push([
        r.date || "", r.theme || "", r.content || "", r.participants || "",
        r.duration || "", r.instructor || "", r.method || "", r.result || "",
        r.confirmedBy || "", r.note || "",
    ]));
    return rows;
}

// 製品出荷記録
function buildShipmentLogRows(state) {
    const rows = [["出荷日","ロット","製品名","数量","出荷先","伝票No.","消費・賞味期限","出荷判定","担当者","備考"]];
    (state.shipmentLog || []).forEach(r => {
        const rel = (r.released === true || r.released === "true") ? "出荷可" : (r.released === false || r.released === "false" ? "保留" : "");
        rows.push([r.date||"", r.lot||"", r.productName||"", r.quantity||"", r.destination||"", r.deliveryNo||"", r.expiryDate||"", rel, r.shippedBy||"", r.note||""]);
    });
    return rows;
}

// クレーム対応記録
function buildComplaintLogRows(state) {
    const rows = [["受付日","クレームNo","顧客名","ロット","種別","内容","対応内容","完了日","状態","担当者","備考"]];
    (state.complaintLog || []).forEach(r => rows.push([
        r.receivedDate||"", r.claimNo||"", r.customer||"", r.lot||"", r.category||"",
        r.content||"", r.action||"", r.closedDate||"", r.status||"", r.responsible||"", r.note||"",
    ]));
    return rows;
}

// 不適合管理表 (4-3)
function buildNcLogRows(state) {
    const rows = [["No.", "発生日時", "製品名・規格", "ロット", "カテゴリ",
        "廃棄", "再利用", "用途変更", "特別採用", "報告者", "備考"]];
    (state.nonconformanceLog || []).forEach(r => rows.push([
        r.no || "", r.occurredAt || "", r.productName || "", r.lot || "", r.category || "",
        r.dispositionCount?.廃棄 || 0, r.dispositionCount?.再利用 || 0,
        r.dispositionCount?.用途変更 || 0, r.dispositionCount?.特別採用 || 0,
        r.reportedBy || "", r.note || "",
    ]));
    return rows;
}

// 不適合処置書 (4-2)
function buildNcActionRows(state) {
    const rows = [["識別NO", "製品名・原材料", "ロット", "発生日時", "発生部署",
        "不適合内容(チェック項目)", "処置タイプ", "サブ番号", "処置備考",
        "処置日", "処置量", "処理日", "処理量", "検査者", "備考"]];
    (state.nonconformanceActions || []).forEach(n => {
        const checks = Object.entries(n.contentChecks || {}).filter(([k, v]) => v).map(([k]) => k).join("・");
        rows.push([
            n.identNo || "", n.productName || "", n.lot || "", n.occurredAt || "", n.department || "",
            checks, n.disposition?.type || "", n.disposition?.subOption || "", n.disposition?.note || "",
            n.processedAt || "", n.processedQty || "", n.treatedAt || "", n.treatedQty || "",
            n.inspector || "", n.note || "",
        ]);
    });
    return rows;
}

// 是正処置書 (5-1)
function buildCaRows(state) {
    const rows = [["識別番号", "関連部門", "情報源", "状態", "期限",
        "1.改善指摘内容", "2.原因", "3.類似事項調査", "調査結果",
        "4.是正計画", "計画必要性", "計画承認者", "計画承認日",
        "5.実施内容", "是正確認日", "6.効果確認方法",
        "最終確認日", "ISO管理責任者", "最終責任者"]];
    (state.correctiveActions || []).forEach(c => rows.push([
        c.identNo || "", c.relatedDept || "", c.source || "", c.status || "", c.dueDate || "",
        c.content || "", c.rootCause || "", c.similarInvestigation || "", c.investigationResult || "",
        c.correctionPlan || "", c.planNeeded || "", c.planApprovedBy || "", c.planApprovedAt || "",
        c.implementation || "", c.confirmedAt || "", c.effectMethod || "",
        c.finalConfirmedAt || "", c.isoManager || "", c.finalResponsible || "",
    ]));
    return rows;
}

function addSheet(wb, name, rows) {
    const ws = window.XLSX.utils.aoa_to_sheet(rows);
    // 列幅自動計算
    const colWidths = [];
    rows.forEach(r => r.forEach((c, i) => {
        const w = String(c ?? "").length;
        colWidths[i] = Math.max(colWidths[i] || 8, Math.min(w + 2, 40));
    }));
    ws["!cols"] = colWidths.map(w => ({ wch: w }));
    window.XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
}

// --- 各シートのデータビルダ ---
function buildTeamRows(s) {
    const t = s.team || {};
    const rows = [
        ["事業者名", s.organization?.name || ""],
        ["所在地", s.organization?.address || ""],
        ["営業許可", s.organization?.license || ""],
        ["HACCP取組区分", s.organization?.approach || ""],
        ["チームリーダー", t.leader || ""],
        [],
        ["No.", "役割", "氏名", "研修受講", "備考"],
    ];
    (t.members || []).forEach((m, i) => rows.push([i + 1, m.role, m.name, m.trained ? "受講済" : "未受講", m.note || ""]));
    return rows;
}

function buildSpecRows(s) {
    const p = s.product || {};
    return [
        ["製品名", p.name || ""],
        ["製品群", pgName(p.productGroup)],
        ["規格・分類", p.spec?.category || ""],
        ["規格基準", p.spec?.standard || ""],
        ["包装形態", p.packaging || ""],
        ["内容量", p.netWeight || ""],
        ["保存方法", p.storage || ""],
        ["消費期限／賞味期限", p.shelfLife || ""],
        ["加熱条件", p.heating ? `中心${p.heating.tempC}℃ × ${p.heating.timeSec}秒以上` : ""],
        ["アレルゲン", p.noAllergens ? "なし（不使用確認済）" : (p.allergens || []).map(allergenName).join("・") || "なし"],
    ];
}

function buildIngredientRows(s) {
    const rows = [["No.", "原材料名", "仕入先", "原産地", "アレルゲン", "規格・備考"]];
    (s.ingredients || []).forEach((ing, i) => rows.push([
        i + 1, ing.name, ing.supplier || "", ing.origin || "",
        (ing.allergens || []).map(allergenName).join("・"),
        ing.spec || "",
    ]));
    return rows;
}

function buildUsageRows(s) {
    const p = s.product || {};
    return [
        ["項目", "内容"],
        ["意図する用途", p.intendedUse || ""],
        ["対象消費者", p.targetUser || ""],
        ["対象年齢層", p.targetAge || ""],
        ["消費者への注意事項", p.consumerAdvice || ""],
    ];
}

function buildStepsRows(s, plan) {
    const ccpStepSeqs = new Set(plan.ccps.map(c => c.hazard.stepSeq));
    const rows = [["No.", "工程名", "区分", "条件・パラメータ", "CCP"]];
    (s.steps || []).forEach(st => rows.push([
        st.seq, st.name, ptName(st.type), st.params || "", ccpStepSeqs.has(st.seq) ? `CCP` : "",
    ]));
    return rows;
}

function buildHazardRows(plan) {
    const rows = [["工程No.", "工程名", "区分", "危害要因", "重大性", "頻度", "重要度", "管理手段", "CCP判定"]];
    plan.hazards.forEach(h => rows.push([
        h.stepSeq, h.stepName, h.category, h.name, h.severity, h.likelihood, h.significance,
        h.control, h.ccp.isCCP ? `CCP${h.ccpNo}` : (h.ccp.isPRP ? "PRP" : "—"),
    ]));
    return rows;
}

function buildCcpRows(plan) {
    const rows = [["CCP No.", "工程", "区分", "危害要因", "判定経路", "判定根拠"]];
    plan.ccps.forEach(c => rows.push([
        `CCP${c.ccpNo}`, `${c.hazard.stepName} (工程${c.hazard.stepSeq})`,
        c.hazard.category, c.hazard.name, c.hazard.ccp.path.join(" / "), c.hazard.ccp.rationale,
    ]));
    return rows;
}

function buildClRows(plan) {
    const rows = [["CCP", "工程", "パラメータ", "管理基準 (CL)", "科学的根拠"]];
    plan.ccps.forEach(c => rows.push([`CCP${c.ccpNo}`, c.hazard.stepName, c.cl.parameter, c.cl.criteria, c.cl.basis]));
    return rows;
}

function buildMonitoringRows(plan) {
    const rows = [["CCP", "工程", "What", "How", "Frequency", "Who", "Record"]];
    plan.ccps.forEach(c => rows.push([`CCP${c.ccpNo}`, c.hazard.stepName, c.mon.what, c.mon.how, c.mon.frequency, c.mon.who, c.mon.record]));
    return rows;
}

function buildCorrectiveRows(plan) {
    const rows = [["CCP", "工程", "逸脱トリガー", "改善措置", "責任者"]];
    plan.ccps.forEach(c => rows.push([`CCP${c.ccpNo}`, c.hazard.stepName, c.corr.trigger, c.corr.action, c.corr.responsible]));
    return rows;
}

function buildVerificationRows(plan) {
    const rows = [["CCP", "工程", "検証方法", "頻度", "エビデンス"]];
    plan.ccps.forEach(c => rows.push([`CCP${c.ccpNo}`, c.hazard.stepName, c.ver.method, c.ver.frequency, c.ver.evidence]));
    return rows;
}

function buildRecordsRows(plan) {
    const rows = [["No.", "記録名", "関連工程・項目", "保存期間", "記録責任者"]];
    let i = 0;
    plan.ccps.forEach(c => rows.push([++i, c.mon.record, `CCP${c.ccpNo} (${c.hazard.stepName})`, "2年間", c.mon.who]));
    [
        ["受入記録表", "原材料受入", "2年間", "受入担当者"],
        ["保管温度記録表", "冷蔵・冷凍保管", "2年間", "保管担当者"],
        ["清掃・消毒記録", "PRP", "1年間", "衛生管理責任者"],
        ["従事者健康確認記録", "PRP", "1年間", "衛生管理責任者"],
        ["教育訓練記録", "PRP", "3年間", "管理責任者"],
        ["苦情対応・回収記録", "全般", "5年間", "品質管理責任者"],
    ].forEach(([n, r, ret, who]) => rows.push([++i, n, r, ret, who]));
    return rows;
}

function buildPrpRows() {
    const rows = [["No.", "カテゴリ", "項目", "実施内容", "頻度"]];
    PRP_ITEMS.forEach((p, i) => rows.push([i + 1, p.category, p.title, p.desc, p.frequency]));
    return rows;
}

// === Helpers ===
function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}

function buildInternalAuditRows(state) {
    const TOTAL_AUDIT_ITEMS = 24; // matches AUDIT_CATEGORIES total in principles.js
    const rows = [["実施日","監査担当者","対象範囲","状態","監査所見","決定事項","次回予定日","確認済項目数","総チェック項目数"]];
    (state.internalAuditLog || []).forEach(r => {
        const checks = r.checks || {};
        const checked = Object.values(checks).filter(v => v === true || v === "true").length;
        rows.push([r.date||"", r.auditor||"", r.scope||"", r.status||"", r.findings||"", r.decisions||"", r.nextDate||"", checked, TOTAL_AUDIT_ITEMS]);
    });
    return rows;
}

function buildSupplierAuditRows(state) {
    const rows = [["評価日","仕入先名","対象品目","評価種別","判定","点数","認証・規格","指摘事項","次回予定"]];
    (state.supplierAuditLog || []).forEach(r => {
        rows.push([r.date||"", r.supplier||"", r.product||"", r.auditType||"", r.result||"", r.score||"", r.certifications||"", r.issues||"", r.nextDate||""]);
    });
    return rows;
}

function buildRecallRows(state) {
    const rows = [["回収番号","発覚日","ロットNo","製品名","回収区分","原因","数量","回収先","状況","完了日","備考"]];
    (state.recallLog || []).forEach(r => {
        rows.push([r.recallNo||"", r.detectedDate||"", r.lot||"", r.productName||"", r.recallType||"", r.cause||"", r.qty||"", r.destination||"", r.status||"", r.completedDate||"", r.note||""]);
    });
    return rows;
}

function buildLabelCheckRows(state) {
    const rows = [["確認日","ロットNo","製品名","アレルゲン","賞味期限","保存方法","内容量","栄養成分","総合判定","確認者","備考"]];
    (state.labelCheckLog || []).forEach(r => {
        rows.push([r.date||"", r.lot||"", r.productName||"", r.allergenOk||"", r.expiryOk||"", r.storageOk||"", r.weightOk||"", r.nutritionOk||"", r.result||"", r.checker||"", r.note||""]);
    });
    return rows;
}

function buildEnvironmentRows(state) {
    const rows = [["検査日","検査区分","採取場所","検査項目","規格値","測定値","判定","検査担当者","改善処置","備考"]];
    (state.environmentLog || []).forEach(r => {
        rows.push([r.date||"", r.testType||"", r.location||"", r.target||"", r.standard||"", r.measured||"", r.result||"", r.tester||"", r.action||"", r.note||""]);
    });
    return rows;
}

function buildPestControlRows(state) {
    const rows = [["点検日","点検区分","点検場所","害虫種別","発見状況","対応処置","使用薬剤","結果","点検者","備考"]];
    (state.pestControlLog || []).forEach(r => {
        rows.push([r.date||"", r.checkType||"", r.location||"", r.pestType||"", r.found||"", r.action||"", r.pesticide||"", r.result||"", r.inspector||"", r.note||""]);
    });
    return rows;
}

function buildFacilityRows(state) {
    const rows = [["点検日","点検区分","エリア","点検対象","点検内容・所見","状態","修繕・処置内容","修繕期限","点検者","備考"]];
    (state.facilityLog || []).forEach(r => {
        rows.push([r.date||"", r.checkType||"", r.area||"", r.target||"", r.detail||"", r.status||"", r.action||"", r.dueDate||"", r.inspector||"", r.note||""]);
    });
    return rows;
}

function buildProductionRows(state) {
    const rows = [["製造日","シフト","製品名","ロットNo","計画数","実績数","不良数","作業責任者","CCP判定","清掃実施","特記事項"]];
    (state.productionLog || []).forEach(r => {
        rows.push([r.date||"", r.shift||"", r.productName||"", r.lot||"", r.planQty||"", r.actualQty||"", r.defectQty||"", r.operator||"", r.ccpOk||"", r.cleaningOk||"", r.note||""]);
    });
    return rows;
}

function buildDocumentRegisterRows(state) {
    const rows = [["文書番号","文書名","区分","版","承認日","次回見直し","管理責任者","状態","保管場所","備考"]];
    (state.documentRegister || []).forEach(r => {
        rows.push([r.docId||"", r.docName||"", r.category||"", r.revision||"1.0", r.approvedDate||"", r.nextReviewDate||"", r.responsible||"", r.status||"最新版", r.location||"", r.note||""]);
    });
    return rows;
}

function buildAnnualReviewRows(state) {
    const rv = state.annualReview || {};
    const yr = String(rv.reviewYear || new Date().getFullYear());
    const inYear = r => (r.date || r.detectedDate || r.receivedDate || "").startsWith(yr);
    const pct = (total, fails) => total === 0 ? "—" : `${Math.round((total - fails) / total * 100)}% (${total - fails}/${total})`;
    const ccpRecs  = (state.ccpMonitoringLog || []).filter(inYear);
    const tempRecs = (state.temperatureLog   || []).filter(inYear);
    return [
        ["年次HACCPシステムレビュー", ""],
        ["レビュー対象年度", rv.reviewYear || yr],
        ["レビュー実施日",   rv.reviewDate || ""],
        ["実施者",           rv.reviewer   || ""],
        ["承認者",           rv.approver   || ""],
        [],
        ["【運用実績サマリー】", ""],
        ["CCPモニタリング 適合率", pct(ccpRecs.length, ccpRecs.filter(r => r.passed === false || r.passed === "false").length)],
        ["温度管理 適合率",         pct(tempRecs.length, tempRecs.filter(r => r.passed === false || r.passed === "false").length)],
        ["環境モニタリング 不合格", `${(state.environmentLog||[]).filter(r=>inYear(r)&&r.result==="不合格").length}件`],
        ["不適合処置件数",           `${(state.nonconformanceActions||[]).filter(inYear).length}件`],
        ["是正処置件数",             `${(state.correctiveActions||[]).filter(inYear).length}件`],
        ["クレーム件数",             `${(state.complaintLog||[]).filter(inYear).length}件`],
        ["内部監査実施回数",         `${(state.internalAuditLog||[]).filter(inYear).length}回`],
        ["仕入先評価実施件数",       `${(state.supplierAuditLog||[]).filter(inYear).length}件`],
        ["製品回収件数",             `${(state.recallLog||[]).filter(inYear).length}件`],
        ["教育訓練実施回数",         `${(state.trainingLog||[]).filter(inYear).length}回`],
        [],
        ["【HACCPシステムへの変更確認】", ""],
        ["製品・原材料の変更",   rv.changeProduct     || "—"],
        ["製造工程の変更",       rv.changeProcess     || "—"],
        ["法規制・規格の変更",   rv.changeLegislation || "—"],
        ["施設・設備の変更",     rv.changeFacility    || "—"],
        ["仕入先の変更",         rv.changeSupplier    || "—"],
        ["担当者・体制の変更",   rv.changePersonnel   || "—"],
        ["変更内容の詳細",       rv.changeDetail      || ""],
        [],
        ["【レビュー所見・評価】", ""],
        ["CCPモニタリング・検証結果の評価", rv.ccpReview      || ""],
        ["不適合・クレーム・是正処置の評価", rv.ncReview      || ""],
        ["内部監査・仕入先評価の評価",       rv.auditReview   || ""],
        ["教育訓練の実施状況評価",           rv.trainingReview || ""],
        ["文書管理の状況評価",               rv.documentReview || ""],
        [],
        ["【次年度への決定事項・改善計画】", ""],
        ["HACCPプランの改訂・改善事項", rv.improvements  || ""],
        ["次年度の重点取組事項",         rv.nextYearPlan  || ""],
        ["必要なリソース・設備投資",     rv.resourceNeeds || ""],
        [],
        ["【総合評価・承認】", ""],
        ["HACCPシステムの総合評価", rv.overallResult   || "—"],
        ["承認状態",               rv.approvalStatus  || "未承認"],
        ["総評・コメント",         rv.overallComment  || ""],
    ];
}

function today() { return new Date().toISOString().slice(0, 10); }
function slug(s) { return String(s || "haccp").replace(/[^A-Za-z0-9一-龯ぁ-んァ-ヶー]/g, "-").slice(0, 40); }
