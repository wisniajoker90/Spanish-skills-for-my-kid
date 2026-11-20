# Sprint 37 — Family Sync, etap backend TEST

Status: kod przygotowany do ręcznego wdrożenia Workera. Nie jest jeszcze podłączony do aplikacji. Sprint 39 jest opublikowany na produkcji; tego kodu nie scalać ani nie włączać na produkcji bez odbioru.

## Zasoby potwierdzone przez Michała

- Worker: https://franka-family-sync-test.wisniajoker90.workers.dev
- D1: franka-family-sync-test, binding DB, ID 6ff9f3f3-41ca-466b-84af-da96516013b3.
- Cztery tabele z schema.sql utworzone i potwierdzone SELECT.
- Secret FAMILY_SETUP_KEY zapisany przez właściciela; nie przechowujemy wartości w repo, dokumentacji ani czacie.
- Aktualne produkcyjne postępy Safari na iPhonie będą jedynym punktem startowym przy późniejszej aktywacji. Android phone i tablet startują od nich. Teraz wyłącznie fikcyjne dane.

## Wdrożenie tego etapu

W Cloudflare otworzyć Worker > Edit code, zastąpić dotychczasowy kod health zawartością worker.mjs, Deploy. Zachować binding DB i sekret. GET /health powinien zwracać version family-sync-test-1, database ok, tablesReady true, setupConfigured true, backendReady true, syncEnabled false. Ostatnie pole celowo oznacza, że klient aplikacji nie jest jeszcze podłączony.

## Kontrakt API

Wyłącznie host testowy i origin https://hiszpanski-franka-test.pages.dev. Zapytania bez Origin są dozwolone dla narzędzi, ale podlegają identycznej autoryzacji. CORS nie zastępuje autoryzacji.

- POST /v1/setup: nagłówek X-Family-Setup-Key, JSON deviceName, profileName, snapshot. Jedna rodzina na instancję TEST, ponowienie nie nadpisuje danych. Zwraca token rodzica, deviceId, familyId, profileId i revision. Nie wolno logować nagłówków/odpowiedzi z tokenami.
- POST /v1/join: JSON code, deviceName. Nadaje tylko rolę learner. Parowanie i zużycie kodu w jednej transakcji D1.
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

`node --test family-sync/worker.test.mjs`: 12/12 PASS. Testy używają prawdziwego SQLite przez adapter zgodny z użytym podzbiorem D1; transakcje, odmowa starej rewizji, izolacja rodzin, parowanie, wygaśnięcie, odebranie dostępu, limity i auth. To nie są testy na zdalnym Cloudflare ani dowód pełnej synchronizacji urządzeń.

Następny etap: klient w panelu rodzica na TEST, świadome utworzenie rodziny z fikcyjnym profilem, parowanie, bezpieczny zapis tokenu per urządzenie/profil, dziennik lokalnych operacji offline i scalanie według typu danych (bez sumowania już policzonych odpowiedzi). Wymagane także odzyskiwanie po utracie tokenu rodzica / utracie odpowiedzi setup, ponawianie po utracie odpowiedzi join, kopia bezpieczeństwa i historia wersji przed rzeczywistymi danymi. Obecny backend odrzuca powtórny setup zamiast automatycznie wydawać nowy token. Nie podłączać jeszcze postępów Franka.

Do późniejszego przeglądu UX: dopasować przyciski Sprintu 39 do istniejącej aplikacji (świadomie zaakceptowane przez użytkownika na obecne wdrożenie).
