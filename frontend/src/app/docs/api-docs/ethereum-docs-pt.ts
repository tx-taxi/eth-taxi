import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Noções básicas de Ethereum",
  "Basics": "Noções básicas",
  "Gas and fees": "Gas e taxas",
  "Fees": "Taxas",
  "Transaction status": "Estado das transações",
  "Transactions": "Transações",
  "Accounts, contracts, and tokens": "Contas, contratos e tokens",
  "Accounts": "Contas",
  "Tokens": "Tokens",
  "Explorer": "Explorador",
  "Support": "Apoio",
  "Using the API": "Utilizar a API",
  "Overview": "Visão geral",
  "Network and pending sample": "Rede e amostra pendente",
  "Network": "Rede",
  "Blocks": "Blocos",
  "Accounts and tokens": "Contas e tokens",
  "Connection": "Ligação",
  "Actions": "Ações",
  "Subscriptions": "Subscrições"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Como funcionam as transações Ethereum?",
    "description": "<p>Uma transação Ethereum é uma instrução assinada por uma conta controlada externamente. Pode transferir ETH, chamar ou criar um contrato inteligente ou transportar dados sem valor em ETH. O nonce do remetente ordena as transações da conta: um nonce posterior não pode ser incluído enquanto um anterior não estiver resolvido.</p><p>O explorador distingue os ETH transferidos da taxa. Uma chamada a um contrato pode transferir tokens ou alterar o estado mesmo quando o valor em ETH é zero.</p><p class=\"mt-3\">Sobre o protocolo: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">transações</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gas e taxas</a> e <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">contas</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "Qual é a diferença entre uma conta e um contrato?",
    "description": "<p>Os endereços identificam contas controladas externamente e contas de contrato. Uma chave privada controla uma conta externa e inicia transações; um contrato contém código que é executado quando chamado. O estado, nomes, etiquetas e detalhes de verificação do contrato são metadados do fornecedor e podem estar indisponíveis.</p><p>Um explorador não pode determinar a propriedade de um endereço.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "O que significam blocos, confirmações e finalidade?",
    "description": "<p>A rede principal Ethereum usa prova de participação. Uma transação está confirmada após inclusão num bloco de execução. As confirmações indicam a profundidade observada na camada de execução à medida que novos blocos são adicionados.</p><p>A profundidade é contexto útil, mas não prova a finalidade do consenso. Este explorador não fornece checkpoints de finalidade da Beacon Chain nem uma API de finalização: nenhum número escolhido de confirmações deve ser tratado como prova de finalidade do protocolo.</p>"
  },
  "what-is-gas": {
    "title": "O que são gas, wei e gwei?",
    "description": "<p>O gas mede o trabalho computacional da EVM. O wei é a menor unidade de ETH: 1 ETH equivale a 10<sup>18</sup> wei. Os preços do gas são frequentemente expressos em gwei: 1 gwei equivale a 10<sup>9</sup> wei, ou 0,000000001 ETH.</p><p><code>gasLimit</code> é o máximo de gas autorizado; <code>gasUsed</code> é o trabalho consumido pela transação incluída. A taxa de execução é o gas usado multiplicado pelo preço efetivo do gas. As taxas de blob são apresentadas separadamente quando disponíveis.</p>"
  },
  "base-and-priority-fees": {
    "title": "Como funcionam as taxas base, prioritárias e máximas?",
    "description": "<p>Nas transações EIP-1559, <code>maxFeePerGas</code> limita o preço autorizado e <code>maxPriorityFeePerGas</code> limita a gorjeta. O preço efetivo depende da taxa base do bloco mais a taxa prioritária aplicável, sujeito a esses limites. A parte base é queimada; a taxa prioritária incentiva o validador.</p><p>A taxa máxima é um limite, não necessariamente o valor pago. As transações antigas usam um campo de preço do gas.</p>"
  },
  "fee-estimates": {
    "title": "Como utilizar as recomendações de preço do gas?",
    "description": "<p>Os valores lento, médio e rápido são observações dos fornecedores, devolvidas em wei pela API REST. Não são cotações nem garantias de inclusão. Uma carteira pode escolher os parâmetros conforme a urgência, as dependências entre nonces e a taxa base mais recente.</p><p>Numa transação incluída, o preço efetivo do gas e o gas utilizado ajudam a entender o valor pago. Numa transação pendente, poderá ser conhecido apenas o custo máximo.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "Porque pode falhar uma transação confirmada?",
    "description": "<p>Inclusão e execução são factos distintos. Uma transação confirmada num bloco pode ainda ser revertida ou apresentar um erro se a execução EVM falhar; mesmo assim pode consumir gas. Um resultado bem-sucedido significa que a execução registada terminou, não que a interação com o contrato tenha produzido o resultado esperado.</p><p>Analise em conjunto <code>status.confirmed</code>, os campos Ethereum <code>status</code>/<code>result</code>, o indicador de erro e o motivo da reversão, se disponível.</p>"
  },
  "why-pending": {
    "title": "Porque está uma transação pendente ou em falta?",
    "description": "<p>A taxa pode ser insuficiente, a transação pode estar bloqueada por um nonce anterior, ainda não ser visível para o fornecedor, ter sido substituída com o mesmo nonce ou removida pela carteira ou nó que a enviou. A vista de pendentes, por si só, não determina a causa.</p><p>Ethereum não tem uma única mempool global. Os fornecedores podem observar transações e ordens diferentes. Consulte a carteira ou o serviço que enviou a transação antes de a substituir ou cancelar.</p>"
  },
  "pending-sample": {
    "title": "O que representa a atividade pendente?",
    "description": "<p>A vista apresenta uma amostra limitada do fornecedor ligado e estima o próximo slot do validador a partir das transações e dos dados de gas observados. Não representa a mempool completa da rede, um livro de ofertas nem uma projeção determinística de vários blocos.</p><p>A ausência da amostra não torna uma transação inválida; a sua presença não garante inclusão no bloco seguinte.</p>"
  },
  "transaction-fields": {
    "title": "Que campos de transação são específicos do Ethereum?",
    "description": "<p>Os metadados Ethereum incluem remetente e destinatário, nonce, tipo, dados de entrada, método descodificado quando disponível, gas, taxas, confirmações, resultado da execução, contrato criado e transferências de tokens. Os montantes sensíveis à precisão são cadeias decimais: utilize inteiros de precisão arbitrária.</p><p>A descodificação, etiquetas, listas de transferências e motivos de reversão dependem dos dados do fornecedor. A ausência não prova que a transação não tenha interagido com um contrato nem produzido registos.</p>"
  },
  "address-page": {
    "title": "O que mostra a página de um endereço?",
    "description": "<p>O resumo apresenta o saldo atual em ETH, a identidade da conta ou contrato, alguns saldos de tokens e contadores quando existem dados indexados. Os campos específicos do Ethereum estão na propriedade <code>ethereum</code>. Os saldos refletem o estado mais recente do fornecedor e podem não incluir efeitos de transações pendentes.</p>"
  },
  "history-availability": {
    "title": "Porque está incompleto o histórico de uma conta ou token?",
    "description": "<p>O JSON-RPC pode fornecer o estado, incluindo saldos e código de contratos, mas o histórico completo de endereços e tokens requer um indexador. No modo de recurso, o explorador fornece dados da conta via RPC e identifica o histórico com <code>historyUnavailable</code>.</p><p>O recurso para transferências de tokens usa <code>recentOnly</code>: é uma pesquisa limitada de registos recentes de transferências padrão e não deve ser usado como contabilidade histórica completa.</p>"
  },
  "tokens-and-contracts": {
    "title": "Como são obtidos os detalhes de tokens e contratos?",
    "description": "<p>Uma página de token é identificada pelo endereço do contrato. Os metadados indexados podem incluir nome, símbolo, casas decimais, oferta, detentores e transferências. Se estiverem indisponíveis, o adaptador pode chamar métodos ERC-20 padrão para obter campos básicos. Nome e símbolo são metadados não verificados, não uma prova de legitimidade.</p><p>Este explorador não fornece rastos gerais de execução, histórico de transações internas, APIs de autorizações ou APIs de portefólio e contabilidade.</p>"
  },
  "searching": {
    "title": "O que posso pesquisar?",
    "description": "<p>A pesquisa aceita hashes de transações, endereços hexadecimais de 40 caracteres com prefixo 0x, números de bloco decimais e hashes de blocos. Um endereço de contrato de token pode abrir a vista do token se os metadados estiverem disponíveis. Hashes e endereços exatos dão os resultados mais fiáveis.</p>"
  },
  "support-disclaimer": {
    "title": "Este explorador pode recuperar fundos ou reverter uma transação?",
    "description": "<p>Não. eth.tx.taxi apresenta dados públicos do Ethereum. Não pode aceder a carteiras, desfazer transações nem recuperar chaves privadas ou fundos. Para assistência específica da conta, contacte a carteira, exchange, ponte ou aplicação que enviou a transação.</p>"
  },
  "rest-overview": {
    "title": "Convenções e limites",
    "description": "<p>As rotas documentadas são endpoints públicos <code>GET</code> e devolvem JSON salvo indicação em contrário. Hashes e endereços são valores hexadecimais com prefixo 0x. Montantes que exigem precisão são cadeias decimais: não os converta com <code>Number</code> do JavaScript.</p><p>Esta API é de leitura. Não transmite transações, estima gas para dados arbitrários de chamadas, fornece rastos ou bytes brutos das transações, nem garante histórico completo enquanto o indexador estiver em modo de recurso.</p>"
  },
  "get-init-data": {
    "title": "Estado do explorador",
    "description": "<p>Devolve blocos recentes, uma amostra limitada de transações pendentes, recomendações de gas, métricas da amostra e o estado atual do explorador. É o conteúdo do painel; os nomes dos campos de compatibilidade usam a semântica de gas do Ethereum.</p>"
  },
  "get-network-info": {
    "title": "Estado da rede",
    "description": "<p>Devolve a altura observada na camada de execução, o estado de sincronização, o nome da rede e o intervalo de bloco pretendido em milissegundos. Não indica a finalidade da Beacon Chain.</p>"
  },
  "get-gas-estimates": {
    "title": "Preços recomendados do gas",
    "description": "<p>Devolve estimativas de compatibilidade rápida, média e lenta como valores inteiros em wei. Divida por 1.000.000.000 para obter gwei. São observações atuais, não preços que garantam inclusão.</p>"
  },
  "get-pending-summary": {
    "title": "Resumo da amostra pendente",
    "description": "<p>Devolve métricas da amostra observada de transações pendentes, incluindo quantidade, gas amostrado e total de taxas. Apesar do nome da rota de compatibilidade, não é a mempool completa do Ethereum nem o txpool integral de um nó.</p>"
  },
  "get-recent-blocks": {
    "title": "Blocos recentes",
    "description": "<p>Devolve a janela atual de blocos recentes normalizados para o explorador.</p>"
  },
  "get-blocks-at-height": {
    "title": "Blocos até uma altura",
    "description": "<p>Devolve a janela disponível de blocos recentes que termina na altura decimal <code>:height</code> do bloco de execução.</p>"
  },
  "get-block-height": {
    "title": "Hash do bloco numa altura",
    "description": "<p>Devolve em texto simples o hash com prefixo 0x correspondente a uma altura decimal de bloco.</p>"
  },
  "get-block": {
    "title": "Bloco por hash",
    "description": "<p>Devolve detalhes normalizados de um bloco Ethereum a partir do seu hash. São dados da camada de execução; detalhes do validador e da finalidade do consenso não são fornecidos por esta API.</p>"
  },
  "get-block-transactions": {
    "title": "Transações de um bloco",
    "description": "<p>Devolve até 25 transações normalizadas de um bloco, a partir do índice <code>:start</code> baseado em zero. Usa dados indexados quando disponíveis e, caso contrário, as transações do bloco via RPC.</p>"
  },
  "get-transaction": {
    "title": "Transação por hash",
    "description": "<p>Devolve a transação normalizada do explorador com <code>status.confirmed</code> e um objeto de metadados <code>ethereum</code>.</p>"
  },
  "get-transaction-status": {
    "title": "Estado de inclusão de uma transação",
    "description": "<p>Devolve o estado de inclusão e, se confirmada, altura, hash e hora do bloco de execução quando disponíveis. Não indica se a execução do contrato teve sucesso; consulte os metadados da transação.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Metadados de uma transação Ethereum",
    "description": "<p>Devolve estado e resultado da execução, confirmações, remetente e destinatário ou contrato criado, valor em wei, gas e taxas, nonce, dados de entrada e método descodificado quando disponível, transferências de tokens e erros ou motivos de reversão fornecidos. Não é um endpoint de rastos.</p>"
  },
  "get-address": {
    "title": "Resumo da conta",
    "description": "<p>Devolve um resumo normalizado do endereço. Saldo Ethereum, identidade, contadores, saldos de tokens e disponibilidade do histórico estão em <code>ethereum</code>. O modo de recurso pode definir <code>ethereum.historyUnavailable</code>.</p>"
  },
  "get-address-transactions": {
    "title": "Transações de uma conta",
    "description": "<p>Devolve as transações indexadas de um endereço. Acrescente <code>?after_txid=0x…</code> para continuar após uma transação devolvida. O recurso RPC devolve uma lista vazia sem afirmar que o histórico on-chain está vazio.</p>"
  },
  "get-address-metadata": {
    "title": "Metadados de uma conta Ethereum",
    "description": "<p>Devolve identidade da conta ou contrato, saldo atual de ETH em wei, metadados de criação disponíveis, contadores, alguns saldos de tokens e <code>historyUnavailable</code>.</p>"
  },
  "get-token": {
    "title": "Metadados do token",
    "description": "<p>Devolve metadados de um contrato de token. Os dados do indexador são preferidos; os campos ERC-20 básicos podem vir de chamadas diretas ao contrato. Os campos em falta estão indisponíveis e nomes e símbolos não são verificados.</p>"
  },
  "get-token-transfers": {
    "title": "Transferências de tokens",
    "description": "<p>Devolve transferências e metadados de paginação. As consultas indexadas aceitam os parâmetros numéricos <code>block_number</code>, <code>index</code> e <code>items_count</code>. O modo de recurso define <code>historyUnavailable: true</code> e <code>recentOnly: true</code>: pesquisa um número limitado de registos recentes de transferências padrão, não o histórico completo.</p>"
  },
  "websocket-connect": {
    "title": "Ligar e receber estados em direto",
    "description": "<p>Ligue-se a <code>/api/v1/ws</code>. O servidor envia um estado inicial do explorador e novos estados quando muda o bloco mais recente observado ou a amostra pendente, além de um sinal periódico. Os campos seguem <code>/api/v1/init-data</code>.</p><p>É a vista do adaptador baseada no fornecedor, não uma subscrição direta do cliente de execução nem um fluxo da mempool global.</p>"
  },
  "websocket-init": {
    "title": "Pedir um estado atualizado",
    "description": "<p>Envia imediatamente o estado atual do explorador, útil após uma reconexão.</p>"
  },
  "websocket-ping": {
    "title": "Verificar a ligação",
    "description": "<p>Verifica se a ligação responde.</p>"
  },
  "websocket-track-transaction": {
    "title": "Acompanhar uma transação",
    "description": "<p>Acompanha um hash de 32 bytes com prefixo 0x. O servidor envia primeiro uma estimativa de compatibilidade <code>txPosition</code>, depois <code>{ \"tx\": … }</code> quando muda o estado normalizado. Um novo hash substitui a subscrição anterior. A posição no próximo slot é uma estimativa da amostra observada, não uma garantia de inclusão.</p>"
  },
  "websocket-track-address": {
    "title": "Acompanhar uma conta",
    "description": "<p>Acompanha um endereço usando o histórico indexado disponível. As transações pendentes recentemente observadas chegam como <code>address-transactions</code>; as recém-confirmadas ou alteradas como <code>block-transactions</code>. Um novo endereço substitui a subscrição anterior. Não são inventados eventos quando a indexação está indisponível.</p>"
  },
  "websocket-track-pending": {
    "title": "Acompanhar a estimativa pendente do próximo slot",
    "description": "<p>O índice <code>0</code> devolve a estimativa da amostra pendente como <code>projected-block-transactions</code>. Ethereum não tem uma projeção determinística de vários blocos, por isso índices superiores não contêm transações projetadas. Envie <code>-1</code> para cancelar a subscrição.</p>"
  },
  "websocket-reconnect": {
    "title": "Reconectar em segurança",
    "description": "<p>Após o encerramento, reconecte com atrasos progressivos, envie <code>{ \"action\": \"init\" }</code> e recrie as subscrições. Mensagens malformadas ou não suportadas são ignoradas; valide os dados do cliente e não interprete o silêncio como aceitação.</p>"
  }
};

export function localizeEthereumDocsPortuguese(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('pt')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
