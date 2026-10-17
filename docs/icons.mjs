const paths={
 download:'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',
 search:'M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0 M16 16l5 5',
 today:'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2 M9 14h6v5H9z',
 week:'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2 M7 14h10 M7 18h10',
 left:'M19 12H5 M12 19l-7-7 7-7',right:'M5 12h14 M12 5l7 7-7 7',
 calendar:'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
 external:'M15 3h6v6 M10 14L21 3 M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5',
 prev:'M15 18l-6-6 6-6',next:'M9 18l6-6-6-6',
 current:'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
 sun:'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
 moon:'M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z',
 pin:'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
 flag:'M5 21V4 M5 4h10.5l-1.8 4 1.8 4H5',
 plus:'M12 5v14 M5 12h14',close:'M6 6l12 12 M6 18L18 6',down:'M7 7h10v10 M7 7l10 10',up:'M7 14l5-5 5 5 M12 9v12'
};
export function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.75');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.classList.add('icon');const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',paths[name]);svg.append(p);return svg;}

