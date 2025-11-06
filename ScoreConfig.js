// ===== SCORE CONFIGURATION =====
// Purpose: Configuration for CLB Box Score Automation defining sheet layout and behavior.
// Dependencies: None (base configuration)
// Entry Point(s): BOX_SCORE_CONFIG object referenced by all modules

var BOX_SCORE_CONFIG = {

  // ===== GAME SHEET IDENTIFICATION =====
  // Prefix for game sheets (replaces hardcoded "#")
  GAME_SHEET_PREFIX: "#",

  // ===== AUTOMATION FEATURES =====

  // AUTO PITCHER CHANGE NOTATION
  // When true: Automatically inserts PC[X] notation when you change pitcher dropdown
  // - Calculates inherited runners from current inning state
  // - Inserts notation in the next available at-bat cell
  // - Shows toast notification with inherited runner count
  // Set to false if you prefer to manually enter PC[X] notations
  AUTO_INSERT_PITCHER_CHANGE: true,

  // REAL-TIME SCORING (HYBRID MODE)
  // When true: Stats update automatically after each at-bat entry
  // - Runs bulk processor in background after every at-bat
  // - Provides immediate visual feedback as you score
  // - Uses reliable "absolute state" calculation (recalculates all stats from scratch)
  // - Slightly slower during data entry but eliminates manual "Process Stats" clicks
  //
  // When false: Stats only update when you click "Process Game Stats" menu
  // - Fastest data entry (no processing during input)
  // - Must manually process stats to see updated numbers
  // - Best for entering historical games or batch entry
  AUTO_PROCESS_ON_AT_BAT: true,

  // DEBUG LOGGING
  // Controls whether logging is enabled for debugging purposes
  DEBUG: {
    ENABLE_LOGGING: true
  },

  // ===== PITCHER TRACKING =====
  // Dropdown cells for active pitchers
  AWAY_PITCHER_CELL: "D3",
  HOME_PITCHER_CELL: "D4",
  
  // ===== AT-BAT ENTRY RANGES =====
  // Where users enter at-bat results during live games
  AWAY_ATBAT_RANGE: {
    startRow: 7,      // First batter row
    endRow: 15,       // Last batter row (9 batters)
    startCol: 3,      // Column C (inning 1)
    endCol: 8         // Column H (inning 6)
  },
  HOME_ATBAT_RANGE: {
    startRow: 18,     // First batter row
    endRow: 26,       // Last batter row (9 batters)
    startCol: 3,      // Column C (inning 1)
    endCol: 8         // Column H (inning 6)
  },
  
  // ===== PITCHER STATS LAYOUT =====
  // Columns I-O contain pitching statistics
  // Order: IP, BF, H, HR, R, BB, K
  PITCHER_STATS_COLUMNS: {
    IP: 9,    // Column I - Innings Pitched
    BF: 10,   // Column J - Batters Faced
    H: 11,    // Column K - Hits Allowed
    HR: 12,   // Column L - Home Runs Allowed
    R: 13,    // Column M - Runs Allowed
    BB: 14,   // Column N - Walks Allowed
    K: 15     // Column O - Strikeouts
  },

  // 0-based relative indices for processing pitcher stat arrays
  PITCHER_STATS_INDICES: {
    IP: 0,    // (Column I = 9) - 9 = 0
    BF: 1,    // (Column J = 10) - 9 = 1
    H: 2,
    HR: 3,
    R: 4,
    BB: 5,
    K: 6
  },
  
  // ===== FIELDING STATS LAYOUT =====
  // Columns P-R contain defensive statistics
  FIELDING_STATS_COLUMNS: {
    NP: 16,   // Column P - Nice Plays
    E: 17,    // Column Q - Errors
    SB: 18    // Column R - Stolen Bases (for batters)
  },

  // 0-based relative indices for processing fielding stat arrays
  FIELDING_STATS_INDICES: {
    NP: 0,    // (Column P = 16) - 16 = 0
    E: 1,
    SB: 2
  },
  
  // ===== HITTING STATS LAYOUT =====
  // Columns C-K contain batting statistics
  // Order: AB, H, HR, RBI, BB, K, ROB, DP, TB
  HITTING_STATS_COLUMNS: {
    AB: 3,    // Column C - At Bats
    H: 4,     // Column D - Hits
    HR: 5,    // Column E - Home Runs
    RBI: 6,   // Column F - Runs Batted In
    BB: 7,    // Column G - Walks
    K: 8,     // Column H - Strikeouts
    ROB: 9,   // Column I - Reached On Base (hits stolen via nice plays)
    DP: 10,   // Column J - Double Plays
    TB: 11    // Column K - Total Bases
  },

  // 0-based relative indices for processing hitting stat arrays
  HITTING_STATS_INDICES: {
    AB: 0,    // (Column C = 3) - 3 = 0
    H: 1,     // (Column D = 4) - 3 = 1
    HR: 2,
    RBI: 3,
    BB: 4,
    K: 5,
    ROB: 6,
    DP: 7,
    TB: 8
  },
  
  // ===== PITCHER/FIELDER ROSTER RANGES =====
  // Where player names and positions are listed (also where pitching/fielding stats go)
  AWAY_PITCHER_RANGE: {
    startRow: 7,      // First data row (row 6 is header)
    endRow: 15,       // Last data row (row 16 is team totals)
    numPlayers: 9,    // Number of players
    nameCol: 2,       // Column B - Player names
    positionCol: 1,   // Column A - Positions (P, C, 1B, etc.)
    statsStartCol: 9  // Column I - Where stats begin
  },
  HOME_PITCHER_RANGE: {
    startRow: 18,     // First data row (row 17 is header)
    endRow: 26,       // Last data row (row 27 is team totals)
    numPlayers: 9,    // Number of players
    nameCol: 2,       // Column B - Player names
    positionCol: 1,   // Column A - Positions (P, C, 1B, etc.)
    statsStartCol: 9  // Column I - Where stats begin
  },
  
  // ===== HITTING ROSTER RANGES =====
  // Where batting statistics are displayed (separate from pitching/fielding)
  HITTING_RANGE: {
    awayStartRow: 30,   // First away batter (row 29 is header)
    awayEndRow: 38,     // Last away batter (row 39 is team totals)
    homeStartRow: 41,   // First home batter (row 40 is header)
    homeEndRow: 49,     // Last home batter (row 50 is team totals)
    numPlayers: 9,      // Number of batters per team
    nameCol: 2,         // Column B - Player names
    statsStartCol: 3,   // Column C - Where hitting stats begin
    numStatCols: 9      // Number of stat columns (C through K)
  },
  
  // ===== PROTECTED ROWS (NEVER MODIFY THESE) =====
  // These rows contain headers, formulas, or team totals
  // Scripts should NEVER write to these rows
  PROTECTED_ROWS: [
    6,    // Away team pitching/fielding header
    16,   // Away team pitching/fielding totals
    17,   // Home team pitching/fielding header
    27,   // Home team pitching/fielding totals
    29,   // Away team hitting header
    39,   // Away team hitting totals
    40,   // Home team hitting header
    50    // Home team hitting totals
  ]
};