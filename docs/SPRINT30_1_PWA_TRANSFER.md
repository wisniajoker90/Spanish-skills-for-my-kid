# Sprint 30.1 — Safari → iOS PWA: bezpieczne przenoszenie postępów

## Przyczyna i ograniczenia

iOS Safari i aplikacja Web App uruchamiana z ekranu początkowego mogą mieć niezależne magazyny danych, mimo tej samej domeny. Aplikacja Franka zapisuje profile i statystyki lokalnie, w `localStorage` pod kluczami `hf18:meta` i `hf18:p:<id>:...`. To nie jest chmurowa synchronizacja.

**Nigdy nie usuwaj aplikacji ani danych Safari przed zweryfikowanym przeniesieniem postępów.** Plik JSON może zawierać dane i historię nauki dziecka — trzymaj go prywatnie.

## Zmiana w 30.1

- Sekcja **Przenieś postępy Safari ↔ aplikacja** w obszarze „Profile i bezpieczeństwo” objaśnia różne magazyny danych.
- W Safari rodzic pobiera istniejącą opcją **Kopia wszystkich profili JSON**.
- W aplikacji z ekranu początkowego rodzic wybiera istniejącą opcję **Import JSON**.
- Przed zapisaniem pokazujemy w oknie potwierdzenia datę kopii, liczbę profili i nazwy profili. Dane z pliku nigdy nie są wstrzykiwane do HTML.
- Nadal korzystamy z istniejącego walidatora, etapowego zapisu i rollbacku importu.
- Po sukcesie pojawia się lista nowych profili i przycisk **Przejdź do zaimportowanego profilu**. Przełączenie jest **wyłącznie na żądanie**; import nie zamienia cicho aktywnego profilu.
- Import nie nadpisuje istniejących profili, nawet jeśli nazwy są takie same. Przy powtórnym imporcie tworzy kolejną kopię; nie jest to synchronizacja.
- Nie zmieniamy wersji formatu JSON, kluczy danych, PIN-u rodzica, Service Workera, manifestu, zasobów szkolnych ani Car Mode.

## Procedura akceptacji na iPhonie (wyłącznie TEST)

1. Na osobnym środowisku Cloudflare TEST utwórz fikcyjny profil w Safari i wykonaj ćwiczenie, by zapisać postęp.
2. Wejdź w **Postęp → sekcja rodzica → Profile i bezpieczeństwo** i wybierz **Kopia wszystkich profili JSON**. Zapisz plik w Plikach.
3. Otwórz aplikację TEST z ekranu początkowego (PWA), najlepiej na pustym magazynie testowym. Zweryfikuj tekst o osobnej pamięci danych.
4. Wybierz **Import JSON**, wskaż plik. Sprawdź podgląd (data, liczba profili, nazwy) i potwierdź.
5. Zweryfikuj, że przed przełączeniem pierwotny profil pozostał aktywny, a dane nie zostały nadpisane.
6. Wybierz nowy zaimportowany profil i kliknij **Przejdź do zaimportowanego profilu**. Sprawdź ćwiczenia, poziomy, statystyki i historię.
7. Zamknij i ponownie otwórz PWA: import i aktywny profil muszą przetrwać restart.
8. Otwórz Safari: pierwotne postępy są nietknięte. Nie kasuj pliku JSON przed tym krokiem.
9. Sprawdź również anulowanie importu i błędny plik JSON (na fikcyjnych danych). Import nie powinien tworzyć profili po anulowaniu lub błędzie.
10. Sprawdź Car Mode, PIN rodzica, wszystkie 48 testów GitHub Actions i ewentualne działanie offline.

### Kryteria odbiorowe

- PT01–PT07: Playwright, 7/7 PASS.
- R01–R04: dotychczasowe testy bezpieczeństwa kopii, bez regresji.
- Pozostałe 37 testów: bez regresji.
- M30.1–M30.5: realne iOS Safari/PWA, poprawny podgląd i aktywacja, brak nadpisania, ponowne uruchomienie, offline.
- Przed produkcją wymagana **osobna zgoda użytkownika na merge i wdrożenie**.

## Otwarte kwestie / poza zakresem

Automatyczna synchronizacja między urządzeniami i Safari/PWA wymaga osobnego projektu i rozwiązania konfliktów. Samodzielne importowanie JSON przenosi stan tylko w danym momencie.
