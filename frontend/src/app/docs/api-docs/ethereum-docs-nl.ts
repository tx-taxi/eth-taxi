import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Ethereum-basis",
  "Basics": "Basis",
  "Gas and fees": "Gas en kosten",
  "Fees": "Kosten",
  "Transaction status": "Transactiestatus",
  "Transactions": "Transacties",
  "Accounts, contracts, and tokens": "Accounts, contracten en tokens",
  "Accounts": "Accounts",
  "Tokens": "Tokens",
  "Explorer": "Verkenner",
  "Support": "Ondersteuning",
  "Using the API": "De API gebruiken",
  "Overview": "Overzicht",
  "Network and pending sample": "Netwerk en wachtende steekproef",
  "Network": "Netwerk",
  "Blocks": "Blokken",
  "Accounts and tokens": "Accounts en tokens",
  "Connection": "Verbinding",
  "Actions": "Acties",
  "Subscriptions": "Abonnementen"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Hoe werken Ethereum-transacties?",
    "description": "<p>Een Ethereum-transactie is een ondertekende instructie van een extern beheerd account. Ze kan ETH overmaken, een smart contract aanroepen of aanmaken, of gegevens versturen zonder ETH-waarde. De nonce van de afzender bepaalt de volgorde van transacties van dat account: een latere nonce kan niet worden opgenomen zolang een eerdere nonce niet is afgehandeld.</p><p>De verkenner maakt onderscheid tussen overgemaakte ETH en de kosten. Een contractaanroep kan tokens verplaatsen of de toestand wijzigen, ook als de ETH-waarde nul is.</p><p class=\"mt-3\">Over het protocol: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">transacties</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gas en kosten</a> en <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">accounts</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "Wat is het verschil tussen een account en een contract?",
    "description": "<p>Adressen identificeren extern beheerde accounts en contractaccounts. Een privésleutel beheert een extern account en start transacties; een contract bevat code die bij een aanroep wordt uitgevoerd. Contractstatus, namen, labels en verificatiegegevens zijn metadata van de aanbieder en kunnen ontbreken.</p><p>Een verkenner kan niet vaststellen wie de eigenaar van een adres is.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "Wat betekenen blokken, bevestigingen en finaliteit?",
    "description": "<p>Het Ethereum-hoofdnetwerk gebruikt proof of stake. Een transactie is bevestigd na opname in een uitvoeringsblok. De bevestigingen geven de waargenomen blokdiepte op de uitvoeringslaag aan naarmate er nieuwe blokken volgen.</p><p>Diepte is nuttige context, maar geen bewijs van consensusfinaliteit. Deze verkenner toont geen finaliteitscheckpoints van de Beacon Chain en heeft geen finalisatie-API: geen enkel gekozen aantal bevestigingen bewijst protocolfinaliteit.</p>"
  },
  "what-is-gas": {
    "title": "Wat zijn gas, wei en gwei?",
    "description": "<p>Gas meet het rekenwerk van de EVM. Wei is de kleinste ETH-eenheid: 1 ETH is 10<sup>18</sup> wei. Gasprijzen worden meestal in gwei getoond: 1 gwei is 10<sup>9</sup> wei, oftewel 0,000000001 ETH.</p><p><code>gasLimit</code> is de maximale toegestane hoeveelheid gas; <code>gasUsed</code> is het werk dat de opgenomen transactie verbruikte. De uitvoeringskosten zijn het gebruikte gas vermenigvuldigd met de effectieve gasprijs. Blobkosten worden apart getoond wanneer ze beschikbaar zijn.</p>"
  },
  "base-and-priority-fees": {
    "title": "Hoe werken basis-, prioriteits- en maximale kosten?",
    "description": "<p>Bij EIP-1559-transacties beperkt <code>maxFeePerGas</code> de toegestane prijs en <code>maxPriorityFeePerGas</code> de fooi. De effectieve prijs hangt af van de basiskosten van het blok plus de toepasselijke prioriteitskosten, binnen die grenzen. Het basisdeel wordt verbrand; de prioriteitskosten belonen de validator.</p><p>De maximale kosten zijn een bovengrens, niet noodzakelijk het betaalde bedrag. Oudere transacties gebruiken een gasprijsveld.</p>"
  },
  "fee-estimates": {
    "title": "Hoe gebruik ik de aanbevolen gasprijzen?",
    "description": "<p>De langzame, gemiddelde en snelle waarden zijn waarnemingen van aanbieders en worden door de REST-API in wei teruggegeven. Het zijn geen offertes of garanties op opname. Een wallet kan instellingen kiezen op basis van urgentie, nonce-afhankelijkheden en de meest recente basiskosten.</p><p>Bij een opgenomen transactie laten de effectieve gasprijs en het gebruikte gas zien wat is betaald. Bij een wachtende transactie is soms alleen het maximaal mogelijke bedrag bekend.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "Waarom kan een bevestigde transactie mislukt zijn?",
    "description": "<p>Opname en uitvoering zijn twee verschillende feiten. Een transactie kan in een blok bevestigd zijn en toch worden teruggedraaid of een fout melden als de EVM-uitvoering mislukt; daarbij kan nog steeds gas worden verbruikt. Een succesvol resultaat betekent dat de geregistreerde uitvoering is voltooid, niet dat de contractinteractie het verwachte resultaat had.</p><p>Bekijk <code>status.confirmed</code>, de Ethereum-velden <code>status</code>/<code>result</code>, de foutindicator en een eventuele reden van terugdraaiing samen.</p>"
  },
  "why-pending": {
    "title": "Waarom wacht een transactie of ontbreekt deze?",
    "description": "<p>De kosten kunnen te laag zijn, de transactie kan door een eerdere nonce worden geblokkeerd, nog niet zichtbaar zijn voor de aanbieder, met dezelfde nonce zijn vervangen of door de verzendende wallet of node zijn verwijderd. De weergave van wachtende transacties kan op zichzelf de oorzaak niet vaststellen.</p><p>Ethereum heeft geen enkele mondiale mempool. Aanbieders kunnen verschillende transacties en volgordes zien. Raadpleeg de verzendende wallet of dienst voordat je een transactie vervangt of annuleert.</p>"
  },
  "pending-sample": {
    "title": "Wat geeft de weergave van wachtende activiteit weer?",
    "description": "<p>De weergave toont een beperkte steekproef van de verbonden aanbieder. Ze schat het volgende validatorslot op basis van waargenomen transacties en gasgegevens. Dit is geen volledige netwerkmempool, biedboek of deterministische projectie van meerdere blokken.</p><p>Afwezigheid in de steekproef betekent niet dat een transactie ongeldig is; zichtbaarheid garandeert geen opname in het volgende blok.</p>"
  },
  "transaction-fields": {
    "title": "Welke transactievelden zijn specifiek voor Ethereum?",
    "description": "<p>Ethereum-metadata omvatten afzender en ontvanger, nonce, type, invoergegevens, gedecodeerde methode indien beschikbaar, gasvelden, kostenverdeling, bevestigingsdiepte, uitvoeringsresultaat, aangemaakt contract en tokenoverdrachten. Precisiegevoelige bedragen zijn decimale tekenreeksen: gebruik gehele getallen met willekeurige precisie.</p><p>Decodering, labels, overdrachtslijsten en redenen van terugdraaiing hangen af van gegevens van de aanbieder. Het ontbreken ervan bewijst niet dat er geen contractinteractie of logs waren.</p>"
  },
  "address-page": {
    "title": "Wat toont een adrespagina?",
    "description": "<p>Een accountoverzicht toont het huidige ETH-saldo, de identiteit van het account of contract, geselecteerde tokensaldi en tellers wanneer geïndexeerde gegevens beschikbaar zijn. Ethereum-specifieke velden staan onder <code>ethereum</code>. Saldi weerspiegelen de laatste toestand van de aanbieder en kunnen het effect van wachtende transacties missen.</p>"
  },
  "history-availability": {
    "title": "Waarom is de geschiedenis van een account of token onvolledig?",
    "description": "<p>JSON-RPC kan toestand zoals saldi en contractcode leveren, maar volledige adres- en tokengeschiedenis vereist een indexeerder. Bij terugval geeft de verkenner accountgegevens via RPC en markeert de geschiedenis met <code>historyUnavailable</code>.</p><p>Terugval voor tokenoverdrachten wordt gemarkeerd met <code>recentOnly</code>. Dit is een beperkte zoekactie in recente logs van standaardoverdrachten en geen volledige historische administratie.</p>"
  },
  "tokens-and-contracts": {
    "title": "Hoe worden token- en contractgegevens verkregen?",
    "description": "<p>Een tokenpagina wordt geïdentificeerd door het contractadres. Geïndexeerde metadata kunnen naam, symbool, decimalen, aanbod, houders en overdrachten omvatten. Als die gegevens niet beschikbaar zijn, kan de adapter standaard ERC-20-methoden aanroepen voor basisvelden. Een naam of symbool is niet-geverifieerde metadata en geen bewijs van legitimiteit.</p><p>Deze verkenner biedt geen algemene uitvoeringstraces, geschiedenis van interne transacties, toestemmings-API's of portefeuille- en boekhoud-API's.</p>"
  },
  "searching": {
    "title": "Waarop kan ik zoeken?",
    "description": "<p>Zoeken ondersteunt transactiehashes, adressen van 40 hexadecimale tekens met prefix 0x, decimale bloknummers en blokhashes. Een tokencontractadres kan de tokenpagina openen als metadata beschikbaar zijn. Exacte hashes en adressen geven de betrouwbaarste resultaten.</p>"
  },
  "support-disclaimer": {
    "title": "Kan deze verkenner fondsen terughalen of een transactie terugdraaien?",
    "description": "<p>Nee. eth.tx.taxi toont openbare Ethereum-gegevens. De site kan geen toegang krijgen tot wallets, transacties ongedaan maken of privésleutels en fondsen terughalen. Neem voor accountgebonden hulp contact op met de wallet, beurs, bridge of toepassing die de transactie heeft verstuurd.</p>"
  },
  "rest-overview": {
    "title": "Conventies en beperkingen",
    "description": "<p>De gedocumenteerde routes zijn openbare <code>GET</code>-eindpunten en retourneren JSON tenzij anders vermeld. Hashes en adressen zijn hexadecimale waarden met prefix 0x. Bedragen en hoeveelheden die precisie vereisen zijn decimale tekenreeksen; verwerk ze niet met JavaScript <code>Number</code>.</p><p>Dit is een lees-API. Ze verzendt geen transacties, schat geen gas voor willekeurige aanroepgegevens, levert geen uitvoeringstraces of ruwe transactiebytes en garandeert geen volledige accountgeschiedenis wanneer de indexeerder terugvalt.</p>"
  },
  "get-init-data": {
    "title": "Momentopname van de verkenner",
    "description": "<p>Geeft recente blokken, een beperkte steekproef van wachtende transacties, gasaanbevelingen, steekproefmetingen en de huidige toestand van de verkenner terug. Dit is de dashboardpayload; namen van compatibiliteitsvelden gebruiken de Ethereum-gassemantiek.</p>"
  },
  "get-network-info": {
    "title": "Netwerkstatus",
    "description": "<p>Geeft de waargenomen hoogte op de uitvoeringslaag, synchronisatiestatus, netwerknaam en het beoogde blokinterval in milliseconden terug. Beacon Chain-finaliteit wordt niet gerapporteerd.</p>"
  },
  "get-gas-estimates": {
    "title": "Aanbevolen gasprijzen",
    "description": "<p>Geeft snelle, gemiddelde en langzame compatibiliteitsschattingen terug als gehele waarden in wei. Deel door 1.000.000.000 voor gwei. Dit zijn actuele waarnemingen, geen prijzen die opname garanderen.</p>"
  },
  "get-pending-summary": {
    "title": "Overzicht van de wachtende steekproef",
    "description": "<p>Geeft metingen voor de waargenomen steekproef van wachtende transacties terug, waaronder aantal, gas in de steekproef en totale kosten. Ondanks de naam van de compatibiliteitsroute is dit niet de volledige Ethereum-mempool of de volledige txpool van een node.</p>"
  },
  "get-recent-blocks": {
    "title": "Recente blokken",
    "description": "<p>Geeft het huidige venster van recente blokken, genormaliseerd voor de verkenner, terug.</p>"
  },
  "get-blocks-at-height": {
    "title": "Blokken tot een hoogte",
    "description": "<p>Geeft het beschikbare venster van recente blokken terug dat eindigt bij de decimale uitvoeringsblokhoogte <code>:height</code>.</p>"
  },
  "get-block-height": {
    "title": "Blokhash op een hoogte",
    "description": "<p>Geeft de blokhash met prefix 0x voor een decimale blokhoogte terug als platte tekst.</p>"
  },
  "get-block": {
    "title": "Blok op hash",
    "description": "<p>Geeft genormaliseerde gegevens voor een Ethereum-blokhash terug. Dit zijn gegevens van de uitvoeringslaag; validator- en consensusfinaliteitsgegevens vallen buiten deze API.</p>"
  },
  "get-block-transactions": {
    "title": "Transacties in een blok",
    "description": "<p>Geeft maximaal 25 genormaliseerde transacties uit een blok terug vanaf de op nul gebaseerde offset <code>:start</code>. Gebruikt geïndexeerde gegevens indien beschikbaar, anders bloktransacties via RPC.</p>"
  },
  "get-transaction": {
    "title": "Transactie op hash",
    "description": "<p>Geeft de genormaliseerde verkennertransactie terug met <code>status.confirmed</code> en een object met <code>ethereum</code>-metadata.</p>"
  },
  "get-transaction-status": {
    "title": "Opnamestatus van een transactie",
    "description": "<p>Geeft de opnamestatus en, indien bevestigd, hoogte, hash en tijd van het uitvoeringsblok terug wanneer beschikbaar. Dit geeft niet aan of de contractuitvoering is geslaagd; gebruik daarvoor de transactiemetadata.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Ethereum-transactiemetadata",
    "description": "<p>Geeft uitvoeringsstatus en resultaat, bevestigingen, afzender en ontvanger of aangemaakt contract, waarde in wei, gas- en kostenvelden, nonce, invoer en gedecodeerde methode indien beschikbaar, tokenoverdrachten en verstrekte fout- of terugdraaimetadata terug. Dit is geen trace-eindpunt.</p>"
  },
  "get-address": {
    "title": "Accountoverzicht",
    "description": "<p>Geeft een genormaliseerd adresoverzicht terug. Ethereum-saldo, identiteit, tellers, tokensaldi en beschikbaarheid van geschiedenis staan onder <code>ethereum</code>. Bij terugval kan <code>ethereum.historyUnavailable</code> worden ingesteld.</p>"
  },
  "get-address-transactions": {
    "title": "Accounttransacties",
    "description": "<p>Geeft geïndexeerde transacties voor een adres terug. Voeg <code>?after_txid=0x…</code> toe om na een geretourneerde transactie verder te gaan. RPC-terugval geeft een lege lijst terug zonder te beweren dat de on-chain geschiedenis leeg is.</p>"
  },
  "get-address-metadata": {
    "title": "Ethereum-accountmetadata",
    "description": "<p>Geeft de identiteit van het account of contract, het huidige ETH-saldo in wei, beschikbare aanmaakmetadata, tellers, geselecteerde tokensaldi en <code>historyUnavailable</code> terug.</p>"
  },
  "get-token": {
    "title": "Tokenmetadata",
    "description": "<p>Geeft metadata van een tokencontract terug. Metadata van de indexeerder hebben voorrang; basisvelden van ERC-20 kunnen via directe contractaanroepen worden opgehaald. Ontbrekende velden zijn niet beschikbaar en namen of symbolen zijn niet geverifieerd.</p>"
  },
  "get-token-transfers": {
    "title": "Tokenoverdrachten",
    "description": "<p>Geeft overdrachten en pagineringsmetadata terug. Geïndexeerde verzoeken accepteren numerieke parameters <code>block_number</code>, <code>index</code> en <code>items_count</code>. Terugval stelt <code>historyUnavailable: true</code> en <code>recentOnly: true</code> in: dit is een beperkte scan van recente logs van standaardoverdrachten, niet de volledige geschiedenis.</p>"
  },
  "websocket-connect": {
    "title": "Verbinden en live momentopnamen ontvangen",
    "description": "<p>Maak verbinding met <code>/api/v1/ws</code>. De server verstuurt een eerste momentopname van de verkenner en daarna nieuwe momentopnamen wanneer het waargenomen nieuwste blok of de wachtende steekproef verandert, met een periodiek controlesignaal. De velden volgen <code>/api/v1/init-data</code>.</p><p>Dit is de door aanbieders gevoede weergave van de adapter, geen rechtstreeks abonnement op een uitvoeringsclient of stroom van de mondiale mempool.</p>"
  },
  "websocket-init": {
    "title": "Een nieuwe momentopname aanvragen",
    "description": "<p>Verstuurt direct de huidige momentopname van de verkenner, nuttig na een herverbinding.</p>"
  },
  "websocket-ping": {
    "title": "Verbinding controleren",
    "description": "<p>Controleert of de verbinding reageert.</p>"
  },
  "websocket-track-transaction": {
    "title": "Een transactie volgen",
    "description": "<p>Volgt één hash van 32 bytes met prefix 0x. De server verstuurt eerst een compatibiliteitsschatting <code>txPosition</code> en daarna <code>{ \"tx\": … }</code> wanneer de genormaliseerde toestand verandert. Een nieuwe hash vervangt het vorige abonnement. De positie in het volgende slot is een schatting uit de waargenomen steekproef, geen garantie op opname.</p>"
  },
  "websocket-track-address": {
    "title": "Een account volgen",
    "description": "<p>Volgt één adres met behulp van beschikbare geïndexeerde geschiedenis. Nieuw waargenomen wachtende transacties worden verstuurd als <code>address-transactions</code>; nieuw bevestigde of gewijzigde transacties als <code>block-transactions</code>. Een nieuw adres vervangt het vorige abonnement. Er worden geen gebeurtenissen verzonnen wanneer geschiedenisindexering niet beschikbaar is.</p>"
  },
  "websocket-track-pending": {
    "title": "De wachtende schatting voor het volgende slot volgen",
    "description": "<p>Index <code>0</code> geeft de waargenomen wachtende steekproefschatting terug als <code>projected-block-transactions</code>. Ethereum heeft geen deterministische projectie van meerdere blokken, dus hogere indexen bevatten geen geprojecteerde transacties. Stuur <code>-1</code> om het abonnement te verwijderen.</p>"
  },
  "websocket-reconnect": {
    "title": "Veilig opnieuw verbinden",
    "description": "<p>Verbind na sluiting opnieuw met oplopende wachttijd, stuur <code>{ \"action\": \"init\" }</code> en maak de abonnementen opnieuw aan. Misvormde of niet-ondersteunde berichten worden genegeerd; controleer clientgegevens en leid geen acceptatie af uit stilte.</p>"
  }
};

export function localizeEthereumDocsDutch(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('nl')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
