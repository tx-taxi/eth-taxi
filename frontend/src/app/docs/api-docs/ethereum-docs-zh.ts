import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Ethereum 基础",
  "Basics": "基础",
  "Gas and fees": "Gas 和手续费",
  "Fees": "手续费",
  "Transaction status": "交易状态",
  "Transactions": "交易",
  "Accounts, contracts, and tokens": "账户、合约和代币",
  "Accounts": "账户",
  "Tokens": "代币",
  "Explorer": "浏览器",
  "Support": "支持",
  "Using the API": "使用 API",
  "Overview": "概览",
  "Network and pending sample": "网络和待处理样本",
  "Network": "网络",
  "Blocks": "区块",
  "Accounts and tokens": "账户和代币",
  "Connection": "连接",
  "Actions": "操作",
  "Subscriptions": "订阅"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Ethereum 交易如何运作？",
    "description": "<p>Ethereum 交易是外部拥有账户发出的已签名指令。它可以转移ETH、调用智能合约、创建合约，或携带不含ETH价值的数据。发送方 nonce 决定该账户交易的顺序，因此较早的 nonce 尚未解决时，较晚的 nonce 无法被包含。</p><p>浏览器区分转移的ETH和手续费。即使ETH价值为零，合约调用仍可能转移代币或改变状态。</p><p class=\"mt-3\">协议背景：<a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">交易</a>、<a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gas 和手续费</a>以及<a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">账户</a>。</p>"
  },
  "accounts-and-contracts": {
    "title": "账户和合约有什么区别？",
    "description": "<p>地址用于标识外部拥有账户和合约账户。私钥控制外部拥有账户并发起交易；合约包含代码，在被调用时运行。合约状态、名称、标签和验证详情属于提供商元数据，可能不可用。</p><p>浏览器无法确定地址的所有权。</p>"
  },
  "blocks-confirmations-finality": {
    "title": "区块、确认和最终性是什么意思？",
    "description": "<p>Ethereum 主网使用权益证明。交易被包含在执行区块后即获得确认。随着后续区块在其上构建，确认数反映观察到的执行层区块深度。</p><p>确认深度是有用的参考，但不是共识最终性的证明。本浏览器不提供信标链最终性检查点或最终确定API，因此不要把任意选定的确认数视为协议最终性。</p>"
  },
  "what-is-gas": {
    "title": "什么是 gas、wei 和 gwei？",
    "description": "<p>Gas 衡量 EVM 的计算工作量。Wei 是ETH的最小单位：1 ETH等于10<sup>18</sup> wei。Gas 价格通常以 gwei 显示：1 gwei 等于10<sup>9</sup> wei，即0.000000001 ETH。</p><p><code>gasLimit</code>是授权的最大 gas；<code>gasUsed</code>是已包含交易消耗的工作量。执行手续费等于已用 gas 乘以有效 gas 价格。有 Blob 手续费时会单独显示。</p>"
  },
  "base-and-priority-fees": {
    "title": "基础手续费、优先手续费和最高手续费如何工作？",
    "description": "<p>对于 EIP-1559交易，<code>maxFeePerGas</code>限制授权价格，<code>maxPriorityFeePerGas</code>限制小费。有效价格由区块基础手续费加上适用的优先手续费决定，并受这些上限约束。基础手续费部分被销毁；优先手续费是验证者的激励。</p><p>最高手续费是上限，不一定是实际支付金额。传统交易使用 gas 价格字段。</p>"
  },
  "fee-estimates": {
    "title": "应如何使用 gas 价格建议？",
    "description": "<p>慢速、平均和快速值是基于提供商的观察结果，由 REST API以 wei 返回。它们不是报价或包含保证。钱包可以根据紧急程度、nonce 依赖关系和最新基础手续费选择设置。</p><p>对于已包含交易，可使用有效 gas 价格和已用 gas 了解实际支付金额。待处理交易可能只能知道最大手续费敞口。</p>"
  },
  "execution-status-and-confirmations": {
    "title": "为什么已确认交易也可能失败？",
    "description": "<p>区块包含与执行是不同的事实。交易可能已在区块中确认，但由于 EVM 执行失败而回退或报错；它仍可能消耗 gas。成功结果表示记录的执行已完成，不代表合约交互一定达到用户预期的业务结果。</p><p>请结合<code>status.confirmed</code>、Ethereum <code>status</code>／<code>result</code>、错误标志以及可用的回退原因一起查看。</p>"
  },
  "why-pending": {
    "title": "为什么交易待处理或找不到？",
    "description": "<p>待处理交易可能定价过低、被发送方更低的 nonce 阻塞、尚未被提供商看到、被相同 nonce 的交易替换，或被提交的钱包或节点丢弃。仅凭待处理视图无法确定发生了哪种情况。</p><p>Ethereum 没有单一的全局内存池。不同提供商可能观察到不同的交易和顺序。在替换或取消交易之前，请检查提交交易的钱包或服务。</p>"
  },
  "pending-sample": {
    "title": "待处理活动视图代表什么？",
    "description": "<p>待处理显示是连接的提供商给出的有限样本。它根据观察到的交易和 gas 数据估计下一验证者时隙。它不是完整的网络内存池、拍卖订单簿或确定性的多区块预测。</p><p>样本中没有交易不代表交易无效；样本中出现交易也不保证被下一个区块包含。</p>"
  },
  "transaction-fields": {
    "title": "哪些交易字段是 Ethereum 特有的？",
    "description": "<p>Ethereum 元数据包括发送方和接收方身份、nonce、类型、输入数据、可用时的解码方法详情、gas 字段、手续费明细、确认深度、执行结果、创建的合约信息和代币转移记录。精度敏感的金额是十进制字符串，应使用任意精度整数。</p><p>输入解码、标签、转移列表和回退原因依赖上游数据。缺少这些信息不能证明交易没有合约交互或日志。</p>"
  },
  "address-page": {
    "title": "地址页面显示什么？",
    "description": "<p>账户摘要显示当前ETH余额、账户或合约身份、选定的代币余额，以及索引数据可用时的计数。Ethereum 专用字段位于<code>ethereum</code>属性下。余额反映提供商的最新状态，可能不包含待处理交易的影响。</p>"
  },
  "history-availability": {
    "title": "为什么账户或代币历史不完整？",
    "description": "<p>JSON-RPC可以提供余额和合约代码等状态，但完整的地址和代币历史需要索引器。回退时，浏览器提供基于RPC的账户详情，并用<code>historyUnavailable</code>标记历史。</p><p>代币转移回退标记为<code>recentOnly</code>。它只是对近期标准转移日志的有限扫描，不应作为完整历史账目使用。</p>"
  },
  "tokens-and-contracts": {
    "title": "代币和合约详情如何获得？",
    "description": "<p>代币页面以合约地址为键。索引元数据可能包括名称、符号、小数位、供应量、持有者和转移。不可用时，适配器可以调用标准 ERC-20方法获取基本字段。返回的名称或符号属于不可信元数据，不是合法性验证。</p><p>本浏览器不提供通用执行追踪、内部交易历史、授权额度 API 或投资组合／会计 API。</p>"
  },
  "searching": {
    "title": "可以搜索什么？",
    "description": "<p>搜索支持交易哈希、以 0x 开头的40位十六进制地址、十进制区块编号和区块哈希。元数据可用时，代币合约地址可以打开代币视图。精确哈希和地址可提供最可靠的结果。</p>"
  },
  "support-disclaimer": {
    "title": "浏览器能找回资金或撤销交易吗？",
    "description": "<p>不能。eth.tx.taxi 显示公开 Ethereum 数据。它无法访问钱包、撤销交易、获取私钥或找回资金。有关账户的支持，请联系提交交易的钱包、交易所、跨链桥或应用。</p>"
  },
  "rest-overview": {
    "title": "约定与限制",
    "description": "<p>文档中的路由是公开的<code>GET</code>端点，除非另有说明，否则返回JSON。哈希和地址参数是以 0x 开头的十六进制值。需要精度的金额和数量是十进制字符串；不要用 JavaScript <code>Number</code>解析。</p><p>这是只读API。它不广播交易、不为任意调用数据估算 gas、不提供执行追踪或原始交易字节，也不保证索引器回退期间的账户历史完整。</p>"
  },
  "get-init-data": {
    "title": "浏览器快照",
    "description": "<p>返回最近区块、有限的待处理样本、gas 建议、待处理样本指标和当前浏览器状态。这是仪表盘数据；兼容字段名称采用 Ethereum gas 语义。</p>"
  },
  "get-network-info": {
    "title": "网络状态",
    "description": "<p>返回观察到的执行层高度、同步状态、网络名称和以毫秒计的目标区块间隔。它不报告信标链最终性。</p>"
  },
  "get-gas-estimates": {
    "title": "推荐 gas 价格",
    "description": "<p>以整数 wei 返回快速、平均和慢速兼容估计值。除以1,000,000,000可转换为 gwei。这些值是当前观察结果，不保证交易被包含。</p>"
  },
  "get-pending-summary": {
    "title": "待处理样本摘要",
    "description": "<p>返回观察到的待处理样本指标，包括数量、采样 gas 和手续费总额。尽管路由使用兼容名称，它不是完整的 Ethereum 内存池或节点 txpool 转储。</p>"
  },
  "get-recent-blocks": {
    "title": "最近区块",
    "description": "<p>返回为浏览器标准化的当前最近区块窗口。</p>"
  },
  "get-blocks-at-height": {
    "title": "截至指定高度的区块",
    "description": "<p>返回截至十进制执行区块高度<code>:height</code>的可用近期区块窗口。</p>"
  },
  "get-block-height": {
    "title": "指定高度的区块哈希",
    "description": "<p>针对十进制区块高度，以纯文本返回以 0x 开头的区块哈希。</p>"
  },
  "get-block": {
    "title": "按哈希查找区块",
    "description": "<p>返回 Ethereum 区块哈希的标准化详情。这是执行层数据；验证者和共识最终性详情不在此API范围内。</p>"
  },
  "get-block-transactions": {
    "title": "区块交易",
    "description": "<p>从零起始的偏移量<code>:start</code>开始，返回区块中最多25笔标准化交易。优先使用可用的索引数据，否则使用RPC区块交易。</p>"
  },
  "get-transaction": {
    "title": "按哈希查找交易",
    "description": "<p>返回标准化浏览器交易，包括<code>status.confirmed</code>和<code>ethereum</code>元数据对象。</p>"
  },
  "get-transaction-status": {
    "title": "交易包含状态",
    "description": "<p>返回包含状态；确认后还会在可用时返回执行区块高度、哈希和时间。它不说明合约执行是否成功；请使用交易元数据区分。</p>"
  },
  "get-ethereum-transaction": {
    "title": "Ethereum 交易元数据",
    "description": "<p>返回执行状态和结果、确认数、发送方／接收方或创建的合约、wei 金额、gas 和手续费字段、nonce、输入及可用时的解码方法、代币转移以及提供的错误或回退元数据。这不是追踪端点。</p>"
  },
  "get-address": {
    "title": "账户摘要",
    "description": "<p>返回标准化地址摘要。Ethereum 余额、身份、计数、代币余额和历史能力位于<code>ethereum</code>下。回退可能设置<code>ethereum.historyUnavailable</code>。</p>"
  },
  "get-address-transactions": {
    "title": "账户交易",
    "description": "<p>返回地址的索引交易。添加<code>?after_txid=0x…</code>可从返回的交易之后继续。RPC回退返回空列表，但不表示链上历史为空。</p>"
  },
  "get-address-metadata": {
    "title": "Ethereum 账户元数据",
    "description": "<p>返回账户或合约身份、以 wei 计的当前ETH余额、可用的创建元数据、计数、选定的代币余额和<code>historyUnavailable</code>。</p>"
  },
  "get-token": {
    "title": "代币元数据",
    "description": "<p>返回代币合约的元数据。优先使用索引器元数据；基本 ERC-20字段可回退到直接合约调用。缺失字段应视为不可用，名称或符号应视为不可信信息。</p>"
  },
  "get-token-transfers": {
    "title": "代币转移",
    "description": "<p>返回转移和分页元数据。索引请求接受数值<code>block_number</code>、<code>index</code>和<code>items_count</code>。回退时设置<code>historyUnavailable: true</code>和<code>recentOnly: true</code>：这只是对近期标准转移日志的有限扫描，不是完整历史。</p>"
  },
  "websocket-connect": {
    "title": "连接并接收实时快照",
    "description": "<p>连接<code>/api/v1/ws</code>。服务器发送初始浏览器快照，并在观察到的链尖或待处理样本变化时发送后续快照，同时定期发送心跳。快照字段遵循<code>/api/v1/init-data</code>。</p><p>这是基于提供商的适配器视图，不是原始执行客户端订阅或全局内存池流。</p>"
  },
  "websocket-init": {
    "title": "请求最新快照",
    "description": "<p>立即发送当前浏览器快照，适合重新连接后使用。</p>"
  },
  "websocket-ping": {
    "title": "保活 ping",
    "description": "<p>检查连接是否响应。</p>"
  },
  "websocket-track-transaction": {
    "title": "追踪单笔交易",
    "description": "<p>追踪一个以 0x 开头、长度为32字节的哈希。服务器先发送兼容的<code>txPosition</code>估计值，然后在标准化状态变化时发送<code>{ \"tx\": … }</code>。新哈希会替换先前订阅。下一时隙位置是基于观察样本的估计，并不保证被包含。</p>"
  },
  "websocket-track-address": {
    "title": "追踪单个账户",
    "description": "<p>使用可用的索引历史追踪一个地址。新观察到的待处理交易以<code>address-transactions</code>发送；新确认或已更改的交易以<code>block-transactions</code>发送。新地址会替换先前订阅。历史索引不可用时不会合成事件。</p>"
  },
  "websocket-track-pending": {
    "title": "追踪下一时隙待处理估计",
    "description": "<p>索引<code>0</code>以<code>projected-block-transactions</code>返回观察到的待处理样本估计。Ethereum 没有确定性的多区块交易包预测，因此更高索引没有预测交易。发送<code>-1</code>可清除订阅。</p>"
  },
  "websocket-reconnect": {
    "title": "安全重新连接",
    "description": "<p>连接关闭后使用退避策略重新连接，发送<code>{ \"action\": \"init\" }</code>，然后重新创建订阅。格式错误或不支持的订阅消息会被忽略；请验证客户端数据，不要因为没有响应就推断订阅已接受。</p>"
  }
};

export function localizeEthereumDocsChinese(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('zh')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
