Woo&Miau — static prototype

Ez egy egyszerű, statikus prototípus a Woo&Miau BARF webshop kezdő demo változata számára.

Fájlok:
- index.html — Főoldal (carousel + kiemelt termékek)
- shop.html — Terméklista + szűrők
- product.html — Termékoldal
- cart.html — Kosár
- admin.html — Egyszerű admin CRUD: termék létrehozás/szerkesztés/törlés (localStorage)
- assets/styles.css — Alap stílusok (a megadott brand színnel)
- assets/scripts.js — Kliens oldali logika: carousel, product render, cart, admin CRUD (localStorage)
- assets/*.svg — logo és placeholder képek

Mit tud ez a prototípus:
- responsive layout, gyenge asztali/mobil támogatás
- 1:1 képarányú termékkártyák
- teljes kártyás hover effekt
- carousel a főoldalon (egyszerű, JS alapú)
- kosár működik localStorage-ben, qty módosítás, törlés
- admin CRUD a termékekhez (localStorage)

Használat:
Egyszerűen nyisd meg az `index.html` fájlt a böngésződben (jobb katt -> Megnyitás a böngészőben), nincs szükség szerverre.

Következő lépések javasoltak:
- Pontosítás: responsive menü mobilon, animált accessible carousel (aria), i18n, valós képek és SEO meta + product schema
- Kapcsolódás backendhez: valós API és auth, valós fizetés integráció
Woo&Miau BARF — Static Starter Demo

Ez a mappa egy egyszerű, reszponzív HTML/CSS statikus demót tartalmaz a Woo&Miau BARF webshop kezdőoldalának vázához.

Tartalom:
- index.html — a demo oldal
- assets/styles.css — stílusok (CSS tokenek a tetején)
- assets/scripts.js — egyszerű carousel logika
- assets/placeholder-1.svg — helykitöltő kép

Próbáld ki helyben:
1) Nyisd meg a `index.html` fájlt a böngésződben (dupla katt).
2) Ha HTTP szerveren akarod futtatni: `python -m http.server 8000` a mappában, majd nyisd meg http://localhost:8000

Módosítások regisztrálva:
- v0.02: 2015.10.04 18:21

Megjegyzés: a fő márkaszín a következő RGBA alapján lett beállítva: rgba(212,169,90)
