#!/usr/bin/env python3
"""공통요율표(public/rates-common.json) 재생성.

사용: python3 scripts/gen_rates_common.py <기본 요율표.xlsx> [--sheet 2026.08] [--name 메디펄스]
                                          [--prev public/rates-common.json] [--out public/rates-common.json]

- 기본 요율표(메디펄스) 시트를 그대로 기본(base) 행으로 쓴다. 셀 값은 손대지 않는다(보험코드 'D6288…' 같은 접두어도 유지). (도구의 parseRate 와 같은 규칙:
  코드열=보험코드, 요율열=코드, 약가열=약가. '열1' 같은 이름 없는 보조열은 버린다)
- 이전 JSON 에 있던 다른 법인(이음·서원 …) 행은 기본에 없는 보험코드만 그대로 유지한다. (mergeRates 규칙)
"""
import argparse, datetime, json, re, sys
import openpyxl

def norm_code(v):
    if v is None: return ''
    s = re.sub(r'\D', '', str(v).split('.')[0])
    return s.zfill(9) if s else ''

def cell(v):
    if v is None: return ''
    if isinstance(v, float) and v.is_integer(): return int(v)
    return v

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('xlsx'); ap.add_argument('--sheet', default=None); ap.add_argument('--name', default='메디펄스')
    ap.add_argument('--prev', default='public/rates-common.json'); ap.add_argument('--out', default='public/rates-common.json')
    a = ap.parse_args()
    wb = openpyxl.load_workbook(a.xlsx, read_only=True, data_only=True)
    ws = wb[a.sheet] if a.sheet else wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    hi = next((i for i, r in enumerate(rows[:40]) if r and '보험코드' in [str(c).strip() for c in r if c] and '품목명' in [str(c).strip() for c in r if c]), -1)
    if hi < 0: sys.exit('헤더(보험코드/품목명)를 찾지 못함')
    raw_h = [str(c).strip() if c is not None else '' for c in rows[hi]]
    keep = [j for j, h in enumerate(raw_h) if h and not re.fullmatch(r'열\d+', h)]
    header = [raw_h[j] for j in keep]
    code_col = header.index('보험코드'); rate_col = header.index('코드'); price_col = header.index('약가')
    base, seen = [], set()
    for r in rows[hi + 1:]:
        code = norm_code(r[raw_h.index('보험코드')])
        if not code: continue
        c = [cell(r[j]) if j < len(r) else '' for j in keep]
        c.append(a.name); base.append(c); seen.add(code)
    prev = json.load(open(a.prev, encoding='utf-8')) if a.prev else None
    names = [a.name]; kept = []
    if prev:
        pm = prev['merged']; ph = pm['header']
        if ph != header + ['요율표출처']:
            sys.exit(f'이전 JSON 헤더와 다름: {ph} vs {header}')
        names = [a.name] + [n for n in pm['names'] if n != a.name]
        added = set()
        for r in pm['rows']:
            if r[-1] == a.name: continue
            code = norm_code(r[code_col])
            if code in seen and code not in added: continue
            added.add(code); kept.append(r)
    out = {
        'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
        'baseFile': a.xlsx.split('/')[-1],
        'merged': {'header': header + ['요율표출처'], 'codeCol': code_col, 'rateCol': rate_col, 'priceCol': price_col,
                   'baseCount': len(base), 'names': names, 'rows': base + kept},
    }
    json.dump(out, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    from collections import Counter
    print('기본', len(base), '유지', len(kept), Counter(r[-1] for r in kept))

if __name__ == '__main__':
    main()
