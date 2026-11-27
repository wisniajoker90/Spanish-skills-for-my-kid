# Family Sync — publikacja 27.11.2026

Właściciel zatwierdził publikację Family Sync i kontrolowane połączenie profilu z Safari. M01–M18 oraz P01–P02 PASS; P02 przez kod ręczny na PC. QR wcześniej zaakceptowany w M08, nowy QR dekodowany w testach automatycznych.

Publikowany index.html z powtarzalnego builda zweryfikowanego względem 47a9fd15a13b42036b2551308cd6becde5cd302e; CI 45880264695: 211 PASS. Blob index.html: 5743b41917afc7e33985f5ea6d3d11065feee5c5. Przed publikacją ponownie 30 testów backendu produkcyjnego i builda PASS.

Poprzednia produkcja: edefcef1cfe1a9f6f844d2db26f5d47bef6fb9eb. Backend: franka-family-sync.wisniajoker90.workers.dev; nowa baza D1 b4a550b1-05d0-4c47-a7cb-47cd22b0e763. W momencie publikacji frontendu health potwierdza backendReady=true i syncEnabled=false. Aktywacja SYNC_ENABLED=true w Cloudflare oraz inicjalizacja właściwego profilu Safari to kolejne kroki już zatwierdzonego wdrożenia. Nie oznaczać ich jako zakończonych bez potwierdzenia.

Świeża kopia JSON zapisana przez właściciela 26.11; jeżeli od tego czasu pojawił się nowy postęp, ponowić eksport przed inicjalizacją. Nigdy nie migrować wyników TEST. Po inicjalizacji porównać punkty/nagrody/zaliczenia, dopiero potem dodawać kolejne urządzenia. Przy problemie zatrzymać API flagą false i zachować lokalne oraz serwerowe dane; rollback kodu nie cofa danych. Procedura szczegółowa w PR15, family-sync/production/README.md.
