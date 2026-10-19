<p align="center">
  <img src=".github/preview/banner.webp" alt="Mali: wojna w sercu Sahelu" width="100%">
</p>

<h1 align="center">Mali: wojna w sercu Sahelu</h1>

<p align="center">
  Interaktywna prezentacja na lekcję WOS o wojnie w Mali i konflikcie w Sahelu, z quizem na żywo dla całej klasy.
</p>

<p align="center">
  <a href="https://prezentacje.fatum.cc/wos/mali/"><img alt="Zobacz na żywo" src="https://img.shields.io/badge/%E2%96%B6%20zobacz-na%20%C5%BCywo-e3a43a?style=for-the-badge&labelColor=0b0f17"></a>
  <img alt="Licencja MIT" src="https://img.shields.io/badge/licencja-MIT-14b53a?style=for-the-badge&labelColor=0b0f17">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-5a78e6?style=for-the-badge&labelColor=0b0f17">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-c4532c?style=for-the-badge&labelColor=0b0f17">
  <img alt="Node" src="https://img.shields.io/badge/Node-%E2%89%A522.18-efe3cc?style=for-the-badge&labelColor=0b0f17">
</p>

<table>
  <tr>
    <td><img src=".github/preview/s02.webp" alt="Mali w pigułce"></td>
    <td><img src=".github/preview/s06.webp" alt="Interwencja 2013"></td>
    <td><img src=".github/preview/s08.webp" alt="Zamachy stanu"></td>
  </tr>
  <tr>
    <td><img src=".github/preview/s11.webp" alt="Koszt ludzki"></td>
    <td><img src=".github/preview/s12.webp" alt="Kto co mówi"></td>
    <td><img src=".github/preview/s13.webp" alt="Quiz na żywo"></td>
  </tr>
</table>

<p align="center">
  <img src=".github/preview/sword.gif" alt="Slajd 2012: Wybuch wojny" width="66%">
  <img src=".github/preview/phone.webp" alt="Quiz na telefonie" width="22%">
</p>

## Co w środku

- **15 slajdów** od niepodległości w 1960 r. do października 2026 r., każdy z własną animacją wejścia.
- **Quiz na żywo**: kod QR albo PIN, bez instalowania aplikacji. Wynik liczy serwer. Kolory i kolejność odpowiedzi są takie same na tablicy i na telefonach.
- **Ponad 100 źródeł**: każda liczba ma przypis prowadzący do listy źródeł. Liczby sporne są oznaczone.
- **Działa wszędzie**: tablica interaktywna, stary laptop, telefon. Tryb lekki (klawisz `L`) zachowuje animacje.
- **Zdjęcia, flagi i wideo** na wolnych licencjach (Wikimedia Commons), mapy z Natural Earth.

## Sterowanie

`→` `Spacja` `PageDown` następny slajd · `←` `PageUp` poprzedni · `F` pełny ekran · `L` tryb lekki · przesunięcie palcem lub kliknięcie

## Uruchom lokalnie

```bash
npm install
cp .env.example .env
npm run dev & npm run dev:server
```

Prezentacja: `http://localhost:5173/wos/mali/` · quiz: `http://localhost:5173/wos/mali/quiz/`

Do pracy lokalnej potrzebny jest Node 22.18 lub nowszy (uruchamia pliki `.ts` bezpośrednio). Serwer po zbudowaniu działa na Node 20.6+.

Testy: `npm test` (jednostkowe) i `npm run e2e` (przeglądarka).

---

<p align="center">
  <b>Adam Pietrzak 4D</b><br>
  <sub>Licencja <a href="LICENSE">MIT</a>. Zdjęcia, wideo i flagi: licencje podane na slajdzie „Źródła”.</sub>
</p>
