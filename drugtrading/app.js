/* 대체조제 매핑 핵심 로직 (브라우저 + Node 공용) */

function normCode(v) {
  if (v === null || v === undefined) return '';
  var s = String(v).split('.')[0].replace(/\D/g, '');
  if (!s) return '';
  while (s.length < 9) s = '0' + s;
  return s;
}

function num(v) {
  if (v === null || v === undefined) return 0;
  var n = parseFloat(String(v).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

/* 헤더 행 탐색: 첫 15행 중 필수 키워드가 가장 많이 들어있는 행 */
function findHeaderRow(rows, keywords) {
  var best = -1, bestScore = 0;
  var limit = Math.min(rows.length, 15);
  for (var i = 0; i < limit; i++) {
    var row = rows[i] || [];
    var score = 0;
    for (var k = 0; k < keywords.length; k++) {
      for (var j = 0; j < row.length; j++) {
        var cell = String(row[j] === undefined ? '' : row[j]).replace(/\s/g, '');
        if (cell.indexOf(keywords[k]) !== -1) { score++; break; }
      }
    }
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return bestScore >= 2 ? best : -1;
}

function colIndex(header, patterns) {
  for (var p = 0; p < patterns.length; p++) {
    for (var j = 0; j < header.length; j++) {
      var cell = String(header[j] === undefined ? '' : header[j]).replace(/\s/g, '');
      if (cell.indexOf(patterns[p]) !== -1) return j;
    }
  }
  return -1;
}

/* 약가마스터: 제품코드 → {grp: 주성분코드_동일제형, ing: 주성분명} */
function buildMaster(rows) {
  var h = findHeaderRow(rows, ['주성분코드', '제품코드', '주성분명']);
  if (h < 0) throw new Error('약가마스터 파일에서 헤더(주성분코드/제품코드/주성분명)를 찾지 못했습니다.');
  var header = rows[h];
  var cGrp = colIndex(header, ['동일제형']);
  if (cGrp < 0) cGrp = colIndex(header, ['주성분코드']);
  var cIng = colIndex(header, ['주성분명']);
  var cProd = colIndex(header, ['제품코드']);
  if (cGrp < 0 || cIng < 0 || cProd < 0) throw new Error('약가마스터 필수 열(주성분코드_동일제형/주성분명/제품코드)이 없습니다.');
  var map = {};
  for (var i = h + 1; i < rows.length; i++) {
    var r = rows[i] || [];
    var code = normCode(r[cProd]);
    if (!code) continue;
    map[code] = {
      grp: String(r[cGrp] === undefined ? '' : r[cGrp]).trim(),
      ing: String(r[cIng] === undefined ? '' : r[cIng]).trim()
    };
  }
  return map;
}

/* 약국 조제내역: [{code,name,maker,price,qty,amt}] */
function parsePharmacy(rows) {
  var h = findHeaderRow(rows, ['약품코드', '약품명', '조제']);
  if (h < 0) h = findHeaderRow(rows, ['보험코드', '약품명']);
  if (h < 0) throw new Error('약국 파일에서 헤더(약품코드/약품명)를 찾지 못했습니다.');
  var header = rows[h];
  var cCode = colIndex(header, ['약품코드', '보험코드', '코드']);
  var cName = colIndex(header, ['약품명', '품명']);
  var cMaker = colIndex(header, ['제조회사', '제약사', '업체']);
  var cPrice = colIndex(header, ['조제단가', '단가']);
  var cQty = colIndex(header, ['조제량', '수량']);
  var cAmt = colIndex(header, ['조제금액', '금액']);
  var out = [];
  for (var i = h + 1; i < rows.length; i++) {
    var r = rows[i] || [];
    var code = normCode(r[cCode]);
    if (!code) continue;
    out.push({
      code: code,
      name: String(r[cName] === undefined ? '' : r[cName]).trim(),
      maker: cMaker >= 0 ? String(r[cMaker] === undefined ? '' : r[cMaker]).trim() : '',
      price: cPrice >= 0 ? num(r[cPrice]) : 0,
      qty: cQty >= 0 ? num(r[cQty]) : 0,
      amt: cAmt >= 0 ? num(r[cAmt]) : 0
    });
  }
  return out;
}

/* 요율표: 헤더 행과 보험코드 열을 찾아 모든 열을 그대로 유지 */
function parseRate(rows) {
  var h = findHeaderRow(rows, ['보험코드', '성분명', '품목명']);
  if (h < 0) throw new Error('요율표에서 헤더(보험코드/성분명/품목명)를 찾지 못했습니다.');
  var header = [];
  for (var j = 0; j < rows[h].length; j++) {
    header.push(String(rows[h][j] === undefined ? '' : rows[h][j]).trim());
  }
  var cCode = colIndex(header, ['보험코드']);
  if (cCode < 0) throw new Error('요율표에 보험코드 열이 없습니다.');
  var body = [];
  for (var i = h + 1; i < rows.length; i++) {
    var r = rows[i] || [];
    var code = normCode(r[cCode]);
    if (!code) continue;
    body.push({ code: code, cells: r });
  }
  return { header: header, rows: body, codeCol: cCode };
}

/* 매핑 실행 */
function buildMapping(pharm, rate, master) {
  var pgroups = {};
  for (var i = 0; i < pharm.length; i++) {
    var d = pharm[i];
    var hit = master[d.code];
    d.grp = hit ? hit.grp : null;
    d.ing = hit ? hit.ing : null;
    if (hit && hit.grp) {
      if (!pgroups[hit.grp]) pgroups[hit.grp] = [];
      pgroups[hit.grp].push(d);
    }
  }
  var outRows = [];
  for (var k = 0; k < rate.rows.length; k++) {
    var rr = rate.rows[k];
    var mhit = master[rr.code];
    if (!mhit || !mhit.grp || !pgroups[mhit.grp]) continue;
    var plist = pgroups[mhit.grp];
    var own = false, names = [], qty = 0, amt = 0;
    for (var p = 0; p < plist.length; p++) {
      if (plist[p].code === rr.code) own = true;
      names.push(plist[p].name);
      qty += plist[p].qty; amt += plist[p].amt;
    }
    outRows.push({
      grp: mhit.grp, ing: mhit.ing,
      kind: own ? '보유품목' : '대체가능',
      pNames: names.join(' / '), pQty: qty, pAmt: amt,
      cells: rr.cells
    });
  }
  var grpCount = {};
  for (var o = 0; o < outRows.length; o++) {
    if (outRows[o].kind === '대체가능') grpCount[outRows[o].grp] = (grpCount[outRows[o].grp] || 0) + 1;
  }
  for (var q = 0; q < pharm.length; q++) {
    var dd = pharm[q];
    if (!dd.grp) dd.status = '약가파일 미등재(비급여 등)';
    else if (grpCount[dd.grp]) dd.status = '대체후보 있음';
    else dd.status = '요율표에 동일성분 없음';
    dd.candCount = grpCount[dd.grp] || 0;
  }
  /* 정렬: 주성분명 → 보유품목 우선 */
  outRows.sort(function (a, b) {
    if (a.ing !== b.ing) return a.ing < b.ing ? -1 : 1;
    if (a.kind !== b.kind) return a.kind === '보유품목' ? -1 : 1;
    return 0;
  });
  return { outRows: outRows, pharm: pharm, grpCount: grpCount };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normCode: normCode, num: num, findHeaderRow: findHeaderRow, buildMaster: buildMaster, parsePharmacy: parsePharmacy, parseRate: parseRate, buildMapping: buildMapping };
}
