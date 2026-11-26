# Family Sync — kandydat produkcyjny

Status: przygotowanie, **bez publikacji**. M01–M18 na TEST: PASS potwierdzone przez Michała; M17/M18 także Safari iPhone ↔ PC. Nowy onboarding wymaga osobnego odbioru. Aktualna produkcja pozostaje na Sprint39.

## Zakres

- Oddzielny Worker `franka-family-sync.wisniajoker90.workers.dev` i NOWA baza D1 `franka-family-sync`, binding `DB`.
- Nowy sekret `FAMILY_SETUP_KEY`, inny od TEST. Przechowywany w menedżerze haseł i Cloudflare; nigdy w repo/czacie/QR.
- `SYNC_ENABLED=false`: można sprawdzić `/health`, ale wszystkie operacje danych są zablokowane. Aktywacja wymaga osobnej decyzji właściciela.
- Dozwolony origin: `https://wisniajoker90.github.io`. CORS działa na poziomie origin, nie ścieżki; właściwa ochrona API opiera się na tokenach i rolach. Frontend aktywny tylko w `/Spanish-skills-for-my-kid/`.
- Nowa przestrzeń lokalna `family-sync-production37` / `hf37prod:*`; brak importu tokenów, punktów i kont TEST.
- Zachowane scalanie, offline, potwierdzenia z godziną, bezpieczne odraczanie zmian podczas lekcji, odzyskiwanie rodzica, archiwum wersji i QR z jednorazowym kodem.
- Usunięty techniczny pilot fikcyjnych punktów i symulacji offline z panelu użytkownika.
- Publikacja profilu jest świadoma; automatyczna synchronizacja włączana po publikacji/pobraniu profilu. Na drugim urządzeniu przycisk „Połącz i pobierz postęp” łączy oba kroki. Kopia JSON dostępna przed inicjalizacją. Import na drugim urządzeniu tworzy osobny profil, nie nadpisuje dotychczasowych.
- Treści lekcji i logika nagród pozostają bez zmian. UX-01 nadal odłożone.

## Powtarzalny build i testy

Z katalogu głównego:

```sh
node family-sync/production/build.mjs
node --test family-sync/production/candidate.test.mjs family-sync/production/candidate/worker.test.mjs family-sync/worker.test.mjs family-sync/learning.test.cjs
npx playwright test --config family-sync/production/playwright.config.cjs
```

Wynik: `family-sync/production/candidate/index.html` (dokładnie taka nazwa), Worker, schemat i zasoby PWA. Build nie zmienia głównego `index.html`, gałęzi `test` ani `main`, niczego nie wdraża. Pipeline buduje paczkę do przeglądu oraz uruchamia Chromium i WebKit, dotychczasowe testy sync i niezmienione 96 testów regresji. WebKit w CI nie zastępuje odbioru na fizycznym iPhonie.

## Konfiguracja Cloudflare — przed publikacją aplikacji

1. Utworzyć NOWĄ D1 `franka-family-sync`. Nie kopiować danych z TEST. Wykonać `candidate/schema.sql` w tej nowej bazie; oczekiwane cztery puste tabele.
2. Wpisać jej ID do `family-sync/production/wrangler.jsonc`. `node family-sync/production/preflight.mjs` odrzuci placeholder i znany ID TEST.
3. Utworzyć Worker `franka-family-sync`, wkleić **cały** `candidate/worker.mjs`, podłączyć D1 jako `DB`. Nie wklejać odpowiedzi JSON /health jako kodu.
4. Dodać nowy sekret `FAMILY_SETUP_KEY` (losowy, minimum 32 znaki) oraz zwykłą zmienną `SYNC_ENABLED` z tekstem `false`.
5. `/health` ma zwrócić `version: family-sync-production-1`, `database: ok`, `tablesReady: true`, `setupConfigured: true`, `backendReady: true`, `syncEnabled: false`. Nie tworzyć jeszcze rodziny ani profilu produkcyjnego.

Konfiguracja Wrangler jest alternatywą dla panelu, nie dodatkowym etapem. Polecenia D1 na zdalnej bazie wymagają `--remote`. Źródła: https://developers.cloudflare.com/d1/get-started/ oraz https://developers.cloudflare.com/workers/wrangler/configuration/ .

## Decyzja publikacyjna i migracja

Przed decyzją: poprawne testy CI, konfiguracja nowej bazy i Workera, odbiór nowego panelu na kopii danych, ustalona wersja pakietu. Następnie osobne „Wdrażaj / Wstrzymaj”.

Po zgodzie:

1. Na produkcyjnym Safari iPhone wykonać **świeży** eksport JSON aktualnego Franka. Nie używać punktów TEST ani liczby 108 jako aktualnego baseline. Zapisać punkty, odznaki, puchary i zaliczenia. Sprawdzić plik w Plikach. Nie usuwać danych Safari.
2. Zapisać SHA poprzedniej produkcji (`edefcef1cfe1a9f6f844d2db26f5d47bef6fb9eb`) i nowego kandydata. Zastąpić główny `index.html` wygenerowanym plikiem; zachować pozostałe zasoby. Sam merge gałęzi przygotowania nie aktywuje nowego panelu: build jest obowiązkowy.
3. Ustawić `SYNC_ENABLED=true` na dedykowanym Workerze i potwierdzić /health. Zrobić to w tym samym kontrolowanym oknie uruchomienia.
4. Na tym samym Safari wybrać właściwy profil Franka. Otworzyć Family Sync, nadać urządzeniu nazwę, skonfigurować rodzinę nowym sekretem. Zapisać kopię, potwierdzić wybór, „Udostępnij wybrany profil — punkt startowy”. To jednorazowa inicjalizacja; istniejącego wspólnego profilu nie można nadpisać drugim punktem startowym.
5. Potwierdzić identyczne punkty/nagrody/zaliczenia i zapis serwerowy. Wygenerować QR, na Androidzie wybrać „Połącz i pobierz postęp”. Osobny QR dla każdego kolejnego urządzenia.
6. Kontrola po publikacji: zgodność baseline; jeden wynik iPhone→Android; jeden Android→iPhone; offline→online; powrót do aplikacji; kopia wersji. Produkcja pozostaje otwarta do obserwacji, nie kasować kopii JSON.

## Wstrzymanie i wycofanie

- Przed startem: pozostawić `SYNC_ENABLED=false`, nie publikować frontendowego kandydata.
- Po aktywacji przy problemie: `SYNC_ENABLED=false` zatrzymuje operacje API; postęp lokalny zostaje, próby zachowane. Wyeksportować każdą lokalną kopię z nowymi wynikami i zachować serwer/bazę. Nie odtwarzać starszego JSON na aktywnym profilu.
- W razie potrzeby przywrócić poprzedni frontend i odświeżyć aplikacje z internetem. Nie usuwać D1, tokenów ani localStorage. Zmiany offline na różnych urządzeniach mogą wymagać późniejszego scalenia; rollback kodu nie jest rollbackiem danych.
- Utracona odpowiedź pierwszej konfiguracji: rodzina może już istnieć; użyć „Odzyskaj dostęp rodzica” z sekretem, następnie dokończyć wybór baseline lub pobrać istniejący profil. Nie kasować rodziny.

## Pozostałe ograniczenia

Jedna karta aplikacji na urządzeniu. Brak obietnicy synchronizacji przy zamkniętej/zawieszonej aplikacji. Trwające zadania są lokalne. Archiwum wersji i lista identyfikatorów zapisów rosną; przy limicie 1 MiB zapis jest bezpiecznie odrzucany, lokalna kopia pozostaje. Kompaktowanie wymaga osobnego projektu z ochroną przed powtórnym naliczeniem starych operacji — nie wolno po prostu przycinać listy. Panel rodzinny korzysta z poświadczeń urządzenia; jego lokalna widoczność nie zastępuje uprawnień API.

## Scenariusze odbioru nowego panelu

P01: pierwszy iPhone, świeża kopia, jawna inicjalizacja, niezmienione nagrody, automat włączony.
P02: QR, jedno potwierdzenie „Połącz i pobierz postęp”, nowy profil, automat włączony; stare profile zachowane.
P03: urządzenie ucznia nie oferuje wyboru nowego baseline ani historii rodzica.
P04: offline, nieprzerwana lekcja, automatyczne wznowienie; brak nowego potwierdzenia serwera offline.
P05: nowy Worker z flagą false nie przyjmuje danych; TEST nie łączy się z produkcyjną bazą.
