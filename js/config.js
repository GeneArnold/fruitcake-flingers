// Settings that change per deployment rather than per game version.
export const CONFIG = {
  game: "fruitcake",
  // The family score service (backend/ in this project). null keeps every board on the phone.
  scoresUrl: null,
  // Sent with every score so random internet traffic can't post junk to the family board.
  // Not a secret: anyone with the game has it. Must match FAMILY_CODE in the backend.
  familyCode: "fruitcake-2026",
};
