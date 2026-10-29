import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Ethereumの基本",
  "Basics": "基本",
  "Gas and fees": "ガスと手数料",
  "Fees": "手数料",
  "Transaction status": "トランザクションの状態",
  "Transactions": "トランザクション",
  "Accounts, contracts, and tokens": "アカウント、コントラクト、トークン",
  "Accounts": "アカウント",
  "Tokens": "トークン",
  "Explorer": "エクスプローラー",
  "Support": "サポート",
  "Using the API": "APIの使用方法",
  "Overview": "概要",
  "Network and pending sample": "ネットワークと保留中サンプル",
  "Network": "ネットワーク",
  "Blocks": "ブロック",
  "Accounts and tokens": "アカウントとトークン",
  "Connection": "接続",
  "Actions": "アクション",
  "Subscriptions": "購読"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Ethereumトランザクションの仕組みは？",
    "description": "<p>Ethereumトランザクションは外部所有アカウントからの署名済み指示です。ETHの転送、スマートコントラクトの呼び出し、コントラクトの作成、またはETHの価値を伴わないデータの送信ができます。送信者のnonceはそのアカウントのトランザクション順序を決めるため、前のnonceが未解決の間は後のnonceを取り込めません。</p><p>エクスプローラーでは転送されたETHと手数料を区別します。ETHの価値がゼロでも、コントラクト呼び出しによってトークンの移動や状態の変更が起こることがあります。</p><p class=\"mt-3\">プロトコルの背景：<a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">トランザクション</a>、<a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">ガスと手数料</a>、<a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">アカウント</a>。</p>"
  },
  "accounts-and-contracts": {
    "title": "アカウントとコントラクトの違いは？",
    "description": "<p>アドレスは外部所有アカウントとコントラクトアカウントを識別します。秘密鍵は外部所有アカウントを制御してトランザクションを開始します。コントラクトはコードを含み、呼び出されると実行されます。コントラクトの状態、名前、ラベル、検証の詳細はプロバイダーのメタデータであり、取得できない場合があります。</p><p>エクスプローラーではアドレスの所有者を確定できません。</p>"
  },
  "blocks-confirmations-finality": {
    "title": "ブロック、確認、ファイナリティとは？",
    "description": "<p>Ethereumメインネットはプルーフ・オブ・ステークを使用します。トランザクションは実行ブロックに取り込まれると確認されます。確認数は、そのブロックに後続のブロックが積み重なることで観測される実行レイヤーのブロック深度です。</p><p>確認の深さは参考情報であり、コンセンサスによるファイナリティの証明ではありません。このエクスプローラーはビーコンチェーンのファイナリティチェックポイントや最終確定のAPIを提供していません。任意の確認数をプロトコルのファイナリティとみなさないでください。</p>"
  },
  "what-is-gas": {
    "title": "ガス、wei、gweiとは？",
    "description": "<p>ガスはEVMの計算作業量を表します。weiはETHの最小単位です。1 ETHは10<sup>18</sup> weiです。ガス価格は通常gweiで表示されます。1 gweiは10<sup>9</sup> wei、つまり0.000000001 ETHです。</p><p><code>gasLimit</code>は許可された最大ガス、<code>gasUsed</code>は取り込まれたトランザクションが消費した作業量です。実行手数料は使用ガスに実効ガス価格を掛けたものです。ブロブ手数料がある場合は別に表示されます。</p>"
  },
  "base-and-priority-fees": {
    "title": "基本手数料、優先手数料、最大手数料の仕組みは？",
    "description": "<p>EIP-1559トランザクションでは、<code>maxFeePerGas</code>が許可価格の上限、<code>maxPriorityFeePerGas</code>がチップの上限を定めます。実効価格は、これらの上限内でブロックの基本手数料と適用される優先手数料によって決まります。基本手数料部分はバーンされ、優先手数料はバリデーターへのインセンティブとなります。</p><p>最大手数料は上限であり、実際の支払額とは限りません。レガシートランザクションでは代わりにガス価格フィールドが表示されます。</p>"
  },
  "fee-estimates": {
    "title": "ガス価格の推奨値はどう使えばよいですか？",
    "description": "<p>低速、平均、高速の値はプロバイダーによる観測値で、REST APIからwei単位で返されます。見積もりや取り込みの保証ではありません。ウォレットは緊急度、nonceの依存関係、最新の基本手数料に基づいて設定を選択できます。</p><p>取り込み済みのトランザクションでは、実効ガス価格と使用ガスから支払額を把握します。保留中のトランザクションでは、最大手数料の見込みしか分からない場合があります。</p>"
  },
  "execution-status-and-confirmations": {
    "title": "確定済みトランザクションが失敗するのはなぜですか？",
    "description": "<p>ブロックへの取り込みと実行は別の事実です。トランザクションはブロックに取り込まれても、EVM実行に失敗してリバートやエラーになることがあり、ガスも消費し得ます。成功結果は記録された実行が完了したことを意味し、コントラクト操作がユーザーの期待した結果になったことを保証しません。</p><p><code>status.confirmed</code>、Ethereumの<code>status</code>／<code>result</code>、エラーフラグ、利用可能なリバート理由をあわせて確認してください。</p>"
  },
  "why-pending": {
    "title": "トランザクションが保留中または見つからないのはなぜですか？",
    "description": "<p>保留中のトランザクションは、価格が低すぎる、送信者のより小さいnonceでブロックされている、プロバイダーにまだ見えていない、同じnonceで置き換えられた、または送信元のウォレットやノードによって破棄された可能性があります。保留画面だけではどれが起きたか判断できません。</p><p>Ethereumには単一のグローバルなメモリプールはありません。プロバイダーごとに観測するトランザクションや順序が異なります。置き換えやキャンセルの前に、送信元のウォレットやサービスを確認してください。</p>"
  },
  "pending-sample": {
    "title": "保留中のアクティビティ表示は何を表しますか？",
    "description": "<p>保留中の表示は、接続されたプロバイダーからの限定的なサンプルです。観測されたトランザクションとガスデータから次のバリデータースロットを推定します。ネットワーク全体のメモリプール、オークション板、確定的な複数ブロック予測ではありません。</p><p>サンプルにないことはトランザクションが無効であることを意味せず、表示されることも次のブロックへの取り込みを保証しません。</p>"
  },
  "transaction-fields": {
    "title": "Ethereum固有のトランザクション項目は？",
    "description": "<p>Ethereumのメタデータには送信者と受取人の識別情報、nonce、種類、入力データ、利用可能な場合のデコード済みメソッド詳細、ガス項目、手数料の内訳、確認の深さ、実行結果、作成されたコントラクト情報、トークン転送記録が含まれます。精度が重要な金額は十進数文字列です。任意精度の整数を使用してください。</p><p>入力のデコード、ラベル、転送一覧、リバート理由は上流データに依存します。これらがないことは、コントラクト操作やログがなかったことの証明にはなりません。</p>"
  },
  "address-page": {
    "title": "アドレスページには何が表示されますか？",
    "description": "<p>アカウントの概要には現在のETH残高、アカウントまたはコントラクトの識別情報、選択されたトークン残高、インデックスデータが利用可能な場合はカウンターが表示されます。Ethereum固有の項目は<code>ethereum</code>プロパティにあります。残高はプロバイダーの最新状態を反映し、保留中トランザクションの影響を含まない場合があります。</p>"
  },
  "history-availability": {
    "title": "アカウントやトークンの履歴が不完全なのはなぜですか？",
    "description": "<p>JSON-RPCは残高やコントラクトコードなどの状態を提供できますが、完全なアドレスとトークンの履歴にはインデクサーが必要です。フォールバック中、エクスプローラーはRPCに基づくアカウント詳細を提供し、履歴を<code>historyUnavailable</code>で示します。</p><p>トークン転送のフォールバックには<code>recentOnly</code>が付与されます。これは最近の標準転送ログを範囲限定で走査したもので、完全な過去の会計記録として使用してはいけません。</p>"
  },
  "tokens-and-contracts": {
    "title": "トークンとコントラクトの詳細はどのように取得されますか？",
    "description": "<p>トークンページはコントラクトアドレスで識別されます。インデックスされたメタデータには名前、シンボル、小数桁数、供給量、保有者、転送が含まれる場合があります。利用できない場合、アダプターは標準のERC-20メソッドを呼び出して基本情報を取得できます。返された名前やシンボルは信頼できないメタデータであり、正当性の確認ではありません。</p><p>このエクスプローラーは汎用実行トレース、内部トランザクション履歴、allowance API、ポートフォリオ／会計APIを提供していません。</p>"
  },
  "searching": {
    "title": "何を検索できますか？",
    "description": "<p>検索はトランザクションハッシュ、0xで始まる40桁の十六進アドレス、十進数のブロック番号、ブロックハッシュに対応しています。メタデータが利用可能な場合、トークンコントラクトのアドレスからトークン画面を開けます。正確なハッシュやアドレスが最も確実な結果につながります。</p>"
  },
  "support-disclaimer": {
    "title": "このエクスプローラーは資金の復旧やトランザクションの取り消しができますか？",
    "description": "<p>いいえ。eth.tx.taxiは公開Ethereumデータを表示します。ウォレットへのアクセス、トランザクションの取り消し、秘密鍵の取得、資金の復旧はできません。アカウント固有のサポートについては、トランザクションを送信したウォレット、取引所、ブリッジ、アプリケーションにお問い合わせください。</p>"
  },
  "rest-overview": {
    "title": "規約と制限",
    "description": "<p>掲載されているルートは公開<code>GET</code>エンドポイントで、特記がない限りJSONを返します。ハッシュとアドレスのパラメーターは0xで始まる十六進数です。精度が必要な金額と数量は十進数文字列です。JavaScriptの<code>Number</code>として解析しないでください。</p><p>これは読み取り用APIです。トランザクションのブロードキャスト、任意の呼び出しデータのガス推定、実行トレース、トランザクションの生バイト列の提供は行わず、インデクサーのフォールバック中は完全なアカウント履歴を保証しません。</p>"
  },
  "get-init-data": {
    "title": "エクスプローラーのスナップショット",
    "description": "<p>最近のブロック、範囲限定の保留サンプル、ガス推奨値、保留サンプルの指標、現在のエクスプローラー状態を返します。ダッシュボードのペイロードであり、互換フィールド名はEthereumのガスの意味に従います。</p>"
  },
  "get-network-info": {
    "title": "ネットワークの状態",
    "description": "<p>観測された実行レイヤーのブロック高、同期状態、ネットワーク名、目標ブロック間隔をミリ秒で返します。ビーコンチェーンのファイナリティは報告しません。</p>"
  },
  "get-gas-estimates": {
    "title": "推奨ガス価格",
    "description": "<p>高速、平均、低速の互換推定値を整数のweiで返します。gweiに変換するには1,000,000,000で割ります。値は現在の観測値であり、取り込み価格を保証するものではありません。</p>"
  },
  "get-pending-summary": {
    "title": "保留中サンプルの概要",
    "description": "<p>観測された保留中サンプルの件数、サンプル内ガス、手数料合計などの指標を返します。互換ルートの名前にかかわらず、Ethereumメモリプール全体やノードのtxpoolダンプではありません。</p>"
  },
  "get-recent-blocks": {
    "title": "最近のブロック",
    "description": "<p>エクスプローラー用に正規化された現在の最近ブロック一覧を返します。</p>"
  },
  "get-blocks-at-height": {
    "title": "指定した高さで終わるブロック",
    "description": "<p>十進数の実行ブロック高<code>:height</code>で終わる、利用可能な最近ブロック一覧を返します。</p>"
  },
  "get-block-height": {
    "title": "指定した高さのブロックハッシュ",
    "description": "<p>十進数のブロック高に対応する0xで始まるブロックハッシュをプレーンテキストで返します。</p>"
  },
  "get-block": {
    "title": "ハッシュによるブロック検索",
    "description": "<p>Ethereumブロックハッシュの正規化された詳細を返します。これは実行レイヤーのデータです。バリデーターやコンセンサスのファイナリティの詳細はこのAPIの対象外です。</p>"
  },
  "get-block-transactions": {
    "title": "ブロックのトランザクション",
    "description": "<p>ブロック内の正規化済みトランザクションを、ゼロ始まりのオフセット<code>:start</code>から最大25件返します。インデックス済みデータを利用できる場合はそれを使い、それ以外はRPCブロックのトランザクションを使用します。</p>"
  },
  "get-transaction": {
    "title": "ハッシュによるトランザクション検索",
    "description": "<p><code>status.confirmed</code>と<code>ethereum</code>メタデータオブジェクトを含む正規化済みエクスプローラートランザクションを返します。</p>"
  },
  "get-transaction-status": {
    "title": "トランザクションの取り込み状態",
    "description": "<p>取り込み状態と、確認済みの場合は利用可能な実行ブロック高、ハッシュ、時刻を返します。コントラクトの実行が成功したかどうかは示しません。その区別にはトランザクションのメタデータを使用します。</p>"
  },
  "get-ethereum-transaction": {
    "title": "Ethereumトランザクションのメタデータ",
    "description": "<p>実行状態と結果、確認数、送信者／受取人または作成されたコントラクト、wei値、ガスと手数料の項目、nonce、入力、利用可能な場合はデコード済みメソッド、トークン転送、提供されたエラーやリバートのメタデータを返します。トレース用エンドポイントではありません。</p>"
  },
  "get-address": {
    "title": "アカウントの概要",
    "description": "<p>正規化されたアドレスの概要を返します。Ethereumの残高、識別情報、カウンター、トークン残高、履歴の可用性は<code>ethereum</code>にあります。フォールバックでは<code>ethereum.historyUnavailable</code>が設定されることがあります。</p>"
  },
  "get-address-transactions": {
    "title": "アカウントのトランザクション",
    "description": "<p>アドレスのインデックス済みトランザクションを返します。返されたトランザクションの後から続行するには<code>?after_txid=0x…</code>を追加します。RPCフォールバックは空の一覧を返しますが、オンチェーン履歴が空であることを意味しません。</p>"
  },
  "get-address-metadata": {
    "title": "Ethereumアカウントのメタデータ",
    "description": "<p>アカウントまたはコントラクトの識別情報、現在のETH残高（wei単位）、利用可能な作成メタデータ、カウンター、選択されたトークン残高、<code>historyUnavailable</code>を返します。</p>"
  },
  "get-token": {
    "title": "トークンのメタデータ",
    "description": "<p>トークンコントラクトのメタデータを返します。インデクサーのメタデータを優先しますが、基本的なERC-20項目は直接コントラクトを呼び出して取得する場合があります。欠けている項目は取得不可として扱い、名前やシンボルは信頼できないものとして扱ってください。</p>"
  },
  "get-token-transfers": {
    "title": "トークン転送",
    "description": "<p>転送とページ送りのメタデータを返します。インデックス済みリクエストは数値の<code>block_number</code>、<code>index</code>、<code>items_count</code>を受け付けます。フォールバックでは<code>historyUnavailable: true</code>と<code>recentOnly: true</code>が設定されます。これは最近の標準転送ログを範囲限定で走査したもので、完全な履歴ではありません。</p>"
  },
  "websocket-connect": {
    "title": "接続してリアルタイムスナップショットを受信",
    "description": "<p><code>/api/v1/ws</code>に接続します。サーバーは最初のエクスプローラースナップショットを送信し、その後は観測された最新ブロックや保留サンプルが変化すると更新を送信します。定期的なハートビートもあります。スナップショットのフィールドは<code>/api/v1/init-data</code>に従います。</p><p>これはプロバイダーに基づくアダプターの表示であり、生の実行クライアント購読やグローバルメモリプールのストリームではありません。</p>"
  },
  "websocket-init": {
    "title": "最新のスナップショットを要求",
    "description": "<p>現在のエクスプローラースナップショットをすぐに送信します。再接続後に便利です。</p>"
  },
  "websocket-ping": {
    "title": "接続維持のping",
    "description": "<p>接続が応答することを確認します。</p>"
  },
  "websocket-track-transaction": {
    "title": "一つのトランザクションを追跡",
    "description": "<p>0xで始まる32バイトのハッシュを一つ追跡します。サーバーはまず互換性のための<code>txPosition</code>推定を送信し、正規化済み状態が変化すると<code>{ \"tx\": … }</code>を送信します。新しいハッシュは以前の購読を置き換えます。次のスロット内の位置は観測サンプルに基づく推定であり、取り込みを保証しません。</p>"
  },
  "websocket-track-address": {
    "title": "一つのアカウントを追跡",
    "description": "<p>利用可能なインデックス済み履歴を使って一つのアドレスを追跡します。新しく観測された保留中トランザクションは<code>address-transactions</code>、新たに確認されたか変更されたトランザクションは<code>block-transactions</code>として届きます。新しいアドレスは以前の購読を置き換えます。履歴のインデックスが利用できない場合、イベントを合成しません。</p>"
  },
  "websocket-track-pending": {
    "title": "次のスロットの保留中推定を追跡",
    "description": "<p>インデックス<code>0</code>は観測された保留サンプルの推定を<code>projected-block-transactions</code>として返します。Ethereumには確定的な複数ブロックのパッケージ予測がないため、より大きいインデックスには予測トランザクションがありません。購読を解除するには<code>-1</code>を送信します。</p>"
  },
  "websocket-reconnect": {
    "title": "安全に再接続する",
    "description": "<p>切断後は間隔を延ばしながら再接続し、<code>{ \"action\": \"init\" }</code>を送信してから購読を再作成します。不正な形式やサポートされない購読メッセージは無視されます。クライアントのペイロードを検証し、応答がないことから受理を推測しないでください。</p>"
  }
};

export function localizeEthereumDocsJapanese(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('ja')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
