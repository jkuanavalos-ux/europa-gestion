// Colores de las tarjetas (repertorios y fechas). Paleta cerrada: solo se aceptan estos valores,
// así un dato mal formado nunca llega al estilo de la página.
export const COLORS = [
  ['Rojo', '#b5483e'], ['Naranja', '#d9822b'], ['Dorado', '#c9a227'], ['Verde', '#2f6b45'], ['Turquesa', '#2a8c8c'],
  ['Azul', '#3a63a8'], ['Violeta', '#7b58a6'], ['Rosa', '#c45c8a'], ['Gris', '#6b6b63']
];

const VALID = new Set(COLORS.map(([, hex]) => hex));
// Devuelve el color si está en la paleta; si no, '' (sin color).
export const safeColor = value => {
  const hex = String(value ?? '').trim().toLowerCase();
  return VALID.has(hex) ? hex : '';
};

// Selector de color para los formularios: círculos para elegir, más «Sin color».
export function colorPicker(selected) {
  const current = safeColor(selected);
  return `<fieldset class="colors"><legend>Color de la tarjeta</legend>`
    + `<label class="swatch none"><input type="radio" name="color" value=""${current ? '' : ' checked'}><span title="Sin color" aria-label="Sin color">∅</span></label>`
    + COLORS.map(([name, hex]) => `<label class="swatch"><input type="radio" name="color" value="${hex}"${hex === current ? ' checked' : ''}><span style="background:${hex}" title="${name}" aria-label="${name}"></span></label>`).join('')
    + `</fieldset>`;
}
