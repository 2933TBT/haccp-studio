// Reference data — 厚生労働省/Codex/食品衛生法の知見をベースにした参照データ

// 食品表示法における特定原材料 (8品目, 義務) と特定原材料に準ずるもの (20品目, 推奨)
export const ALLERGENS = [
    { code: "egg",       name: "卵",         required: true },
    { code: "milk",      name: "乳",         required: true },
    { code: "wheat",     name: "小麦",       required: true },
    { code: "shrimp",    name: "えび",       required: true },
    { code: "crab",      name: "かに",       required: true },
    { code: "peanut",    name: "落花生",     required: true },
    { code: "buckwheat", name: "そば",       required: true },
    { code: "walnut",    name: "くるみ",     required: true },
    { code: "almond",    name: "アーモンド" },
    { code: "abalone",   name: "あわび" },
    { code: "squid",     name: "いか" },
    { code: "salmonroe", name: "いくら" },
    { code: "orange",    name: "オレンジ" },
    { code: "cashew",    name: "カシューナッツ" },
    { code: "kiwi",      name: "キウイフルーツ" },
    { code: "beef",      name: "牛肉" },
    { code: "sesame",    name: "ごま" },
    { code: "salmon",    name: "さけ" },
    { code: "mackerel",  name: "さば" },
    { code: "soybean",   name: "大豆" },
    { code: "chicken",   name: "鶏肉" },
    { code: "banana",    name: "バナナ" },
    { code: "pork",      name: "豚肉" },
    { code: "matsutake", name: "まつたけ" },
    { code: "peach",     name: "もも" },
    { code: "yam",       name: "やまいも" },
    { code: "apple",     name: "りんご" },
    { code: "gelatin",   name: "ゼラチン" },
];

export const PRODUCT_GROUPS = [
    { code: "frozen",        name: "冷凍食品（加熱後摂取）" },
    { code: "frozen-noheat", name: "冷凍食品（無加熱摂取）" },
    { code: "chilled",       name: "チルド食品" },
    { code: "deli",          name: "弁当・惣菜" },
    { code: "bento",         name: "学校給食・大量調理" },
    { code: "meat",          name: "食肉製品" },
    { code: "dairy",         name: "乳・乳製品" },
    { code: "fish",          name: "魚介類加工品" },
    { code: "bakery",        name: "パン・菓子" },
    { code: "beverage",      name: "飲料" },
    { code: "retort",        name: "レトルト食品" },
    { code: "seasoning",     name: "調味料" },
    { code: "raw",           name: "生鮮品（カット野菜等）" },
];

export const PROCESS_TYPES = [
    { code: "receive",      name: "受入",        defaultParam: "" },
    { code: "store-cold",   name: "冷蔵保管",    defaultParam: "10℃以下" },
    { code: "store-frozen", name: "冷凍保管",    defaultParam: "-18℃以下" },
    { code: "store-room",   name: "常温保管",    defaultParam: "" },
    { code: "thaw",         name: "解凍",        defaultParam: "10℃以下" },
    { code: "wash",         name: "洗浄",        defaultParam: "" },
    { code: "prep",         name: "下処理",      defaultParam: "" },
    { code: "cut",          name: "切断・成形",  defaultParam: "" },
    { code: "mix",          name: "調合・混合",  defaultParam: "" },
    { code: "season",       name: "調味",        defaultParam: "" },
    { code: "coating",      name: "衣付け",      defaultParam: "" },
    { code: "heat-fry",     name: "油ちょう（揚げ）", defaultParam: "180℃ × 3分" },
    { code: "heat-bake",    name: "焼成",        defaultParam: "200℃ × 10分" },
    { code: "heat-boil",    name: "ボイル",      defaultParam: "中心75℃ × 1分" },
    { code: "heat-steam",   name: "蒸気加熱",    defaultParam: "中心85℃ × 1分" },
    { code: "cool",         name: "冷却",        defaultParam: "30分以内に20℃以下" },
    { code: "freeze",       name: "凍結",        defaultParam: "-18℃以下" },
    { code: "metal-detect", name: "金属検出",    defaultParam: "Fe φ2.0 / SUS φ3.0" },
    { code: "x-ray",        name: "X線検査",     defaultParam: "" },
    { code: "fill",         name: "充填",        defaultParam: "" },
    { code: "pack",         name: "包装",        defaultParam: "" },
    { code: "label",        name: "ラベル貼付",  defaultParam: "" },
    { code: "ship",         name: "出荷",        defaultParam: "" },
];

// 一般衛生管理プログラム (PRP) 標準項目
export const PRP_ITEMS = [
    { id: "facility",   category: "施設・設備", title: "施設・設備の衛生管理", frequency: "毎日始業前/終業後", desc: "床・壁・天井・排水溝の清掃。破損・汚れの記録。" },
    { id: "machines",   category: "機械器具",   title: "機械・器具の洗浄消毒",  frequency: "使用前後",         desc: "中性洗剤洗浄→アルコールまたは次亜塩素酸ナトリウム消毒。" },
    { id: "pest",       category: "防虫防鼠",   title: "そ族・昆虫対策",        frequency: "月1回点検",        desc: "粘着トラップ・捕虫器の点検・記録。専門業者による定期施工。" },
    { id: "water",      category: "用水",       title: "使用水の衛生管理",      frequency: "始業前 1回/日",     desc: "残留塩素0.1mg/L以上を確認・記録。年1回水質検査。" },
    { id: "waste",      category: "廃棄物",     title: "廃棄物・排水の取扱い",   frequency: "毎日",            desc: "区分廃棄、専用容器使用、フタ閉鎖、害虫対策。" },
    { id: "personnel",  category: "従事者衛生", title: "食品取扱者の衛生管理",  frequency: "始業時毎日",       desc: "健康確認・手洗い・着衣・装飾品着用禁止・体調不良時は作業から外す。" },
    { id: "training",   category: "教育訓練",   title: "従事者の教育訓練",      frequency: "年2回以上",        desc: "HACCP・一般衛生管理・アレルギー研修の実施と記録。" },
    { id: "supplier",   category: "原材料",     title: "原材料の受入管理",      frequency: "受入時毎回",       desc: "規格書・温度・外観・期限・包装の確認。仕入先選定基準。" },
    { id: "allergen",   category: "アレルゲン", title: "アレルゲン管理",        frequency: "切替時",          desc: "専用器具の使用、洗浄、表示確認、コンタミ防止。" },
    { id: "traceability", category: "記録",     title: "トレーサビリティ",      frequency: "ロット毎",        desc: "ロット番号・原料ロット・製造日時・出荷先の記録。" },
    { id: "recall",     category: "回収",       title: "回収プログラム",        frequency: "随時",            desc: "回収体制図・連絡網・模擬回収訓練 年1回。" },
];

// HACCP知識ベース (簡易RAG用) — 厚労省手引書の代表的指針を要約
export const KB = [
    { topic: "加熱殺菌", text: "食肉等の中心温度は75℃で1分間以上、または同等以上の効力を有する条件で加熱する。ノロウイルス汚染の恐れがある食品では中心85〜90℃で90秒以上。", source: "厚生労働省 大量調理施設衛生管理マニュアル" },
    { topic: "冷却",   text: "加熱調理後の食品は中心温度を30分以内に20℃付近、60分以内に10℃付近まで下げるよう急速冷却する。", source: "同上" },
    { topic: "冷蔵保管", text: "潜在的に危害性のある食品 (PHF) は10℃以下、できれば5℃以下で保管する。", source: "Codex GHP" },
    { topic: "金属検出", text: "金属検出機の感度はFe φ2.0mm、SUS φ3.0mm程度を目安とする。始業時・終業時に標準片で動作確認を実施し記録する。", source: "食品工場衛生管理ガイドライン" },
    { topic: "アレルゲン", text: "アレルゲンは交差接触防止のため専用ライン化または徹底洗浄を行い、製造順序を管理する。アレルゲン含有原料の表示と切替時の確認を記録する。", source: "厚労省 食物アレルギー対応" },
    { topic: "解凍", text: "解凍は10℃以下の冷蔵庫内で行うか、流水(20℃以下)、電子レンジ等で速やかに行う。室温放置による解凍は禁止。", source: "大量調理施設衛生管理マニュアル" },
    { topic: "受入", text: "受入時には外観・温度・期限・包装破損の確認を行い、規格に適合しない場合は受入拒否する。仕入先選定基準を文書化する。", source: "厚労省 HACCP手引書" },
    { topic: "ノロウイルス", text: "ノロウイルスは加熱が最も有効な対策であり、中心85〜90℃で90秒以上の加熱を行う。二枚貝等の生食は推奨されない。", source: "厚労省 ノロウイルス対策" },
];

// 危害要因の典型例 (工程種別→危害要因) — ルールエンジンで参照
export const HAZARD_CATALOG = {
    "receive": [
        { cat: "B", name: "病原微生物の付着 (サルモネラ・カンピロバクター・大腸菌O157等)", control: "仕入先の選定・受入規格・温度確認", severity: 3, likelihood: 2 },
        { cat: "C", name: "残留農薬・動物用医薬品", control: "仕入先の証明書・自主検査", severity: 2, likelihood: 1 },
        { cat: "P", name: "原料由来の異物 (毛髪・小石・金属片)", control: "受入時の目視確認・規格書", severity: 2, likelihood: 2 },
        { cat: "A", name: "原料アレルゲンの誤受入", control: "規格書照合・ラベル確認", severity: 3, likelihood: 1 },
    ],
    "store-cold":   [{ cat: "B", name: "病原微生物の増殖", control: "10℃以下の冷蔵保管・温度記録", severity: 3, likelihood: 2 }],
    "store-frozen": [{ cat: "B", name: "解凍による微生物増殖", control: "-18℃以下の保管・温度記録", severity: 2, likelihood: 1 }],
    "store-room":   [{ cat: "B", name: "微生物の増殖", control: "適切な温度・湿度管理", severity: 2, likelihood: 2 }],
    "thaw":         [{ cat: "B", name: "解凍中の微生物増殖", control: "10℃以下の冷蔵解凍・流水解凍", severity: 2, likelihood: 2 }],
    "wash":         [{ cat: "C", name: "洗浄剤・消毒剤の残留", control: "すすぎの徹底・手順遵守", severity: 2, likelihood: 1 }],
    "prep":         [{ cat: "B", name: "二次汚染", control: "器具の使い分け・手洗い", severity: 2, likelihood: 2 },
                     { cat: "P", name: "毛髪・装飾品の混入", control: "作業着・帽子・装飾品禁止", severity: 2, likelihood: 1 }],
    "cut":          [{ cat: "P", name: "刃物片の混入", control: "始業時点検・破損時の全数確認", severity: 2, likelihood: 1 }],
    "mix":          [{ cat: "A", name: "アレルゲンの交差接触", control: "専用器具・洗浄手順・製造順序", severity: 3, likelihood: 2 }],
    "season":       [{ cat: "C", name: "添加物の過量添加", control: "計量手順・ダブルチェック", severity: 2, likelihood: 1 }],
    "coating":      [{ cat: "A", name: "小麦粉・卵等のアレルゲン交差接触", control: "ライン分離・洗浄", severity: 3, likelihood: 2 }],
    "heat-fry":     [{ cat: "B", name: "病原微生物の残存 (サルモネラ・カンピロバクター)", control: "中心温度75℃・1分以上の確認", severity: 3, likelihood: 2 }],
    "heat-bake":    [{ cat: "B", name: "病原微生物の残存", control: "中心温度75℃・1分以上の確認", severity: 3, likelihood: 2 }],
    "heat-boil":    [{ cat: "B", name: "病原微生物の残存", control: "中心温度75℃・1分以上の確認", severity: 3, likelihood: 2 }],
    "heat-steam":   [{ cat: "B", name: "病原微生物・ノロウイルスの残存", control: "中心温度85〜90℃・90秒以上", severity: 3, likelihood: 2 }],
    "cool":         [{ cat: "B", name: "冷却中の微生物増殖", control: "30分以内に20℃以下まで急速冷却", severity: 2, likelihood: 2 }],
    "freeze":       [{ cat: "B", name: "凍結遅延による微生物増殖", control: "-18℃以下まで急速凍結", severity: 2, likelihood: 1 }],
    "metal-detect": [{ cat: "P", name: "金属異物の混入", control: "金属検出機による全数検査 (Fe φ2.0 / SUS φ3.0)", severity: 3, likelihood: 2 }],
    "x-ray":        [{ cat: "P", name: "硬質異物の混入", control: "X線検査機による全数検査", severity: 3, likelihood: 1 }],
    "fill":         [{ cat: "B", name: "二次汚染", control: "充填機の洗浄・手指衛生", severity: 2, likelihood: 1 }],
    "pack":         [{ cat: "P", name: "包装資材片の混入", control: "資材の保管・取扱手順", severity: 1, likelihood: 1 }],
    "label":        [{ cat: "A", name: "アレルゲン表示の誤り", control: "ラベル承認・現品照合", severity: 3, likelihood: 1 }],
    "ship":         [{ cat: "B", name: "輸送中の温度逸脱", control: "冷蔵冷凍車両・温度記録", severity: 2, likelihood: 1 }],
};

// HACCPチームの推奨役割
export const TEAM_ROLES = [
    { role: "HACCPチームリーダー",  responsibility: "HACCP計画の統括・承認" },
    { role: "製造責任者",            responsibility: "工程管理・現場運用" },
    { role: "品質管理責任者",        responsibility: "検証・記録の確認" },
    { role: "衛生管理責任者",        responsibility: "一般衛生管理計画の運用" },
    { role: "原材料・購買担当",      responsibility: "仕入先管理・規格書管理" },
];
