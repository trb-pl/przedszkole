/**
 * Rok szkolny 2026/2027 — granice i dni, w które zajęć nie ma.
 *
 * Z tych dat generator kalendarza (.ics) buduje wyjątki dla wydarzeń
 * cotygodniowych — bez nich rodzic miałby w telefonie rytmikę w Wigilię
 * i gimnastykę w środku ferii.
 *
 * Te same daty są w scripts/make-listy-obecnosci.py (Python, listy
 * obecności). Przy zmianie roku szkolnego trzeba zaktualizować oba pliki.
 */

export const POCZATEK_ROKU = '2026-09-01';
export const KONIEC_ROKU = '2027-08-31';

/** Święta ustawowo wolne od pracy. Wigilia jest wolna od 2025 roku. */
const SWIETA = [
  '2026-11-01', // Wszystkich Świętych
  '2026-11-11', // Święto Niepodległości
  '2026-12-24', // Wigilia
  '2026-12-25', // Boże Narodzenie
  '2026-12-26', // Boże Narodzenie
  '2027-01-01', // Nowy Rok
  '2027-01-06', // Trzech Króli
  '2027-03-28', // Wielkanoc
  '2027-03-29', // Poniedziałek Wielkanocny
  '2027-05-01', // Święto Pracy
  '2027-05-03', // Święto Konstytucji
  '2027-05-16', // Zielone Świątki
  '2027-05-27', // Boże Ciało
  '2027-08-15', // Wniebowzięcie NMP
];

/** Wszystkie dni od–do włącznie, jako daty ISO. */
function zakres(od, doDnia) {
  const dni = [];
  const d = new Date(od + 'T00:00:00Z');
  const koniec = new Date(doDnia + 'T00:00:00Z');
  while (d <= koniec) {
    dni.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dni;
}

/** Przerwy z § 3 umowy. */
const PRZERWY = [
  ...zakres('2026-12-23', '2026-12-31'), // przerwa bożonarodzeniowa
  ...zakres('2027-02-08', '2027-02-12'), // ferie zimowe
  ...zakres('2027-03-26', '2027-03-29'), // wiosenna przerwa świąteczna
  ...zakres('2027-05-27', '2027-05-30'), // długi weekend — Boże Ciało
  ...zakres('2027-07-26', '2027-08-06'), // przerwa wakacyjna
];

export const DNI_WOLNE = new Set([...SWIETA, ...PRZERWY]);
