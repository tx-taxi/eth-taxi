import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Le basi di Ethereum",
  "Basics": "Nozioni di base",
  "Gas and fees": "Gas e commissioni",
  "Fees": "Commissioni",
  "Transaction status": "Stato delle transazioni",
  "Transactions": "Transazioni",
  "Accounts, contracts, and tokens": "Conti, contratti e token",
  "Accounts": "Conti",
  "Tokens": "Token",
  "Explorer": "Explorer",
  "Support": "Assistenza",
  "Using the API": "Uso dell’API",
  "Overview": "Panoramica",
  "Network and pending sample": "Rete e campione in attesa",
  "Network": "Rete",
  "Blocks": "Blocchi",
  "Accounts and tokens": "Conti e token",
  "Connection": "Connessione",
  "Actions": "Azioni",
  "Subscriptions": "Abbonamenti"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Come funzionano le transazioni Ethereum?",
    "description": "<p>Una transazione Ethereum è un'istruzione firmata da un conto controllato esternamente. Può trasferire ETH, chiamare o creare uno smart contract oppure trasportare dati senza trasferire ETH. Il nonce del mittente ordina le transazioni del conto: un nonce successivo non può essere incluso finché uno precedente rimane irrisolto.</p><p>L'explorer distingue gli ETH trasferiti dalla commissione. Una chiamata a un contratto può spostare token o cambiare lo stato anche quando il valore in ETH è zero.</p><p class=\"mt-3\">Informazioni sul protocollo: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">transazioni</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gas e commissioni</a> e <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">conti</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "Qual è la differenza tra un conto e un contratto?",
    "description": "<p>Gli indirizzi identificano conti controllati esternamente e conti contratto. Una chiave privata controlla un conto esterno e avvia le transazioni; un contratto contiene codice che viene eseguito quando è chiamato. Stato, nomi, etichette e dettagli di verifica del contratto sono metadati del provider e possono non essere disponibili.</p><p>Un explorer non può stabilire il proprietario di un indirizzo.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "Cosa significano blocchi, conferme e finalità?",
    "description": "<p>La rete principale Ethereum usa la proof of stake. Una transazione è confermata dopo l'inclusione in un blocco di esecuzione. Le conferme rappresentano la profondità osservata sulla execution layer quando si aggiungono blocchi successivi.</p><p>La profondità è un contesto utile, non una prova della finalità del consenso. Questo explorer non espone checkpoint di finalità della Beacon Chain né un'API di finalizzazione: nessun numero di conferme va considerato una prova di finalità del protocollo.</p>"
  },
  "what-is-gas": {
    "title": "Cosa sono gas, wei e gwei?",
    "description": "<p>Il gas misura il lavoro computazionale dell'EVM. Il wei è l'unità minima di ETH: 1 ETH equivale a 10<sup>18</sup> wei. I prezzi del gas sono spesso espressi in gwei: 1 gwei equivale a 10<sup>9</sup> wei, cioè 0,000000001 ETH.</p><p><code>gasLimit</code> è il gas massimo autorizzato; <code>gasUsed</code> è il lavoro consumato dalla transazione inclusa. La commissione di esecuzione è il gas usato moltiplicato per il prezzo effettivo del gas. Le commissioni blob, se presenti, sono mostrate separatamente.</p>"
  },
  "base-and-priority-fees": {
    "title": "Come funzionano commissioni base, prioritarie e massime?",
    "description": "<p>Nelle transazioni EIP-1559, <code>maxFeePerGas</code> limita il prezzo autorizzato e <code>maxPriorityFeePerGas</code> limita la mancia. Il prezzo effettivo dipende dalla commissione base del blocco più quella prioritaria applicabile, entro tali limiti. La parte base viene bruciata; quella prioritaria incentiva il validatore.</p><p>La commissione massima è un limite, non necessariamente l'importo pagato. Le transazioni precedenti usano invece un campo prezzo del gas.</p>"
  },
  "fee-estimates": {
    "title": "Come usare i prezzi del gas consigliati?",
    "description": "<p>I valori lento, medio e veloce sono osservazioni dei provider, restituite in wei dall'API REST. Non sono preventivi né garanzie di inclusione. Un wallet può scegliere i parametri in base all'urgenza, alle dipendenze tra nonce e alla commissione base più recente.</p><p>Per una transazione inclusa, prezzo effettivo e gas utilizzato spiegano quanto è stato pagato. Per una transazione in attesa può essere noto solo il costo massimo.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "Perché una transazione confermata può essere fallita?",
    "description": "<p>Inclusione ed esecuzione sono fatti distinti. Una transazione confermata in un blocco può comunque essere annullata o segnalare un errore se l'esecuzione EVM fallisce; può comunque consumare gas. Un risultato positivo indica che l'esecuzione registrata è terminata, non che l'interazione abbia prodotto il risultato atteso.</p><p>Esamina insieme <code>status.confirmed</code>, i campi Ethereum <code>status</code>/<code>result</code>, l'indicatore di errore e il motivo dell'annullamento, se disponibile.</p>"
  },
  "why-pending": {
    "title": "Perché una transazione è in attesa o non si trova?",
    "description": "<p>La commissione può essere insufficiente, la transazione può essere bloccata da un nonce precedente, non ancora visibile al provider, sostituita con lo stesso nonce oppure rimossa dal wallet o nodo che l'ha inviata. La sola vista delle transazioni in attesa non determina quale caso si sia verificato.</p><p>Ethereum non ha un'unica mempool globale: i provider possono osservare transazioni e ordini diversi. Consulta il wallet o il servizio di invio prima di sostituire o annullare una transazione.</p>"
  },
  "pending-sample": {
    "title": "Cosa rappresenta l'attività in attesa?",
    "description": "<p>La vista mostra un campione limitato del provider connesso e stima il prossimo slot del validatore dalle transazioni e dai dati sul gas osservati. Non rappresenta l'intera mempool di rete, un registro delle offerte o una proiezione deterministica di più blocchi.</p><p>L'assenza dal campione non rende invalida una transazione; la presenza non ne garantisce l'inclusione nel blocco successivo.</p>"
  },
  "transaction-fields": {
    "title": "Quali campi della transazione sono specifici di Ethereum?",
    "description": "<p>I metadati Ethereum includono mittente e destinatario, nonce, tipo, dati di input, metodo decodificato se disponibile, campi gas, dettaglio delle commissioni, conferme, esito dell'esecuzione, contratto creato e trasferimenti di token. Gli importi sensibili alla precisione sono stringhe decimali: usa interi a precisione arbitraria.</p><p>Decodifica, etichette, trasferimenti e motivi di annullamento dipendono dai dati del provider. La loro assenza non dimostra l'assenza di interazioni o log del contratto.</p>"
  },
  "address-page": {
    "title": "Cosa mostra la pagina di un indirizzo?",
    "description": "<p>Il riepilogo mostra saldo ETH corrente, identità del conto o contratto, alcuni saldi di token e contatori quando sono disponibili dati indicizzati. I campi specifici di Ethereum sono nella proprietà <code>ethereum</code>. I saldi riflettono lo stato più recente del provider e possono non includere gli effetti delle transazioni in attesa.</p>"
  },
  "history-availability": {
    "title": "Perché la cronologia di un conto o token è incompleta?",
    "description": "<p>JSON-RPC può fornire lo stato, inclusi saldi e codice dei contratti, ma la cronologia completa di indirizzi e token richiede un indicizzatore. In fallback l'explorer usa i dati del conto RPC e segnala la cronologia con <code>historyUnavailable</code>.</p><p>Il fallback dei trasferimenti di token è contrassegnato con <code>recentOnly</code>: analizza un numero limitato di log recenti di trasferimenti standard e non costituisce una contabilità storica completa.</p>"
  },
  "tokens-and-contracts": {
    "title": "Come vengono ottenuti i dettagli di token e contratti?",
    "description": "<p>Una pagina token è identificata dall'indirizzo del contratto. I metadati indicizzati possono includere nome, simbolo, decimali, offerta, detentori e trasferimenti. Se non disponibili, l'adattatore può chiamare i metodi standard ERC-20 per ottenere i campi di base. Nome e simbolo sono metadati non verificati, non una prova di legittimità.</p><p>Questo explorer non fornisce tracce di esecuzione generali, cronologia delle transazioni interne, API delle autorizzazioni o API di portafoglio e contabilità.</p>"
  },
  "searching": {
    "title": "Cosa posso cercare?",
    "description": "<p>La ricerca accetta hash di transazione, indirizzi esadecimali di 40 caratteri con prefisso 0x, numeri di blocco decimali e hash di blocco. Un indirizzo di contratto token può aprire la vista del token se i metadati sono disponibili. Hash e indirizzi esatti producono i risultati più affidabili.</p>"
  },
  "support-disclaimer": {
    "title": "Questo explorer può recuperare fondi o annullare una transazione?",
    "description": "<p>No. eth.tx.taxi mostra dati Ethereum pubblici. Non può accedere ai wallet, annullare transazioni, recuperare chiavi private o fondi. Per assistenza sul conto contatta il wallet, l'exchange, il bridge o l'applicazione che ha inviato la transazione.</p>"
  },
  "rest-overview": {
    "title": "Convenzioni e limiti",
    "description": "<p>Le rotte documentate sono endpoint pubblici <code>GET</code> e restituiscono JSON salvo diversa indicazione. Hash e indirizzi sono valori esadecimali con prefisso 0x. Gli importi che richiedono precisione sono stringhe decimali: non interpretarli con <code>Number</code> di JavaScript.</p><p>Questa API è di sola lettura. Non trasmette transazioni, stima gas per dati di chiamata arbitrari, fornisce tracce o byte grezzi delle transazioni, né garantisce una cronologia completa durante il fallback dell'indicizzatore.</p>"
  },
  "get-init-data": {
    "title": "Stato dell'explorer",
    "description": "<p>Restituisce blocchi recenti, un campione limitato di transazioni in attesa, prezzi del gas consigliati, metriche del campione e stato corrente dell'explorer. È il payload della dashboard; i nomi dei campi di compatibilità usano la semantica del gas Ethereum.</p>"
  },
  "get-network-info": {
    "title": "Stato della rete",
    "description": "<p>Restituisce altezza osservata sulla execution layer, stato di sincronizzazione, nome della rete e intervallo obiettivo dei blocchi in millisecondi. Non riporta la finalità della Beacon Chain.</p>"
  },
  "get-gas-estimates": {
    "title": "Prezzi del gas consigliati",
    "description": "<p>Restituisce stime di compatibilità veloce, media e lenta come valori interi in wei. Dividi per 1.000.000.000 per ottenere gwei. Sono osservazioni correnti, non prezzi che garantiscono l'inclusione.</p>"
  },
  "get-pending-summary": {
    "title": "Riepilogo del campione in attesa",
    "description": "<p>Restituisce metriche del campione di transazioni in attesa osservato, inclusi numero, gas campionato e totale delle commissioni. Nonostante il nome della rotta di compatibilità, non è l'intera mempool Ethereum né il txpool completo di un nodo.</p>"
  },
  "get-recent-blocks": {
    "title": "Blocchi recenti",
    "description": "<p>Restituisce la finestra corrente dei blocchi recenti normalizzati per l'explorer.</p>"
  },
  "get-blocks-at-height": {
    "title": "Blocchi fino a un'altezza",
    "description": "<p>Restituisce la finestra disponibile di blocchi recenti che termina all'altezza decimale <code>:height</code> del blocco di esecuzione.</p>"
  },
  "get-block-height": {
    "title": "Hash del blocco a un'altezza",
    "description": "<p>Restituisce in testo semplice l'hash con prefisso 0x corrispondente a un'altezza decimale.</p>"
  },
  "get-block": {
    "title": "Blocco per hash",
    "description": "<p>Restituisce i dettagli normalizzati di un blocco Ethereum dato il suo hash. Sono dati della execution layer; i dettagli del validatore e della finalità del consenso non sono forniti da questa API.</p>"
  },
  "get-block-transactions": {
    "title": "Transazioni di un blocco",
    "description": "<p>Restituisce fino a 25 transazioni normalizzate di un blocco, a partire dall'indice <code>:start</code> basato su zero. Usa dati indicizzati se disponibili, altrimenti le transazioni del blocco via RPC.</p>"
  },
  "get-transaction": {
    "title": "Transazione per hash",
    "description": "<p>Restituisce la transazione normalizzata dell'explorer con <code>status.confirmed</code> e un oggetto di metadati <code>ethereum</code>.</p>"
  },
  "get-transaction-status": {
    "title": "Stato di inclusione della transazione",
    "description": "<p>Restituisce lo stato di inclusione e, se confermata, altezza, hash e ora del blocco di esecuzione quando disponibili. Non indica se l'esecuzione del contratto è riuscita: consulta i metadati della transazione.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Metadati di una transazione Ethereum",
    "description": "<p>Restituisce stato ed esito dell'esecuzione, conferme, mittente e destinatario o contratto creato, valore in wei, gas e commissioni, nonce, input e metodo decodificato se disponibile, trasferimenti di token ed errori o motivi di annullamento forniti. Non è un endpoint di tracce.</p>"
  },
  "get-address": {
    "title": "Riepilogo del conto",
    "description": "<p>Restituisce un riepilogo normalizzato dell'indirizzo. Saldo Ethereum, identità, contatori, saldi dei token e disponibilità della cronologia sono in <code>ethereum</code>. Il fallback può impostare <code>ethereum.historyUnavailable</code>.</p>"
  },
  "get-address-transactions": {
    "title": "Transazioni di un conto",
    "description": "<p>Restituisce le transazioni indicizzate di un indirizzo. Aggiungi <code>?after_txid=0x…</code> per continuare dopo una transazione restituita. Il fallback RPC restituisce una lista vuota senza affermare che la cronologia on-chain sia vuota.</p>"
  },
  "get-address-metadata": {
    "title": "Metadati di un conto Ethereum",
    "description": "<p>Restituisce identità del conto o contratto, saldo ETH corrente in wei, metadati di creazione disponibili, contatori, alcuni saldi di token e <code>historyUnavailable</code>.</p>"
  },
  "get-token": {
    "title": "Metadati del token",
    "description": "<p>Restituisce i metadati di un contratto token. Sono preferiti quelli dell'indicizzatore; i campi ERC-20 di base possono provenire da chiamate dirette al contratto. I campi assenti non sono disponibili e nomi e simboli non sono verificati.</p>"
  },
  "get-token-transfers": {
    "title": "Trasferimenti di token",
    "description": "<p>Restituisce trasferimenti e metadati di paginazione. Le richieste indicizzate accettano i parametri numerici <code>block_number</code>, <code>index</code> e <code>items_count</code>. Il fallback imposta <code>historyUnavailable: true</code> e <code>recentOnly: true</code>: esamina un numero limitato di log recenti di trasferimenti standard, non la cronologia completa.</p>"
  },
  "websocket-connect": {
    "title": "Connessione e ricezione degli stati in diretta",
    "description": "<p>Connettiti a <code>/api/v1/ws</code>. Il server invia uno stato iniziale dell'explorer, poi nuovi stati quando cambiano il blocco più recente osservato o il campione in attesa, oltre a un segnale periodico. I campi seguono <code>/api/v1/init-data</code>.</p><p>È la vista dell'adattatore basata sul provider, non un abbonamento diretto al client di esecuzione né uno stream della mempool globale.</p>"
  },
  "websocket-init": {
    "title": "Richiedere uno stato aggiornato",
    "description": "<p>Invia immediatamente lo stato corrente dell'explorer, utile dopo una riconnessione.</p>"
  },
  "websocket-ping": {
    "title": "Verificare la connessione",
    "description": "<p>Controlla che la connessione risponda.</p>"
  },
  "websocket-track-transaction": {
    "title": "Seguire una transazione",
    "description": "<p>Segue un hash di 32 byte con prefisso 0x. Il server invia prima una stima di compatibilità <code>txPosition</code>, poi <code>{ \"tx\": … }</code> quando cambia lo stato normalizzato. Un nuovo hash sostituisce l'abbonamento precedente. La posizione nel prossimo slot è una stima del campione osservato, non una garanzia di inclusione.</p>"
  },
  "websocket-track-address": {
    "title": "Seguire un conto",
    "description": "<p>Segue un indirizzo usando la cronologia indicizzata disponibile. Le transazioni in attesa appena osservate arrivano come <code>address-transactions</code>; quelle appena confermate o modificate come <code>block-transactions</code>. Un nuovo indirizzo sostituisce l'abbonamento precedente. Nessun evento viene inventato quando l'indicizzazione non è disponibile.</p>"
  },
  "websocket-track-pending": {
    "title": "Seguire la stima in attesa del prossimo slot",
    "description": "<p>L'indice <code>0</code> restituisce la stima del campione in attesa come <code>projected-block-transactions</code>. Ethereum non ha una proiezione deterministica di più blocchi, quindi gli indici superiori non contengono transazioni proiettate. Invia <code>-1</code> per annullare l'abbonamento.</p>"
  },
  "websocket-reconnect": {
    "title": "Riconnettersi in sicurezza",
    "description": "<p>Dopo la chiusura, riconnettiti con ritardi progressivi, invia <code>{ \"action\": \"init\" }</code> e ricrea gli abbonamenti. I messaggi malformati o non supportati vengono ignorati: valida i dati del client e non interpretare il silenzio come accettazione.</p>"
  }
};

export function localizeEthereumDocsItalian(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('it')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
