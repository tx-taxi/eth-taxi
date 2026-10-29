import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Základy Ethereum",
  "Basics": "Základy",
  "Gas and fees": "Gas a poplatky",
  "Fees": "Poplatky",
  "Transaction status": "Stav transakce",
  "Transactions": "Transakce",
  "Accounts, contracts, and tokens": "Účty, kontrakty a tokeny",
  "Accounts": "Účty",
  "Tokens": "Tokeny",
  "Explorer": "Průzkumník",
  "Support": "Podpora",
  "Using the API": "Používání API",
  "Overview": "Přehled",
  "Network and pending sample": "Síť a vzorek čekajících transakcí",
  "Network": "Síť",
  "Blocks": "Bloky",
  "Accounts and tokens": "Účty a tokeny",
  "Connection": "Připojení",
  "Actions": "Akce",
  "Subscriptions": "Odběry"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Jak fungují transakce Ethereum?",
    "description": "<p>Transakce Ethereum je podepsaný pokyn z účtu ovládaného soukromým klíčem. Může převádět ETH, volat chytrý kontrakt, vytvořit kontrakt nebo nést data bez hodnoty ETH. Nonce odesílatele určuje pořadí transakcí účtu: transakci s vyšším nonce nelze zařadit, dokud není vyřešena transakce s nižším nonce.</p><p>Průzkumník odděluje převedené ETH od poplatku. Volání kontraktu může převést tokeny nebo změnit stav i při nulové hodnotě ETH.</p><p class=\"mt-3\">Více o protokolu: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">transakce</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gas a poplatky</a> a <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">účty</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "Jaký je rozdíl mezi účtem a kontraktem?",
    "description": "<p>Adresy identifikují účty ovládané soukromým klíčem i účty kontraktů. Soukromý klíč ovládá externí účet a zahajuje transakce; kontrakt obsahuje kód a spouští se při volání. Stav kontraktu, názvy, štítky a údaje o ověření jsou metadata poskytovatele a nemusí být dostupné.</p><p>Průzkumník nedokáže určit vlastníka adresy.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "Co znamenají bloky, potvrzení a finalita?",
    "description": "<p>Hlavní síť Ethereum používá proof of stake. Transakce je potvrzena po zařazení do bloku exekuční vrstvy. Počet potvrzení vyjadřuje pozorovanou hloubku bloku v exekuční vrstvě, na který navazují další bloky.</p><p>Počet potvrzení je užitečný kontext, nikoli důkaz finality konsenzu. Tento průzkumník neposkytuje kontrolní body finality beacon chain ani API finalizace, proto žádný zvolený počet potvrzení nepovažujte za finalitu protokolu.</p>"
  },
  "what-is-gas": {
    "title": "Co jsou gas, wei a gwei?",
    "description": "<p>Gas měří výpočetní práci EVM. Wei je nejmenší jednotka ETH: 1 ETH je 10<sup>18</sup> wei. Cena gasu se běžně uvádí v gwei: 1 gwei je 10<sup>9</sup> wei neboli 0,000000001 ETH.</p><p><code>gasLimit</code> je maximální povolené množství gasu; <code>gasUsed</code> je množství spotřebované zařazenou transakcí. Poplatek za provedení je spotřebovaný gas násobený efektivní cenou gasu. Poplatky za bloby se případně zobrazují samostatně.</p>"
  },
  "base-and-priority-fees": {
    "title": "Jak funguje základní, prioritní a maximální poplatek?",
    "description": "<p>U transakcí EIP-1559 <code>maxFeePerGas</code> omezuje povolenou cenu a <code>maxPriorityFeePerGas</code> omezuje spropitné. Efektivní cenu určuje základní poplatek bloku a příslušný prioritní poplatek při dodržení těchto limitů. Základní část poplatku se spaluje; prioritní poplatek motivuje validátora.</p><p>Maximální poplatek je strop, nikoli nutně zaplacená částka. Starší transakce místo toho uvádějí cenu gasu.</p>"
  },
  "fee-estimates": {
    "title": "Jak používat doporučené ceny gasu?",
    "description": "<p>Pomalá, střední a rychlá hodnota jsou údaje pozorované poskytovatelem, které REST API vrací ve wei. Nejde o nabídku ani záruku zařazení. Peněženka může nastavení zvolit podle naléhavosti, závislostí nonce a aktuálního základního poplatku.</p><p>U zařazené transakce použijte k výpočtu zaplacené částky efektivní cenu a spotřebované množství gasu. U čekající transakce může být znám pouze maximální možný poplatek.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "Proč může potvrzená transakce selhat?",
    "description": "<p>Zařazení a provedení jsou dvě různé skutečnosti. Transakce může být potvrzena v bloku a přesto se vrátit nebo nahlásit chybu kvůli neúspěšnému provedení EVM; i tak může spotřebovat gas. Úspěšný výsledek znamená dokončení zaznamenaného provedení, nikoli nutně výsledek interakce s kontraktem očekávaný uživatelem.</p><p>Posuzujte společně <code>status.confirmed</code>, Ethereum <code>status</code>/<code>result</code>, příznak chyby a případný důvod vrácení.</p>"
  },
  "why-pending": {
    "title": "Proč transakce čeká nebo není vidět?",
    "description": "<p>Čekající transakce může mít příliš nízký poplatek, být blokována nižším nonce odesílatele, zatím nebýt viditelná poskytovateli, být nahrazena transakcí se stejným nonce nebo být zahozena peněženkou či uzlem, který ji odeslal. Samotný pohled na čekající transakce příčinu neurčuje.</p><p>Ethereum nemá jediný globální mempool. Poskytovatelé mohou vidět různé transakce a jejich pořadí. Před nahrazením nebo zrušením transakce zkontrolujte peněženku nebo službu, která ji odeslala.</p>"
  },
  "pending-sample": {
    "title": "Co představuje přehled čekající aktivity?",
    "description": "<p>Přehled čekajících transakcí představuje omezený vzorek od připojeného poskytovatele. Z pozorovaných transakcí a údajů o gasu odhaduje příští slot validátora. Nejde o úplný mempool sítě, aukční knihu ani deterministickou předpověď více bloků.</p><p>Nepřítomnost ve vzorku neznamená, že je transakce neplatná; její viditelnost nezaručuje zařazení do následujícího bloku.</p>"
  },
  "transaction-fields": {
    "title": "Která pole transakce jsou specifická pro Ethereum?",
    "description": "<p>Metadata Ethereum zahrnují odesílatele a příjemce, nonce, typ, vstupní data, případně dekódovanou metodu, pole gasu, rozpis poplatků, počet potvrzení, výsledek provedení, údaje o vytvořeném kontraktu a převody tokenů. Částky vyžadující přesnost jsou desetinné řetězce: použijte celá čísla s libovolnou přesností.</p><p>Dekódování vstupu, štítky, seznamy převodů a důvody vrácení závisí na datech poskytovatele. Jejich absence nedokazuje, že transakce neobsahovala interakce s kontraktem nebo záznamy.</p>"
  },
  "address-page": {
    "title": "Co zobrazuje stránka adresy?",
    "description": "<p>Přehled účtu ukazuje aktuální zůstatek ETH, identitu účtu nebo kontraktu, vybrané zůstatky tokenů a počítadla, pokud jsou dostupná indexovaná data. Pole specifická pro Ethereum jsou ve vlastnosti <code>ethereum</code>. Zůstatky odrážejí poslední stav poskytovatele a nemusí zahrnovat dopad čekající transakce.</p>"
  },
  "history-availability": {
    "title": "Proč je historie účtu nebo tokenu neúplná?",
    "description": "<p>JSON-RPC může poskytovat stav, například zůstatky a kód kontraktu, ale úplná historie adresy a tokenů vyžaduje indexátor. Při použití záložního zdroje průzkumník poskytuje údaje o účtu z RPC a označuje historii jako <code>historyUnavailable</code>.</p><p>Záložní zdroj převodů tokenů je označen <code>recentOnly</code>. Jde o omezené prohledávání nedávných standardních záznamů převodů, které nelze použít jako úplné historické účetnictví.</p>"
  },
  "tokens-and-contracts": {
    "title": "Jak se získávají údaje o tokenech a kontraktech?",
    "description": "<p>Stránka tokenu je určena adresou kontraktu. Indexovaná metadata mohou obsahovat název, symbol, počet desetinných míst, nabídku, držitele a převody. Nejsou-li dostupná, může adaptér pro základní údaje zavolat standardní metody ERC-20. Vrácený název nebo symbol jsou nedůvěryhodná metadata, nikoli ověření pravosti.</p><p>Tento průzkumník neposkytuje obecné trasování provádění, historii interních transakcí, API oprávnění ani API portfolia či účetnictví.</p>"
  },
  "searching": {
    "title": "Co lze vyhledávat?",
    "description": "<p>Vyhledávání podporuje hashe transakcí, adresy se 40 hexadecimálními znaky a prefixem 0x, desetinná čísla bloků a hashe bloků. Adresa tokenového kontraktu může při dostupných metadatech otevřít zobrazení tokenu. Přesné hashe a adresy poskytují nejspolehlivější výsledky.</p>"
  },
  "support-disclaimer": {
    "title": "Může průzkumník získat prostředky zpět nebo vrátit transakci?",
    "description": "<p>Ne. eth.tx.taxi zobrazuje veřejná data Ethereum. Nemůže přistupovat k peněženkám, vracet transakce, získat soukromý klíč ani obnovit prostředky. S žádostí o podporu ke konkrétnímu účtu se obraťte na peněženku, burzu, most nebo aplikaci, která transakci odeslala.</p>"
  },
  "rest-overview": {
    "title": "Konvence a omezení",
    "description": "<p>Popsané veřejné endpointy používají <code>GET</code> a vracejí JSON, není-li uvedeno jinak. Parametry hashů a adres jsou hexadecimální hodnoty s prefixem 0x. Částky a hodnoty vyžadující přesnost jsou desetinné řetězce; nepřevádějte je pomocí JavaScript <code>Number</code>.</p><p>API slouží ke čtení. Nerozesílá transakce, neodhaduje gas pro libovolná vstupní data volání, neposkytuje trasování provádění ani surové bajty transakcí a při použití záložního indexování neslibuje úplnou historii účtu.</p>"
  },
  "get-init-data": {
    "title": "Stav průzkumníka",
    "description": "<p>Vrací poslední bloky, omezený vzorek čekajících transakcí, doporučené ceny gasu, statistiky vzorku a aktuální stav průzkumníka. Jde o data přehledu; názvy polí pro kompatibilitu používají sémantiku gasu Ethereum.</p>"
  },
  "get-network-info": {
    "title": "Stav sítě",
    "description": "<p>Vrací pozorovanou výšku exekuční vrstvy, stav synchronizace, název sítě a cílový interval mezi bloky v milisekundách. Neuvádí finalitu beacon chain.</p>"
  },
  "get-gas-estimates": {
    "title": "Doporučené ceny gasu",
    "description": "<p>Vrací rychlý, střední a pomalý odhad pro kompatibilitu jako celočíselné hodnoty ve wei. Pro převod na gwei vydělte 1 000 000 000. Jde o aktuální pozorování, nikoli zaručené ceny zařazení.</p>"
  },
  "get-pending-summary": {
    "title": "Souhrn vzorku čekajících transakcí",
    "description": "<p>Vrací statistiky pozorovaného vzorku čekajících transakcí, včetně jejich počtu, gasu ve vzorku a celkového poplatku. Navzdory názvu trasy pro kompatibilitu nejde o úplný mempool Ethereum ani úplný výpis txpoolu uzlu.</p>"
  },
  "get-recent-blocks": {
    "title": "Poslední bloky",
    "description": "<p>Vrací aktuální rozsah posledních bloků normalizovaných pro průzkumník.</p>"
  },
  "get-blocks-at-height": {
    "title": "Bloky do určité výšky",
    "description": "<p>Vrací dostupný rozsah posledních bloků končící na desetinné výšce bloku exekuční vrstvy <code>:height</code>.</p>"
  },
  "get-block-height": {
    "title": "Hash bloku na určité výšce",
    "description": "<p>Vrací jako prostý text hash bloku s prefixem 0x pro zadanou desetinnou výšku bloku.</p>"
  },
  "get-block": {
    "title": "Blok podle hashe",
    "description": "<p>Vrací normalizované údaje pro hash bloku Ethereum. Jde o data exekuční vrstvy; údaje o validátoru a finalitě konsenzu nejsou součástí tohoto API.</p>"
  },
  "get-block-transactions": {
    "title": "Transakce bloku",
    "description": "<p>Vrací až 25 normalizovaných transakcí z bloku, počínaje indexem <code>:start</code> číslovaným od nuly. Používá indexovaná data, jsou-li dostupná, jinak transakce bloku z RPC.</p>"
  },
  "get-transaction": {
    "title": "Transakce podle hashe",
    "description": "<p>Vrací normalizovanou transakci průzkumníka s polem <code>status.confirmed</code> a objektem metadat <code>ethereum</code>.</p>"
  },
  "get-transaction-status": {
    "title": "Stav zařazení transakce",
    "description": "<p>Vrací stav zařazení a po potvrzení případně výšku, hash a čas bloku exekuční vrstvy. Neuvádí, zda se provedení kontraktu zdařilo; k tomu použijte metadata transakce.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Metadata transakce Ethereum",
    "description": "<p>Vrací stav a výsledek provedení, potvrzení, odesílatele a příjemce nebo vytvořený kontrakt, hodnotu ve wei, pole gasu a poplatků, nonce, vstup a případně dekódovanou metodu, převody tokenů a případná metadata chyby nebo vrácení. Nejde o endpoint trasování.</p>"
  },
  "get-address": {
    "title": "Přehled účtu",
    "description": "<p>Vrací normalizovaný přehled adresy. Zůstatek Ethereum, identita, počítadla, zůstatky tokenů a dostupnost historie jsou pod <code>ethereum</code>. Záložní zdroj může nastavit <code>ethereum.historyUnavailable</code>.</p>"
  },
  "get-address-transactions": {
    "title": "Transakce účtu",
    "description": "<p>Vrací indexované transakce adresy. Přidejte <code>?after_txid=0x…</code> pro pokračování za vrácenou transakcí. Záložní RPC vrací prázdný seznam, aniž by tvrdilo, že historie na řetězci je prázdná.</p>"
  },
  "get-address-metadata": {
    "title": "Metadata účtu Ethereum",
    "description": "<p>Vrací identitu účtu nebo kontraktu, aktuální zůstatek ETH ve wei, dostupná metadata vytvoření, počítadla, vybrané zůstatky tokenů a <code>historyUnavailable</code>.</p>"
  },
  "get-token": {
    "title": "Metadata tokenu",
    "description": "<p>Vrací metadata tokenového kontraktu. Přednost mají metadata indexátoru; základní pole ERC-20 mohou pocházet z přímých volání kontraktu. Chybějící pole považujte za nedostupná a názvy či symboly za nedůvěryhodné.</p>"
  },
  "get-token-transfers": {
    "title": "Převody tokenu",
    "description": "<p>Vrací převody a metadata stránkování. Indexované požadavky přijímají číselná pole <code>block_number</code>, <code>index</code> a <code>items_count</code>. Záložní zdroj nastavuje <code>historyUnavailable: true</code> a <code>recentOnly: true</code>: jde o omezené prohledávání nedávných standardních záznamů převodů, nikoli úplnou historii.</p>"
  },
  "websocket-connect": {
    "title": "Připojení a příjem aktualizací",
    "description": "<p>Připojte se k <code>/api/v1/ws</code>. Server odešle počáteční stav průzkumníka a poté aktualizace při změně pozorovaného konce řetězce nebo vzorku čekajících transakcí, spolu s pravidelným signálem udržujícím spojení. Pole odpovídají <code>/api/v1/init-data</code>.</p><p>Jde o pohled adaptéru založený na datech poskytovatele, nikoli surový odběr exekučního klienta ani globální proud mempoolu.</p>"
  },
  "websocket-init": {
    "title": "Vyžádání aktuálního stavu",
    "description": "<p>Okamžitě odešle aktuální stav průzkumníka, což je užitečné po opětovném připojení.</p>"
  },
  "websocket-ping": {
    "title": "Udržování spojení",
    "description": "<p>Ověří, zda spojení odpovídá.</p>"
  },
  "websocket-track-transaction": {
    "title": "Sledování jedné transakce",
    "description": "<p>Sleduje jeden 32bajtový hash s prefixem 0x. Server nejprve odešle odhad kompatibility <code>txPosition</code> a poté <code>{ \"tx\": … }</code>, když se změní normalizovaný stav. Nový hash nahradí předchozí odběr. Pozice v příštím slotu je odhad založený na pozorovaném vzorku, nikoli záruka zařazení.</p>"
  },
  "websocket-track-address": {
    "title": "Sledování jednoho účtu",
    "description": "<p>Sleduje jednu adresu pomocí dostupné indexované historie. Nově pozorované čekající transakce přicházejí jako <code>address-transactions</code>; nově potvrzené nebo změněné transakce jako <code>block-transactions</code>. Nová adresa nahradí předchozí odběr. Pokud není indexování historie dostupné, události se nevytvářejí uměle.</p>"
  },
  "websocket-track-pending": {
    "title": "Sledování odhadu čekajících transakcí pro příští slot",
    "description": "<p>Index <code>0</code> vrací odhad pozorovaného vzorku čekajících transakcí jako <code>projected-block-transactions</code>. Ethereum nemá deterministickou projekci balíčků na více bloků, takže vyšší indexy neobsahují předpokládané transakce. Odesláním <code>-1</code> odběr zrušíte.</p>"
  },
  "websocket-reconnect": {
    "title": "Bezpečné opětovné připojení",
    "description": "<p>Po uzavření spojení se znovu připojte s postupně prodlužovanou prodlevou, odešlete <code>{ \"action\": \"init\" }</code> a poté obnovte odběry. Chybné nebo nepodporované zprávy pro odběr jsou ignorovány; ověřujte data klienta a nepovažujte absenci odpovědi za potvrzení přijetí.</p>"
  }
};

export function localizeEthereumDocsCzech(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('cs')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
