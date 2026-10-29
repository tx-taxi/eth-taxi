import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Podstawy Ethereum",
  "Basics": "Podstawy",
  "Gas and fees": "Gaz i opłaty",
  "Fees": "Opłaty",
  "Transaction status": "Status transakcji",
  "Transactions": "Transakcje",
  "Accounts, contracts, and tokens": "Konta, kontrakty i tokeny",
  "Accounts": "Konta",
  "Tokens": "Tokeny",
  "Explorer": "Eksplorator",
  "Support": "Pomoc",
  "Using the API": "Korzystanie z API",
  "Overview": "Przegląd",
  "Network and pending sample": "Sieć i próbka oczekujących transakcji",
  "Network": "Sieć",
  "Blocks": "Bloki",
  "Accounts and tokens": "Konta i tokeny",
  "Connection": "Połączenie",
  "Actions": "Działania",
  "Subscriptions": "Subskrypcje"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Jak działają transakcje Ethereum?",
    "description": "<p>Transakcja Ethereum jest podpisaną instrukcją z konta kontrolowanego zewnętrznie. Może przesyłać ETH, wywoływać inteligentny kontrakt, tworzyć kontrakt lub przenosić dane bez wartości ETH. Nonce nadawcy porządkuje transakcje konta, więc transakcja z późniejszym nonce nie może zostać włączona, dopóki wcześniejsza pozostaje nierozstrzygnięta.</p><p>Eksplorator oddziela przesłane ETH od opłaty. Wywołanie kontraktu może przenosić tokeny lub zmieniać stan nawet wtedy, gdy jego wartość ETH wynosi zero.</p><p class=\"mt-3\">Informacje o protokole: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">transakcje</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gaz i opłaty</a> oraz <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">konta</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "Czym różni się konto od kontraktu?",
    "description": "<p>Adresy identyfikują konta kontrolowane zewnętrznie i konta kontraktów. Klucz prywatny kontroluje konto zewnętrzne i inicjuje transakcje; kontrakt zawiera kod i jest wykonywany po wywołaniu. Status kontraktu, nazwy, etykiety i szczegóły weryfikacji są metadanymi dostawcy i mogą być niedostępne.</p><p>Eksplorator nie może ustalić właściciela adresu.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "Co oznaczają bloki, potwierdzenia i finalność?",
    "description": "<p>Sieć główna Ethereum korzysta z proof of stake. Transakcja zostaje potwierdzona po włączeniu do bloku wykonawczego. Potwierdzenia oznaczają zaobserwowaną głębokość bloku w warstwie wykonawczej, gdy powstają kolejne bloki.</p><p>Liczba potwierdzeń jest użytecznym kontekstem, ale nie dowodem finalności konsensusu. Ten eksplorator nie udostępnia punktów kontrolnych finalności łańcucha beacon ani API finalizacji, więc nie traktuj wybranej liczby potwierdzeń jako finalności protokołu.</p>"
  },
  "what-is-gas": {
    "title": "Czym są gaz, wei i gwei?",
    "description": "<p>Gaz mierzy pracę obliczeniową EVM. Wei to najmniejsza jednostka ETH: 1 ETH to 10<sup>18</sup> wei. Ceny gazu zwykle podaje się w gwei: 1 gwei to 10<sup>9</sup> wei, czyli 0,000000001 ETH.</p><p><code>gasLimit</code> to maksymalny dozwolony gaz; <code>gasUsed</code> to praca zużyta przez włączoną transakcję. Opłata za wykonanie to zużyty gaz pomnożony przez efektywną cenę gazu. Pola opłat blob są wyświetlane osobno, gdy występują.</p>"
  },
  "base-and-priority-fees": {
    "title": "Jak działają opłata bazowa, priorytetowa i maksymalna?",
    "description": "<p>W transakcjach EIP-1559 <code>maxFeePerGas</code> ogranicza dozwoloną cenę, a <code>maxPriorityFeePerGas</code> ogranicza napiwek. Efektywna cena zależy od opłaty bazowej bloku i właściwej opłaty priorytetowej, z uwzględnieniem tych limitów. Część bazowa jest spalana; opłata priorytetowa stanowi zachętę dla walidatora.</p><p>Opłata maksymalna jest limitem, a niekoniecznie zapłaconą kwotą. Starsze transakcje zamiast tego udostępniają pole ceny gazu.</p>"
  },
  "fee-estimates": {
    "title": "Jak korzystać z zaleceń dotyczących ceny gazu?",
    "description": "<p>Wartości wolna, średnia i szybka to obserwacje dostawcy zwracane przez REST API w wei. Nie są ofertą ani obietnicą włączenia. Portfel może dobrać ustawienia do pilności, zależności nonce i najnowszej opłaty bazowej.</p><p>Dla włączonej transakcji użyj efektywnej ceny gazu i zużytego gazu, aby ustalić zapłaconą kwotę. Dla transakcji oczekującej może być znana tylko maksymalna możliwa opłata.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "Dlaczego potwierdzona transakcja może zakończyć się błędem?",
    "description": "<p>Włączenie i wykonanie to odrębne fakty. Transakcja może zostać potwierdzona w bloku, a mimo to zostać wycofana lub zgłosić błąd z powodu nieudanego wykonania EVM; nadal może zużyć gaz. Pomyślny wynik oznacza zakończenie zapisanego wykonania, a niekoniecznie oczekiwany przez użytkownika rezultat interakcji z kontraktem.</p><p>Odczytuj łącznie <code>status.confirmed</code>, Ethereum <code>status</code>/<code>result</code>, flagę błędu i dostępny powód wycofania.</p>"
  },
  "why-pending": {
    "title": "Dlaczego transakcja oczekuje lub jest niewidoczna?",
    "description": "<p>Oczekująca transakcja może mieć zbyt niską opłatę, być zablokowana przez niższy nonce nadawcy, nie być jeszcze widoczna dla dostawcy, zostać zastąpiona transakcją o tym samym nonce lub odrzucona przez portfel albo węzeł, który ją wysłał. Sam widok oczekujących nie pozwala ustalić przyczyny.</p><p>Ethereum nie ma jednego globalnego mempoola. Dostawcy mogą widzieć różne transakcje i ich kolejność. Przed zastąpieniem lub anulowaniem transakcji sprawdź portfel lub usługę, która ją wysłała.</p>"
  },
  "pending-sample": {
    "title": "Co przedstawia widok oczekującej aktywności?",
    "description": "<p>Widok oczekujących przedstawia ograniczoną próbkę od połączonego dostawcy. Szacuje następny slot walidatora na podstawie zaobserwowanych transakcji i danych o gazie. Nie jest kompletnym mempoolem sieci, księgą aukcyjną ani deterministyczną prognozą wielu bloków.</p><p>Brak transakcji w próbce nie oznacza, że jest nieprawidłowa; jej widoczność nie gwarantuje włączenia do następnego bloku.</p>"
  },
  "transaction-fields": {
    "title": "Które pola transakcji są specyficzne dla Ethereum?",
    "description": "<p>Metadane Ethereum obejmują tożsamość nadawcy i odbiorcy, nonce, typ, dane wejściowe, szczegóły zdekodowanej metody, gdy są dostępne, pola gazu, zestawienie opłat, liczbę potwierdzeń, wynik wykonania, informacje o utworzonym kontrakcie i transfery tokenów. Kwoty wymagające precyzji są ciągami dziesiętnymi: używaj liczb całkowitych o dowolnej precyzji.</p><p>Dekodowanie danych wejściowych, etykiety, listy transferów i powody wycofania zależą od danych dostawcy. Ich brak nie dowodzi braku interakcji z kontraktem ani dzienników.</p>"
  },
  "address-page": {
    "title": "Co pokazuje strona adresu?",
    "description": "<p>Podsumowanie konta pokazuje bieżące saldo ETH, tożsamość konta lub kontraktu, wybrane salda tokenów i liczniki, gdy dane indeksowane są dostępne. Pola specyficzne dla Ethereum znajdują się we właściwości <code>ethereum</code>. Salda odzwierciedlają najnowszy stan dostawcy i mogą nie obejmować skutków oczekującej transakcji.</p>"
  },
  "history-availability": {
    "title": "Dlaczego historia konta lub tokena jest niepełna?",
    "description": "<p>JSON-RPC może udostępniać stan, taki jak salda i kod kontraktu, ale pełna historia adresu i tokena wymaga indeksatora. Podczas korzystania ze źródła zapasowego eksplorator pokazuje szczegóły konta z RPC i oznacza historię jako <code>historyUnavailable</code>.</p><p>Zapasowe źródło transferów tokenów jest oznaczone <code>recentOnly</code>. To ograniczone skanowanie ostatnich standardowych dzienników transferów i nie należy używać go jako pełnego rozliczenia historycznego.</p>"
  },
  "tokens-and-contracts": {
    "title": "Jak powstają szczegóły tokenów i kontraktów?",
    "description": "<p>Strona tokena jest identyfikowana adresem kontraktu. Indeksowane metadane mogą zawierać nazwę, symbol, liczbę miejsc dziesiętnych, podaż, posiadaczy i transfery. Gdy są niedostępne, adapter może wywołać standardowe metody ERC-20 dla podstawowych pól. Zwrócona nazwa lub symbol są niezaufanymi metadanymi, a nie potwierdzeniem wiarygodności.</p><p>Ten eksplorator nie udostępnia ogólnych śladów wykonania, historii transakcji wewnętrznych, API uprawnień ani API portfela lub rozliczeń.</p>"
  },
  "searching": {
    "title": "Czego można szukać?",
    "description": "<p>Wyszukiwarka obsługuje hashe transakcji, adresy z prefiksem 0x i 40 znakami szesnastkowymi, dziesiętne numery bloków i hashe bloków. Adres kontraktu tokena może otworzyć widok tokena, jeśli metadane są dostępne. Dokładne hashe i adresy dają najbardziej wiarygodne wyniki.</p>"
  },
  "support-disclaimer": {
    "title": "Czy eksplorator może odzyskać środki lub cofnąć transakcję?",
    "description": "<p>Nie. eth.tx.taxi wyświetla publiczne dane Ethereum. Nie może uzyskać dostępu do portfeli, cofnąć transakcji, odzyskać klucza prywatnego ani środków. Aby uzyskać pomoc dotyczącą konta, skontaktuj się z portfelem, giełdą, mostem lub aplikacją, która wysłała transakcję.</p>"
  },
  "rest-overview": {
    "title": "Konwencje i ograniczenia",
    "description": "<p>Opisane trasy to publiczne punkty końcowe <code>GET</code>, które zwracają JSON, o ile nie wskazano inaczej. Parametry hashy i adresów są wartościami szesnastkowymi z prefiksem 0x. Kwoty i wielkości wymagające precyzji są ciągami dziesiętnymi; nie przekształcaj ich za pomocą JavaScript <code>Number</code>.</p><p>To API służy do odczytu. Nie rozgłasza transakcji, nie szacuje gazu dla dowolnych danych wywołania, nie udostępnia śladów wykonania ani surowych bajtów transakcji i nie gwarantuje pełnej historii konta, gdy działa zapasowe źródło indeksowania.</p>"
  },
  "get-init-data": {
    "title": "Stan eksploratora",
    "description": "<p>Zwraca ostatnie bloki, ograniczoną próbkę oczekujących transakcji, zalecenia dotyczące gazu, statystyki próbki oraz bieżący stan eksploratora. To dane panelu; nazwy pól zgodności używają semantyki gazu Ethereum.</p>"
  },
  "get-network-info": {
    "title": "Stan sieci",
    "description": "<p>Zwraca zaobserwowaną wysokość warstwy wykonawczej, stan synchronizacji, nazwę sieci oraz docelowy odstęp między blokami w milisekundach. Nie podaje finalności łańcucha beacon.</p>"
  },
  "get-gas-estimates": {
    "title": "Zalecane ceny gazu",
    "description": "<p>Zwraca szybkie, średnie i wolne szacunki zgodności jako całkowite wartości wei. Podziel przez 1 000 000 000, aby uzyskać gwei. Wartości są bieżącymi obserwacjami, a nie gwarancją włączenia transakcji.</p>"
  },
  "get-pending-summary": {
    "title": "Podsumowanie próbki oczekujących transakcji",
    "description": "<p>Zwraca statystyki zaobserwowanej próbki oczekujących transakcji, w tym liczbę, gaz w próbce i sumę opłat. Mimo nazwy trasy zgodności nie jest to kompletny mempool Ethereum ani pełny zrzut txpool węzła.</p>"
  },
  "get-recent-blocks": {
    "title": "Ostatnie bloki",
    "description": "<p>Zwraca bieżący zakres ostatnich bloków ujednolicony na potrzeby eksploratora.</p>"
  },
  "get-blocks-at-height": {
    "title": "Bloki do określonej wysokości",
    "description": "<p>Zwraca dostępny zakres ostatnich bloków kończący się na dziesiętnej wysokości bloku wykonawczego <code>:height</code>.</p>"
  },
  "get-block-height": {
    "title": "Hash bloku na danej wysokości",
    "description": "<p>Zwraca jako zwykły tekst hash bloku z prefiksem 0x dla dziesiętnej wysokości bloku.</p>"
  },
  "get-block": {
    "title": "Blok według hasha",
    "description": "<p>Zwraca ujednolicone szczegóły dla hasha bloku Ethereum. Są to dane warstwy wykonawczej; informacje o walidatorze i finalności konsensusu nie należą do tego API.</p>"
  },
  "get-block-transactions": {
    "title": "Transakcje bloku",
    "description": "<p>Zwraca do 25 ujednoliconych transakcji z bloku, od indeksu <code>:start</code> liczonego od zera. Używa danych indeksowanych, gdy są dostępne, w przeciwnym razie transakcji bloku z RPC.</p>"
  },
  "get-transaction": {
    "title": "Transakcja według hasha",
    "description": "<p>Zwraca ujednoliconą transakcję eksploratora z polem <code>status.confirmed</code> i obiektem metadanych <code>ethereum</code>.</p>"
  },
  "get-transaction-status": {
    "title": "Status włączenia transakcji",
    "description": "<p>Zwraca status włączenia oraz, po potwierdzeniu, wysokość, hash i czas bloku wykonawczego, jeśli są dostępne. Nie określa, czy wykonanie kontraktu się powiodło; w tym celu użyj metadanych transakcji.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Metadane transakcji Ethereum",
    "description": "<p>Zwraca status i wynik wykonania, potwierdzenia, nadawcę i odbiorcę lub utworzony kontrakt, wartość w wei, pola gazu i opłat, nonce, dane wejściowe i zdekodowaną metodę, jeśli są dostępne, transfery tokenów oraz dostarczone metadane błędu lub wycofania. To nie jest punkt końcowy śladów wykonania.</p>"
  },
  "get-address": {
    "title": "Podsumowanie konta",
    "description": "<p>Zwraca ujednolicone podsumowanie adresu. Saldo Ethereum, tożsamość, liczniki, salda tokenów i dostępność historii znajdują się pod <code>ethereum</code>. Źródło zapasowe może ustawić <code>ethereum.historyUnavailable</code>.</p>"
  },
  "get-address-transactions": {
    "title": "Transakcje konta",
    "description": "<p>Zwraca indeksowane transakcje adresu. Dodaj <code>?after_txid=0x…</code>, aby kontynuować po zwróconej transakcji. Zapasowe źródło RPC zwraca pustą listę, nie twierdząc, że historia w łańcuchu jest pusta.</p>"
  },
  "get-address-metadata": {
    "title": "Metadane konta Ethereum",
    "description": "<p>Zwraca tożsamość konta lub kontraktu, bieżące saldo ETH w wei, dostępne metadane utworzenia, liczniki, wybrane salda tokenów i <code>historyUnavailable</code>.</p>"
  },
  "get-token": {
    "title": "Metadane tokena",
    "description": "<p>Zwraca metadane kontraktu tokena. Preferowane są metadane indeksowane; podstawowe pola ERC-20 mogą pochodzić z bezpośrednich wywołań kontraktu. Brakujące pola traktuj jako niedostępne, a nazwy i symbole jako niezaufane.</p>"
  },
  "get-token-transfers": {
    "title": "Transfery tokena",
    "description": "<p>Zwraca transfery i metadane stronicowania. Zapytania indeksowane akceptują liczbowe <code>block_number</code>, <code>index</code> i <code>items_count</code>. Źródło zapasowe ustawia <code>historyUnavailable: true</code> i <code>recentOnly: true</code>: jest to ograniczone skanowanie ostatnich standardowych dzienników transferów, a nie pełna historia.</p>"
  },
  "websocket-connect": {
    "title": "Połączenie i odbieranie aktualizacji",
    "description": "<p>Połącz się z <code>/api/v1/ws</code>. Serwer wysyła początkowy stan eksploratora, a następnie aktualizacje przy zmianie zaobserwowanego końca łańcucha lub próbki oczekujących transakcji, z okresowym sygnałem podtrzymania. Pola odpowiadają <code>/api/v1/init-data</code>.</p><p>To widok adaptera oparty na danych dostawcy, a nie surowa subskrypcja klienta wykonawczego ani globalny strumień mempoola.</p>"
  },
  "websocket-init": {
    "title": "Zażądaj aktualnego stanu",
    "description": "<p>Natychmiast wysyła bieżący stan eksploratora, co jest przydatne po ponownym połączeniu.</p>"
  },
  "websocket-ping": {
    "title": "Sygnał podtrzymania",
    "description": "<p>Sprawdza, czy połączenie odpowiada.</p>"
  },
  "websocket-track-transaction": {
    "title": "Śledź jedną transakcję",
    "description": "<p>Śledzi jeden 32-bajtowy hash z prefiksem 0x. Serwer najpierw wysyła szacunek zgodności <code>txPosition</code>, a następnie <code>{ \"tx\": … }</code>, gdy zmieni się ujednolicony stan. Nowy hash zastępuje poprzednią subskrypcję. Pozycja w następnym slocie jest szacunkiem opartym na zaobserwowanej próbce, a nie gwarancją włączenia.</p>"
  },
  "websocket-track-address": {
    "title": "Śledź jedno konto",
    "description": "<p>Śledzi jeden adres przy użyciu dostępnej historii indeksowanej. Nowo zaobserwowane oczekujące transakcje przychodzą jako <code>address-transactions</code>; nowo potwierdzone lub zmienione jako <code>block-transactions</code>. Nowy adres zastępuje poprzednią subskrypcję. Gdy indeksowanie historii jest niedostępne, zdarzenia nie są tworzone sztucznie.</p>"
  },
  "websocket-track-pending": {
    "title": "Śledź szacunek oczekujących dla następnego slotu",
    "description": "<p>Indeks <code>0</code> zwraca szacunek zaobserwowanej próbki oczekujących jako <code>projected-block-transactions</code>. Ethereum nie ma deterministycznej projekcji pakietów na wiele bloków, więc wyższe indeksy nie zawierają przewidywanych transakcji. Wyślij <code>-1</code>, aby anulować subskrypcję.</p>"
  },
  "websocket-reconnect": {
    "title": "Bezpieczne ponowne połączenie",
    "description": "<p>Po zamknięciu połącz się ponownie ze stopniowo wydłużanym opóźnieniem, wyślij <code>{ \"action\": \"init\" }</code>, a następnie odtwórz subskrypcje. Nieprawidłowe lub nieobsługiwane wiadomości subskrypcji są ignorowane; waliduj dane klienta i nie uznawaj braku odpowiedzi za potwierdzenie.</p>"
  }
};

export function localizeEthereumDocsPolish(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('pl')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
