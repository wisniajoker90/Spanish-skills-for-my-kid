# Sprint 37 — Family Sync, etap backend TEST

Status bieżący: M01–M14 potwierdzone PASS. Worker v4 działa na TEST. Rzeczywisty profil, scalanie offline i odzyskanie kopii sprawdzone przez właściciela. Przygotowana automatyczna synchronizacja TEST, włączana osobno dla profilu na każdym urządzeniu; bez zmian produkcji. Starsze sekcje poniżej dokumentują kolejne etapy.

## Zasoby potwierdzone przez Michała

- Worker: https://franka-family-sync-test.wisniajoker90.workers.dev
- D1: franka-family-sync-test, binding DB, ID 6ff9f3f3-41ca-466b-84af-da96516013b3.
- Cztery tabele z schema.sql utworzone i potwierdzone SELECT.
- Secret FAMILY_SETUP_KEY zapisany przez właściciela; nie przechowujemy wartości w repo, dokumentacji ani czacie.
- Aktualne produkcyjne postępy Safari na iPhonie będą jedynym punktem startowym przy późniejszej aktywacji. Android phone i tablet startują od nich. Teraz wyłącznie fikcyjne dane.

## Wdrożenie tego etapu

W Cloudflare otworzyć Worker > Edit code, zastąpić cały dotychczasowy kod zawartością worker.mjs, Deploy. Zachować binding DB i sekret. GET /health powinien zwracać version family-sync-test-3, database ok, tablesReady true, setupConfigured true, backendReady true, syncEnabled false. Ostatnie pole celowo oznacza, że prawdziwe wyniki nauki nie są jeszcze podłączone.

## Kontrakt API

Wyłącznie host testowy i origin https://hiszpanski-franka-test.pages.dev. Zapytania bez Origin są dozwolone dla narzędzi, ale podlegają identycznej autoryzacji. CORS nie zastępuje autoryzacji.

- POST /v1/setup: nagłówek X-Family-Setup-Key, JSON deviceName, profileName, snapshot. Jedna rodzina na instancję TEST, ponowienie nie nadpisuje danych. Zwraca token rodzica, deviceId, familyId, profileId i revision. Nie wolno logować nagłówków/odpowiedzi z tokenami.
- POST /v1/join: JSON code, deviceName. Nadaje tylko rolę learner. Parowanie i zużycie kodu w jednej transakcji D1.
- POST /v1/recover-parent: nagłówek X-Family-Setup-Key, JSON deviceName, deviceId (UUID), token (256-bit hex wygenerowany i zapisany lokalnie przed wysłaniem). Zastępuje wcześniejszy dostęp rodzica; atomowo unieważnia stare tokeny rodzica i kody parowania, zachowuje profile i urządzenia ucznia. Ponowienie z tym samym aktywnym ID/tokenem zwraca sukces bez kolejnej rotacji. Stara próba zastąpiona nowszą otrzymuje 409.
- Pozostałe endpointy wymagają Authorization: Bearer <token>.
- GET /v1/me: bieżące urządzenie.
- POST /v1/pairing: rodzic generuje losowy kod 128-bit na 10 minut, unieważnia poprzedni własny kod.
- GET /v1/devices: lista urządzeń dla rodzica, bez skrótów tokenów.
- POST /v1/devices/:id/revoke: rodzic odłącza learner; nie można usunąć własnego rodzica. Nie kasuje wyników.
- GET /v1/profiles: lista metadanych profili rodziny.
- GET /v1/profiles/:id: kopia profilu i revision.
- PUT /v1/profiles/:id: JSON baseRevision, snapshot. Atomowe UPDATE warunkowane wersją. Nieaktualna kopia otrzymuje 409 revision_conflict, nie nadpisuje danych. Po konflikcie klient musi pobrać i scalić zmiany, nigdy wymuszać zastąpienia całej kopii.
- Snapshot ma postać {schema:1,data:{...}}. Maksymalny body 1 MiB; walidacja znaczenia danych aplikacji pozostaje zadaniem integracji klienta.

Tokeny urządzeń losowe 256-bit; w bazie przechowujemy wyłącznie SHA-256. Kody parowania także przechowywane jako skróty. Brak endpointów kasowania profilu/rodziny. Hasło panelu rodzica nie jest tokenem autoryzacyjnym API.

## Weryfikacja i ograniczenia

`node --test family-sync/worker.test.mjs`: 22/22 PASS. Testy używają prawdziwego SQLite przez adapter zgodny z użytym podzbiorem D1; transakcje, odmowa starej rewizji, izolacja rodzin, parowanie, wygaśnięcie, odebranie dostępu, limity i auth. To nie są testy na zdalnym Cloudflare ani dowód pełnej synchronizacji urządzeń.

Następny etap: klient w panelu rodzica na TEST, świadome utworzenie rodziny z fikcyjnym profilem, parowanie, bezpieczny zapis tokenu per urządzenie/profil, dziennik lokalnych operacji offline i scalanie według typu danych (bez sumowania już policzonych odpowiedzi). Odzyskiwanie rodzica po utracie lokalnego zapisu/odpowiedzi setup jest dostępne przez klucz konfiguracji. Nadal wymagane ponawianie po utracie odpowiedzi join, kopia bezpieczeństwa i historia wersji przed rzeczywistymi danymi. Obecny backend odrzuca powtórny setup zamiast automatycznie wydawać nowy token. Nie podłączać jeszcze postępów Franka.

Do późniejszego przeglądu UX: dopasować przyciski Sprintu 39 do istniejącej aplikacji (świadomie zaakceptowane przez użytkownika na obecne wdrożenie).

## Pilot przeglądarkowy

Na stronie głównej TEST dostępny przycisk „TEST · Family Sync — panel rodzica”. Izolowany od frankaStore i profili nauki, używa wyłącznie klucza localStorage family-sync-pilot37. Fikcyjny profil przechowuje unikalne zdarzenia punktowe. Scalanie to suma zbiorów zdarzeń po ID, z kontrolą rewizji i ograniczoną liczbą ponowień konfliktu. Utrata odpowiedzi po udanym zapisie nie dubluje punktu. Symulacja offline zachowuje kolejkę po odświeżeniu. To dowód działania protokołu, nie gotowe scalanie dotychczasowych struktur lekcji i odznak. Wartości FAMILY_SETUP_KEY nie zapisuje się lokalnie. Token urządzenia pozostaje lokalny do przyszłej obsługi odzyskiwania.

Scenariusze pilota: utworzenie rodziny testowej, punkt na pierwszym urządzeniu, parowanie drugiej niezależnej przeglądarki i pobranie punktu; równoległe punkty offline; odzyskanie połączenia; odebranie dostępu. Panel ukryty i nieaktywny na produkcyjnym hoście. Wszystkie testy pilota używają fikcyjnych kluczy; nigdy prawdziwego sekretu właściciela.

## Odzyskiwanie i testy M06–M07

Na odłączonym urządzeniu formularz dołączenia kodem pozostaje dostępny. Wpisanie nazwy i nowego kodu wydanego przez rodzica zastępuje lokalny token, zachowuje kolejkę lokalnych fikcyjnych punktów i scala ją z serwerem. Nie czyścić danych przeglądarki.

M06: po M05 komputer ma 6 punktów. Wydać nowy kod, ponownie połączyć drugie urządzenie, oczekiwać 6 punktów i 0 oczekujących. Dodać punkt z drugiego urządzenia, zsynchronizować komputer: po 7 punktów.

M07 (dopiero po wdrożeniu worker.mjs v2): w nowym, zwykłym profilu przeglądarki otworzyć TEST > Family Sync > Odzyskaj dostęp rodzica, wpisać nazwę i lokalnie FAMILY_SETUP_KEY, potwierdzić zastąpienie poprzedniego dostępu. Oczekiwać 7 punktów, rolę rodzica, brak dostępu na starym rodzicu i zachowany dostęp ucznia. Nie usuwać starego profilu ani danych nauki.

18 testów SQLite sprawdza m.in. atomowe odzyskiwanie, auth, zachowanie dokładnego snapshotu, ponowienie utraconej odpowiedzi i odrzucenie nieaktualnej próby. Testy UI używają atrap API; nie zastępują testu v2 na zdalnym D1. To nadal pilot, a nie zgoda na migrację danych produkcyjnych.

## QR i ponawianie parowania (Worker v3)

M01–M07: PASS potwierdzone przez Michała. Po odzyskaniu dostępu nowa przeglądarka rodzica i urządzenie ucznia mają po 7 punktów. Stary rodzic prawidłowo otrzymuje 401; początkowy FAIL wynikał z odczytania wcześniejszego komunikatu.

Przycisk „Dodaj urządzenie — pokaż QR” generuje lokalnie obraz zawierający adres TEST z kodem we fragmencie #family-join=. Brak zewnętrznego generatora QR. Po wejściu fragment jest usuwany z adresu, formularz otwiera się z kodem. Sam skan nie wykonuje parowania; wymagana nazwa i potwierdzenie użytkownika. Kod zachowuje ważność 10 minut, jednorazowość i możliwość ręcznego wpisania. Obraz znika po zamknięciu panelu lub upływie terminu. Brak FAMILY_SETUP_KEY lub tokenu rodzica w QR.

Klient zapisuje losowy token i identyfikator próby PRZED POST /v1/join. Worker v3 akceptuje opcjonalne deviceId i token; retry z identycznymi aktywnymi poświadczeniami zwraca to samo urządzenie, również po zużyciu/wygaśnięciu kodu. Revoked/obcy token nie może reaktywować urządzenia. Stary klient pozostaje kompatybilny. Nowy klient sprawdza retrySafePairing w /health i prosi o aktualizację Workera, jeśli serwer jej nie obsługuje. Bez zmian schematu D1 lub sekretu.

Wznawianie po błędzie lub odświeżeniu: „Ponów przerwane łączenie”. Zachowuje lokalną kolejkę punktów. Testy weryfikują odkodowanie wygenerowanego obrazu niezależnym dekoderem jsQR oraz utratę odpowiedzi i ponowienie tej samej próby.

Biblioteka QR: qrcode-generator 2.0.4 (Kazuhiko Arase, MIT), wbudowana do pilota/index.html, źródło i licencja w vendor/. jsQR 1.4.0 jest zależnością wyłącznie testową. Żadne CDN ani usługi generowania QR nie otrzymują kodu.

M08 po aktualizacji Workera v3: rodzic generuje QR; zeskanować aparatem trzeciego urządzenia, wpisać nazwę, połączyć. Oczekiwane 7 punktów. Dodać jeden na nowym urządzeniu i zsynchronizować pozostałe: po 8. M09: ten sam QR nie może dodać nowego niezależnego urządzenia po zużyciu (istniejąca autoryzowana próba może być wznowiona).

## Rzeczywisty profil na TEST — Worker v4

24.11.2026: M01–M09 PASS potwierdzone przez właściciela. QR działa, pilot ma 8 fikcyjnych punktów. Właściciel zachował eksport Safari i odtworzył go lokalnie na TEST. Prywatna kopia nie jest częścią repozytorium ani publicznego wdrożenia.

Nowy panel „Postęp nauki — TEST” wymaga osobnego potwierdzenia i świadomego wyboru profilu. Rodzic publikuje punkt startowy tylko raz. Pobranie na drugim urządzeniu tworzy NOWY profil, zachowując wcześniejsze. Pilot pozostaje oddzielny. Backend v4 tworzy tabelę `profile_versions` automatycznie przy pierwszej operacji; nie wymaga ręcznych zmian D1 ani sekretu. Aktualizacja Workera nadal ręczna. Health: learningProfiles/versionHistory true, syncEnabled false (produkcja nadal niepodłączona).

Synchronizacja tego etapu jest RĘCZNA, po ukończeniu ćwiczenia, przy jednej otwartej karcie aplikacji. Nie jest to jeszcze automatyczna synchronizacja produkcyjna. Przeglądarka musi obsługiwać Web Locks. Niedokończone ćwiczenia, misja dzienna i pozycja na ekranie są lokalne; ukończenia, słówka, liczniki, odznaki i historia są współdzielone.

Każda wysyłka zapisuje lokalnie stały identyfikator i kopie przed/po. Serwerowy profil zachowuje identyfikatory zastosowanych operacji. Po utracie odpowiedzi ponowienie nie dodaje ponownie tych samych punktów. Konflikt rewizji pobiera nową wersję i przelicza deltę. Dodatkowe lokalne zmiany podczas sieci otrzymują kolejną operację. Konta rodziny i endpointy autoryzacji są te same co w pilocie.

Scalanie: dodatnie delty liczników, suma zaliczeń i odznak, historie po identyfikatorach (legacy duplikaty zachowane), zachowanie historii mimo lokalnego skracania list. Równoległe odpowiedzi nie pozwalają odtworzyć pełnej chronologii: przy scalaniu mastery przyjmujemy ostrożniejszy streak/level/termin powtórki. Nierozpoznane konflikty zatrzymują zapis i zachowują obie kopie; brak wymuszonego nadpisania. Przyszłe wpisy nagród i sesji powtórek otrzymują UUID. Przy dojściu do istniejącego limitu 1 MiB backend odrzuci zapis; kompaktowanie historii/identyfikatorów to późniejszy etap.

Archiwum poprzedniej wersji i aktualizacja profilu są jedną transakcją D1. Jeśli archiwum nie zapisze się, profil nie jest nadpisany. Rodzic może pobrać wcześniejsze wersje jako standardowy JSON do importu nowego profilu. Lokalny zapis używa dziennika cofania przed zmianami i odzyskuje przerwaną transakcję przy starcie; zachowuje też ostatnią kopię lokalną. W razie braku miejsca operacja zatrzymuje się.

Testy: worker.test.mjs (26), learning.test.cjs (18), dotychczasowy pilot UI (14), learning-sync.spec.js (8) i niezmienione 96 testów regresji. Testy sieci UI używają fikcyjnego backendu; odbiór na prawdziwym Cloudflare po wdrożeniu Workera v4 pozostaje konieczny.

Kolejność odbioru: v4 health → M10 udostępnienie aktywnego „Franek (import)” → M11 pobranie na sparowanym Androidzie → M12 ukończenie ćwiczenia i synchronizacja obu urządzeń → M13 dwie różne aktywności offline i scalenie → M14 pobranie poprzedniej wersji. Dopiero potem decyzja o produkcji; świeży eksport z Safari przed jej uruchomieniem.


## Automatyczna synchronizacja TEST (25.11.2026)

Worker v4 pozostaje bez zmian. Nowy przełącznik „Automatyczna synchronizacja na tym urządzeniu” zapisuje preferencję per lokalny profil, domyślnie wyłączoną na potrzeby kontrolowanego odbioru TEST. Profile niepołączone nigdy nie są automatycznie publikowane. Dotychczasowy przycisk ręcznej synchronizacji pozostaje.

Po włączeniu: sprawdzenie przy starcie/powrocie do aplikacji i po odzyskaniu sieci, wysyłka po lokalnym zapisie (około 2 s), pobieranie zmian co około 15 s przy widocznej stronie. Własna wysyłka bez zmian zdalnych aktualizuje potwierdzenie BEZ przeładowania. Zdalne zmiany czekają na ekran Dziś, brak otwartych okien/ćwiczeń, brak audio i minimum 2 s bez interakcji. Dopiero wtedy stosujemy transakcję lokalną i jedno automatyczne przeładowanie, aby istniejące moduły odczytały nowy stan. Niedokończone ćwiczenia nadal lokalne. Nie jest to rehydratacja wszystkich modułów bez przeładowania.

Statusy: zapis lokalny/oczekiwanie, zsynchronizowano, czeka na internet, zmiany czekają na powrót do Dziś, wymaga uwagi rodzica. Błędy sieci ponawiane z opóźnieniem do 120 s; odebrany dostęp i nierozpoznane konflikty zatrzymują automat, nie usuwając lokalnych danych. Używamy istniejącej blokady Web Locks i operacji idempotentnych. Nadal jedna karta aplikacji na urządzeniu. Zamknięta lub zawieszona aplikacja nie gwarantuje pracy w tle; wznowienie uruchamia sprawdzenie.

Dodane testy przeglądarkowe: własny zapis bez reload, odroczenie pobranego postępu w lekcji, blokada odświeżenia podczas audio, powrót sieci, wznowienie po otwarciu strony oraz odebranie dostępu. Testy synchronizacji UI: 28; backend/merge/storage: 44; regresja aplikacji: 96.

## S37-M17 — FAIL i poprawka statusu połączenia (25.11.2026)

M15 i M16 PASS. M17 FAIL: właściciel widział „Zapisano — postęp zsynchronizowany” również po quizie i około 30 s w trybie samolotowym. To zgłoszenie dotyczy statusu; utrata punktów nie została zgłoszona. Nie traktować M17 jako zaliczonego przed ponownym testem na urządzeniu.

Poprawka: zamiast bezterminowego zapewnienia pokazujemy czas ostatniego potwierdzenia serwera. Każda próba od razu pokazuje sprawdzanie połączenia, a błąd/timeout wskazuje zapis lokalny i oczekiwanie. Timeout 8 s. Odczyty API mają unikalny parametr i cache:no-store. Zmiana połączenia unieważnia odpowiedzi rozpoczętych żądań i przerywa je; odpowiedź sprzed offline nie może przywrócić statusu sukcesu. Zachowane są trwałe identyfikatory prób, więc utracona odpowiedź PUT nie dubluje postępu. Wskazanie navigator.onLine nie zastępuje odpowiedzi serwera. Przyczyna na fizycznym urządzeniu wymaga retestu; tryb samolotowy sam w sobie nie jest dowodem niedostępności Wi-Fi.

Odłożone zgłoszenie UX zapisano w BACKLOG.md (UX-01). Treści lekcji nie zmieniano.
