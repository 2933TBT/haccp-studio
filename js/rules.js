// HACCP ルールエンジン: 工程・原材料・条件から危害要因とCCPを推論する
import { HAZARD_CATALOG, ALLERGENS } from "./data.js";

// --- 危害要因の列挙: 工程種別カタログ + 製品全体ルール ---
export function enumerateHazards(product) {
    const hazards = [];
    let hid = 1;
    const steps = product.steps || [];

    // 工程ごとのカタログ参照
    for (const step of steps) {
        const catalog = HAZARD_CATALOG[step.type] || [];
        for (const h of catalog) {
            hazards.push({
                id: `H${hid++}`,
                stepSeq: step.seq,
                stepName: step.name,
                stepType: step.type,
                category: h.cat,            // B / C / P / A
                name: h.name,
                control: h.control,
                severity: h.severity,
                likelihood: h.likelihood,
                significance: h.severity * h.likelihood,
                source: "catalog",
            });
        }
    }

    // 製品全体ルール: アレルゲン管理 (受入〜表示)
    const allergens = product.product?.allergens || [];
    if (allergens.length > 0) {
        const labelStep = steps.find(s => s.type === "label" || s.type === "pack");
        if (labelStep) {
            const names = allergens.map(c => ALLERGENS.find(a => a.code === c)?.name).filter(Boolean).join("・");
            hazards.push({
                id: `H${hid++}`,
                stepSeq: labelStep.seq,
                stepName: labelStep.name,
                stepType: labelStep.type,
                category: "A",
                name: `アレルゲン表示の誤り (${names})`,
                control: "ラベル承認・現品照合・特定原材料の表示確認",
                severity: 3,
                likelihood: 1,
                significance: 3,
                source: "allergen-rule",
            });
        }
    }

    return hazards;
}

// --- Codex デシジョンツリー ---
// Q1: 当該工程に管理手段が存在し、機能しているか
// Q2: 当該工程は、危害要因を予防・除去するか、許容レベルまで低減するために特に設計されているか
// Q3: 危害要因が許容レベルを超える可能性があるか / さらに増加する可能性があるか
// Q4: 後続工程で許容レベルまで低減・除去できるか
export function decideCCP(hazard, ctx) {
    const path = [];
    if (!ctx.hasControl) {
        path.push("Q1: No → 管理手段の導入要");
        return { isCCP: false, isPRP: true, path, rationale: "管理手段が未整備のため工程変更または前提条件プログラムでの管理を検討" };
    }
    path.push("Q1: Yes (管理手段あり)");

    if (ctx.specificallyDesigned) {
        path.push("Q2: Yes → CCP");
        return { isCCP: true, isPRP: false, path, rationale: "本工程は当該危害要因を管理する目的で設計されている" };
    }
    path.push("Q2: No");

    if (!ctx.significant) {
        path.push("Q3: No → CCPでない");
        return { isCCP: false, isPRP: false, path, rationale: "許容レベルを超える発生可能性が低い" };
    }
    path.push("Q3: Yes (許容を超える可能性)");

    if (ctx.furtherStepRemoves) {
        path.push("Q4: Yes → 後工程で管理 (CCPでない)");
        return { isCCP: false, isPRP: false, path, rationale: "後続工程で許容レベルまで低減可能" };
    }
    path.push("Q4: No → CCP");
    return { isCCP: true, isPRP: false, path, rationale: "本工程で管理しなければ危害が残存する" };
}

// 各危害要因のデシジョンツリー入力を、製品データから自動導出
// 食品衛生法の実務に基づき、CCPは原則として "kill step" (加熱) と "排除工程" (金属検出/X線) に限定。
// アレルゲン(A)・化学(C) は原則として一般衛生管理 (PRP) で管理する想定。
const KILL_STEPS_B = new Set(["heat-fry", "heat-bake", "heat-boil", "heat-steam"]);
const DETECT_STEPS_P = new Set(["metal-detect", "x-ray"]);

export function deriveCcpContext(hazard, product) {
    const steps = product.steps || [];
    const idx = steps.findIndex(s => s.seq === hazard.stepSeq);
    const downstream = idx >= 0 ? steps.slice(idx + 1) : [];

    // Q1: 管理手段がカタログ由来 (ある) → true
    const hasControl = !!hazard.control;

    // Q2: 「危害要因の予防・除去・許容レベルへの低減のために特に設計されている」
    //  - 生物的(B): 加熱殺菌工程
    //  - 物理的(P): 金属検出・X線検査
    //  - 化学的(C)/アレルゲン(A): 通常はPRPで管理 (CCPに昇格させない)
    let specificallyDesigned = false;
    if (hazard.category === "B" && KILL_STEPS_B.has(hazard.stepType)) specificallyDesigned = true;
    if (hazard.category === "P" && DETECT_STEPS_P.has(hazard.stepType)) specificallyDesigned = true;

    // Q3: 重大性 ≥ 3 かつ 重要度 ≥ 4 を「許容を超える」と判定 (2条件AND)
    const significant = hazard.severity >= 3 && hazard.significance >= 4;

    // Q4: 後工程に同じカテゴリの "管理工程" があるか (B→加熱, P→金属検出/X線)
    const hasDownstreamControl = downstream.some(s => {
        if (hazard.category === "B" && KILL_STEPS_B.has(s.type)) return true;
        if (hazard.category === "P" && DETECT_STEPS_P.has(s.type)) return true;
        return false;
    });

    // A/C はカテゴリ的にPRP管理を推奨 — Q3で"非significant"扱いに寄せる
    const isPrpCategory = (hazard.category === "A" || hazard.category === "C");
    const significantFinal = isPrpCategory ? false : significant;

    return { hasControl, specificallyDesigned, significant: significantFinal, furtherStepRemoves: hasDownstreamControl };
}

// --- 管理基準 (CL) の自動推論 ---
export function inferCL(hazard, product) {
    const t = hazard.stepType;
    const heating = product.product?.heating;

    if (t === "heat-fry" || t === "heat-bake" || t === "heat-boil") {
        const tempC = Math.max(heating?.tempC || 75, 75);
        const timeSec = Math.max(heating?.timeSec || 60, 60);
        return {
            parameter: "中心温度・加熱時間",
            criteria: `中心温度 ${tempC}℃ 以上 × ${Math.round(timeSec)}秒 以上`,
            basis: "厚生労働省 食品衛生法 加熱食肉製品の規格基準 / 大量調理施設衛生管理マニュアル",
        };
    }
    if (t === "heat-steam") {
        return {
            parameter: "中心温度・加熱時間",
            criteria: "中心温度 85℃ 以上 × 90秒 以上 (ノロウイルス対策)",
            basis: "厚生労働省 ノロウイルス食中毒予防対策",
        };
    }
    if (t === "metal-detect") {
        return {
            parameter: "金属検出感度",
            criteria: "Fe φ2.0mm 以下 / SUS φ3.0mm 以下を検出・全数排出",
            basis: "食品工場 一般的衛生管理ガイドライン",
        };
    }
    if (t === "x-ray") {
        return { parameter: "X線検査", criteria: "硬質異物 (φ2.0mm相当) を検出・全数排出", basis: "自社規格" };
    }
    if (t === "cool") {
        return { parameter: "冷却時間・温度", criteria: "30分以内に中心20℃以下、60分以内に10℃以下", basis: "大量調理施設衛生管理マニュアル" };
    }
    if (t === "freeze") {
        return { parameter: "凍結後品温", criteria: "中心温度 -18℃ 以下", basis: "冷凍食品の規格基準" };
    }
    if (t === "store-cold") {
        return { parameter: "庫内温度", criteria: "10℃ 以下 (推奨 5℃以下)", basis: "Codex GHP" };
    }
    if (t === "store-frozen") {
        return { parameter: "庫内温度", criteria: "-18℃ 以下", basis: "冷凍食品の規格基準" };
    }
    return { parameter: hazard.control, criteria: "該当工程の手順書に従う", basis: "自社手順書" };
}

// --- モニタリング・改善措置・検証の推論 ---
export function inferMonitoring(hazard, cl) {
    const t = hazard.stepType;
    if (t.startsWith("heat-")) return {
        what: "中心温度・加熱時間", how: "中心温度計による中心部測定", frequency: "ロットごと開始/中間/終了の3点", who: "加熱担当者", record: "加熱記録表",
    };
    if (t === "metal-detect" || t === "x-ray") return {
        what: "感度・排出動作", how: "テストピース通過確認", frequency: "始業時・休憩前後・終業時", who: "ライン担当者", record: "金属検出機点検表",
    };
    if (t === "cool") return {
        what: "中心温度", how: "中心温度計", frequency: "30分後・60分後", who: "製造担当者", record: "冷却記録表",
    };
    if (t === "freeze" || t === "store-frozen" || t === "store-cold") return {
        what: "庫内温度", how: "庫内温度計の目視またはデータロガー", frequency: "始業時・終業時 (1日2回以上)", who: "保管担当者", record: "保管温度記録表",
    };
    return {
        what: cl?.parameter || hazard.control, how: "目視・記録", frequency: "ロットごと", who: "工程担当者", record: `${hazard.stepName} 記録表`,
    };
}

export function inferCorrectiveAction(hazard) {
    const t = hazard.stepType;
    if (t.startsWith("heat-")) return {
        trigger: "中心温度が CL 未達",
        action: "①該当ロットを隔離し再加熱または廃棄判定 ②加熱条件 (温度・時間) を再設定 ③設備点検・温度計校正 ④原因究明と再発防止策の文書化",
        responsible: "製造責任者",
    };
    if (t === "metal-detect") return {
        trigger: "金属検出機反応または感度未達",
        action: "①直前検査合格分以降のロットを再検 ②金属検出機の調整・再校正 ③発生源の調査と是正 ④記録の保存",
        responsible: "品質管理責任者",
    };
    if (t === "cool") return {
        trigger: "冷却時間内に温度が下がらない",
        action: "①該当品の品温を測定し品質判定 ②冷却装置の点検 ③小ロット化・氷水冷却等の代替手段 ④原因の特定",
        responsible: "製造責任者",
    };
    if (t === "freeze" || t === "store-frozen" || t === "store-cold") return {
        trigger: "庫内温度の逸脱",
        action: "①庫内品の品温確認・隔離 ②冷却機の点検・修理 ③一時的な代替保管 ④品質判定後に廃棄/出荷可否決定",
        responsible: "保管責任者",
    };
    return {
        trigger: "管理基準からの逸脱",
        action: "①該当ロットの隔離 ②原因究明 ③是正措置 ④再発防止策の文書化",
        responsible: "工程責任者",
    };
}

export function inferVerification(hazard) {
    const t = hazard.stepType;
    if (t.startsWith("heat-")) return {
        method: "①温度計の校正 (年1回以上、毎日0/100℃確認) ②加熱記録の確認 ③定期的な微生物検査 (一般生菌・大腸菌群)",
        frequency: "毎月の記録レビュー / 年2回の校正・検査",
        evidence: "温度計校正証明書、加熱記録、微生物検査成績書",
    };
    if (t === "metal-detect") return {
        method: "①テストピースによる感度確認 ②金属検出機の専門業者点検 ③不良排出機構の動作確認",
        frequency: "毎日 (始業/終業) / 年1回 (専門点検)",
        evidence: "点検記録表、保守点検報告書",
    };
    return {
        method: "記録の確認・関連検査・内部監査",
        frequency: "月次レビュー / 年1回 内部監査",
        evidence: "記録表、内部監査報告書",
    };
}

// --- 統合: 1製品から CCP / CL / モニタリング … をまとめて生成 ---
export function buildHaccpPlan(product) {
    const hazards = enumerateHazards(product);

    // CCP判定
    const decided = hazards.map(h => {
        const ctx = deriveCcpContext(h, product);
        const dt = decideCCP(h, ctx);
        return { ...h, ccp: dt };
    });

    // CCP に番号を振る
    let ccpNo = 0;
    const ccpItems = [];
    for (const h of decided) {
        if (h.ccp.isCCP) {
            ccpNo += 1;
            const cl = inferCL(h, product);
            const mon = inferMonitoring(h, cl);
            const corr = inferCorrectiveAction(h);
            const ver = inferVerification(h);
            const item = { ccpNo, hazard: h, cl, mon, corr, ver };
            h.ccpNo = ccpNo;
            ccpItems.push(item);
        }
    }

    return { hazards: decided, ccps: ccpItems };
}
