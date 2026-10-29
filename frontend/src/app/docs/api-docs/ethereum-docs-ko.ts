import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Ethereum 기초",
  "Basics": "기초",
  "Gas and fees": "가스 및 수수료",
  "Fees": "수수료",
  "Transaction status": "트랜잭션 상태",
  "Transactions": "트랜잭션",
  "Accounts, contracts, and tokens": "계정, 계약 및 토큰",
  "Accounts": "계정",
  "Tokens": "토큰",
  "Explorer": "탐색기",
  "Support": "지원",
  "Using the API": "API 사용",
  "Overview": "개요",
  "Network and pending sample": "네트워크 및 대기 샘플",
  "Network": "네트워크",
  "Blocks": "블록",
  "Accounts and tokens": "계정 및 토큰",
  "Connection": "연결",
  "Actions": "동작",
  "Subscriptions": "구독"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Ethereum 트랜잭션은 어떻게 작동하나요?",
    "description": "<p>Ethereum 트랜잭션은 외부 소유 계정의 서명된 지시입니다. ETH 전송, 스마트 계약 호출 또는 생성, ETH 금액 없이 데이터를 전달할 수 있습니다. 발신자의 nonce는 해당 계정의 트랜잭션 순서를 정하므로 이전 nonce가 해결되지 않은 동안 이후 nonce는 포함될 수 없습니다.</p><p>탐색기는 전송된 ETH와 수수료를 구분합니다. ETH 금액이 0이어도 계약 호출로 토큰이 이동하거나 상태가 변경될 수 있습니다.</p><p class=\"mt-3\">프로토콜 배경: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">트랜잭션</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">가스와 수수료</a> 및 <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">계정</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "계정과 계약의 차이는 무엇인가요?",
    "description": "<p>주소는 외부 소유 계정과 계약 계정을 식별합니다. 개인 키는 외부 소유 계정을 제어하고 트랜잭션을 시작합니다. 계약은 코드를 포함하며 호출되면 실행됩니다. 계약 상태, 이름, 라벨 및 검증 정보는 제공업체의 메타데이터이며 사용하지 못할 수 있습니다.</p><p>탐색기로 주소의 소유권을 확정할 수는 없습니다.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "블록, 확인 및 최종성이란 무엇인가요?",
    "description": "<p>Ethereum 메인넷은 지분 증명을 사용합니다. 트랜잭션은 실행 블록에 포함된 후 확인됩니다. 이후 블록이 해당 블록 위에 쌓이면서 확인 수는 관측된 실행 계층의 블록 깊이를 나타냅니다.</p><p>확인 깊이는 유용한 참고 정보이지만 합의 최종성의 증명은 아닙니다. 이 탐색기는 비컨체인 최종성 체크포인트나 최종 확정 API를 제공하지 않으므로 임의의 확인 수를 프로토콜 최종성으로 간주하지 마세요.</p>"
  },
  "what-is-gas": {
    "title": "가스, wei 및 gwei란 무엇인가요?",
    "description": "<p>가스는 EVM 계산 작업량을 측정합니다. wei는 ETH의 최소 단위입니다. 1 ETH는 10<sup>18</sup> wei입니다. 가스 가격은 주로 gwei로 표시합니다. 1 gwei는 10<sup>9</sup> wei, 즉 0.000000001 ETH입니다.</p><p><code>gasLimit</code>은 허용된 최대 가스이며 <code>gasUsed</code>은 포함된 트랜잭션이 소비한 작업량입니다. 실행 수수료는 사용 가스에 유효 가스 가격을 곱한 값입니다. Blob 수수료가 있으면 별도로 표시됩니다.</p>"
  },
  "base-and-priority-fees": {
    "title": "기본 수수료, 우선 수수료 및 최대 수수료는 어떻게 작동하나요?",
    "description": "<p>EIP-1559 트랜잭션에서 <code>maxFeePerGas</code>은 허용 가격을 제한하고 <code>maxPriorityFeePerGas</code>은 팁을 제한합니다. 유효 가격은 해당 한도 내에서 블록 기본 수수료와 적용 가능한 우선 수수료의 합으로 결정됩니다. 기본 수수료 부분은 소각되고 우선 수수료는 검증자 인센티브입니다.</p><p>최대 수수료는 상한일 뿐 실제 지불 금액과 같을 필요는 없습니다. 기존 트랜잭션에는 대신 가스 가격 필드가 표시됩니다.</p>"
  },
  "fee-estimates": {
    "title": "가스 가격 권장값은 어떻게 사용해야 하나요?",
    "description": "<p>느림, 평균, 빠름 값은 제공업체의 관측값이며 REST API에서 wei로 반환됩니다. 견적이나 포함 보장이 아닙니다. 지갑은 긴급도, nonce 의존성 및 최신 기본 수수료에 따라 설정을 선택할 수 있습니다.</p><p>포함된 트랜잭션의 지불 금액은 유효 가스 가격과 사용 가스로 확인하세요. 대기 중인 트랜잭션은 최대 수수료 한도만 알 수 있을 수 있습니다.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "확인된 트랜잭션도 실패할 수 있는 이유는 무엇인가요?",
    "description": "<p>블록 포함과 실행은 별개의 사실입니다. 트랜잭션이 블록에서 확인되어도 EVM 실행이 실패하여 되돌려지거나 오류가 발생할 수 있으며 가스도 소비할 수 있습니다. 성공 결과는 기록된 실행이 완료되었다는 뜻이지 계약 상호작용이 사용자가 기대한 업무 결과를 냈다는 보장은 아닙니다.</p><p><code>status.confirmed</code>, Ethereum <code>status</code>/<code>result</code>, 오류 플래그와 사용 가능한 되돌림 이유를 함께 확인하세요.</p>"
  },
  "why-pending": {
    "title": "트랜잭션이 대기 중이거나 보이지 않는 이유는 무엇인가요?",
    "description": "<p>대기 트랜잭션은 가격이 너무 낮거나, 발신자의 더 낮은 nonce 때문에 막혔거나, 제공업체에 아직 보이지 않거나, 같은 nonce의 트랜잭션으로 대체되었거나, 제출한 지갑 또는 노드에서 삭제되었을 수 있습니다. 대기 화면만으로는 어떤 일이 발생했는지 판단할 수 없습니다.</p><p>Ethereum에는 단일 전역 메모리풀이 없습니다. 제공업체마다 관측하는 트랜잭션과 순서가 다를 수 있습니다. 트랜잭션을 대체하거나 취소하기 전에 제출한 지갑 또는 서비스를 확인하세요.</p>"
  },
  "pending-sample": {
    "title": "대기 활동 화면은 무엇을 나타내나요?",
    "description": "<p>대기 화면은 연결된 제공업체의 제한된 샘플입니다. 관측된 트랜잭션과 가스 데이터를 바탕으로 다음 검증자 슬롯을 추정합니다. 전체 네트워크 메모리풀, 경매 주문장 또는 결정적인 여러 블록 예측이 아닙니다.</p><p>샘플에 없다고 트랜잭션이 무효인 것은 아니며, 표시된다고 다음 블록 포함이 보장되는 것도 아닙니다.</p>"
  },
  "transaction-fields": {
    "title": "Ethereum 전용 트랜잭션 필드는 무엇인가요?",
    "description": "<p>Ethereum 메타데이터에는 발신자 및 수신자 식별 정보, nonce, 유형, 입력 데이터, 사용 가능한 경우 디코딩된 메서드 정보, 가스 필드, 수수료 내역, 확인 깊이, 실행 결과, 생성된 계약 정보 및 토큰 전송 기록이 포함됩니다. 정밀도가 중요한 금액은 십진수 문자열이므로 임의 정밀도 정수를 사용하세요.</p><p>입력 디코딩, 라벨, 전송 목록 및 되돌림 이유는 상위 데이터에 의존합니다. 이 정보가 없다고 계약 상호작용이나 로그가 없었다는 뜻은 아닙니다.</p>"
  },
  "address-page": {
    "title": "주소 페이지에는 무엇이 표시되나요?",
    "description": "<p>계정 요약에는 현재 ETH 잔액, 계정 또는 계약 식별 정보, 선택된 토큰 잔액과 인덱싱 데이터를 사용할 수 있을 때의 카운터가 표시됩니다. Ethereum 전용 필드는 <code>ethereum</code> 속성에 있습니다. 잔액은 제공업체의 최신 상태를 반영하며 대기 중인 트랜잭션의 영향은 포함하지 않을 수 있습니다.</p>"
  },
  "history-availability": {
    "title": "계정 또는 토큰 기록이 불완전한 이유는 무엇인가요?",
    "description": "<p>JSON-RPC는 잔액과 계약 코드 같은 상태를 제공할 수 있지만 완전한 주소 및 토큰 기록에는 인덱서가 필요합니다. 대체 경로 사용 중 탐색기는 RPC 기반 계정 세부정보를 제공하고 기록을 <code>historyUnavailable</code>으로 표시합니다.</p><p>토큰 전송 대체 결과에는 <code>recentOnly</code>이 표시됩니다. 이는 최근 표준 전송 로그를 제한적으로 검색한 결과이며 완전한 과거 회계 자료로 사용해서는 안 됩니다.</p>"
  },
  "tokens-and-contracts": {
    "title": "토큰 및 계약 세부정보는 어떻게 얻나요?",
    "description": "<p>토큰 페이지는 계약 주소로 식별합니다. 인덱싱된 메타데이터에는 이름, 기호, 소수 자릿수, 공급량, 보유자 및 전송이 포함될 수 있습니다. 사용할 수 없으면 어댑터가 표준 ERC-20 메서드를 호출해 기본 필드를 얻을 수 있습니다. 반환된 이름이나 기호는 신뢰할 수 없는 메타데이터이며 정당성 검사가 아닙니다.</p><p>이 탐색기는 일반 실행 추적, 내부 트랜잭션 기록, 허용량 API 또는 포트폴리오/회계 API를 제공하지 않습니다.</p>"
  },
  "searching": {
    "title": "무엇을 검색할 수 있나요?",
    "description": "<p>검색은 트랜잭션 해시, 0x로 시작하는 40자리 16진수 주소, 십진수 블록 번호와 블록 해시를 지원합니다. 메타데이터를 사용할 수 있으면 토큰 계약 주소로 토큰 화면을 열 수 있습니다. 정확한 해시와 주소가 가장 신뢰할 수 있는 결과를 제공합니다.</p>"
  },
  "support-disclaimer": {
    "title": "이 탐색기로 자금을 복구하거나 트랜잭션을 되돌릴 수 있나요?",
    "description": "<p>아니요. eth.tx.taxi는 공개 Ethereum 데이터를 표시합니다. 지갑에 접근하거나, 트랜잭션을 취소하거나, 개인 키를 검색하거나, 자금을 복구할 수 없습니다. 계정별 지원은 트랜잭션을 제출한 지갑, 거래소, 브리지 또는 애플리케이션에 문의하세요.</p>"
  },
  "rest-overview": {
    "title": "규칙과 제한",
    "description": "<p>문서화된 경로는 공개 <code>GET</code> 엔드포인트이며 별도 표시가 없으면 JSON을 반환합니다. 해시와 주소 매개변수는 0x로 시작하는 16진수 값입니다. 정밀도가 필요한 금액과 수량은 십진수 문자열이므로 JavaScript <code>Number</code>으로 파싱하지 마세요.</p><p>이는 읽기 API입니다. 트랜잭션 브로드캐스트, 임의 호출 데이터의 가스 추정, 실행 추적, 원시 트랜잭션 바이트 제공은 하지 않으며 인덱서 대체 경로 사용 중 전체 계정 기록을 보장하지 않습니다.</p>"
  },
  "get-init-data": {
    "title": "탐색기 스냅샷",
    "description": "<p>최근 블록, 제한된 대기 샘플, 가스 권장값, 대기 샘플 지표 및 현재 탐색기 상태를 반환합니다. 대시보드 페이로드이며 호환성 필드 이름은 Ethereum 가스 의미를 사용합니다.</p>"
  },
  "get-network-info": {
    "title": "네트워크 상태",
    "description": "<p>관측된 실행 계층 높이, 동기화 상태, 네트워크 이름 및 목표 블록 간격을 밀리초 단위로 반환합니다. 비컨체인 최종성은 보고하지 않습니다.</p>"
  },
  "get-gas-estimates": {
    "title": "권장 가스 가격",
    "description": "<p>빠름, 평균, 느림 호환성 추정값을 정수 wei로 반환합니다. gwei로 바꾸려면 1,000,000,000으로 나누세요. 값은 현재 관측값이며 포함 가격을 보장하지 않습니다.</p>"
  },
  "get-pending-summary": {
    "title": "대기 샘플 요약",
    "description": "<p>관측된 대기 샘플의 수, 샘플링된 가스 및 총 수수료 등의 지표를 반환합니다. 호환 경로 이름과 달리 이는 전체 Ethereum 메모리풀이나 노드 txpool 덤프가 아닙니다.</p>"
  },
  "get-recent-blocks": {
    "title": "최근 블록",
    "description": "<p>탐색기에 맞게 정규화된 현재 최근 블록 범위를 반환합니다.</p>"
  },
  "get-blocks-at-height": {
    "title": "특정 높이에서 끝나는 블록",
    "description": "<p>십진수 실행 블록 높이 <code>:height</code>에서 끝나는 사용 가능한 최근 블록 범위를 반환합니다.</p>"
  },
  "get-block-height": {
    "title": "특정 높이의 블록 해시",
    "description": "<p>십진수 블록 높이에 대한 0x로 시작하는 블록 해시를 일반 텍스트로 반환합니다.</p>"
  },
  "get-block": {
    "title": "해시로 블록 조회",
    "description": "<p>Ethereum 블록 해시의 정규화된 세부정보를 반환합니다. 이는 실행 계층 데이터이며 검증자와 합의 최종성 세부정보는 이 API의 범위 밖입니다.</p>"
  },
  "get-block-transactions": {
    "title": "블록 트랜잭션",
    "description": "<p>0부터 시작하는 오프셋 <code>:start</code>에서 블록의 정규화된 트랜잭션을 최대 25개 반환합니다. 사용 가능한 경우 인덱싱 데이터를 사용하고 그렇지 않으면 RPC 블록 트랜잭션을 사용합니다.</p>"
  },
  "get-transaction": {
    "title": "해시로 트랜잭션 조회",
    "description": "<p><code>status.confirmed</code>과 <code>ethereum</code> 메타데이터 객체가 포함된 정규화된 탐색기 트랜잭션을 반환합니다.</p>"
  },
  "get-transaction-status": {
    "title": "트랜잭션 포함 상태",
    "description": "<p>포함 상태와 확인된 경우 사용 가능한 실행 블록 높이, 해시 및 시각을 반환합니다. 계약 실행의 성공 여부는 알려주지 않으므로 구분하려면 트랜잭션 메타데이터를 사용하세요.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Ethereum 트랜잭션 메타데이터",
    "description": "<p>실행 상태와 결과, 확인 수, 발신자/수신자 또는 생성된 계약, wei 값, 가스와 수수료 필드, nonce, 입력 및 가능한 경우 디코딩된 메서드, 토큰 전송, 제공된 오류 또는 되돌림 메타데이터를 반환합니다. 추적 엔드포인트가 아닙니다.</p>"
  },
  "get-address": {
    "title": "계정 요약",
    "description": "<p>정규화된 주소 요약을 반환합니다. Ethereum 잔액, 식별 정보, 카운터, 토큰 잔액 및 기록 기능은 <code>ethereum</code> 아래에 있습니다. 대체 경로는 <code>ethereum.historyUnavailable</code>을 설정할 수 있습니다.</p>"
  },
  "get-address-transactions": {
    "title": "계정 트랜잭션",
    "description": "<p>주소의 인덱싱된 트랜잭션을 반환합니다. 반환된 트랜잭션 이후부터 계속하려면 <code>?after_txid=0x…</code>을 추가하세요. RPC 대체 경로는 빈 목록을 반환하지만 온체인 기록이 비어 있음을 뜻하지 않습니다.</p>"
  },
  "get-address-metadata": {
    "title": "Ethereum 계정 메타데이터",
    "description": "<p>계정 또는 계약 식별 정보, 현재 ETH 잔액(wei 단위), 사용 가능한 생성 메타데이터, 카운터, 선택된 토큰 잔액 및 <code>historyUnavailable</code>을 반환합니다.</p>"
  },
  "get-token": {
    "title": "토큰 메타데이터",
    "description": "<p>토큰 계약의 메타데이터를 반환합니다. 인덱서 메타데이터를 우선 사용하며 기본 ERC-20 필드는 직접 계약 호출로 대체할 수 있습니다. 없는 필드는 사용할 수 없는 것으로, 이름과 기호는 신뢰할 수 없는 것으로 취급하세요.</p>"
  },
  "get-token-transfers": {
    "title": "토큰 전송",
    "description": "<p>전송 및 페이지네이션 메타데이터를 반환합니다. 인덱싱된 요청은 숫자 <code>block_number</code>, <code>index</code> 및 <code>items_count</code>를 받습니다. 대체 경로는 <code>historyUnavailable: true</code>과 <code>recentOnly: true</code>를 설정합니다. 이는 최근 표준 전송 로그의 제한된 검색이며 전체 기록이 아닙니다.</p>"
  },
  "websocket-connect": {
    "title": "연결하여 실시간 스냅샷 받기",
    "description": "<p><code>/api/v1/ws</code>에 연결합니다. 서버는 최초 탐색기 스냅샷과 관측된 최신 블록 또는 대기 샘플이 변경될 때의 후속 스냅샷을 보내고 정기적인 하트비트도 보냅니다. 스냅샷 필드는 <code>/api/v1/init-data</code>을 따릅니다.</p><p>이는 제공업체를 기반으로 한 어댑터 화면이며 원시 실행 클라이언트 구독이나 전역 메모리풀 스트림이 아닙니다.</p>"
  },
  "websocket-init": {
    "title": "최신 스냅샷 요청",
    "description": "<p>현재 탐색기 스냅샷을 즉시 보내며 재연결 후 유용합니다.</p>"
  },
  "websocket-ping": {
    "title": "연결 유지 ping",
    "description": "<p>연결이 응답하는지 확인합니다.</p>"
  },
  "websocket-track-transaction": {
    "title": "단일 트랜잭션 추적",
    "description": "<p>0x로 시작하는 32바이트 해시 하나를 추적합니다. 서버는 먼저 호환성 <code>txPosition</code> 추정값을 보내고 정규화된 상태가 바뀌면 <code>{ \"tx\": … }</code>을 보냅니다. 새 해시는 이전 구독을 대체합니다. 다음 슬롯 위치는 관측 샘플 기반 추정치이며 포함을 보장하지 않습니다.</p>"
  },
  "websocket-track-address": {
    "title": "단일 계정 추적",
    "description": "<p>사용 가능한 인덱싱 기록으로 주소 하나를 추적합니다. 새로 관측된 대기 트랜잭션은 <code>address-transactions</code>으로, 새로 확인되었거나 변경된 트랜잭션은 <code>block-transactions</code>로 도착합니다. 새 주소는 이전 구독을 대체합니다. 기록 인덱싱을 사용할 수 없으면 이벤트를 만들어내지 않습니다.</p>"
  },
  "websocket-track-pending": {
    "title": "다음 슬롯 대기 추정 추적",
    "description": "<p>인덱스 <code>0</code>은 관측된 대기 샘플 추정값을 <code>projected-block-transactions</code>로 반환합니다. Ethereum에는 결정적인 다중 블록 패키지 예측이 없으므로 더 높은 인덱스에는 예상 트랜잭션이 없습니다. 구독을 해제하려면 <code>-1</code>를 보내세요.</p>"
  },
  "websocket-reconnect": {
    "title": "안전하게 재연결",
    "description": "<p>연결 종료 후 대기 간격을 늘려 재연결하고 <code>{ \"action\": \"init\" }</code>을 보낸 다음 구독을 다시 만드세요. 형식이 잘못되었거나 지원되지 않는 구독 메시지는 무시됩니다. 클라이언트 데이터를 검증하고 응답이 없다는 이유만으로 수락되었다고 추정하지 마세요.</p>"
  }
};

export function localizeEthereumDocsKorean(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('ko')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
