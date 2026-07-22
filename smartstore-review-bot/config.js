// 스마트스토어센터 리뷰 페이지 셀렉터 설정.
//
// ⚠️ 스마트스토어센터는 로그인해야 볼 수 있는 SPA라서, 아래 셀렉터는
// 실제 화면에서 한 번 확인 후 조정이 필요할 수 있습니다.
// 실행 중 셀렉터를 못 찾으면 debug/ 폴더에 스크린샷과 HTML이 저장되니
// 그걸 열어서 실제 클래스명/구조에 맞게 고쳐주세요.
module.exports = {
  urls: {
    center: 'https://sell.smartstore.naver.com/',
    // 리뷰 관리 화면 (미답변 리뷰 필터는 화면에서 직접 선택)
    reviewSearch: 'https://sell.smartstore.naver.com/#/review/search',
  },

  selectors: {
    // 리뷰 목록의 행(row) 하나
    reviewRow: 'table tbody tr',
    // 행 안에서 각 정보 — 실제 화면 구조에 맞게 조정
    productName: '[data-name], .product-name, td:nth-child(3)',
    rating: '.rating, td:nth-child(4)',
    content: '.review-content, td:nth-child(5)',
    // "답글" / "댓글 작성" 버튼
    replyButton: 'button:has-text("답글"), a:has-text("답글")',
    // 답글 입력 textarea 및 등록 버튼
    replyTextarea: 'textarea',
    replySubmit: 'button:has-text("등록"), button:has-text("저장")',
  },

  // 답글 사이 대기 시간(ms) — 서버에 부담 주지 않도록 간격을 둡니다
  delayBetweenReplies: { min: 15000, max: 40000 },

  // 답글 생성 톤 가이드 (프롬프트에 그대로 들어감)
  toneGuide: `
- 정중하고 따뜻한 존댓말. 과한 이모티콘/느낌표 남발 금지 (이모지는 최대 1개).
- 리뷰에서 언급된 구체적인 내용(상품 사용 경험, 배송, 포장 등)을 한 가지 이상 자연스럽게 짚어줄 것.
- 매번 같은 문장 패턴을 반복하지 말고 인사말과 마무리 표현을 다양하게 변형할 것.
- 별점이 3점 이하이면: 먼저 진심으로 사과하고, 불편 사항을 인정하고, 고객센터/교환·환불 안내 등 해결 방향을 제시할 것.
- 별점이 4점 이상이면: 감사 인사 + 리뷰 내용 공감 + 재구매/재방문을 부드럽게 권유.
- 길이는 2~4문장. 템플릿 티가 나지 않게, 실제 사장님이 직접 쓴 것처럼.
- 의료기기/건강 관련 상품이라도 효능·효과를 단정하는 표현(치료된다, 낫는다 등)은 절대 쓰지 말 것 (의료광고 규제).
`.trim(),
};
