/**
 * Compara un tiro con la defensa y devuelve puntos para el defensor:
 * - 0 puntos: no acierta ni altura ni dirección
 * - 1 punto: acierta solo altura o solo dirección
 * - 2 puntos: acierta altura y dirección
 *
 * shoot: { height: 'alta'|'media'|'baja', direction: 'izquierda'|'centro'|'derecha' }
 * defend: { height: 'alta'|'media'|'baja', direction: 'izquierda'|'centro'|'derecha' }
 */
export function compare(shoot, defend) {
  if (!shoot || !defend) return 0;

  let points = 0;
  if (shoot.height === defend.height) points++;
  if (shoot.direction === defend.direction) points++;

  return points; // puntos para el defensor
}

/**
 * Calcula los puntos de ambos jugadores y determina el ganador
 *
 * p1: { shoot, defend }
 * p2: { shoot, defend }
 *
 * Retorna:
 * {
 *   player1: { score, shoot, defend },
 *   player2: { score, shoot, defend },
 *   winner: 'Jugador 1' | 'Jugador 2' | 'Empate'
 * }
 */
export function calculateScores(p1, p2) {
  // Puntos para defensores
  const score1 = compare(p2.shoot, p1.defend); // jugador 1 defiende tiro de jugador 2
  const score2 = compare(p1.shoot, p2.defend); // jugador 2 defiende tiro de jugador 1

  let winner;
  if (score1 > score2) winner = "Jugador 1";
  else if (score2 > score1) winner = "Jugador 2";
  else winner = "Empate";

  return {
    player1: { score: score1, ...p1 },
    player2: { score: score2, ...p2 },
    winner,
  };
}
