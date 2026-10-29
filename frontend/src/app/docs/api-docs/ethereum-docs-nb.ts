import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Grunnleggende Ethereum",
  "Basics": "Grunnleggende",
  "Gas and fees": "Gass og gebyrer",
  "Fees": "Gebyrer",
  "Transaction status": "Transaksjonsstatus",
  "Transactions": "Transaksjoner",
  "Accounts, contracts, and tokens": "Kontoer, kontrakter og tokener",
  "Accounts": "Kontoer",
  "Tokens": "Tokener",
  "Explorer": "Utforskeren",
  "Support": "Hjelp",
  "Using the API": "Bruk av API-et",
  "Overview": "Oversikt",
  "Network and pending sample": "Nettverk og ventende utvalg",
  "Network": "Nettverk",
  "Blocks": "Blokker",
  "Accounts and tokens": "Kontoer og tokener",
  "Connection": "Tilkobling",
  "Actions": "Handlinger",
  "Subscriptions": "Abonnementer"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Hvordan fungerer Ethereum-transaksjoner?",
    "description": "<p>En Ethereum-transaksjon er en signert instruksjon fra en eksternt eid konto. Den kan overføre ETH, kalle eller opprette en smartkontrakt, eller inneholde data uten ETH-verdi. Avsenderens nonce bestemmer rekkefølgen på kontoens transaksjoner, slik at en senere nonce ikke kan inkluderes mens en tidligere er uavklart.</p><p>Utforskeren skiller overført ETH fra gebyret. Et kontraktskall kan flytte tokener eller endre tilstand selv når ETH-verdien er null.</p><p class=\"mt-3\">Om protokollen: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">transaksjoner</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gass og gebyrer</a> og <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">kontoer</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "Hva er forskjellen på en konto og en kontrakt?",
    "description": "<p>Adresser identifiserer eksternt eide kontoer og kontraktskontoer. En privat nøkkel styrer en eksternt eid konto og starter transaksjoner; en kontrakt inneholder kode og kjøres når den kalles. Kontraktsstatus, navn, etiketter og verifiseringsdetaljer er metadata fra leverandøren og kan være utilgjengelige.</p><p>En utforsker kan ikke fastslå hvem som eier en adresse.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "Hva betyr blokker, bekreftelser og finalitet?",
    "description": "<p>Ethereums hovednett bruker proof of stake. En transaksjon er bekreftet når den er inkludert i en utførelsesblokk. Bekreftelsene er den observerte blokkdybden i utførelseslaget etter hvert som senere blokker bygger videre på blokken.</p><p>Bekreftelsesdybde gir nyttig kontekst, men er ikke et bevis på konsensusfinalitet. Denne utforskeren viser ikke beacon-kjedens finalitetskontrollpunkter eller et API for finalisering, så ikke betrakt et valgt antall bekreftelser som protokollens finalitet.</p>"
  },
  "what-is-gas": {
    "title": "Hva er gass, wei og gwei?",
    "description": "<p>Gass måler beregningsarbeid i EVM. Wei er den minste ETH-enheten: 1 ETH er 10<sup>18</sup> wei. Gasspriser oppgis ofte i gwei: 1 gwei er 10<sup>9</sup> wei, eller 0,000000001 ETH.</p><p><code>gasLimit</code> er den maksimalt tillatte gassmengden; <code>gasUsed</code> er arbeidet en inkludert transaksjon brukte. Utførelsesgebyret er brukt gass ganget med den effektive gassprisen. Felt for blobgebyrer vises separat når de finnes.</p>"
  },
  "base-and-priority-fees": {
    "title": "Hvordan fungerer basisgebyr, prioritetsgebyr og maksgebyr?",
    "description": "<p>For EIP-1559-transaksjoner begrenser <code>maxFeePerGas</code> den tillatte prisen, og <code>maxPriorityFeePerGas</code> begrenser tipset. Den effektive prisen bestemmes av blokkens basisgebyr pluss aktuelt prioritetsgebyr, innenfor disse grensene. Basisgebyrdelen brennes; prioritetsgebyret er insentivet til validatoren.</p><p>Maksgebyret er et tak, ikke nødvendigvis beløpet som ble betalt. Eldre transaksjoner har i stedet et gassprisfelt.</p>"
  },
  "fee-estimates": {
    "title": "Hvordan bør jeg bruke anbefalinger for gasspris?",
    "description": "<p>Verdiene langsom, gjennomsnittlig og rask er observasjoner fra leverandøren og returneres i wei av REST-API-et. De er verken et pristilbud eller et løfte om inkludering. En lommebok kan velge innstillinger etter hvor mye det haster, nonce-avhengigheter og siste basisgebyr.</p><p>For en inkludert transaksjon viser effektiv gasspris og brukt gass hva som ble betalt. For en ventende transaksjon kan bare maksimal mulig gebyrbelastning være kjent.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "Hvorfor kan en bekreftet transaksjon ha mislyktes?",
    "description": "<p>Inkludering og utførelse er separate forhold. En transaksjon kan være bekreftet i en blokk, men likevel bli rullet tilbake eller rapportere en feil fordi EVM-utførelsen mislyktes; den kan fortsatt bruke gass. Et vellykket resultat betyr at den registrerte utførelsen ble fullført, ikke at kontraktsinteraksjonen ga resultatet brukeren forventet.</p><p>Les <code>status.confirmed</code>, Ethereums <code>status</code>/<code>result</code>, feilflagget og eventuell årsak til tilbakeføring samlet.</p>"
  },
  "why-pending": {
    "title": "Hvorfor venter en transaksjon, eller hvorfor mangler den?",
    "description": "<p>En ventende transaksjon kan ha for lavt gebyr, være blokkert av en lavere nonce fra avsenderen, ennå ikke være synlig for leverandøren, være erstattet med samme nonce eller være fjernet fra lommeboken eller noden som sendte den. Visningen av ventende transaksjoner kan ikke alene avgjøre hva som skjedde.</p><p>Ethereum har ikke én global mempool. Leverandører kan se ulike transaksjoner og rekkefølger. Sjekk lommeboken eller tjenesten som sendte transaksjonen før du erstatter eller avbryter den.</p>"
  },
  "pending-sample": {
    "title": "Hva viser visningen av ventende aktivitet?",
    "description": "<p>Visningen av ventende transaksjoner er et begrenset utvalg fra den tilkoblede leverandøren. Den anslår neste validatorslot ut fra observerte transaksjoner og gassdata. Den er ikke en komplett mempool for nettverket, en auksjonsbok eller en deterministisk prognose for flere blokker.</p><p>At en transaksjon mangler i utvalget, betyr ikke at den er ugyldig; synlighet garanterer ikke inkludering i neste blokk.</p>"
  },
  "transaction-fields": {
    "title": "Hvilke transaksjonsfelt er spesifikke for Ethereum?",
    "description": "<p>Ethereum-metadata inkluderer avsenders og mottakers identitet, nonce, type, inndata, dekodet metode når tilgjengelig, gassfelt, gebyrfordeling, bekreftelsesdybde, utførelsesresultat, informasjon om opprettede kontrakter og tokenoverføringer. Beløp som krever presisjon, er desimalstrenger: bruk heltall med vilkårlig presisjon.</p><p>Dekoding av inndata, etiketter, overføringslister og årsaker til tilbakeføring avhenger av oppstrømsdata. At de mangler, beviser ikke at transaksjonen ikke hadde kontraktsinteraksjon eller logger.</p>"
  },
  "address-page": {
    "title": "Hva viser en adresseside?",
    "description": "<p>En kontooversikt viser gjeldende ETH-saldo, konto- eller kontraktsidentitet, utvalgte tokensaldoer og tellere når indekserte data er tilgjengelige. Ethereum-spesifikke felt ligger under egenskapen <code>ethereum</code>. Saldoer gjenspeiler leverandørens siste tilstand og inkluderer kanskje ikke virkningen av en ventende transaksjon.</p>"
  },
  "history-availability": {
    "title": "Hvorfor er konto- eller tokenhistorikken ufullstendig?",
    "description": "<p>JSON-RPC kan gi tilstand som saldoer og kontraktskode, men fullstendig adresse- og tokenhistorikk krever en indekserer. Ved bruk av reservekilden viser utforskeren kontodetaljer fra RPC og markerer historikken med <code>historyUnavailable</code>.</p><p>En reservekilde for tokenoverføringer er merket <code>recentOnly</code>. Det er et begrenset søk i nylige standardlogger for overføringer og må ikke brukes som fullstendig historisk regnskap.</p>"
  },
  "tokens-and-contracts": {
    "title": "Hvordan hentes token- og kontraktsdetaljer?",
    "description": "<p>En tokenside identifiseres av kontraktsadressen. Indekserte metadata kan inneholde navn, symbol, desimaler, tokenmengde, innehavere og overføringer. Når de ikke er tilgjengelige, kan adapteren kalle standard ERC-20-metoder for grunnleggende felt. Et returnert navn eller symbol er metadata man ikke kan stole på, ikke en legitimitetskontroll.</p><p>Denne utforskeren tilbyr ikke generelle utførelsesspor, historikk over interne transaksjoner, API-er for tillatelser eller API-er for portefølje og regnskap.</p>"
  },
  "searching": {
    "title": "Hva kan jeg søke etter?",
    "description": "<p>Søket støtter transaksjonshasher, adresser med prefikset 0x og 40 heksadesimale tegn, desimale blokknumre og blokkhasher. En tokenkontraktsadresse kan åpne en tokenvisning når metadata er tilgjengelige. Eksakte hasher og adresser gir det mest pålitelige resultatet.</p>"
  },
  "support-disclaimer": {
    "title": "Kan utforskeren gjenopprette midler eller reversere en transaksjon?",
    "description": "<p>Nei. eth.tx.taxi viser offentlige Ethereum-data. Den kan ikke få tilgang til lommebøker, angre en transaksjon, hente en privat nøkkel eller gjenopprette midler. Kontakt lommeboken, børsen, broen eller appen som sendte transaksjonen, for kontospesifikk hjelp.</p>"
  },
  "rest-overview": {
    "title": "Konvensjoner og begrensninger",
    "description": "<p>De dokumenterte rutene er offentlige <code>GET</code>-endepunkter og returnerer JSON med mindre annet er oppgitt. Hash- og adresseparametere er heksadesimale verdier med prefikset 0x. Beløp og størrelser som krever presisjon, er desimalstrenger; ikke tolk dem med JavaScript <code>Number</code>.</p><p>Dette er et lese-API. Det kringkaster ikke transaksjoner, anslår ikke gass for vilkårlige kalledata, tilbyr ikke utførelsesspor eller rå transaksjonsbyte og lover ikke fullstendig kontohistorikk mens indeksererens reservekilde brukes.</p>"
  },
  "get-init-data": {
    "title": "Øyeblikksbilde av utforskeren",
    "description": "<p>Returnerer nylige blokker, et begrenset utvalg ventende transaksjoner, gassanbefalinger, utvalgsstatistikk og utforskerens gjeldende tilstand. Dette er dataene for oversikten; feltnavn for kompatibilitet bruker Ethereums gass-semantikk.</p>"
  },
  "get-network-info": {
    "title": "Nettverksstatus",
    "description": "<p>Returnerer observert høyde i utførelseslaget, synkroniseringstilstand, nettverksnavn og målintervall mellom blokker i millisekunder. Det rapporterer ikke beacon-kjedens finalitet.</p>"
  },
  "get-gas-estimates": {
    "title": "Anbefalte gasspriser",
    "description": "<p>Returnerer raske, gjennomsnittlige og langsomme kompatibilitetsestimater som heltall i wei. Del på 1 000 000 000 for gwei. Verdiene er gjeldende observasjoner, ikke garanterte priser for inkludering.</p>"
  },
  "get-pending-summary": {
    "title": "Sammendrag av ventende utvalg",
    "description": "<p>Returnerer statistikk for det observerte utvalget ventende transaksjoner, inkludert antall, gass i utvalget og samlede gebyrer. Til tross for navnet på kompatibilitetsruten er dette ikke en komplett Ethereum-mempool eller en dump av nodens txpool.</p>"
  },
  "get-recent-blocks": {
    "title": "Nylige blokker",
    "description": "<p>Returnerer det gjeldende intervallet av nylige blokker, normalisert for utforskeren.</p>"
  },
  "get-blocks-at-height": {
    "title": "Blokker frem til en høyde",
    "description": "<p>Returnerer det tilgjengelige intervallet av nylige blokker som slutter ved den desimale utførelsesblokkhøyden <code>:height</code>.</p>"
  },
  "get-block-height": {
    "title": "Blokkhash ved en høyde",
    "description": "<p>Returnerer blokkhashen med prefikset 0x som ren tekst for en desimal blokkhøyde.</p>"
  },
  "get-block": {
    "title": "Blokk etter hash",
    "description": "<p>Returnerer normaliserte detaljer for en Ethereum-blokkhash. Dette er data fra utførelseslaget; validator- og konsensusfinalitetsdetaljer ligger utenfor dette API-et.</p>"
  },
  "get-block-transactions": {
    "title": "Blokktransaksjoner",
    "description": "<p>Returnerer opptil 25 normaliserte transaksjoner fra en blokk, ved nullbasert posisjon <code>:start</code>. Indekserte data brukes når de er tilgjengelige, ellers blokktransaksjoner fra RPC.</p>"
  },
  "get-transaction": {
    "title": "Transaksjon etter hash",
    "description": "<p>Returnerer utforskerens normaliserte transaksjon med <code>status.confirmed</code> og et metadataobjekt <code>ethereum</code>.</p>"
  },
  "get-transaction-status": {
    "title": "Transaksjonens inkluderingsstatus",
    "description": "<p>Returnerer inkluderingsstatus og, når transaksjonen er bekreftet, utførelsesblokkens høyde, hash og tid der de er tilgjengelige. Det sier ikke om kontraktsutførelsen lyktes; bruk transaksjonsmetadata for å skille dette.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Metadata for Ethereum-transaksjon",
    "description": "<p>Returnerer utførelsesstatus og resultat, bekreftelser, avsender/mottaker eller opprettet kontrakt, verdi i wei, gass- og gebyrfelt, nonce, inndata og dekodet metode når tilgjengelig, tokenoverføringer og eventuelle feil- eller tilbakeføringsmetadata. Dette er ikke et endepunkt for utførelsesspor.</p>"
  },
  "get-address": {
    "title": "Kontooversikt",
    "description": "<p>Returnerer en normalisert adresseoversikt. Ethereum-saldo, identitet, tellere, tokensaldoer og historikkfunksjon finnes under <code>ethereum</code>. Reservekilden kan sette <code>ethereum.historyUnavailable</code>.</p>"
  },
  "get-address-transactions": {
    "title": "Kontotransaksjoner",
    "description": "<p>Returnerer indekserte transaksjoner for en adresse. Legg til <code>?after_txid=0x…</code> for å fortsette etter en returnert transaksjon. RPC-reservekilden returnerer en tom liste uten å hevde at historikken på kjeden er tom.</p>"
  },
  "get-address-metadata": {
    "title": "Metadata for Ethereum-konto",
    "description": "<p>Returnerer konto- eller kontraktsidentitet, gjeldende ETH-saldo i wei, tilgjengelige opprettelsesmetadata, tellere, utvalgte tokensaldoer og <code>historyUnavailable</code>.</p>"
  },
  "get-token": {
    "title": "Tokenmetadata",
    "description": "<p>Returnerer metadata for en tokenkontrakt. Indekserte metadata foretrekkes; grunnleggende ERC-20-felt kan hentes via direkte kontraktskall som reserve. Behandle manglende felt som utilgjengelige og navn eller symboler som upålitelige.</p>"
  },
  "get-token-transfers": {
    "title": "Tokenoverføringer",
    "description": "<p>Returnerer overføringer og metadata for sideinndeling. Indekserte forespørsler godtar numeriske <code>block_number</code>, <code>index</code> og <code>items_count</code>. En reservekilde setter <code>historyUnavailable: true</code> og <code>recentOnly: true</code>: det er et begrenset søk i nylige standardlogger for overføringer, ikke fullstendig historikk.</p>"
  },
  "websocket-connect": {
    "title": "Koble til og motta oppdateringer",
    "description": "<p>Koble til <code>/api/v1/ws</code>. Serveren sender et første øyeblikksbilde av utforskeren og deretter nye bilder når den observerte kjedetoppen eller utvalget ventende transaksjoner endres, med periodiske livstegn. Feltene følger <code>/api/v1/init-data</code>.</p><p>Dette er adapterens leverandørbaserte visning, ikke et rått abonnement på en utførelsesklient eller en global mempoolstrøm.</p>"
  },
  "websocket-init": {
    "title": "Be om et nytt øyeblikksbilde",
    "description": "<p>Sender utforskerens gjeldende øyeblikksbilde umiddelbart, nyttig etter ny tilkobling.</p>"
  },
  "websocket-ping": {
    "title": "Ping for å holde tilkoblingen aktiv",
    "description": "<p>Kontrollerer at tilkoblingen svarer.</p>"
  },
  "websocket-track-transaction": {
    "title": "Følg én transaksjon",
    "description": "<p>Følger én 32-byte-hash med prefikset 0x. Serveren sender først et kompatibilitetsestimat <code>txPosition</code> og deretter <code>{ \"tx\": … }</code> når den normaliserte tilstanden endres. En ny hash erstatter forrige abonnement. Posisjon for neste slot er et estimat fra et observert utvalg, ikke en garanti for inkludering.</p>"
  },
  "websocket-track-address": {
    "title": "Følg én konto",
    "description": "<p>Følger én adresse ved hjelp av tilgjengelig indeksert historikk. Nylig observerte ventende transaksjoner kommer som <code>address-transactions</code>; nybekreftede eller endrede transaksjoner kommer som <code>block-transactions</code>. En ny adresse erstatter forrige abonnement. Ingen hendelser konstrueres når historikkindeksering er utilgjengelig.</p>"
  },
  "websocket-track-pending": {
    "title": "Følg estimatet for neste slot",
    "description": "<p>Indeks <code>0</code> returnerer estimatet for det observerte ventende utvalget som <code>projected-block-transactions</code>. Ethereum har ingen deterministisk pakkeprognose for flere blokker, så høyere indekser har ingen anslåtte transaksjoner. Send <code>-1</code> for å avslutte abonnementet.</p>"
  },
  "websocket-reconnect": {
    "title": "Koble til igjen på en trygg måte",
    "description": "<p>Koble til igjen med økende ventetid etter en lukking, send <code>{ \"action\": \"init\" }</code>, og opprett deretter abonnementene på nytt. Feilformede eller ikke-støttede abonnementsmeldinger ignoreres; valider klientens data og ikke anta at stillhet betyr at forespørselen er godkjent.</p>"
  }
};

export function localizeEthereumDocsNorwegian(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('nb')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
