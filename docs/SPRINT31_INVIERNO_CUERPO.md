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
- Zawartość poprzednich etapów Learning Journey przechowywana niezależnie od nowego pakietu, aby uniknąć przesunięć istniejących identyfikatorów; 3 odrębne nowe etapy po 5/5/3 słowa pojawiają się przed checkpointem.
- Bez zmian kluczy `localStorage`, schematów JSON, PIN-u, importu/eksportu, Service Workera, manifestu ani materiału z pozostałych sezonów.
- 6 nowych testów IV31-01–IV31-06 i rozszerzony Quality Gate **75 wymaganych przejść**.

## Odbiór manualny iPhone / Cloudflare TEST
**IV31-M01** — Przejdź do Invierno i znajdź nowe szkolne słowa w istniejących fiszkach. Zobacz polskie tłumaczenie i użyj odsłuchu hiszpańskiej wymowy.

**IV31-M02** — Otwórz Learning Journey dla Invierno. Sprawdź nowe etapy „Części ciała” (13 słów w 3 zestawach), nie powinny resetować wcześniej ukończonych lekcji. Jeśli etapy są zablokowane, sprawdź jedynie ich obecność — nie wymuszaj ukończenia wcześniejszych etapów.

**IV31-M03** — Uruchom istniejące Memory, quiz i szkolny checkpoint w Invierno. Sprawdź, czy nowe słowa występują w puli zadań, pamiętając że losowanie nie gwarantuje natychmiastowego trafienia konkretnego słowa.

**IV31-M04** — Włącz słuchanie i powtórki; wyjdź i wróć do ćwiczenia, sprawdź nawigację oraz brak nakładającego się audio.

**IV31-M05** — Offline i restart PWA, dwa profile, postęp i eksport/import JSON. Nie usuwaj zainstalowanej aplikacji. Potwierdź, że nigdzie nie dodano angielskich poleceń czy nowych typów gier.

## Wdrożenie
Wyłącznie gałąź funkcjonalna + Cloudflare TEST i Draft PR do `main`. Scalenie i produkcja tylko po osobnej zgodzie użytkownika.
