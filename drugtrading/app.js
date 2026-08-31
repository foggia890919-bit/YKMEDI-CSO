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

/* 정확히 일치하는 열 찾기 ('코드'가 '보험코드'에 걸리지 않도록) */
function exactColIndex(header, names) {
  for (var p = 0; p < names.length; p++) {
    for (var j = 0; j < header.length; j++) {
      var cell = String(header[j] === undefined ? '' : header[j]).replace(/\s/g, '');
      if (cell === names[p]) return j;
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

/* 약국 조제내역: 열 자동 추측. 반환값의 cols를 UI에서 바꿔 parsePharmacy에 다시 넘길 수 있음 */
function detectPharmacy(rows) {
  var h = findHeaderRow(rows, ['약품코드', '약품명', '조제']);
  if (h < 0) h = findHeaderRow(rows, ['보험코드', '약품명']);
  if (h < 0) h = findHeaderRow(rows, ['코드', '품명']);
  if (h < 0) h = 0; /* 헤더를 못 찾으면 1행으로 두고 사용자가 매핑 */
  var header = rows[h] || [];
  return {
    headerRow: h,
    header: header,
    cols: {
      code: colIndex(header, ['약품코드', '보험코드', 'EDI', 'edi', '코드']),
      name: colIndex(header, ['약품명', '품명', '제품명', '상품명']),
      maker: colIndex(header, ['제조회사', '제조사', '제약사', '업체', '회사']),
      price: colIndex(header, ['조제단가', '단가', '약가']),
      qty: colIndex(header, ['조제량', '조제수량', '수량', '총수량']),
      amt: colIndex(header, ['조제금액', '금액', '총금액', '합계'])
    }
  };
}

/* map: detectPharmacy 반환 형태({headerRow, cols}). 생략하면 자동 추측 */
function parsePharmacy(rows, map) {
  if (!map) map = detectPharmacy(rows);
  var h = map.headerRow;
  var cCode = map.cols.code, cName = map.cols.name, cMaker = map.cols.maker;
  var cPrice = map.cols.price, cQty = map.cols.qty, cAmt = map.cols.amt;
  if (cCode < 0 || cName < 0) throw new Error('약품코드(보험코드)와 약품명 열을 지정해주세요.');
  var out = [];
  for (var i = h + 1; i < rows.length; i++) {
    var r = rows[i] || [];
    var rawCode = String(r[cCode] === undefined ? '' : r[cCode]);
    var name = String(r[cName] === undefined ? '' : r[cName]).trim();
    /* 합계/총계 등 요약 행 제외: 약품명이 없거나, 코드에 숫자가 4자리 미만 */
    if (!name || /합계|총계|갯수|소계/.test(name) || /합계|총계|갯수|소계/.test(rawCode)) continue;
    if (rawCode.replace(/\D/g, '').length < 4) continue;
    var code = normCode(rawCode);
    if (!code) continue;
    out.push({
      code: code,
      name: name,
      maker: cMaker >= 0 ? String(r[cMaker] === undefined ? '' : r[cMaker]).trim() : '',
      price: cPrice >= 0 ? num(r[cPrice]) : 0,
      qty: cQty >= 0 ? num(r[cQty]) : 0,
      amt: cAmt >= 0 ? num(r[cAmt]) : 0
    });
  }
  return out;
}

/* 요율표 헤더 탐색: 코드류 열 + (품목명류 또는 성분류) 열이 함께 있는 첫 행.
   "코드"라고만 적힌 열은 명시적 코드열(보험코드 등)이 없을 때 코드열로 간주(예: 보령). */
function findRateHeader(rows) {
  var limit = Math.min(rows.length, 40);
  for (var i = 0; i < limit; i++) {
    var row = rows[i] || [];
    var groups = {}, bareCode = false;
    for (var j = 0; j < row.length; j++) {
      var n = String(row[j] === undefined ? '' : row[j]).replace(/\s/g, '');
      if (n === '코드') bareCode = true;
      var g = matchGroup(n);
      if (g >= 0) groups[g] = 1;
    }
    var hasCode = false;
    for (var j2 = 0; j2 < row.length; j2++) {
      if (aliasGroup(row[j2]) === 0) { hasCode = true; break; }
    }
    if ((hasCode || bareCode) && (groups[3] || groups[4])) return i;
  }
  return -1;
}

/* 요율표: 헤더 행과 보험코드 열을 찾아 모든 열을 그대로 유지 */
function parseRate(rows) {
  var h = findRateHeader(rows);
  if (h < 0) h = findHeaderRow(rows, ['보험코드', '성분명', '품목명']);
  if (h < 0) throw new Error('요율표에서 헤더(보험코드/성분명/품목명)를 찾지 못했습니다.');
  var header = [];
  for (var j = 0; j < rows[h].length; j++) {
    header.push(String(rows[h][j] === undefined ? '' : rows[h][j]).trim());
  }
  var cCode = colIndex(header, ['보험코드', '표준코드', '품목코드', 'EDI코드', '급여코드']);
  if (cCode < 0) cCode = exactColIndex(header, ['코드']); /* "코드"만 있으면 그것이 코드열 (예: 보령) */
  if (cCode < 0) throw new Error('요율표에 보험코드 열이 없습니다.');
  var RATE_NAMES = ['코드', '요율', '요율(%)', '기본요율', '기본요율(%)', '수수료율', '수수료율(%)', '수수료', '수수료(%)', 'CSO수수료', '지급률', '지급율'];
  var cRate = exactColIndex(header, RATE_NAMES);
  if (cRate === cCode) cRate = exactColIndex(header, RATE_NAMES.slice(1)); /* "코드"가 코드열로 쓰였으면 요율 후보에서 제외 */
  var cPrice = exactColIndex(header, ['약가', '보험약가', '상한가', '보험상한가', '단가', '보험단가', '약가(원)', '기준가', '기준가격']);
  if (cPrice < 0) {
    for (var jp = 0; jp < header.length; jp++) {
      if (matchGroup(header[jp]) === 2 && jp !== cRate && jp !== cCode) { cPrice = jp; break; }
    }
  }
  var body = [];
  for (var i = h + 1; i < rows.length; i++) {
    var r = rows[i] || [];
    var code = normCode(r[cCode]);
    if (!code) continue;
    body.push({ code: code, cells: r });
  }
  return { header: header, rows: body, codeCol: cCode, rateCol: cRate, priceCol: cPrice };
}

/* 열 이름 별칭: 업체마다 요율표 열 이름이 달라도 같은 의미면 매핑 */
var COL_ALIASES = [
  ['보험코드', 'EDI코드', 'EDI', 'edi코드', '급여코드', '제품코드', '표준코드', '품목코드'],
  ['코드', '요율', '요율(%)', '기본요율', '기본요율(%)', '수수료율', '수수료율(%)', '수수료', '수수료(%)', 'CSO수수료', '지급률', '지급율'],
  ['약가', '보험약가', '상한가', '보험상한가', '단가', '보험단가', '약가(원)'],
  ['품목명', '제품명', '품명', '상품명', '제품'],
  ['성분명', '주성분', '성분', '주성분명'],
  ['제약사명', '제약사', '제조사', '업체명', '회사명', '제조회사', '판매사']
];
function aliasGroup(name) {
  var n = String(name).replace(/\s/g, '');
  for (var g = 0; g < COL_ALIASES.length; g++) {
    for (var a = 0; a < COL_ALIASES[g].length; a++) {
      if (n === COL_ALIASES[g][a]) return g;
    }
  }
  return -1;
}

/* 느슨한 매칭: 정확 일치가 없으면 포함 여부로 판별 (예: "유니메드 제품명", "주요성분", "기준가") */
function matchGroup(name) {
  var n = String(name).replace(/\s/g, '');
  var g = aliasGroup(n);
  if (g >= 0) return g;
  if (n.indexOf('제품명') !== -1 || n.indexOf('품목명') !== -1) return 3;
  if (n.indexOf('성분') !== -1) return 4;
  if (n.indexOf('기준가') !== -1 || n.indexOf('상한금액') !== -1) return 2;
  return -1;
}

/* 여러 요율표 병합: 첫 번째(기본, 예: 메디펄스)를 그대로 두고,
   이후 요율표에서는 기본에 없는 보험코드 품목만 추가.
   열은 기본 헤더 이름으로 매핑하되, 이름이 달라도 별칭(요율/수수료율 등)이면 매핑. */
function mergeRates(parsedList, names) {
  var base = parsedList[0];
  var header = base.header.slice();
  header.push('요율표출처');
  var seen = {}, rows = [], addedPerFile = [0];
  base.rows.forEach(function (r) {
    seen[r.code] = 1;
    var c = [];
    for (var j = 0; j < base.header.length; j++) c.push(r.cells[j] === undefined ? '' : r.cells[j]);
    c.push(names[0] || '기본');
    rows.push({ code: r.code, cells: c });
  });
  for (var i = 1; i < parsedList.length; i++) {
    var p = parsedList[i], added = 0;
    var mapIdx = [];
    for (var b = 0; b < base.header.length; b++) {
      var hn = String(base.header[b]).replace(/\s/g, '');
      var hg = aliasGroup(hn);
      var found = -1;
      for (var j2 = 0; j2 < p.header.length; j2++) {
        if (String(p.header[j2]).replace(/\s/g, '') === hn) { found = j2; break; }
      }
      if (found < 0 && hg >= 0) {
        for (var j4 = 0; j4 < p.header.length; j4++) {
          if (aliasGroup(p.header[j4]) === hg) { found = j4; break; }
        }
      }
      mapIdx.push(found);
    }
    /* 핵심 3열(보험코드/요율/약가)은 각 파일에서 감지된 열 인덱스로 강제 매핑 */
    if (base.codeCol >= 0 && p.codeCol >= 0) mapIdx[base.codeCol] = p.codeCol;
    if (base.rateCol >= 0 && p.rateCol >= 0) mapIdx[base.rateCol] = p.rateCol;
    if (base.priceCol >= 0 && p.priceCol >= 0) mapIdx[base.priceCol] = p.priceCol;
    /* 이전 파일에 이미 있는 코드만 제외 — 같은 파일 안의 중복 행(코드 동일)은 유지 */
    var addedHere = {};
    for (var r2 = 0; r2 < p.rows.length; r2++) {
      var row = p.rows[r2];
      if (seen[row.code] && !addedHere[row.code]) continue;
      addedHere[row.code] = 1; added++;
      var c2 = mapIdx.map(function (j3) { return j3 >= 0 && row.cells[j3] !== undefined ? row.cells[j3] : ''; });
      /* 요율 표기 통일: 0.55처럼 소수(비율)로 적힌 요율은 %로 환산 */
      if (base.rateCol >= 0) {
        var rv = num(c2[base.rateCol]);
        if (rv > 0 && rv <= 1.5) c2[base.rateCol] = Math.round(rv * 10000) / 100;
      }
      c2.push(names[i] || ('추가' + i));
      rows.push({ code: row.code, cells: c2 });
    }
    for (var k2 in addedHere) seen[k2] = 1;
    addedPerFile.push(added);
  }
  return {
    header: header, rows: rows,
    codeCol: base.codeCol, rateCol: base.rateCol, priceCol: base.priceCol,
    baseCount: base.rows.length, addedPerFile: addedPerFile
  };
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
  /* 보유품목 각각을 별도 기준으로: (보유품목 × 그 성분의 요율표 행) 조합마다 한 행 */
  var outRows = [];
  var candCount = {}; /* 보유품목 code → 대체후보 수 */
  var minCandPrice = {}; /* 보유품목 code → 대체후보 중 최저 약가 */
  for (var k = 0; k < rate.rows.length; k++) {
    var rr = rate.rows[k];
    var mhit = master[rr.code];
    if (!mhit || !mhit.grp || !pgroups[mhit.grp]) continue;
    var plist = pgroups[mhit.grp];
    var price = rate.priceCol >= 0 ? num(rr.cells[rate.priceCol]) : 0;
    var pct = rate.rateCol >= 0 ? num(rr.cells[rate.rateCol]) : 0;
    for (var p = 0; p < plist.length; p++) {
      var held = plist[p];
      var own = held.code === rr.code;
      var basePrice = held.price || 0;
      var diff = price - basePrice;
      var cmp = basePrice > 0 ? (diff > 0 ? '높음' : (diff < 0 ? '낮음' : '동일')) : '기준없음';
      /* 저가약 대체조제 장려금: 저가 대체 시 약가 차액의 30% */
      var incentive = (basePrice > 0 && diff < 0) ? Math.round(-diff * 30) / 100 : 0;
      if (!own) {
        candCount[held.code] = (candCount[held.code] || 0) + 1;
        if (price > 0 && (!(held.code in minCandPrice) || price < minCandPrice[held.code])) {
          minCandPrice[held.code] = price;
        }
      }
      outRows.push({
        grp: mhit.grp, ing: mhit.ing,
        kind: own ? '보유품목' : '대체가능',
        pName: held.name, pMaker: held.maker, pQty: held.qty, pAmt: held.amt,
        price: price, basePrice: basePrice, diff: diff, cmp: cmp,
        pct: pct, profit: Math.round(price * pct) / 100, incentive: incentive,
        cells: rr.cells
      });
    }
  }
  for (var q = 0; q < pharm.length; q++) {
    var dd = pharm[q];
    dd.candCount = candCount[dd.code] || 0;
    if (!dd.grp) dd.status = '약가파일 미등재(비급여 등)';
    else if (dd.candCount) dd.status = '대체후보 있음';
    else dd.status = '요율표에 동일성분 없음';
    /* 전량 최저가 후보로 대체했을 때의 인센티브(차액 30%) × 조제량 */
    dd.minCandPrice = minCandPrice[dd.code] || 0;
    var perUnit = (dd.price > 0 && dd.minCandPrice > 0) ? (dd.price - dd.minCandPrice) * 0.3 : 0;
    dd.incentiveTotal = perUnit > 0 ? Math.round(perUnit * dd.qty) : 0;
  }
  /* 정렬: 주성분명 → 보유품목명 → 자기 자신(보유품목) 우선 */
  outRows.sort(function (a, b) {
    if (a.ing !== b.ing) return a.ing < b.ing ? -1 : 1;
    if (a.pName !== b.pName) return a.pName < b.pName ? -1 : 1;
    if (a.kind !== b.kind) return a.kind === '보유품목' ? -1 : 1;
    return 0;
  });
  return { outRows: outRows, pharm: pharm, candCount: candCount };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normCode: normCode, num: num, findHeaderRow: findHeaderRow, buildMaster: buildMaster, detectPharmacy: detectPharmacy, parsePharmacy: parsePharmacy, parseRate: parseRate, mergeRates: mergeRates, buildMapping: buildMapping };
}
