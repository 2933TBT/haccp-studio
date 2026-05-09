// 原則1〜7 入力フォーム / 不適合・是正処置 入力フォーム (TBT/ISO22000 様式準拠)
import { ALLERGENS, PROCESS_TYPES } from "./data.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

// ============================================================
//  共通: 編集可能テーブル UI
// ============================================================
function editableTable({ title, helpText, columns, rows, listKey, addLabel, addTemplate, mode = "table" }) {
    const colHead = columns.map(c => `<th style="${c.width ? `width:${c.width}` : ''}">${esc(c.label)}</th>`).join("");
    const colCount = columns.length + 1; // +1 for delete column
    let body;
    if (rows.length === 0) {
        body = `<tr><td colspan="${colCount}" style="text-align:center;color:#94a3b8;padding:24px">未入力です。「＋ 行を追加」または「サンプル読込」で開始してください。</td></tr>`;
    } else {
        body = rows.map((r, idx) => {
            const cells = columns.map(c => {
                const val = r[c.key] ?? "";
                if (c.type === "select") {
                    const opts = c.options.map(o => {
                        const v = typeof o === "object" ? o.value : o;
                        const label = typeof o === "object" ? o.label : o;
                        return `<option value="${esc(v)}" ${val === v ? "selected" : ""}>${esc(label)}</option>`;
                    }).join("");
                    return `<td><select data-list-edit data-key="${esc(c.key)}" data-list="${esc(listKey)}" data-index="${idx}">${opts}</select></td>`;
                }
                if (c.type === "checkbox") {
                    return `<td style="text-align:center"><input type="checkbox" data-list-edit data-key="${esc(c.key)}" data-list="${esc(listKey)}" data-index="${idx}" ${val ? "checked" : ""}></td>`;
                }
                if (c.type === "textarea") {
                    return `<td><textarea data-list-edit data-key="${esc(c.key)}" data-list="${esc(listKey)}" data-index="${idx}" rows="2">${esc(val)}</textarea></td>`;
                }
                if (c.type === "nested") {
                    const nestedVal = r[c.key]?.[c.subKey] ?? "";
                    return `<td><input type="text" data-list-edit data-key="${esc(c.key)}.${esc(c.subKey)}" data-list="${esc(listKey)}" data-index="${idx}" value="${esc(nestedVal)}"></td>`;
                }
                return `<td><input type="${c.type || 'text'}" data-list-edit data-key="${esc(c.key)}" data-list="${esc(listKey)}" data-index="${idx}" value="${esc(val)}"></td>`;
            }).join("");
            return `<tr>
              ${cells}
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="${esc(listKey)}" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");
    }

    const tableId = `tbl-${listKey}`;
    const searchBox = rows.length >= 5
        ? `<input type="text" data-table-search="${tableId}" placeholder="🔍 絞り込み検索..." style="font-size:12px;padding:4px 8px;border:1px solid var(--c-border);border-radius:4px;width:180px;outline:none" class="no-print">`
        : "";
    return `
      <article class="doc">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">${esc(title)}</h2>
            ${helpText ? `<div class="doc-meta">${esc(helpText)}</div>` : ""}
          </div>
          <div class="doc-tools no-print" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${searchBox}
            <button class="btn btn-tiny" data-list-add="${esc(listKey)}" data-template='${JSON.stringify(addTemplate || {}).replace(/'/g, "&#39;")}'>＋ ${esc(addLabel || "行を追加")}</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        <div style="overflow-x:auto">
          <table class="editable-table" data-table-id="${tableId}">
            <thead><tr>${colHead}<th style="width:40px"></th></tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  原則1-A: 原料記述書（per ingredient）
// ============================================================
export function renderIngredientDescriptions(state) {
    const ings = state.ingredients || [];
    const allergenOpts = ALLERGENS.map(a => `<label style="display:inline-flex;align-items:center;gap:3px;font-size:11px;margin-right:6px"><input type="checkbox" data-ing-allergen data-index="__IDX__" value="${a.code}">${esc(a.name)}</label>`).join("");

    if (ings.length === 0) {
        return `<article class="doc"><header class="doc-header"><h2 class="doc-title">原料記述書 (TBT 9-1)</h2></header>
          <div class="empty">原材料が未入力です。<br><button class="btn btn-primary" onclick="location.hash='#/wizard'" style="margin-top:12px">入力ウィザードで原材料を追加</button></div></article>`;
    }

    const cards = ings.map((ing, i) => {
        const desc = ing.desc || {};
        const allergenChecks = ALLERGENS.map(a => `
          <label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;margin-right:8px;padding:2px 6px;border-radius:4px;${(ing.allergens || []).includes(a.code) ? "background:#fee2e2" : ""}">
            <input type="checkbox" data-ing-allergen data-index="${i}" value="${a.code}" ${(ing.allergens || []).includes(a.code) ? "checked" : ""}>${esc(a.name)}${a.required ? " *" : ""}
          </label>`).join("");
        return `
          <article class="doc" style="margin-bottom:18px" data-doc="ing-${i}">
            <header class="doc-header">
              <div>
                <h2 class="doc-title" style="font-size:16px">原料記述書 — ${esc(ing.name || "(未入力)")}</h2>
                <div class="doc-meta">原料No: ${esc(ing.ingNo || "—")} ／ 様式_雛形9-1</div>
              </div>
              <div class="doc-tools no-print">
                <button class="icon-btn danger" data-list-action="remove" data-list="ingredients" data-index="${i}" title="この原料記述書を削除" aria-label="この原料記述書を削除">✕</button>
              </div>
            </header>
            <div class="form-grid">
              <div class="form-field"><label>原料No</label><input type="text" data-list-edit data-list="ingredients" data-key="ingNo" data-index="${i}" value="${esc(ing.ingNo || "")}"></div>
              <div class="form-field"><label>カテゴリNo</label><input type="text" data-list-edit data-list="ingredients" data-key="catNo" data-index="${i}" value="${esc(ing.catNo || "")}"></div>
              <div class="form-field"><label>原料名</label><input type="text" data-list-edit data-list="ingredients" data-key="name" data-index="${i}" value="${esc(ing.name || "")}"></div>
              <div class="form-field"><label>仕入先</label><input type="text" data-list-edit data-list="ingredients" data-key="supplier" data-index="${i}" value="${esc(ing.supplier || "")}"></div>
              <div class="form-field"><label>原産地</label><input type="text" data-list-edit data-list="ingredients" data-key="origin" data-index="${i}" value="${esc(ing.origin || "")}"></div>
            </div>
            <h4>a) 食品の生物的・化学的・物理的特性</h4>
            <div class="form-grid cols-3">
              <div class="form-field"><label>生物的</label><textarea data-list-edit data-list="ingredients" data-key="desc.biological" data-index="${i}">${esc(desc.biological || "")}</textarea></div>
              <div class="form-field"><label>化学的</label><textarea data-list-edit data-list="ingredients" data-key="desc.chemical" data-index="${i}">${esc(desc.chemical || "")}</textarea></div>
              <div class="form-field"><label>物理的</label><textarea data-list-edit data-list="ingredients" data-key="desc.physical" data-index="${i}">${esc(desc.physical || "")}</textarea></div>
            </div>
            <h4>b) 添加物及び加工助剤を含む、配合された材料の組成</h4>
            <textarea data-list-edit data-list="ingredients" data-key="desc.composition" data-index="${i}" style="width:100%;min-height:60px">${esc(desc.composition || "")}</textarea>
            <div class="form-grid">
              <div class="form-field"><label>c) 由来</label><input type="text" data-list-edit data-list="ingredients" data-key="desc.source" data-index="${i}" value="${esc(desc.source || "")}"></div>
              <div class="form-field"><label>d) 製造方法</label><input type="text" data-list-edit data-list="ingredients" data-key="desc.method" data-index="${i}" value="${esc(desc.method || "")}"></div>
              <div class="form-field"><label>e) 包装及び配送方法</label><input type="text" data-list-edit data-list="ingredients" data-key="desc.packaging" data-index="${i}" value="${esc(desc.packaging || "")}"></div>
              <div class="form-field"><label>f) シェルフライフ・保管条件</label><input type="text" data-list-edit data-list="ingredients" data-key="desc.shelfLife" data-index="${i}" value="${esc(desc.shelfLife || "")}"></div>
              <div class="form-field"><label>g) 使用前の準備・取扱い</label><input type="text" data-list-edit data-list="ingredients" data-key="desc.prep" data-index="${i}" value="${esc(desc.prep || "")}"></div>
              <div class="form-field"><label>h) 受入合否判定基準・仕様</label><input type="text" data-list-edit data-list="ingredients" data-key="desc.criteria" data-index="${i}" value="${esc(desc.criteria || "")}"></div>
            </div>
            <h4>アレルゲン</h4>
            <div>${allergenChecks}</div>
          </article>`;
    }).join("");

    // Allergen summary across all ingredients
    const allergenPresent = {};
    ings.forEach(ing => (ing.allergens || []).forEach(code => { allergenPresent[code] = (allergenPresent[code] || 0) + 1; }));
    const allergenSummaryHtml = ings.length === 0 ? "" : `
      <div class="section-block no-print" style="margin-bottom:16px">
        <h3 style="font-size:13px;font-weight:700;margin:0 0 8px">アレルゲン含有原料 サマリー</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${ALLERGENS.map(a => {
            const n = allergenPresent[a.code] || 0;
            if (!n) return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;padding:3px 8px;border-radius:4px;background:var(--c-surface);border:1px solid var(--c-border);color:var(--c-text-muted)">${esc(a.name)}</span>`;
            return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;padding:3px 8px;border-radius:4px;background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;font-weight:600">${esc(a.name)}${a.required ? "★" : ""}(${n}原料)</span>`;
          }).join("")}
        </div>
        <div style="font-size:11px;color:var(--c-text-muted);margin-top:6px">★ = 特定原材料（表示義務） ／ 赤色 = 当製品に含有する原料</div>
      </div>`;

    return `
      <header class="doc-header" style="margin-bottom:8px">
        <div><h2 class="doc-title">原料記述書（TBT様式 9-1）</h2><div class="doc-meta">${ings.length} 件の原料記述書</div></div>
        <div class="doc-tools no-print">
          <button class="btn btn-tiny btn-primary" data-template-gen="ingredient-desc" title="ウィザードで入力した原材料一覧から、各原料の記述書テンプレを補完します">✨ 原材料から雛形を生成</button>
          <button class="btn btn-tiny" data-list-add="ingredients">＋ 原料を追加</button>
          <button class="btn btn-tiny" data-action="excel">Excel一括出力</button>
        </div>
      </header>
      ${allergenSummaryHtml}
      ${cards}`;
}

// ============================================================
//  原則1-B: 危害抽出書 (3シート: 原料/機械器具/プロセス)
// ============================================================
export function renderHazardExtractions(state) {
    const all = state.hazardExtractions || [];
    const groups = { ingredient: [], equipment: [], process: [] };
    all.forEach(h => { (groups[h.source] || groups.ingredient).push(h); });

    const catCount = { B: 0, C: 0, P: 0, A: 0 };
    all.forEach(h => { if (catCount[h.category] !== undefined) catCount[h.category]++; });
    const catLabels = { B: "生物(B)", C: "化学(C)", P: "物理(P)", A: "アレルゲン(A)" };
    const catColors = { B: ["#fff7ed","#d97706","#92400e"], C: ["#fff1f2","#dc2626","#7f1d1d"], P: ["#eff6ff","#2563eb","#1e3a8a"], A: ["#fdf4ff","#9333ea","#581c87"] };
    const extractionSummaryHtml = all.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px" class="no-print">
        <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;min-width:100px">
          <div style="font-size:11px;color:#1e40af;font-weight:600">危害総数</div>
          <div style="font-size:22px;font-weight:700;color:#1d4ed8">${all.length}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">原料${groups.ingredient.length} 機器${groups.equipment.length} 工程${groups.process.length}</div>
        </div>
        ${Object.entries(catCount).filter(([,n])=>n>0).map(([cat, n]) => {
          const [bg, fg, tx] = catColors[cat];
          return `<div style="background:${bg};border:1px solid ${fg}40;border-radius:8px;padding:10px 14px;min-width:80px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:${fg}">${n}</div>
            <div style="font-size:11px;color:${tx}">${catLabels[cat]}</div>
          </div>`;
        }).join("")}
      </div>`;

    const sections = [
        { src: "ingredient", label: "危害抽出書（原料編）", refLabel: "原料No", refNameLabel: "原料名" },
        { src: "equipment",  label: "危害抽出書（機械・器具編）", refLabel: "機器No", refNameLabel: "機器名" },
        { src: "process",    label: "危害抽出書（プロセス編）", refLabel: "工程No", refNameLabel: "工程名" },
    ];

    return extractionSummaryHtml + sections.map((sec, sIdx) => {
        const rows = all.map((h, idx) => ({ h, idx })).filter(({ h }) => h.source === sec.src);
        const tbody = rows.length === 0
            ? `<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:18px">未入力</td></tr>`
            : rows.map(({ h, idx }) => `
                <tr>
                  <td><input type="text" data-list-edit data-list="hazardExtractions" data-key="refNo"   data-index="${idx}" value="${esc(h.refNo || "")}"  style="width:100%"></td>
                  <td><input type="text" data-list-edit data-list="hazardExtractions" data-key="refName" data-index="${idx}" value="${esc(h.refName || "")}" style="width:100%"></td>
                  <td>
                    <select data-list-edit data-list="hazardExtractions" data-key="category" data-index="${idx}">
                      <option value="B" ${h.category === "B" ? "selected" : ""}>生物 (B)</option>
                      <option value="C" ${h.category === "C" ? "selected" : ""}>化学 (C)</option>
                      <option value="P" ${h.category === "P" ? "selected" : ""}>物理 (P)</option>
                      <option value="A" ${h.category === "A" ? "selected" : ""}>アレルゲン (A)</option>
                    </select>
                  </td>
                  <td><input type="number" min="1" data-list-edit data-list="hazardExtractions" data-key="no" data-index="${idx}" value="${esc(h.no || 1)}" style="width:50px"></td>
                  <td><input type="text" data-list-edit data-list="hazardExtractions" data-key="name" data-index="${idx}" value="${esc(h.name || "")}" style="width:100%"></td>
                  <td><textarea data-list-edit data-list="hazardExtractions" data-key="reason" data-index="${idx}" rows="2" style="width:100%">${esc(h.reason || "")}</textarea></td>
                  <td style="text-align:center"><input type="checkbox" data-list-edit data-list="hazardExtractions" data-key="routine"   data-index="${idx}" ${h.routine ? "checked" : ""}></td>
                  <td style="text-align:center"><input type="checkbox" data-list-edit data-list="hazardExtractions" data-key="abnormal"  data-index="${idx}" ${h.abnormal ? "checked" : ""}></td>
                  <td style="text-align:center"><input type="checkbox" data-list-edit data-list="hazardExtractions" data-key="emergency" data-index="${idx}" ${h.emergency ? "checked" : ""}></td>
                  <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="hazardExtractions" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
                </tr>`).join("");

        const addPayload = JSON.stringify({ source: sec.src, refNo: "", refName: "", category: "B", no: 1, name: "", reason: "", routine: true, abnormal: false, emergency: false });
        return `
          <article class="doc" data-doc="he-${sec.src}" style="margin-bottom:18px">
            <header class="doc-header">
              <div><h2 class="doc-title">${esc(sec.label)}</h2><div class="doc-meta">TBT様式 危害抽出表</div></div>
              <div class="doc-tools no-print">
                ${sIdx === 0 ? `<button class="btn btn-tiny btn-primary" data-template-gen="hazard-extractions" title="原材料・工程から危害候補を生成">✨ 原材料・工程から雛形を生成</button>` : ""}
                <button class="btn btn-tiny" data-list-add="hazardExtractions" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
                ${sIdx === 0 ? `<button class="btn btn-tiny" data-action="print">印刷／PDF</button><button class="btn btn-tiny" data-action="excel">Excel</button>` : ""}
              </div>
            </header>
            <div style="overflow-x:auto">
              <table class="editable-table">
                <thead><tr>
                  <th style="width:90px">${esc(sec.refLabel)}</th>
                  <th>${esc(sec.refNameLabel)}</th>
                  <th style="width:110px">区分</th>
                  <th style="width:50px">No.</th>
                  <th>危害名</th>
                  <th>理由</th>
                  <th style="width:60px">定常</th>
                  <th style="width:60px">非定常</th>
                  <th style="width:60px">緊急</th>
                  <th style="width:40px"></th>
                </tr></thead>
                <tbody>${tbody}</tbody>
              </table>
            </div>
          </article>`;
    }).join("");
}

// ============================================================
//  原則1-C: ハザード評価表
// ============================================================
export function renderHazardEvaluations(state) {
    const list = state.hazardEvaluations || [];
    const tbody = list.length === 0
        ? `<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:18px">未入力</td></tr>`
        : list.map((h, idx) => `
            <tr>
              <td><input type="text" data-list-edit data-list="hazardEvaluations" data-key="hazardName"          data-index="${idx}" value="${esc(h.hazardName || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="hazardEvaluations" data-key="srcId"               data-index="${idx}" value="${esc(h.srcId || "")}"></td>
              <td><input type="text" data-list-edit data-list="hazardEvaluations" data-key="acceptableLimit"     data-index="${idx}" value="${esc(h.acceptableLimit || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="hazardEvaluations" data-key="limitBasis"          data-index="${idx}" value="${esc(h.limitBasis || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="hazardEvaluations" data-key="riskSource"          data-index="${idx}" value="${esc(h.riskSource || "")}" style="width:100%"></td>
              <td>
                <select data-list-edit data-list="hazardEvaluations" data-key="riskFreq" data-index="${idx}">
                  <option value="高" ${h.riskFreq === "高" ? "selected":""}>高</option>
                  <option value="中" ${h.riskFreq === "中" ? "selected":""}>中</option>
                  <option value="低" ${h.riskFreq === "低" ? "selected":""}>低</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="hazardEvaluations" data-key="riskCharacter"       data-index="${idx}" value="${esc(h.riskCharacter || "")}"></td>
              <td><input type="text" data-list-edit data-list="hazardEvaluations" data-key="severity"            data-index="${idx}" value="${esc(h.severity || "")}"></td>
              <td>
                <select data-list-edit data-list="hazardEvaluations" data-key="needsRemoval" data-index="${idx}">
                  <option value="必要" ${h.needsRemoval === "必要" ? "selected":""}>必要</option>
                  <option value="不要" ${h.needsRemoval === "不要" ? "selected":""}>不要</option>
                </select>
              </td>
              <td>
                <select data-list-edit data-list="hazardEvaluations" data-key="needsSpecialControl" data-index="${idx}">
                  <option value="特別な手段で管理が必要" ${h.needsSpecialControl === "特別な手段で管理が必要" ? "selected":""}>特別な手段で管理が必要</option>
                  <option value="O-PRPで管理"           ${h.needsSpecialControl === "O-PRPで管理" ? "selected":""}>O-PRPで管理</option>
                  <option value="PRPで管理"             ${h.needsSpecialControl === "PRPで管理" ? "selected":""}>PRPで管理</option>
                  <option value="PRPで管理可"           ${h.needsSpecialControl === "PRPで管理可" ? "selected":""}>PRPで管理可</option>
                </select>
              </td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="hazardEvaluations" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`).join("");

    // Classification summary
    const classCount = { "特別な手段で管理が必要": 0, "O-PRPで管理": 0, "PRPで管理": 0, "PRPで管理可": 0 };
    list.forEach(h => { const k = h.needsSpecialControl; if (k && classCount[k] !== undefined) classCount[k]++; });
    const highFreq = list.filter(h => h.riskFreq === "高").length;
    const classHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px" class="no-print">
        ${Object.entries(classCount).filter(([,n])=>n>0).map(([label, n]) => {
          const colors = { "特別な手段で管理が必要": ["#fee2e2","#dc2626"], "O-PRPで管理": ["#fff7ed","#d97706"], "PRPで管理": ["#eff6ff","#2563eb"], "PRPで管理可": ["#f0fdf4","#16a34a"] };
          const [bg, fg] = colors[label] || ["var(--c-surface)","var(--c-text)"];
          return `<div style="background:${bg};border:1px solid ${fg};border-radius:8px;padding:8px 14px;text-align:center;min-width:90px">
            <div style="font-size:20px;font-weight:700;color:${fg}">${n}</div>
            <div style="font-size:10px;color:${fg}">${esc(label)}</div>
          </div>`;
        }).join("")}
        ${highFreq > 0 ? `<div style="background:#fff1f2;border:1px solid #ef4444;border-radius:8px;padding:8px 14px;text-align:center;min-width:80px">
          <div style="font-size:20px;font-weight:700;color:#ef4444">${highFreq}</div>
          <div style="font-size:10px;color:#ef4444">頻度: 高</div>
        </div>` : ""}
        <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:8px 14px;text-align:center;min-width:60px">
          <div style="font-size:20px;font-weight:700;color:var(--c-text)">${list.length}</div>
          <div style="font-size:10px;color:var(--c-text-muted)">危害 合計</div>
        </div>
      </div>`;

    const addPayload = JSON.stringify({ id: uid("HV"), hazardName: "", srcId: "", acceptableLimit: "", limitBasis: "", riskSource: "", riskFreq: "中", riskCharacter: "", severity: "", needsRemoval: "必要", needsSpecialControl: "PRPで管理" });

    return `
      <article class="doc" data-doc="hazard-eval">
        <header class="doc-header">
          <div><h2 class="doc-title">ハザード評価表（原則1）</h2><div class="doc-meta">TBT様式 ハザード評価表 ／ 抽出された危害ごとに許容水準・リスク・結論を評価</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="hazard-evaluations" title="危害抽出書の各行に対して評価ベース行を生成">✨ 危害抽出から雛形を生成</button>
            <button class="btn btn-tiny" data-list-add="hazardEvaluations" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${classHtml}
        <p style="font-size:11px;color:#64748b">列構成: 危害名／抽出元ID／最終製品の許容水準／決定理由／発生源／頻度／特性／重大性／除去低減の必要性／管理手段の判定</p>
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead>
              <tr>
                <th rowspan="2" style="width:140px">危害名</th>
                <th rowspan="2" style="width:70px">抽出元ID</th>
                <th colspan="2">最終製品の許容水準</th>
                <th colspan="4">該当危害がもたらすリスク評価</th>
                <th colspan="2">危害評価の結論</th>
                <th rowspan="2" style="width:40px"></th>
              </tr>
              <tr>
                <th>基準値等</th><th>決定理由</th>
                <th>発生源</th><th style="width:60px">頻度</th><th>特性</th><th>重大性</th>
                <th style="width:80px">除去低減</th><th style="width:160px">管理手段</th>
              </tr>
            </thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  原則2: 管理手段選択分類表 (PRP/O-PRP/HACCP判定)
// ============================================================
export function renderControlMeasures(state) {
    const list = state.controlMeasures || [];
    const tbody = list.length === 0
        ? `<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:18px">未入力</td></tr>`
        : list.map((m, idx) => {
            const decisionColor = m.decision === "HACCP" ? "background:#fee2e2;color:#991b1b;font-weight:700" : (m.decision === "O-PRP" ? "background:#fef3c7;color:#92400e;font-weight:700" : "background:#dcfce7;color:#166534;font-weight:700");
            return `
              <tr>
                <td><input type="text" data-list-edit data-list="controlMeasures" data-key="hazardName" data-index="${idx}" value="${esc(m.hazardName || "")}" style="width:100%"></td>
                <td><input type="text" data-list-edit data-list="controlMeasures" data-key="measure"    data-index="${idx}" value="${esc(m.measure || "")}" style="width:100%"></td>
                ${["q1Synergy","q2Effective","q3Monitor","q4Variation","q5Position","q6Severity","q7Special"].map(k =>
                  `<td><input type="text" data-list-edit data-list="controlMeasures" data-key="${k}" data-index="${idx}" value="${esc(m[k] || "")}" style="width:80px"></td>`
                ).join("")}
                <td style="${decisionColor}">
                  <select data-list-edit data-list="controlMeasures" data-key="decision" data-index="${idx}">
                    <option value="PRP"   ${m.decision === "PRP"   ? "selected":""}>PRP</option>
                    <option value="O-PRP" ${m.decision === "O-PRP" ? "selected":""}>O-PRP</option>
                    <option value="HACCP" ${m.decision === "HACCP" ? "selected":""}>HACCP</option>
                  </select>
                </td>
                <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="controlMeasures" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
              </tr>`;
        }).join("");

    const addPayload = JSON.stringify({ id: uid("CM"), hazardId: "", hazardName: "", measure: "", q1Synergy: "なし", q2Effective: "有効", q3Monitor: "可能", q4Variation: "低", q5Position: "中間", q6Severity: "中", q7Special: "通常", decision: "PRP" });

    const prpCount   = list.filter(m => m.decision === "PRP").length;
    const oprpCount  = list.filter(m => m.decision === "O-PRP").length;
    const haccpCount = list.filter(m => m.decision === "HACCP").length;
    const cmSummaryHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;min-width:80px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#1d4ed8">${list.length}</div>
          <div style="font-size:11px;color:#1e40af">管理手段 合計</div>
        </div>
        <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:10px 14px;min-width:80px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#166534">${prpCount}</div>
          <div style="font-size:11px;color:#166534">PRP</div>
        </div>
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px 14px;min-width:80px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#92400e">${oprpCount}</div>
          <div style="font-size:11px;color:#92400e">O-PRP</div>
        </div>
        <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;min-width:80px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#991b1b">${haccpCount}</div>
          <div style="font-size:11px;color:#991b1b">HACCP (CCP)</div>
        </div>
        ${haccpCount > 0 && (state.ccpPlan||[]).length < haccpCount ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;font-size:12px;color:#92400e;align-self:center">⚠ HACCPプランに ${haccpCount - (state.ccpPlan||[]).length} 件未登録のCCPがあります</div>` : ""}
        ${oprpCount > 0 && (state.oprp||[]).length < oprpCount ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;font-size:12px;color:#92400e;align-self:center">⚠ O-PRPプランに ${oprpCount - (state.oprp||[]).length} 件未登録のO-PRPがあります</div>` : ""}
      </div>`;

    return `
      <article class="doc" data-doc="control-measures">
        <header class="doc-header">
          <div><h2 class="doc-title">管理手段の選択分類表（原則2）</h2><div class="doc-meta">TBT様式 ／ ISO22000 7基準で PRP / O-PRP / HACCPプラン を判定</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="control-measures" title="ハザード評価から管理手段ベース行を生成">✨ ハザード評価から雛形を生成</button>
            <button class="btn btn-tiny" data-list-add="controlMeasures" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${cmSummaryHtml}
        <details style="margin:8px 0;font-size:12px;color:#475569"><summary style="cursor:pointer;color:#2563eb">▼ 7評価基準の説明</summary>
          <table style="margin-top:8px;font-size:11px">
            <tr><td>① 相乗効果</td><td>他の管理手段との相乗効果があるか</td></tr>
            <tr><td>② 有効性</td><td>明確にされたハザードに対し有効か</td></tr>
            <tr><td>③ モニタリング</td><td>タイムリーなモニタリングが可能か（リリース前）</td></tr>
            <tr><td>④ 機能不全/工程変動</td><td>機能不全や工程変動が起きやすいか</td></tr>
            <tr><td>⑤ 工程内位置関係</td><td>当該ハザード管理の工程内位置（最終 / 中間 / 前工程）</td></tr>
            <tr><td>⑥ 機能不全時の重大さ</td><td>結果の重大性が高いか / 低いか</td></tr>
            <tr><td>⑦ 特別な手段か</td><td>除去/低減のための特別な手段か</td></tr>
            <tr><td>判定</td><td>①〜⑤で「適切な管理手段」を選び、⑥⑦で <b>HACCP</b> / <b>O-PRP</b> / <b>PRP</b> を分類</td></tr>
          </table>
        </details>
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:140px">管理が必要なハザード</th>
              <th>管理手段</th>
              <th>① 相乗</th><th>② 有効</th><th>③ 監視</th><th>④ 変動</th><th>⑤ 位置</th><th>⑥ 重大</th><th>⑦ 特別</th>
              <th style="width:90px">判定</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  原則3-7: HACCPプラン (TBT 12-19, 8列)
// ============================================================
export function renderCcpPlan(state) {
    const list = state.ccpPlan || [];
    const tbody = list.length === 0
        ? `<tr><td colspan="12" style="text-align:center;color:#94a3b8;padding:18px">CCPが未登録です。「＋ CCPを追加」または管理手段選択分類表で「HACCP」と判定された行から追加してください。</td></tr>`
        : list.map((c, idx) => `
            <tr>
              <td><input type="text" data-list-edit data-list="ccpPlan" data-key="ccpNo"        data-index="${idx}" value="${esc(c.ccpNo || "")}" style="width:60px"></td>
              <td><input type="text" data-list-edit data-list="ccpPlan" data-key="processName"  data-index="${idx}" value="${esc(c.processName || "")}" style="width:100%"></td>
              <td><textarea data-list-edit data-list="ccpPlan" data-key="hazard" data-index="${idx}" rows="2" style="width:100%">${esc(c.hazard || "")}</textarea></td>
              <td><textarea data-list-edit data-list="ccpPlan" data-key="cl"     data-index="${idx}" rows="2" style="width:100%;font-weight:700">${esc(c.cl || "")}</textarea></td>
              <td><input type="text" data-list-edit data-list="ccpPlan" data-key="monWhat"  data-index="${idx}" value="${esc(c.monWhat || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="ccpPlan" data-key="monHow"   data-index="${idx}" value="${esc(c.monHow || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="ccpPlan" data-key="monFreq"  data-index="${idx}" value="${esc(c.monFreq || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="ccpPlan" data-key="monWho"   data-index="${idx}" value="${esc(c.monWho || "")}" style="width:100%"></td>
              <td><textarea data-list-edit data-list="ccpPlan" data-key="correction" data-index="${idx}" rows="2" style="width:100%">${esc(c.correction || "")}</textarea></td>
              <td><input type="text" data-list-edit data-list="ccpPlan" data-key="record" data-index="${idx}" value="${esc(c.record || "")}" style="width:100%"></td>
              <td><textarea data-list-edit data-list="ccpPlan" data-key="verification" data-index="${idx}" rows="2" style="width:100%">${esc(c.verification || "")}</textarea></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="ccpPlan" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`).join("");

    // Completeness check for each CCP
    const ccpFields = [
        { key: "ccpNo",      label: "CCP番号" },
        { key: "processName",label: "工程名" },
        { key: "hazard",     label: "危害要因" },
        { key: "cl",         label: "管理基準(CL)" },
        { key: "monWhat",    label: "監視対象" },
        { key: "monHow",     label: "監視方法" },
        { key: "monFreq",    label: "監視頻度" },
        { key: "monWho",     label: "監視担当" },
        { key: "correction", label: "修正処置" },
        { key: "record",     label: "記録" },
        { key: "verification", label: "検証" },
    ];
    const ccpIncomplete = list.filter(c => ccpFields.some(f => !c[f.key]?.trim()));
    const completenessHtml = list.length === 0 ? "" : ccpIncomplete.length === 0
        ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 14px;font-size:12px;color:#166534;margin-bottom:12px" class="no-print">✅ 全${list.length}件のCCPプランは必須項目がすべて記入されています。</div>`
        : `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:6px;padding:10px 14px;font-size:12px;color:#92400e;margin-bottom:12px" class="no-print">
            <strong>⚠ ${ccpIncomplete.length}件のCCPに未記入項目があります</strong>
            <ul style="margin:6px 0 0 16px;padding:0">
              ${ccpIncomplete.map(c => {
                const missing = ccpFields.filter(f => !c[f.key]?.trim()).map(f => f.label).join("・");
                return `<li>${esc(c.ccpNo || "?")}: ${missing} が未入力</li>`;
              }).join("")}
            </ul>
          </div>`;

    const addPayload = JSON.stringify({ id: uid("CCP"), ccpNo: "CCP" + (list.length + 1), processName: "", hazard: "", cl: "", monWhat: "", monHow: "", monFreq: "", monWho: "", correction: "", record: "", verification: "" });

    return `
      <article class="doc" data-doc="ccp-plan">
        <header class="doc-header">
          <div><h2 class="doc-title">HACCPプラン（原則3〜7）</h2><div class="doc-meta">TBT様式 12-19 ／ 8列構成: CCP × CL × 監視4項目 × 修正処置 × 記録 × 検証</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="ccp-plan" title="管理手段選択分類表で「HACCP」と判定された項目からCCPプランを生成">✨ 管理手段から雛形を生成</button>
            <button class="btn btn-tiny" data-list-add="ccpPlan" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ CCPを追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${completenessHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead>
              <tr>
                <th rowspan="2" style="width:60px">(1)<br>CCP</th>
                <th rowspan="2" style="width:140px">(2) 工程</th>
                <th rowspan="2" style="width:200px">(3) 重要な食品安全危害</th>
                <th rowspan="2" style="width:200px">(4) 各防止策の許容限界 (CL)</th>
                <th colspan="4">(5) 監　　視</th>
                <th rowspan="2" style="width:200px">(6) 修正処置</th>
                <th rowspan="2" style="width:140px">(7) 記録</th>
                <th rowspan="2" style="width:200px">(8) 検証</th>
                <th rowspan="2" style="width:40px"></th>
              </tr>
              <tr>
                <th>① 何を</th><th>② どのように</th><th>③ 頻度</th><th>④ 誰が</th>
              </tr>
            </thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  原則6: 検証記録
// ============================================================
export function renderVerifications(state) {
    const list = state.verifications || [];

    // Live compliance summary from monitoring logs (last 30 days)
    const cutoff30 = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })();
    const r30ccp   = (state.ccpMonitoringLog  || []).filter(r => r.date >= cutoff30);
    const r30temp  = (state.temperatureLog     || []).filter(r => r.date >= cutoff30);
    const r30recv  = (state.receivingLog       || []).filter(r => r.date >= cutoff30);
    const r30san   = (state.sanitationLog      || []).filter(r => r.date >= cutoff30);
    const r30health= (state.healthLog          || []).filter(r => r.date >= cutoff30);
    const r30water = (state.waterLog           || []).filter(r => r.date >= cutoff30);
    const r30allerg= (state.allergenLog        || []).filter(r => r.date >= cutoff30);
    const r30calib = (state.calibrationLog     || []).filter(r => r.date >= cutoff30);

    const rate = (list, failFn) => list.length === 0 ? null : Math.round((list.length - list.filter(failFn).length) / list.length * 100);
    const isFail = key => r => r[key] === false || r[key] === "false";
    const SANIT_KEYS_V = ["facility", "machines", "waste", "personnel", "pest"];

    const kpiData = [
        { label: "CCP モニタリング",   list: r30ccp,    rate: rate(r30ccp,    isFail("passed")), route: "#/p/ccp-monitoring-log" },
        { label: "温度管理",           list: r30temp,   rate: rate(r30temp,   isFail("passed")), route: "#/p/temperature-log" },
        { label: "原材料受入",         list: r30recv,   rate: rate(r30recv,   isFail("passed")), route: "#/p/receiving-log" },
        { label: "衛生点検",           list: r30san,    rate: rate(r30san,    r => SANIT_KEYS_V.some(k => r[k] === false || r[k] === "false")), route: "#/p/sanitation-log" },
        { label: "従事者健康",         list: r30health, rate: rate(r30health, r => r.status && r.status !== "良好"), route: "#/p/health-log" },
        { label: "使用水",             list: r30water,  rate: rate(r30water,  isFail("passed")), route: "#/p/water-log" },
        { label: "アレルゲン確認",     list: r30allerg, rate: rate(r30allerg, isFail("passed")), route: "#/p/allergen-log" },
        { label: "機器校正 (90日)",    list: r30calib,  rate: rate(r30calib,  r => r.result === "不合格" || r.result === "要調整"), route: "#/p/calibration-log" },
    ];
    const kpiCards = kpiData.map(({ label, list, rate: r, route }) => {
        if (r === null) return `<div class="verify-kpi verify-kpi-empty" onclick="location.hash='${route}'" style="cursor:pointer"><div class="verify-kpi-rate">—</div><div class="verify-kpi-label">${esc(label)}</div><div class="verify-kpi-sub">記録なし</div></div>`;
        const color = r >= 98 ? "var(--c-success)" : r >= 90 ? "var(--c-warn)" : "var(--c-danger)";
        return `<div class="verify-kpi" onclick="location.hash='${route}'" style="cursor:pointer;border-color:${r < 90 ? "var(--c-danger)" : "var(--c-border)"}"><div class="verify-kpi-rate" style="color:${color}">${r}%</div><div class="verify-kpi-label">${esc(label)}</div><div class="verify-kpi-sub">${list.length}件/30日</div></div>`;
    }).join("");

    const verifyNote = kpiData.every(k => k.rate === null)
        ? `<div style="color:var(--c-text-muted);font-size:13px">まだ運用記録がありません。各記録ページでデータを入力すると、ここに適合率が表示されます。</div>`
        : kpiData.some(k => k.rate !== null && k.rate < 90)
        ? `<div style="color:var(--c-danger);font-weight:600;font-size:13px">⚠ 適合率90%未満の記録があります。検証・是正処置が必要です。</div>`
        : `<div style="color:var(--c-success);font-weight:600;font-size:13px">✅ 直近30日の全記録が90%以上の適合率を維持しています。</div>`;
    const tbody = list.length === 0
        ? `<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:18px">未入力</td></tr>`
        : list.map((v, idx) => `
            <tr>
              <td><input type="text" data-list-edit data-list="verifications" data-key="target"      data-index="${idx}" value="${esc(v.target || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="verifications" data-key="method"      data-index="${idx}" value="${esc(v.method || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="verifications" data-key="frequency"   data-index="${idx}" value="${esc(v.frequency || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="verifications" data-key="responsible" data-index="${idx}" value="${esc(v.responsible || "")}" style="width:100%"></td>
              <td><input type="date" data-list-edit data-list="verifications" data-key="lastDate"    data-index="${idx}" value="${esc(v.lastDate || "")}"></td>
              <td>
                <select data-list-edit data-list="verifications" data-key="result" data-index="${idx}">
                  <option value="合格" ${v.result === "合格" ? "selected" : ""}>合格</option>
                  <option value="適合" ${v.result === "適合" ? "selected" : ""}>適合</option>
                  <option value="陰性" ${v.result === "陰性" ? "selected" : ""}>陰性</option>
                  <option value="不適合" ${v.result === "不適合" ? "selected" : ""}>不適合</option>
                  <option value="未実施" ${v.result === "未実施" ? "selected" : ""}>未実施</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="verifications" data-key="evidence" data-index="${idx}" value="${esc(v.evidence || "")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="verifications" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`).join("");

    const addPayload = JSON.stringify({ id: uid("V"), target: "", method: "", frequency: "", responsible: "", lastDate: "", result: "合格", evidence: "" });

    return `
      <article class="doc" data-doc="verifications">
        <header class="doc-header">
          <div><h2 class="doc-title">検証記録（原則6）</h2><div class="doc-meta">TBT様式 12-23/12-25 ／ HACCPプラン全体・各CCPの妥当性確認・検証</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="verifications" title="CCPプランから検証ベース行を生成">✨ CCPプランから雛形を生成</button>
            <button class="btn btn-tiny" data-list-add="verifications" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 検証項目を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>

        <div class="section-block" style="margin-bottom:20px">
          <div style="font-size:12px;font-weight:700;color:var(--c-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">
            直近30日 — 運用記録 適合率 <span style="font-weight:400;text-transform:none;letter-spacing:0">(クリックで各記録へ)</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">${kpiCards}</div>
          ${verifyNote}
        </div>

        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th>検証対象</th><th>検証方法</th><th>頻度</th><th>責任者</th>
              <th style="width:130px">最終実施日</th><th style="width:90px">結果</th>
              <th>エビデンス</th><th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  不適合製品処置書 + 不適合製品管理表
// ============================================================
const NC_CONTENT_KEYS = ["包装不良","規格差異","期限切れ","表示違反","製品不良","異臭","変色","異味","異物混入","品温不良","加工汚染品","CCP外れ不良品","規格外品","その他"];
const DISP_TYPES = [
    { type: "A", label: "A 返品・廃棄", subOptions: [
        { value: "1", label: "受入時、納入業者が引き取り返品処置" },
        { value: "2", label: "開梱・選別加工時、一時保管し納入業者に返品" },
        { value: "3", label: "産業廃棄物として処理" }] },
    { type: "B", label: "B 再利用（手直し・修理）", subOptions: [
        { value: "1", label: "確認・清潔にして包装を補修、注意して使用" },
        { value: "2", label: "調整・検査確認後 選別・早期出荷" },
        { value: "3", label: "調整・検査確認・後工程で管理" },
        { value: "4", label: "調整・除去・検査、確認後早期使用" },
        { value: "5", label: "調整・選別・再包装・検査確認" }] },
    { type: "C", label: "C 用途変更（格付変更）", subOptions: [
        { value: "1", label: "サンプル・別注規格適合品として使用" },
        { value: "2", label: "別注規格適合品として使用" },
        { value: "3", label: "選別して早期使用・格付変更" },
        { value: "4", label: "選別・検査・徳用品として早期使用" },
        { value: "5", label: "調整・選別して原材料として使用" }] },
    { type: "D", label: "D 特別採用", subOptions: [{ value: "1", label: "処置決定責任者の判断" }] },
];

export function renderNonconformanceActions(state) {
    const list = state.nonconformanceActions || [];

    const cards = list.length === 0
        ? `<div class="empty">不適合処置書はまだ登録されていません。<br><button class="btn btn-primary" style="margin-top:12px" data-list-add="nonconformanceActions" data-template='${JSON.stringify(emptyNonconformance()).replace(/'/g, "&#39;")}'>＋ 新規処置書を作成</button></div>`
        : list.map((nc, idx) => {
            const checks = NC_CONTENT_KEYS.map(k => `
                <label style="display:inline-flex;align-items:center;gap:4px;padding:3px 6px;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;${nc.contentChecks?.[k] ? "background:#fee2e2;border-color:#fca5a5" : ""}">
                  <input type="checkbox" data-list-edit data-list="nonconformanceActions" data-key="contentChecks.${k}" data-index="${idx}" ${nc.contentChecks?.[k] ? "checked" : ""}>${esc(k)}
                </label>`).join("");
            const dispOptions = DISP_TYPES.map(t => `
                <fieldset style="border:1px solid #e2e8f0;border-radius:6px;padding:8px;margin-bottom:6px">
                  <legend style="font-size:12px;font-weight:600;padding:0 6px;color:${nc.disposition?.type === t.type ? "#dc2626" : "#64748b"}">
                    <label style="cursor:pointer"><input type="radio" name="nc-disp-${idx}" data-list-edit data-list="nonconformanceActions" data-key="disposition.type" data-index="${idx}" value="${t.type}" ${nc.disposition?.type === t.type ? "checked" : ""}> ${esc(t.label)}</label>
                  </legend>
                  <div style="display:flex;flex-wrap:wrap;gap:4px">
                    ${t.subOptions.map(o => `
                      <label style="font-size:11px;padding:2px 6px;border:1px solid #e2e8f0;border-radius:4px;${nc.disposition?.type === t.type && nc.disposition?.subOption === o.value ? "background:#fee2e2;border-color:#fca5a5" : ""}">
                        <input type="radio" name="nc-disp-sub-${idx}-${t.type}" data-nc-sub data-disp-type="${t.type}" data-index="${idx}" value="${o.value}" ${nc.disposition?.type === t.type && nc.disposition?.subOption === o.value ? "checked" : ""}>
                        ${t.type}-${esc(o.value)}: ${esc(o.label)}
                      </label>`).join("")}
                  </div>
                </fieldset>`).join("");

            return `
              <article class="doc" style="margin-bottom:18px" data-doc="nc-${idx}">
                <header class="doc-header">
                  <div>
                    <h2 class="doc-title" style="font-size:16px">不適合製品処置書 (NO ${esc(nc.identNo || `NC-${idx+1}`)})</h2>
                    <div class="doc-meta">TBT様式 4-2 ／ 製品: ${esc(nc.productName || "—")} ／ ロット: ${esc(nc.lot || "—")}</div>
                  </div>
                  <div class="doc-tools no-print">
                    <button class="icon-btn danger" data-list-action="remove" data-list="nonconformanceActions" data-index="${idx}" title="削除" aria-label="削除">✕</button>
                  </div>
                </header>
                <div class="form-grid">
                  <div class="form-field"><label>識別NO</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="identNo" data-index="${idx}" value="${esc(nc.identNo || "")}"></div>
                  <div class="form-field"><label>製品名／原材料名</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="productName" data-index="${idx}" value="${esc(nc.productName || "")}"></div>
                  <div class="form-field"><label>ロットNo</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="lot" data-index="${idx}" value="${esc(nc.lot || "")}"></div>
                  <div class="form-field"><label>発生日時</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="occurredAt" data-index="${idx}" value="${esc(nc.occurredAt || "")}" placeholder="YYYY-MM-DD HH:MM"></div>
                  <div class="form-field"><label>受入日／納品日</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="receivedAt" data-index="${idx}" value="${esc(nc.receivedAt || "")}"></div>
                  <div class="form-field"><label>購買・得意先</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="customer" data-index="${idx}" value="${esc(nc.customer || "")}"></div>
                  <div class="form-field"><label>発生部署</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="department" data-index="${idx}" value="${esc(nc.department || "")}"></div>
                </div>
                <h4>不適合内容（該当項目をチェック）</h4>
                <div style="display:flex;flex-wrap:wrap;gap:4px">${checks}</div>
                <div class="form-field" style="margin-top:8px"><label>その他の内容</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="contentOther" data-index="${idx}" value="${esc(nc.contentOther || "")}"></div>
                <h4>処置方法（A〜D から選択）</h4>
                ${dispOptions}
                <div class="form-field"><label>処置の備考</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="disposition.note" data-index="${idx}" value="${esc(nc.disposition?.note || "")}"></div>
                <div class="form-grid" style="margin-top:8px">
                  <div class="form-field"><label>処置日</label><input type="date" data-list-edit data-list="nonconformanceActions" data-key="processedAt" data-index="${idx}" value="${esc(nc.processedAt || "")}"></div>
                  <div class="form-field"><label>処置量</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="processedQty" data-index="${idx}" value="${esc(nc.processedQty || "")}" placeholder="例: 50kg / 30ケース"></div>
                  <div class="form-field"><label>処理日</label><input type="date" data-list-edit data-list="nonconformanceActions" data-key="treatedAt" data-index="${idx}" value="${esc(nc.treatedAt || "")}"></div>
                  <div class="form-field"><label>処理量</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="treatedQty" data-index="${idx}" value="${esc(nc.treatedQty || "")}"></div>
                  <div class="form-field"><label>検査者</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="inspector" data-index="${idx}" value="${esc(nc.inspector || "")}"></div>
                  <div class="form-field span-2"><label>備考</label><input type="text" data-list-edit data-list="nonconformanceActions" data-key="note" data-index="${idx}" value="${esc(nc.note || "")}"></div>
                </div>
              </article>`;
        }).join("");

    const openNcList   = list.filter(nc => nc.disposition?.type !== "A" || !nc.processedAt);
    const closedNcList = list.filter(nc => nc.processedAt);
    const ncByType     = {};
    list.forEach(nc => { const t = nc.disposition?.type || "未分類"; ncByType[t] = (ncByType[t] || 0) + 1; });
    const ncSummaryHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px" class="no-print">
        <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;min-width:100px">
          <div style="font-size:11px;color:#1e40af;font-weight:600">合計件数</div>
          <div style="font-size:22px;font-weight:700;color:#1d4ed8">${list.length}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
        </div>
        <div style="background:${openNcList.length > 0 ? "#fff7ed" : "#f0fdf4"};border:1px solid ${openNcList.length > 0 ? "#f59e0b" : "#86efac"};border-radius:8px;padding:10px 14px;min-width:100px">
          <div style="font-size:11px;color:${openNcList.length > 0 ? "#92400e" : "#166534"};font-weight:600">${openNcList.length > 0 ? "⚠ 未完了" : "処置未完了"}</div>
          <div style="font-size:22px;font-weight:700;color:${openNcList.length > 0 ? "#d97706" : "#16a34a"}">${openNcList.length}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
        </div>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;min-width:100px">
          <div style="font-size:11px;color:#166534;font-weight:600">処置完了</div>
          <div style="font-size:22px;font-weight:700;color:#16a34a">${closedNcList.length}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
        </div>
        ${Object.entries(ncByType).map(([t, n]) => {
          const labels = { A: "A:廃棄", B: "B:再加工", C: "C:特別採用", D: "D:出荷可" };
          return `<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 14px;min-width:80px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-text)">${n}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">${labels[t] || t}</div>
          </div>`;
        }).join("")}
      </div>`;

    return `
      <header class="doc-header" style="margin-bottom:8px">
        <div><h2 class="doc-title">不適合製品処置書（TBT様式 4-2）</h2><div class="doc-meta">${list.length} 件 ／ 異常発生時の処置記録</div></div>
        <div class="doc-tools no-print">
          <button class="btn btn-tiny" data-list-add="nonconformanceActions" data-template='${JSON.stringify(emptyNonconformance()).replace(/'/g, "&#39;")}'>＋ 新規処置書を作成</button>
          <button class="btn btn-tiny" data-action="excel">Excel一括出力</button>
        </div>
      </header>
      ${ncSummaryHtml}
      ${cards}`;
}

function emptyNonconformance() {
    const checks = {};
    NC_CONTENT_KEYS.forEach(k => checks[k] = false);
    return {
        id: uid("NC"), identNo: "", productName: "", lot: "", occurredAt: "", receivedAt: "",
        customer: "", department: "", contentChecks: checks, contentOther: "",
        disposition: { type: "A", subOption: "1", note: "" },
        processedAt: "", processedQty: "", treatedAt: "", treatedQty: "", inspector: "", note: "",
    };
}

// 不適合管理表 (4-3 register)
export function renderNonconformanceLog(state) {
    const list = state.nonconformanceLog || [];
    const tbody = list.length === 0
        ? `<tr><td colspan="12" style="text-align:center;color:#94a3b8;padding:18px">未入力</td></tr>`
        : list.map((r, idx) => `
            <tr>
              <td style="text-align:center">${esc(r.no || idx + 1)}</td>
              <td><input type="text" data-list-edit data-list="nonconformanceLog" data-key="occurredAt"  data-index="${idx}" value="${esc(r.occurredAt || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="nonconformanceLog" data-key="productName" data-index="${idx}" value="${esc(r.productName || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="nonconformanceLog" data-key="lot"         data-index="${idx}" value="${esc(r.lot || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="nonconformanceLog" data-key="category"    data-index="${idx}" value="${esc(r.category || "")}" style="width:100%"></td>
              <td><input type="number" data-list-edit data-list="nonconformanceLog" data-key="dispositionCount.廃棄"   data-index="${idx}" value="${esc(r.dispositionCount?.廃棄 || 0)}" style="width:60px"></td>
              <td><input type="number" data-list-edit data-list="nonconformanceLog" data-key="dispositionCount.再利用" data-index="${idx}" value="${esc(r.dispositionCount?.再利用 || 0)}" style="width:60px"></td>
              <td><input type="number" data-list-edit data-list="nonconformanceLog" data-key="dispositionCount.用途変更" data-index="${idx}" value="${esc(r.dispositionCount?.用途変更 || 0)}" style="width:60px"></td>
              <td><input type="number" data-list-edit data-list="nonconformanceLog" data-key="dispositionCount.特別採用" data-index="${idx}" value="${esc(r.dispositionCount?.特別採用 || 0)}" style="width:60px"></td>
              <td><input type="text" data-list-edit data-list="nonconformanceLog" data-key="reportedBy" data-index="${idx}" value="${esc(r.reportedBy || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="nonconformanceLog" data-key="note"       data-index="${idx}" value="${esc(r.note || "")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="nonconformanceLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`).join("");

    const nextNo = (list[list.length - 1]?.no || list.length) + 1;
    const addPayload = JSON.stringify({ no: nextNo, occurredAt: "", productName: "", lot: "", category: "", dispositionCount: { 廃棄: 0, 再利用: 0, 用途変更: 0, 特別採用: 0 }, reportedBy: "", note: "" });

    // Nonconformance log analytics: disposition totals
    const dispTypes = ["廃棄", "再利用", "用途変更", "特別採用"];
    const dispTotals = Object.fromEntries(dispTypes.map(k => [k, list.reduce((s, r) => s + (parseInt(r.dispositionCount?.[k]) || 0), 0)]));
    const totalDisp = Object.values(dispTotals).reduce((a, b) => a + b, 0);
    const ncPanelHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;min-width:100px">
          <div style="font-size:11px;color:#1e40af;font-weight:600">不適合件数</div>
          <div style="font-size:22px;font-weight:700;color:#1d4ed8">${list.length}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
          <div style="font-size:11px;color:#475569">処置数: ${totalDisp}点</div>
        </div>
        ${dispTypes.map(k => {
          const val = dispTotals[k];
          const color = k === "廃棄" ? "#dc2626" : k === "特別採用" ? "#d97706" : "#1d4ed8";
          const bg = k === "廃棄" ? "#fff1f2" : k === "特別採用" ? "#fff7ed" : "#eff6ff";
          const border = k === "廃棄" ? "#fca5a5" : k === "特別採用" ? "#f59e0b" : "#93c5fd";
          return `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:10px 14px;min-width:90px">
            <div style="font-size:11px;color:${color};font-weight:600">${k}</div>
            <div style="font-size:22px;font-weight:700;color:${color}">${val}<span style="font-size:12px;font-weight:400;margin-left:2px">点</span></div>
          </div>`;
        }).join("")}
      </div>`;

    return `
      <article class="doc" data-doc="nc-log">
        <header class="doc-header">
          <div><h2 class="doc-title">不適合製品管理表（TBT様式 4-3）</h2><div class="doc-meta">不適合の発生・処置を一覧管理（年間記録）</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="nonconformance-log" title="不適合処置書(4-2)の記録から集計行を自動生成">✨ 処置書から生成</button>
            <button class="btn btn-tiny" data-list-add="nonconformanceLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 手動追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${ncPanelHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:40px">No.</th>
              <th>発生日時</th>
              <th>製品名・規格</th>
              <th>ロット</th>
              <th>不適合カテゴリ</th>
              <th style="width:60px">廃棄</th>
              <th style="width:60px">再利用</th>
              <th style="width:70px">用途変更</th>
              <th style="width:70px">特別採用</th>
              <th>報告者</th>
              <th>備考</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  是正処置書 (5-1)
// ============================================================
const CA_SOURCES = ["顧客苦情", "監査結果", "監視測定結果", "不適合", "MR", "不具合", "CCP", "データ分析", "その他"];

export function renderCorrectiveActions(state) {
    const list = state.correctiveActions || [];
    const cards = list.length === 0
        ? `<div class="empty">是正処置書はまだ登録されていません。<br><button class="btn btn-primary" style="margin-top:12px" data-list-add="correctiveActions" data-template='${JSON.stringify(emptyCorrective()).replace(/'/g, "&#39;")}'>＋ 新規是正処置書を作成</button></div>`
        : list.map((ca, idx) => {
            const sourceOpts = CA_SOURCES.map(s => `<option value="${esc(s)}" ${ca.source === s ? "selected" : ""}>${esc(s)}</option>`).join("");
            const statusColor = ca.status === "完了" ? "#16a34a" : (ca.status === "実施中" ? "#d97706" : "#64748b");
            return `
              <article class="doc" style="margin-bottom:18px" data-doc="ca-${idx}">
                <header class="doc-header">
                  <div>
                    <h2 class="doc-title" style="font-size:16px">是正処置書 (${esc(ca.identNo || `CA-${idx+1}`)}) <span style="font-size:12px;color:${statusColor};margin-left:8px">[${esc(ca.status || "未着手")}]</span></h2>
                    <div class="doc-meta">TBT様式 5-1 ／ 関連部門: ${esc(ca.relatedDept || "—")} ／ 期限: ${esc(ca.dueDate || "—")}</div>
                  </div>
                  <div class="doc-tools no-print">
                    <button class="icon-btn danger" data-list-action="remove" data-list="correctiveActions" data-index="${idx}" title="削除" aria-label="削除">✕</button>
                  </div>
                </header>
                <div class="form-grid">
                  <div class="form-field"><label>識別番号</label><input type="text" data-list-edit data-list="correctiveActions" data-key="identNo" data-index="${idx}" value="${esc(ca.identNo || "")}"></div>
                  <div class="form-field"><label>関連部門名</label><input type="text" data-list-edit data-list="correctiveActions" data-key="relatedDept" data-index="${idx}" value="${esc(ca.relatedDept || "")}"></div>
                  <div class="form-field"><label>処置案回答期限</label><input type="date" data-list-edit data-list="correctiveActions" data-key="dueDate" data-index="${idx}" value="${esc(ca.dueDate || "")}"></div>
                  <div class="form-field"><label>情報源</label><select data-list-edit data-list="correctiveActions" data-key="source" data-index="${idx}">${sourceOpts}</select></div>
                  <div class="form-field"><label>状態</label>
                    <select data-list-edit data-list="correctiveActions" data-key="status" data-index="${idx}">
                      <option value="未着手" ${ca.status === "未着手" ? "selected" : ""}>未着手</option>
                      <option value="実施中" ${ca.status === "実施中" ? "selected" : ""}>実施中</option>
                      <option value="完了"   ${ca.status === "完了"   ? "selected" : ""}>完了</option>
                    </select>
                  </div>
                </div>
                <h4>1. 改善指摘（不適合）事項内容</h4>
                <textarea data-list-edit data-list="correctiveActions" data-key="content" data-index="${idx}" style="width:100%;min-height:60px">${esc(ca.content || "")}</textarea>
                <h4>2. 原因</h4>
                <textarea data-list-edit data-list="correctiveActions" data-key="rootCause" data-index="${idx}" style="width:100%;min-height:60px">${esc(ca.rootCause || "")}</textarea>
                <h4>3. 類似改善指摘事項の調査</h4>
                <textarea data-list-edit data-list="correctiveActions" data-key="similarInvestigation" data-index="${idx}" style="width:100%;min-height:50px">${esc(ca.similarInvestigation || "")}</textarea>
                <div class="form-field"><label>調査結果</label><textarea data-list-edit data-list="correctiveActions" data-key="investigationResult" data-index="${idx}" style="width:100%;min-height:40px">${esc(ca.investigationResult || "")}</textarea></div>
                <h4>4. 是正（再発防止）処置 計画</h4>
                <textarea data-list-edit data-list="correctiveActions" data-key="correctionPlan" data-index="${idx}" style="width:100%;min-height:80px">${esc(ca.correctionPlan || "")}</textarea>
                <div class="form-grid" style="margin-top:8px">
                  <div class="form-field"><label>必要性</label>
                    <select data-list-edit data-list="correctiveActions" data-key="planNeeded" data-index="${idx}">
                      <option value="要" ${ca.planNeeded === "要" ? "selected" : ""}>要</option>
                      <option value="否" ${ca.planNeeded === "否" ? "selected" : ""}>否</option>
                    </select>
                  </div>
                  <div class="form-field"><label>計画承認者</label><input type="text" data-list-edit data-list="correctiveActions" data-key="planApprovedBy" data-index="${idx}" value="${esc(ca.planApprovedBy || "")}"></div>
                  <div class="form-field"><label>計画承認日</label><input type="date" data-list-edit data-list="correctiveActions" data-key="planApprovedAt" data-index="${idx}" value="${esc(ca.planApprovedAt || "")}"></div>
                </div>
                <h4>5. 是正処置 実施</h4>
                <textarea data-list-edit data-list="correctiveActions" data-key="implementation" data-index="${idx}" style="width:100%;min-height:60px">${esc(ca.implementation || "")}</textarea>
                <div class="form-field" style="margin-top:8px"><label>是正確認日</label><input type="date" data-list-edit data-list="correctiveActions" data-key="confirmedAt" data-index="${idx}" value="${esc(ca.confirmedAt || "")}"></div>
                <h4>6. 効果確認方法</h4>
                <textarea data-list-edit data-list="correctiveActions" data-key="effectMethod" data-index="${idx}" style="width:100%;min-height:50px">${esc(ca.effectMethod || "")}</textarea>
                <div class="form-grid" style="margin-top:8px">
                  <div class="form-field"><label>最終確認日</label><input type="date" data-list-edit data-list="correctiveActions" data-key="finalConfirmedAt" data-index="${idx}" value="${esc(ca.finalConfirmedAt || "")}"></div>
                  <div class="form-field"><label>ISO管理責任者</label><input type="text" data-list-edit data-list="correctiveActions" data-key="isoManager" data-index="${idx}" value="${esc(ca.isoManager || "")}"></div>
                  <div class="form-field"><label>最終確認 責任者</label><input type="text" data-list-edit data-list="correctiveActions" data-key="finalResponsible" data-index="${idx}" value="${esc(ca.finalResponsible || "")}"></div>
                </div>
              </article>`;
        }).join("");

    // Summary counts
    const today2 = new Date().toISOString().slice(0, 10);
    const openList     = list.filter(ca => ca.status !== "完了" && ca.status !== "有効性確認済み");
    const overdueList  = openList.filter(ca => ca.dueDate && ca.dueDate < today2);
    const doneList     = list.filter(ca => ca.status === "完了" || ca.status === "有効性確認済み");
    const summaryHtml  = list.length > 0 ? `
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
        ${[
            { label: "合計",     val: list.length,        color: "var(--c-text)" },
            { label: "対応中",   val: openList.length,    color: openList.length ? "var(--c-warn)" : "var(--c-text-muted)" },
            { label: "期限超過", val: overdueList.length, color: overdueList.length ? "var(--c-danger)" : "var(--c-text-muted)" },
            { label: "完了",     val: doneList.length,    color: "var(--c-success)" },
        ].map(({ label, val, color }) => `
          <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius);padding:10px 16px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:${color}">${val}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">${label}</div>
          </div>`).join("")}
        ${overdueList.length > 0
            ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:var(--radius);padding:10px 14px;font-size:12px;color:var(--c-danger);align-self:center"><strong>⚠ 期限超過:</strong> ${overdueList.map(ca => esc(ca.identNo || "—") + " (期限: " + esc(ca.dueDate || "—") + ")").join("、")}</div>`
            : ""}
      </div>` : "";

    return `
      <header class="doc-header" style="margin-bottom:8px">
        <div><h2 class="doc-title">是正処置書（TBT様式 5-1）</h2><div class="doc-meta">${list.length} 件 ／ 不適合に対する原因究明と再発防止</div></div>
        <div class="doc-tools no-print">
          <button class="btn btn-tiny btn-primary" data-template-gen="corrective-actions">✨ 不適合・クレームから生成</button>
          <button class="btn btn-tiny" data-list-add="correctiveActions" data-template='${JSON.stringify(emptyCorrective()).replace(/'/g, "&#39;")}'>＋ 新規是正処置書を作成</button>
          <button class="btn btn-tiny" data-action="excel">Excel一括出力</button>
        </div>
      </header>
      ${summaryHtml}
      ${cards}`;
}

function emptyCorrective() {
    return {
        id: uid("CA"), identNo: "", relatedDept: "", dueDate: "", source: "不適合", status: "未着手",
        content: "", rootCause: "", similarInvestigation: "", investigationResult: "",
        correctionPlan: "", planNeeded: "要", planApprovedBy: "", planApprovedAt: "",
        implementation: "", confirmedAt: "", effectMethod: "",
        finalConfirmedAt: "", isoManager: "", finalResponsible: "",
    };
}

// ============================================================
//  衛生点検・清掃消毒記録
// ============================================================
const SANITATION_ITEMS = [
    { key: "facility",   label: "施設・設備 清掃" },
    { key: "machines",   label: "機械・器具 洗浄消毒" },
    { key: "waste",      label: "廃棄物処理" },
    { key: "personnel",  label: "従事者衛生確認" },
    { key: "pest",       label: "防虫防鼠 点検" },
];

export function renderSanitationLog(state) {
    const list = state.sanitationLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const itemHeaders = SANITATION_ITEMS.map(s => `<th style="width:80px">${esc(s.label)}</th>`).join("");
    const tbody = list.length === 0
        ? `<tr><td colspan="${SANITATION_ITEMS.length + 6}" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「✨ 本日の点検表を追加」を使用してください。</td></tr>`
        : list.map((r, idx) => {
            const allOk = SANITATION_ITEMS.every(s => r[s.key] === true || r[s.key] === "true");
            const anyNg = SANITATION_ITEMS.some(s => r[s.key] === false || r[s.key] === "false");
            const rowStyle = anyNg ? "background:#fef2f2" : (allOk ? "background:#f0fdf4" : "");
            const checks = SANITATION_ITEMS.map(s => {
                const checked = r[s.key] === true || r[s.key] === "true";
                return `<td style="text-align:center"><input type="checkbox" data-list-edit data-list="sanitationLog" data-key="${s.key}" data-index="${idx}" ${checked ? "checked" : ""}></td>`;
            }).join("");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="sanitationLog" data-key="date"       data-index="${idx}" value="${esc(r.date || "")}"></td>
              <td>
                <select data-list-edit data-list="sanitationLog" data-key="shift" data-index="${idx}" style="width:60px">
                  <option value="朝" ${(r.shift||"朝")==="朝"?"selected":""}>朝</option>
                  <option value="昼" ${r.shift==="昼"?"selected":""}>昼</option>
                  <option value="夕" ${r.shift==="夕"?"selected":""}>夕</option>
                  <option value="終業" ${r.shift==="終業"?"selected":""}>終業</option>
                </select>
              </td>
              ${checks}
              <td><input type="text" data-list-edit data-list="sanitationLog" data-key="chlorine"   data-index="${idx}" value="${esc(r.chlorine || "")}" placeholder="mg/L" style="width:55px"></td>
              <td><input type="text" data-list-edit data-list="sanitationLog" data-key="inspector"  data-index="${idx}" value="${esc(r.inspector || "")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="sanitationLog" data-key="verifiedBy" data-index="${idx}" value="${esc(r.verifiedBy || "")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="sanitationLog" data-key="note"       data-index="${idx}" value="${esc(r.note || "")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="sanitationLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    const addPayload = JSON.stringify({ date: today, shift: "朝", facility: "", machines: "", waste: "", personnel: "", pest: "", chlorine: "", inspector: "", verifiedBy: "", note: "" });

    // Sanitation analytics: per-item NG counts
    const sanItemStats = SANITATION_ITEMS.map(s => {
        const total   = list.filter(r => r[s.key] === true || r[s.key] === "true" || r[s.key] === false || r[s.key] === "false").length;
        const ngCount = list.filter(r => r[s.key] === false || r[s.key] === "false").length;
        return { label: s.label, total, ngCount, rate: total > 0 ? Math.round((total - ngCount) / total * 100) : null };
    });
    const totalRecords = list.length;
    const ngRecords    = list.filter(r => SANITATION_ITEMS.some(s => r[s.key] === false || r[s.key] === "false")).length;
    const sanitationPanelHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;min-width:120px">
          <div style="font-size:11px;color:#1e40af;font-weight:600">総記録数</div>
          <div style="font-size:22px;font-weight:700;color:#1d4ed8">${totalRecords}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
          <div style="font-size:11px;color:#475569">NG含む: ${ngRecords}件</div>
        </div>
        ${sanItemStats.map(s => {
          const color = s.ngCount > 0 ? "#dc2626" : "#16a34a";
          const bg    = s.ngCount > 0 ? "#fff1f2" : "#f0fdf4";
          const border= s.ngCount > 0 ? "#fca5a5" : "#86efac";
          return `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:10px 14px;min-width:110px">
            <div style="font-size:11px;color:${color};font-weight:600">${esc(s.label)}</div>
            <div style="font-size:20px;font-weight:700;color:${color}">${s.rate !== null ? s.rate + "%" : "—"}</div>
            <div style="font-size:11px;color:#475569">NG: ${s.ngCount}件</div>
          </div>`;
        }).join("")}
      </div>`;

    return `
      <article class="doc" data-doc="sanitation-log">
        <header class="doc-header">
          <div><h2 class="doc-title">衛生点検・清掃消毒記録</h2><div class="doc-meta">始業前・終業後の一般衛生管理 (PRP) の実施を記録</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="sanitation-log">✨ 本日の点検表を追加</button>
            <button class="btn btn-tiny" data-list-add="sanitationLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${sanitationPanelHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">日付</th>
              <th style="width:65px">区分</th>
              ${itemHeaders}
              <th style="width:70px">残留塩素</th>
              <th style="width:75px">担当者</th>
              <th style="width:75px">確認者</th>
              <th>所見・備考</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  従事者健康確認記録
// ============================================================
const HEALTH_STATUSES = ["良好", "発熱", "下痢・嘔吐", "皮膚病変", "手指傷", "その他"];

export function renderHealthLog(state) {
    const list = state.healthLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「✨ 本日の健康確認を追加」を使用してください。</td></tr>`
        : list.map((r, idx) => {
            const isNg = r.status !== "良好" && r.status !== "" && r.status !== undefined;
            const noWork = r.worksToday === false || r.worksToday === "false";
            const rowStyle = (isNg || noWork) ? "background:#fef2f2" : (r.status === "良好" ? "background:#f0fdf4" : "");
            const statusOpts = HEALTH_STATUSES.map(s => `<option value="${esc(s)}" ${r.status===s?"selected":""}>${esc(s)}</option>`).join("");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="healthLog" data-key="date"       data-index="${idx}" value="${esc(r.date || "")}"></td>
              <td><input type="text"  data-list-edit data-list="healthLog" data-key="name"       data-index="${idx}" value="${esc(r.name || "")}" style="width:90px"></td>
              <td><input type="text"  data-list-edit data-list="healthLog" data-key="temperature" data-index="${idx}" value="${esc(r.temperature || "")}" placeholder="℃" style="width:55px"></td>
              <td>
                <select data-list-edit data-list="healthLog" data-key="status" data-index="${idx}" style="${isNg ? "color:#dc2626;font-weight:700" : ""}">
                  <option value="">—</option>${statusOpts}
                </select>
              </td>
              <td style="text-align:center">
                <select data-list-edit data-list="healthLog" data-key="worksToday" data-index="${idx}" style="${noWork ? "color:#dc2626;font-weight:700" : ""}">
                  <option value="true"  ${!noWork ? "selected":""}>出勤</option>
                  <option value="false" ${noWork  ? "selected":""}>出勤停止</option>
                </select>
              </td>
              <td><input type="text"  data-list-edit data-list="healthLog" data-key="verifiedBy" data-index="${idx}" value="${esc(r.verifiedBy || "")}" style="width:75px"></td>
              <td><input type="text"  data-list-edit data-list="healthLog" data-key="note"       data-index="${idx}" value="${esc(r.note || "")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="healthLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    const addPayload = JSON.stringify({ date: today, name: "", temperature: "", status: "良好", worksToday: "true", verifiedBy: "", note: "" });

    // Health log analytics: per-person stats
    const personStats = {};
    list.forEach(r => {
        const key = r.name || "不明";
        if (!personStats[key]) personStats[key] = { total: 0, issues: 0, workStops: 0, lastDate: "" };
        personStats[key].total++;
        if (r.status && r.status !== "良好") personStats[key].issues++;
        if (r.worksToday === false || r.worksToday === "false") personStats[key].workStops++;
        if (r.date && r.date > personStats[key].lastDate) personStats[key].lastDate = r.date;
    });
    const healthPanelHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        ${Object.entries(personStats).map(([name, s]) => {
          const hasIssue = s.issues > 0 || s.workStops > 0;
          const color  = hasIssue ? "#dc2626" : "#16a34a";
          const bg     = hasIssue ? "#fff1f2" : "#f0fdf4";
          const border = hasIssue ? "#fca5a5" : "#86efac";
          return `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:10px 14px;min-width:120px">
            <div style="font-size:11px;color:${color};font-weight:600">${esc(name)}</div>
            <div style="font-size:20px;font-weight:700;color:${color}">${s.total}<span style="font-size:12px;font-weight:400;margin-left:2px">回確認</span></div>
            <div style="font-size:11px;color:#475569">異常: ${s.issues}件 / 出勤停止: ${s.workStops}件</div>
            <div style="font-size:10px;color:#94a3b8">最終: ${s.lastDate || "—"}</div>
          </div>`;
        }).join("")}
      </div>`;

    return `
      <article class="doc" data-doc="health-log">
        <header class="doc-header">
          <div><h2 class="doc-title">従事者健康確認記録</h2><div class="doc-meta">始業前の健康状態確認 ／ 体調不良者は出勤停止・作業外し</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="health-log">✨ 本日の健康確認を追加</button>
            <button class="btn btn-tiny" data-list-add="healthLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${healthPanelHtml}
        <p style="font-size:11px;color:#64748b;margin-top:0">発熱・下痢等の症状がある場合は出勤停止とし、原因究明・回復確認後に復帰させてください。</p>
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">日付</th>
              <th style="width:90px">氏名</th>
              <th style="width:55px">体温</th>
              <th style="width:110px">健康状態</th>
              <th style="width:90px">出勤可否</th>
              <th style="width:75px">確認者</th>
              <th>備考・措置内容</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  CCP モニタリング記録表
// ============================================================
export function renderCcpMonitoringLog(state) {
    const list = state.ccpMonitoringLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="13" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「✨ 本日の記録票を追加」または「＋ 行を追加」を使用してください。</td></tr>`
        : list.map((r, idx) => {
            const isPass = r.passed === true || r.passed === "true";
            const isFail = r.passed === false || r.passed === "false";
            const rowStyle = isFail ? "background:#fef2f2" : (isPass ? "background:#f0fdf4" : "");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="ccpMonitoringLog" data-key="date"         data-index="${idx}" value="${esc(r.date || "")}"></td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="lot"          data-index="${idx}" value="${esc(r.lot || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="ccpNo"        data-index="${idx}" value="${esc(r.ccpNo || "")}" style="width:55px;font-weight:700"></td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="processName"  data-index="${idx}" value="${esc(r.processName || "")}" style="width:100%"></td>
              <td style="font-size:11px;color:#475569;max-width:160px">${esc(r.cl || "")}</td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="time"         data-index="${idx}" value="${esc(r.time || "")}" placeholder="HH:MM" style="width:65px"></td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="measuredValue" data-index="${idx}" value="${esc(r.measuredValue || "")}" style="width:80px;font-weight:700"></td>
              <td>
                <select data-list-edit data-list="ccpMonitoringLog" data-key="passed" data-index="${idx}" style="${isFail ? "color:#dc2626;font-weight:700" : (isPass ? "color:#16a34a;font-weight:700" : "")}">
                  <option value="" ${!isPass && !isFail ? "selected":""}>—</option>
                  <option value="true"  ${isPass ? "selected":""}>✓ 合格</option>
                  <option value="false" ${isFail ? "selected":""}>✕ 不合格</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="correction"  data-index="${idx}" value="${esc(r.correction || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="measuredBy"  data-index="${idx}" value="${esc(r.measuredBy || "")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="verifiedBy"  data-index="${idx}" value="${esc(r.verifiedBy || "")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="ccpMonitoringLog" data-key="note"        data-index="${idx}" value="${esc(r.note || "")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="ccpMonitoringLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    // Per-CCP compliance summary
    const ccpStats = {};
    list.forEach(r => {
        const key = r.ccpNo || "—";
        if (!ccpStats[key]) ccpStats[key] = { name: r.processName || "", total: 0, fails: 0, lastDate: "" };
        ccpStats[key].total++;
        if (r.passed === false || r.passed === "false") ccpStats[key].fails++;
        if (r.date && r.date > ccpStats[key].lastDate) ccpStats[key].lastDate = r.date;
    });
    const ccpStatsHtml = Object.keys(ccpStats).length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        ${Object.entries(ccpStats).map(([ccpNo, {name, total, fails, lastDate}]) => {
          const rate = Math.round((total - fails) / total * 100);
          const color = fails > 0 ? "#dc2626" : "#16a34a";
          const bg    = fails > 0 ? "#fff1f2" : "#f0fdf4";
          return `<div style="border:1px solid ${color};border-radius:8px;padding:8px 14px;background:${bg};min-width:140px;cursor:pointer" title="${esc(name)}">
            <div style="font-size:12px;font-weight:700;color:${color}">${esc(ccpNo)}</div>
            <div style="font-size:20px;font-weight:700;color:${color};margin:2px 0">${rate}%</div>
            <div style="font-size:10px;color:var(--c-text-muted)">${total}件 / 不合格${fails}件</div>
            <div style="font-size:10px;color:var(--c-text-muted)">最終: ${esc(lastDate)}</div>
          </div>`;
        }).join("")}
      </div>`;

    const addPayload = JSON.stringify({ date: today, lot: "", ccpNo: "", processName: "", cl: "", time: "", measuredValue: "", passed: "", correction: "", measuredBy: "", verifiedBy: "", note: "" });

    return `
      <article class="doc" data-doc="ccp-monitoring-log">
        <header class="doc-header">
          <div><h2 class="doc-title">CCP モニタリング記録表</h2><div class="doc-meta">各CCPの管理基準(CL)に対する測定値を記録 ／ 不合格時は是正措置・確認者の記入が必要</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="ccp-monitoring-log" title="本日付でCCPプランの全CCPのブランク記録行を追加">✨ 本日の記録票を追加</button>
            <button class="btn btn-tiny" data-list-add="ccpMonitoringLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${ccpStatsHtml}
        <p style="font-size:11px;color:#64748b;margin-top:0">赤色行＝CL逸脱。是正措置欄に処置を記入し、確認者欄に管理責任者の確認印を受けてください。</p>
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">日付</th>
              <th style="width:90px">ロット</th>
              <th style="width:55px">CCP</th>
              <th>工程名</th>
              <th style="width:160px">管理基準 (CL) ※参照</th>
              <th style="width:65px">時刻</th>
              <th style="width:85px">測定値</th>
              <th style="width:90px">合否判定</th>
              <th>是正措置</th>
              <th style="width:75px">担当者</th>
              <th style="width:75px">確認者</th>
              <th>備考</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  原材料受入記録
// ============================================================
export function renderReceivingLog(state) {
    const list = state.receivingLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="13" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「✨ 本日の受入記録を追加」または「＋ 行を追加」を使用してください。</td></tr>`
        : list.map((r, idx) => {
            const isPass = r.passed === true || r.passed === "true";
            const isFail = r.passed === false || r.passed === "false";
            const rowStyle = isFail ? "background:#fef2f2" : (isPass ? "background:#f0fdf4" : "");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="receivingLog" data-key="date"       data-index="${idx}" value="${esc(r.date || "")}"></td>
              <td><input type="text" data-list-edit data-list="receivingLog" data-key="ingNo"      data-index="${idx}" value="${esc(r.ingNo || "")}" style="width:55px"></td>
              <td><input type="text" data-list-edit data-list="receivingLog" data-key="ingName"    data-index="${idx}" value="${esc(r.ingName || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="receivingLog" data-key="supplier"   data-index="${idx}" value="${esc(r.supplier || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="receivingLog" data-key="lot"        data-index="${idx}" value="${esc(r.lot || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="receivingLog" data-key="quantity"   data-index="${idx}" value="${esc(r.quantity || "")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="receivingLog" data-key="temperature" data-index="${idx}" value="${esc(r.temperature || "")}" placeholder="℃" style="width:55px"></td>
              <td>
                <select data-list-edit data-list="receivingLog" data-key="appearance" data-index="${idx}">
                  <option value="" ${!r.appearance ? "selected":""}>—</option>
                  <option value="良好" ${r.appearance === "良好" ? "selected":""}>良好</option>
                  <option value="要注意" ${r.appearance === "要注意" ? "selected":""}>要注意</option>
                  <option value="不良" ${r.appearance === "不良" ? "selected":""}>不良</option>
                </select>
              </td>
              <td><input type="date" data-list-edit data-list="receivingLog" data-key="expiryDate" data-index="${idx}" value="${esc(r.expiryDate || "")}"></td>
              <td>
                <select data-list-edit data-list="receivingLog" data-key="passed" data-index="${idx}" style="${isFail ? "color:#dc2626;font-weight:700" : (isPass ? "color:#16a34a;font-weight:700" : "")}">
                  <option value="" ${!isPass && !isFail ? "selected":""}>—</option>
                  <option value="true"  ${isPass ? "selected":""}>✓ 合格</option>
                  <option value="false" ${isFail ? "selected":""}>✕ 不合格</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="receivingLog" data-key="receivedBy" data-index="${idx}" value="${esc(r.receivedBy || "")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="receivingLog" data-key="note"       data-index="${idx}" value="${esc(r.note || "")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="receivingLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    // Per-supplier summary
    const supplierRecv = {};
    list.forEach(r => {
        const name = r.supplier || "—";
        if (!supplierRecv[name]) supplierRecv[name] = { total: 0, fails: 0, lastDate: "" };
        supplierRecv[name].total++;
        if (r.passed === false || r.passed === "false") supplierRecv[name].fails++;
        if (r.date && r.date > supplierRecv[name].lastDate) supplierRecv[name].lastDate = r.date;
    });
    const recvSupplierHtml = Object.keys(supplierRecv).length === 0 ? "" : `
      <div class="section-block no-print" style="margin-bottom:14px">
        <h3 style="font-size:13px;font-weight:700;margin:0 0 8px">仕入先別 受入実績</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${Object.entries(supplierRecv).map(([name, {total, fails, lastDate}]) => {
            const rate = Math.round((total - fails) / total * 100);
            const color = fails > 0 ? "#d97706" : "#16a34a";
            const bg    = fails > 0 ? "#fffbeb" : "#f0fdf4";
            return `<div style="border:1px solid ${color};border-radius:6px;padding:6px 10px;background:${bg};min-width:140px">
              <div style="font-size:12px;font-weight:600">${esc(name)}</div>
              <div style="font-size:13px;font-weight:700;color:${color}">${rate}%</div>
              <div style="font-size:10px;color:var(--c-text-muted)">${total}件 / 不合格${fails}件 / 最終: ${esc(lastDate)}</div>
            </div>`;
          }).join("")}
        </div>
      </div>`;

    const addPayload = JSON.stringify({ date: today, ingNo: "", ingName: "", supplier: "", lot: "", quantity: "", temperature: "", appearance: "", expiryDate: "", passed: "", receivedBy: "", note: "" });

    // Expiry date panel
    const expiryIn7 = (() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().slice(0,10); })();
    const withExpiry  = list.filter(r => r.expiryDate);
    const expired     = withExpiry.filter(r => r.expiryDate < today);
    const expiringSoon= withExpiry.filter(r => r.expiryDate >= today && r.expiryDate <= expiryIn7);
    const expiryPanelHtml = withExpiry.length === 0 ? "" : (expired.length > 0 || expiringSoon.length > 0) ? `
      <div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px" class="no-print">
        <strong style="color:#dc2626">⚠ 期限管理</strong>
        ${expired.length > 0 ? `<div style="margin-top:4px;color:#dc2626">期限切れ (${expired.length}件): ${expired.slice(0,3).map(r=>`${esc(r.ingName||"原料")} ロット:${esc(r.lot||"—")} 期限:${r.expiryDate}`).join(" / ")}</div>` : ""}
        ${expiringSoon.length > 0 ? `<div style="margin-top:4px;color:#d97706">7日以内期限 (${expiringSoon.length}件): ${expiringSoon.slice(0,3).map(r=>`${esc(r.ingName||"原料")} ロット:${esc(r.lot||"—")} 期限:${r.expiryDate}`).join(" / ")}</div>` : ""}
      </div>` : "";

    return `
      <article class="doc" data-doc="receiving-log">
        <header class="doc-header">
          <div><h2 class="doc-title">原材料受入記録</h2><div class="doc-meta">受入時の外観・温度・期限確認を記録（一般衛生管理 PRP 対応）</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="receiving-log" title="本日付で登録済み原材料のブランク受入記録行を追加">✨ 本日の受入記録を追加</button>
            <button class="btn btn-tiny" data-list-add="receivingLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${expiryPanelHtml}
        ${recvSupplierHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">受入日</th>
              <th style="width:55px">原料No</th>
              <th>原料名</th>
              <th>仕入先</th>
              <th style="width:95px">ロット</th>
              <th style="width:75px">数量</th>
              <th style="width:55px">温度</th>
              <th style="width:80px">外観</th>
              <th style="width:115px">消費・賞味期限</th>
              <th style="width:90px">合否判定</th>
              <th style="width:75px">担当者</th>
              <th>備考・不合格時処置</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  O-PRPプラン (運用的前提条件プログラム)
// ============================================================
export function renderOprpPlan(state) {
    const list = state.oprp || [];
    const tbody = list.length === 0
        ? `<tr><td colspan="12" style="text-align:center;color:#94a3b8;padding:18px">O-PRPが未登録です。「✨ 管理手段から雛形を生成」または「＋ O-PRPを追加」を使用してください。</td></tr>`
        : list.map((o, idx) => `
            <tr>
              <td><input type="text" data-list-edit data-list="oprp" data-key="oprpNo"          data-index="${idx}" value="${esc(o.oprpNo || "")}" style="width:70px"></td>
              <td><input type="text" data-list-edit data-list="oprp" data-key="processName"     data-index="${idx}" value="${esc(o.processName || "")}" style="width:100%"></td>
              <td><textarea data-list-edit data-list="oprp" data-key="hazard"                   data-index="${idx}" rows="2" style="width:100%">${esc(o.hazard || "")}</textarea></td>
              <td><input type="text" data-list-edit data-list="oprp" data-key="measure"         data-index="${idx}" value="${esc(o.measure || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="oprp" data-key="acceptableLevel" data-index="${idx}" value="${esc(o.acceptableLevel || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="oprp" data-key="monWhat"         data-index="${idx}" value="${esc(o.monWhat || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="oprp" data-key="monHow"          data-index="${idx}" value="${esc(o.monHow || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="oprp" data-key="monFreq"         data-index="${idx}" value="${esc(o.monFreq || "")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="oprp" data-key="monWho"          data-index="${idx}" value="${esc(o.monWho || "")}" style="width:100%"></td>
              <td><textarea data-list-edit data-list="oprp" data-key="correction"               data-index="${idx}" rows="2" style="width:100%">${esc(o.correction || "")}</textarea></td>
              <td><input type="text" data-list-edit data-list="oprp" data-key="record"          data-index="${idx}" value="${esc(o.record || "")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="oprp" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`).join("");

    const addPayload = JSON.stringify({ id: uid("OPRP"), oprpNo: `O-PRP${list.length + 1}`, processName: "", hazard: "", measure: "", acceptableLevel: "", monWhat: "", monHow: "", monFreq: "", monWho: "", correction: "", record: "" });

    // Completeness check for each O-PRP
    const oprpFields = [
        { key: "oprpNo",         label: "O-PRP番号" },
        { key: "processName",    label: "管理対象工程" },
        { key: "hazard",         label: "ハザード" },
        { key: "measure",        label: "管理手段" },
        { key: "acceptableLevel",label: "許容水準" },
        { key: "monWhat",        label: "監視対象" },
        { key: "monHow",         label: "監視方法" },
        { key: "monFreq",        label: "監視頻度" },
        { key: "monWho",         label: "監視担当" },
        { key: "correction",     label: "是正措置" },
        { key: "record",         label: "記録" },
    ];
    const oprpIncomplete = list.filter(o => oprpFields.some(f => !o[f.key]?.trim()));
    const oprpCompletenessHtml = list.length === 0 ? "" : oprpIncomplete.length === 0
        ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 14px;font-size:12px;color:#166534;margin-bottom:12px" class="no-print">✅ 全${list.length}件のO-PRPプランは必須項目がすべて記入されています。</div>`
        : `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:6px;padding:10px 14px;font-size:12px;color:#92400e;margin-bottom:12px" class="no-print">
            <strong>⚠ ${oprpIncomplete.length}件のO-PRPに未記入項目があります</strong>
            <ul style="margin:6px 0 0 16px;padding:0">
              ${oprpIncomplete.map(o => {
                const missing = oprpFields.filter(f => !o[f.key]?.trim()).map(f => f.label).join("・");
                return `<li>${esc(o.oprpNo || "?")}: ${missing} が未入力</li>`;
              }).join("")}
            </ul>
          </div>`;

    return `
      <article class="doc" data-doc="oprp-plan">
        <header class="doc-header">
          <div><h2 class="doc-title">O-PRPプラン（原則3〜7）</h2><div class="doc-meta">TBT様式 ／ O-PRP (運用的前提条件プログラム) — アレルゲン管理・二次汚染防止等</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="oprp-plan" title="管理手段選択分類表でO-PRPと判定された項目からプランを生成">✨ 管理手段から雛形を生成</button>
            <button class="btn btn-tiny" data-list-add="oprp" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ O-PRPを追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${oprpCompletenessHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead>
              <tr>
                <th rowspan="2" style="width:70px">O-PRP</th>
                <th rowspan="2" style="width:130px">管理対象工程</th>
                <th rowspan="2" style="width:170px">管理が必要なハザード</th>
                <th rowspan="2" style="width:150px">管理手段</th>
                <th rowspan="2" style="width:140px">許容水準</th>
                <th colspan="4">モニタリング</th>
                <th rowspan="2" style="width:170px">是正措置</th>
                <th rowspan="2" style="width:130px">記録</th>
                <th rowspan="2" style="width:40px"></th>
              </tr>
              <tr><th>① 何を</th><th>② どのように</th><th>③ 頻度</th><th>④ 誰が</th></tr>
            </thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  冷蔵・冷凍温度記録
// ============================================================
export function renderTemperatureLog(state) {
    const list = state.temperatureLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「✨ 本日の温度記録を追加」または「＋ 行を追加」を使用してください。</td></tr>`
        : list.map((r, idx) => {
            const isPass = r.passed === true || r.passed === "true";
            const isFail = r.passed === false || r.passed === "false";
            const rowStyle = isFail ? "background:#fef2f2" : (isPass ? "background:#f0fdf4" : "");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="temperatureLog" data-key="date"       data-index="${idx}" value="${esc(r.date||"")}"></td>
              <td>
                <select data-list-edit data-list="temperatureLog" data-key="shift" data-index="${idx}">
                  <option value="朝"  ${(r.shift||"朝")==="朝"  ?"selected":""}>朝</option>
                  <option value="昼"  ${r.shift==="昼"           ?"selected":""}>昼</option>
                  <option value="終業" ${r.shift==="終業"         ?"selected":""}>終業</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="temperatureLog" data-key="unit"       data-index="${idx}" value="${esc(r.unit||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="temperatureLog" data-key="setTemp"    data-index="${idx}" value="${esc(r.setTemp||"")}" placeholder="℃" style="width:60px"></td>
              <td><input type="text" data-list-edit data-list="temperatureLog" data-key="measured"   data-index="${idx}" value="${esc(r.measured||"")}" placeholder="℃" style="width:60px;font-weight:700"></td>
              <td>
                <select data-list-edit data-list="temperatureLog" data-key="passed" data-index="${idx}" style="${isFail?"color:#dc2626;font-weight:700":(isPass?"color:#16a34a;font-weight:700":"")}">
                  <option value="" ${!isPass&&!isFail?"selected":""}>—</option>
                  <option value="true"  ${isPass?"selected":""}>✓ 適合</option>
                  <option value="false" ${isFail?"selected":""}>✕ 不適合</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="temperatureLog" data-key="inspector"  data-index="${idx}" value="${esc(r.inspector||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="temperatureLog" data-key="note"       data-index="${idx}" value="${esc(r.note||"")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="temperatureLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    // Per-unit stats
    const unitStats = {};
    list.forEach(r => {
        const key = r.unit || "—";
        if (!unitStats[key]) unitStats[key] = { total: 0, fails: 0, lastMeasured: "", lastDate: "" };
        unitStats[key].total++;
        if (r.passed === false || r.passed === "false") unitStats[key].fails++;
        if (r.date && r.date > unitStats[key].lastDate) {
            unitStats[key].lastDate = r.date;
            unitStats[key].lastMeasured = r.measured || "";
        }
    });
    const tempUnitHtml = Object.keys(unitStats).length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        ${Object.entries(unitStats).map(([unit, {total, fails, lastMeasured, lastDate}]) => {
          const rate = Math.round((total - fails) / total * 100);
          const color = fails > 0 ? "#dc2626" : "#1d4ed8";
          const bg    = fails > 0 ? "#fff1f2" : "#eff6ff";
          return `<div style="border:1px solid ${color};border-radius:8px;padding:8px 14px;background:${bg};min-width:140px">
            <div style="font-size:12px;font-weight:600">${esc(unit)}</div>
            <div style="font-size:20px;font-weight:700;color:${color}">${rate}%</div>
            <div style="font-size:10px;color:var(--c-text-muted)">${total}件 / 不適合${fails}件</div>
            <div style="font-size:10px;color:var(--c-text-muted)">最終: ${esc(lastDate)} ${lastMeasured ? lastMeasured + "℃" : ""}</div>
          </div>`;
        }).join("")}
      </div>`;

    const addPayload = JSON.stringify({ date: today, shift: "朝", unit: "", setTemp: "", measured: "", passed: "", inspector: "", note: "" });
    return `
      <article class="doc" data-doc="temperature-log">
        <header class="doc-header">
          <div><h2 class="doc-title">冷蔵・冷凍温度記録</h2><div class="doc-meta">冷蔵・冷凍庫の温度確認 ／ 設定温度からの逸脱を早期検知</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="temperature-log">✨ 本日の温度記録を追加</button>
            <button class="btn btn-tiny" data-list-add="temperatureLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${tempUnitHtml}
        <p style="font-size:11px;color:#64748b;margin-top:0">冷蔵: 10℃以下、冷凍: −15℃以下が一般的な基準値です。自社基準に合わせて判定してください。</p>
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">日付</th>
              <th style="width:65px">区分</th>
              <th>保管庫・機器名</th>
              <th style="width:75px">設定温度(℃)</th>
              <th style="width:75px">測定温度(℃)</th>
              <th style="width:90px">適否判定</th>
              <th style="width:75px">担当者</th>
              <th>備考・是正措置</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  機器校正記録
// ============================================================
export function renderCalibrationLog(state) {
    const list = state.calibrationLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「✨ CCPプランから機器リストを生成」または「＋ 行を追加」を使用してください。</td></tr>`
        : list.map((r, idx) => {
            const isPass = r.result === "合格" || r.result === "適合";
            const isFail = r.result === "要調整" || r.result === "不合格";
            const rowStyle = isFail ? "background:#fef2f2" : (isPass ? "background:#f0fdf4" : "");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="calibrationLog" data-key="date"          data-index="${idx}" value="${esc(r.date||"")}"></td>
              <td><input type="text" data-list-edit data-list="calibrationLog" data-key="equipment"     data-index="${idx}" value="${esc(r.equipment||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="calibrationLog" data-key="equipmentId"   data-index="${idx}" value="${esc(r.equipmentId||"")}" style="width:80px"></td>
              <td><input type="text" data-list-edit data-list="calibrationLog" data-key="method"        data-index="${idx}" value="${esc(r.method||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="calibrationLog" data-key="beforeValue"   data-index="${idx}" value="${esc(r.beforeValue||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="calibrationLog" data-key="refValue"      data-index="${idx}" value="${esc(r.refValue||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="calibrationLog" data-key="afterValue"    data-index="${idx}" value="${esc(r.afterValue||"")}" style="width:75px"></td>
              <td>
                <select data-list-edit data-list="calibrationLog" data-key="result" data-index="${idx}" style="${isFail?"color:#dc2626;font-weight:700":(isPass?"color:#16a34a;font-weight:700":"")}">
                  <option value=""     ${!r.result?"selected":""}>—</option>
                  <option value="合格" ${r.result==="合格"?"selected":""}>✓ 合格</option>
                  <option value="要調整" ${r.result==="要調整"?"selected":""}>△ 要調整</option>
                  <option value="不合格" ${r.result==="不合格"?"selected":""}>✕ 不合格</option>
                </select>
              </td>
              <td><input type="date" data-list-edit data-list="calibrationLog" data-key="nextDate"      data-index="${idx}" value="${esc(r.nextDate||"")}"></td>
              <td><input type="text" data-list-edit data-list="calibrationLog" data-key="performedBy"   data-index="${idx}" value="${esc(r.performedBy||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="calibrationLog" data-key="note"          data-index="${idx}" value="${esc(r.note||"")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="calibrationLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    // Build per-equipment status summary
    const byEquip = {};
    list.forEach(r => {
        const key = r.equipmentId || r.equipment || "—";
        if (!byEquip[key] || r.date > byEquip[key].date) byEquip[key] = r;
    });
    const soon30 = new Date(); soon30.setDate(soon30.getDate() + 30);
    const equipStatus = Object.values(byEquip).map(r => {
        const nd = r.nextDate;
        let status, color;
        if (!nd) { status = "次回未設定"; color = "#64748b"; }
        else if (nd < today) { status = `期限超過 (${nd})`; color = "#dc2626"; }
        else if (nd <= soon30.toISOString().slice(0,10)) { status = `30日以内 (${nd})`; color = "#d97706"; }
        else { status = `次回: ${nd}`; color = "#16a34a"; }
        return { name: r.equipment || r.equipmentId || "—", status, color, result: r.result || "—", date: r.date || "—" };
    });
    const overdueCount = equipStatus.filter(e => e.color === "#dc2626").length;
    const soonCount    = equipStatus.filter(e => e.color === "#d97706").length;

    const calibStatusHtml = equipStatus.length === 0 ? "" : `
      <div class="section-block no-print" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <h3 style="font-size:13px;font-weight:700;margin:0">機器別 校正ステータス</h3>
          ${overdueCount > 0 ? `<span style="font-size:12px;color:#dc2626;font-weight:600">⚠ ${overdueCount}件 期限超過</span>` :
            soonCount   > 0 ? `<span style="font-size:12px;color:#d97706;font-weight:600">△ ${soonCount}件 30日以内</span>` :
            `<span style="font-size:12px;color:#16a34a;font-weight:600">✅ 全機器 期限内</span>`}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${equipStatus.map(e => `
            <div style="border:1px solid ${e.color};border-radius:6px;padding:6px 10px;min-width:140px;background:${e.color==="var(--c-border)"||true?"var(--c-surface)":"var(--c-surface)"}">
              <div style="font-size:12px;font-weight:600;color:var(--c-text)">${esc(e.name)}</div>
              <div style="font-size:11px;color:${e.color};margin-top:2px">${esc(e.status)}</div>
              <div style="font-size:10px;color:var(--c-text-muted)">最終: ${esc(e.date)} / ${esc(e.result)}</div>
            </div>`).join("")}
        </div>
      </div>`;

    const addPayload = JSON.stringify({ date: today, equipment: "", equipmentId: "", method: "", beforeValue: "", refValue: "", afterValue: "", result: "", nextDate: "", performedBy: "", note: "" });
    return `
      <article class="doc" data-doc="calibration-log">
        <header class="doc-header">
          <div><h2 class="doc-title">機器校正記録</h2><div class="doc-meta">測定機器の精度確認・校正記録 ／ 原則6 検証活動の一環</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="calibration-log">✨ 測定機器リストを生成</button>
            <button class="btn btn-tiny" data-list-add="calibrationLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        <p style="font-size:11px;color:#64748b;margin-top:0">校正結果が不合格の場合は機器を使用停止とし、当該機器を使用した製品の再評価を行ってください。</p>
        ${calibStatusHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">実施日</th>
              <th>機器名</th>
              <th style="width:80px">機器ID</th>
              <th style="width:130px">校正方法</th>
              <th style="width:75px">校正前値</th>
              <th style="width:75px">基準値</th>
              <th style="width:75px">校正後値</th>
              <th style="width:80px">結果</th>
              <th style="width:115px">次回実施日</th>
              <th style="width:75px">実施者</th>
              <th>備考</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  使用水確認記録
// ============================================================
export function renderWaterLog(state) {
    const list = state.waterLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「✨ 本日の確認記録を追加」または「＋ 行を追加」を使用してください。</td></tr>`
        : list.map((r, idx) => {
            const isPass = r.passed === true || r.passed === "true";
            const isFail = r.passed === false || r.passed === "false";
            const rowStyle = isFail ? "background:#fef2f2" : (isPass ? "background:#f0fdf4" : "");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="waterLog" data-key="date"       data-index="${idx}" value="${esc(r.date || "")}"></td>
              <td>
                <select data-list-edit data-list="waterLog" data-key="shift" data-index="${idx}">
                  <option value="朝"  ${(r.shift||"朝")==="朝"  ?"selected":""}>朝</option>
                  <option value="昼"  ${r.shift==="昼"           ?"selected":""}>昼</option>
                  <option value="終業" ${r.shift==="終業"         ?"selected":""}>終業</option>
                </select>
              </td>
              <td>
                <select data-list-edit data-list="waterLog" data-key="appearance" data-index="${idx}">
                  <option value="無色透明" ${(r.appearance||"無色透明")==="無色透明"?"selected":""}>無色透明</option>
                  <option value="濁りあり" ${r.appearance==="濁りあり"?"selected":""}>濁りあり</option>
                  <option value="着色あり" ${r.appearance==="着色あり"?"selected":""}>着色あり</option>
                  <option value="その他"   ${r.appearance==="その他"  ?"selected":""}>その他</option>
                </select>
              </td>
              <td>
                <select data-list-edit data-list="waterLog" data-key="odor" data-index="${idx}">
                  <option value="無臭"     ${(r.odor||"無臭")==="無臭"    ?"selected":""}>無臭</option>
                  <option value="塩素臭(微)" ${r.odor==="塩素臭(微)"     ?"selected":""}>塩素臭(微)</option>
                  <option value="異臭あり" ${r.odor==="異臭あり"         ?"selected":""}>異臭あり</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="waterLog" data-key="chlorine"   data-index="${idx}" value="${esc(r.chlorine||"")}" placeholder="mg/L" style="width:65px"></td>
              <td>
                <select data-list-edit data-list="waterLog" data-key="passed" data-index="${idx}" style="${isFail?"color:#dc2626;font-weight:700":(isPass?"color:#16a34a;font-weight:700":"")}">
                  <option value="" ${!isPass&&!isFail?"selected":""}>—</option>
                  <option value="true"  ${isPass?"selected":""}>✓ 適合</option>
                  <option value="false" ${isFail?"selected":""}>✕ 不適合</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="waterLog" data-key="inspector"  data-index="${idx}" value="${esc(r.inspector||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="waterLog" data-key="note"       data-index="${idx}" value="${esc(r.note||"")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="waterLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    const addPayload = JSON.stringify({ date: today, shift: "朝", appearance: "無色透明", odor: "無臭", chlorine: "", passed: "", inspector: "", note: "" });

    // Water log analytics
    const wTotal  = list.length;
    const wFail   = list.filter(r => r.passed === false || r.passed === "false").length;
    const wPass   = list.filter(r => r.passed === true  || r.passed === "true").length;
    const wRate   = wPass + wFail > 0 ? Math.round(wPass / (wPass + wFail) * 100) : null;
    const wAnomaly = list.filter(r => r.appearance !== "無色透明" || r.odor === "異臭あり").length;
    const lastRecord = list.filter(r => r.date).sort((a, b) => b.date.localeCompare(a.date))[0];
    const waterPanelHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:${wFail > 0 ? "#fff1f2" : "#f0fdf4"};border:1px solid ${wFail > 0 ? "#fca5a5" : "#86efac"};border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:${wFail > 0 ? "#dc2626" : "#166534"};font-weight:600">適合率</div>
          <div style="font-size:22px;font-weight:700;color:${wFail > 0 ? "#dc2626" : "#16a34a"}">${wRate !== null ? wRate + "%" : "—"}</div>
          <div style="font-size:11px;color:#475569">${wTotal}件中 不適合${wFail}件</div>
        </div>
        ${wAnomaly > 0 ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:#92400e;font-weight:600">外観・臭気異常</div>
          <div style="font-size:22px;font-weight:700;color:#d97706">${wAnomaly}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
          <div style="font-size:11px;color:#475569">色調・臭気の異常記録</div>
        </div>` : ""}
        ${lastRecord ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:#475569;font-weight:600">直近記録</div>
          <div style="font-size:14px;font-weight:700;color:#334155">${esc(lastRecord.date || "—")}</div>
          <div style="font-size:11px;color:#475569">残留塩素: ${esc(lastRecord.chlorine || "—")} mg/L</div>
          <div style="font-size:11px;color:${lastRecord.passed === true || lastRecord.passed === "true" ? "#16a34a" : (lastRecord.passed === false || lastRecord.passed === "false" ? "#dc2626" : "#94a3b8")};font-weight:600">${lastRecord.passed === true || lastRecord.passed === "true" ? "✓ 適合" : (lastRecord.passed === false || lastRecord.passed === "false" ? "✕ 不適合" : "—")}</div>
        </div>` : ""}
      </div>`;

    return `
      <article class="doc" data-doc="water-log">
        <header class="doc-header">
          <div><h2 class="doc-title">使用水確認記録</h2><div class="doc-meta">水道水の色調・臭気・残留塩素を確認（厚生労働省指針値: 遊離残留塩素 0.1mg/L以上）</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="water-log">✨ 本日の確認記録を追加</button>
            <button class="btn btn-tiny" data-list-add="waterLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${waterPanelHtml}
        <p style="font-size:11px;color:#64748b;margin-top:0">残留塩素が0.1mg/L未満の場合は不適合として是正措置を記録し、衛生管理責任者に報告してください。</p>
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">日付</th>
              <th style="width:65px">区分</th>
              <th style="width:95px">色調</th>
              <th style="width:90px">臭気</th>
              <th style="width:85px">残留塩素(mg/L)</th>
              <th style="width:90px">適否判定</th>
              <th style="width:75px">担当者</th>
              <th>備考・是正措置</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  教育訓練記録
// ============================================================
export function renderTrainingLog(state) {
    const list = state.trainingLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「＋ 行を追加」で訓練記録を追加してください。</td></tr>`
        : list.map((r, idx) => `
            <tr>
              <td><input type="date" data-list-edit data-list="trainingLog" data-key="date"        data-index="${idx}" value="${esc(r.date||"")}"></td>
              <td><input type="text" data-list-edit data-list="trainingLog" data-key="theme"       data-index="${idx}" value="${esc(r.theme||"")}" style="width:100%"></td>
              <td><textarea         data-list-edit data-list="trainingLog" data-key="content"     data-index="${idx}" rows="2" style="width:100%">${esc(r.content||"")}</textarea></td>
              <td><input type="text" data-list-edit data-list="trainingLog" data-key="participants" data-index="${idx}" value="${esc(r.participants||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="trainingLog" data-key="duration"    data-index="${idx}" value="${esc(r.duration||"")}" placeholder="h" style="width:50px"></td>
              <td><input type="text" data-list-edit data-list="trainingLog" data-key="instructor"  data-index="${idx}" value="${esc(r.instructor||"")}" style="width:75px"></td>
              <td>
                <select data-list-edit data-list="trainingLog" data-key="method" data-index="${idx}">
                  <option value="講義"       ${(r.method||"講義")==="講義"      ?"selected":""}>講義</option>
                  <option value="実技"       ${r.method==="実技"                ?"selected":""}>実技</option>
                  <option value="OJT"        ${r.method==="OJT"                 ?"selected":""}>OJT</option>
                  <option value="eラーニング" ${r.method==="eラーニング"          ?"selected":""}>eラーニング</option>
                  <option value="テスト"     ${r.method==="テスト"              ?"selected":""}>テスト</option>
                  <option value="その他"     ${r.method==="その他"              ?"selected":""}>その他</option>
                </select>
              </td>
              <td>
                <select data-list-edit data-list="trainingLog" data-key="result" data-index="${idx}">
                  <option value="良好"   ${(r.result||"良好")==="良好"  ?"selected":""}>良好</option>
                  <option value="要再訓練" ${r.result==="要再訓練"       ?"selected":""}>要再訓練</option>
                  <option value="未確認" ${r.result==="未確認"           ?"selected":""}>未確認</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="trainingLog" data-key="confirmedBy" data-index="${idx}" value="${esc(r.confirmedBy||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="trainingLog" data-key="note"        data-index="${idx}" value="${esc(r.note||"")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="trainingLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`).join("");

    const addPayload = JSON.stringify({ date: today, theme: "", content: "", participants: "", duration: "", instructor: "", method: "講義", result: "良好", confirmedBy: "", note: "" });

    // Training analytics
    const totalSessions  = list.length;
    const totalHours     = list.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const retrainNeeded  = list.filter(r => r.result === "要再訓練").length;
    const unconfirmed    = list.filter(r => r.result === "未確認").length;
    const lastDate       = list.filter(r => r.date).sort((a, b) => b.date.localeCompare(a.date))[0]?.date || "";

    // Per-person coverage
    const personMap = {};
    list.forEach(r => {
        const people = (r.participants || "").split(/[,、\s]+/).map(s => s.trim()).filter(Boolean);
        people.forEach(name => {
            if (!personMap[name]) personMap[name] = { sessions: 0, hours: 0, lastDate: "", retrain: 0, unconfirmed: 0 };
            personMap[name].sessions++;
            personMap[name].hours += parseFloat(r.duration) || 0;
            if (!personMap[name].lastDate || r.date > personMap[name].lastDate) personMap[name].lastDate = r.date || "";
            if (r.result === "要再訓練") personMap[name].retrain++;
            if (r.result === "未確認")   personMap[name].unconfirmed++;
        });
    });
    const personNames = Object.keys(personMap).sort();
    const cutoff365 = (() => { const d = new Date(); d.setDate(d.getDate() - 365); return d.toISOString().slice(0, 10); })();
    const personTableHtml = personNames.length === 0 ? "" : `
      <div style="margin-bottom:14px" class="no-print">
        <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:6px">従事者別 受講状況 (${personNames.length}名)</div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="background:#f8fafc">
              <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left">氏名</th>
              <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;width:70px">受講回数</th>
              <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;width:70px">受講時間</th>
              <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;width:110px">最終受講日</th>
              <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left">状態</th>
            </tr></thead>
            <tbody>
              ${personNames.map(name => {
                  const p = personMap[name];
                  const overdue = p.lastDate && p.lastDate < cutoff365;
                  const statusHtml = p.retrain > 0
                      ? `<span style="color:#dc2626;font-weight:600">⚠ 要再訓練 ${p.retrain}件</span>`
                      : p.unconfirmed > 0
                          ? `<span style="color:#d97706">未確認 ${p.unconfirmed}件</span>`
                          : overdue
                              ? `<span style="color:#d97706">⚠ 1年以上未受講</span>`
                              : `<span style="color:#16a34a">✓ 良好</span>`;
                  const rowBg = (p.retrain > 0) ? "background:#fff1f2" : overdue ? "background:#fff7ed" : "";
                  return `<tr style="${rowBg}">
                    <td style="padding:4px 8px;border:1px solid #e2e8f0;font-weight:500">${esc(name)}</td>
                    <td style="padding:4px 8px;border:1px solid #e2e8f0;text-align:center">${p.sessions}</td>
                    <td style="padding:4px 8px;border:1px solid #e2e8f0;text-align:center">${p.hours.toFixed(1)}h</td>
                    <td style="padding:4px 8px;border:1px solid #e2e8f0;text-align:center">${esc(p.lastDate || "—")}</td>
                    <td style="padding:4px 8px;border:1px solid #e2e8f0">${statusHtml}</td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>`;

    const trainingPanelHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;min-width:120px">
          <div style="font-size:11px;color:#1e40af;font-weight:600">実施回数</div>
          <div style="font-size:22px;font-weight:700;color:#1d4ed8">${totalSessions}<span style="font-size:12px;font-weight:400;margin-left:2px">回</span></div>
          <div style="font-size:11px;color:#475569">計 ${totalHours.toFixed(1)}時間</div>
        </div>
        ${retrainNeeded > 0 ? `<div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;min-width:120px">
          <div style="font-size:11px;color:#dc2626;font-weight:600">要再訓練</div>
          <div style="font-size:22px;font-weight:700;color:#dc2626">${retrainNeeded}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
          <div style="font-size:11px;color:#475569">フォローアップ必要</div>
        </div>` : ""}
        ${unconfirmed > 0 ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;min-width:120px">
          <div style="font-size:11px;color:#92400e;font-weight:600">未確認</div>
          <div style="font-size:22px;font-weight:700;color:#d97706">${unconfirmed}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
          <div style="font-size:11px;color:#475569">確認結果が未記入</div>
        </div>` : ""}
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;min-width:120px">
          <div style="font-size:11px;color:#475569;font-weight:600">最終実施日</div>
          <div style="font-size:16px;font-weight:700;color:#334155">${esc(lastDate || "—")}</div>
          <div style="font-size:11px;color:#16a34a">${retrainNeeded === 0 && unconfirmed === 0 ? "✓ 問題なし" : ""}</div>
        </div>
      </div>
      ${personTableHtml}`;

    return `
      <article class="doc" data-doc="training-log">
        <header class="doc-header">
          <div><h2 class="doc-title">教育訓練記録</h2><div class="doc-meta">HACCPに関連する教育・訓練の実施記録（ISO 22000 §8.2.2 対応）</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="training-log">✨ 標準訓練計画から生成</button>
            <button class="btn btn-tiny" data-list-add="trainingLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${trainingPanelHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">実施日</th>
              <th style="width:150px">訓練テーマ</th>
              <th>訓練内容</th>
              <th style="width:110px">対象者</th>
              <th style="width:45px">時間</th>
              <th style="width:75px">講師</th>
              <th style="width:90px">実施形式</th>
              <th style="width:80px">確認結果</th>
              <th style="width:75px">確認者</th>
              <th>備考</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  アレルゲン切替確認記録
// ============================================================
export function renderAllergenLog(state) {
    const list = state.allergenLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const productAllergens = state.product?.allergens || [];
    const ALLERGEN_NAMES = { wheat:"小麦", buckwheat:"そば", egg:"卵", milk:"乳", peanut:"落花生", walnut:"くるみ",
        shrimp:"えび", crab:"かに", salmon:"さけ", mackerel:"さば", squid:"いか", abalone:"あわび",
        clam:"あさり", oranges:"オレンジ", kiwi:"キウイフルーツ", beef:"牛肉", pork:"豚肉", chicken:"鶏肉",
        cashew:"カシューナッツ", sesame:"ごま", almond:"アーモンド", soybean:"大豆", banana:"バナナ",
        yam:"やまいも", apple:"りんご", gelatin:"ゼラチン", matsutake:"まつたけ", peach:"もも" };
    const allergenKeys = productAllergens.length > 0 ? productAllergens : ["wheat", "egg", "milk", "soybean"];

    const tbody = list.length === 0
        ? `<tr><td colspan="${allergenKeys.length + 8}" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「＋ 行を追加」で確認記録を追加してください。</td></tr>`
        : list.map((r, idx) => {
            const isPass = r.passed === true || r.passed === "true";
            const isFail = r.passed === false || r.passed === "false";
            const rowStyle = isFail ? "background:#fef2f2" : (isPass ? "background:#f0fdf4" : "");
            const allergenCells = allergenKeys.map(k => {
                const v = r.allergens?.[k];
                return `<td style="text-align:center"><input type="checkbox" data-list-edit data-list="allergenLog" data-key="allergens.${k}" data-index="${idx}" ${v ? "checked" : ""}></td>`;
            }).join("");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="allergenLog" data-key="date"        data-index="${idx}" value="${esc(r.date||"")}"></td>
              <td>
                <select data-list-edit data-list="allergenLog" data-key="type" data-index="${idx}">
                  <option value="始業前"   ${(r.type||"始業前")==="始業前"  ?"selected":""}>始業前</option>
                  <option value="製品切替" ${r.type==="製品切替"            ?"selected":""}>製品切替</option>
                  <option value="終業後"   ${r.type==="終業後"              ?"selected":""}>終業後</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="allergenLog" data-key="prevProduct"  data-index="${idx}" value="${esc(r.prevProduct||"")}" style="width:90px"></td>
              ${allergenCells}
              <td>
                <select data-list-edit data-list="allergenLog" data-key="cleaning" data-index="${idx}">
                  <option value="完了" ${(r.cleaning||"完了")==="完了"?"selected":""}>完了</option>
                  <option value="未実施" ${r.cleaning==="未実施"?"selected":""}>未実施</option>
                </select>
              </td>
              <td>
                <select data-list-edit data-list="allergenLog" data-key="passed" data-index="${idx}" style="${isFail?"color:#dc2626;font-weight:700":(isPass?"color:#16a34a;font-weight:700":"")}">
                  <option value="" ${!isPass&&!isFail?"selected":""}>—</option>
                  <option value="true"  ${isPass?"selected":""}>✓ OK</option>
                  <option value="false" ${isFail?"selected":""}>✕ NG</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="allergenLog" data-key="inspector"    data-index="${idx}" value="${esc(r.inspector||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="allergenLog" data-key="note"         data-index="${idx}" value="${esc(r.note||"")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="allergenLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    const allergenHeaders = allergenKeys.map(k => `<th style="width:52px;font-size:10px">${esc(ALLERGEN_NAMES[k]||k)}</th>`).join("");
    const allergenTemplate = Object.fromEntries(allergenKeys.map(k => [k, false]));
    const addPayload = JSON.stringify({ date: today, type: "始業前", prevProduct: "", allergens: allergenTemplate, cleaning: "完了", passed: "", inspector: "", note: "" });

    // Allergen analytics: overall pass rate + per-type breakdown
    const allergenTotal  = list.length;
    const allergenFail   = list.filter(r => r.passed === false || r.passed === "false").length;
    const allergenPass   = list.filter(r => r.passed === true  || r.passed === "true").length;
    const allergenRate   = allergenPass + allergenFail > 0 ? Math.round(allergenPass / (allergenPass + allergenFail) * 100) : null;
    const cleaningNG     = list.filter(r => r.cleaning === "未実施").length;
    const typeBreakdown  = ["始業前", "製品切替", "終業後"].map(t => {
        const items = list.filter(r => r.type === t);
        const fails = items.filter(r => r.passed === false || r.passed === "false").length;
        return { type: t, count: items.length, fails };
    }).filter(t => t.count > 0);
    const allergenPanelHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:${allergenFail > 0 ? "#fff1f2" : "#f0fdf4"};border:1px solid ${allergenFail > 0 ? "#fca5a5" : "#86efac"};border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:${allergenFail > 0 ? "#dc2626" : "#166534"};font-weight:600">確認合格率</div>
          <div style="font-size:22px;font-weight:700;color:${allergenFail > 0 ? "#dc2626" : "#16a34a"}">${allergenRate !== null ? allergenRate + "%" : "—"}</div>
          <div style="font-size:11px;color:#475569">${allergenTotal}件中 NG${allergenFail}件</div>
        </div>
        ${cleaningNG > 0 ? `<div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:#dc2626;font-weight:600">洗浄未実施</div>
          <div style="font-size:22px;font-weight:700;color:#dc2626">${cleaningNG}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
          <div style="font-size:11px;color:#475569">要注意: アレルゲン混入リスク</div>
        </div>` : ""}
        ${typeBreakdown.map(t => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;min-width:100px">
          <div style="font-size:11px;color:#475569;font-weight:600">${esc(t.type)}</div>
          <div style="font-size:20px;font-weight:700;color:#334155">${t.count}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
          <div style="font-size:11px;color:${t.fails > 0 ? "#dc2626" : "#16a34a"}">NG: ${t.fails}件</div>
        </div>`).join("")}
      </div>`;

    return `
      <article class="doc" data-doc="allergen-log">
        <header class="doc-header">
          <div><h2 class="doc-title">アレルゲン切替確認記録</h2><div class="doc-meta">製品切替時・始業前・終業後のアレルゲン管理確認 ／ 食品表示法 特定原材料対応</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="allergen-log">✨ 本日の確認記録を追加</button>
            <button class="btn btn-tiny" data-list-add="allergenLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${allergenPanelHtml}
        <p style="font-size:11px;color:#64748b;margin-top:0">アレルゲンのチェック欄は「当該アレルゲンが存在しないことを確認した」ときにチェックを入れてください。</p>
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead>
              <tr>
                <th rowspan="2" style="width:115px">日付</th>
                <th rowspan="2" style="width:70px">区分</th>
                <th rowspan="2" style="width:95px">直前製品</th>
                <th colspan="${allergenKeys.length}">アレルゲン残留なし確認</th>
                <th rowspan="2" style="width:65px">洗浄</th>
                <th rowspan="2" style="width:60px">判定</th>
                <th rowspan="2" style="width:75px">担当者</th>
                <th rowspan="2">備考</th>
                <th rowspan="2" style="width:40px"></th>
              </tr>
              <tr>${allergenHeaders}</tr>
            </thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  製品検査記録
// ============================================================
export function renderProductTestLog(state) {
    const list = state.productTestLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「＋ 行を追加」で検査記録を追加してください。</td></tr>`
        : list.map((r, idx) => {
            const isPass = r.judgment === "合格" || r.judgment === "陰性";
            const isFail = r.judgment === "不合格" || r.judgment === "陽性";
            const rowStyle = isFail ? "background:#fef2f2" : (isPass ? "background:#f0fdf4" : "");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="productTestLog" data-key="date"        data-index="${idx}" value="${esc(r.date||"")}"></td>
              <td><input type="text" data-list-edit data-list="productTestLog" data-key="lot"          data-index="${idx}" value="${esc(r.lot||"")}" style="width:100%"></td>
              <td>
                <select data-list-edit data-list="productTestLog" data-key="testType" data-index="${idx}">
                  ${["一般生菌数","大腸菌群","黄色ブドウ球菌","サルモネラ","リステリア","大腸菌","カビ・酵母","重金属","残留農薬","金属異物","官能検査","その他"].map(t =>
                    `<option value="${t}" ${r.testType===t?"selected":""}>${t}</option>`).join("")}
                </select>
              </td>
              <td>
                <select data-list-edit data-list="productTestLog" data-key="sampleType" data-index="${idx}">
                  ${["製品","原材料","中間品","環境（拭き取り）","水"].map(t =>
                    `<option value="${t}" ${r.sampleType===t?"selected":""}>${t}</option>`).join("")}
                </select>
              </td>
              <td>
                <select data-list-edit data-list="productTestLog" data-key="method" data-index="${idx}">
                  <option value="社内検査" ${(r.method||"社内検査")==="社内検査"?"selected":""}>社内検査</option>
                  <option value="外注検査" ${r.method==="外注検査"?"selected":""}>外注検査</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="productTestLog" data-key="result"      data-index="${idx}" value="${esc(r.result||"")}" style="width:90px;font-weight:700"></td>
              <td><input type="text" data-list-edit data-list="productTestLog" data-key="standard"    data-index="${idx}" value="${esc(r.standard||"")}" style="width:90px"></td>
              <td>
                <select data-list-edit data-list="productTestLog" data-key="judgment" data-index="${idx}" style="${isFail?"color:#dc2626;font-weight:700":(isPass?"color:#16a34a;font-weight:700":"")}">
                  <option value="" ${!r.judgment?"selected":""}>—</option>
                  ${["合格","不合格","陰性","陽性","判定中"].map(j =>
                    `<option value="${j}" ${r.judgment===j?"selected":""}>${j}</option>`).join("")}
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="productTestLog" data-key="testLab"     data-index="${idx}" value="${esc(r.testLab||"")}" style="width:80px"></td>
              <td><input type="text" data-list-edit data-list="productTestLog" data-key="reportNo"    data-index="${idx}" value="${esc(r.reportNo||"")}" style="width:90px"></td>
              <td><input type="text" data-list-edit data-list="productTestLog" data-key="note"        data-index="${idx}" value="${esc(r.note||"")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="productTestLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    const addPayload = JSON.stringify({ date: today, lot: "", testType: "一般生菌数", sampleType: "製品", method: "外注検査", result: "", standard: "", judgment: "", testLab: "", reportNo: "", note: "" });

    // Product test analytics
    const ptTotal  = list.length;
    const ptFail   = list.filter(r => r.judgment === "不合格" || r.judgment === "陽性").length;
    const ptPass   = list.filter(r => r.judgment === "合格"   || r.judgment === "陰性").length;
    const ptRate   = ptPass + ptFail > 0 ? Math.round(ptPass / (ptPass + ptFail) * 100) : null;
    const ptByType = {};
    list.forEach(r => {
        const k = r.testType || "未分類";
        if (!ptByType[k]) ptByType[k] = { total: 0, fails: 0 };
        ptByType[k].total++;
        if (r.judgment === "不合格" || r.judgment === "陽性") ptByType[k].fails++;
    });
    const topFailTypes = Object.entries(ptByType).filter(([, v]) => v.fails > 0).sort((a, b) => b[1].fails - a[1].fails).slice(0, 3);
    const productTestPanelHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:${ptFail > 0 ? "#fff1f2" : "#f0fdf4"};border:1px solid ${ptFail > 0 ? "#fca5a5" : "#86efac"};border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:${ptFail > 0 ? "#dc2626" : "#166534"};font-weight:600">合格率</div>
          <div style="font-size:22px;font-weight:700;color:${ptFail > 0 ? "#dc2626" : "#16a34a"}">${ptRate !== null ? ptRate + "%" : "—"}</div>
          <div style="font-size:11px;color:#475569">${ptTotal}件中 不合格${ptFail}件</div>
        </div>
        ${topFailTypes.length > 0 ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;min-width:160px">
          <div style="font-size:11px;color:#92400e;font-weight:600">不合格多発 検査項目</div>
          ${topFailTypes.map(([k, v]) => `<div style="font-size:12px;color:#334155;margin-top:3px">${esc(k)}: <strong style="color:#dc2626">${v.fails}件</strong></div>`).join("")}
        </div>` : ""}
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;min-width:120px">
          <div style="font-size:11px;color:#475569;font-weight:600">検査項目数</div>
          <div style="font-size:22px;font-weight:700;color:#334155">${Object.keys(ptByType).length}<span style="font-size:12px;font-weight:400;margin-left:2px">種類</span></div>
          <div style="font-size:11px;color:#475569">累計 ${ptTotal}件</div>
        </div>
      </div>`;

    return `
      <article class="doc" data-doc="product-test-log">
        <header class="doc-header">
          <div><h2 class="doc-title">製品検査記録</h2><div class="doc-meta">微生物・理化学・官能検査の結果を記録 ／ 原則6 検証活動の一環</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="product-test-log">✨ 月次検査テンプレを追加</button>
            <button class="btn btn-tiny" data-list-add="productTestLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${productTestPanelHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">実施日</th>
              <th style="width:100px">ロット</th>
              <th style="width:110px">検査項目</th>
              <th style="width:100px">検体区分</th>
              <th style="width:80px">実施区分</th>
              <th style="width:90px">結果</th>
              <th style="width:90px">基準値</th>
              <th style="width:70px">判定</th>
              <th style="width:90px">検査機関</th>
              <th style="width:90px">報告書No.</th>
              <th>備考</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  製品出荷記録
// ============================================================
export function renderShipmentLog(state) {
    const list = state.shipmentLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「＋ 行を追加」で出荷記録を追加してください。</td></tr>`
        : list.map((r, idx) => {
            const isOk = r.released === true || r.released === "true";
            const rowStyle = isOk ? "background:#f0fdf4" : "";
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="shipmentLog" data-key="date"         data-index="${idx}" value="${esc(r.date||"")}"></td>
              <td><input type="text" data-list-edit data-list="shipmentLog" data-key="lot"           data-index="${idx}" value="${esc(r.lot||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="shipmentLog" data-key="productName"   data-index="${idx}" value="${esc(r.productName||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="shipmentLog" data-key="quantity"      data-index="${idx}" value="${esc(r.quantity||"")}" style="width:80px"></td>
              <td><input type="text" data-list-edit data-list="shipmentLog" data-key="destination"   data-index="${idx}" value="${esc(r.destination||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="shipmentLog" data-key="deliveryNo"    data-index="${idx}" value="${esc(r.deliveryNo||"")}" style="width:90px"></td>
              <td><input type="date" data-list-edit data-list="shipmentLog" data-key="expiryDate"    data-index="${idx}" value="${esc(r.expiryDate||"")}"></td>
              <td>
                <select data-list-edit data-list="shipmentLog" data-key="released" data-index="${idx}" style="${isOk?"color:#16a34a;font-weight:700":""}">
                  <option value="" ${!r.released?"selected":""}>—</option>
                  <option value="true"  ${isOk?"selected":""}>✓ 出荷可</option>
                  <option value="false" ${(!isOk&&r.released)?"selected":""}>保留</option>
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="shipmentLog" data-key="shippedBy"     data-index="${idx}" value="${esc(r.shippedBy||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="shipmentLog" data-key="note"          data-index="${idx}" value="${esc(r.note||"")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="shipmentLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    const pname = state.product?.name || "";
    const addPayload = JSON.stringify({ date: today, lot: "", productName: pname, quantity: "", destination: "", deliveryNo: "", expiryDate: "", released: "", shippedBy: "", note: "" });

    // Shipment analytics
    const shipTotal    = list.length;
    const shipHeld     = list.filter(r => r.released === false || r.released === "false").length;
    const shipReleased = list.filter(r => r.released === true  || r.released === "true").length;
    const totalQty     = list.reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0);
    const destCount    = new Set(list.map(r => r.destination).filter(Boolean)).size;
    const lastShip     = list.filter(r => r.date).sort((a, b) => b.date.localeCompare(a.date))[0];
    const shipPanelHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:${shipHeld > 0 ? "#fff7ed" : "#f0fdf4"};border:1px solid ${shipHeld > 0 ? "#f59e0b" : "#86efac"};border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:${shipHeld > 0 ? "#92400e" : "#166534"};font-weight:600">出荷可否</div>
          <div style="font-size:22px;font-weight:700;color:${shipHeld > 0 ? "#d97706" : "#16a34a"}">${shipReleased}<span style="font-size:12px;font-weight:400;margin-left:2px">/ ${shipTotal}件</span></div>
          <div style="font-size:11px;color:#475569">保留: ${shipHeld}件</div>
        </div>
        ${totalQty > 0 ? `<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:#1e40af;font-weight:600">累計出荷数</div>
          <div style="font-size:22px;font-weight:700;color:#1d4ed8">${totalQty.toLocaleString()}</div>
          <div style="font-size:11px;color:#475569">${destCount}先へ出荷</div>
        </div>` : ""}
        ${lastShip ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:#475569;font-weight:600">最終出荷</div>
          <div style="font-size:14px;font-weight:700;color:#334155">${esc(lastShip.date || "—")}</div>
          <div style="font-size:11px;color:#475569">${esc(lastShip.destination || "—")} / ${esc(lastShip.lot || "—")}</div>
        </div>` : ""}
      </div>`;

    return `
      <article class="doc" data-doc="shipment-log">
        <header class="doc-header">
          <div><h2 class="doc-title">製品出荷記録</h2><div class="doc-meta">製品の出荷先・ロット・数量を記録 ／ トレーサビリティ確保</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="shipment-log">✨ 本日の出荷記録を追加</button>
            <button class="btn btn-tiny" data-list-add="shipmentLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${shipPanelHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">出荷日</th>
              <th style="width:110px">ロット</th>
              <th>製品名</th>
              <th style="width:80px">数量</th>
              <th>出荷先</th>
              <th style="width:90px">伝票No.</th>
              <th style="width:115px">消費・賞味期限</th>
              <th style="width:75px">出荷判定</th>
              <th style="width:75px">担当者</th>
              <th>備考</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  クレーム対応記録
// ============================================================
export function renderComplaintLog(state) {
    const list = state.complaintLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = list.length === 0
        ? `<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「＋ 行を追加」でクレーム記録を追加してください。</td></tr>`
        : list.map((r, idx) => {
            const isClosed = r.status === "完了";
            const isOpen = r.status === "対応中" || r.status === "未着手";
            const rowStyle = isOpen ? "background:#fffbeb" : (isClosed ? "background:#f0fdf4" : "");
            return `
            <tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="complaintLog" data-key="receivedDate"  data-index="${idx}" value="${esc(r.receivedDate||"")}"></td>
              <td><input type="text" data-list-edit data-list="complaintLog" data-key="claimNo"        data-index="${idx}" value="${esc(r.claimNo||"")}" style="width:80px"></td>
              <td><input type="text" data-list-edit data-list="complaintLog" data-key="customer"       data-index="${idx}" value="${esc(r.customer||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="complaintLog" data-key="lot"            data-index="${idx}" value="${esc(r.lot||"")}" style="width:95px"></td>
              <td>
                <select data-list-edit data-list="complaintLog" data-key="category" data-index="${idx}">
                  ${["異物混入","異味・異臭","変色・変質","品温不良","アレルゲン","表示誤り","数量不足","その他"].map(t =>
                    `<option value="${t}" ${r.category===t?"selected":""}>${t}</option>`).join("")}
                </select>
              </td>
              <td><textarea data-list-edit data-list="complaintLog" data-key="content" data-index="${idx}" rows="2" style="width:100%">${esc(r.content||"")}</textarea></td>
              <td><textarea data-list-edit data-list="complaintLog" data-key="action"  data-index="${idx}" rows="2" style="width:100%">${esc(r.action||"")}</textarea></td>
              <td><input type="date" data-list-edit data-list="complaintLog" data-key="closedDate"    data-index="${idx}" value="${esc(r.closedDate||"")}"></td>
              <td>
                <select data-list-edit data-list="complaintLog" data-key="status" data-index="${idx}" style="${isOpen?"color:#d97706;font-weight:700":(isClosed?"color:#16a34a;font-weight:700":"")}">
                  ${["未着手","対応中","完了"].map(s => `<option value="${s}" ${(r.status||"未着手")===s?"selected":""}>${s}</option>`).join("")}
                </select>
              </td>
              <td><input type="text" data-list-edit data-list="complaintLog" data-key="responsible"   data-index="${idx}" value="${esc(r.responsible||"")}" style="width:75px"></td>
              <td><input type="text" data-list-edit data-list="complaintLog" data-key="note"          data-index="${idx}" value="${esc(r.note||"")}" style="width:100%"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="complaintLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    // Summary stats
    const openCount    = list.filter(r => r.status !== "完了").length;
    const closedCount  = list.filter(r => r.status === "完了").length;
    const catCounts    = {};
    list.forEach(r => { const c = r.category || "その他"; catCounts[c] = (catCounts[c] || 0) + 1; });
    const topCat       = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0, 5);
    const complaintSummaryHtml = list.length === 0 ? "" : `
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px" class="no-print">
        <div style="border:1px solid var(--c-border);border-radius:8px;padding:10px 14px;text-align:center;min-width:80px">
          <div style="font-size:22px;font-weight:700;color:var(--c-text)">${list.length}</div>
          <div style="font-size:11px;color:var(--c-text-muted)">累計件数</div>
        </div>
        <div style="border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;text-align:center;min-width:80px;background:${openCount>0?"#fffbeb":"var(--c-surface)"}">
          <div style="font-size:22px;font-weight:700;color:${openCount>0?"#d97706":"var(--c-text-muted)"}">${openCount}</div>
          <div style="font-size:11px;color:#92400e">対応中・未着手</div>
        </div>
        <div style="border:1px solid #86efac;border-radius:8px;padding:10px 14px;text-align:center;min-width:80px;background:#f0fdf4">
          <div style="font-size:22px;font-weight:700;color:#16a34a">${closedCount}</div>
          <div style="font-size:11px;color:#166534">完了</div>
        </div>
        ${topCat.length ? `<div style="border:1px solid var(--c-border);border-radius:8px;padding:10px 14px;flex:1;min-width:180px">
          <div style="font-size:11px;color:var(--c-text-muted);margin-bottom:4px;font-weight:600">種別内訳 (上位)</div>
          ${topCat.map(([cat, cnt]) => `
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
              <div style="flex:1;font-size:11px">${esc(cat)}</div>
              <div style="background:#e2e8f0;border-radius:2px;height:8px;width:${Math.round(cnt/list.length*80)}px;min-width:4px"></div>
              <div style="font-size:11px;font-weight:600;min-width:20px;text-align:right">${cnt}</div>
            </div>`).join("")}
        </div>` : ""}
      </div>`;

    const addPayload = JSON.stringify({ receivedDate: today, claimNo: "", customer: "", lot: "", category: "異物混入", content: "", action: "", closedDate: "", status: "未着手", responsible: "", note: "" });
    return `
      <article class="doc" data-doc="complaint-log">
        <header class="doc-header">
          <div><h2 class="doc-title">クレーム対応記録</h2><div class="doc-meta">顧客クレームの受付・原因調査・対応履歴を管理 ／ 是正処置・再発防止に連動</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="complaint-log">✨ 新規クレームを追加</button>
            <button class="btn btn-tiny" data-list-add="complaintLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 行を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${complaintSummaryHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:115px">受付日</th>
              <th style="width:80px">クレームNo</th>
              <th style="width:120px">顧客名</th>
              <th style="width:100px">ロット</th>
              <th style="width:90px">クレーム種別</th>
              <th>内容</th>
              <th>対応内容</th>
              <th style="width:115px">完了日</th>
              <th style="width:70px">状態</th>
              <th style="width:75px">担当者</th>
              <th>備考</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

// ============================================================
//  ルーティング: 原則1〜7 / 不適合・是正
// ============================================================
export function renderPrinciple(key, state) {
    if (!state?.product?.name && !["ingredient-desc", "nonconformance-actions", "corrective-actions", "monthly-report", "internal-audit", "supplier-audit", "lot-trace", "recall-log", "annual-calendar", "document-register", "production-log", "label-check-log", "environment-log", "pest-control-log", "facility-log", "annual-review"].includes(key)) {
        return `<div class="doc"><div class="empty">先にウィザードから製品情報を入力してください。<br><br><button class="btn btn-primary" onclick="location.hash='#/wizard'">入力ウィザードへ</button></div></div>`;
    }
    switch (key) {
        case "ingredient-desc":        return renderIngredientDescriptions(state);
        case "hazard-extractions":     return renderHazardExtractions(state);
        case "hazard-evaluations":     return renderHazardEvaluations(state);
        case "control-measures":       return renderControlMeasures(state);
        case "oprp-plan":              return renderOprpPlan(state);
        case "ccp-plan":               return renderCcpPlan(state);
        case "verifications":          return renderVerifications(state);
        case "ccp-monitoring-log":     return renderCcpMonitoringLog(state);
        case "receiving-log":          return renderReceivingLog(state);
        case "sanitation-log":         return renderSanitationLog(state);
        case "health-log":             return renderHealthLog(state);
        case "temperature-log":        return renderTemperatureLog(state);
        case "calibration-log":       return renderCalibrationLog(state);
        case "allergen-log":          return renderAllergenLog(state);
        case "product-test-log":      return renderProductTestLog(state);
        case "shipment-log":          return renderShipmentLog(state);
        case "complaint-log":         return renderComplaintLog(state);
        case "water-log":             return renderWaterLog(state);
        case "training-log":          return renderTrainingLog(state);
        case "nonconformance-log":     return renderNonconformanceLog(state);
        case "nonconformance-actions": return renderNonconformanceActions(state);
        case "corrective-actions":     return renderCorrectiveActions(state);
        case "monthly-report":         return renderMonthlyReport(state);
        case "internal-audit":         return renderInternalAudit(state);
        case "supplier-audit":         return renderSupplierAudit(state);
        case "lot-trace":              return renderLotTrace(state);
        case "recall-log":             return renderRecallLog(state);
        case "annual-calendar":        return renderAnnualCalendar(state);
        case "document-register":      return renderDocumentRegister(state);
        case "production-log":         return renderProductionLog(state);
        case "label-check-log":        return renderLabelCheckLog(state);
        case "environment-log":        return renderEnvironmentLog(state);
        case "pest-control-log":       return renderPestControlLog(state);
        case "facility-log":           return renderFacilityLog(state);
        case "annual-review":          return renderAnnualReview(state);
        default: return `<div class="doc"><div class="empty">未対応: ${esc(key)}</div></div>`;
    }
}

// ============================================================
//  月次HACCP管理報告書
// ============================================================
export function renderMonthlyReport(state) {
    const selectedYm = state.monthlyReportMonth || new Date().toISOString().slice(0, 7);
    const [selYear, selMon] = selectedYm.split("-").map(Number);
    const now = new Date(selYear, selMon - 1, 1);
    const ym = selectedYm;
    const monthLabel = `${selYear}年${selMon}月`;
    const monthStart = `${ym}-01`;
    const monthEnd  = new Date(selYear, selMon, 0).toISOString().slice(0, 10);
    const prevMon   = selMon === 1 ? 12 : selMon - 1;
    const prevYear  = selMon === 1 ? selYear - 1 : selYear;
    const prevYm2   = `${prevYear}-${String(prevMon).padStart(2, "0")}`;
    const prevStart = `${prevYm2}-01`;
    const prevEnd   = new Date(prevYear, prevMon, 0).toISOString().slice(0, 10);
    const prevLabel = `${prevYear}年${prevMon}月`;

    const inMonth = (list, dateKey) => (list || []).filter(r => r[dateKey] && r[dateKey] >= monthStart && r[dateKey] <= monthEnd);
    const inPrev  = (list, dateKey) => (list || []).filter(r => r[dateKey] && r[dateKey] >= prevStart  && r[dateKey] <= prevEnd);
    const passRate = (list, passKey) => {
        if (!list.length) return "—";
        const ok = list.filter(r => r[passKey] !== false && r[passKey] !== "false").length;
        return `${Math.round(ok / list.length * 100)}% (${ok}/${list.length})`;
    };
    const tdC  = s => `<td style="padding:5px 10px;border:1px solid #e2e8f0;text-align:center">${s}</td>`;
    const tdL  = s => `<td style="padding:5px 10px;border:1px solid #e2e8f0">${s}</td>`;

    const mCcp     = inMonth(state.ccpMonitoringLog, "date");
    const mRecv    = inMonth(state.receivingLog, "date");
    const mSan     = inMonth(state.sanitationLog, "date");
    const mHealth  = inMonth(state.healthLog, "date");
    const mTemp    = inMonth(state.temperatureLog, "date");
    const mWater   = inMonth(state.waterLog, "date");
    const mAllergen = inMonth(state.allergenLog, "date");
    const mCalib   = inMonth(state.calibrationLog, "date");
    const mTest    = inMonth(state.productTestLog, "date");
    const mShip    = inMonth(state.shipmentLog, "date");
    const mComplaint = inMonth(state.complaintLog, "receivedDate");
    const mTrain   = inMonth(state.trainingLog, "date");
    const mProd    = inMonth(state.productionLog, "date");
    const mLabel   = inMonth(state.labelCheckLog, "date");
    const mEnv     = inMonth(state.environmentLog, "date");
    const mPest    = inMonth(state.pestControlLog, "date");
    const mFacility = inMonth(state.facilityLog, "date");
    const mRecall  = inMonth(state.recallLog, "detectedDate");

    const pCcp      = inPrev(state.ccpMonitoringLog, "date");
    const pRecv     = inPrev(state.receivingLog, "date");
    const pSan      = inPrev(state.sanitationLog, "date");
    const pHealth   = inPrev(state.healthLog, "date");
    const pTemp     = inPrev(state.temperatureLog, "date");
    const pWater    = inPrev(state.waterLog, "date");
    const pAllergen = inPrev(state.allergenLog, "date");
    const pCalib    = inPrev(state.calibrationLog, "date");
    const pTest     = inPrev(state.productTestLog, "date");
    const pShip     = inPrev(state.shipmentLog, "date");
    const pComplaint = inPrev(state.complaintLog, "receivedDate");
    const pTrain    = inPrev(state.trainingLog, "date");
    const pProd     = inPrev(state.productionLog, "date");
    const pLabel    = inPrev(state.labelCheckLog, "date");
    const pEnv      = inPrev(state.environmentLog, "date");
    const pPest     = inPrev(state.pestControlLog, "date");
    const pFacility = inPrev(state.facilityLog, "date");
    const pRecall   = inPrev(state.recallLog, "detectedDate");

    const SANIT_KEYS = ["facility", "machines", "waste", "personnel", "pest"];
    const sanPass = mSan.length ? (() => {
        const ok = mSan.filter(r => !SANIT_KEYS.some(k => r[k] === false || r[k] === "false")).length;
        return `${Math.round(ok / mSan.length * 100)}% (${ok}/${mSan.length})`;
    })() : "—";
    const healthPass = mHealth.length ? (() => {
        const ok = mHealth.filter(r => !r.status || r.status === "良好").length;
        return `${Math.round(ok / mHealth.length * 100)}% (${ok}/${mHealth.length})`;
    })() : "—";
    const testPass = mTest.length ? (() => {
        const ok = mTest.filter(r => r.judgment === "合格" || r.judgment === "陰性").length;
        return `${Math.round(ok / mTest.length * 100)}% (${ok}/${mTest.length})`;
    })() : "—";
    const labelPass = mLabel.length ? (() => {
        const ok = mLabel.filter(r => r.result === "合格").length;
        return `${Math.round(ok / mLabel.length * 100)}% (${ok}/${mLabel.length})`;
    })() : "—";
    const envPass = mEnv.length ? (() => {
        const ok = mEnv.filter(r => r.result === "合格").length;
        return `${Math.round(ok / mEnv.length * 100)}% (${ok}/${mEnv.length})`;
    })() : "—";
    const pestOk = mPest.length ? (() => {
        const found = mPest.filter(r => r.found && r.found !== "なし").length;
        return found > 0 ? `侵入確認 ${found}件` : "異常なし";
    })() : "—";
    const facilityOk = mFacility.length ? (() => {
        const ng = mFacility.filter(r => r.status === "要修繕" || r.status === "使用停止").length;
        return ng > 0 ? `要対応 ${ng}件` : "異常なし";
    })() : "—";

    // Production stats
    const prodTotal  = mProd.reduce((s, r) => s + (parseFloat(r.actualQty) || 0), 0);
    const prodDefect = mProd.reduce((s, r) => s + (parseFloat(r.defectQty) || 0), 0);
    const prodYield  = prodTotal > 0 ? Math.round((prodTotal - prodDefect) / prodTotal * 100) : null;
    const prodShifts = [...new Set(mProd.map(r => r.date))].length;
    const prevProdTotal  = pProd.reduce((s, r) => s + (parseFloat(r.actualQty) || 0), 0);
    const prevProdDefect = pProd.reduce((s, r) => s + (parseFloat(r.defectQty) || 0), 0);
    const prevProdYield  = prevProdTotal > 0 ? Math.round((prevProdTotal - prevProdDefect) / prevProdTotal * 100) : null;
    const prevProdShifts = [...new Set(pProd.map(r => r.date))].length;

    const ccpFails      = mCcp.filter(r => r.passed === false || r.passed === "false");
    const ncActions     = (state.nonconformanceActions || []).filter(r => r.occurredAt && r.occurredAt >= monthStart && r.occurredAt <= monthEnd + "Z");
    const cas           = (state.correctiveActions || []).filter(r => r.date && r.date >= monthStart && r.date <= monthEnd);
    const openComplaints = mComplaint.filter(r => r.status !== "完了");
    const openRecalls   = mRecall.filter(r => r.status === "対応中");
    const pestFound     = mPest.filter(r => r.found && r.found !== "なし");
    const facilityNG    = mFacility.filter(r => r.status === "要修繕" || r.status === "使用停止");
    const envFail       = mEnv.filter(r => r.result === "不合格");
    const labelFail     = mLabel.filter(r => r.result !== "合格");

    const delta = (cur, prev) => {
        const d = cur - prev;
        if (d > 0) return `<span style="color:#16a34a;font-size:10px">▲${d}</span>`;
        if (d < 0) return `<span style="color:#dc2626;font-size:10px">▼${Math.abs(d)}</span>`;
        return `<span style="color:#94a3b8;font-size:10px">→</span>`;
    };
    const row = (label, count, prev, rate, warn = false) =>
        `<tr style="${warn ? "background:#fef2f2" : ""}">${tdL(esc(label))}${tdC(esc(String(count)))}${tdC(`${prev} ${delta(count, prev)}`)}${tdC(esc(String(rate)))}</tr>`;

    const issueRows = [
        ...ccpFails.map(r    => `<tr>${tdL(`<span style="color:#dc2626;font-weight:600">CCPモニタリング不合格</span>`)}${tdC(esc(r.date||""))}${tdL(esc(`${r.ccpNo||""} ${r.processName||""} (${r.measuredValue||"—"})`.trim()))}</tr>`),
        ...mRecv.filter(r => r.passed===false||r.passed==="false").map(r => `<tr>${tdL(`<span style="color:#dc2626;font-weight:600">受入不合格</span>`)}${tdC(esc(r.date||""))}${tdL(esc(`${r.ingName||""} (${r.supplier||""})`.trim()))}</tr>`),
        ...mHealth.filter(r  => r.status && r.status!=="良好").map(r   => `<tr>${tdL(`<span style="color:#dc2626;font-weight:600">健康要注意</span>`)}${tdC(esc(r.date||""))}${tdL(esc(`${r.name||""}: ${r.status||""}`))}</tr>`),
        ...mTemp.filter(r    => r.passed===false||r.passed==="false").map(r => `<tr>${tdL(`<span style="color:#d97706;font-weight:600">温度異常</span>`)}${tdC(esc(r.date||""))}${tdL(esc(`${r.unit||""} (${r.measured||"—"}℃)`.trim()))}</tr>`),
        ...envFail.map(r     => `<tr>${tdL(`<span style="color:#dc2626;font-weight:600">環境検査不合格</span>`)}${tdC(esc(r.date||""))}${tdL(esc(`${r.testType||""} / ${r.location||""} — ${r.target||""}: ${r.resultValue||"—"}`))}</tr>`),
        ...labelFail.map(r   => `<tr>${tdL(`<span style="color:#d97706;font-weight:600">食品表示確認NG</span>`)}${tdC(esc(r.date||""))}${tdL(esc(`${r.lot||""} ${r.productName||""} — ${r.result||""}${r.note?" ("+r.note+")":""}`.trim()))}</tr>`),
        ...pestFound.map(r   => `<tr>${tdL(`<span style="color:#d97706;font-weight:600">害虫侵入確認</span>`)}${tdC(esc(r.date||""))}${tdL(esc(`${r.location||""}: ${r.pestType||""} (${r.found||""}) → ${r.action||""}`.trim()))}</tr>`),
        ...facilityNG.map(r  => `<tr>${tdL(`<span style="color:#d97706;font-weight:600">施設設備 ${r.status||"要対応"}</span>`)}${tdC(esc(r.date||""))}${tdL(esc(`${r.area||""} — ${r.target||""}: ${r.detail||""}`.trim()))}</tr>`),
        ...openComplaints.map(r => `<tr>${tdL(`<span style="color:#d97706;font-weight:600">クレーム未完</span>`)}${tdC(esc(r.receivedDate||""))}${tdL(esc(`${r.claimNo||""} ${r.category||""} (${r.customer||""})`.trim()))}</tr>`),
        ...openRecalls.map(r => `<tr>${tdL(`<span style="color:#dc2626;font-weight:600">製品回収 対応中</span>`)}${tdC(esc(r.detectedDate||""))}${tdL(esc(`${r.recallNo||""} ${r.productName||""} / ロット: ${r.lot||""}`.trim()))}</tr>`),
    ];

    const prodDeltaShifts = pProd.length > 0 ? (() => { const d = prodShifts - prevProdShifts; return d > 0 ? `<span style="color:#16a34a;font-size:10px">▲${d}</span>` : d < 0 ? `<span style="color:#dc2626;font-size:10px">▼${Math.abs(d)}</span>` : `<span style="color:#94a3b8;font-size:10px">→</span>`; })() : "";
    const prodDeltaTotal  = pProd.length > 0 ? (() => { const d = prodTotal - prevProdTotal; return d > 0 ? `<span style="color:#16a34a;font-size:10px">▲${d.toLocaleString()}</span>` : d < 0 ? `<span style="color:#dc2626;font-size:10px">▼${Math.abs(d).toLocaleString()}</span>` : `<span style="color:#94a3b8;font-size:10px">→</span>`; })() : "";
    const prodDeltaYield  = (prodYield !== null && prevProdYield !== null) ? (() => { const d = prodYield - prevProdYield; return d > 0 ? `<span style="color:#16a34a;font-size:10px">▲${d}pt</span>` : d < 0 ? `<span style="color:#dc2626;font-size:10px">▼${Math.abs(d)}pt</span>` : `<span style="color:#94a3b8;font-size:10px">→</span>`; })() : "";
    const prodSummaryHtml = mProd.length > 0 ? `
        <h3 style="font-size:13px;font-weight:700;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">2. 製造実績サマリー</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:4px">
          <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:var(--c-primary)">${prodShifts}</div>
            <div style="font-size:11px;color:#64748b">製造日数</div>
            ${pProd.length > 0 ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">前月 ${prevProdShifts}日 ${prodDeltaShifts}</div>` : ""}
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:var(--c-text)">${prodTotal.toLocaleString()}</div>
            <div style="font-size:11px;color:#64748b">総製造数</div>
            ${pProd.length > 0 ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">前月 ${prevProdTotal.toLocaleString()} ${prodDeltaTotal}</div>` : ""}
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#dc2626">${prodDefect.toLocaleString()}</div>
            <div style="font-size:11px;color:#64748b">不良品数</div>
            ${pProd.length > 0 ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">前月 ${prevProdDefect.toLocaleString()}</div>` : ""}
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:${prodYield!==null?(prodYield>=98?"#16a34a":prodYield>=95?"#f59e0b":"#dc2626"):"#94a3b8"}">${prodYield !== null ? prodYield + "%" : "—"}</div>
            <div style="font-size:11px;color:#64748b">良品率</div>
            ${prevProdYield !== null ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">前月 ${prevProdYield}% ${prodDeltaYield}</div>` : ""}
          </div>
        </div>` : "";

    return `
      <article class="doc" data-doc="monthly-report">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">月次HACCP管理報告書 — ${esc(monthLabel)}</h2>
            <div class="doc-meta">${esc(state.organization?.name || "")} ／ 製品: ${esc(state.product?.name || "—")} ／ 管理責任者: ${esc(state.team?.leader || "—")}</div>
          </div>
          <div class="doc-tools no-print" style="display:flex;align-items:center;gap:8px">
            <label style="font-size:12px;color:var(--c-text-muted)">対象月:</label>
            <input type="month" data-monthly-month value="${esc(ym)}" style="font-size:12px;padding:3px 6px;border:1px solid var(--c-border);border-radius:4px">
            <button class="btn btn-tiny" data-action="print">印刷／PDF出力</button>
          </div>
        </header>

        <h3 style="font-size:13px;font-weight:700;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">1. 今月の運用記録 集計 (${esc(monthStart)} 〜 ${esc(monthEnd)})</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f8fafc">
            <th style="padding:6px 10px;text-align:left;border:1px solid #e2e8f0">管理項目</th>
            <th style="padding:6px 10px;text-align:center;border:1px solid #e2e8f0;width:70px">今月</th>
            <th style="padding:6px 10px;text-align:center;border:1px solid #e2e8f0;width:80px">前月 (${esc(prevLabel)})</th>
            <th style="padding:6px 10px;text-align:center;border:1px solid #e2e8f0;width:160px">合格率 / 状態</th>
          </tr></thead>
          <tbody style="border:1px solid #e2e8f0">
            ${row("CCPモニタリング記録", mCcp.length, pCcp.length, passRate(mCcp, "passed"), ccpFails.length > 0)}
            ${row("原材料受入記録", mRecv.length, pRecv.length, passRate(mRecv, "passed"))}
            ${row("衛生点検記録", mSan.length, pSan.length, sanPass)}
            ${row("従事者健康確認", mHealth.length, pHealth.length, healthPass)}
            ${row("冷蔵・冷凍温度記録", mTemp.length, pTemp.length, passRate(mTemp, "passed"))}
            ${row("使用水確認記録", mWater.length, pWater.length, passRate(mWater, "passed"))}
            ${row("アレルゲン確認記録", mAllergen.length, pAllergen.length, passRate(mAllergen, "passed"))}
            ${row("機器校正記録", mCalib.length, pCalib.length, mCalib.length > 0 ? passRate(mCalib.map(r => ({...r, ok: r.result==="合格"})), "ok") : "—")}
            ${row("製品検査記録", mTest.length, pTest.length, testPass)}
            ${row("食品表示確認記録", mLabel.length, pLabel.length, labelPass, labelFail.length > 0)}
            ${row("環境モニタリング記録", mEnv.length, pEnv.length, envPass, envFail.length > 0)}
            ${row("害虫防除点検記録", mPest.length, pPest.length, pestOk, pestFound.length > 0)}
            ${row("施設設備点検記録", mFacility.length, pFacility.length, facilityOk, facilityNG.length > 0)}
            ${row("製造工程日報", mProd.length, pProd.length, mProd.length > 0 ? `${prodShifts}日分` : "—")}
            ${row("出荷記録", mShip.length, pShip.length, "—")}
            ${row("製品回収記録", mRecall.length, pRecall.length, mRecall.length > 0 ? `${mRecall.length - openRecalls.length}件完了 / ${openRecalls.length}件対応中` : "—", openRecalls.length > 0)}
            ${row("クレーム受付", mComplaint.length, pComplaint.length, mComplaint.length > 0 ? `${mComplaint.length - openComplaints.length}件完了 / ${openComplaints.length}件対応中` : "—", openComplaints.length > 0)}
            ${row("教育訓練", mTrain.length, pTrain.length, "—")}
          </tbody>
        </table>

        ${prodSummaryHtml}

        <h3 style="font-size:13px;font-weight:700;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">3. 今月の不適合・是正処置</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f8fafc">
            ${tdL("<strong>区分</strong>")}${tdC("<strong>件数</strong>")}${tdL("<strong>備考</strong>")}
          </tr></thead>
          <tbody>
            <tr>${tdL("CCP逸脱")}${tdC(`<span style="${ccpFails.length > 0 ? "color:#dc2626;font-weight:700" : ""}">${ccpFails.length}</span>`)}${tdL(ccpFails.map(r=>`${r.ccpNo||""} (${r.date||""})`).join("、") || "—")}</tr>
            <tr>${tdL("不適合製品処置書発行")}${tdC(ncActions.length)}${tdL(ncActions.map(r=>r.identNo||r.id||"").join("、") || "—")}</tr>
            <tr>${tdL("是正処置書発行")}${tdC(cas.length)}${tdL(cas.map(r=>r.identNo||r.id||"").join("、") || "—")}</tr>
            <tr>${tdL("製品回収")}${tdC(`<span style="${openRecalls.length > 0 ? "color:#dc2626;font-weight:700" : ""}">${mRecall.length}</span>`)}${tdL(mRecall.map(r=>`${r.recallNo||""} (${r.status||""})`).join("、") || "—")}</tr>
          </tbody>
        </table>

        ${issueRows.length > 0 ? `
        <h3 style="font-size:13px;font-weight:700;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">4. 要対応事項一覧 (${issueRows.length}件)</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#fef2f2">
            <th style="padding:6px 10px;border:1px solid #fca5a5;text-align:left;width:160px">種別</th>
            <th style="padding:6px 10px;border:1px solid #fca5a5;width:100px">日付</th>
            <th style="padding:6px 10px;border:1px solid #fca5a5;text-align:left">内容</th>
          </tr></thead>
          <tbody>${issueRows.join("")}</tbody>
        </table>` : `
        <h3 style="font-size:13px;font-weight:700;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">4. 要対応事項</h3>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px 14px;font-size:13px;color:#166534">✅ 今月は要対応事項はありませんでした。</div>`}

        <div style="margin-top:36px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;font-size:13px">
          <div style="border-top:1px solid #000;padding-top:6px">管理責任者: ${esc(state.team?.leader || "")}</div>
          <div style="border-top:1px solid #000;padding-top:6px">確認者:</div>
          <div style="border-top:1px solid #000;padding-top:6px">承認者:</div>
        </div>
      </article>`;
}

// ============================================================
//  内部監査チェックリスト
// ============================================================
const AUDIT_CATEGORIES = [
    { category: "ハザード分析",   items: ["危害要因分析が文書化されている", "危害抽出書・ハザード評価表が最新版である", "管理手段選択分類表が適切に完成している"] },
    { category: "CCP管理",        items: ["HACCPプランが文書化されている", "管理基準(CL)が設定されている", "CCPモニタリング記録が毎日記録されている", "CL逸脱時の是正処置が定義されている"] },
    { category: "O-PRP管理",      items: ["O-PRPプランが文書化されている", "O-PRP実施記録が記録されている"] },
    { category: "検証活動",        items: ["検証スケジュールが定められている", "定期的な微生物検査を実施している", "機器校正が計画通り実施されている"] },
    { category: "一般衛生管理",    items: ["衛生点検を日々実施し記録している", "健康確認を毎日実施している", "温度管理記録が適切に行われている", "アレルゲン管理を実施している"] },
    { category: "教育訓練",        items: ["年次訓練計画が策定されている", "全従事者が訓練を受けている", "訓練記録が保存されている"] },
    { category: "記録管理",        items: ["記録の保存期間が定められている (最低2年)", "記録が適切に保管されている"] },
    { category: "クレーム・不適合", items: ["クレーム対応手順が定められている", "不適合製品の隔離手順がある", "是正処置の有効性確認を実施している"] },
];

export function renderInternalAudit(state) {
    const list = state.internalAuditLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const emptyTmpl = JSON.stringify({ date: today, auditor: state.team?.leader || "", scope: "HACCP全体", findings: "", decisions: "", nextDate: "", status: "実施中", checks: {} }).replace(/'/g, "&#39;");

    const auditCards = list.length === 0
        ? `<div class="empty">内部監査記録はまだありません。<br><button class="btn btn-primary" style="margin-top:12px" data-list-add="internalAuditLog" data-template='${emptyTmpl}'>＋ 新規内部監査を開始</button></div>`
        : list.map((audit, idx) => {
            const allItems = AUDIT_CATEGORIES.flatMap(c => c.items);
            const checkedCount = allItems.filter(item => {
                const key = item.slice(0, 20).replace(/\W/g, "_");
                return audit.checks?.[key] === true || audit.checks?.[key] === "true";
            }).length;
            const checkboxes = AUDIT_CATEGORIES.map(cat => `
              <div style="margin-bottom:10px">
                <div style="font-weight:600;font-size:12px;color:#475569;margin-bottom:4px">${esc(cat.category)}</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">
                  ${cat.items.map(item => {
                    const key = item.slice(0, 20).replace(/\W/g, "_");
                    const checked = audit.checks?.[key] === true || audit.checks?.[key] === "true";
                    return `<label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 7px;border:1px solid ${checked ? "#86efac" : "#e2e8f0"};border-radius:4px;background:${checked ? "#f0fdf4" : "white"};cursor:pointer"><input type="checkbox" data-list-edit data-list="internalAuditLog" data-key="checks.${key}" data-index="${idx}" ${checked ? "checked" : ""}>${esc(item)}</label>`;
                  }).join("")}
                </div>
              </div>`).join("");
            return `
              <article class="doc" style="margin-bottom:18px">
                <header class="doc-header">
                  <div>
                    <h2 class="doc-title" style="font-size:16px">内部監査 — ${esc(audit.date || "—")} <span style="font-size:12px;color:#64748b">[${checkedCount}/${allItems.length} 確認済]</span></h2>
                    <div class="doc-meta">監査担当: ${esc(audit.auditor || "—")} ／ 範囲: ${esc(audit.scope || "—")}</div>
                  </div>
                  <div class="doc-tools no-print">
                    <button class="icon-btn danger" data-list-action="remove" data-list="internalAuditLog" data-index="${idx}" title="削除" aria-label="削除">✕</button>
                  </div>
                </header>
                <div class="form-grid" style="margin-bottom:12px">
                  <div class="form-field"><label>実施日</label><input type="date" data-list-edit data-list="internalAuditLog" data-key="date" data-index="${idx}" value="${esc(audit.date||"")}"></div>
                  <div class="form-field"><label>監査担当者</label><input type="text" data-list-edit data-list="internalAuditLog" data-key="auditor" data-index="${idx}" value="${esc(audit.auditor||"")}"></div>
                  <div class="form-field"><label>対象範囲</label><input type="text" data-list-edit data-list="internalAuditLog" data-key="scope" data-index="${idx}" value="${esc(audit.scope||"")}"></div>
                  <div class="form-field"><label>状態</label><select data-list-edit data-list="internalAuditLog" data-key="status" data-index="${idx}">${["実施中","完了","フォローアップ中"].map(s=>`<option value="${s}" ${(audit.status||"実施中")===s?"selected":""}>${s}</option>`).join("")}</select></div>
                  <div class="form-field span-2"><label>監査所見・不適合事項</label><textarea data-list-edit data-list="internalAuditLog" data-key="findings" data-index="${idx}" rows="3">${esc(audit.findings||"")}</textarea></div>
                  <div class="form-field span-2"><label>判定・改善決定事項</label><textarea data-list-edit data-list="internalAuditLog" data-key="decisions" data-index="${idx}" rows="2">${esc(audit.decisions||"")}</textarea></div>
                  <div class="form-field"><label>次回予定日</label><input type="date" data-list-edit data-list="internalAuditLog" data-key="nextDate" data-index="${idx}" value="${esc(audit.nextDate||"")}"></div>
                </div>
                <h4 style="font-size:12px;margin:0 0 8px">チェックリスト（チェック = 適合確認済）</h4>
                ${checkboxes}
              </article>`;
        }).join("");

    // Audit summary
    const allAuditItems = AUDIT_CATEGORIES.flatMap(c => c.items);
    const auditSummaryHtml = list.length === 0 ? "" : (() => {
        const completed  = list.filter(a => a.status === "完了").length;
        const upcoming   = list.map(a => a.nextDate).filter(Boolean).sort()[0];
        const overdue    = upcoming && upcoming < today;
        const avgChecked = list.length > 0
            ? Math.round(list.reduce((s, a) => s + allAuditItems.filter(item => { const k = item.slice(0,20).replace(/\W/g,"_"); return a.checks?.[k]===true||a.checks?.[k]==="true"; }).length, 0) / list.length)
            : 0;
        const avgRate    = allAuditItems.length > 0 ? Math.round(avgChecked / allAuditItems.length * 100) : null;
        return `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px" class="no-print">
          <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;min-width:120px">
            <div style="font-size:11px;color:#1e40af;font-weight:600">実施回数</div>
            <div style="font-size:22px;font-weight:700;color:#1d4ed8">${list.length}<span style="font-size:12px;font-weight:400;margin-left:2px">回</span></div>
            <div style="font-size:11px;color:#475569">完了: ${completed}回</div>
          </div>
          ${avgRate !== null ? `<div style="background:${avgRate >= 80 ? "#f0fdf4" : "#fff7ed"};border:1px solid ${avgRate >= 80 ? "#86efac" : "#f59e0b"};border-radius:8px;padding:10px 14px;min-width:130px">
            <div style="font-size:11px;color:${avgRate >= 80 ? "#166534" : "#92400e"};font-weight:600">平均確認率</div>
            <div style="font-size:22px;font-weight:700;color:${avgRate >= 80 ? "#16a34a" : "#d97706"}">${avgRate}%</div>
            <div style="font-size:11px;color:#475569">平均 ${avgChecked}/${allAuditItems.length}項目</div>
          </div>` : ""}
          ${upcoming ? `<div style="background:${overdue ? "#fff1f2" : "#f8fafc"};border:1px solid ${overdue ? "#fca5a5" : "#e2e8f0"};border-radius:8px;padding:10px 14px;min-width:130px">
            <div style="font-size:11px;color:${overdue ? "#dc2626" : "#475569"};font-weight:600">次回予定日</div>
            <div style="font-size:16px;font-weight:700;color:${overdue ? "#dc2626" : "#334155"}">${esc(upcoming)}</div>
            <div style="font-size:11px;color:${overdue ? "#dc2626" : "#94a3b8"}">${overdue ? "⚠ 期限超過" : ""}</div>
          </div>` : ""}
        </div>`;
    })();

    return `
      <header class="doc-header" style="margin-bottom:8px">
        <div><h2 class="doc-title">内部監査チェックリスト</h2><div class="doc-meta">${list.length} 件 ／ HACCPシステムの年次内部監査記録</div></div>
        <div class="doc-tools no-print">
          <button class="btn btn-tiny btn-primary" data-list-add="internalAuditLog" data-template='${emptyTmpl}'>＋ 新規内部監査を開始</button>
          <button class="btn btn-tiny" data-action="excel">Excel出力</button>
        </div>
      </header>
      ${auditSummaryHtml}
      ${auditCards}`;
}

// ============================================================
//  仕入先評価記録
// ============================================================
export function renderSupplierAudit(state) {
    const list = state.supplierAuditLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const addPayload = JSON.stringify({ date: today, supplier: "", product: "", auditType: "書類審査", result: "適合", score: "", certifications: "", issues: "", nextDate: "", responsible: state.team?.leader || "", note: "" });

    const tbody = list.length === 0
        ? `<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:18px">記録がありません。「＋ 評価記録を追加」で開始してください。</td></tr>`
        : list.map((r, idx) => {
            const isOk = r.result === "適合";
            const isNg = r.result === "不適合" || r.result === "条件付き適合";
            const rowStyle = isNg ? "background:#fffbeb" : (isOk ? "background:#f0fdf4" : "");
            return `<tr style="${rowStyle}">
              <td><input type="date" data-list-edit data-list="supplierAuditLog" data-key="date" data-index="${idx}" value="${esc(r.date||"")}"></td>
              <td><input type="text" data-list-edit data-list="supplierAuditLog" data-key="supplier" data-index="${idx}" value="${esc(r.supplier||"")}" style="width:100%"></td>
              <td><input type="text" data-list-edit data-list="supplierAuditLog" data-key="product" data-index="${idx}" value="${esc(r.product||"")}" style="width:100%"></td>
              <td><select data-list-edit data-list="supplierAuditLog" data-key="auditType" data-index="${idx}">${["書類審査","現地監査","サンプル検査","アンケート調査"].map(t=>`<option value="${t}" ${(r.auditType||"書類審査")===t?"selected":""}>${t}</option>`).join("")}</select></td>
              <td><select data-list-edit data-list="supplierAuditLog" data-key="result" data-index="${idx}" style="${isNg?"color:#d97706;font-weight:700":(isOk?"color:#16a34a;font-weight:700":"")}">${["適合","条件付き適合","不適合","評価中"].map(s=>`<option value="${s}" ${(r.result||"適合")===s?"selected":""}>${s}</option>`).join("")}</select></td>
              <td><input type="number" data-list-edit data-list="supplierAuditLog" data-key="score" data-index="${idx}" value="${esc(r.score||"")}" style="width:55px" min="0" max="100"></td>
              <td><input type="text" data-list-edit data-list="supplierAuditLog" data-key="certifications" data-index="${idx}" value="${esc(r.certifications||"")}" style="width:100%"></td>
              <td><textarea data-list-edit data-list="supplierAuditLog" data-key="issues" data-index="${idx}" rows="2" style="width:100%">${esc(r.issues||"")}</textarea></td>
              <td><input type="date" data-list-edit data-list="supplierAuditLog" data-key="nextDate" data-index="${idx}" value="${esc(r.nextDate||"")}"></td>
              <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="supplierAuditLog" data-index="${idx}" title="削除" aria-label="削除">✕</button></td>
            </tr>`;
        }).join("");

    // Per-supplier summary
    const supplierMap = {};
    list.forEach(r => {
        const name = r.supplier || "—";
        if (!supplierMap[name]) supplierMap[name] = { entries: [], nextDate: "" };
        supplierMap[name].entries.push(r);
        if (r.nextDate && (!supplierMap[name].nextDate || r.nextDate > supplierMap[name].nextDate))
            supplierMap[name].nextDate = r.nextDate;
    });
    const supplierCards = Object.entries(supplierMap).map(([name, { entries, nextDate }]) => {
        const latest = entries.reduce((a, b) => (a.date||"") > (b.date||"") ? a : b);
        const scores = entries.map(e => parseFloat(e.score)).filter(n => !isNaN(n));
        const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
        const ngCount = entries.filter(e => e.result === "不適合" || e.result === "条件付き適合").length;
        const overdue = nextDate && nextDate < today;
        const borderColor = latest.result === "不適合" ? "#dc2626" : latest.result === "条件付き適合" ? "#d97706" : "#86efac";
        const bgColor = latest.result === "不適合" ? "#fef2f2" : latest.result === "条件付き適合" ? "#fffbeb" : "#f0fdf4";
        return `<div style="border:1px solid ${borderColor};border-radius:8px;padding:10px 12px;background:${bgColor};min-width:160px;flex:1 1 160px;max-width:220px">
          <div style="font-weight:700;font-size:12px">${esc(name)}</div>
          <div style="font-size:13px;font-weight:600;color:${latest.result==="適合"?"#16a34a":"#d97706"};margin-top:2px">${esc(latest.result||"—")}</div>
          ${avgScore !== null ? `<div style="font-size:11px;color:var(--c-text-muted)">平均スコア: ${avgScore}点</div>` : ""}
          <div style="font-size:10px;color:var(--c-text-muted);margin-top:2px">最終: ${esc(latest.date||"—")} / ${entries.length}件${ngCount>0?` / 要対応${ngCount}件`:""}</div>
          ${nextDate ? `<div style="font-size:10px;${overdue?"color:#dc2626;font-weight:600":"color:var(--c-text-muted)"}">次回: ${esc(nextDate)}${overdue?" ⚠過":""}</div>` : ""}
        </div>`;
    }).join("");
    const supplierSummaryHtml = list.length === 0 ? "" : `
      <div class="section-block no-print" style="margin-bottom:16px">
        <h3 style="font-size:13px;font-weight:700;margin:0 0 8px">仕入先別 最新評価ステータス</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${supplierCards}</div>
      </div>`;

    return `
      <article class="doc" data-doc="supplier-audit">
        <header class="doc-header">
          <div><h2 class="doc-title">仕入先評価記録</h2><div class="doc-meta">原材料仕入先の衛生・品質管理能力の評価 ／ 年1回以上の定期評価推奨</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny" data-list-add="supplierAuditLog" data-template='${addPayload.replace(/'/g, "&#39;")}'>＋ 評価記録を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel</button>
          </div>
        </header>
        ${supplierSummaryHtml}
        <div style="overflow-x:auto">
          <table class="editable-table">
            <thead><tr>
              <th style="width:110px">評価日</th><th>仕入先名</th><th>対象品目</th>
              <th style="width:90px">評価種別</th><th style="width:80px">判定</th><th style="width:55px">点数</th>
              <th>認証・規格</th><th>指摘事項</th><th style="width:110px">次回予定</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}


// ============================================================
//  ロット追跡照会 (Lot Traceability)
// ============================================================
export function renderLotTrace(state) {
    return `
      <article class="doc" data-doc="lot-trace">
        <header class="doc-header">
          <div><h2 class="doc-title">ロット追跡照会</h2><div class="doc-meta">ロット番号・原材料名・仕入先などで全記録を横断検索 ／ 回収・クレーム対応時に使用</div></div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>
        <div style="margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <input type="text" id="lot-trace-input" placeholder="ロットNo・製品名・原材料名・仕入先など..." style="font-size:14px;padding:8px 12px;border:2px solid var(--c-border);border-radius:6px;width:340px;outline:none" autofocus>
            <button class="btn btn-primary" id="lot-trace-btn">検索</button>
            <span style="font-size:12px;color:var(--c-text-muted)">例: "L20260508" "若鶏もも肉" "〇〇ファーム"</span>
          </div>
        </div>
        <div id="lot-trace-results" style="font-size:13px">
          <div style="color:var(--c-text-muted);padding:20px 0">ロット番号または関連キーワードを入力して検索してください。</div>
        </div>
      </article>`;
}


// ============================================================
//  製品回収記録 (Product Recall Log)
// ============================================================
export function renderRecallLog(state) {
    const rows = state.recallLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const tbody = rows.map((r, i) => `
      <tr>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="recallNo"   value="${esc(r.recallNo||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="detectedDate" type="date" value="${esc(r.detectedDate||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="lot"         value="${esc(r.lot||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="productName" value="${esc(r.productName||state.product?.name||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="recallType">
          ${["自主回収","行政指導回収","クレーム回収","その他"].map(v => `<option${r.recallType===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="cause"       value="${esc(r.cause||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="qty"         value="${esc(r.qty||'')}" style="width:60px"></td>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="destination" value="${esc(r.destination||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="status">
          ${["対応中","回収完了","廃棄完了","クローズ"].map(v => `<option${r.status===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="completedDate" type="date" value="${esc(r.completedDate||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="recallLog" data-index="${i}" data-key="note"        value="${esc(r.note||'')}"></td>
        <td class="no-print"><button class="btn btn-tiny btn-danger" data-list-action="remove" data-list="recallLog" data-index="${i}">削除</button></td>
      </tr>`).join('');
    // Recall analytics
    const openRecalls    = rows.filter(r => r.status === "対応中").length;
    const closedRecalls  = rows.filter(r => r.status === "クローズ" || r.status === "廃棄完了" || r.status === "回収完了").length;
    const recallByType   = {};
    rows.forEach(r => { const k = r.recallType || "未分類"; recallByType[k] = (recallByType[k] || 0) + 1; });
    const recallPanelHtml = rows.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:${openRecalls > 0 ? "#fff1f2" : "#f0fdf4"};border:1px solid ${openRecalls > 0 ? "#dc2626" : "#86efac"};border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:${openRecalls > 0 ? "#dc2626" : "#166534"};font-weight:600">${openRecalls > 0 ? "⚠ 対応中" : "回収状況"}</div>
          <div style="font-size:22px;font-weight:700;color:${openRecalls > 0 ? "#dc2626" : "#16a34a"}">${openRecalls}<span style="font-size:12px;font-weight:400;margin-left:2px">件 対応中</span></div>
          <div style="font-size:11px;color:#475569">累計${rows.length}件 / 完了${closedRecalls}件</div>
        </div>
        ${Object.entries(recallByType).map(([k, v]) => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;min-width:100px">
          <div style="font-size:11px;color:#475569;font-weight:600">${esc(k)}</div>
          <div style="font-size:20px;font-weight:700;color:#334155">${v}<span style="font-size:12px;font-weight:400;margin-left:2px">件</span></div>
        </div>`).join("")}
      </div>`;

    return `
      <article class="doc" data-doc="recall-log">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">製品回収記録</h2>
            <div class="doc-meta">自主回収・行政指導回収・クレーム回収の対応履歴を管理</div>
          </div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="recall-log">✨ 追加</button>
            <button class="btn btn-tiny" data-list-add="recallLog" data-template='{"recallNo":"RC${new Date().getFullYear()}-001","detectedDate":"${today}","status":"対応中"}'>＋ 手動追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>
        ${recallPanelHtml}
        <div class="section-block">
          <div style="background:var(--c-warning-light,#fff7ed);border:1px solid var(--c-warning,#f59e0b);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--c-text)">
            ⚠️ <strong>回収発生時の手順:</strong> ① 対象ロット特定 → ② 出荷先への連絡・回収指示 → ③ 本記録へ記入 → ④ 不適合処置書・是正処置書と連携
          </div>
          <table class="editable-table" style="font-size:12px">
            <thead><tr>
              <th style="width:90px">回収番号</th>
              <th style="width:95px">発覚日</th>
              <th style="width:90px">ロットNo</th>
              <th>製品名</th>
              <th style="width:90px">回収区分</th>
              <th>原因</th>
              <th style="width:55px">数量</th>
              <th>回収先</th>
              <th style="width:80px">状況</th>
              <th style="width:95px">完了日</th>
              <th>備考</th>
              <th class="no-print" style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
          ${rows.length === 0 ? `<div class="empty" style="padding:20px 0">回収記録はありません。回収発生時に「＋ 追加」から記録してください。</div>` : ''}
        </div>
      </article>`;
}

// ============================================================
//  年間HACCP管理カレンダー (Annual Management Calendar)
// ============================================================
export function renderAnnualCalendar(state) {
    const today = new Date();
    const yr = parseInt(state.annualCalendarYear || today.getFullYear(), 10);

    // Gather due dates from existing logs
    const calib  = state.calibrationLog    || [];
    const train  = state.trainingLog       || [];
    const audit  = state.internalAuditLog  || [];
    const supp   = state.supplierAuditLog  || [];
    const ca     = state.correctiveActions || [];

    // Build events per month [0..11]
    const events = Array.from({length: 12}, () => []);

    const addEv = (dateStr, label, color) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (d.getFullYear() === yr) events[d.getMonth()].push({ d: d.getDate(), label, color });
        // Also show items due in next 90 days from a previous date (overdue)
    };

    calib.forEach(r  => addEv(r.nextDate,              `校正: ${r.equipName||r.equipment||'機器'}`, '#6366f1'));
    train.forEach(r  => addEv(r.date,                  `教育: ${r.theme||'訓練'}`, '#0ea5e9'));
    audit.forEach(r  => addEv(r.auditDate||r.date,     `内部監査`, '#f59e0b'));
    supp.forEach(r   => addEv(r.auditDate||r.date,     `仕入先評価: ${r.supplierName||r.supplier||''}`, '#10b981'));
    ca.forEach(r     => addEv(r.dueDate,               `是正期限: ${r.identNo||''}`, '#ef4444'));

    // Standard yearly HACCP tasks
    const stdTasks = [
        { month: 0,  label: '年度HACCP計画見直し',   color: '#8b5cf6' },
        { month: 3,  label: '春季一斉清掃点検',       color: '#10b981' },
        { month: 5,  label: 'HACCPシステム検証',      color: '#8b5cf6' },
        { month: 8,  label: '秋季一斉清掃点検',       color: '#10b981' },
        { month: 11, label: '年末HACCP評価・報告',    color: '#8b5cf6' },
    ];
    stdTasks.forEach(t => events[t.month].push({ d: null, label: t.label, color: t.color, std: true }));

    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const calHtml = monthNames.map((mn, mi) => {
        const isCurrentMonth = yr === today.getFullYear() && mi === today.getMonth();
        const evList = events[mi].sort((a, b) => (a.d||0) - (b.d||0));
        const evHtml = evList.length
            ? evList.map(e => `<div style="display:flex;align-items:center;gap:4px;font-size:11px;margin:2px 0">
                <span style="width:6px;height:6px;border-radius:50%;background:${e.color};flex-shrink:0;display:inline-block"></span>
                <span style="color:var(--c-text-muted)">${e.d ? e.d + '日 ' : ''}${e.label}${e.std ? ' ★' : ''}</span>
              </div>`).join('')
            : `<div style="font-size:11px;color:var(--c-border);padding:4px 0">予定なし</div>`;
        return `<div style="border:${isCurrentMonth ? '2px solid var(--c-primary)' : '1px solid var(--c-border)'};border-radius:8px;padding:10px;background:${isCurrentMonth ? 'var(--c-primary-light,#eff6ff)' : 'var(--c-surface)'}">
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:${isCurrentMonth ? 'var(--c-primary)' : 'var(--c-text)'}">${yr}年 ${mn}${isCurrentMonth ? ' ◀ 今月' : ''}</div>
          ${evHtml}
        </div>`;
    }).join('');

    // Legend
    const legendItems = [
        { color:'#6366f1', label:'機器校正' }, { color:'#0ea5e9', label:'教育訓練' },
        { color:'#f59e0b', label:'内部監査' }, { color:'#10b981', label:'仕入先評価・清掃' },
        { color:'#ef4444', label:'是正処置期限' }, { color:'#8b5cf6', label:'年間定例作業 ★' },
    ];
    const legendHtml = legendItems.map(l =>
        `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;margin-right:12px"><span style="width:10px;height:10px;border-radius:50%;background:${l.color};display:inline-block"></span>${l.label}</span>`
    ).join('');

    return `
      <article class="doc" data-doc="annual-calendar">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">${yr}年 HACCP年間管理カレンダー</h2>
            <div class="doc-meta">校正・監査・教育・是正処置期限を月別に一覧表示 ／ 各記録から自動集計</div>
          </div>
          <div class="doc-tools no-print" style="display:flex;align-items:center;gap:8px">
            <label style="font-size:12px;color:var(--c-text-muted)">年度:</label>
            <select data-annual-calendar-year style="font-size:12px;padding:3px 6px;border:1px solid var(--c-border);border-radius:4px">
              ${[yr-2, yr-1, yr, yr+1].map(y => `<option value="${y}"${y===yr?" selected":""}>${y}年</option>`).join("")}
            </select>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>
        <div style="margin-bottom:12px;padding:8px 12px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:6px">
          ${legendHtml}
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${calHtml}
        </div>
        <div style="margin-top:16px;font-size:11px;color:var(--c-text-muted)">
          ★ 年間定例作業は目安日程です。実施記録は各記録書に入力してください。データは各運用記録から自動反映されます。
        </div>
      </article>`;
}


// ============================================================
//  HACCP文書管理台帳 (Document Control Register)
// ============================================================
export function renderDocumentRegister(state) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = state.documentRegister || [];
    const displayRows = rows.length > 0 ? rows : buildDocumentList(state);

    const statusColor = s => ({ "最新版": "var(--c-success)", "改訂中": "#f59e0b", "廃止": "var(--c-danger,#ef4444)", "保留中": "#64748b" }[s] || "var(--c-text-muted)");
    const byCategory = displayRows.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; }, {});
    const overdue = displayRows.filter(r => r.nextReviewDate && r.nextReviewDate <= today && r.status !== "廃止");
    const pendingRevision = displayRows.filter(r => r.status === "改訂中");

    const statsHtml = `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;min-width:100px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:var(--c-primary)">${displayRows.length}</div>
          <div style="font-size:11px;color:var(--c-text-muted)">登録文書数</div>
        </div>
        ${Object.entries(byCategory).map(([cat, cnt]) => `
        <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;min-width:90px;text-align:center">
          <div style="font-size:18px;font-weight:700">${cnt}</div>
          <div style="font-size:10px;color:var(--c-text-muted)">${esc(cat)}</div>
        </div>`).join('')}
        ${overdue.length > 0 ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 16px;min-width:90px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#f59e0b">${overdue.length}</div>
          <div style="font-size:10px;color:#92400e">レビュー期限超過</div>
        </div>` : ''}
        ${pendingRevision.length > 0 ? `<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:10px 16px;min-width:90px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#d97706">${pendingRevision.length}</div>
          <div style="font-size:10px;color:#92400e">改訂中</div>
        </div>` : ''}
      </div>`;

    if (rows.length === 0) {
        // Read-only preview with init button
        const tbody = displayRows.map(r => `
          <tr style="${r.nextReviewDate && r.nextReviewDate <= today && r.status !== "廃止" ? "background:#fffbeb" : ""}">
            <td style="padding:5px 8px;border:1px solid var(--c-border);font-size:11px;color:var(--c-text-muted)">${esc(r.docId||'')}</td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);font-size:12px"><strong>${esc(r.docName||'')}</strong></td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);font-size:11px">${esc(r.category||'')}</td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);text-align:center;font-size:12px">${esc(r.revision||'1.0')}</td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);font-size:11px">${esc(r.approvedDate||'')}</td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);font-size:11px;${r.nextReviewDate && r.nextReviewDate <= today ? "color:#d97706;font-weight:600" : ""}">${esc(r.nextReviewDate||'')}</td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);font-size:11px">${esc(r.responsible||'')}</td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);text-align:center"><span style="font-size:11px;font-weight:600;color:${statusColor(r.status)}">${esc(r.status||'最新版')}</span></td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);font-size:11px">${esc(r.location||'')}</td>
            <td style="padding:5px 8px;border:1px solid var(--c-border);font-size:11px">${esc(r.note||'')}</td>
          </tr>`).join('');
        return `
          <article class="doc" data-doc="document-register">
            <header class="doc-header">
              <div><h2 class="doc-title">HACCP文書管理台帳</h2><div class="doc-meta">全HACCP関連文書の版管理・改訂履歴・レビュー期限を一元管理</div></div>
              <div class="doc-tools no-print" style="display:flex;gap:8px;align-items:center">
                <button class="btn btn-tiny btn-primary" data-action="init-document-register" title="自動生成一覧を台帳にコピーして編集可能にします">台帳を初期化して編集</button>
                <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
              </div>
            </header>
            <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:6px;padding:10px 14px;font-size:12px;color:#92400e;margin-bottom:12px" class="no-print">
              ℹ️ 現在は自動生成プレビューを表示中です。「台帳を初期化して編集」をクリックすると、版番号・承認日などを編集できるようになります。
            </div>
            ${statsHtml}
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;font-size:12px">
                <thead><tr style="background:var(--c-surface)">
                  <th style="padding:6px 8px;border:1px solid var(--c-border);width:70px">文書番号</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border)">文書名</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border);width:90px">区分</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border);width:50px">版</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border);width:95px">承認日</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border);width:95px">次回見直し</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border);width:90px">管理責任者</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border);width:70px">状態</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border)">保管場所</th>
                  <th style="padding:6px 8px;border:1px solid var(--c-border)">備考</th>
                </tr></thead>
                <tbody>${tbody}</tbody>
              </table>
            </div>
          </article>`;
    }

    // Editable mode
    const STATUS_OPTS = ["最新版","改訂中","廃止","保留中"];
    const CATEGORY_OPTS = ["HACCP計画","管理計画","運用記録","不適合管理","検証・監査","その他"];
    const addTmpl = JSON.stringify({ docId:"", docName:"", category:"運用記録", revision:"1.0", approvedDate:today, nextReviewDate:"", responsible: state.team?.leader||"", status:"最新版", location:"", note:"" }).replace(/'/g,"&#39;");
    const tbody = rows.map((r, i) => {
        const isOverdue = r.nextReviewDate && r.nextReviewDate <= today && r.status !== "廃止";
        return `<tr style="${isOverdue ? "background:#fffbeb" : ""}">
          <td><input type="text" class="cell-input" style="width:65px" data-list-edit data-list="documentRegister" data-key="docId" data-index="${i}" value="${esc(r.docId||'')}"></td>
          <td><input type="text" class="cell-input" data-list-edit data-list="documentRegister" data-key="docName" data-index="${i}" value="${esc(r.docName||'')}"></td>
          <td><select class="cell-input" data-list-edit data-list="documentRegister" data-key="category" data-index="${i}">${CATEGORY_OPTS.map(o=>`<option${(r.category||"")=== o?" selected":""}>${o}</option>`).join('')}</select></td>
          <td><input type="text" class="cell-input" style="width:45px;text-align:center" data-list-edit data-list="documentRegister" data-key="revision" data-index="${i}" value="${esc(r.revision||'1.0')}"></td>
          <td><input type="date" class="cell-input" data-list-edit data-list="documentRegister" data-key="approvedDate" data-index="${i}" value="${esc(r.approvedDate||'')}"></td>
          <td><input type="date" class="cell-input" style="${isOverdue?"border-color:#f59e0b":""}" data-list-edit data-list="documentRegister" data-key="nextReviewDate" data-index="${i}" value="${esc(r.nextReviewDate||'')}"></td>
          <td><input type="text" class="cell-input" data-list-edit data-list="documentRegister" data-key="responsible" data-index="${i}" value="${esc(r.responsible||'')}"></td>
          <td><select class="cell-input" style="color:${statusColor(r.status||'最新版')};font-weight:600" data-list-edit data-list="documentRegister" data-key="status" data-index="${i}">${STATUS_OPTS.map(o=>`<option value="${o}" style="color:${statusColor(o)}"${(r.status||"最新版")===o?" selected":""}>${o}</option>`).join('')}</select></td>
          <td><input type="text" class="cell-input" data-list-edit data-list="documentRegister" data-key="location" data-index="${i}" value="${esc(r.location||'')}"></td>
          <td><input type="text" class="cell-input" data-list-edit data-list="documentRegister" data-key="note" data-index="${i}" value="${esc(r.note||'')}"></td>
          <td style="text-align:center"><button class="icon-btn danger" data-list-action="remove" data-list="documentRegister" data-index="${i}" title="削除" aria-label="削除">✕</button></td>
        </tr>`;
    }).join('');
    return `
      <article class="doc" data-doc="document-register">
        <header class="doc-header">
          <div><h2 class="doc-title">HACCP文書管理台帳</h2><div class="doc-meta">${rows.length} 件登録 ／ 版管理・改訂履歴・レビュー期限を一元管理</div></div>
          <div class="doc-tools no-print" style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-tiny" data-list-add="documentRegister" data-template='${addTmpl}'>＋ 文書を追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
            <button class="btn btn-tiny" data-action="excel">Excel出力</button>
          </div>
        </header>
        ${statsHtml}
        ${overdue.length > 0 ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:6px;padding:8px 14px;font-size:12px;color:#92400e;margin-bottom:10px">⚠️ レビュー期限超過 ${overdue.length}件: ${overdue.map(r=>esc(r.docName||r.docId||"")||"—").join("、")}</div>` : ""}
        <div style="overflow-x:auto">
          <table class="editable-table" style="font-size:12px">
            <thead><tr>
              <th style="width:70px">文書番号</th><th>文書名</th><th style="width:90px">区分</th>
              <th style="width:50px">版</th><th style="width:105px">承認日</th><th style="width:105px">次回見直し</th>
              <th style="width:90px">管理責任者</th><th style="width:75px">状態</th>
              <th>保管場所</th><th>備考</th><th style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </article>`;
}

function buildDocumentList(state) {
    const leader = state.team?.leader || "HACCP責任者";
    const yr = new Date().getFullYear();
    const reviewDate = `${yr + 1}-03-31`;

    return [
        // HACCP計画書類
        { docId:"HD-01", docName:"HACCPチーム名簿",              category:"HACCP計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-02", docName:"製品説明書",                    category:"HACCP計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-03", docName:"フローダイアグラム",             category:"HACCP計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-04", docName:"危害要因分析表",                category:"HACCP計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-05", docName:"HACCPプラン",                  category:"HACCP計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-06", docName:"O-PRPプラン",                  category:"HACCP計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        { docId:"HD-07", docName:"ハザード評価表",               category:"HACCP計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"HACCP管理フォルダ", note:"" },
        // 管理計画
        { docId:"PP-01", docName:"一般衛生管理計画（PRP）",       category:"管理計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"衛生管理フォルダ", note:"" },
        { docId:"PP-02", docName:"アレルゲン管理手順",           category:"管理計画", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"衛生管理フォルダ", note:"" },
        // 運用記録
        { docId:"RC-01", docName:"CCPモニタリング記録",          category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-02", docName:"原材料受入記録",               category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-03", docName:"衛生点検・清掃消毒記録",       category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-04", docName:"従事者健康確認記録",           category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-05", docName:"冷蔵・冷凍温度記録",          category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-06", docName:"機器校正記録",                 category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-07", docName:"製品検査記録",                 category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-08", docName:"製品出荷記録",                 category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-09", docName:"クレーム対応記録",             category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        { docId:"RC-10", docName:"教育訓練記録",                 category:"運用記録", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"記録ファイル", note:"" },
        // 不適合・改善
        { docId:"NC-01", docName:"不適合製品処置書（4-2）",      category:"不適合管理", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"不適合管理フォルダ", note:"" },
        { docId:"NC-02", docName:"不適合管理表（4-3）",          category:"不適合管理", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"不適合管理フォルダ", note:"" },
        { docId:"NC-03", docName:"是正処置書（5-1）",            category:"不適合管理", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"不適合管理フォルダ", note:"" },
        // 検証・監査
        { docId:"VF-01", docName:"検証記録（原則6）",            category:"検証・監査", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"検証フォルダ", note:"" },
        { docId:"VF-02", docName:"内部監査チェックリスト",       category:"検証・監査", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"検証フォルダ", note:"" },
        { docId:"VF-03", docName:"仕入先評価記録",               category:"検証・監査", revision:"1.0", approvedDate:`${yr}-04-01`, nextReviewDate:reviewDate, responsible:leader, status:"最新版", location:"検証フォルダ", note:"" },
    ];
}

// ============================================================
//  製造工程日報 (Daily Production Log)
// ============================================================
export function renderProductionLog(state) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = state.productionLog || [];
    const tbody = rows.map((r, i) => `
      <tr>
        <td><input class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="date" type="date" value="${esc(r.date||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="shift">
          ${["日勤","夜勤","早番","遅番"].map(v=>`<option${r.shift===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="productName" value="${esc(r.productName||state.product?.name||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="lot"          value="${esc(r.lot||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="planQty"      value="${esc(r.planQty||'')}" style="width:70px"></td>
        <td><input class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="actualQty"    value="${esc(r.actualQty||'')}" style="width:70px"></td>
        <td><input class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="defectQty"    value="${esc(r.defectQty||'0')}" style="width:55px"></td>
        <td><input class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="operator"     value="${esc(r.operator||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="ccpOk">
          ${["合格","要確認","不合格"].map(v=>`<option${r.ccpOk===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><select class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="cleaningOk">
          ${["実施","未実施","一部実施"].map(v=>`<option${r.cleaningOk===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="productionLog" data-index="${i}" data-key="note"         value="${esc(r.note||'')}"></td>
        <td class="no-print"><button class="btn btn-tiny btn-danger" data-list-action="remove" data-list="productionLog" data-index="${i}">削除</button></td>
      </tr>`).join('');

    const totalActual = rows.reduce((s, r) => s + (parseFloat(r.actualQty) || 0), 0);
    const totalDefect = rows.reduce((s, r) => s + (parseFloat(r.defectQty) || 0), 0);
    const yieldRate  = totalActual > 0 ? Math.round((totalActual - totalDefect) / totalActual * 100) : null;

    // Additional analytics
    const ccpPassCount = rows.filter(r => r.ccpOk === "合格").length;
    const ccpNgCount   = rows.filter(r => r.ccpOk === "不合格").length;
    const ccpRate      = rows.filter(r => r.ccpOk).length > 0 ? Math.round(ccpPassCount / rows.filter(r => r.ccpOk).length * 100) : null;
    const cutoff30     = (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
    const recent30     = rows.filter(r => r.date >= cutoff30);
    const r30Actual    = recent30.reduce((s,r) => s + (parseFloat(r.actualQty)||0), 0);
    const r30Defect    = recent30.reduce((s,r) => s + (parseFloat(r.defectQty)||0), 0);
    const recentYield  = r30Actual > 0 ? Math.round((r30Actual - r30Defect) / r30Actual * 100) : null;

    return `
      <article class="doc" data-doc="production-log">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">製造工程日報</h2>
            <div class="doc-meta">日別製造実績・CCP合否・清掃実施状況を記録</div>
          </div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="production-log">✨ 本日追加</button>
            <button class="btn btn-tiny" data-list-add="productionLog" data-template='{"date":"${today}","shift":"日勤","ccpOk":"合格","cleaningOk":"実施","defectQty":"0"}'>＋ 手動追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>
        ${rows.length >= 3 ? `
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-primary)">${totalActual.toLocaleString()}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">累計製造数</div>
          </div>
          <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-danger,#ef4444)">${totalDefect.toLocaleString()}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">累計不良数</div>
          </div>
          ${yieldRate !== null ? `<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:${yieldRate>=98?'var(--c-success)':yieldRate>=95?'var(--c-warning)':'var(--c-danger,#ef4444)'}">${yieldRate}%</div>
            <div style="font-size:11px;color:var(--c-text-muted)">良品率（累計）</div>
          </div>` : ''}
          ${recentYield !== null ? `<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:${recentYield>=98?'var(--c-success)':recentYield>=95?'var(--c-warning)':'var(--c-danger,#ef4444)'}">${recentYield}%</div>
            <div style="font-size:11px;color:var(--c-text-muted)">良品率（30日）</div>
          </div>` : ''}
          ${ccpRate !== null ? `<div style="background:${ccpNgCount>0?'#fff1f2':'#f0fdf4'};border:1px solid ${ccpNgCount>0?'#fca5a5':'#86efac'};border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:${ccpNgCount>0?'#dc2626':'#16a34a'}">${ccpRate}%</div>
            <div style="font-size:11px;color:${ccpNgCount>0?'#7f1d1d':'#166534'}">CCP合格率 ${ccpNgCount>0?"⚠":""}</div>
          </div>` : ''}
          <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-text)">${rows.length}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">記録件数（日）</div>
          </div>
        </div>` : ''}
        <div class="section-block">
          <table class="editable-table" style="font-size:12px">
            <thead><tr>
              <th style="width:95px">製造日</th>
              <th style="width:65px">シフト</th>
              <th>製品名</th>
              <th style="width:90px">ロットNo</th>
              <th style="width:70px">計画数</th>
              <th style="width:70px">実績数</th>
              <th style="width:55px">不良数</th>
              <th style="width:80px">作業責任者</th>
              <th style="width:75px">CCP判定</th>
              <th style="width:75px">清掃実施</th>
              <th>特記事項</th>
              <th class="no-print" style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
          ${rows.length === 0 ? `<div class="empty" style="padding:20px 0">「＋ 追加」から製造日報を記録してください。</div>` : ''}
        </div>
      </article>`;
}


// ============================================================
//  食品表示確認記録 (Food Label Check Log)
// ============================================================
export function renderLabelCheckLog(state) {
    const rows = state.labelCheckLog || [];
    const today = new Date().toISOString().slice(0, 10);
    const allergenList = (state.product?.allergens || []).join("、") || "未設定";

    const tbody = rows.map((r, i) => `
      <tr>
        <td><input class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="date" type="date" value="${esc(r.date||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="lot"  value="${esc(r.lot||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="productName" value="${esc(r.productName||state.product?.name||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="allergenOk">
          ${["合格","不合格","未確認"].map(v=>`<option${r.allergenOk===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><select class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="expiryOk">
          ${["合格","不合格","未確認"].map(v=>`<option${r.expiryOk===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><select class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="storageOk">
          ${["合格","不合格","未確認"].map(v=>`<option${r.storageOk===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><select class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="weightOk">
          ${["合格","不合格","未確認"].map(v=>`<option${r.weightOk===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><select class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="nutritionOk">
          ${["合格","不合格","未確認","対象外"].map(v=>`<option${r.nutritionOk===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><select class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="result">
          ${["合格","不合格","要確認"].map(v=>`<option${r.result===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="checker"  value="${esc(r.checker||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="labelCheckLog" data-index="${i}" data-key="note"     value="${esc(r.note||'')}"></td>
        <td class="no-print"><button class="btn btn-tiny btn-danger" data-list-action="remove" data-list="labelCheckLog" data-index="${i}">削除</button></td>
      </tr>`).join('');

    const failCount = rows.filter(r => r.result === "不合格" || r.result === "要確認").length;
    const passCount = rows.filter(r => r.result === "合格").length;
    const labelRate = passCount + failCount > 0 ? Math.round(passCount / (passCount + failCount) * 100) : null;
    const labelItems = [
        { key: "allergenOk",  label: "アレルゲン" },
        { key: "expiryOk",    label: "賞味期限" },
        { key: "storageOk",   label: "保存方法" },
        { key: "weightOk",    label: "内容量" },
        { key: "nutritionOk", label: "栄養成分" },
    ];
    const itemFailCounts = labelItems.map(item => ({
        label: item.label,
        fails: rows.filter(r => r[item.key] === "不合格").length,
        total: rows.filter(r => r[item.key] && r[item.key] !== "対象外").length,
    })).filter(s => s.total > 0);
    const labelPanelHtml = rows.length === 0 ? "" : `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" class="no-print">
        <div style="background:${failCount > 0 ? "#fff1f2" : "#f0fdf4"};border:1px solid ${failCount > 0 ? "#fca5a5" : "#86efac"};border-radius:8px;padding:10px 14px;min-width:130px">
          <div style="font-size:11px;color:${failCount > 0 ? "#dc2626" : "#166534"};font-weight:600">総合合格率</div>
          <div style="font-size:22px;font-weight:700;color:${failCount > 0 ? "#dc2626" : "#16a34a"}">${labelRate !== null ? labelRate + "%" : "—"}</div>
          <div style="font-size:11px;color:#475569">${rows.length}件中 要確認${failCount}件</div>
        </div>
        ${itemFailCounts.filter(s => s.fails > 0).map(s => `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;min-width:110px">
          <div style="font-size:11px;color:#92400e;font-weight:600">${esc(s.label)}</div>
          <div style="font-size:20px;font-weight:700;color:#d97706">${s.fails}<span style="font-size:12px;font-weight:400;margin-left:2px">件 NG</span></div>
          <div style="font-size:11px;color:#475569">${s.total}件中</div>
        </div>`).join("")}
      </div>`;

    return `
      <article class="doc" data-doc="label-check-log">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">食品表示確認記録</h2>
            <div class="doc-meta">出荷前の食品表示ラベル内容（アレルゲン・賞味期限・保存方法・内容量・栄養成分）を確認</div>
          </div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="label-check-log">✨ 本日追加</button>
            <button class="btn btn-tiny" data-list-add="labelCheckLog" data-template='{"date":"${today}","allergenOk":"合格","expiryOk":"合格","storageOk":"合格","weightOk":"合格","nutritionOk":"合格","result":"合格"}'>＋ 手動追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>
        ${labelPanelHtml}
        <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:12px">
          <strong>確認対象アレルゲン:</strong> ${esc(allergenList)}
          ${failCount > 0 ? `<span style="margin-left:16px;color:var(--c-danger,#ef4444);font-weight:600">⚠ 不合格/要確認: ${failCount}件</span>` : ''}
        </div>
        <div class="section-block">
          <table class="editable-table" style="font-size:12px">
            <thead><tr>
              <th style="width:95px">確認日</th>
              <th style="width:90px">ロットNo</th>
              <th>製品名</th>
              <th style="width:70px">アレルゲン</th>
              <th style="width:70px">賞味期限</th>
              <th style="width:70px">保存方法</th>
              <th style="width:70px">内容量</th>
              <th style="width:70px">栄養成分</th>
              <th style="width:70px">総合判定</th>
              <th style="width:80px">確認者</th>
              <th>備考</th>
              <th class="no-print" style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
          ${rows.length === 0 ? `<div class="empty" style="padding:20px 0">「＋ 追加」から出荷前の表示確認記録を登録してください。</div>` : ''}
        </div>
      </article>`;
}

// ============================================================
//  環境モニタリング記録 (Environmental Monitoring Log)
// ============================================================
export function renderEnvironmentLog(state) {
    const rows = state.environmentLog || [];
    const today = new Date().toISOString().slice(0, 10);

    const tbody = rows.map((r, i) => `
      <tr>
        <td><input class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="date" type="date" value="${esc(r.date||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="testType">
          ${["拭き取り検査","落下菌検査","空中菌検査","水質検査","ATP測定","その他"].map(v=>`<option${r.testType===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="location" value="${esc(r.location||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="target">
          ${["一般生菌数","大腸菌群","黄色ブドウ球菌","リステリア","サルモネラ","カビ・酵母","ATP値","その他"].map(v=>`<option${r.target===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="standard" value="${esc(r.standard||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="measured" value="${esc(r.measured||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="result">
          ${["合格","不合格","要確認"].map(v=>`<option${r.result===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="tester"  value="${esc(r.tester||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="action"  value="${esc(r.action||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="environmentLog" data-index="${i}" data-key="note"    value="${esc(r.note||'')}"></td>
        <td class="no-print"><button class="btn btn-tiny btn-danger" data-list-action="remove" data-list="environmentLog" data-index="${i}">削除</button></td>
      </tr>`).join('');

    const failCount = rows.filter(r => r.result === "不合格").length;
    const warnCount = rows.filter(r => r.result === "要確認").length;
    const passRate = rows.length > 0 ? Math.round((rows.length - failCount) / rows.length * 100) : null;

    return `
      <article class="doc" data-doc="environment-log">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">環境モニタリング記録</h2>
            <div class="doc-meta">製造環境の微生物検査・拭き取り検査・落下菌検査・ATP測定の記録</div>
          </div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="environment-log">✨ 追加</button>
            <button class="btn btn-tiny" data-list-add="environmentLog" data-template='{"date":"${today}","testType":"拭き取り検査","target":"一般生菌数","result":"合格"}'>＋ 手動追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>
        ${rows.length > 0 ? `
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-primary)">${rows.length}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">総検査数</div>
          </div>
          ${passRate !== null ? `<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:${passRate>=95?'var(--c-success)':passRate>=80?'var(--c-warning,#f59e0b)':'var(--c-danger,#ef4444)'}">${passRate}%</div>
            <div style="font-size:11px;color:var(--c-text-muted)">合格率</div>
          </div>` : ''}
          ${failCount > 0 ? `<div style="background:#fff1f2;border:1px solid #ef4444;border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#ef4444">${failCount}</div>
            <div style="font-size:11px;color:#7f1d1d">不合格</div>
          </div>` : ''}
          ${warnCount > 0 ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f59e0b">${warnCount}</div>
            <div style="font-size:11px;color:#92400e">要確認</div>
          </div>` : ''}
        </div>` : ''}
        <div class="section-block">
          <table class="editable-table" style="font-size:12px">
            <thead><tr>
              <th style="width:95px">検査日</th>
              <th style="width:90px">検査区分</th>
              <th>採取場所</th>
              <th style="width:90px">検査項目</th>
              <th style="width:80px">規格値</th>
              <th style="width:80px">測定値</th>
              <th style="width:65px">判定</th>
              <th style="width:80px">検査担当者</th>
              <th>改善処置</th>
              <th>備考</th>
              <th class="no-print" style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
          ${rows.length === 0 ? `<div class="empty" style="padding:20px 0">「＋ 追加」から環境モニタリング検査結果を登録してください。</div>` : ''}
        </div>
      </article>`;
}


// ============================================================
//  害虫防除記録 (Pest Control Log)
// ============================================================
export function renderPestControlLog(state) {
    const rows = state.pestControlLog || [];
    const today = new Date().toISOString().slice(0, 10);

    const tbody = rows.map((r, i) => `
      <tr>
        <td><input class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="date" type="date" value="${esc(r.date||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="checkType">
          ${["日常点検","月次トラップ確認","定期駆除（外部委託）","緊急対応","その他"].map(v=>`<option${r.checkType===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="location" value="${esc(r.location||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="pestType">
          ${["ゴキブリ","ネズミ","ハエ・蚊","コバエ","アリ","その他昆虫","異物混入（虫体）","未確認"].map(v=>`<option${r.pestType===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td style="text-align:center"><select class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="found">
          ${["なし","あり（微量）","あり（多数）"].map(v=>`<option${r.found===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="action"    value="${esc(r.action||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="pesticide" value="${esc(r.pesticide||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="result">
          ${["問題なし","処置済み","要経過観察","外部業者依頼済み"].map(v=>`<option${r.result===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="inspector" value="${esc(r.inspector||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="pestControlLog" data-index="${i}" data-key="note"      value="${esc(r.note||'')}"></td>
        <td class="no-print"><button class="btn btn-tiny btn-danger" data-list-action="remove" data-list="pestControlLog" data-index="${i}">削除</button></td>
      </tr>`).join('');

    const foundCount = rows.filter(r => r.found && r.found !== "なし").length;
    const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth() - 1);
    const recent = rows.filter(r => r.date && new Date(r.date) >= lastMonth);

    return `
      <article class="doc" data-doc="pest-control-log">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">害虫防除記録</h2>
            <div class="doc-meta">トラップ確認・定期駆除・緊急対応の記録 ／ 一般衛生管理計画（PRP）準拠</div>
          </div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="pest-control-log">✨ 本日追加</button>
            <button class="btn btn-tiny" data-list-add="pestControlLog" data-template='{"date":"${today}","checkType":"日常点検","found":"なし","result":"問題なし"}'>＋ 手動追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>
        ${rows.length > 0 ? `
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-primary)">${rows.length}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">総記録数</div>
          </div>
          <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-primary)">${recent.length}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">直近30日</div>
          </div>
          ${foundCount > 0 ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f59e0b">${foundCount}</div>
            <div style="font-size:11px;color:#92400e">発見件数</div>
          </div>` : `<div style="background:#f0fdf4;border:1px solid var(--c-success);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-success)">0</div>
            <div style="font-size:11px;color:var(--c-text-muted)">発見件数</div>
          </div>`}
        </div>` : ''}
        <div class="section-block">
          <table class="editable-table" style="font-size:12px">
            <thead><tr>
              <th style="width:95px">点検日</th>
              <th style="width:110px">点検区分</th>
              <th>点検場所</th>
              <th style="width:100px">害虫種別</th>
              <th style="width:80px">発見状況</th>
              <th>対応処置</th>
              <th style="width:90px">使用薬剤</th>
              <th style="width:100px">結果</th>
              <th style="width:80px">点検者</th>
              <th>備考</th>
              <th class="no-print" style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
          ${rows.length === 0 ? `<div class="empty" style="padding:20px 0">「＋ 追加」から害虫防除点検記録を登録してください。月1回以上のトラップ確認推奨。</div>` : ''}
        </div>
      </article>`;
}

// ============================================================
//  施設設備点検記録 (Facility & Equipment Inspection Log)
// ============================================================
export function renderFacilityLog(state) {
    const rows = state.facilityLog || [];
    const today = new Date().toISOString().slice(0, 10);

    const statusColor = s => ({ "良好":"var(--c-success)", "要修繕":"var(--c-warning,#f59e0b)", "修繕済み":"var(--c-success)", "使用停止":"var(--c-danger,#ef4444)" }[s] || "var(--c-text)");

    const tbody = rows.map((r, i) => `
      <tr>
        <td><input class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="date" type="date" value="${esc(r.date||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="checkType">
          ${["日常点検","月次点検","四半期点検","年次点検","修繕後確認"].map(v=>`<option${r.checkType===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><select class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="area">
          ${["加工室","冷蔵・冷凍室","倉庫","包装室","トイレ・更衣室","排水設備","換気設備","床・壁・天井","搬入出口","その他"].map(v=>`<option${r.area===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="target"   value="${esc(r.target||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="detail"   value="${esc(r.detail||'')}"></td>
        <td><select class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="status">
          ${["良好","要修繕","修繕済み","使用停止"].map(v=>`<option${r.status===v?" selected":""}>${v}</option>`).join('')}
        </select></td>
        <td><input class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="action"   value="${esc(r.action||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="dueDate"  type="date" value="${esc(r.dueDate||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="inspector" value="${esc(r.inspector||'')}"></td>
        <td><input class="cell-input" data-list-edit data-list="facilityLog" data-index="${i}" data-key="note"     value="${esc(r.note||'')}"></td>
        <td class="no-print"><button class="btn btn-tiny btn-danger" data-list-action="remove" data-list="facilityLog" data-index="${i}">削除</button></td>
      </tr>`).join('');

    const issueCount  = rows.filter(r => r.status === "要修繕" || r.status === "使用停止").length;
    const goodCount   = rows.filter(r => r.status === "良好" || r.status === "修繕済み").length;
    const passRate    = rows.length > 0 ? Math.round(goodCount / rows.length * 100) : null;

    return `
      <article class="doc" data-doc="facility-log">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">施設設備点検記録</h2>
            <div class="doc-meta">製造施設・設備・排水・換気・搬入出口などの定期点検と修繕管理</div>
          </div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny btn-primary" data-template-gen="facility-log">✨ 月次追加</button>
            <button class="btn btn-tiny" data-list-add="facilityLog" data-template='{"date":"${today}","checkType":"月次点検","status":"良好"}'>＋ 手動追加</button>
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>
        ${rows.length > 0 ? `
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--c-primary)">${rows.length}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">総点検数</div>
          </div>
          ${passRate !== null ? `<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:${passRate>=90?'var(--c-success)':'var(--c-warning,#f59e0b)'}">${passRate}%</div>
            <div style="font-size:11px;color:var(--c-text-muted)">良好率</div>
          </div>` : ''}
          ${issueCount > 0 ? `<div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f59e0b">${issueCount}</div>
            <div style="font-size:11px;color:#92400e">要対応</div>
          </div>` : ''}
        </div>` : ''}
        <div class="section-block">
          <table class="editable-table" style="font-size:12px">
            <thead><tr>
              <th style="width:95px">点検日</th>
              <th style="width:100px">点検区分</th>
              <th style="width:90px">エリア</th>
              <th>点検対象</th>
              <th>点検内容・所見</th>
              <th style="width:80px">状態</th>
              <th>修繕・処置内容</th>
              <th style="width:95px">修繕期限</th>
              <th style="width:80px">点検者</th>
              <th>備考</th>
              <th class="no-print" style="width:40px"></th>
            </tr></thead>
            <tbody>${tbody}</tbody>
          </table>
          ${rows.length === 0 ? `<div class="empty" style="padding:20px 0">「＋ 追加」から施設設備の点検記録を登録してください。</div>` : ''}
        </div>
      </article>`;
}

// ============================================================
//  年次HACCPシステムレビュー (Annual HACCP System Review)
// ============================================================
export function renderAnnualReview(state) {
    const yr    = new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);
    const rv    = state.annualReview || {};

    // --- Auto-computed stats for the review year ---
    const yearStr = String(rv.reviewYear || yr);
    const inYear  = r => (r.date || r.detectedDate || r.receivedDate || "").startsWith(yearStr);

    const ccpRecs    = (state.ccpMonitoringLog    || []).filter(inYear);
    const ccpFails   = ccpRecs.filter(r => r.passed === false || r.passed === "false");
    const tempRecs   = (state.temperatureLog      || []).filter(inYear);
    const tempFails  = tempRecs.filter(r => r.passed === false || r.passed === "false");
    const ncActions  = (state.nonconformanceActions || []).filter(inYear);
    const caList     = (state.correctiveActions   || []).filter(inYear);
    const complaints = (state.complaintLog        || []).filter(inYear);
    const audits     = (state.internalAuditLog    || []).filter(inYear);
    const suppAudits = (state.supplierAuditLog    || []).filter(inYear);
    const recalls    = (state.recallLog           || []).filter(inYear);
    const training   = (state.trainingLog         || []).filter(inYear);
    const envFails   = (state.environmentLog      || []).filter(r => inYear(r) && r.result === "不合格");

    const pct = (total, fails) => total === 0 ? "—" : `${Math.round((total - fails) / total * 100)}% (${total - fails}/${total})`;

    const stat = (label, value, note = "") =>
        `<tr><td style="padding:5px 10px;border:1px solid var(--c-border);font-weight:600;width:200px;background:var(--c-bg)">${esc(label)}</td><td style="padding:5px 10px;border:1px solid var(--c-border)">${esc(String(value))}${note ? `<span style="color:var(--c-text-muted);font-size:11px;margin-left:8px">${esc(note)}</span>` : ""}</td></tr>`;

    const statsHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0">
        ${stat("CCPモニタリング 適合率", pct(ccpRecs.length, ccpFails.length), `${ccpRecs.length}件`)}
        ${stat("温度管理 適合率",         pct(tempRecs.length, tempFails.length), `${tempRecs.length}件`)}
        ${stat("環境モニタリング 不合格", `${envFails.length}件`)}
        ${stat("不適合処置件数",           `${ncActions.length}件`)}
        ${stat("是正処置件数",             `${caList.length}件`, caList.filter(r => r.status !== "完了").length + "件未完了")}
        ${stat("クレーム件数",             `${complaints.length}件`, complaints.filter(r => r.status === "対応中" || r.status === "未着手").length + "件未対応")}
        ${stat("内部監査実施回数",         `${audits.length}回`)}
        ${stat("仕入先評価実施件数",       `${suppAudits.length}件`, suppAudits.filter(r => r.result !== "適合").length + "件要対応")}
        ${stat("製品回収件数",             `${recalls.length}件`)}
        ${stat("教育訓練実施回数",         `${training.length}回`)}
      </table>`;

    const textarea = (key, label, rows = 3, help = "") =>
        `<div class="form-field span-2">
           <label>${esc(label)}${help ? `<span style="font-weight:400;color:var(--c-text-muted);margin-left:6px;font-size:11px">${esc(help)}</span>` : ""}</label>
           <textarea data-annual-review="${key}" rows="${rows}" style="width:100%;font-size:13px">${esc(rv[key] || "")}</textarea>
         </div>`;

    const yesno = (key, label) =>
        `<div class="form-field">
           <label>${esc(label)}</label>
           <select data-annual-review="${key}" style="width:100%">
             ${["—", "変更なし", "変更あり（文書更新済）", "変更あり（対応中）"].map(v => `<option${(rv[key]||"—")===v?" selected":""}>${v}</option>`).join("")}
           </select>
         </div>`;

    return `
      <article class="doc" data-doc="annual-review">
        <header class="doc-header">
          <div>
            <h2 class="doc-title">年次HACCPシステムレビュー</h2>
            <div class="doc-meta">年1回実施 ／ HACCPシステム全体の有効性確認・継続的改善の記録</div>
          </div>
          <div class="doc-tools no-print">
            <button class="btn btn-tiny" data-action="print">印刷／PDF</button>
          </div>
        </header>

        <div class="section-block" style="margin-bottom:20px">
          <h3 style="font-size:13px;font-weight:700;margin:0 0 12px">1. レビュー基本情報</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>レビュー対象年度</label>
              <select data-annual-review="reviewYear" style="width:100%">
                ${[yr-1, yr, yr+1].map(y => `<option${(rv.reviewYear||yr)===y?" selected":""}>${y}</option>`).join("")}
              </select>
            </div>
            <div class="form-field">
              <label>レビュー実施日</label>
              <input type="date" data-annual-review="reviewDate" value="${esc(rv.reviewDate||today)}">
            </div>
            <div class="form-field">
              <label>実施者（管理責任者）</label>
              <input type="text" data-annual-review="reviewer" value="${esc(rv.reviewer||state.team?.leader||"")}">
            </div>
            <div class="form-field">
              <label>承認者</label>
              <input type="text" data-annual-review="approver" value="${esc(rv.approver||"")}">
            </div>
          </div>
        </div>

        <div class="section-block" style="margin-bottom:20px">
          <h3 style="font-size:13px;font-weight:700;margin:0 0 12px">2. ${yearStr}年度 運用実績サマリー <span style="font-weight:400;font-size:11px;color:var(--c-text-muted)">(記録から自動集計)</span></h3>
          ${statsHtml}
        </div>

        <div class="section-block" style="margin-bottom:20px">
          <h3 style="font-size:13px;font-weight:700;margin:0 0 12px">3. HACCPシステムへの変更確認</h3>
          <div class="form-grid">
            ${yesno("changeProduct",     "製品・原材料の変更")}
            ${yesno("changeProcess",     "製造工程の変更")}
            ${yesno("changeLegislation", "法規制・規格の変更")}
            ${yesno("changeFacility",    "施設・設備の変更")}
            ${yesno("changeSupplier",    "仕入先の変更")}
            ${yesno("changePersonnel",   "担当者・体制の変更")}
            ${textarea("changeDetail",   "変更内容の詳細", 3, "変更ありの場合は具体的に記載")}
          </div>
        </div>

        <div class="section-block" style="margin-bottom:20px">
          <h3 style="font-size:13px;font-weight:700;margin:0 0 12px">4. レビュー所見・評価</h3>
          <div class="form-grid">
            ${textarea("ccpReview",       "CCPモニタリング・検証結果の評価", 3)}
            ${textarea("ncReview",        "不適合・クレーム・是正処置の評価", 3)}
            ${textarea("auditReview",     "内部監査・仕入先評価の評価", 3)}
            ${textarea("trainingReview",  "教育訓練の実施状況評価", 2)}
            ${textarea("documentReview",  "文書管理の状況評価", 2)}
          </div>
        </div>

        <div class="section-block" style="margin-bottom:20px">
          <h3 style="font-size:13px;font-weight:700;margin:0 0 12px">5. 次年度への決定事項・改善計画</h3>
          <div class="form-grid">
            ${textarea("improvements",    "HACCPプランの改訂・改善事項", 4, "CCP/CL変更、監視方法の見直し等")}
            ${textarea("nextYearPlan",    "次年度の重点取組事項", 3)}
            ${textarea("resourceNeeds",   "必要なリソース・設備投資", 2)}
          </div>
        </div>

        <div class="section-block">
          <h3 style="font-size:13px;font-weight:700;margin:0 0 12px">6. 総合評価・承認</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>HACCPシステムの総合評価</label>
              <select data-annual-review="overallResult" style="width:100%">
                ${["—", "有効に機能している", "概ね有効（一部改善要）", "改善が必要", "大幅な見直しが必要"].map(v => `<option${(rv.overallResult||"—")===v?" selected":""}>${v}</option>`).join("")}
              </select>
            </div>
            <div class="form-field">
              <label>承認状態</label>
              <select data-annual-review="approvalStatus" style="width:100%">
                ${["未承認", "承認済", "条件付き承認"].map(v => `<option${(rv.approvalStatus||"未承認")===v?" selected":""}>${v}</option>`).join("")}
              </select>
            </div>
            ${textarea("overallComment", "総評・コメント", 3)}
          </div>
          <div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;font-size:13px">
            <div style="border-top:1px solid #000;padding-top:6px">管理責任者: ${esc(rv.reviewer || state.team?.leader || "")}</div>
            <div style="border-top:1px solid #000;padding-top:6px">承認者:</div>
            <div style="border-top:1px solid #000;padding-top:6px">承認日:</div>
          </div>
        </div>
      </article>`;
}
