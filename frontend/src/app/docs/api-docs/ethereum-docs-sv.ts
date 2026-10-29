import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Grunderna i Ethereum",
  "Basics": "Grunder",
  "Gas and fees": "Gas och avgifter",
  "Fees": "Avgifter",
  "Transaction status": "Transaktionsstatus",
  "Transactions": "Transaktioner",
  "Accounts, contracts, and tokens": "Konton, kontrakt och token",
  "Accounts": "Konton",
  "Tokens": "Token",
  "Explorer": "Utforskaren",
  "Support": "Support",
  "Using the API": "Använda API:t",
  "Overview": "Översikt",
  "Network and pending sample": "Nätverk och väntande urval",
  "Network": "Nätverk",
  "Blocks": "Block",
  "Accounts and tokens": "Konton och token",
  "Connection": "Anslutning",
  "Actions": "Åtgärder",
  "Subscriptions": "Prenumerationer"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Hur fungerar Ethereum-transaktioner?",
    "description": "<p>En Ethereum-transaktion är en signerad instruktion från ett externt ägt konto. Den kan överföra ETH, anropa eller skapa ett smart kontrakt eller bära data utan ETH-värde. Avsändarens nonce ordnar kontots transaktioner, så en senare nonce kan inte inkluderas medan en tidigare är olöst.</p><p>Utforskaren skiljer överförd ETH från avgiften. Ett kontraktsanrop kan flytta token eller ändra tillstånd även när ETH-värdet är noll.</p><p class=\"mt-3\">Om protokollet: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">transaktioner</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gas och avgifter</a> och <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">konton</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "Vad är skillnaden mellan ett konto och ett kontrakt?",
    "description": "<p>Adresser identifierar externt ägda konton och kontraktskonton. En privat nyckel styr ett externt ägt konto och startar transaktioner; ett kontrakt innehåller kod och körs vid anrop. Kontraktets status, namn, etiketter och verifieringsuppgifter är leverantörens metadata och kan saknas.</p><p>En utforskare kan inte fastställa vem som äger en adress.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "Vad betyder block, bekräftelser och finalitet?",
    "description": "<p>Ethereums huvudnät använder proof of stake. En transaktion bekräftas när den inkluderas i ett exekveringsblock. Bekräftelserna är det observerade blockdjupet i exekveringslagret när senare block byggs vidare på blocket.</p><p>Bekräftelsedjup ger användbar kontext men är inte ett bevis på konsensusfinalitet. Utforskaren visar inte beacon-kedjans finalitetskontrollpunkter eller något API för finalisering, så betrakta inte ett valt antal bekräftelser som protokollets finalitet.</p>"
  },
  "what-is-gas": {
    "title": "Vad är gas, wei och gwei?",
    "description": "<p>Gas mäter beräkningsarbete i EVM. Wei är den minsta ETH-enheten: 1 ETH är 10<sup>18</sup> wei. Gaspriser anges ofta i gwei: 1 gwei är 10<sup>9</sup> wei eller 0,000000001 ETH.</p><p><code>gasLimit</code> är den högsta tillåtna gasmängden; <code>gasUsed</code> är det arbete som en inkluderad transaktion förbrukade. Exekveringsavgiften är använd gas multiplicerad med det effektiva gaspriset. Fält för blobavgifter visas separat när de finns.</p>"
  },
  "base-and-priority-fees": {
    "title": "Hur fungerar basavgift, prioritetsavgift och maxavgift?",
    "description": "<p>För EIP-1559-transaktioner begränsar <code>maxFeePerGas</code> det tillåtna priset och <code>maxPriorityFeePerGas</code> begränsar dricksen. Det effektiva priset styrs av blockets basavgift plus tillämplig prioritetsavgift, inom dessa gränser. Basavgiftsdelen bränns; prioritetsavgiften är incitamentet till validatorn.</p><p>Maxavgiften är ett tak, inte nödvändigtvis det betalda beloppet. Äldre transaktioner anger i stället ett gasprisfält.</p>"
  },
  "fee-estimates": {
    "title": "Hur bör jag använda rekommendationerna för gaspris?",
    "description": "<p>Värdena långsam, genomsnittlig och snabb är observationer från leverantören och returneras i wei av REST-API:t. De är varken en offert eller ett löfte om inkludering. En plånbok kan välja inställningar utifrån hur bråttom det är, nonce-beroenden och den senaste basavgiften.</p><p>För en inkluderad transaktion visar effektivt gaspris och använd gas vad som betalades. För en väntande transaktion kanske bara den maximala avgiften är känd.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "Varför kan en bekräftad transaktion ha misslyckats?",
    "description": "<p>Inkludering och exekvering är två skilda saker. En transaktion kan bekräftas i ett block men ändå återställas eller ge fel eftersom EVM-exekveringen misslyckades; den kan fortfarande förbruka gas. Ett lyckat resultat innebär att den registrerade exekveringen slutfördes, inte att kontraktsinteraktionen gav det resultat användaren förväntade sig.</p><p>Läs <code>status.confirmed</code>, Ethereums <code>status</code>/<code>result</code>, felflaggan och eventuell orsak till återställning tillsammans.</p>"
  },
  "why-pending": {
    "title": "Varför väntar en transaktion eller saknas den?",
    "description": "<p>En väntande transaktion kan ha för låg avgift, blockeras av en lägre nonce från avsändaren, ännu inte vara synlig för leverantören, ha ersatts med samma nonce eller ha tagits bort ur plånbokens eller nodens kö. Vyn över väntande transaktioner kan inte ensam avgöra orsaken.</p><p>Ethereum har ingen enda global mempool. Leverantörer kan se olika transaktioner och ordning. Kontrollera plånboken eller tjänsten som skickade transaktionen innan du ersätter eller avbryter den.</p>"
  },
  "pending-sample": {
    "title": "Vad visar vyn över väntande aktivitet?",
    "description": "<p>Vyn över väntande transaktioner är ett begränsat urval från den anslutna leverantören. Den uppskattar nästa validatorslot utifrån observerade transaktioner och gasdata. Den är inte en komplett nätverksmempool, en auktionsbok eller en deterministisk prognos för flera block.</p><p>Att en transaktion saknas i urvalet betyder inte att den är ogiltig; synlighet garanterar inte inkludering i nästa block.</p>"
  },
  "transaction-fields": {
    "title": "Vilka transaktionsfält är specifika för Ethereum?",
    "description": "<p>Ethereum-metadata omfattar avsändarens och mottagarens identiteter, nonce, typ, indata, avkodad metod när den finns, gasfält, avgiftsuppdelning, bekräftelsedjup, exekveringsresultat, information om skapade kontrakt och tokenöverföringar. Belopp som kräver precision är decimalsträngar: använd heltal med godtycklig precision.</p><p>Avkodning av indata, etiketter, överföringslistor och orsaker till återställning beror på uppströmsdata. Att de saknas bevisar inte att transaktionen saknade kontraktsinteraktion eller loggar.</p>"
  },
  "address-page": {
    "title": "Vad visar adressens sida?",
    "description": "<p>En kontoöversikt visar aktuellt ETH-saldo, konto- eller kontraktsidentitet, utvalda tokensaldon och räknare när indexerade data finns. Ethereum-specifika fält ligger under egenskapen <code>ethereum</code>. Saldon speglar leverantörens senaste tillstånd och kanske inte innehåller effekten av en väntande transaktion.</p>"
  },
  "history-availability": {
    "title": "Varför är konto- eller tokenhistoriken ofullständig?",
    "description": "<p>JSON-RPC kan ge tillstånd som saldon och kontraktskod, men fullständig adress- och tokenhistorik kräver en indexerare. Vid reservläge visar utforskaren kontouppgifter från RPC och markerar historiken med <code>historyUnavailable</code>.</p><p>En reservkälla för tokenöverföringar markeras med <code>recentOnly</code>. Den är en begränsad sökning i de senaste standardloggarna för överföringar och får inte användas som fullständig historisk redovisning.</p>"
  },
  "tokens-and-contracts": {
    "title": "Hur tas uppgifter om token och kontrakt fram?",
    "description": "<p>En tokensida identifieras av kontraktsadressen. Indexerade metadata kan omfatta namn, symbol, decimaler, utbud, innehavare och överföringar. När de inte finns kan adaptern anropa standardmetoder för ERC-20 för grundläggande fält. Ett returnerat namn eller en symbol är opålitliga metadata, inte en kontroll av legitimitet.</p><p>Utforskaren tillhandahåller inte allmänna exekveringsspår, historik över interna transaktioner, API:er för tilldelade rättigheter eller API:er för portfölj och redovisning.</p>"
  },
  "searching": {
    "title": "Vad kan jag söka efter?",
    "description": "<p>Sökningen stöder transaktionshashar, adresser med prefixet 0x och 40 hexadecimala tecken, decimala blocknummer och blockhashar. En tokenkontraktsadress kan öppna en tokenvy när metadata finns. Exakta hashar och adresser ger säkrast resultat.</p>"
  },
  "support-disclaimer": {
    "title": "Kan utforskaren återställa medel eller ångra en transaktion?",
    "description": "<p>Nej. eth.tx.taxi visar offentliga Ethereum-data. Den kan inte komma åt plånböcker, ångra en transaktion, hämta en privat nyckel eller återställa medel. Kontakta plånboken, börsen, bryggan eller appen som skickade transaktionen för kontospecifik support.</p>"
  },
  "rest-overview": {
    "title": "Konventioner och begränsningar",
    "description": "<p>De dokumenterade rutterna är offentliga <code>GET</code>-ändpunkter och returnerar JSON om inget annat anges. Hash- och adressparametrar är hexadecimala värden med prefixet 0x. Belopp och storheter som kräver precision är decimalsträngar; tolka dem inte med JavaScript <code>Number</code>.</p><p>Detta är ett läs-API. Det sänder inte transaktioner, uppskattar inte gas för godtyckliga anropsdata, tillhandahåller inte exekveringsspår eller råa transaktionsbyte och lovar inte fullständig kontohistorik när indexerarens reservkälla används.</p>"
  },
  "get-init-data": {
    "title": "Ögonblicksbild av utforskaren",
    "description": "<p>Returnerar senaste block, ett begränsat urval väntande transaktioner, gasrekommendationer, urvalsstatistik och utforskarens aktuella tillstånd. Detta är instrumentpanelens data; kompatibilitetsfältens namn använder Ethereums gassemantik.</p>"
  },
  "get-network-info": {
    "title": "Nätverksstatus",
    "description": "<p>Returnerar observerad höjd i exekveringslagret, synkroniseringsstatus, nätverksnamn och målintervall mellan block i millisekunder. Det rapporterar inte beacon-kedjans finalitet.</p>"
  },
  "get-gas-estimates": {
    "title": "Rekommenderade gaspriser",
    "description": "<p>Returnerar snabba, genomsnittliga och långsamma kompatibilitetsuppskattningar som heltal i wei. Dividera med 1 000 000 000 för gwei. Värdena är aktuella observationer, inte garanterade priser för inkludering.</p>"
  },
  "get-pending-summary": {
    "title": "Sammanfattning av väntande urval",
    "description": "<p>Returnerar statistik för det observerade urvalet väntande transaktioner, inklusive antal, gas i urvalet och total avgift. Trots kompatibilitetsruttens namn är detta inte en komplett Ethereum-mempool eller en dump av nodens txpool.</p>"
  },
  "get-recent-blocks": {
    "title": "Senaste block",
    "description": "<p>Returnerar det aktuella intervallet av senaste block, normaliserat för utforskaren.</p>"
  },
  "get-blocks-at-height": {
    "title": "Block fram till en höjd",
    "description": "<p>Returnerar det tillgängliga intervallet av senaste block som slutar vid den decimala exekveringsblockhöjden <code>:height</code>.</p>"
  },
  "get-block-height": {
    "title": "Blockhash vid en höjd",
    "description": "<p>Returnerar blockhashen med prefixet 0x som ren text för en decimal blockhöjd.</p>"
  },
  "get-block": {
    "title": "Block efter hash",
    "description": "<p>Returnerar normaliserade uppgifter för en Ethereum-blockhash. Detta är data från exekveringslagret; uppgifter om validator och konsensusfinalitet ligger utanför detta API.</p>"
  },
  "get-block-transactions": {
    "title": "Blocktransaktioner",
    "description": "<p>Returnerar högst 25 normaliserade transaktioner från ett block, med nollbaserad position <code>:start</code>. Indexerade data används när de finns, annars blocktransaktioner från RPC.</p>"
  },
  "get-transaction": {
    "title": "Transaktion efter hash",
    "description": "<p>Returnerar utforskarens normaliserade transaktion med <code>status.confirmed</code> och ett metadataobjekt <code>ethereum</code>.</p>"
  },
  "get-transaction-status": {
    "title": "Transaktionens inkluderingsstatus",
    "description": "<p>Returnerar inkluderingsstatus och, när transaktionen är bekräftad, exekveringsblockets höjd, hash och tid när de finns. Det anger inte om kontraktsexekveringen lyckades; använd transaktionens metadata för att skilja på detta.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Metadata för Ethereum-transaktion",
    "description": "<p>Returnerar exekveringsstatus och resultat, bekräftelser, avsändare/mottagare eller skapat kontrakt, värde i wei, gas- och avgiftsfält, nonce, indata och avkodad metod när de finns, tokenöverföringar samt tillhandahållna fel- eller återställningsmetadata. Detta är inte en ändpunkt för exekveringsspår.</p>"
  },
  "get-address": {
    "title": "Kontoöversikt",
    "description": "<p>Returnerar en normaliserad adressöversikt. Ethereum-saldo, identitet, räknare, tokensaldon och historikfunktioner finns under <code>ethereum</code>. Reservkällan kan sätta <code>ethereum.historyUnavailable</code>.</p>"
  },
  "get-address-transactions": {
    "title": "Kontotransaktioner",
    "description": "<p>Returnerar indexerade transaktioner för en adress. Lägg till <code>?after_txid=0x…</code> för att fortsätta efter en returnerad transaktion. RPC-reservkällan returnerar en tom lista utan att påstå att historiken på kedjan är tom.</p>"
  },
  "get-address-metadata": {
    "title": "Metadata för Ethereum-konto",
    "description": "<p>Returnerar konto- eller kontraktsidentitet, aktuellt ETH-saldo i wei, tillgängliga metadata om skapandet, räknare, utvalda tokensaldon och <code>historyUnavailable</code>.</p>"
  },
  "get-token": {
    "title": "Tokenmetadata",
    "description": "<p>Returnerar metadata för ett tokenkontrakt. Indexerarens metadata föredras; grundläggande ERC-20-fält kan hämtas via direkta kontraktsanrop. Behandla saknade fält som otillgängliga och namn eller symboler som opålitliga.</p>"
  },
  "get-token-transfers": {
    "title": "Tokenöverföringar",
    "description": "<p>Returnerar överföringar och sidindelningsmetadata. Indexerade förfrågningar accepterar numeriska <code>block_number</code>, <code>index</code> och <code>items_count</code>. En reservkälla sätter <code>historyUnavailable: true</code> och <code>recentOnly: true</code>: det är en begränsad sökning i de senaste standardloggarna för överföringar, inte fullständig historik.</p>"
  },
  "websocket-connect": {
    "title": "Anslut och ta emot uppdateringar",
    "description": "<p>Anslut till <code>/api/v1/ws</code>. Servern skickar en första ögonblicksbild av utforskaren och sedan nya bilder när den observerade kedjetoppen eller urvalet väntande transaktioner ändras, samt periodiska livstecken. Fälten följer <code>/api/v1/init-data</code>.</p><p>Detta är adapterns leverantörsbaserade vy, inte en rå prenumeration på en exekveringsklient eller en global mempoolström.</p>"
  },
  "websocket-init": {
    "title": "Begär en ny ögonblicksbild",
    "description": "<p>Skickar utforskarens aktuella ögonblicksbild direkt, vilket är användbart efter återanslutning.</p>"
  },
  "websocket-ping": {
    "title": "Ping för att hålla anslutningen aktiv",
    "description": "<p>Kontrollerar att anslutningen svarar.</p>"
  },
  "websocket-track-transaction": {
    "title": "Följ en transaktion",
    "description": "<p>Följer en 32-bytehash med prefixet 0x. Servern skickar först en kompatibilitetsuppskattning <code>txPosition</code> och därefter <code>{ \"tx\": … }</code> när det normaliserade tillståndet ändras. En ny hash ersätter föregående prenumeration. Positionen för nästa slot är en uppskattning från ett observerat urval, inte en garanti för inkludering.</p>"
  },
  "websocket-track-address": {
    "title": "Följ ett konto",
    "description": "<p>Följer en adress med hjälp av tillgänglig indexerad historik. Nyupptäckta väntande transaktioner kommer som <code>address-transactions</code>; nybekräftade eller ändrade transaktioner kommer som <code>block-transactions</code>. En ny adress ersätter den tidigare prenumerationen. Inga händelser skapas när historikindexering är otillgänglig.</p>"
  },
  "websocket-track-pending": {
    "title": "Följ prognosen för nästa slot",
    "description": "<p>Index <code>0</code> returnerar uppskattningen för det observerade väntande urvalet som <code>projected-block-transactions</code>. Ethereum har ingen deterministisk paketprognos för flera block, så högre index saknar prognostiserade transaktioner. Skicka <code>-1</code> för att avsluta prenumerationen.</p>"
  },
  "websocket-reconnect": {
    "title": "Återanslut säkert",
    "description": "<p>Återanslut med ökande väntetid efter en stängning, skicka <code>{ \"action\": \"init\" }</code> och återskapa sedan prenumerationerna. Felaktiga eller icke stödda prenumerationsmeddelanden ignoreras; validera klientens data och anta inte att tystnad betyder att begäran godkänts.</p>"
  }
};

export function localizeEthereumDocsSwedish(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('sv')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
