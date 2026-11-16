# Sprint 31 — Invierno: partes del cuerpo (wyłącznie polski + hiszpański)

## Decyzje produktowe
- **Sprint 31B odrzucony.** Bez nowych gier, dopasowań angielsko-hiszpańskich, map ciała ani osobnego silnika ćwiczeń.
- Dodajemy materiał szkolny z trzech zdjęć Wordwall przesłanych w rozmowie; film https://youtu.be/yh-3pBeVcaI?feature=shared jest kontekstem odsłuchowym, bez kopiowania muzyki lub tekstu piosenki do aplikacji.
- Integracja tylko w **istniejących** fiszkach, Memory, quizach/checkpointach, Learning Journey, powtórkach, Daily Mission oraz dostępnej bazie słów dla Car Mode.
- Materiał szkolny pozostaje odróżniony od samodzielnych ćwiczeń A1. Dotychczasowe profile i postępy muszą przetrwać.

## Zatwierdzony zakres słownictwa (13)
| Hiszpański | Polski |
|---|---|
| Cara | Twarz |
| Pelo | Włosy |
| Ojo | Oko |
| Ojos | Oczy |
| Oreja | Ucho |
| Nariz | Nos |
| Boca | Usta |
| Cabeza | Głowa |
| Brazo | Ramię |
| Mano | Dłoń / ręka |
| Barriga | Brzuch |
| Pierna | Noga |
| Pie | Stopa |

Występujące już słowa są wykorzystywane ponownie zamiast powielania kart. 13 słów z nowego zestawu nie oznacza automatycznie 13 nowych kart.

## Implementacja
- Zweryfikowane 13 słów z Wordwall przypisane do szkoły / Invierno i włączone do istniejących zasobów `units[2]` i `frankaSeasons8.school[2]`.
- Zawartość poprzednich etapów Learning Journey przechowywana niezależnie od nowego pakietu, aby uniknąć przesunięć istniejących identyfikatorów; 3 nowe etapy po 5/5/3 słowa są naturalnie przeplatane z istniejącymi etapami, bez zmiany identyfikatorów starszych lekcji. Zwykły tryb respektuje poprzednie blokady, a oddzielny podgląd QA działa tylko na TEST.
- Bez zmian kluczy `localStorage`, schematów JSON, PIN-u, importu/eksportu, Service Workera, manifestu ani materiału z pozostałych sezonów.
- 8 nowych testów IV31-01–IV31-10 i rozszerzony Quality Gate **79 wymaganych przejść**.

## Odbiór manualny iPhone / Cloudflare TEST
**IV31-M01** — Przejdź do Invierno i znajdź nowe szkolne słowa w istniejących fiszkach. Zobacz polskie tłumaczenie i użyj odsłuchu hiszpańskiej wymowy.

**IV31-M02** — Na Cloudflare TEST wybierz Invierno → Learning Journey. Użyj panelu podglądu QA, aby sprawdzić słowa bez zaliczania starszych lekcji. Następnie sprawdź normalną listę etapów — trzy zestawy są w środku, nie na początku/końcu. Podgląd nie zapisuje wyników.

**IV31-M03** — Uruchom istniejące Memory, quiz i szkolny checkpoint w Invierno. Sprawdź, czy nowe słowa występują w puli zadań, pamiętając że losowanie nie gwarantuje natychmiastowego trafienia konkretnego słowa.

**IV31-M04** — Włącz słuchanie i powtórki; wyjdź i wróć do ćwiczenia, sprawdź nawigację oraz brak nakładającego się audio.

**IV31-M05** — Offline i restart PWA, dwa profile, postęp i eksport/import JSON. Nie usuwaj zainstalowanej aplikacji. Potwierdź, że nigdzie nie dodano angielskich poleceń czy nowych typów gier.

## Wdrożenie
Wyłącznie gałąź funkcjonalna + Cloudflare TEST i Draft PR do `main`. Scalenie i produkcja tylko po osobnej zgodzie użytkownika.

## Korekta dostępności po uwagach z odbioru
Nie wprowadzamy skrótów na produkcji. Podgląd na środowisku TEST służy wyłącznie weryfikacji szkolnej zawartości, a zestawy naturalnie występują w historycznej ścieżce Learning Journey.

## Produkt docelowy a QA — decyzja końcowa
- Produkcja: naturalna ścieżka Invierno. Trzy zestawy słownictwa są ROZŁOŻONE między dotychczasowymi etapami nauki. Bez przypinania na początku, bez bezwarunkowego odblokowania. Zachowane klucze historycznych etapów. Przykładowe autorskie zdania i dialogi PL/ES w istniejącej sekcji ćwiczeń.
- Cloudflare TEST: dodatkowy panel podglądu zestawów Invierno. Pozwala sprawdzić nową zawartość bez wcześniejszego kończenia lekcji. Podgląd NIE zapisuje wyników i NIE odblokowuje etapów. UI istnieje tylko przy hoście `hiszpanski-franka-test.pages.dev` (oraz w lokalnym Playwright na localhost/127.0.0.1).
- GitHub Pages PROD nie posiada dostępnego podglądu QA; nawigacja użytkownika jest zawsze zwykła.
- Do aktualizacji słówek/zdania nie jest wymagane manualne ukończenie całej ścieżki. Nadal obowiązują automatyczne testy i krótka próba zawartości na TEST, aby nie naruszać profili/backupów.
- 79 automatycznych testów, w tym testy braku zmian w postępach podczas podglądu.
