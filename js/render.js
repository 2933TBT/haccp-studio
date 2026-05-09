// HACCP 12 手順 + 付帯書類のHTMLレンダラ
import { ALLERGENS, PRODUCT_GROUPS, PROCESS_TYPES, PRP_ITEMS, TEAM_ROLES } from "./data.js";
import { buildHaccpPlan } from "./rules.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const pgName = (code) => PRODUCT_GROUPS.find(p => p.code === code)?.name || code || "—";
const ptName = (code) => PROCESS_TYPES.find(p => p.code === code)?.name || code || "—";
const allergenNames = (codes = []) => codes.map(c => ALLERGENS.find(a => a.code === c)?.name).filter(Boolean);

const TODAY = () => new Date().toISOString().slice(0, 10);

function docFrame({ key, title, subtitle, body, product }) {
    return `
    <article class="doc" data-doc="${key}">
      <header class="doc-header">
        <div>
          <h2 class="doc-title">${esc(title)}</h2>
          <div class="doc-meta">${esc(product?.product?.name || "")} ／ ${esc(subtitle || "")} ／ 発行日: ${TODAY()}</div>
        </div>
        <div class="doc-tools no-print">
          <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          <button class="btn btn-tiny" data-action="excel">Excel</button>
        </div>
      </header>
      ${body}
    </article>`;
}

function emptyDoc(msg) { return `<div class="empty">${esc(msg)}</div>`; }

// ============== 手順1: HACCPチーム名簿 ==============
export function renderTeam(product) {
    const t = product.team || {};
    const members = (t.members && t.members.length) ? t.members : TEAM_ROLES.map(r => ({ role: r.role, name: "", trained: false, note: r.responsibility }));
    const rows = members.map((m, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(m.role)}</td>
          <td>${esc(m.name) || "<span style='color:#94a3b8'>未記入</span>"}</td>
          <td style="text-align:center">${m.trained ? "✓" : "—"}</td>
          <td>${esc(m.note || "")}</td>
        </tr>`).join("");
    const body = `
        <h4>1. 組織情報</h4>
        <dl class="kv">
          <dt>事業者名</dt><dd>${esc(product.organization?.name || "—")}</dd>
          <dt>所在地</dt><dd>${esc(product.organization?.address || "—")}</dd>
          <dt>営業許可</dt><dd>${esc(product.organization?.license || "—")}</dd>
          <dt>HACCP取組区分</dt><dd>${esc(product.organization?.approach || "—")}</dd>
          <dt>チームリーダー</dt><dd>${esc(t.leader || "—")}</dd>
        </dl>
        <h4>2. HACCPチーム名簿</h4>
        <table>
          <thead><tr><th>No.</th><th>役割</th><th>氏名</th><th>研修受講</th><th>備考</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    return docFrame({ key: "team", title: "手順1: HACCPチーム名簿", subtitle: "Codex 手順1", body, product });
}

// ============== 手順2: 製品説明書 ==============
export function renderSpec(product) {
    const p = product.product || {};
    const ings = product.ingredients || [];
    const ingRows = ings.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:#94a3b8">原材料未入力</td></tr>` :
        ings.map((i, n) => `
          <tr>
            <td>${n + 1}</td>
            <td>${esc(i.name)}</td>
            <td>${esc(i.supplier || "—")}</td>
            <td>${esc(i.origin || "—")}</td>
            <td>${esc(allergenNames(i.allergens).join("・") || "—")}</td>
            <td>${esc(i.spec || "—")}</td>
          </tr>`).join("");
    const allergens = p.noAllergens ? "なし（不使用確認済）" : allergenNames(p.allergens || []).join("・") || "なし";
    const body = `
        <h4>1. 製品の概要</h4>
        <dl class="kv">
          <dt>製品名</dt><dd>${esc(p.name || "—")}</dd>
          <dt>製品群</dt><dd>${esc(pgName(p.productGroup))}</dd>
          <dt>規格・分類</dt><dd>${esc(p.spec?.category || "—")}</dd>
          <dt>規格基準</dt><dd>${esc(p.spec?.standard || "—")}</dd>
          <dt>包装形態</dt><dd>${esc(p.packaging || "—")}</dd>
          <dt>内容量</dt><dd>${esc(p.netWeight || "—")}</dd>
          <dt>保存方法</dt><dd>${esc(p.storage || "—")}</dd>
          <dt>消費期限／賞味期限</dt><dd>${esc(p.shelfLife || "—")}</dd>
          <dt>加熱条件 (目標)</dt><dd>${p.heating ? `中心 ${esc(p.heating.tempC)}℃ × ${esc(p.heating.timeSec)}秒 以上` : "—"}</dd>
          <dt>アレルゲン</dt><dd>${esc(allergens)}</dd>
        </dl>
        <h4>2. 原材料一覧</h4>
        <table>
          <thead><tr><th>No.</th><th>原材料名</th><th>仕入先</th><th>原産地</th><th>アレルゲン</th><th>規格・備考</th></tr></thead>
          <tbody>${ingRows}</tbody>
        </table>`;
    return docFrame({ key: "spec", title: "手順2: 製品説明書", subtitle: "Codex 手順2 / 製品の特徴", body, product });
}

// ============== 手順3: 製品の使用方法 ==============
export function renderUsage(product) {
    const p = product.product || {};
    const body = `
        <dl class="kv">
          <dt>意図する用途</dt><dd>${esc(p.intendedUse || "—")}</dd>
          <dt>対象消費者</dt><dd>${esc(p.targetUser || "—")}</dd>
          <dt>対象年齢層</dt><dd>${esc(p.targetAge || "—")}</dd>
          <dt>消費者への注意事項</dt><dd>${esc(p.consumerAdvice || "—")}</dd>
          <dt>表示するアレルゲン</dt><dd>${esc(p.noAllergens ? "なし（不使用確認済）" : allergenNames(p.allergens || []).join("・") || "なし")}</dd>
        </dl>
        <h4>使用方法に基づく危害判定の方針</h4>
        <ul>
          <li>意図する使用方法 (${esc(p.intendedUse || "—")}) を前提として、危害要因の重大性を評価する。</li>
          <li>意図しない使用 (例: 加熱不足) のリスクは、表示・調理方法の明記により軽減する。</li>
          <li>感受性の高い消費者層が含まれる場合、より厳しい管理基準を採用する。</li>
        </ul>`;
    return docFrame({ key: "usage", title: "手順3: 製品の使用方法", subtitle: "Codex 手順3 / 意図する使用", body, product });
}

// ============== 手順4: フローダイアグラム ==============
export function renderFlow(product, plan) {
    const steps = product.steps || [];
    const ccpStepSeqs = new Set((plan?.ccps || []).map(c => c.hazard.stepSeq));
    if (steps.length === 0) return docFrame({ key: "flow", title: "手順4: フローダイアグラム", subtitle: "Codex 手順4", body: emptyDoc("工程が未入力です。ウィザードから入力してください。"), product });

    const nodes = steps.map(s => {
        const isCCP = ccpStepSeqs.has(s.seq);
        return `
          <div class="flow-node ${isCCP ? "has-ccp" : ""}">
            <span class="seq">${s.seq}</span>
            <div class="name">${esc(s.name)}</div>
            ${s.params ? `<div class="params">${esc(s.params)}</div>` : ""}
            ${isCCP ? `<span class="ccp-tag">CCP</span>` : ""}
          </div>`;
    }).join(`<div class="flow-arrow">▼</div>`);

    const tableRows = steps.map(s => `
        <tr class="${ccpStepSeqs.has(s.seq) ? "is-ccp" : ""}">
          <td style="text-align:center">${s.seq}</td>
          <td>${esc(s.name)}</td>
          <td>${esc(ptName(s.type))}</td>
          <td>${esc(s.params || "—")}</td>
          <td style="text-align:center">${ccpStepSeqs.has(s.seq) ? `<span class="ccp-badge">CCP</span>` : ""}</td>
        </tr>`).join("");
    const body = `
        <div class="flow-diagram no-print" style="display:none">${nodes}</div>
        <details open>
          <summary class="no-print" style="cursor:pointer;color:#2563eb;margin-bottom:8px">▼ ダイアグラム表示</summary>
          <div class="flow-diagram">${nodes}</div>
        </details>
        <h4>工程一覧表</h4>
        <table>
          <thead><tr><th style="width:50px">No.</th><th>工程名</th><th>区分</th><th>条件・パラメータ</th><th style="width:60px">CCP</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>`;
    return docFrame({ key: "flow", title: "手順4: フローダイアグラム (製造工程一覧図)", subtitle: "Codex 手順4", body, product });
}

// ============== 手順5: 現場確認記録 ==============
export function renderOnsite(product) {
    const steps = product.steps || [];
    const checks = steps.map(s => `
      <label>
        <input type="checkbox">
        <div>
          <div><b>工程 ${s.seq}: ${esc(s.name)}</b> <span style="color:#94a3b8">(${esc(ptName(s.type))})</span></div>
          <div style="font-size:11px;color:#64748b">条件: ${esc(s.params || "—")}</div>
        </div>
      </label>`).join("");
    const body = `
        <p style="color:#475569">フローダイアグラムが現場の実際の流れと一致しているかを、HACCPチームが現地で確認し、相違があれば修正します。</p>
        <h4>確認チェックリスト</h4>
        <div class="checklist">${checks || `<div class="empty">工程が未入力です</div>`}</div>
        <h4>確認者・日付</h4>
        <dl class="kv">
          <dt>確認日</dt><dd>______年 ___月 ___日</dd>
          <dt>確認者</dt><dd>__________________</dd>
          <dt>確認時の所見</dt><dd style="min-height:48px">&nbsp;</dd>
        </dl>`;
    return docFrame({ key: "onsite", title: "手順5: 現場確認記録", subtitle: "Codex 手順5", body, product });
}

// ============== 手順6: 危害要因分析表 ==============
export function renderHazards(product, plan) {
    const hazards = plan.hazards;
    if (hazards.length === 0) return docFrame({ key: "hazards", title: "手順6: 危害要因分析表", subtitle: "原則1", body: emptyDoc("工程が未入力です"), product });
    const rows = hazards.map(h => `
        <tr class="${h.ccp.isCCP ? "is-ccp" : ""}">
          <td style="text-align:center">${h.stepSeq}</td>
          <td>${esc(h.stepName)}</td>
          <td style="text-align:center"><b>${h.category}</b></td>
          <td>${esc(h.name)}</td>
          <td style="text-align:center">${h.severity}</td>
          <td style="text-align:center">${h.likelihood}</td>
          <td style="text-align:center">${h.significance}</td>
          <td>${esc(h.control)}</td>
          <td style="text-align:center">${h.ccp.isCCP ? `<span class="ccp-badge">CCP${h.ccpNo || ""}</span>` : (h.ccp.isPRP ? "PRP" : "—")}</td>
        </tr>`).join("");
    const body = `
        <p style="color:#475569;font-size:12px">区分: <b>B</b>=生物的 / <b>C</b>=化学的 / <b>P</b>=物理的 / <b>A</b>=アレルゲン &nbsp;｜&nbsp; 重大性・頻度は1〜3、重要度=重大性×頻度</p>
        <table>
          <thead><tr>
            <th style="width:50px">No.</th><th>工程</th><th style="width:50px">区分</th><th>危害要因</th>
            <th style="width:60px">重大性</th><th style="width:60px">頻度</th><th style="width:60px">重要度</th>
            <th>管理手段</th><th style="width:90px">CCP判定</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    return docFrame({ key: "hazards", title: "手順6: 危害要因分析表 (HA)", subtitle: "原則1", body, product });
}

// ============== 手順7: CCP整理表 ==============
export function renderCCP(product, plan) {
    const ccps = plan.ccps;
    if (ccps.length === 0) return docFrame({ key: "ccp", title: "手順7: CCP整理表", subtitle: "原則2", body: emptyDoc("CCPは検出されませんでした。一般衛生管理 (PRP) で管理します。"), product });
    const rows = ccps.map(c => `
        <tr>
          <td style="text-align:center"><span class="ccp-badge">CCP${c.ccpNo}</span></td>
          <td>${esc(c.hazard.stepName)} (工程${c.hazard.stepSeq})</td>
          <td style="text-align:center">${c.hazard.category}</td>
          <td>${esc(c.hazard.name)}</td>
          <td style="font-size:11px">${c.hazard.ccp.path.map(esc).join("<br>")}</td>
          <td>${esc(c.hazard.ccp.rationale)}</td>
        </tr>`).join("");
    const body = `
        <p style="color:#475569;font-size:12px">Codex デシジョンツリー Q1〜Q4 に基づくCCPの判定根拠を示します。</p>
        <table>
          <thead><tr>
            <th style="width:80px">CCP No.</th><th>工程</th><th style="width:50px">区分</th><th>危害要因</th>
            <th>判定経路</th><th>判定根拠</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    return docFrame({ key: "ccp", title: "手順7: CCP整理表", subtitle: "原則2 / Codexデシジョンツリー", body, product });
}

// ============== 手順8: CL設定書 ==============
export function renderCL(product, plan) {
    const ccps = plan.ccps;
    if (ccps.length === 0) return docFrame({ key: "cl", title: "手順8: 管理基準 (CL)", subtitle: "原則3", body: emptyDoc("CCPがないためCLは設定不要です"), product });
    const rows = ccps.map(c => `
        <tr>
          <td style="text-align:center"><span class="ccp-badge">CCP${c.ccpNo}</span></td>
          <td>${esc(c.hazard.stepName)}</td>
          <td>${esc(c.cl.parameter)}</td>
          <td><b>${esc(c.cl.criteria)}</b></td>
          <td style="font-size:11px">${esc(c.cl.basis)}</td>
        </tr>`).join("");
    const body = `
        <p style="color:#475569;font-size:12px">各CCPに対する管理基準 (Critical Limit) を、科学的根拠とともに設定します。</p>
        <table>
          <thead><tr>
            <th style="width:80px">CCP</th><th>工程</th><th>パラメータ</th><th>管理基準 (CL)</th><th>科学的根拠</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    return docFrame({ key: "cl", title: "手順8: 管理基準 (CL) 設定書", subtitle: "原則3", body, product });
}

// ============== 手順9: モニタリング ==============
export function renderMonitoring(product, plan) {
    const ccps = plan.ccps;
    if (ccps.length === 0) return docFrame({ key: "monitoring", title: "手順9: モニタリング方法", subtitle: "原則4", body: emptyDoc("CCPなし"), product });
    const rows = ccps.map(c => `
        <tr>
          <td style="text-align:center"><span class="ccp-badge">CCP${c.ccpNo}</span></td>
          <td>${esc(c.hazard.stepName)}</td>
          <td>${esc(c.mon.what)}</td>
          <td>${esc(c.mon.how)}</td>
          <td>${esc(c.mon.frequency)}</td>
          <td>${esc(c.mon.who)}</td>
          <td>${esc(c.mon.record)}</td>
        </tr>`).join("");
    const body = `
        <table>
          <thead><tr>
            <th style="width:80px">CCP</th><th>工程</th><th>何を (What)</th><th>どう (How)</th>
            <th>頻度 (When)</th><th>誰が (Who)</th><th>記録 (Record)</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    return docFrame({ key: "monitoring", title: "手順9: モニタリング方法", subtitle: "原則4", body, product });
}

// ============== 手順10: 改善措置 ==============
export function renderCorrective(product, plan) {
    const ccps = plan.ccps;
    if (ccps.length === 0) return docFrame({ key: "corrective", title: "手順10: 改善措置", subtitle: "原則5", body: emptyDoc("CCPなし"), product });
    const rows = ccps.map(c => `
        <tr>
          <td style="text-align:center"><span class="ccp-badge">CCP${c.ccpNo}</span></td>
          <td>${esc(c.hazard.stepName)}</td>
          <td>${esc(c.corr.trigger)}</td>
          <td style="font-size:12px">${esc(c.corr.action).replace(/①|②|③|④|⑤/g, m => `<br>${m}`).replace(/^<br>/, "")}</td>
          <td>${esc(c.corr.responsible)}</td>
        </tr>`).join("");
    const body = `
        <table>
          <thead><tr>
            <th style="width:80px">CCP</th><th>工程</th><th>逸脱トリガー</th><th>改善措置 (是正処置)</th><th>責任者</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    return docFrame({ key: "corrective", title: "手順10: 改善措置 (是正処置)", subtitle: "原則5", body, product });
}

// ============== 手順11: 検証方法 ==============
export function renderVerification(product, plan) {
    const ccps = plan.ccps;
    if (ccps.length === 0) return docFrame({ key: "verification", title: "手順11: 検証方法", subtitle: "原則6", body: emptyDoc("CCPなし"), product });
    const rows = ccps.map(c => `
        <tr>
          <td style="text-align:center"><span class="ccp-badge">CCP${c.ccpNo}</span></td>
          <td>${esc(c.hazard.stepName)}</td>
          <td style="font-size:12px">${esc(c.ver.method)}</td>
          <td>${esc(c.ver.frequency)}</td>
          <td>${esc(c.ver.evidence)}</td>
        </tr>`).join("");
    const body = `
        <table>
          <thead><tr>
            <th style="width:80px">CCP</th><th>工程</th><th>検証方法</th><th>頻度</th><th>必要なエビデンス</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <h4>HACCPプラン全体の検証</h4>
        <ul>
          <li><b>内部監査</b>: 年1回以上、HACCPチームによる全工程・記録のレビュー</li>
          <li><b>製品検査</b>: 月次の細菌検査・年次のアレルゲン検査</li>
          <li><b>外部監査</b>: 取引先要求または認証取得時に第三者による監査</li>
          <li><b>計画の見直し</b>: 工程・原料・規制の変更時、または年1回以上</li>
        </ul>`;
    return docFrame({ key: "verification", title: "手順11: 検証方法", subtitle: "原則6", body, product });
}

// ============== 手順12: 記録一覧 ==============
export function renderRecords(product, plan) {
    const ccps = plan.ccps;
    const ccpRecords = ccps.map(c => ({
        name: c.mon.record,
        related: `CCP${c.ccpNo} (${c.hazard.stepName})`,
        retention: "2年間",
        responsible: c.mon.who,
    }));
    const generic = [
        { name: "受入記録表",           related: "原材料受入",  retention: "2年間", responsible: "受入担当者" },
        { name: "保管温度記録表",       related: "冷蔵・冷凍保管", retention: "2年間", responsible: "保管担当者" },
        { name: "清掃・消毒記録",       related: "一般衛生管理 (PRP)", retention: "1年間", responsible: "衛生管理責任者" },
        { name: "従事者健康確認記録",   related: "PRP",           retention: "1年間", responsible: "衛生管理責任者" },
        { name: "教育訓練記録",         related: "PRP",           retention: "3年間", responsible: "管理責任者" },
        { name: "苦情対応・回収記録",   related: "全般",         retention: "5年間", responsible: "品質管理責任者" },
    ];
    const all = [...ccpRecords, ...generic];
    const rows = all.map((r, i) => `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${esc(r.name)}</td>
          <td>${esc(r.related)}</td>
          <td>${esc(r.retention)}</td>
          <td>${esc(r.responsible)}</td>
        </tr>`).join("");
    const body = `
        <p style="color:#475569;font-size:12px">記録は、現場担当者が日々記入し、確認者がレビュー・署名します。電子帳簿保存法に対応する場合は電子保存も可。</p>
        <table>
          <thead><tr>
            <th style="width:50px">No.</th><th>記録名</th><th>関連工程・項目</th><th>保存期間</th><th>記録責任者</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    return docFrame({ key: "records", title: "手順12: 記録と保存", subtitle: "原則7", body, product });
}

// ============== 一般衛生管理計画 (PRP) ==============
export function renderPRP(product) {
    const rows = PRP_ITEMS.map((p, i) => `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${esc(p.category)}</td>
          <td><b>${esc(p.title)}</b></td>
          <td>${esc(p.desc)}</td>
          <td>${esc(p.frequency)}</td>
        </tr>`).join("");
    const body = `
        <p style="color:#475569;font-size:12px">HACCPの土台となる一般衛生管理プログラム (Prerequisite Program, PRP) です。Codex GHPおよび厚生労働省の食品衛生法に準拠しています。</p>
        <table>
          <thead><tr>
            <th style="width:50px">No.</th><th>カテゴリ</th><th>項目</th><th>実施内容</th><th>頻度</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    return docFrame({ key: "prp", title: "一般衛生管理計画 (PRP)", subtitle: "Codex GHP / 食品衛生法 一般衛生管理", body, product });
}

// ============== 全書類プレビュー ==============
export function renderAll(product) {
    const plan = buildHaccpPlan(product);
    const all = [
        renderTeam(product),
        renderSpec(product),
        renderUsage(product),
        renderFlow(product, plan),
        renderOnsite(product),
        renderHazards(product, plan),
        renderCCP(product, plan),
        renderCL(product, plan),
        renderMonitoring(product, plan),
        renderCorrective(product, plan),
        renderVerification(product, plan),
        renderRecords(product, plan),
        renderPRP(product),
    ].join("");
    return `<div class="all-docs">${all}</div>`;
}

// ============== ルーティング: docキー → レンダラ ==============
export function renderDoc(docKey, product) {
    if (!product?.product?.name) {
        return `<div class="doc"><div class="empty">先にウィザードから製品情報を入力してください。<br><br><button class="btn btn-primary" onclick="location.hash='#/wizard'">入力ウィザードへ</button></div></div>`;
    }
    const plan = buildHaccpPlan(product);
    switch (docKey) {
        case "team":         return renderTeam(product);
        case "spec":         return renderSpec(product);
        case "usage":        return renderUsage(product);
        case "flow":         return renderFlow(product, plan);
        case "onsite":       return renderOnsite(product);
        case "hazards":      return renderHazards(product, plan);
        case "ccp":          return renderCCP(product, plan);
        case "cl":           return renderCL(product, plan);
        case "monitoring":   return renderMonitoring(product, plan);
        case "corrective":   return renderCorrective(product, plan);
        case "verification": return renderVerification(product, plan);
        case "records":      return renderRecords(product, plan);
        case "prp":          return renderPRP(product);
        case "all":          return renderAll(product);
        default:             return `<div class="doc"><div class="empty">未対応のドキュメント: ${esc(docKey)}</div></div>`;
    }
}
