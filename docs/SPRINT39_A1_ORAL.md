# Sprint 39 — mówię i rozumiem

Status: implementacja do TEST. Bez zgody na publikację na produkcji.

## Zmiana zakresu po audycie Sprintu 38

Michał wykluczył ćwiczenia z pisaniem: hiszpański jest trzecim językiem Franka, priorytetem jest mówienie i rozumienie. Wszystkie zadania wymagające własnego tekstu zastąpiono wypowiedzią ustną albo układaniem gotowych słów. Nie ma pól tekstowych, klawiatury ekranowej ani oceny pisania. Kafelki wybiera się dotknięciem; dotknięcie wybranego słowa cofa wybór. Nie trzeba przeciągać małych elementów na iPhonie.

Wybrane cele komunikacyjne wynikają z audytu CEFR Companion Volume oraz Instituto Cervantes. Ten sprint nie pokrywa całego A1, w szczególności nie ocenia czytania ani pisania. Układanie słów ma osobny rodzaj dowodu `sentence-order`.

## Pakiet

| Sezon | Scenariusze |
|---|---|
| Otoño | O1 Poznaj mnie; O2 Co masz? Co widzisz?; O3 Opowiedz o sobie |
| Invierno | I1 Ubierz się i poproś o powtórzenie; I2 Gdzie jest książka?; I3 Powiedz, co masz |
| Primavera | P1 Co naprawdę lubisz?; P2 Przekąska po zabawie; P3 Kiedy gramy w piłkę? |
| Verano | V1 Kiosk: ilość i cena; V2 Gdzie jest basen?; V3 Przekaż wiadomość tacie |

Każdy scenariusz ma przygotowanie (hiszpański, polskie znaczenie, odsłuch) i dwa warianty, po 3–4 zadania. Kolejne ukończenie rotuje wariant. Mówienie: odpowiedz → porównaj z przykładem → samoocena albo obserwacja rodzica. Pokazanie wzoru przed próbą wyklucza oznaczenie jej jako wykonanej bez wzoru. Pytanie audio musi zostać uruchomione przed wyborem odpowiedzi. Powtarzanie audio jest rejestrowane oddzielnie od odsłonięcia modelu. Prawdziwe własne dane i upodobania są akceptowane w instrukcjach, nie ma automatycznego sprawdzania ich zgodności ze wzorcem.

O2 wykorzystuje polskie opisy odpowiedzi, a nie nowe ilustracje. V2 wykorzystuje prosty wybór lewo/prawo, a nie mapę. P3 i V3 dostarczają komunikat audio zamiast zadań czytania. Car Mode nie został rozszerzony o zadania wymagające ekranu; zachowuje działanie Sprintu 35.

## Ochrona progresu

Nowe karty wplecione są w trzy miejsca istniejącej listy etapów, przed końcowym blokiem zdań/rozmowy/checkpointu. To uzupełnienia ścieżki, nie nowe obowiązkowe blokady. Stare ID etapów, zawartość i zaliczenia nie zmieniają się; licznik starej ścieżki i puchar nie maleją. Stary tytuł „Buduję proste zdania” doprecyzowano do „Rozumiem proste zdania” bez zmiany ID.

Nowy klucz `hiszpanskiFrankaA1Practice39V1` jest izolowany przez frankaStore w aktywnym profilu i objęty dotychczasowym eksportem/importem. Zawiera przerwaną sesję oraz do 12 ostatnich podejść na scenariusz. Zachowuje licznik wszystkich ukończonych podejść, ale po przekroczeniu limitu starsze szczegóły są zastępowane nowszymi. Odsłuch, samoocena i układanie nie zwiększają mastery istniejących słówek ani nie przyznają dawnego pucharu.

Na TEST widoczny jest rozwijany „Sprint 39 — podgląd ćwiczeń”. Można otworzyć każdy scenariusz bez odblokowywania ścieżki i przełączyć wariant. Podgląd niczego nie zapisuje. Na PROD narzędzia podglądu są niedostępne; przekazanie flagi preview nie omija kontroli hosta.

## Walidacja

12 nowych scenariuszy regresji obejmuje wszystkie 24 warianty, zachowanie dawnych postępów, rozróżnienie dowodów, pierwszą błędną odpowiedź, układanie i cofanie, wznowienie po odświeżeniu, profile, eksport, host produkcyjny, układ mobilny, TTS i idempotencję zapisu. Zastany zestaw 84 testów jest zachowany; bramka wymaga 96 czystych PASS. Wynik uruchomienia znajduje się w GitHub Actions dla bieżącego commita, nie jest domniemany przez samą deklarację testów.

## Odbiór ręczny

Podawać po jednym scenariuszu: PASS / FAIL / COMMENT.

- S39-M01: Otoño → podgląd O1 → odpowiedź na głos → ułożenie „Tengo siete años.” → powrót. Bez klawiatury, bez zapisu w podglądzie.
- S39-M02: Invierno → I1 → prośba o powtórzenie → ponowione polecenie; I2 → zmiana lokalizacji książki.
- S39-M03: Primavera → P1 → własna odpowiedź, pytanie „¿Y a ti?”, rozpoznanie wypowiedzi kolegi; P2 akceptuje zgodę i odmowę.
- S39-M04: Verano → V1 → cena; V2 → kierunek; V3 → przekazanie miejsca i godziny po polsku.
- S39-M05: Zwykły etap (po odblokowaniu/kopii testowego profilu): przerwij i odśwież, wznów, ukończ; drugi wariant przy następnym podejściu.
- S39-M06: Dawne zaliczenia, checkpointy i puchary zachowane; użytkownik nie musi niczego pisać.

Publikacja dopiero po decyzji Michała „Wdrażaj”. Sprint 36 nadal wstrzymany.
