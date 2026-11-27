# Sprint 40 — przegląd UX i propozycja ujednolicenia
Data: 27.11.2026. Status: audyt i proponowany zakres; bez zmian w działaniu aplikacji.
Podstawa: produkcja, commit c243a5b102d09b039caa80c304db34ccacde0af2.

## Metoda i granice
Przegląd głównych ekranów produkcyjnej aplikacji w przeglądarce na świeżym lokalnym profilu oraz analiza kodu. Obejmuje Dziś, Nauka/Lekcje/Gry/Dialogi, ścieżkę, lekcję, Postępy, informacje rodzica i konfigurację Car Mode. Pozostałe stany (m.in. ćwiczenia S39, synchronizacja i import) oceniono również na podstawie kodu i dotychczasowych wyników odbioru.
To nie jest pełna walidacja wizualna na fizycznym iPhonie/Androidzie, test dostępności ani ponowny test dźwięku. Nie zmieniano rzeczywistego postępu Franka. Problemy z układem mobilnym i kontrastem wymagają pomiaru, nie są tu przedstawiane jako potwierdzone usterki.

## Zasady produktu
- Dziecko przede wszystkim słucha i mówi; bez ćwiczeń wymagających pisania.
- Trzy główne zakładki pozostają: Dziś, Nauka, Postępy.
- Jeden wyraźny następny krok; informacje rodzica oddzielone od zadania dziecka.
- Zachowujemy dane, identyfikatory treści, reguły punktacji, odznaki, puchary i odblokowania.
- Ujednolicamy samoocenę: „Odpowiedziałem sam” / „Potrzebowałem pomocy”. Nie sugerujemy automatycznej oceny mowy.
- Nowy materiał szkolny wymaga materiałów od rodzica. Audyt nie dodaje treści ani pisania.

## Ustalenia i rekomendacje
P1: najpierw; P2: pozostała część przeglądu. Priorytety nie oznaczają awarii danych.

| ID / priorytet | Obszar i ustalenie | Propozycja i kryterium odbioru |
|---|---|---|
| UX-01 / P1 | Lekcja pokazuje przed próbą tłumaczenie w bloku „Najpierw posłuchaj i powtórz…”. | Usunąć cały wskazany blok ze wszystkich lekcji tego wzorca. Odsłuch i ocena pozostają. Nie usuwać automatycznie tłumaczeń z celowej fazy nauki ani wzorca po próbie. |
| UX-02 / P1 | Przyciski i ocena różnią się między lekcjami, dialogami i S39. | Wspólne warianty: główna akcja, pomoc, powrót, działanie destrukcyjne. Te same etykiety samooceny, kolejność, rozmiary, stany disabled/focus/loading. „Sprawdź kolejność” zgodne z tym systemem. |
| UX-03 / P1 | Informacje rodzica nadal mówią, że postępy Safari i aplikacji nie synchronizują się automatycznie. | Tekst zależny od stanu konkretnego profilu: lokalny / połączony. QR i synchronizacja jako normalne przenoszenie połączonego profilu; JSON jako kopia i odtworzenie. |
| UX-04 / P1 | Dziś ma misję, osobny plan, cel i kilka konkurujących wejść do nauki. | Jedna dominująca akcja „Rozpocznij” lub „Kontynuuj”; krótki cel i przewidywany czas. Powtórka, sprawdzian i auto jako akcje dodatkowe. Zachować istniejący dobór materiału. |
| UX-05 / P2 | Rozbudowane karty sezonów zajmują miejsce także nad grami i Car Mode. Gry mają dodatkowy wybór rozdziału. | Jeden spójny wybór sezonu; w aktywności zwarty kontekst zamiast całego katalogu. Zmiana sezonu ma przewidywalny wpływ na aktywną zakładkę. |
| UX-06 / P1 | Ścieżka zawiera długie opisy, powtórzone cele i tekst „oceniany osobno tylko wewnętrznie”. | Dziecko widzi następny etap, stan ukończenia i powód blokady. Techniczne wyjaśnienia usunąć z widoku dziecka. Zachować powrót do właściwego etapu, przewinięcie i fokus. |
| UX-07 / P1 | Zakładka Dialogi wyświetla ścieżkę i checkpointy przed właściwym dialogiem. | Dialogi jako czytelny dostęp do praktyki; etapy ścieżki odwołują się do tych samych treści i identyfikatorów. Jawnie odróżnić swobodną powtórkę od zaliczenia etapu. Nie tworzyć drugiego systemu punktów. |
| UX-08 / P1 | S39 stosuje własną stylistykę i część tekstów wdrożeniowych, np. o zachowaniu dawnych pucharów. | Wspólny wygląd i mikrocopy. W ćwiczeniu wyłącznie polecenie, audio, odpowiedź/pomoc i postęp. Informacje o wydaniu przenieść poza ćwiczenia. |
| UX-09 / P2 | Kafelki zdań wymagają jasnego rozróżnienia ułożenia i sprawdzenia. | Czytelny obszar zdania, możliwość cofnięcia kafelka, jeden przycisk sprawdzenia i krótka informacja zwrotna. Obsługa dotykiem i klawiaturą; nie polegać wyłącznie na kolorze ani przeciąganiu. |
| UX-10 / P2 | Gry pokazują wiele ustawień; opcja Junior widoczna także poza rozsypanką. | Ustawienia tylko dla wybranej gry. Rozsypankę liter ocenić pod kątem celu mówienia i słuchania; nie dodawać pisania. Zadania na czas pozostawić opcjonalne. |
| UX-11 / P1 | Car Mode dzieli ekran z kartami sezonów i kartą wznowienia innej aktywności. | Skupiony ekran rozmowy/powtórki; domyślnie 10 minut, dodatkowe ustawienia zwijane. Podczas sesji pauza/wznów/zakończ; quiz na postoju. Wznowienie zawsze opisuje właściwą sesję. |
| UX-12 / P2 | Postępy pokazują różne grupy nagród, m.in. 0/6 i 0/4, oraz kilka wejść do odznak. | Jedna galeria z nazwanymi grupami i warunkami zdobycia. Rozróżnić ukończenie ścieżki i opanowanie materiału. Różne mianowniki nie są same w sobie błędem — nie zmieniać reguł nagród. |
| UX-13 / P2 | Powtórka mistrza, dzienny plan, dodatkowe powtórki i checkpointy mają różne opisy. | Wyjaśniać po jednym celu: uczę się / utrwalam / sprawdzam. Wspólne wejście, zakończenie i powrót. Wynik checkpointu nie powinien sugerować oficjalnego certyfikatu A1. |
| UX-14 / P1 | Ustawienia rodzinne, kopie i informacje rodzica są rozproszone; Family Sync widoczne na ekranie dziecka. | Jedno czytelne wejście rodzica z sekcjami Profile, Urządzenia i synchronizacja, Kopie, Wyniki, Ustawienia. PIN pozostaje ograniczeniem interfejsu, nie zastępuje uprawnień serwera. |
| UX-15 / P1 | Synchronizacja ma stany wymagające jednoznacznych komunikatów; offline wcześniej powodowało mylący komunikat (poprawka przeszła TEST). | Spójne stany: zapisano na urządzeniu / oczekuje / synchronizowanie / zsynchronizowano / wymaga połączenia. Informacja nie zasłania ćwiczenia. Nie oznaczać produkcyjnego testu offline jako zakończonego. |
| UX-16 / P2 | Import tworzy nowy profil, co może być mylone z aktualizacją istniejącego. | Podgląd nazwy, daty i zakresu kopii oraz jasny rezultat „Dodaj jako osobny profil”. Po odtworzeniu łatwo przejść do tego profilu. Bez cichego nadpisania i automatycznego połączenia z chmurą. |
| UX-17 / P2 | Profil i jego stan synchronizacji potrzebują spójnego oznaczenia we wszystkich wejściach. | Nazwa i awatar aktywnego profilu, krótki status połączenia. Zmiana profilu nie może pokazywać statystyk poprzedniego. Pełne zarządzanie i wieloprofilowość w osobnym zakresie danych. |
| UX-18 / P1 | Układ i dostępność wymagają końcowej walidacji na docelowych urządzeniach. | Sprawdzić iPhone Safari, Android telefon/tablet, PC: brak zasłaniania przez dolny pasek/klawiaturę, czytelne powiększenie tekstu, fokus, dialogi, kontrast, komunikaty i etykiety audio. Projektować cele dotykowe co najmniej 44×44 CSS px. |

## Synchronizacja profili — obecny stan i kierunek
Obecny klient Family Sync używa jednego wspólnego identyfikatora profilu nauki w rodzinie. Lokalna lista profili nie oznacza niezależnej synchronizacji każdego z nich. Nie należy łączyć różnych osób z tym samym zdalnym profilem w oczekiwaniu izolacji wyników.

Docelowo urządzenie dołącza do rodziny raz (QR/kod), a rodzic wybiera profile dostępne na nim. Franek na iPhonie i Franek na Androidzie oznaczają ten sam zdalny profil; Michał ma inny identyfikator, postęp, nagrody i historię. Nazwa nie jest kluczem łączenia. Przełączenie profilu nie powinno wymagać ponownego parowania urządzenia.

Rozszerzenie wymaga zmian API, modelu danych i klienta, wraz z migracją zachowującą połączonego Franka. Nie jest to wyłącznie poprawka wizualna. Szczegóły w backlogu PROF-01–04.

## Proponowany Sprint 40
Cel: spójne doświadczenie dziecka i rodzica we wszystkich głównych obszarach, bez zmiany nauki i progresu.
1. Wspólne komponenty, etykiety i stany; usunięcie zdradzającego odpowiedź bloku.
2. Uporządkowanie Dziś, Nauka, Dialogi, lekcji i gier; skupiony Car Mode.
3. Jednolita prezentacja postępów/nagród oraz informacji rodzica, kopii i synchronizacji.
4. Przejście całych ścieżek i odbiór na TEST na docelowych urządzeniach.
To kolejność prac w jednym sprincie, nie osobne mikrosprinty. Dokładny koszt zależy od zakresu przebudowy istniejących modułów. Audyt nie wdraża zmian.

## Następny zakres — zarządzanie profilami
Proponowany Sprint 41: profile i niezależna synchronizacja. Uwzględnić listę/zmianę nazwy/awataru, wybór profili na urządzeniu, usuwanie lokalne odróżnione od rodzinnego, archiwizację i odtworzenie. Najpierw zaprojektować migrację i odizolowanie danych; potem wystawić akcje usuwania. Nie dodawać na szybko samego przycisku „Usuń”.

## Odbiór Sprintu 40
Każdy scenariusz otrzyma interaktywną odpowiedź PASS / FAIL / COMMENT.
- S40-M01: na Dziś wiadomo, co rozpocząć/wznowić; powrót z nauki prowadzi we właściwe miejsce.
- S40-M02: lekcja nie pokazuje usuwanego bloku, odsłuch i samoocena działają.
- S40-M03: dialog i ćwiczenia ustne stosują spójne przyciski; żadnego wpisywania tekstu.
- S40-M04: kafelki można ułożyć, poprawić i sprawdzić na telefonie i PC.
- S40-M05: wybór sezonu i ćwiczenia jest spójny; brak powielonej ścieżki przed dialogiem.
- S40-M06: Car Mode ma właściwe wznowienie, pauzę i zakończenie; brak obcych kart.
- S40-M07: nagrody mają jasne grupy i wymagania; stare punkty, zaliczenia i puchary zachowane.
- S40-M08: rodzic znajduje profile, urządzenia i kopie; teksty odpowiadają stanowi lokalny/połączony.
- S40-M09: offline/oczekiwanie/błąd nie udają skutecznej synchronizacji; aktywność pozostaje nieprzerwana.
- S40-M10: iOS/Android/PC — ekran, fokus, dotyk, powiększony tekst i audio działają.
- S40-M11: import jako osobny profil nie nadpisuje bieżącego; przełączanie nie miesza wyników.
Publikacja dopiero po odbiorze TEST i osobnej interaktywnej decyzji Wdrażaj / Wstrzymaj.

## Otwarte odbiory produkcyjnego Family Sync
PROD-01 i PROD-02: PASS użytkownika. Dwukierunkowe przyrosty wyników i offline na produkcji: ODROCZONE, nie PASS. Przeprowadzić przy naturalnej nauce Franka lub na odizolowanych danych testowych, bez sztucznego dopisywania punktów do jego profilu.

## Wersja do odbioru
- Dziś pokazuje jedną misję i krótki cel. Powtórka, sprawdzian i auto zachowują oddzielne wejścia.
- Nauka ma wspólny wybór sezonu. Dialogi do ćwiczenia są w swojej zakładce. Sezonowe rozmowy do zaliczenia otwierają się ze ścieżki. Powrót prowadzi do ścieżki, a lekcja po zamknięciu oddaje fokus przyciskowi, z którego została otwarta.
- Lekcje zachowują odsłuch, a tłumaczenia w odpowiedziach pojawiają się dopiero po wybraniu „Spróbuję odpowiedzieć”. Dialogi i ćwiczenia Sprintu 39 korzystają ze wspólnego wyglądu przycisków i etykiet samooceny.
- Tryb auta pokazuje tylko własną konfigurację, sesję i quiz na postoju. Długość, tempo i przerwa są w „Ustawieniach sesji”.
- Postępy mają wspólną galerię odznak i pucharów. „Dla rodzica” prowadzi do wyników, urządzeń i kopii. Profil pokazuje stan lokalny lub połączony, a komunikaty offline odróżniają zapis lokalny od potwierdzenia serwera.
- Wybór równolegle synchronizowanych profili, usuwanie i archiwizacja pozostają w PROF-01–04. Rozmowy sezonowe do zaliczenia pozostają na ścieżce zgodnie z wcześniejszym ustaleniem.
- Testy automatyczne obejmują Chromium i symulowany odsłuch. Weryfikacja dźwięku oraz odbiór na fizycznych urządzeniach są osobnym etapem.
