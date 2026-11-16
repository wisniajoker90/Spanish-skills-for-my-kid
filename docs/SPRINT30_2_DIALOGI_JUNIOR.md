# Sprint 30.2 — Dialogi Junior 2.0

## Cel
Prosta, czytelna dla siedmiolatka rozmowa po hiszpańsku: **posłuchaj pytania → odpowiedz na głos (lub skorzystaj z podpowiedzi) → porównaj odpowiedź → oceń samodzielność → następny dialog**.

## Implementacja
- Automatyczny odsłuch **pytania** na początku nowego dialogu; TTS iOS może wymagać wcześniejszego gestu użytkownika. Duży przycisk **🔊 Powtórz pytanie** jest zawsze widoczny jako bezpieczny fallback.
- Jeden duży główny przycisk przejścia między etapami; dodatkowy przycisk podpowiedzi dostępny tylko przed wypowiedzią.
- Podpowiedź: polskie znaczenie pytania i pierwsze 1–2 słowa przykładowej odpowiedzi, **bez odsłaniania całej odpowiedzi**.
- Po wypowiedzi wzorcowa odpowiedź z tłumaczeniem i osobnym odsłuchem; nadal bez oceniania mowy przez AI i bez konieczności mikrofonu.
- Samoocena **samodzielnie/z pomocą**. Gdy wyświetlono podpowiedź, nie ma fałszywej opcji „Powiedziałem sam”.
- Zapowiadanie i ponawianie pytania korzysta z `hf29Audio.speakWord`, wspólnego mechanizmu ochrony TTS przed konfliktem z Car Mode.
- Zmiana tematu, typu ćwiczenia lub ukrycie strony przerywa *oczekujący* timer automatycznego odsłuchu.
- Bez dodawania nowych treści szkolnych (Invierno i pozostałe), bez migracji przechowywania postępów; istniejące klucze A1 pozostają zgodne z kopiami JSON.

## Release Gate
- Dotychczasowe **48 testów** pozostaje obowiązkowe.
- DJ01–DJ08 (8 nowych testów) sprawdza: automatyczny odsłuch, duży przycisk powtórzenia, podpowiedź, pomoc, samodzielność, następny dialog, anulowanie oczekującego audio, izolację Car Mode.
- Łącznie **56 Playwright PASS** (0 skipped, 0 flaky, 0 failures) przed wydaniem GitHub Pages.
- GitHub Actions w PR jest tylko bramką jakości — pakowanie i publikacja produkcyjna są pomijane.

## Manualny odbiór iPhone / Cloudflare TEST
1. Wybierz **Otoño → Dialogi** na TEST. Po wejściu w rozmowę powinno zostać przeczytane pytanie po hiszpańsku; jeśli iOS blokuje autoplay, naciśnij duży przycisk „Powtórz pytanie”.
2. Powtórz pytanie 2–3 razy. Nie może nakładać się kilka wypowiedzi ani urywać nowego pytania po powrocie do dialogu.
3. Wciśnij „Potrzebuję podpowiedzi”; sprawdź wyjaśnienie, bez całej odpowiedzi. „Odpowiedziałem!” powinno przenieść do wzorca.
4. Przejdź „Dalej” i oceń rozmowę z podpowiedzią; powinna zostać policzona jako próba **z pomocą**.
5. Rozpocznij następną rozmowę i sprawdź automatyczny odsłuch, reset podpowiedzi oraz **samodzielną** odpowiedź bez podpowiedzi.
6. Zweryfikuj w panelu rodzica / A1, że próby zapisują się i przetrwają ponowne uruchomienie PWA, bez mieszania profili.
7. Sprawdź przełączenie Otoño/Invierno, mobilny rozmiar przycisków i to, że aktywny Car Mode nie jest zakłócany dialogami.
8. Offline: istniejąca lekcja i postępy nadal się ładują (offline TTS zależy od zainstalowanych głosów iOS).

**Nie scalać ani nie publikować bez oddzielnej zgody właściciela.**
