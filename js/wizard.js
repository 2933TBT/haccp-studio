// 入力ウィザード — 7ステップで製品情報を入力
import { ALLERGENS, PRODUCT_GROUPS, PROCESS_TYPES, TEAM_ROLES } from "./data.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

const STEPS = [
    { key: "org",         label: "1. 事業者", title: "事業者情報", help: "事業者名・所在地・営業許可・取組区分を入力してください。" },
    { key: "team",        label: "2. チーム", title: "HACCPチーム編成 (手順1)", help: "HACCPの推進体制をつくるメンバーを登録します。研修受講状況も記録します。" },
    { key: "product",     label: "3. 製品",   title: "製品情報 (手順2)", help: "製品の特徴・規格・包装・保存条件・加熱条件を入力します。" },
    { key: "ingredients", label: "4. 原材料", title: "原材料一覧 (手順2)", help: "原材料・仕入先・原産地・アレルゲンを登録します。" },
    { key: "usage",       label: "5. 使用方法", title: "意図する使用方法 (手順3)", help: "対象消費者・喫食方法・注意事項を明確化します。" },
    { key: "steps",       label: "6. 工程",   title: "製造工程 (手順4)", help: "受入から出荷までの工程を順番に登録します。AIが工程種別から危害要因とCCPを推論します。" },
    { key: "review",      label: "7. 確認",   title: "入力内容の確認", help: "入力内容を確認して「HACCP書類を生成」を押すと、12手順すべての書類が自動生成されます。" },
];

export function getWizardSteps() { return STEPS; }

export function calcCompleteness(s) {
    const checks = [
        !!s.organization?.name,
        !!s.organization?.address,
        !!s.team?.leader,
        (s.team?.members || []).length > 0,
        !!s.product?.name,
        !!s.product?.productGroup,
        !!s.product?.storage,
        !!s.product?.shelfLife,
        (s.ingredients || []).length > 0,
        (s.steps || []).length > 0,
        !!s.product?.intendedUse,
        (s.product?.allergens || []).length > 0 || s.product?.noAllergens,
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

function stepStatus(key, s) {
    switch (key) {
        case "org": {
            const n = [s.organization?.name, s.organization?.address].filter(Boolean).length;
            return n === 2 ? "done" : n > 0 ? "partial" : "empty";
        }
        case "team": {
            const hasLeader = !!s.team?.leader;
            const hasNamed  = (s.team?.members || []).some(m => m.name);
            if (hasLeader && hasNamed) return "done";
            if (hasLeader || (s.team?.members || []).length > 0) return "partial";
            return "empty";
        }
        case "product": {
            const n = [s.product?.name, s.product?.productGroup, s.product?.storage, s.product?.shelfLife].filter(Boolean).length;
            return n >= 4 ? "done" : n > 0 ? "partial" : "empty";
        }
        case "ingredients":
            return (s.ingredients || []).filter(i => i.name).length > 0 ? "done" : "empty";
        case "usage": {
            const n = [s.product?.intendedUse, s.product?.targetUser].filter(Boolean).length;
            return n === 2 ? "done" : n > 0 ? "partial" : "empty";
        }
        case "steps": {
            const n = (s.steps || []).length;
            return n >= 3 ? "done" : n > 0 ? "partial" : "empty";
        }
        case "review":
            return calcCompleteness(s) >= 80 ? "done" : "partial";
        default: return "empty";
    }
}

const ALLERGEN_KEYWORDS = {
    egg:        ["卵","タマゴ","たまご","エッグ","液卵","乾燥卵"],
    milk:       ["乳","ミルク","バター","チーズ","クリーム","ヨーグルト","脱脂粉乳","ホエイ"],
    wheat:      ["小麦","薄力粉","強力粉","中力粉","パン粉","フラワー"],
    shrimp:     ["エビ","えび","海老"],
    crab:       ["カニ","かに","蟹"],
    peanut:     ["落花生","ピーナッツ","ピーナツ"],
    buckwheat:  ["そば","蕎麦"],
    sesame:     ["ごま","胡麻","ゴマ","セサミ"],
    walnut:     ["くるみ","クルミ","胡桃"],
    almond:     ["アーモンド"],
    cashew:     ["カシューナッツ"],
    soybean:    ["大豆","豆腐","みそ","醤油","きな粉","豆乳"],
    beef:       ["牛肉","牛","ビーフ"],
    pork:       ["豚肉","豚","ポーク","ラード"],
    chicken:    ["鶏肉","鶏","チキン"],
    salmon:     ["さけ","鮭","サーモン","スモークサーモン"],
    squid:      ["いか","イカ","烏賊"],
    abalone:    ["あわび","アワビ"],
    mackerel:   ["さば","サバ","鯖"],
    orange:     ["オレンジ"],
    kiwi:       ["キウイ"],
    banana:     ["バナナ"],
    peach:      ["もも","桃"],
    apple:      ["りんご","リンゴ","林檎"],
    matsutake:  ["まつたけ","マツタケ","松茸"],
    gelatin:    ["ゼラチン"],
};

function stepWarnings(key, s) {
    const warns = [];
    if (key === "team") {
        const unnamed = (s.team?.members || []).filter(m => !m.name).length;
        if (unnamed > 0) warns.push({ level: "warn", msg: `${unnamed}名のメンバーに氏名が未入力です。書類への自動記入のために入力を推奨します。` });
        const untrained = (s.team?.members || []).filter(m => !m.trained).length;
        if (untrained > 0 && (s.team?.members || []).length > 0) warns.push({ level: "info", msg: `${untrained}名が研修「未受講」です。HACCP推進には全員の研修受講が推奨されます。` });
    }
    if (key === "product") {
        const tempC = parseFloat(s.product?.heating?.tempC);
        if (!isNaN(tempC) && tempC < 75) warns.push({ level: "warn", msg: `加熱中心温度 ${tempC}℃ は推奨値を下回っています。食肉等は75℃以上1分間、ノロウイルス対策は85〜90℃ 90秒以上が推奨されます。` });
        if ((s.ingredients || []).length > 0 && !(s.product?.allergens || []).length && !s.product?.noAllergens) {
            warns.push({ level: "info", msg: "アレルゲンの選択が未完了です。ページ下部のアレルゲンチェックボックスを確認してください。" });
        }
    }
    if (key === "ingredients") {
        (s.ingredients || []).forEach(ing => {
            if (!ing.name) return;
            Object.entries(ALLERGEN_KEYWORDS).forEach(([code, keywords]) => {
                if (keywords.some(kw => ing.name.includes(kw)) && !(ing.allergens || []).includes(code)) {
                    warns.push({ level: "warn", msg: `「${ing.name}」にアレルゲン (${code}) が含まれる可能性があります。アレルゲン欄を確認してください。` });
                }
            });
        });
    }
    if (key === "steps") {
        const HEAT_TYPES = ["heat-fry","heat-bake","heat-boil","heat-steam"];
        const hasHeatStep = (s.steps || []).some(st => HEAT_TYPES.includes(st.type));
        const hasHeatingSpec = s.product?.heating?.tempC;
        if (hasHeatingSpec && !hasHeatStep) warns.push({ level: "warn", msg: "製品の加熱条件が設定されていますが、製造工程に加熱種別の工程がありません。加熱・油ちょう等の工程を追加し種別を設定してください。" });
        if ((s.steps || []).length >= 2 && !(s.steps || []).some(st => st.isCcp)) warns.push({ level: "info", msg: "CCP（重要管理点）がまだ設定されていません。加熱・金属検出等の工程で「isCCP」にチェックするか、「雛形一括生成」機能を使用してください。" });
    }
    return warns;
}

function renderStepWarningsHtml(warns) {
    if (!warns.length) return "";
    return warns.map(w => {
        const [bg, color, icon] = w.level === "warn"
            ? ["#fef3c7", "#92400e", "⚠"]
            : ["#eff6ff", "#1e40af", "ℹ"];
        return `<div style="background:${bg};color:${color};border-radius:6px;padding:8px 12px;font-size:12px;margin-bottom:10px;display:flex;gap:8px;align-items:flex-start"><span style="flex-shrink:0">${icon}</span><span>${esc(w.msg)}</span></div>`;
    }).join("");
}

export function renderWizard(state, currentStepIdx) {
    const step = STEPS[currentStepIdx];
    const pct = calcCompleteness(state);
    const pctColor = pct >= 80 ? "var(--c-success)" : pct >= 40 ? "var(--c-warn)" : "var(--c-danger)";
    const stepperHtml = STEPS.map((s, i) => {
        let cls;
        if (i === currentStepIdx) {
            cls = "active";
        } else {
            const st = stepStatus(s.key, state);
            cls = st === "done" ? "done" : st === "partial" ? "partial" : "";
        }
        const badge = cls === "done" ? " ✓" : cls === "partial" ? " ○" : "";
        return `<button class="stepper-pill ${cls}" data-goto="${i}" role="tab" aria-selected="${i === currentStepIdx}" aria-label="${esc(s.title)}">${esc(s.label)}${badge}</button>`;
    }).join("");

    return `
      <div class="wizard">
        <header class="wizard-header">
          <div>
            <h2>製品情報入力ウィザード</h2>
            <p>HACCP書類を自動生成するための入力フォームです。各項目は後から編集できます。</p>
          </div>
          <div style="text-align:right;min-width:120px">
            <div style="font-size:11px;color:#64748b;margin-bottom:4px">入力完成度 ${pct}%</div>
            <div style="background:#e2e8f0;border-radius:999px;height:8px;overflow:hidden">
              <div style="background:${pctColor};height:100%;width:${pct}%;transition:width 0.4s;border-radius:999px"></div>
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">ステップ ${currentStepIdx + 1} / ${STEPS.length}</div>
          </div>
        </header>
        <div class="wizard-stepper" role="tablist" aria-label="入力ステップ">${stepperHtml}</div>
        <section class="wizard-step">
          <h3>${esc(step.title)}</h3>
          <p class="step-help">${esc(step.help)}</p>
          ${renderStepBody(step.key, state)}
        </section>
        <div class="wizard-nav">
          <button class="btn" data-wizard-action="prev" ${currentStepIdx === 0 ? "disabled" : ""}>← 戻る</button>
          ${currentStepIdx < STEPS.length - 1
            ? `<button class="btn btn-primary" data-wizard-action="next">次へ →</button>`
            : `<button class="btn btn-primary" data-wizard-action="finish">HACCP書類を生成 ✦</button>`}
        </div>
      </div>`;
}

function renderStepBody(key, state) {
    const warnsHtml = renderStepWarningsHtml(stepWarnings(key, state));
    const body = (() => {
        switch (key) {
            case "org":         return renderOrgStep(state);
            case "team":        return renderTeamStep(state);
            case "product":     return renderProductStep(state);
            case "ingredients": return renderIngredientsStep(state);
            case "usage":       return renderUsageStep(state);
            case "steps":       return renderStepsStep(state);
            case "review":      return renderReviewStep(state);
            default: return "";
        }
    })();
    return warnsHtml + body;
}

// --- Step 1: 事業者 ---
function renderOrgStep(s) {
    const o = s.organization || {};
    return `
      <div class="form-grid">
        <div class="form-field span-2">
          <label class="req-label">事業者名</label>
          <input type="text" data-bind="organization.name" value="${esc(o.name)}" placeholder="例: 株式会社 〇〇食品" autocomplete="organization">
        </div>
        <div class="form-field span-2">
          <label class="req-label">所在地</label>
          <input type="text" data-bind="organization.address" value="${esc(o.address)}" placeholder="例: 東京都〇〇区〇〇 1-2-3" autocomplete="street-address">
        </div>
        <div class="form-field">
          <label>営業許可</label>
          <input type="text" data-bind="organization.license" value="${esc(o.license)}" placeholder="例: 冷凍食品製造業">
        </div>
        <div class="form-field">
          <label>事業規模</label>
          <select data-bind="organization.scale">
            <option value="small"  ${o.scale === "small" ? "selected" : ""}>小規模 (従業員50人未満)</option>
            <option value="medium" ${o.scale === "medium" ? "selected" : ""}>中規模 (50〜300人)</option>
            <option value="large"  ${o.scale === "large" ? "selected" : ""}>大規模 (300人以上)</option>
          </select>
        </div>
        <div class="form-field span-2">
          <label>HACCP取組区分</label>
          <select data-bind="organization.approach">
            <option value="考え方を取り入れた衛生管理"  ${o.approach === "考え方を取り入れた衛生管理" ? "selected" : ""}>HACCPの考え方を取り入れた衛生管理 (小規模事業者向け)</option>
            <option value="HACCPに基づく衛生管理"      ${o.approach === "HACCPに基づく衛生管理" ? "selected" : ""}>HACCPに基づく衛生管理</option>
          </select>
          <span class="hint">食品衛生法に基づく区分。小規模事業者は「考え方を取り入れた衛生管理」で簡易的に運用できます。</span>
        </div>
      </div>`;
}

// --- Step 2: チーム ---
function renderTeamStep(s) {
    const t = s.team || {};
    const members = (t.members && t.members.length) ? t.members : TEAM_ROLES.map(r => ({ role: r.role, name: "", trained: false, note: r.responsibility }));
    const rows = members.map((m, i) => `
        <div class="list-row" data-list="team" data-index="${i}">
          <div class="form-field"><label>役割</label><input type="text" data-bind-list="role" value="${esc(m.role)}"></div>
          <div class="form-field"><label>氏名</label><input type="text" data-bind-list="name" value="${esc(m.name)}" placeholder="例: 山田 太郎"></div>
          <div class="form-field"><label>研修受講</label>
            <select data-bind-list="trained"><option value="false" ${!m.trained ? "selected":""}>未受講</option><option value="true" ${m.trained ? "selected":""}>受講済</option></select>
          </div>
          <div class="form-field"><label>備考</label><input type="text" data-bind-list="note" value="${esc(m.note || "")}"></div>
          <button class="icon-btn danger" data-list-action="remove" title="このメンバーを削除" aria-label="このメンバーを削除">✕</button>
        </div>`).join("");
    return `
      <div class="form-grid cols-1">
        <div class="form-field">
          <label class="req-label">チームリーダー</label>
          <input type="text" data-bind="team.leader" value="${esc(t.leader || "")}" placeholder="例: 山田 太郎" autocomplete="name">
        </div>
      </div>
      <h4 style="margin:18px 0 8px;font-size:13px">チームメンバー</h4>
      <div class="list-block">${rows}</div>
      <div style="margin-top:10px"><button class="btn btn-tiny" data-list-add="team">＋ メンバー追加</button></div>`;
}

// --- Step 3: 製品 ---
function renderProductStep(s) {
    const p = s.product || {};
    const groups = PRODUCT_GROUPS.map(g => `<option value="${g.code}" ${p.productGroup === g.code ? "selected" : ""}>${esc(g.name)}</option>`).join("");
    const allergens = ALLERGENS.map(a => `
        <label class="${a.required ? "required-allergen" : ""}">
          <input type="checkbox" data-bind-allergen value="${a.code}" ${(p.allergens || []).includes(a.code) ? "checked" : ""}>
          <span>${esc(a.name)}${a.required ? " *" : ""}</span>
        </label>`).join("");
    return `
      <div class="form-grid">
        <div class="form-field span-2">
          <label class="req-label">製品名</label>
          <input type="text" data-bind="product.name" value="${esc(p.name)}" placeholder="例: 冷凍若鶏唐揚げ">
        </div>
        <div class="form-field">
          <label class="req-label">製品群</label>
          <select data-bind="product.productGroup"><option value="">選択してください</option>${groups}</select>
        </div>
        <div class="form-field">
          <label>規格・分類</label>
          <input type="text" data-bind="product.spec.category" value="${esc(p.spec?.category)}" placeholder="例: 加熱後摂取冷凍食品">
        </div>
        <div class="form-field span-2">
          <label>規格基準 (法令・自社基準)</label>
          <input type="text" data-bind="product.spec.standard" value="${esc(p.spec?.standard)}" placeholder="例: 細菌数 3×10^6/g 以下">
        </div>
        <div class="form-field">
          <label>包装形態</label>
          <input type="text" data-bind="product.packaging" value="${esc(p.packaging)}" placeholder="例: PE袋＋段ボール">
        </div>
        <div class="form-field">
          <label>内容量</label>
          <input type="text" data-bind="product.netWeight" value="${esc(p.netWeight)}" placeholder="例: 1kg／袋">
        </div>
        <div class="form-field">
          <label class="req-label">保存方法</label>
          <input type="text" data-bind="product.storage" value="${esc(p.storage)}" placeholder="例: -18℃以下で冷凍保管">
        </div>
        <div class="form-field">
          <label class="req-label">消費期限／賞味期限</label>
          <input type="text" data-bind="product.shelfLife" value="${esc(p.shelfLife)}" placeholder="例: 製造日より12ヶ月">
        </div>
        <div class="form-field">
          <label>加熱条件 — 中心温度 (℃)</label>
          <input type="number" data-bind="product.heating.tempC" value="${esc(p.heating?.tempC ?? "")}" placeholder="例: 75" min="0" max="300" step="0.1">
          <span class="hint">食肉等は75℃ 1分以上が推奨。ノロウイルス対策は85℃ 90秒以上。</span>
        </div>
        <div class="form-field">
          <label>加熱条件 — 加熱時間 (秒)</label>
          <input type="number" data-bind="product.heating.timeSec" value="${esc(p.heating?.timeSec ?? "")}" placeholder="例: 60" min="0" max="86400" step="1">
        </div>
      </div>
      <h4 style="margin:18px 0 4px;font-size:13px">アレルゲン (* = 特定原材料 8品目)</h4>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b;margin-bottom:10px;cursor:pointer">
        <input type="checkbox" data-bind="product.noAllergens" ${p.noAllergens ? "checked" : ""}>
        <span>アレルゲンを含む原材料は一切使用しない（下のチェックボックスはスキップ）</span>
      </label>
      <div class="checkbox-grid" style="${p.noAllergens ? "opacity:0.4;pointer-events:none" : ""}">${allergens}</div>`;
}

// --- Step 4: 原材料 ---
function renderIngredientsStep(s) {
    const ings = s.ingredients || [];
    const rows = ings.map((ing, i) => {
        const allergens = ALLERGENS.slice(0, 8).map(a => `
              <label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;margin-right:8px">
                <input type="checkbox" data-bind-list-allergen value="${a.code}" ${(ing.allergens || []).includes(a.code) ? "checked" : ""}>${esc(a.name)}
              </label>`).join("");
        return `
          <div class="list-row ingredient" data-list="ingredients" data-index="${i}">
            <div class="form-field"><label>原材料名</label><input type="text" data-bind-list="name" value="${esc(ing.name)}" placeholder="例: 若鶏もも肉"></div>
            <div class="form-field"><label>仕入先</label><input type="text" data-bind-list="supplier" value="${esc(ing.supplier || "")}" placeholder="例: 〇〇ファーム"></div>
            <div class="form-field"><label>原産地</label><input type="text" data-bind-list="origin" value="${esc(ing.origin || "")}" placeholder="例: 国産"></div>
            <div class="form-field"><label>規格・備考</label><input type="text" data-bind-list="spec" value="${esc(ing.spec || "")}" placeholder="例: 10℃以下、ロット番号付"></div>
            <button class="icon-btn danger" data-list-action="remove" title="この原材料を削除" aria-label="この原材料を削除">✕</button>
            <div style="grid-column:1/-1;font-size:11px;color:#64748b;margin-top:-4px">アレルゲン: ${allergens}</div>
          </div>`;
    }).join("");
    return `
      <div class="list-block">${rows || `<div style="color:#94a3b8;text-align:center;padding:20px">原材料を追加してください</div>`}</div>
      <div style="margin-top:10px"><button class="btn btn-tiny" data-list-add="ingredients">＋ 原材料を追加</button></div>`;
}

// --- Step 5: 使用方法 ---
function renderUsageStep(s) {
    const p = s.product || {};
    return `
      <div class="form-grid cols-1">
        <div class="form-field">
          <label>意図する用途</label>
          <input type="text" data-bind="product.intendedUse" value="${esc(p.intendedUse)}" placeholder="例: 解凍後フライ加熱して喫食">
        </div>
        <div class="form-field">
          <label>対象消費者</label>
          <input type="text" data-bind="product.targetUser" value="${esc(p.targetUser)}" placeholder="例: 一般消費者・業務用">
        </div>
        <div class="form-field">
          <label>対象年齢層</label>
          <input type="text" data-bind="product.targetAge" value="${esc(p.targetAge)}" placeholder="例: 全年齢層 / 乳幼児を除く 等">
          <span class="hint">乳児・高齢者・免疫低下者を含む場合は、より厳しい管理を検討してください。</span>
        </div>
        <div class="form-field">
          <label>消費者への注意事項 (調理方法等)</label>
          <textarea data-bind="product.consumerAdvice">${esc(p.consumerAdvice || "")}</textarea>
        </div>
      </div>`;
}

// --- Step 6: 工程 ---
function renderStepsStep(s) {
    const steps = s.steps || [];
    const types = PROCESS_TYPES.map(t => `<option value="${t.code}" data-default="${esc(t.defaultParam)}">${esc(t.name)}</option>`).join("");
    const rows = steps.map((st, i) => `
        <div class="list-row process" data-list="steps" data-index="${i}" style="${st.isCcp ? "background:#eff6ff;border-left:3px solid var(--c-primary)" : ""}">
          <div class="form-field seq" style="text-align:center;font-weight:700;color:#64748b">${st.seq || (i + 1)}</div>
          <div class="form-field"><label>工程名</label><input type="text" data-bind-list="name" value="${esc(st.name)}" placeholder="例: 油ちょう"></div>
          <div class="form-field">
            <label>工程種別</label>
            <select data-bind-list="type">${PROCESS_TYPES.map(t => `<option value="${t.code}" ${st.type === t.code ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>
          </div>
          <div class="form-field"><label>条件・パラメータ</label><input type="text" data-bind-list="params" value="${esc(st.params || "")}" placeholder="例: 180℃ × 3分"></div>
          <div class="form-field" style="display:flex;align-items:flex-end;padding-bottom:4px">
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:var(--c-primary);cursor:pointer;white-space:nowrap">
              <input type="checkbox" data-bind-list="isCcp" ${st.isCcp ? "checked" : ""}>
              🎯 CCP
            </label>
          </div>
          <div class="list-actions">
            <button class="icon-btn" data-list-action="up" title="上へ" aria-label="工程を上へ移動">↑</button>
            <button class="icon-btn" data-list-action="down" title="下へ" aria-label="工程を下へ移動">↓</button>
            <button class="icon-btn danger" data-list-action="remove" title="削除" aria-label="この工程を削除">✕</button>
          </div>
        </div>`).join("");
    return `
      <p style="font-size:12px;color:#64748b;margin-top:0">受入から出荷まで、製造工程を順番に登録してください。「工程種別」を選ぶと、危害要因の自動判定に使用されます。</p>
      <div class="list-block">${rows || `<div style="color:#94a3b8;text-align:center;padding:20px">工程を追加してください</div>`}</div>
      <div style="margin-top:10px"><button class="btn btn-tiny" data-list-add="steps">＋ 工程を追加</button></div>`;
}

// --- Step 7: 確認 ---
function renderReviewStep(s) {
    const { errors, warnings } = validate(s);
    const ing    = s.ingredients || [];
    const steps  = s.steps || [];
    const allergens  = (s.product?.allergens || []);
    const ccpSteps   = steps.filter(st => st.isCcp);
    const namedMembers = (s.team?.members || []).filter(m => m.name);

    let bannerHtml;
    if (errors.length === 0) {
        bannerHtml = `<div style="background:#dcfce7;color:#166534;padding:10px 14px;border-radius:6px;margin-bottom:14px;font-size:13px;display:flex;gap:8px;align-items:flex-start">
            <span style="flex-shrink:0">✅</span>
            <div><b>必須項目はすべて入力されています。HACCP書類を生成できます。</b>
            ${warnings.length ? `<ul style="margin:6px 0 0;padding-left:18px;color:#166534">${warnings.map(w => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}
            </div></div>`;
    } else {
        bannerHtml = `<div style="background:#fef3c7;color:#92400e;padding:10px 14px;border-radius:6px;margin-bottom:6px;font-size:13px">
             <b>⚠ 未入力の必須項目:</b><ul style="margin:6px 0 0;padding-left:20px">${errors.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
           </div>
           ${warnings.length ? `<div style="background:#eff6ff;color:#1e40af;padding:8px 14px;border-radius:6px;margin-bottom:14px;font-size:12px">
             <b>ℹ 推奨入力項目:</b><ul style="margin:4px 0 0;padding-left:18px">${warnings.map(w => `<li>${esc(w)}</li>`).join("")}</ul>
           </div>` : "<div style='margin-bottom:14px'></div>"}`;
    }

    const genPreviewHtml = `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-top:16px">
            <div style="font-weight:700;font-size:12px;color:#166534;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">✨ 「HACCP書類を生成」で自動生成される書類</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:12px;color:#15803d">
                <div>• 原料記述書 (9-1)</div>
                <div>• 危害抽出書</div>
                <div>• ハザード評価表 (原則1)</div>
                <div>• 管理手段選択分類表 (原則2)</div>
                <div>• O-PRPプラン (原則3〜7)</div>
                <div>• HACCPプラン (原則3〜7)</div>
                <div>• 検証記録 (原則6)</div>
                <div>• 手順1〜12 全書類</div>
            </div>
            <div style="font-size:11px;color:#4ade80;margin-top:8px;padding-top:8px;border-top:1px solid #bbf7d0;color:#166534">生成後は各タブで個別に編集できます。既存データがある場合は差分追加のみ行われ、上書きされません。</div>
        </div>`;

    return `
      ${bannerHtml}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px">
          <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:#64748b;text-transform:uppercase">事業者・チーム</div>
          <div><b>事業者名:</b> ${esc(s.organization?.name || "—")}</div>
          <div><b>所在地:</b> ${esc(s.organization?.address || "—")}</div>
          <div><b>チームリーダー:</b> ${esc(s.team?.leader || "—")}</div>
          <div><b>メンバー:</b> ${namedMembers.length}名 (${(s.team?.members || []).length}行)</div>
          <div><b>取組区分:</b> ${esc(s.organization?.approach || "—")}</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px">
          <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:#64748b;text-transform:uppercase">製品情報</div>
          <div><b>製品名:</b> <span style="font-weight:700">${esc(s.product?.name || "—")}</span></div>
          <div><b>製品群:</b> ${esc(s.product?.productGroup || "—")}</div>
          <div><b>保存方法:</b> ${esc(s.product?.storage || "—")}</div>
          <div><b>賞味期限:</b> ${esc(s.product?.shelfLife || "—")}</div>
          <div><b>加熱条件:</b> ${s.product?.heating?.tempC ? `${s.product.heating.tempC}℃ / ${s.product.heating.timeSec || "—"}秒` : "—"}</div>
          <div><b>アレルゲン:</b> ${allergens.length > 0 ? allergens.join("、") : (s.product?.noAllergens ? "なし（確認済）" : "未確認")}</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px">
          <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:#64748b;text-transform:uppercase">原材料 (${ing.length}件)</div>
          ${ing.length > 0 ? ing.slice(0, 5).map(i => `<div>• ${esc(i.name || "—")}${i.supplier ? ` <span style="color:#64748b;font-size:11px">(${esc(i.supplier)})</span>` : ""}</div>`).join("") + (ing.length > 5 ? `<div style="color:#64748b">他 ${ing.length - 5}件...</div>` : "") : "<div style='color:#94a3b8'>未入力</div>"}
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px">
          <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:#64748b;text-transform:uppercase">製造工程 (${steps.length}工程 / CCP: ${ccpSteps.length}箇所)</div>
          ${steps.length > 0 ? steps.slice(0, 6).map(st => `<div>${st.isCcp ? "🎯" : "•"} ${esc(st.name || "—")}${st.type ? ` <span style="color:#64748b;font-size:11px">[${esc(st.type)}]</span>` : ""}</div>`).join("") + (steps.length > 6 ? `<div style="color:#64748b">他 ${steps.length - 6}工程...</div>` : "") : "<div style='color:#94a3b8'>未入力</div>"}
        </div>
      </div>
      ${genPreviewHtml}`;
}

function validate(s) {
    const errors = [];
    const warnings = [];
    if (!s.organization?.name)    errors.push("事業者名 (ステップ1)");
    if (!s.organization?.address) errors.push("所在地 (ステップ1)");
    if (!s.team?.leader)          errors.push("チームリーダー名 (ステップ2)");
    if (!s.product?.name)         errors.push("製品名 (ステップ3)");
    if (!s.product?.productGroup) errors.push("製品群 (ステップ3)");
    if (!s.product?.storage)      errors.push("保存方法 (ステップ3)");
    if (!s.product?.shelfLife)    errors.push("消費期限／賞味期限 (ステップ3)");
    if (!(s.ingredients?.length)) errors.push("原材料 — 最低1件 (ステップ4)");
    if (!(s.steps?.length))       errors.push("製造工程 — 最低1工程 (ステップ6)");
    if (!s.product?.intendedUse)  warnings.push("意図する用途 (ステップ5) — 手順3書類に使用されます");
    if (!(s.product?.allergens || []).length && !s.product?.noAllergens) warnings.push("アレルゲン (ステップ3) — 未選択です");
    return { errors, warnings };
}
