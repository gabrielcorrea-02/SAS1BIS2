// utils/format.js
function formatTimestamp(ts) {
  if (!ts) return '-';
  const date = new Date(ts);
  
  // Ajuste UTC-4
  const utc4 = new Date(date.getTime() - (4 * 60 * 60 * 1000));

  const dia = String(utc4.getDate()).padStart(2, '0');
  const mes = String(utc4.getMonth() + 1).padStart(2, '0');
  const ano = utc4.getFullYear();

  const horas = String(utc4.getHours()).padStart(2, '0');
  const mins = String(utc4.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${horas}:${mins}`;
}

module.exports = formatTimestamp;
