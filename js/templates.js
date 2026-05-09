// 雛形生成: ウィザードで入力した原材料・工程・アレルゲン情報から、
// 原則1〜7の各様式の "ベース行" を自動生成するためのモジュール。
// ユーザーは生成された雛形を起点に、各セルを編集して自社の HACCP プランを完成させる。
import { ALLERGENS, HAZARD_CATALOG } from "./data.js";

const allergenName = c => ALLERGENS.find(a => a.code === c)?.name || c;

// =============================================================
//  原料記述書: 原材料 → desc{} を補完してテンプレを敷く
// =============================================================
export function generateIngredientDescriptions(state) {
    const ings = state.ingredients || [];
    let added = 0;
    ings.forEach((ing, i) => {
        if (!ing.desc) ing.desc = {};
        const d = ing.desc;
        const empty = !d.biological && !d.chemical && !d.physical && !d.composition && !d.source && !d.method && !d.packaging && !d.shelfLife && !d.prep && !d.criteria;
        if (!empty) return;
        // 原料名・アレルゲンから推定テンプレ
        const allergenLabels = (ing.allergens || []).map(allergenName);
        d.biological = allergenLabels.includes("鶏肉") || /肉/.test(ing.name) ? "サルモネラ・カンピロバクター等の付着可能性" : "—";
        d.chemical   = "—";
        d.physical   = /肉/.test(ing.name) ? "骨片・羽毛" : (/粉/.test(ing.name) ? "石・金属片" : "—");
        d.composition = `${ing.name}100%`;
        d.source     = ing.origin || "";
        d.method     = "—";
        d.packaging  = "—";
        d.shelfLife  = "—";
        d.prep       = "—";
        d.criteria   = ing.spec || "規格書に従う";
        if (!ing.ingNo) ing.ingNo = `M-${String(i + 1).padStart(3, "0")}`;
        if (!ing.catNo) ing.catNo = "原材料";
        added++;
    });
    return { added, total: ings.length };
}

// =============================================================
//  危害抽出書: 原料/機器/工程 から危害候補を生成
// =============================================================
export function generateHazardExtractions(state) {
    const list = state.hazardExtractions || [];
    const before = list.length;
    let nextNo = { B: 1, C: 1, P: 1, A: 1 };

    // 既存に同じ source+refNo+category+no の組合せがあれば追加しない
    const exists = (src, refNo, cat, no) => list.some(h => h.source === src && h.refNo === refNo && h.category === cat && h.no === no);

    // 原料編 — 各原料に対し、肉=B/P, 粉=B/P, 卵=B 等の典型危害を候補化
    (state.ingredients || []).forEach(ing => {
        const suggestions = [];
        const isMeat = /肉|魚|卵|乳/.test(ing.name);
        const isPowder = /粉|穀/.test(ing.name);
        if (isMeat) suggestions.push({ cat: "B", name: "病原微生物の付着 (サルモネラ・カンピロバクター等)", reason: "原料由来の常在菌" });
        if (isMeat) suggestions.push({ cat: "P", name: "羽毛・骨片", reason: "屠畜・解体由来" });
        if (isPowder) suggestions.push({ cat: "B", name: "カビ・酵母", reason: "保管中の繁殖" });
        if (isPowder) suggestions.push({ cat: "P", name: "石・金属片", reason: "原料由来" });
        if ((ing.allergens || []).length > 0) suggestions.push({ cat: "A", name: `アレルゲン (${(ing.allergens || []).map(allergenName).join("・")})`, reason: "成分由来" });

        // 一般原料: 残留農薬の化学的危害は1本入れておく
        if (suggestions.length === 0) suggestions.push({ cat: "C", name: "残留農薬・薬剤", reason: "原料由来" });

        // カテゴリごとにNoを採番
        const localNo = { B: 0, C: 0, P: 0, A: 0 };
        suggestions.forEach(s => {
            localNo[s.cat] += 1;
            if (exists("ingredient", ing.ingNo || ing.name, s.cat, localNo[s.cat])) return;
            list.push({
                id: `HE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                source: "ingredient",
                refNo: ing.ingNo || ing.name,
                refName: ing.name,
                category: s.cat,
                no: localNo[s.cat],
                name: s.name,
                reason: s.reason,
                routine: true,
                abnormal: false,
                emergency: false,
            });
        });
    });

    // プロセス編 — 工程種別から HAZARD_CATALOG を引いて生成
    (state.steps || []).forEach(step => {
        const catalog = HAZARD_CATALOG[step.type] || [];
        const localNo = { B: 0, C: 0, P: 0, A: 0 };
        catalog.forEach(c => {
            localNo[c.cat] += 1;
            if (exists("process", String(step.seq), c.cat, localNo[c.cat])) return;
            list.push({
                id: `HE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                source: "process",
                refNo: String(step.seq),
                refName: step.name,
                category: c.cat,
                no: localNo[c.cat],
                name: c.name,
                reason: "工程特性に基づく",
                routine: true,
                abnormal: false,
                emergency: false,
            });
        });
    });

    // 機械・器具編 — テンプレ (汎用)
    if (!list.some(h => h.source === "equipment")) {
        const equipBase = [
            { refNo: "E-01", refName: "包丁・まな板", cat: "B", name: "二次汚染（細菌増殖）", reason: "洗浄不足" },
            { refNo: "E-02", refName: "計量器・容器", cat: "P", name: "金属片・破片混入",      reason: "破損・摩耗" },
            { refNo: "E-03", refName: "加熱機器",     cat: "B", name: "加熱不足による菌残存",   reason: "温度管理不良" },
        ];
        equipBase.forEach((e, i) => {
            list.push({
                id: `HE-${Date.now().toString(36)}-eq${i}`,
                source: "equipment",
                refNo: e.refNo, refName: e.refName,
                category: e.cat, no: 1,
                name: e.name, reason: e.reason,
                routine: false, abnormal: true, emergency: false,
            });
        });
    }

    state.hazardExtractions = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  ハザード評価表: 危害抽出から評価ベース行を生成
// =============================================================
export function generateHazardEvaluations(state) {
    const evals = state.hazardEvaluations || [];
    const before = evals.length;
    const exists = (srcId) => evals.some(e => e.srcId === srcId);

    // 後工程で管理されるかを判定するヘルパ (B→加熱工程あり、P→金属検出ありの場合は原料/工程上流の危害は後工程で管理可能)
    const hasDownstreamHeat = (state.steps || []).some(s => /^heat-/.test(s.type));
    const hasDownstreamMetal = (state.steps || []).some(s => s.type === "metal-detect" || s.type === "x-ray");

    (state.hazardExtractions || []).forEach(h => {
        if (exists(h.id)) return;
        // 危害カテゴリに応じた既定値
        const isCriticalB = h.category === "B" && /サルモネラ|カンピロバクター|大腸菌|ノロウイルス|病原/.test(h.name || "");
        const isMetalP = h.category === "P" && /金属/.test(h.name || "");
        const isAllergen = h.category === "A";

        // 「特別な手段で管理が必要」と判定するのは、
        //  - B 危害 (病原菌) で、源が加熱工程 (= プロセス由来かつ加熱工程) であるとき
        //  - P 危害 (金属) で、源が金属検出工程であるとき
        // それ以外 (原料由来・機器由来) は、後工程で管理可能なら PRP に寄せる
        const stepType = (state.steps || []).find(s => String(s.seq) === h.refNo)?.type;
        const isProcessHeat = h.source === "process" && stepType && /^heat-/.test(stepType);
        const isProcessMetal = h.source === "process" && (stepType === "metal-detect" || stepType === "x-ray");

        let needsSpecialControl;
        if ((isCriticalB && isProcessHeat) || (isMetalP && isProcessMetal)) {
            needsSpecialControl = "特別な手段で管理が必要";
        } else if (isAllergen) {
            needsSpecialControl = "O-PRPで管理";
        } else if ((isCriticalB && hasDownstreamHeat) || (isMetalP && hasDownstreamMetal)) {
            // 原料・機器由来のB/P は、後工程で管理可能 → PRPで管理
            needsSpecialControl = "PRPで管理";
        } else {
            needsSpecialControl = "PRPで管理";
        }

        evals.push({
            id: `HV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            hazardName: h.name,
            srcId: h.id,
            acceptableLimit: isCriticalB ? "陰性 (加熱後)" : (isMetalP ? "Fe φ2.0/SUS φ3.0以下不検出" : "規格基準内"),
            limitBasis: isCriticalB ? "食品衛生法" : (isMetalP ? "自社規格" : "—"),
            riskSource: h.reason || "",
            riskFreq: isCriticalB ? "高" : "中",
            riskCharacter: isCriticalB ? "感染型/毒素型" : (isMetalP ? "硬質異物" : (isAllergen ? "アナフィラキシー" : "")),
            severity: isCriticalB ? "重大（入院/死亡例あり）" : (isMetalP ? "中（けが）" : (isAllergen ? "重大" : "中")),
            needsRemoval: "必要",
            needsSpecialControl,
        });
    });
    state.hazardEvaluations = evals;
    return { added: evals.length - before, total: evals.length };
}

// =============================================================
//  管理手段選択分類表: ハザード評価から候補
// =============================================================
export function generateControlMeasures(state) {
    const list = state.controlMeasures || [];
    const before = list.length;
    const exists = (id) => list.some(m => m.hazardId === id);

    (state.hazardEvaluations || []).forEach(ev => {
        if (exists(ev.id)) return;
        const decision = ev.needsSpecialControl?.includes("特別") ? "HACCP"
                       : ev.needsSpecialControl?.includes("O-PRP") ? "O-PRP"
                       : "PRP";
        const isHACCP = decision === "HACCP";
        list.push({
            id: `CM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            hazardId: ev.id,
            hazardName: ev.hazardName,
            measure: isHACCP
                ? (/金属/.test(ev.hazardName) ? "金属検出機による全数検査" : "中心温度管理（加熱）")
                : (/アレルゲン/.test(ev.hazardName) ? "ライン分離・洗浄・製造順序管理" : "受入・洗浄等の前提条件で管理"),
            q1Synergy:   "なし",
            q2Effective: "有効",
            q3Monitor:   "可能",
            q4Variation: "低",
            q5Position:  isHACCP ? "最終" : "前工程",
            q6Severity:  ev.severity?.includes("重大") ? "高" : "中",
            q7Special:   isHACCP ? "特別" : "通常",
            decision,
        });
    });
    state.controlMeasures = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  O-PRPプラン: 管理手段選択で O-PRP と判定された項目から
// =============================================================
export function generateOprpPlan(state) {
    const list = state.oprp || [];
    const before = list.length;
    const exists = (hazard, processName) => list.some(o => o.hazard === hazard && o.processName === processName);

    const oprpItems = (state.controlMeasures || []).filter(m => m.decision === "O-PRP");
    let no = list.length;
    oprpItems.forEach(m => {
        const ext = (state.hazardExtractions || []).find(h => h.name === m.hazardName && h.source === "process");
        const procStep = (state.steps || []).find(s => String(s.seq) === ext?.refNo);
        const processName = procStep ? `${procStep.name}（工程${procStep.seq}）` : m.measure;
        if (exists(m.hazardName, processName)) return;
        no++;
        const isAllergen = /アレルゲン/.test(m.hazardName);
        list.push({
            id: `OPRP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            oprpNo: `O-PRP${no}`,
            processName,
            hazard: m.hazardName,
            measure: m.measure || (isAllergen ? "ライン分離・洗浄・製造順序管理" : "一般衛生管理"),
            acceptableLevel: isAllergen ? "当該アレルゲン不検出" : "基準値以内",
            monWhat: isAllergen ? "ライン切替洗浄確認・ラベル照合" : "衛生状態の目視確認",
            monHow: isAllergen ? "洗浄効果確認（ATP測定または拭き取り検査）" : "チェックリスト確認",
            monFreq: isAllergen ? "製品切替毎" : "始業時・終業時",
            monWho: "品質管理担当者",
            correction: isAllergen
                ? "①ラインの再洗浄 ②製品の保留・再検査 ③原因究明と再発防止"
                : "①是正処置の実施 ②記録による確認 ③管理責任者への報告",
            record: `O-PRP${no}モニタリング記録`,
        });
    });
    state.oprp = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  HACCPプラン: 管理手段選択で HACCP と判定された項目から
// =============================================================
export function generateCcpPlan(state) {
    const list = state.ccpPlan || [];
    const before = list.length;
    const exists = (hazardName, processName) => list.some(c => c.hazard === hazardName && c.processName === processName);

    const haccpItems = (state.controlMeasures || []).filter(m => m.decision === "HACCP");
    let no = list.length;
    haccpItems.forEach(m => {
        // 危害名から該当工程を推定 (危害抽出表の source=process を参照)
        const ext = (state.hazardExtractions || []).find(h => h.name === m.hazardName && h.source === "process");
        const procStep = (state.steps || []).find(s => String(s.seq) === ext?.refNo);
        const processName = procStep ? `${procStep.name}（工程${procStep.seq}）` : m.measure;
        if (exists(m.hazardName, processName)) return;
        no++;
        const isMetal = /金属/.test(m.hazardName) || /金属/.test(m.measure);
        list.push({
            id: `CCP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            ccpNo: `CCP${no}`,
            processName,
            hazard: m.hazardName,
            cl: isMetal ? "Fe φ2.0mm 以下／SUS φ3.0mm 以下を検出・全数排出"
                       : `中心温度 ${state.product?.heating?.tempC || 75}℃ 以上 × ${state.product?.heating?.timeSec || 60}秒 以上`,
            monWhat: isMetal ? "感度確認・排出動作" : "中心温度・加熱時間",
            monHow:  isMetal ? "テストピース通過確認" : "中心温度計／タイマー",
            monFreq: isMetal ? "始業時・休憩前後・終業時" : "ロット毎 開始/中間/終了",
            monWho:  isMetal ? "ライン担当者" : "加熱担当者",
            correction: isMetal
                ? "①検出時の隔離・再検査 ②機器調整・再校正 ③発生源調査"
                : "①温度未達品の隔離・再加熱または廃棄判定 ②加熱条件再設定 ③設備点検",
            record:  isMetal ? `金属検出機点検表（CCP${no}）` : `加熱記録表（CCP${no}）`,
            verification: isMetal
                ? "①日次の感度確認 ②年1回の専門業者点検 ③記録の上長確認"
                : "①温度計校正 ②加熱記録の上長確認 ③月次の微生物検査",
        });
    });
    state.ccpPlan = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  検証記録: HACCPプラン + 標準検証活動から
// =============================================================
export function generateVerifications(state) {
    const list = state.verifications || [];
    const before = list.length;
    const exists = (target, method) => list.some(v => v.target === target && v.method === method);

    (state.ccpPlan || []).forEach(c => {
        const isMetal = /金属/.test(c.hazard) || /金属/.test(c.processName);
        const items = isMetal
            ? [
                { method: "テストピース感度確認",   frequency: "始業/終業 1日2回", responsible: "ライン担当者",   evidence: "金属検出機点検表" },
                { method: "専門業者による点検",     frequency: "年1回",          responsible: "品質管理責任者", evidence: "保守点検報告書" },
              ]
            : [
                { method: "中心温度計校正",         frequency: "毎日 (0/100℃) / 年1回 (校正業者)", responsible: "品質管理責任者", evidence: "校正証明書" },
                { method: "微生物検査（一般生菌・大腸菌群）", frequency: "月1回",                  responsible: "品質管理責任者", evidence: "検査成績書" },
              ];
        items.forEach(it => {
            if (exists(`${c.ccpNo}（${c.processName}）`, it.method)) return;
            list.push({
                id: `V-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                target: `${c.ccpNo}（${c.processName}）`,
                method: it.method, frequency: it.frequency, responsible: it.responsible,
                lastDate: "", result: "未実施", evidence: it.evidence,
            });
        });
    });

    // HACCPプラン全体・PRP の標準検証
    const standardChecks = [
        { target: "HACCPプラン全体", method: "内部監査（ISO22000）", frequency: "年1回",   responsible: "ISO管理責任者",  evidence: "内部監査報告書" },
        { target: "PRP",             method: "月次PRPチェックリスト", frequency: "月1回",   responsible: "衛生管理責任者", evidence: "PRPチェック記録" },
    ];
    standardChecks.forEach(s => {
        if (!exists(s.target, s.method)) {
            list.push({
                id: `V-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                target: s.target, method: s.method, frequency: s.frequency,
                responsible: s.responsible, lastDate: "", result: "未実施", evidence: s.evidence,
            });
        }
    });

    state.verifications = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  全雛形を一括生成 (依存順に実行)
// =============================================================
export function generateAllTemplates(state) {
    const r1 = generateIngredientDescriptions(state);
    const r2 = generateHazardExtractions(state);
    const r3 = generateHazardEvaluations(state);
    const r4 = generateControlMeasures(state);
    const r5 = generateOprpPlan(state);
    const r6 = generateCcpPlan(state);
    const r7 = generateVerifications(state);
    return {
        ingredientDesc: r1, hazardExtractions: r2, hazardEvaluations: r3,
        controlMeasures: r4, oprpPlan: r5, ccpPlan: r6, verifications: r7,
        summary: `原料記述書 ${r1.added}件 / 危害抽出 ${r2.added}件 / ハザード評価 ${r3.added}件 / 管理手段 ${r4.added}件 / O-PRPプラン ${r5.added}件 / HACCPプラン ${r6.added}件 / 検証 ${r7.added}件 を追加しました`,
    };
}

// =============================================================
//  衛生点検記録: 本日の始業・終業分を追加
// =============================================================
export function generateSanitationLog(state) {
    const list = state.sanitationLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    ["朝", "終業"].forEach(shift => {
        list.push({
            id: `SL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            date: today, shift,
            facility: "", machines: "", waste: "", personnel: "", pest: "",
            chlorine: "", inspector: "", verifiedBy: "", note: "",
        });
    });
    state.sanitationLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  従事者健康確認記録: 本日分をチームメンバーから生成
// =============================================================
export function generateHealthLog(state) {
    const list = state.healthLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const members = state.team?.members || [];
    if (!members.length) {
        list.push({
            id: `HL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            date: today, name: "", temperature: "", status: "良好", worksToday: "true", verifiedBy: "", note: "",
        });
    } else {
        members.forEach(m => {
            list.push({
                id: `HL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                date: today, name: m.name || m.role, temperature: "", status: "良好", worksToday: "true",
                verifiedBy: state.team?.leader || "", note: "",
            });
        });
    }
    state.healthLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  CCP モニタリング記録: 本日分のブランク行を CCP プランから生成
// =============================================================
export function generateCcpMonitoringLog(state) {
    const list = state.ccpMonitoringLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const ccps = state.ccpPlan || [];
    if (!ccps.length) return { added: 0, total: list.length };
    ccps.forEach(c => {
        list.push({
            id: `ML-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            date: today, lot: "",
            ccpNo: c.ccpNo, processName: c.processName, cl: c.cl,
            time: "", measuredValue: "", passed: "",
            correction: "", measuredBy: c.monWho || "", verifiedBy: "", note: "",
        });
    });
    state.ccpMonitoringLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  原材料受入記録: 本日分のブランク行を原材料リストから生成
// =============================================================
export function generateReceivingLog(state) {
    const list = state.receivingLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const ings = state.ingredients || [];
    if (!ings.length) return { added: 0, total: list.length };
    ings.forEach(ing => {
        list.push({
            id: `RL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            date: today,
            ingNo: ing.ingNo || "", ingName: ing.name || "", supplier: ing.supplier || "",
            lot: "", quantity: "", temperature: "", appearance: "", expiryDate: "",
            passed: "", receivedBy: "", note: "",
        });
    });
    state.receivingLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  冷蔵・冷凍温度記録: 本日の朝・昼・終業分を追加
// =============================================================
export function generateTemperatureLog(state) {
    const list = state.temperatureLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const today8 = today.slice(0, 4); // year prefix for dedup

    // Determine units from existing records, or use defaults
    const knownUnits = [...new Set((list).map(r => r.unit).filter(Boolean))];
    const units = knownUnits.length > 0 ? knownUnits : ["冷蔵庫1 (原材料)", "冷凍庫1 (製品)"];

    const todayRecords = list.filter(r => r.date === today);
    units.forEach(unit => {
        ["朝", "昼", "終業"].forEach(shift => {
            const exists = todayRecords.some(r => r.unit === unit && r.shift === shift);
            if (exists) return;
            list.push({
                id: `TL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                date: today, shift, unit,
                setTemp: unit.includes("冷凍") ? "-18" : "5",
                measured: "", passed: "", inspector: "", note: "",
            });
        });
    });
    state.temperatureLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  機器校正記録: CCPプランの測定機器リストから生成
// =============================================================
export function generateCalibrationLog(state) {
    const list = state.calibrationLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const leader = state.team?.leader || "";

    // Build equipment list from CCP plan
    const ccps = state.ccpPlan || [];
    const equipmentDefs = [];
    ccps.forEach(c => {
        const isMetal = /金属/.test(c.processName) || /金属/.test(c.hazard);
        const isTemp = /温度|加熱|殺菌/.test(c.processName) || /加熱/.test(c.hazard);
        if (isMetal) equipmentDefs.push({ name: "金属検出機", id: `MD-${c.ccpNo}`, method: "テストピース(Fe/SUS)による感度確認", ref: "Fe φ2.0mm / SUS φ3.0mm" });
        if (isTemp)  equipmentDefs.push({ name: "中心温度計", id: `TH-${c.ccpNo}`, method: "氷水(0℃)・沸騰水(100℃)による2点校正", ref: "0℃ ± 1℃ / 100℃ ± 1℃" });
    });
    // Add standard items if no CCPs
    if (!equipmentDefs.length) {
        equipmentDefs.push({ name: "中心温度計", id: "TH-001", method: "氷水(0℃)・沸騰水(100℃)による2点校正", ref: "0℃ ± 1℃ / 100℃ ± 1℃" });
    }

    const exists = (name) => list.some(r => r.equipment === name && r.date === today);
    equipmentDefs.forEach(eq => {
        if (exists(eq.name)) return;
        list.push({
            id: `CL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            date: today, equipment: eq.name, equipmentId: eq.id,
            method: eq.method, beforeValue: "", refValue: eq.ref,
            afterValue: "", result: "", nextDate: "", performedBy: leader, note: "",
        });
    });
    state.calibrationLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  使用水確認記録: 本日の朝・終業分を追加
// =============================================================
export function generateWaterLog(state) {
    const list = state.waterLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    ["朝", "終業"].forEach(shift => {
        list.push({
            id: `WL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            date: today, shift,
            appearance: "無色透明", odor: "無臭", chlorine: "", passed: "",
            inspector: "", note: "",
        });
    });
    state.waterLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  教育訓練記録: HACCPチーム向け標準訓練計画を生成
// =============================================================
export function generateTrainingLog(state) {
    const list = state.trainingLog || [];
    const before = list.length;
    const year = new Date().getFullYear();
    const leader = state.team?.leader || "";
    const members = state.team?.members || [];
    const participants = members.length ? members.map(m => m.name || m.role).join("・") : "全従事者";

    const plans = [
        { month: 4,  theme: "HACCP制度概論・社内HACCPプラン説明",     content: "HACCPの7原則12手順の概要、自社HACCPプランの確認",     method: "講義" },
        { month: 7,  theme: "一般衛生管理 (PRP) 実践訓練",              content: "手洗い・清掃・消毒・健康管理の実技訓練",              method: "実技" },
        { month: 10, theme: "CCP管理・モニタリング訓練",                content: "CCPの管理基準(CL)の確認、記録表の記入方法",          method: "OJT" },
        { month: 1,  theme: "年次内部監査・改善点共有",                  content: "1年間の記録レビュー、不適合事例の共有、改善提案",     method: "講義" },
    ];

    const exists = (theme) => list.some(r => r.theme === theme && r.date?.startsWith(String(year)));
    plans.forEach(p => {
        if (exists(p.theme)) return;
        const dateStr = `${p.month < new Date().getMonth() + 1 ? year + 1 : year}-${String(p.month).padStart(2, "0")}-01`;
        list.push({
            id: `TL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            date: dateStr,
            theme: p.theme, content: p.content, participants, duration: "1",
            instructor: leader, method: p.method, result: "未確認",
            confirmedBy: leader, note: "",
        });
    });
    state.trainingLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  製品検査記録: 標準微生物・官能検査の月次テンプレートを追加
// =============================================================
export function generateProductTestLog(state) {
    const list = state.productTestLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const productName = state.product?.name || "";

    const standardTests = [
        { testType: "一般生菌数", sampleType: "製品", method: "外注検査", standard: "10,000以下/g" },
        { testType: "大腸菌群",   sampleType: "製品", method: "外注検査", standard: "陰性" },
        { testType: "黄色ブドウ球菌", sampleType: "製品", method: "外注検査", standard: "陰性" },
        { testType: "官能検査",   sampleType: "製品", method: "社内検査", standard: "基準値内" },
    ];

    const hasHeating = (state.processes || []).some(p => /加熱|フライ|蒸し|焼/.test(p.name || ""));
    if (hasHeating) {
        standardTests.splice(1, 0, { testType: "サルモネラ", sampleType: "製品", method: "外注検査", standard: "陰性/25g" });
    }

    const lot = `L${today.replace(/-/g, "")}-A`;
    standardTests.forEach(t => {
        list.push({
            id: `PT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            date: today, lot,
            testType: t.testType, sampleType: t.sampleType,
            method: t.method, result: "", standard: t.standard,
            judgment: "", testLab: "", reportNo: "", note: "",
        });
    });
    state.productTestLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  アレルゲン切替確認記録: 本日の確認行を追加
// =============================================================
export function generateAllergenLog(state) {
    const list = state.allergenLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const productName = state.product?.name || "";
    const allergens = state.product?.allergens || [];
    const allergenChecks = {};
    allergens.forEach(a => allergenChecks[a] = "");

    list.push({
        id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        date: today, shift: "朝",
        prevProduct: "", type: "製品切替",
        allergenChecks,
        cleaningMethod: "CIP洗浄", cleaningResult: "",
        rinseResult: "", visualResult: "",
        passed: "", inspector: "", note: "",
    });
    state.allergenLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  製品出荷記録: 本日の出荷記録行を追加
// =============================================================
export function generateShipmentLog(state) {
    const list = state.shipmentLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const productName = state.product?.name || "";
    const lot = `L${today.replace(/-/g, "")}-A`;

    list.push({
        id: `SH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        date: today, productName, lot,
        quantity: "", unit: "ケース",
        destination: "", vehicle: "",
        tempAtShipping: "", released: "出荷可",
        inspector: state.team?.leader || "",
        note: "",
    });
    state.shipmentLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  クレーム対応記録: 新規クレーム記録行を追加
// =============================================================
export function generateComplaintLog(state) {
    const list = state.complaintLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const year = today.slice(0, 4);
    const seq = String(list.length + 1).padStart(3, "0");

    list.push({
        id: `CL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        claimNo: `CL${year}-${seq}`,
        receivedDate: today, customer: "", category: "異物混入",
        product: state.product?.name || "", lot: "",
        content: "", rootCause: "",
        response: "", caNo: "",
        responseDate: "", closedDate: "",
        responsible: state.team?.leader || "",
        status: "未着手", note: "",
    });
    state.complaintLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  是正処置書: 未対応の不適合・クレームから是正処置書を生成
// =============================================================
export function generateCorrectiveActions(state) {
    const list = state.correctiveActions || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const year = today.slice(0, 4);
    const seq = String(list.length + 1).padStart(3, "0");
    const leader = state.team?.leader || "";

    // Look for open complaints or recent CCP failures to auto-fill
    const openComplaints = (state.complaintLog || []).filter(r => r.status === "未着手" || r.status === "対応中");
    const recentCcpFails = (state.ccpMonitoringLog || []).filter(r => r.passed === false || r.passed === "false");

    let source = "不適合";
    let content = "";
    if (openComplaints.length > 0) {
        const c = openComplaints[0];
        source = "顧客苦情";
        content = `クレーム ${c.claimNo || ""}: ${c.category || ""} — ${c.content || ""}`;
    } else if (recentCcpFails.length > 0) {
        const f = recentCcpFails[recentCcpFails.length - 1];
        source = "CCP";
        content = `CCPモニタリング不合格: ${f.ccpNo || ""} ${f.processName || ""}（測定値: ${f.measuredValue || ""}）`;
    }

    list.push({
        id: `CA-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        identNo: `CA${year}-${seq}`,
        date: today, source, relatedDept: "",
        content, rootCause: "", similarInvestigation: "", investigationResult: "",
        correctionPlan: "", planNeeded: "要",
        planApprovedBy: leader, planApprovedAt: "",
        implementation: "", confirmedAt: "",
        effectMethod: "", finalConfirmedAt: "",
        isoManager: leader, finalResponsible: leader,
        dueDate: "", status: "未着手", note: "",
    });
    state.correctiveActions = list;
    return { added: list.length - before, total: list.length };
}

export function generateProductionLog(state) {
    const list = state.productionLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const yr = today.slice(0, 4);
    const mo = today.slice(5, 7);
    const dd = today.slice(8, 10);
    const lotNo = `L${yr}${mo}${dd}`;
    const productName = state.product?.name || "";
    const existing = list.map(r => r.lot);
    if (existing.includes(lotNo)) return { added: 0, total: list.length };
    list.push({
        id: `PL-${Date.now().toString(36)}`,
        date: today, shift: "日勤",
        productName, lot: lotNo,
        planQty: "", actualQty: "", defectQty: "0",
        operator: state.team?.leader || "",
        ccpOk: "合格", cleaningOk: "実施", note: "",
    });
    state.productionLog = list;
    return { added: list.length - before, total: list.length };
}

export function generateLabelCheckLog(state) {
    const list = state.labelCheckLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const existing = list.map(r => r.date);
    if (existing.includes(today)) return { added: 0, total: list.length };
    const yr = today.slice(0, 4); const mo = today.slice(5, 7); const dd = today.slice(8, 10);
    list.push({
        id: `LC-${Date.now().toString(36)}`,
        date: today, lot: `L${yr}${mo}${dd}`,
        productName: state.product?.name || "",
        allergenOk: "合格", expiryOk: "合格", storageOk: "合格",
        weightOk: "合格", nutritionOk: "合格", result: "合格",
        checker: state.team?.leader || "", note: "",
    });
    state.labelCheckLog = list;
    return { added: list.length - before, total: list.length };
}

export function generateEnvironmentLog(state) {
    const list = state.environmentLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const locations = ["加工室作業台","冷蔵庫内壁","排水口周辺","手洗い場"];
    locations.forEach(loc => {
        if (list.some(r => r.date === today && r.location === loc)) return;
        list.push({
            id: `EM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`,
            date: today, testType: "拭き取り検査", location: loc,
            target: "一般生菌数", standard: "100 CFU/100cm²",
            measured: "", result: "合格",
            tester: state.team?.leader || "", action: "", note: "",
        });
    });
    state.environmentLog = list;
    return { added: list.length - before, total: list.length };
}

export function generatePestControlLog(state) {
    const list = state.pestControlLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    if (list.some(r => r.date === today && r.checkType === "日常点検")) return { added: 0, total: list.length };
    const locations = ["加工室入口","排水溝周辺","倉庫隅","トラップ（加工室）","トラップ（倉庫）"];
    locations.forEach(loc => {
        list.push({
            id: `PC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,4)}`,
            date: today, checkType: "日常点検", location: loc,
            pestType: "未確認", found: "なし",
            action: "—", pesticide: "", result: "問題なし",
            inspector: state.team?.leader || "", note: "",
        });
    });
    state.pestControlLog = list;
    return { added: list.length - before, total: list.length };
}

export function generateFacilityLog(state) {
    const list = state.facilityLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const mo = today.slice(0, 7);
    if (list.some(r => r.date?.startsWith(mo) && r.checkType === "月次点検")) return { added: 0, total: list.length };
    const checks = [
        { area: "加工室", target: "床・壁・天井のひび割れ・汚れ" },
        { area: "加工室", target: "ドア・窓の密閉性（虫・ほこり侵入防止）" },
        { area: "冷蔵・冷凍室", target: "扉パッキンの劣化・温度計動作" },
        { area: "排水設備", target: "排水口フィルター・グリストラップ清掃状態" },
        { area: "換気設備", target: "換気扇フィルター清掃・動作確認" },
        { area: "搬入出口", target: "エアカーテン・虫よけ設備の動作" },
    ];
    checks.forEach(c => {
        list.push({
            id: `FL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,4)}`,
            date: today, checkType: "月次点検",
            area: c.area, target: c.target, detail: "",
            status: "良好", action: "", dueDate: "",
            inspector: state.team?.leader || "", note: "",
        });
    });
    state.facilityLog = list;
    return { added: list.length - before, total: list.length };
}

export function generateRecallLog(state) {
    const list = state.recallLog || [];
    const before = list.length;
    const today = new Date().toISOString().slice(0, 10);
    const year = today.slice(0, 4);
    const seq = String(list.filter(r => r.recallNo?.startsWith(`RC${year}`)).length + 1).padStart(3, "0");
    list.push({
        id: `RL-${Date.now().toString(36)}`,
        recallNo: `RC${year}-${seq}`, detectedDate: today,
        lot: "", productName: state.product?.name || "",
        recallType: "自主回収", cause: "", qty: "",
        destination: "", status: "対応中", completedDate: "", note: "",
    });
    state.recallLog = list;
    return { added: list.length - before, total: list.length };
}

// =============================================================
//  不適合管理表(4-3): 不適合処置書(4-2)から集計行を生成
// =============================================================
export function generateNonconformanceLog(state) {
    const log   = state.nonconformanceLog    || [];
    const acts  = state.nonconformanceActions || [];
    const before = log.length;
    if (!acts.length) return { added: 0, total: log.length };

    const existingIds = new Set(log.map(r => r.sourceId).filter(Boolean));
    acts.forEach(a => {
        if (existingIds.has(a.id || a.identNo)) return;
        const dc = { 廃棄: 0, 再利用: 0, 用途変更: 0, 特別採用: 0 };
        const disp = String(a.disposition?.type || a.disposition || "");
        if (disp.includes("廃棄"))   dc.廃棄++;
        else if (disp.includes("再加工") || disp.includes("再利用")) dc.再利用++;
        else if (disp.includes("用途変更")) dc.用途変更++;
        else if (disp.includes("特別採用") || disp.includes("出荷可")) dc.特別採用++;

        const nextNo = (log[log.length - 1]?.no || log.length) + 1;
        log.push({
            id: `NCL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`,
            no: nextNo,
            occurredAt: a.occurredAt?.slice(0, 10) || a.detectedDate || "",
            productName: a.productName || "",
            lot: a.lot || "",
            category: a.category || a.defectType || "",
            dispositionCount: dc,
            reportedBy: a.reportedBy || a.responsible || "",
            note: `処置書No: ${a.identNo || a.id || ""}`,
            sourceId: a.id || a.identNo,
        });
        existingIds.add(a.id || a.identNo);
    });
    state.nonconformanceLog = log;
    return { added: log.length - before, total: log.length };
}

// 雛形生成のメニュー (どのフォームで何を生成できるかのマッピング)
export const TEMPLATE_GENERATORS = {
    "ingredient-desc":    { fn: generateIngredientDescriptions, label: "原材料リストから原料記述書を生成" },
    "hazard-extractions": { fn: generateHazardExtractions,      label: "原材料・工程から危害抽出書を生成" },
    "hazard-evaluations": { fn: generateHazardEvaluations,      label: "危害抽出書からハザード評価を生成" },
    "control-measures":   { fn: generateControlMeasures,        label: "ハザード評価から管理手段を生成" },
    "oprp-plan":          { fn: generateOprpPlan,               label: "管理手段(O-PRP判定)からO-PRPプランを生成" },
    "ccp-plan":           { fn: generateCcpPlan,                label: "管理手段(HACCP判定)からCCPプランを生成" },
    "verifications":      { fn: generateVerifications,          label: "CCPプランから検証記録を生成" },
    "ccp-monitoring-log": { fn: generateCcpMonitoringLog,       label: "本日のCCPモニタリング記録行を追加" },
    "receiving-log":      { fn: generateReceivingLog,           label: "本日の原材料受入記録行を追加" },
    "sanitation-log":     { fn: generateSanitationLog,         label: "本日の衛生点検表（始業・終業）を追加" },
    "health-log":         { fn: generateHealthLog,             label: "本日の従事者健康確認行を追加" },
    "temperature-log":    { fn: generateTemperatureLog,        label: "本日の冷蔵・冷凍温度記録（朝・昼・終業）を追加" },
    "calibration-log":    { fn: generateCalibrationLog,        label: "CCPプランの測定機器校正記録行を追加" },
    "water-log":          { fn: generateWaterLog,              label: "本日の使用水確認記録（朝・終業）を追加" },
    "training-log":       { fn: generateTrainingLog,           label: "年間標準訓練計画（4件）を生成" },
    "product-test-log":   { fn: generateProductTestLog,        label: "標準製品検査（微生物・官能）の月次テンプレを追加" },
    "shipment-log":       { fn: generateShipmentLog,           label: "本日の出荷記録行を追加" },
    "allergen-log":       { fn: generateAllergenLog,           label: "本日のアレルゲン切替確認行を追加" },
    "complaint-log":      { fn: generateComplaintLog,          label: "新規クレーム記録行を追加" },
    "nonconformance-log": { fn: generateNonconformanceLog,      label: "不適合処置書(4-2)から管理表(4-3)の集計行を生成" },
    "corrective-actions": { fn: generateCorrectiveActions,     label: "未対応の不適合・クレームから是正処置書を生成" },
    "production-log":     { fn: generateProductionLog,         label: "本日の製造工程日報行を追加" },
    "recall-log":         { fn: generateRecallLog,             label: "新規回収記録行を追加" },
    "label-check-log":    { fn: generateLabelCheckLog,         label: "本日の食品表示確認記録行を追加" },
    "environment-log":    { fn: generateEnvironmentLog,        label: "環境モニタリング検査行を追加" },
    "pest-control-log":   { fn: generatePestControlLog,        label: "本日の害虫防除点検記録行を追加" },
    "facility-log":       { fn: generateFacilityLog,           label: "施設設備月次点検チェックリストを追加" },
};
