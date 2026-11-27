# Backlog zgłoszeń produktu

## UX-01 — usunięcie podpowiedzi zdradzającej tłumaczenie w lekcji

- Zgłoszenie: Michał, 25.11.2026.
- Status: zaplanowane do wspólnego przeglądu UX **po zakończeniu synchronizacji**. Nie realizować w poprawce Family Sync.
- Problem: pod hiszpańską nazwą, jeszcze przed odpowiedzią dziecka, pojawia się tekst „Najpierw posłuchaj i powtórz: Manzana — Jabłko. Potem sprawdź, czy pamiętasz”. Zdradza odpowiedź i dodaje niepożądany tekst.
- Zakres: usunąć ten blok instrukcji wraz z przykładem/tłumaczeniem. Sprawdzić wszystkie lekcje korzystające z tego wzorca.
- Odbiór: blok nie jest wyświetlany przed odpowiedzią ani później; odsłuch i dotychczasowe ocenianie nadal działają; nie dodajemy pisania ani nie zmieniamy progresu.
- Powiązanie: razem z wcześniej odłożonym przeglądem spójności przycisków Sprintu 39.

## Sprint 40 — pełny przegląd i ujednolicenie UX
- Status: audyt przygotowany 27.11.2026; implementacja i odbiór przed nami.
- Zakres UX-02–18, priorytety i scenariusze: [audyt Sprintu 40](docs/SPRINT40_UX_AUDIT.md).
- UX-01 pozostaje częścią tego zakresu, wraz ze spójnością przycisków Sprintu 39.
- Ta lista jest backlogiem zgłoszeń; nie stanowi odtworzenia całego historycznego backlogu projektu.

## PROF-01 — zarządzanie profilami
- Zgłoszenie: Michał, 27.11.2026. Status: backlog; proponowany Sprint 41.
- Lista profili, nazwa, awatar, aktywny profil, stan lokalny/połączony i urządzenia.
- Edycja nazwy nie zmienia tożsamości profilu; przełączenie nie miesza wyników.
- Akcje administracyjne dostępne w części rodzica.

## PROF-02 — usuwanie i archiwizacja profilu
- Status: backlog, wymaga wspólnego projektu z PROF-03.
- Odróżnić „Usuń z tego urządzenia” od „Usuń profil z rodziny”.
- Przed lokalnym usunięciem wykryć niewysłany postęp; zapewnić synchronizację lub kopię.
- Preferować odwracalną archiwizację; dopiero osobna, wyraźna decyzja o trwałym usunięciu.
- Rodzic widzi nazwę profilu, zakres działania i wpływ na inne urządzenia.
- Uprawnienia serwerowe dla operacji rodzinnych; sam lokalny PIN nie wystarcza.
- Usunięcie/archiwizacja nie może zostać cofnięte przez późniejszą synchronizację starego urządzenia offline.
- Obsłużyć usunięcie aktywnego i ostatniego profilu oraz wszystkie powiązane kopie/historię według jawnej polityki.
- Odbiór na fikcyjnych profilach; bez eksperymentów na postępie Franka.

## PROF-03 — niezależna synchronizacja wielu profili
- Status: backlog; wysoki priorytet przed podłączeniem kolejnej osoby.
- Obecna wersja synchronizuje jeden wspólny profil nauki na rodzinę.
- Docelowo trwały zdalny identyfikator każdego profilu; osobne wyniki, kolejki zmian, nagrody i historia.
- Urządzenie parowane z rodziną raz; wybór profili dostępnych na urządzeniu.
- Nigdy nie scalać automatycznie po nazwie; nazwy mogą się powtarzać.
- Migracja zachowuje bieżące powiązanie Franka i jego progres.
- Testy izolacji dwóch profili online/offline, równoległych zmian, ponowień, odzyskiwania i odwołania dostępu.

## PROF-04 — import, duplikaty i odzyskiwanie profili
- Status: backlog.
- Czytelnie odróżnić kopię lokalną, profil odzyskany jako nowy i profil połączony.
- Pokazać źródło i datę kopii; nie podłączać automatycznie importu do istniejącego profilu rodzinnego.
- Zaprojektować obsługę duplikatów bez automatycznego sumowania punktów.
- Zachować możliwość odzyskania wcześniejszej wersji jako oddzielnego profilu.

## SYNC-QA — otwarte testy produkcyjne
- Dwukierunkowe nowe wyniki i offline odroczone na prośbę użytkownika.
- PROD-01/02 zaliczone. Nie uznawać odroczonych testów za PASS.
