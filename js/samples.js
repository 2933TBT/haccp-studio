// サンプル製品: 冷凍唐揚げ — TBT/ISO22000 様式準拠の完全データセット
export const SAMPLE_FROZEN_KARAAGE = {
    organization: {
        name: "サンプル食品株式会社",
        address: "東京都〇〇区〇〇 1-2-3",
        license: "食肉製品製造業 / 冷凍食品製造業",
        scale: "small",
        approach: "考え方を取り入れた衛生管理",
    },
    team: {
        leader: "山田 太郎",
        members: [
            { role: "HACCPチームリーダー / 食品安全TL", name: "山田 太郎", trained: true,  note: "HACCP指導者養成研修修了" },
            { role: "製造責任者",                       name: "鈴木 一郎", trained: true,  note: "" },
            { role: "品質管理責任者",                   name: "田中 花子", trained: true,  note: "食品衛生管理者" },
            { role: "衛生管理責任者",                   name: "佐藤 次郎", trained: false, note: "次年度受講予定" },
            { role: "原材料・購買担当",                 name: "高橋 三郎", trained: false, note: "" },
        ],
    },
    product: {
        name: "冷凍若鶏唐揚げ",
        productGroup: "frozen",
        spec: {
            category: "加熱後摂取冷凍食品（凍結直前加熱）",
            standard: "細菌数 3×10^6/g 以下、大腸菌群 陰性 (食品衛生法 規格基準)",
        },
        storage: "-18℃以下で冷凍保管",
        shelfLife: "製造日より12ヶ月",
        packaging: "ポリエチレン袋（一次包装）／段ボール（二次包装）",
        netWeight: "1kg／袋",
        heating: { tempC: 75, timeSec: 60 },
        allergens: ["wheat", "egg", "soybean", "chicken"],
        consumerAdvice: "中心まで十分に加熱してからお召し上がりください（180℃の油で約4分）。",
        targetUser: "一般消費者・業務用（給食、外食）",
        intendedUse: "解凍後フライ加熱して喫食",
        targetAge: "全年齢層（乳児・高齢者含む）",
    },
    ingredients: [
        { ingNo: "M-001", catNo: "食肉",  name: "若鶏もも肉",     supplier: "〇〇ファーム", origin: "国産",   allergens: ["chicken"],
          spec: "10℃以下、ロット番号付、抗生物質残留試験済",
          desc: { biological: "サルモネラ等の付着可能性あり", chemical: "残留抗生物質", physical: "羽毛・骨片", composition: "鶏もも肉100%", source: "国内養鶏場", method: "屠畜・解体・冷蔵", packaging: "発泡スチロール+保冷剤", shelfLife: "10℃以下で5日", prep: "解凍・洗浄", criteria: "中心温度10℃以下、変色なし、規格書適合" } },
        { ingNo: "M-002", catNo: "穀物粉", name: "薄力小麦粉",     supplier: "〇〇製粉",     origin: "国産",   allergens: ["wheat"],
          spec: "1等粉、灰分0.4%以下、防虫剤検出限界以下",
          desc: { biological: "カビ・酵母", chemical: "残留防虫剤", physical: "石・金属片", composition: "小麦粉100%", source: "国内小麦", method: "製粉", packaging: "紙袋25kg", shelfLife: "常温6ヶ月", prep: "篩過", criteria: "JAS1等、灰分・水分基準内" } },
        { ingNo: "M-003", catNo: "鶏卵", name: "全卵液",         supplier: "〇〇ファーム", origin: "国産",   allergens: ["egg"],
          spec: "サルモネラ陰性、要冷蔵10℃以下",
          desc: { biological: "サルモネラ", chemical: "—", physical: "卵殻片", composition: "鶏卵液", source: "国内", method: "選別・割卵・濾過・冷蔵", packaging: "PET容器", shelfLife: "10℃以下7日", prep: "—", criteria: "サルモネラ陰性、温度10℃以下" } },
        { ingNo: "M-004", catNo: "調味料", name: "醤油",          supplier: "〇〇醸造",     origin: "国産",   allergens: ["wheat","soybean"],
          spec: "JAS規格特級", desc: { biological: "—", chemical: "—", physical: "—", composition: "大豆・小麦・食塩・麹", source: "国内", method: "醸造", packaging: "ボトル", shelfLife: "常温18ヶ月", prep: "—", criteria: "JAS特級" } },
        { ingNo: "M-005", catNo: "薬味", name: "おろし生姜",      supplier: "〇〇商事",     origin: "国産",   allergens: [],
          spec: "添加物不使用", desc: { biological: "土壌由来菌", chemical: "残留農薬", physical: "石", composition: "生姜100%", source: "国内", method: "洗浄・粉砕・冷蔵", packaging: "PET容器", shelfLife: "10℃以下14日", prep: "—", criteria: "残留農薬基準適合" } },
        { ingNo: "M-006", catNo: "薬味", name: "おろしにんにく",  supplier: "〇〇商事",     origin: "中国産", allergens: [],
          spec: "残留農薬基準適合", desc: { biological: "土壌由来菌", chemical: "残留農薬", physical: "石", composition: "にんにく100%", source: "中国", method: "洗浄・粉砕・冷蔵", packaging: "PET容器", shelfLife: "10℃以下14日", prep: "—", criteria: "残留農薬基準適合" } },
        { ingNo: "M-007", catNo: "油脂", name: "米油",           supplier: "〇〇油脂",     origin: "国産",   allergens: [],
          spec: "圧搾製法、酸価1.0以下", desc: { biological: "—", chemical: "酸化", physical: "—", composition: "米糠油100%", source: "国内", method: "圧搾", packaging: "一斗缶", shelfLife: "常温12ヶ月", prep: "—", criteria: "酸価1.0以下" } },
        { ingNo: "M-008", catNo: "塩",   name: "食塩",            supplier: "〇〇塩業",     origin: "国産",   allergens: [],
          spec: "JIS規格", desc: { biological: "—", chemical: "—", physical: "—", composition: "塩化ナトリウム", source: "国内", method: "天日・乾燥", packaging: "袋", shelfLife: "常温無期", prep: "—", criteria: "JIS規格" } },
    ],
    steps: [
        { seq: 1,  type: "receive",      name: "原材料受入",          params: "鶏肉10℃以下確認" },
        { seq: 2,  type: "store-cold",   name: "冷蔵保管",            params: "5℃以下" },
        { seq: 3,  type: "prep",         name: "下処理（解凍・整形）", params: "10℃以下作業環境" },
        { seq: 4,  type: "cut",          name: "カット",              params: "1個30g程度" },
        { seq: 5,  type: "season",       name: "調味液漬け込み",      params: "5℃以下 / 8時間以上" },
        { seq: 6,  type: "coating",      name: "衣付け",              params: "小麦粉＋片栗粉" },
        { seq: 7,  type: "heat-fry",     name: "油ちょう",            params: "180℃ × 約3分（中心75℃以上）" },
        { seq: 8,  type: "cool",         name: "冷却",                params: "30分以内に20℃以下" },
        { seq: 9,  type: "freeze",       name: "急速凍結",            params: "-30℃トンネルフリーザー" },
        { seq: 10, type: "metal-detect", name: "金属検出",            params: "Fe φ2.0 / SUS φ3.0 全数" },
        { seq: 11, type: "pack",         name: "包装",                params: "PE袋＋段ボール" },
        { seq: 12, type: "store-frozen", name: "冷凍保管",            params: "-18℃以下" },
        { seq: 13, type: "ship",         name: "出荷",                params: "冷凍車（-18℃以下）" },
    ],

    // === 危害抽出表 (TBT様式 13/危害抽出表) ===
    // source: "ingredient" | "equipment" | "process"
    hazardExtractions: [
        // 原料編
        { id: "HE-1",  source: "ingredient", refNo: "M-001", refName: "若鶏もも肉",  category: "B", no: 1, name: "サルモネラ・カンピロバクター", reason: "鶏肉常在菌",       routine: true,  abnormal: false, emergency: false },
        { id: "HE-2",  source: "ingredient", refNo: "M-001", refName: "若鶏もも肉",  category: "B", no: 2, name: "黄色ブドウ球菌",                reason: "作業者からの二次汚染", routine: true, abnormal: false, emergency: false },
        { id: "HE-3",  source: "ingredient", refNo: "M-001", refName: "若鶏もも肉",  category: "C", no: 1, name: "残留抗生物質",                  reason: "養鶏での投薬",       routine: false, abnormal: true,  emergency: false },
        { id: "HE-4",  source: "ingredient", refNo: "M-001", refName: "若鶏もも肉",  category: "P", no: 1, name: "羽毛・骨片",                    reason: "屠畜・解体由来",     routine: true,  abnormal: false, emergency: false },
        { id: "HE-5",  source: "ingredient", refNo: "M-002", refName: "薄力小麦粉",  category: "B", no: 1, name: "カビ・酵母",                    reason: "保管中の繁殖",       routine: false, abnormal: true,  emergency: false },
        { id: "HE-6",  source: "ingredient", refNo: "M-002", refName: "薄力小麦粉",  category: "P", no: 1, name: "石・金属片",                    reason: "原料由来",          routine: true,  abnormal: false, emergency: false },
        { id: "HE-7",  source: "ingredient", refNo: "M-003", refName: "全卵液",      category: "B", no: 1, name: "サルモネラ",                    reason: "卵殻汚染",          routine: true,  abnormal: false, emergency: false },
        // 機械・器具編
        { id: "HE-10", source: "equipment",  refNo: "E-01", refName: "包丁・まな板", category: "B", no: 1, name: "二次汚染（細菌増殖）",          reason: "洗浄不足",          routine: false, abnormal: true,  emergency: false },
        { id: "HE-11", source: "equipment",  refNo: "E-02", refName: "ミキサー",     category: "P", no: 1, name: "金属片混入",                    reason: "刃の摩耗・破損",     routine: false, abnormal: true,  emergency: false },
        { id: "HE-12", source: "equipment",  refNo: "E-03", refName: "フライヤー",   category: "C", no: 1, name: "酸化油",                        reason: "油の劣化",          routine: true,  abnormal: false, emergency: false },
        // プロセス編
        { id: "HE-20", source: "process",    refNo: "1",  refName: "原材料受入",      category: "B", no: 1, name: "病原微生物の付着",              reason: "搬入時の温度逸脱",   routine: false, abnormal: true,  emergency: false },
        { id: "HE-21", source: "process",    refNo: "7",  refName: "油ちょう",        category: "B", no: 1, name: "病原菌残存",                    reason: "加熱不足",          routine: true,  abnormal: false, emergency: false },
        { id: "HE-22", source: "process",    refNo: "8",  refName: "冷却",            category: "B", no: 1, name: "冷却中の細菌増殖",              reason: "冷却時間遅延",       routine: false, abnormal: true,  emergency: false },
        { id: "HE-23", source: "process",    refNo: "10", refName: "金属検出",        category: "P", no: 1, name: "金属異物の混入",                reason: "工程中の混入",       routine: true,  abnormal: false, emergency: false },
        { id: "HE-24", source: "process",    refNo: "6",  refName: "衣付け",          category: "A", no: 1, name: "アレルゲン交差接触（小麦・卵）", reason: "他製品との共有設備", routine: true,  abnormal: false, emergency: false },
    ],

    // === ハザード評価表 (TBT様式 ハザード評価表) ===
    // 抽出された各危害について、許容水準・リスク・結論を評価
    hazardEvaluations: [
        { id: "HV-1",  hazardName: "サルモネラ・カンピロバクター", srcId: "HE-1",  acceptableLimit: "陰性 (加熱後)", limitBasis: "食品衛生法",
          riskSource: "鶏肉由来", riskFreq: "高", riskCharacter: "感染性食中毒菌", severity: "重大（入院・死亡例あり）",
          needsRemoval: "必要", needsSpecialControl: "特別な手段で管理が必要" },
        { id: "HV-2",  hazardName: "黄色ブドウ球菌",                srcId: "HE-2",  acceptableLimit: "10^5/g以下",  limitBasis: "食中毒予防上の目安",
          riskSource: "作業者の手指", riskFreq: "中", riskCharacter: "毒素型", severity: "中",
          needsRemoval: "必要", needsSpecialControl: "PRPで管理可" },
        { id: "HV-3",  hazardName: "残留抗生物質",                  srcId: "HE-3",  acceptableLimit: "規格基準内", limitBasis: "食品衛生法 残留基準",
          riskSource: "養鶏投薬", riskFreq: "低", riskCharacter: "化学的", severity: "中",
          needsRemoval: "必要", needsSpecialControl: "PRP（仕入先管理）" },
        { id: "HV-4",  hazardName: "羽毛・骨片",                    srcId: "HE-4",  acceptableLimit: "目視で確認できないこと", limitBasis: "自社規格",
          riskSource: "屠畜由来", riskFreq: "中", riskCharacter: "硬質異物", severity: "低",
          needsRemoval: "必要", needsSpecialControl: "PRP（受入検品）" },
        { id: "HV-7",  hazardName: "サルモネラ（卵由来）",          srcId: "HE-7",  acceptableLimit: "陰性 (加熱後)", limitBasis: "食品衛生法",
          riskSource: "卵殻汚染", riskFreq: "中", riskCharacter: "感染型", severity: "重大",
          needsRemoval: "必要", needsSpecialControl: "特別な手段で管理が必要" },
        { id: "HV-21", hazardName: "病原菌残存（油ちょう）",         srcId: "HE-21", acceptableLimit: "陰性",      limitBasis: "食品衛生法",
          riskSource: "加熱不足", riskFreq: "中", riskCharacter: "感染型", severity: "重大",
          needsRemoval: "必要", needsSpecialControl: "特別な手段で管理が必要" },
        { id: "HV-23", hazardName: "金属異物の混入",                srcId: "HE-23", acceptableLimit: "Fe φ2.0/SUS φ3.0以下不検出", limitBasis: "自社規格",
          riskSource: "機械摩耗・工程混入", riskFreq: "低", riskCharacter: "硬質異物", severity: "中（けが）",
          needsRemoval: "必要", needsSpecialControl: "特別な手段で管理が必要" },
        { id: "HV-24", hazardName: "アレルゲン交差接触",            srcId: "HE-24", acceptableLimit: "意図せぬアレルゲン不検出", limitBasis: "食品表示法",
          riskSource: "共有設備", riskFreq: "中", riskCharacter: "アナフィラキシー", severity: "重大",
          needsRemoval: "必要", needsSpecialControl: "PRP/O-PRPで管理" },
    ],

    // === 管理手段選択分類表 (TBT様式 ISO22000 7基準で PRP/O-PRP/HACCP分類) ===
    controlMeasures: [
        { id: "CM-1", hazardId: "HV-1",  hazardName: "サルモネラ・カンピロバクター", measure: "油ちょう (中心75℃×1分以上)",
          q1Synergy: "なし", q2Effective: "有効", q3Monitor: "可能", q4Variation: "低", q5Position: "最終", q6Severity: "高", q7Special: "特別",
          decision: "HACCP" },
        { id: "CM-2", hazardId: "HV-2",  hazardName: "黄色ブドウ球菌",               measure: "従事者衛生管理 (手洗い・健康確認)",
          q1Synergy: "なし", q2Effective: "有効", q3Monitor: "可能", q4Variation: "低", q5Position: "前工程", q6Severity: "中", q7Special: "通常",
          decision: "PRP" },
        { id: "CM-3", hazardId: "HV-3",  hazardName: "残留抗生物質",                  measure: "仕入先選定・規格書受領・自主検査",
          q1Synergy: "なし", q2Effective: "有効", q3Monitor: "可能", q4Variation: "低", q5Position: "前工程", q6Severity: "中", q7Special: "通常",
          decision: "PRP" },
        { id: "CM-4", hazardId: "HV-4",  hazardName: "羽毛・骨片",                    measure: "受入検品・下処理での目視除去",
          q1Synergy: "あり", q2Effective: "有効", q3Monitor: "可能", q4Variation: "低", q5Position: "前工程", q6Severity: "低", q7Special: "通常",
          decision: "PRP" },
        { id: "CM-7", hazardId: "HV-7",  hazardName: "サルモネラ（卵由来）",          measure: "油ちょう (中心75℃×1分以上)",
          q1Synergy: "あり", q2Effective: "有効", q3Monitor: "可能", q4Variation: "低", q5Position: "最終", q6Severity: "高", q7Special: "特別",
          decision: "HACCP" },
        { id: "CM-21", hazardId: "HV-21", hazardName: "病原菌残存（油ちょう）",        measure: "中心温度管理 (75℃以上 1分以上)",
          q1Synergy: "なし", q2Effective: "有効", q3Monitor: "可能", q4Variation: "低", q5Position: "最終", q6Severity: "高", q7Special: "特別",
          decision: "HACCP" },
        { id: "CM-23", hazardId: "HV-23", hazardName: "金属異物の混入",                measure: "金属検出機による全数検査",
          q1Synergy: "なし", q2Effective: "有効", q3Monitor: "可能", q4Variation: "低", q5Position: "最終", q6Severity: "中", q7Special: "特別",
          decision: "HACCP" },
        { id: "CM-24", hazardId: "HV-24", hazardName: "アレルゲン交差接触",            measure: "ライン分離・洗浄・製造順序管理",
          q1Synergy: "あり", q2Effective: "有効", q3Monitor: "可能", q4Variation: "中", q5Position: "中間", q6Severity: "高", q7Special: "通常",
          decision: "O-PRP" },
    ],

    // === HACCPプラン (TBT様式 12-19 / 8列) ===
    ccpPlan: [
        { id: "CCP-1", ccpNo: "CCP1", processName: "油ちょう（工程7）", hazard: "病原微生物の残存（サルモネラ・カンピロバクター）",
          cl: "中心温度 75℃ 以上 × 1分（60秒）以上",
          monWhat: "中心温度・加熱時間",
          monHow: "中心温度計（先端温度計）による中心部測定／タイマー",
          monFreq: "ロットごと開始/中間/終了の3点",
          monWho: "加熱担当者",
          correction: "①温度未達品の隔離・再加熱または廃棄判定 ②加熱条件再設定 ③設備点検",
          record: "加熱記録表（CCP1）",
          verification: "①温度計校正 (毎日0/100℃確認、年1回) ②加熱記録の上長確認 ③月次の微生物検査" },
        { id: "CCP-2", ccpNo: "CCP2", processName: "金属検出（工程10）", hazard: "金属異物の混入",
          cl: "Fe φ2.0mm 以下／SUS φ3.0mm 以下を検出・全数排出",
          monWhat: "感度確認・排出動作",
          monHow: "テストピース通過確認",
          monFreq: "始業時・休憩前後・終業時",
          monWho: "ライン担当者",
          correction: "①検出時の隔離・再検査 ②機器調整・再校正 ③発生源調査",
          record: "金属検出機点検表（CCP2）",
          verification: "①日次の感度確認 ②年1回の専門業者点検 ③記録の上長確認" },
    ],

    // === O-PRP (例: アレルゲン管理) ===
    oprp: [
        { id: "OPRP-1", oprpNo: "O-PRP1",
          processName: "調合・混合（工程7）",
          hazard: "アレルゲン交差接触",
          measure: "アレルゲン共有ライン管理（ライン分離・製造順序・洗浄）",
          acceptableLevel: "ATP拭取検査 RLU 200以下（洗浄合格）",
          monWhat: "洗浄後の拭取り検査・ラベル照合",
          monHow: "ATP拭取検査 / チェックリスト確認",
          monFreq: "製品切替毎・1回/日",
          monWho: "衛生管理担当",
          correction: "①ラインの再洗浄 ②製品の保留・再検査 ③原因究明と再発防止",
          record: "アレルゲン切替確認記録（O-PRP1）" },
    ],

    // === 衛生点検・清掃消毒記録 ===
    sanitationLog: [
        { id: "SL-001", date: "2026-05-09", shift: "朝",   facility: true,  machines: true,  waste: true,  personnel: true,  pest: true,  chlorine: "0.2", inspector: "佐藤 次郎", verifiedBy: "田中 花子", note: "" },
        { id: "SL-002", date: "2026-05-09", shift: "終業", facility: true,  machines: true,  waste: true,  personnel: true,  pest: "",    chlorine: "0.1", inspector: "佐藤 次郎", verifiedBy: "田中 花子", note: "" },
        { id: "SL-003", date: "2026-05-08", shift: "朝",   facility: true,  machines: false, waste: true,  personnel: true,  pest: "",    chlorine: "0.2", inspector: "佐藤 次郎", verifiedBy: "田中 花子", note: "ミキサー洗浄不足を指摘→再洗浄・再点検合格" },
    ],

    // === 従事者健康確認記録 ===
    healthLog: [
        { id: "HL-001", date: "2026-05-09", name: "山田 太郎", temperature: "36.2", status: "良好", worksToday: "true",  verifiedBy: "田中 花子", note: "" },
        { id: "HL-002", date: "2026-05-09", name: "鈴木 一郎", temperature: "36.8", status: "良好", worksToday: "true",  verifiedBy: "田中 花子", note: "" },
        { id: "HL-003", date: "2026-05-09", name: "田中 花子", temperature: "36.5", status: "良好", worksToday: "true",  verifiedBy: "田中 花子", note: "" },
        { id: "HL-004", date: "2026-05-09", name: "佐藤 次郎", temperature: "36.3", status: "良好", worksToday: "true",  verifiedBy: "田中 花子", note: "" },
        { id: "HL-005", date: "2026-05-08", name: "高橋 三郎", temperature: "37.8", status: "発熱", worksToday: "false", verifiedBy: "田中 花子", note: "発熱のため自宅待機。37.0℃未満で症状消失後24時間経過後に復帰" },
    ],

    // === CCP モニタリング記録 ===
    ccpMonitoringLog: [
        { id: "ML-001", date: "2026-05-09", lot: "L20260509-A", ccpNo: "CCP1", processName: "油ちょう（工程10）",
          cl: "中心温度 75℃以上 × 60秒以上", time: "09:00", measuredValue: "77℃",
          passed: "true", correction: "", measuredBy: "鈴木 一郎", verifiedBy: "田中 花子", note: "" },
        { id: "ML-002", date: "2026-05-09", lot: "L20260509-A", ccpNo: "CCP1", processName: "油ちょう（工程10）",
          cl: "中心温度 75℃以上 × 60秒以上", time: "12:30", measuredValue: "76℃",
          passed: "true", correction: "", measuredBy: "鈴木 一郎", verifiedBy: "田中 花子", note: "" },
        { id: "ML-003", date: "2026-05-09", lot: "L20260509-B", ccpNo: "CCP2", processName: "金属検出（工程12）",
          cl: "Fe φ2.0mm以下 / SUS φ3.0mm以下を検出・全数排出", time: "09:10", measuredValue: "Fe2.0 ✓ / SUS3.0 ✓",
          passed: "true", correction: "", measuredBy: "鈴木 一郎", verifiedBy: "田中 花子", note: "始業時テストピース確認済" },
        { id: "ML-004", date: "2026-05-08", lot: "L20260508-A", ccpNo: "CCP1", processName: "油ちょう（工程10）",
          cl: "中心温度 75℃以上 × 60秒以上", time: "10:15", measuredValue: "72℃",
          passed: "false", correction: "①ロット全量隔離・再加熱（再測定77℃で合格）②加熱温度設定を確認・再調整",
          measuredBy: "鈴木 一郎", verifiedBy: "田中 花子", note: "油温低下による逸脱。フライヤー設定温度を185℃に修正" },
    ],

    // === 原材料受入記録 ===
    receivingLog: [
        { id: "RL-001", date: "2026-05-09", ingNo: "M-001", ingName: "若鶏もも肉",   supplier: "〇〇ファーム", lot: "F20260509-01", quantity: "100kg", temperature: "5℃",  appearance: "良好", expiryDate: "2026-05-14", passed: "true",  receivedBy: "高橋 三郎", note: "" },
        { id: "RL-002", date: "2026-05-09", ingNo: "M-002", ingName: "薄力小麦粉",   supplier: "〇〇製粉",     lot: "P20260430-03", quantity: "25kg",  temperature: "",    appearance: "良好", expiryDate: "2026-10-31", passed: "true",  receivedBy: "高橋 三郎", note: "" },
        { id: "RL-003", date: "2026-05-09", ingNo: "M-003", ingName: "全卵液",       supplier: "〇〇ファーム", lot: "E20260508-02", quantity: "10kg",  temperature: "8℃",  appearance: "良好", expiryDate: "2026-05-15", passed: "true",  receivedBy: "高橋 三郎", note: "" },
        { id: "RL-004", date: "2026-05-08", ingNo: "M-001", ingName: "若鶏もも肉",   supplier: "〇〇ファーム", lot: "F20260508-01", quantity: "80kg",  temperature: "12℃", appearance: "良好", expiryDate: "2026-05-13", passed: "false", receivedBy: "高橋 三郎", note: "受入温度10℃超のため返品（仕入先引取）" },
    ],

    // === 不適合製品管理表 (4-3 register) ===
    nonconformanceLog: [
        { no: 1, occurredAt: "2024-12-15 14:30", productName: "冷凍若鶏唐揚げ", lot: "L20241215-A", category: "CCP外れ不良品",
          contentCount: { 包装不良: 0, 規格差異: 0, 期限切れ: 0, 表示違反: 0, 製品不良: 0, 異臭: 0, 変色: 0, 異味: 0, 異物混入: 0, 品温不良: 0, CCP外れ: 50, 規格外品: 0, その他: 0 },
          dispositionCount: { 廃棄: 50, 再利用: 0, 用途変更: 0, 特別採用: 0 },
          reportedBy: "鈴木 一郎", note: "中心温度未達 (72℃)" },
    ],

    // === 不適合製品処置書 (4-2) — 個別の処置書 ===
    nonconformanceActions: [
        { id: "NC-1", logNo: 1, productName: "冷凍若鶏唐揚げ", ingredient: "—", identNo: "NC2024-001",
          lot: "L20241215-A", occurredAt: "2024-12-15 14:30", receivedAt: "—",
          customer: "—", department: "製造課",
          contentChecks: { 包装不良: false, 規格差異: false, 期限切れ: false, 表示違反: false, 製品不良: false, 異臭: false, 変色: false, 異味: false, 異物混入: false, 品温不良: false, 加工汚染品: false, CCP外れ不良品: true, 規格外品: false, その他: false },
          contentOther: "",
          disposition: { type: "A", subOption: "3", note: "産業廃棄物として処理（産廃処理業者）" },
          processedAt: "2024-12-15", processedQty: "50kg",
          treatedAt: "2024-12-16",  treatedQty: "50kg",
          inspector: "田中 花子", note: "CCP1で中心温度72℃を記録、CL未達のため全量廃棄" },
    ],

    // === 是正処置書 (5-1) ===
    correctiveActions: [
        { id: "CA-1", relatedDept: "製造課",
          identNo: "CA2024-001",
          dueDate: "2024-12-22",
          source: "監視測定結果",
          content: "CCP1（油ちょう）で中心温度72℃を記録、CL（75℃以上1分以上）未達",
          rootCause: "①フライヤー温度計の校正不足 ②投入量超過による温度低下 ③加熱時間が短かった",
          similarInvestigation: "過去6ヶ月の加熱記録を確認、3件で同様の温度低下傾向を確認",
          investigationResult: "投入量が標準より多い時に発生する傾向あり",
          correctionPlan: "①温度計を新しいものに更新 ②投入量上限を3kg→2kgに変更 ③加熱時間を3分→3分30秒に変更 ④標準作業書改訂",
          planNeeded: "要", planApprovedBy: "山田 太郎", planApprovedAt: "2024-12-16",
          implementation: "①12/17 温度計更新完了 ②12/17 投入量変更通知 ③12/18 標準作業書改訂版発行 ④12/20 全製造員への教育実施",
          confirmedAt: "2024-12-21",
          effectMethod: "①翌週1週間の中心温度全数記録 ②30日後・90日後の追跡確認",
          finalConfirmedAt: "2025-03-21",
          isoManager: "田中 花子", finalResponsible: "山田 太郎",
          status: "完了" },
    ],

    // === 検証 (12-23 妥当性確認 / 12-25 内部検証チェックリスト) ===
    verifications: [
        { id: "V-1", target: "CCP1（油ちょう）", method: "中心温度計校正",         frequency: "毎日(0/100℃) / 年1回(校正業者)", responsible: "品質管理責任者", lastDate: "2024-12-01", result: "合格", evidence: "校正証明書 #2024-A-001" },
        { id: "V-2", target: "CCP1",            method: "微生物検査（一般生菌・大腸菌群）", frequency: "月1回",                  responsible: "品質管理責任者", lastDate: "2024-12-05", result: "陰性",  evidence: "外注検査成績書 #2024-12-05" },
        { id: "V-3", target: "CCP2（金属検出）", method: "テストピース感度確認",     frequency: "始業/終業 1日2回",         responsible: "ライン担当者",    lastDate: "2024-12-15", result: "合格", evidence: "金属検出機点検表" },
        { id: "V-4", target: "CCP2",            method: "専門業者による点検",         frequency: "年1回",                   responsible: "品質管理責任者", lastDate: "2024-08-20", result: "合格", evidence: "保守点検報告書" },
        { id: "V-5", target: "HACCPプラン全体", method: "内部監査（ISO22000）",      frequency: "年1回",                   responsible: "ISO管理責任者",  lastDate: "2024-10-15", result: "適合", evidence: "内部監査報告書 #2024-IA-1" },
        { id: "V-6", target: "PRP",             method: "月次PRPチェックリスト",     frequency: "月1回",                   responsible: "衛生管理責任者", lastDate: "2024-12-01", result: "適合", evidence: "PRPチェック記録" },
    ],

    // === 冷蔵・冷凍温度記録 ===
    temperatureLog: [
        { id: "TMP-001", date: "2026-05-09", shift: "朝",   unit: "冷蔵庫1 (原材料)",  setTemp: "5",   measured: "4",   passed: "true",  inspector: "鈴木 一郎", note: "" },
        { id: "TMP-002", date: "2026-05-09", shift: "朝",   unit: "冷凍庫1 (製品)",   setTemp: "-18", measured: "-19", passed: "true",  inspector: "鈴木 一郎", note: "" },
        { id: "TMP-003", date: "2026-05-09", shift: "昼",   unit: "冷蔵庫1 (原材料)",  setTemp: "5",   measured: "6",   passed: "true",  inspector: "鈴木 一郎", note: "" },
        { id: "TMP-004", date: "2026-05-09", shift: "昼",   unit: "冷凍庫1 (製品)",   setTemp: "-18", measured: "-18", passed: "true",  inspector: "鈴木 一郎", note: "" },
        { id: "TMP-005", date: "2026-05-08", shift: "朝",   unit: "冷蔵庫1 (原材料)",  setTemp: "5",   measured: "12",  passed: "false", inspector: "鈴木 一郎", note: "ドア開放忘れによる温度上昇→即修正、2時間後に5℃回復確認" },
        { id: "TMP-006", date: "2026-05-08", shift: "朝",   unit: "冷凍庫1 (製品)",   setTemp: "-18", measured: "-20", passed: "true",  inspector: "鈴木 一郎", note: "" },
    ],

    // === 機器校正記録 ===
    calibrationLog: [
        { id: "CAL-001", date: "2026-05-09", equipment: "中心温度計 (No.1)", equipmentId: "TH-001",
          method: "氷水(0℃)・沸騰水(100℃)による2点校正",
          beforeValue: "0.5℃ / 99.8℃", refValue: "0℃ ± 1℃ / 100℃ ± 1℃", afterValue: "0.3℃ / 100.1℃",
          result: "合格", nextDate: "2026-05-10", performedBy: "鈴木 一郎", note: "" },
        { id: "CAL-002", date: "2026-05-09", equipment: "金属検出機", equipmentId: "MD-CCP2",
          method: "テストピース(Fe φ2.0mm / SUS φ3.0mm)による感度確認",
          beforeValue: "—", refValue: "Fe φ2.0mm / SUS φ3.0mm 全数検出", afterValue: "全数検出 OK",
          result: "合格", nextDate: "2026-05-10", performedBy: "鈴木 一郎", note: "始業時確認済" },
        { id: "CAL-003", date: "2026-04-01", equipment: "中心温度計 (No.1)", equipmentId: "TH-001",
          method: "外部校正業者による精密校正",
          beforeValue: "—", refValue: "JIS B 7411 準拠", afterValue: "校正証明書発行",
          result: "合格", nextDate: "2027-04-01", performedBy: "田中 花子", note: "校正証明書 #2026-001 保管" },
    ],

    // === 使用水確認記録 ===
    waterLog: [
        { id: "WL-001", date: "2026-05-09", shift: "朝",   appearance: "無色透明", odor: "無臭",     chlorine: "0.3", passed: "true",  inspector: "佐藤 次郎", note: "" },
        { id: "WL-002", date: "2026-05-09", shift: "終業", appearance: "無色透明", odor: "無臭",     chlorine: "0.2", passed: "true",  inspector: "佐藤 次郎", note: "" },
        { id: "WL-003", date: "2026-05-08", shift: "朝",   appearance: "無色透明", odor: "無臭",     chlorine: "0.1", passed: "true",  inspector: "佐藤 次郎", note: "" },
        { id: "WL-004", date: "2026-05-07", shift: "朝",   appearance: "無色透明", odor: "塩素臭(微)", chlorine: "0.09", passed: "false", inspector: "佐藤 次郎", note: "残留塩素0.1mg/L未満→水道局に連絡、代替水使用・継続モニタリング実施。昼に再測定0.15mg/L確認" },
    ],

    // === 教育訓練記録 ===
    trainingLog: [
        { id: "TL-001", date: "2026-04-01", theme: "HACCP制度概論・社内HACCPプラン説明",
          content: "HACCPの7原則12手順の概要、自社HACCPプランの確認",
          participants: "山田 太郎・鈴木 一郎・田中 花子・佐藤 次郎・高橋 三郎",
          duration: "2", instructor: "山田 太郎", method: "講義", result: "良好",
          confirmedBy: "山田 太郎", note: "理解度テスト実施、全員合格" },
        { id: "TL-002", date: "2026-04-15", theme: "一般衛生管理 (PRP) 実践訓練",
          content: "手洗い・清掃・消毒・健康管理の実技訓練（ATP検査で消毒効果確認）",
          participants: "鈴木 一郎・佐藤 次郎・高橋 三郎",
          duration: "1.5", instructor: "田中 花子", method: "実技", result: "良好",
          confirmedBy: "山田 太郎", note: "" },
        { id: "TL-003", date: "2026-07-01", theme: "CCP管理・モニタリング訓練",
          content: "CCPの管理基準(CL)の確認、記録表の記入方法、温度計の使い方",
          participants: "全従事者",
          duration: "1", instructor: "田中 花子", method: "OJT", result: "未確認",
          confirmedBy: "", note: "実施予定" },
    ],

    // === アレルゲン切替確認記録 ===
    allergenLog: [
        { id: "AL-001", date: "2026-05-09", type: "始業前", prevProduct: "—",
          allergens: { wheat: true, egg: true, soybean: true, chicken: true },
          cleaning: "完了", passed: "true", inspector: "鈴木 一郎", note: "" },
        { id: "AL-002", date: "2026-05-08", type: "始業前", prevProduct: "—",
          allergens: { wheat: true, egg: false, soybean: true, chicken: true },
          cleaning: "完了", passed: "false", inspector: "鈴木 一郎", note: "卵の残留疑い→再洗浄実施、拭き取り検査陰性確認後製造開始" },
    ],

    // === 製品検査記録 ===
    productTestLog: [
        { id: "PT-001", date: "2026-05-01", lot: "L20260501-A", testType: "一般生菌数", sampleType: "製品", method: "外注検査",
          result: "800 CFU/g", standard: "3×10^6 CFU/g以下", judgment: "合格",
          testLab: "○○食品検査センター", reportNo: "2026-05-001", note: "" },
        { id: "PT-002", date: "2026-05-01", lot: "L20260501-A", testType: "大腸菌群", sampleType: "製品", method: "外注検査",
          result: "陰性", standard: "陰性", judgment: "合格",
          testLab: "○○食品検査センター", reportNo: "2026-05-001", note: "" },
        { id: "PT-003", date: "2026-04-15", lot: "環境モニタリング", testType: "一般生菌数", sampleType: "環境（拭き取り）", method: "社内検査",
          result: "50 CFU/cm2", standard: "200 CFU/cm2以下", judgment: "合格",
          testLab: "社内品質管理室", reportNo: "ENV-2026-04-01", note: "製造ラインA ベルトコンベア表面" },
    ],

    // === 製品出荷記録 ===
    shipmentLog: [
        { id: "SH-001", date: "2026-05-09", lot: "L20260509-A", productName: "冷凍若鶏唐揚げ 1kg", quantity: "500袋 (500kg)", destination: "○○スーパー", deliveryNo: "D20260509-01", expiryDate: "2027-05-09", released: "true", shippedBy: "高橋 三郎", note: "" },
        { id: "SH-002", date: "2026-05-09", lot: "L20260509-B", productName: "冷凍若鶏唐揚げ 1kg", quantity: "200袋 (200kg)", destination: "△△給食センター", deliveryNo: "D20260509-02", expiryDate: "2027-05-09", released: "true", shippedBy: "高橋 三郎", note: "" },
        { id: "SH-003", date: "2026-05-08", lot: "L20260507-A", productName: "冷凍若鶏唐揚げ 1kg", quantity: "100袋 (100kg)", destination: "□□食品卸", deliveryNo: "D20260508-01", expiryDate: "2027-05-07", released: "true", shippedBy: "高橋 三郎", note: "" },
    ],

    // === クレーム対応記録 ===
    complaintLog: [
        { id: "CL-001", receivedDate: "2026-04-20", claimNo: "CL2026-001", customer: "○○スーパー 品質管理部",
          lot: "L20260415-A", category: "異物混入",
          content: "唐揚げに白色の繊維状異物が混入していた。サイズは約5mm。",
          action: "①当該ロット在庫を保留・調査 ②原因調査：鶏肉処理工程の識別。製造ライン上の絶縁材断片と判明 ③当該部品を交換 ④前後製品を金属検出機で全数再検査（問題なし）",
          closedDate: "2026-04-28", status: "完了", responsible: "田中 花子",
          note: "是正処置書 CA2026-001 を起票。再発防止策として定期点検頻度を月1回→2週間1回に変更" },
    ],

    // === 内部監査チェックリスト ===
    internalAuditLog: [
        { id: "IA-1", date: "2025-10-15", auditor: "田中 花子", scope: "HACCP全体 (原則1〜7 / 手順1〜12)",
          findings: "記録の修正方法について一部で修正液使用が見られた。二重線＋署名方式の再徹底が必要。",
          decisions: "①全従事者への記録方法再教育（11月訓練で実施） ②記録フォームに注意書きを追記",
          nextDate: "2026-10-01", status: "完了",
          checks: {
            "危害要因分析が文書化さ": true, "危害抽出書・ハザード評": true, "管理手段選択分類表が適": true,
            "HACCPプランが文書化さ": true, "管理基準(CL)が設定さ": true, "CCPモニタリング記録が": true, "CL逸脱時の是正処置が": true,
            "O-PRPプランが文書化さ": true, "O-PRP実施記録が記録さ": true,
            "検証スケジュールが定め": true, "定期的な微生物検査を実": true, "機器校正が計画通り実施": true,
            "衛生点検を日々実施し記": true, "健康確認を毎日実施して": true, "温度管理記録が適切に行": true, "アレルゲン管理を実施し": true,
            "年次訓練計画が策定され": true, "全従事者が訓練を受けて": true, "訓練記録が保存されてい": true,
            "記録の保存期間が定めら": true, "記録が適切に保管されて": false,
            "クレーム対応手順が定め": true, "不適合製品の隔離手順が": true, "是正処置の有効性確認を": true,
          }
        },
    ],

    // === 仕入先評価記録 ===
    supplierAuditLog: [
        { id: "SA-1", date: "2026-03-10", supplier: "〇〇ファーム", product: "若鶏もも肉", auditType: "現地監査",
          result: "適合", score: "88", certifications: "農場HACCP認定", issues: "—", nextDate: "2027-03-01", responsible: "田中 花子", note: "" },
        { id: "SA-2", date: "2026-03-15", supplier: "△△製粉", product: "小麦粉・片栗粉", auditType: "書類審査",
          result: "適合", score: "92", certifications: "ISO22000", issues: "—", nextDate: "2027-03-01", responsible: "田中 花子", note: "" },
        { id: "SA-3", date: "2026-03-20", supplier: "〇〇油脂", product: "植物性揚げ油", auditType: "書類審査",
          result: "条件付き適合", score: "74", certifications: "—",
          issues: "規格証明書の提出遅延（1ヶ月遅れ）。次回以降は30日前までに提出要請。", nextDate: "2026-09-01", responsible: "田中 花子", note: "" },
    ],

    productionLog: [
        { id: "PL-1", date: "2026-05-01", shift: "日勤", productName: "冷凍若鶏唐揚げ", lot: "L20260501",
          planQty: "500", actualQty: "492", defectQty: "4", operator: "田中 花子",
          ccpOk: "合格", cleaningOk: "実施", note: "" },
        { id: "PL-2", date: "2026-05-02", shift: "日勤", productName: "冷凍若鶏唐揚げ", lot: "L20260502",
          planQty: "500", actualQty: "497", defectQty: "2", operator: "田中 花子",
          ccpOk: "合格", cleaningOk: "実施", note: "" },
        { id: "PL-3", date: "2026-05-07", shift: "日勤", productName: "冷凍若鶏唐揚げ", lot: "L20260507",
          planQty: "500", actualQty: "488", defectQty: "8", operator: "鈴木 二郎",
          ccpOk: "合格", cleaningOk: "実施", note: "衣づけ機の調整実施。不良の主な原因は衣剥がれ。" },
        { id: "PL-4", date: "2026-05-08", shift: "日勤", productName: "冷凍若鶏唐揚げ", lot: "L20260508",
          planQty: "500", actualQty: "503", defectQty: "3", operator: "田中 花子",
          ccpOk: "合格", cleaningOk: "実施", note: "" },
        { id: "PL-5", date: "2026-05-09", shift: "日勤", productName: "冷凍若鶏唐揚げ", lot: "L20260509",
          planQty: "500", actualQty: "0", defectQty: "0", operator: "田中 花子",
          ccpOk: "合格", cleaningOk: "未実施", note: "製造途中。終業後に更新予定。" },
    ],

    pestControlLog: [
        { id: "PC-1", date: "2026-05-01", checkType: "日常点検", location: "加工室入口", pestType: "未確認", found: "なし", action: "—", pesticide: "", result: "問題なし", inspector: "田中 花子", note: "" },
        { id: "PC-2", date: "2026-05-01", checkType: "日常点検", location: "排水溝周辺", pestType: "未確認", found: "なし", action: "—", pesticide: "", result: "問題なし", inspector: "田中 花子", note: "" },
        { id: "PC-3", date: "2026-04-15", checkType: "月次トラップ確認", location: "トラップ（加工室）", pestType: "ゴキブリ", found: "あり（微量）", action: "トラップ交換・殺虫剤散布（フロアに散布）", pesticide: "〇〇殺虫剤", result: "処置済み", inspector: "田中 花子", note: "翌日再確認で発見なし" },
        { id: "PC-4", date: "2026-04-15", checkType: "月次トラップ確認", location: "トラップ（倉庫）", pestType: "未確認", found: "なし", action: "—", pesticide: "", result: "問題なし", inspector: "田中 花子", note: "" },
    ],

    facilityLog: [
        { id: "FL-1", date: "2026-04-30", checkType: "月次点検", area: "加工室", target: "床・壁・天井のひび割れ・汚れ", detail: "北側壁面に小さなひび割れ（5cm）を確認", status: "要修繕", action: "業者修繕依頼（5月中旬予定）", dueDate: "2026-05-20", inspector: "田中 花子", note: "" },
        { id: "FL-2", date: "2026-04-30", checkType: "月次点検", area: "冷蔵・冷凍室", target: "扉パッキンの劣化・温度計動作", detail: "異常なし", status: "良好", action: "—", dueDate: "", inspector: "田中 花子", note: "" },
        { id: "FL-3", date: "2026-04-30", checkType: "月次点検", area: "排水設備", target: "排水口フィルター・グリストラップ", detail: "グリストラップに油脂堆積あり。清掃実施。", status: "修繕済み", action: "清掃実施済み", dueDate: "", inspector: "鈴木 二郎", note: "" },
        { id: "FL-4", date: "2026-04-30", checkType: "月次点検", area: "換気設備", target: "換気扇フィルター清掃・動作確認", detail: "フィルター交換（前回から3ヶ月）", status: "修繕済み", action: "フィルター交換済み", dueDate: "", inspector: "鈴木 二郎", note: "" },
    ],

    labelCheckLog: [
        { id: "LC-1", date: "2026-05-08", lot: "L20260508", productName: "冷凍若鶏唐揚げ",
          allergenOk: "合格", expiryOk: "合格", storageOk: "合格", weightOk: "合格", nutritionOk: "合格",
          result: "合格", checker: "田中 花子", note: "" },
        { id: "LC-2", date: "2026-05-07", lot: "L20260507", productName: "冷凍若鶏唐揚げ",
          allergenOk: "合格", expiryOk: "合格", storageOk: "合格", weightOk: "要確認", nutritionOk: "合格",
          result: "要確認", checker: "鈴木 二郎", note: "内容量が標準±3gを超え要再確認。翌日計量機キャリブレーション実施済み。" },
    ],

    environmentLog: [
        { id: "EM-1", date: "2026-04-15", testType: "拭き取り検査", location: "加工室作業台",
          target: "一般生菌数", standard: "100 CFU/100cm²", measured: "12 CFU/100cm²",
          result: "合格", tester: "田中 花子", action: "—", note: "" },
        { id: "EM-2", date: "2026-04-15", testType: "拭き取り検査", location: "排水口周辺",
          target: "一般生菌数", standard: "100 CFU/100cm²", measured: "430 CFU/100cm²",
          result: "不合格", tester: "田中 花子", action: "高圧洗浄・次亜塩素酸ナトリウム消毒後、再検査で5 CFU/100cm²を確認。是正処置CA2026-002連携。", note: "" },
        { id: "EM-3", date: "2026-04-15", testType: "拭き取り検査", location: "冷蔵庫内壁",
          target: "一般生菌数", standard: "100 CFU/100cm²", measured: "8 CFU/100cm²",
          result: "合格", tester: "田中 花子", action: "—", note: "" },
        { id: "EM-4", date: "2026-04-15", testType: "落下菌検査", location: "加工室中央",
          target: "一般生菌数", standard: "30 CFU/plate/hour", measured: "4 CFU/plate/hour",
          result: "合格", tester: "田中 花子", action: "—", note: "" },
    ],

    recallLog: [
        { id: "RL-1", recallNo: "RC2025-001", detectedDate: "2025-11-12", lot: "L20251108",
          productName: "冷凍若鶏唐揚げ", recallType: "自主回収",
          cause: "出荷後の製品検査で大腸菌群が規格値を超過（2.4×10²CFU/g）。加熱不足が原因と判明。",
          qty: "48袋 (12kg)", destination: "直売店3店舗・通販顧客12名",
          status: "クローズ", completedDate: "2025-11-20",
          note: "全数回収完了。是正処置書 CA2025-003と連携。再発防止のため加熱工程CL見直し実施。" },
    ],

    documentRegister: [
        { docId:"HD-01", docName:"HACCPチーム名簿",             category:"HACCP計画",  revision:"2.1", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"HACCP管理フォルダ/v2", note:"" },
        { docId:"HD-02", docName:"製品説明書",                   category:"HACCP計画",  revision:"2.0", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"HACCP管理フォルダ/v2", note:"冷凍若鶏唐揚げ 500g袋" },
        { docId:"HD-03", docName:"フローダイアグラム",            category:"HACCP計画",  revision:"2.0", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"HACCP管理フォルダ/v2", note:"" },
        { docId:"HD-04", docName:"危害要因分析表",               category:"HACCP計画",  revision:"2.0", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"HACCP管理フォルダ/v2", note:"" },
        { docId:"HD-05", docName:"HACCPプラン",                 category:"HACCP計画",  revision:"2.1", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"HACCP管理フォルダ/v2", note:"CCP1加熱CL更新(CA2025-003対応)" },
        { docId:"HD-06", docName:"O-PRPプラン",                 category:"HACCP計画",  revision:"2.0", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"HACCP管理フォルダ/v2", note:"" },
        { docId:"HD-07", docName:"ハザード評価表",               category:"HACCP計画",  revision:"2.0", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"HACCP管理フォルダ/v2", note:"" },
        { docId:"PP-01", docName:"一般衛生管理計画（PRP）",      category:"管理計画",   revision:"1.3", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"衛生管理フォルダ", note:"" },
        { docId:"PP-02", docName:"アレルゲン管理手順",           category:"管理計画",   revision:"1.2", approvedDate:"2026-01-10", nextReviewDate:"2027-01-09", responsible:"田中 花子", status:"最新版", location:"衛生管理フォルダ", note:"" },
        { docId:"RC-01", docName:"CCPモニタリング記録",          category:"運用記録",   revision:"1.1", approvedDate:"2026-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"記録ファイル/2026", note:"" },
        { docId:"RC-02", docName:"原材料受入記録",               category:"運用記録",   revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"記録ファイル/2026", note:"" },
        { docId:"RC-03", docName:"衛生点検・清掃消毒記録",       category:"運用記録",   revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"記録ファイル/2026", note:"" },
        { docId:"RC-04", docName:"従事者健康確認記録",           category:"運用記録",   revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"記録ファイル/2026", note:"" },
        { docId:"RC-05", docName:"冷蔵・冷凍温度記録",          category:"運用記録",   revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"記録ファイル/2026", note:"" },
        { docId:"RC-06", docName:"機器校正記録",                 category:"運用記録",   revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"記録ファイル/2026", note:"" },
        { docId:"NC-01", docName:"不適合製品処置書（4-2）",      category:"不適合管理", revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"不適合管理フォルダ", note:"" },
        { docId:"NC-02", docName:"不適合管理表（4-3）",          category:"不適合管理", revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"不適合管理フォルダ", note:"" },
        { docId:"NC-03", docName:"是正処置書（5-1）",            category:"不適合管理", revision:"1.1", approvedDate:"2026-01-10", nextReviewDate:"2027-01-09", responsible:"田中 花子", status:"最新版", location:"不適合管理フォルダ", note:"" },
        { docId:"VF-01", docName:"検証記録（原則6）",            category:"検証・監査", revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"検証フォルダ", note:"" },
        { docId:"VF-02", docName:"内部監査チェックリスト",       category:"検証・監査", revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"検証フォルダ", note:"" },
        { docId:"VF-03", docName:"仕入先評価記録",               category:"検証・監査", revision:"1.0", approvedDate:"2025-04-01", nextReviewDate:"2027-03-31", responsible:"田中 花子", status:"最新版", location:"検証フォルダ", note:"" },
    ],

    notes: "本データはTBT様式（ISO22000）のサンプルです。実運用に当たっては自社の実際の工程・規格に合わせて修正してください。",
    createdAt: new Date().toISOString().slice(0, 10),
    version: 2,
};
