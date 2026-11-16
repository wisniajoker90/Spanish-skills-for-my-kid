# Sprint 30.3 — stabilizacja i UX Dialogów Junior

## Cel
Doprecyzować UX i zachowanie audio po wdrożeniu Sprintu 30.2, bez zmian treści szkolnych, zapisanych profili ani struktury danych.

## Zmiany
1. **Wyjście z nauki:** kliknięcie „Wróć do wyboru” anuluje oczekujący automatyczny odsłuch dialogu. Zabezpieczenie timerów sprawdza również, czy ekran ćwiczenia jest widoczny i czy karta nie jest ukryta.
2. **Podpowiedź:** pierwsze słowo odpowiedzi zamiast pierwszych dwóch. Podpowiedź nie ujawnia całej bardzo krótkiej odpowiedzi, a polskie znaczenie pytania pozostaje.
3. **Bezpieczne ponowienie:** po zobaczeniu wzoru można wrócić do pytania przyciskiem „Spróbuję odpowiedzieć jeszcze raz”. Sama ponowna próba nie zwiększa statystyk.
4. **Kontrola jakości:** do istniejących 56 testów dodano ST01–ST04; produkcyjne wdrożenie wymaga 60/60 czystych przejść.

## Manualne testy odbiorowe iPhone / Cloudflare TEST
- **ST-M01:** W Otoño → Dialogi otwórz pytanie, natychmiast wybierz „Wróć do wyboru”. Żaden opóźniony głos z dialogu nie powinien się uruchomić.
- **ST-M02:** W dialogu wybierz „Odpowiedziałem!”, zobacz wzór, wróć przyciskiem „Spróbuję odpowiedzieć jeszcze raz”, ponów próbę i dopiero potem oceń się. Statystyka powinna wzrosnąć tylko raz.
- **ST-M03:** Sprawdź podpowiedź dla dialogu „¿De qué color es la calabaza?”; podpowiedź nie może ujawnić pełnej odpowiedzi „Es naranja.”.
- **ST-M04:** Powtórz odsłuch pytania, przeskocz do Słówek i wróć do Dialogów. Upewnij się, że pytania się nie nakładają, a Car Mode działa jak dotychczas.
- **ST-M05:** Zamknij i ponownie otwórz PWA w trybie offline. Postępy i profile pozostają zapisane. Wróć online i sprawdź statystyki.

## Ograniczenia wydania
- Brak migracji localStorage i zmian eksportu/importu JSON.
- Bez modyfikacji manifestu, service workera i danych podręcznikowych.
- PR wyłącznie Draft, wydanie produkcyjne wyłącznie po osobnej, świadomej zgodzie użytkownika.
