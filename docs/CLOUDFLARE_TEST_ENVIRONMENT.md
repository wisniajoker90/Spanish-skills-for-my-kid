# Hiszpański Franka — osobne środowisko TEST (Cloudflare Pages)

## Cele i zasady

- **PROD:** GitHub Pages z gałęzi `main`, publikacja tylko po przejściu Release Gate GitHub Actions. Nie zmieniamy tej konfiguracji.
- **TEST:** Cloudflare Pages pod osobną domeną `.pages.dev`. Nie importujemy tu kopii z realnymi postępami Franka. Testujemy na pustym, fikcyjnym profilu.
- Dedykowana gałąź `test` jest główną gałęzią **projektu TEST**, zapewniając stały adres `<nazwa-projektu>.pages.dev`. Pull Requesty mogą otrzymać dodatkowe adresy preview, jeśli włączymy budowanie tych gałęzi.
- Wdrożenie **preview** nie jest równoznaczne z zaliczeniem GitHub Actions; przed akceptacją produkcyjną wymagamy pozytywnego zestawu Playwright i testów na iPhonie. **Nie scalać Pull Request bez zgody użytkownika.**

## Pierwsza konfiguracja w Cloudflare (wymaga właściciela konta)

1. Wejdź na https://dash.cloudflare.com/ → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** (nazwy mogą się nieznacznie różnić).
2. Połącz GitHub; dla uprawnień aplikacji Cloudflare wybierz **Only select repositories** i repo `wisniajoker90/Spanish-skills-for-my-kid`. Nie podawaj haseł ani tokenów w czacie.
3. Utwórz projekt o nazwie **`hiszpanski-franka-test`**, o ile wolna (faktyczna nazwa i adres potwierdzone dopiero po utworzeniu).
4. **Production branch:** `test` (to techniczna gałąź produkcyjna **oddzielnego projektu Cloudflare TEST**; nie zmienia istniejącego GitHub Pages ani gałęzi `main`).
5. **Framework preset:** None; **Root directory:** katalog główny repo; **Build command:** `node scripts/prepare-pages.cjs`; **Build output directory:** `pages-dist`.
6. Pozostaw automatyczne wdrożenia gałęzi `test` aktywne — to nasz stały adres testowy. Commity do `main` nie powinny uruchamiać głównego wdrożenia w tym projekcie, ponieważ wybrana jest gałąź `test`. W **Settings → Builds → Branch control** sprawdź i ogranicz dodatkowe podglądy do wybranych gałęzi.
7. **Preview branch control:** opcjonalnie dopuść wybrane gałęzie sprintów do dodatkowych wdrożeń preview. Główna wersja TEST jest publikowana z gałęzi `test` pod adresem projektu Cloudflare Pages; nie wymaga aliasu preview. Jeśli chcesz zobaczyć konkretny commit, użyj adresu jego wdrożenia.
8. Stały adres projektu to `https://hiszpanski-franka-test.pages.dev/` (po zweryfikowaniu). Dla konkretnego wdrożenia Cloudflare generuje osobny adres, np. `https://c5696c25.hiszpanski-franka-test.pages.dev/`. Nie utożsamiaj adresu konkretnego wdrożenia ze stałym adresem.
9. Domyślnie preview mogą być publiczne. Jeśli potrzebujesz dostępu ograniczonego do rodziny, rozważ Cloudflare Access dla preview pod **Settings → General → Enable access policy**; sprawdź działanie logowania i offline w PWA po włączeniu.
10. Sprawdź, że strona TEST nie jest stroną GitHub Pages, działa w Safari, i nie ma na niej prawdziwych postępów. Wykonaj IA09–IA12 po poprawnym wdrożeniu.

## Ochrona zasobów

**Nigdy nie ustawiaj** katalogu publikacji na `.` (root repo). W repo znajdują się skrypty, testy i inne pliki, które nie powinny być publikowane. Skrypt `scripts/prepare-pages.cjs` przygotowuje wyłącznie `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` oraz opcjonalne `CNAME`; zapewnia zgodność bajtową z plikiem wejściowym.

## Użytkowanie w kolejnych sprintach

- PR: automatyczny preview na adresie właściwym dla gałęzi PR (jeśli włączone builds dla danej gałęzi).
- Stałe TEST: `<projekt>.pages.dev`. Aby sprawdzić nową wersję na tym adresie, należy zaktualizować zawartość gałęzi `test` — bez zmiany `main`.
- Aktualizacja TEST **nie musi** czekać na zatwierdzenie przez 41 testów. Tę bramkę ma środowisko PROD; preview służy do testowania.
- Środowiska mają różne origins, a więc odrębne `localStorage`, Cache Storage i zakresy Service Worker. Pamiętaj, że nawet TEST może zapisywać dane w swojej przeglądarce.
- Na iOS sprawdź zwykłe Safari oraz opcję **Dodaj do ekranu początkowego** dla adresu TEST. Rozdziel te aplikacje i nie importuj danych z PROD.
- Gdy testy się zakończą, **nie** przesuwaj automatycznie PR do `main`; wymagane osobne zatwierdzenie użytkownika.

Dokumentacja: https://developers.cloudflare.com/pages/configuration/git-integration/ ; https://developers.cloudflare.com/pages/configuration/branch-build-controls/ ; https://developers.cloudflare.com/pages/configuration/preview-deployments/
