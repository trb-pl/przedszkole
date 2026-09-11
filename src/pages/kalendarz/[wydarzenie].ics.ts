// Plik .ics każdego wydarzenia z /wydarzenia — dla iPhone'a, Maca i Outlooka.
// Kalendarz Google dostaje zamiast pliku link z gotowym wpisem (linkGoogle).
//
// Pliki powstają przy buildzie obok kalendarzy planu zajęć; nagłówek
// Content-Type dla /kalendarz/* ustawia vercel.json.
import type { APIRoute } from 'astro';
import { WYDARZENIA, idWydarzenia, icsWydarzenia } from '~/data/wydarzenia.mjs';

export function getStaticPaths() {
  return WYDARZENIA.map((w) => ({
    params: { wydarzenie: `wydarzenie-${idWydarzenia(w)}` },
    props: { w },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(icsWydarzenia(props.w), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
