# Sprint 30.3 — stabilizacja i UX Dialogów Junior

## Cel
Doprecyzować UX i zachowanie audio po wdrożeniu Sprintu 30.2, bez zmian treści szkolnych, zapisanych profili ani struktury danych.

## Zmiany
1. **Wyjście z nauki:** kliknięcie „Wróć do wyboru” anuluje oczekujący automatyczny odsłuch dialogu. Zabezpieczenie timerów sprawdza również, czy ekran ćwiczenia jest widoczny i czy karta nie jest ukryta.
2. **Podpowiedź:** pierwsze słowo odpowiedzi zamiast pierwszych dwóch. Podpowiedź nie ujawnia całej bardzo krótkiej odpowiedzi, a polskie znaczenie pytania pozostaje.
3. **Bezpieczne ponowienie:** po zobaczeniu wzoru można wrócić do pytania przyciskiem „Spróbuję odpowiedzieć jeszcze raz”. Sama ponowna próba nie zwiększa statystyk.
4. **Kontrola jakości:** do istniejących 56 testów dodano ST01–ST04 oraz SC01–SC09 (przewijanie); produkcyjne wdrożenie wymaga 69/69 czystych przejść.

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

## Audyt przewijania — rozszerzenie Sprintu 30.3
- SC01: brak poziomego przewijania na ekranach Dzisiaj, Nauka, Postęp, przy szerokościach iPhone 320/390px.
- SC02: przyciski i treść dialogów mieszczą się w ekranie o szerokości 320px na wszystkich czterech etapach.
- SC03: po przejściu do nowego etapu dialogu aplikacja przewija do początku aktywnego pytania/odpowiedzi; zachowuje czytelny fokus.
- SC04: powrót do wyboru ćwiczenia przywraca poprawny ekran i nie wywołuje spóźnionego audio.
- SC05: panele rodzica / profili / mówienia są ograniczone wysokością i pozwalają przewijać zawartość pionowo.

### Test ręczny przewijania na iPhonie
1. W Otoño → Dialogi przewiń na dół długiego kroku, wybierz główny przycisk i zweryfikuj, że nowy krok pojawia się od początku (nie od środka).
2. Przełącz kilkakrotnie dialog → podpowiedź → wzór → ponowienie → samoocena, bez poziomego przesuwania strony.
3. Przejdź między Dzisiaj, Nauka, Postęp; szczególnie sprawdź powrót do wyboru ćwiczenia oraz Memory.
4. Otwórz profile, panel rodzica i mówienie na małym ekranie. Przy przewijaniu całe okno powinno być dostępne, a przyciski zamknięcia nie ginąć poza ekranem.
5. Sprawdź przewijanie przy otwartej klawiaturze/PIN-ie, a także dolną nawigację względem bezpiecznego obszaru iPhone’a.

### Dodatkowe scenariusze SC06–SC09
- SC06: przejście do lekcji z Learning Journey i pozycja widocznego etapu;
- SC07: Memory, karty i przewijanie na 320 px;
- SC08: faktyczna geometria i przewijanie paneli profili i rodzica w małym ekranie;
- SC09: położenie dolnej nawigacji na górze i dole długiej strony.

Regresja mobilna Playwright jest emulacją rozmiaru ekranu w Chromium. Końcowy odbiór zachowania Safari i PWA iOS należy wykonać manualnie przed produkcją.
