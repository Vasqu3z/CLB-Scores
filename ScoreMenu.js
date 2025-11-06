// ===== SCORE MENU MODULE =====
// Purpose: User interface, menu system, and stat viewers for Box Score automation.
// Dependencies: ScoreConfig.js, ScoreUtility.js
// Entry Point(s): onOpen, addBoxScoreMenu, showPitcherStats, showBatterStats, resetCurrentGame

/**
 * Create custom menu when spreadsheet opens
 */
function onOpen() {
  addBoxScoreMenu();
}

/**
 * Add Box Score menu to UI
 */
function addBoxScoreMenu() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('📊 Box Score Tools')
    .addItem('🚀 Process Game Stats', 'processGameStatsBulk')
    .addSeparator()
    .addItem('⚾ View Pitcher Stats', 'showPitcherStats')
    .addItem('🏏 View Hitting Stats', 'showBatterStats')
    .addSeparator()
    .addItem('🗑️ Reset Game Stats', 'resetCurrentGame')
    .addToUi();
}

// ===== STAT VIEWERS =====

/**
 * Show pitcher stats viewer - Condensed format, separated by team, in pitching order
 * Reads stats directly from the sheet
 */
function showPitcherStats() {
  var sheet = SpreadsheetApp.getActiveSheet();

  // Get rosters IN ORDER using config
  var awayRange = BOX_SCORE_CONFIG.AWAY_PITCHER_RANGE;
  var homeRange = BOX_SCORE_CONFIG.HOME_PITCHER_RANGE;
  var pitcherCols = BOX_SCORE_CONFIG.PITCHER_STATS_COLUMNS;

  var awayRoster = sheet.getRange(awayRange.startRow, awayRange.nameCol, awayRange.numPlayers, 1).getValues();
  var homeRoster = sheet.getRange(homeRange.startRow, homeRange.nameCol, homeRange.numPlayers, 1).getValues();

  // Read pitcher stats from sheet
  var numPitcherCols = Object.keys(pitcherCols).length;
  var awayStats = sheet.getRange(awayRange.startRow, pitcherCols.IP, awayRange.numPlayers, numPitcherCols).getValues();
  var homeStats = sheet.getRange(homeRange.startRow, pitcherCols.IP, homeRange.numPlayers, numPitcherCols).getValues();

  var pIdx = BOX_SCORE_CONFIG.PITCHER_STATS_INDICES;

  var message = "╔═══════════════════════════════════╗\n";
  message += "║       PITCHING STATS SUMMARY         ║\n";
  message += "╚═══════════════════════════════════╝\n\n";

  // Away team
  message += "──── AWAY TEAM ────\n";
  var awayCount = 0;
  for (var i = 0; i < awayRoster.length; i++) {
    var name = awayRoster[i][0];
    var stats = awayStats[i];
    if (name && stats[pIdx.IP] > 0) {
      var paddedName = (name + "            ").substring(0, 12);
      message += paddedName + ": " +
                 stats[pIdx.IP].toFixed(2) + " IP, " +
                 stats[pIdx.H] + " H, " +
                 stats[pIdx.R] + " R, " +
                 stats[pIdx.BB] + " BB, " +
                 stats[pIdx.K] + " K\n";
      awayCount++;
    }
  }
  if (awayCount === 0) {
    message += "(No pitching stats yet)\n";
  }

  message += "\n──── HOME TEAM ────\n";
  var homeCount = 0;
  for (var i = 0; i < homeRoster.length; i++) {
    var name = homeRoster[i][0];
    var stats = homeStats[i];
    if (name && stats[pIdx.IP] > 0) {
      var paddedName = (name + "            ").substring(0, 12);
      message += paddedName + ": " +
                 stats[pIdx.IP].toFixed(2) + " IP, " +
                 stats[pIdx.H] + " H, " +
                 stats[pIdx.R] + " R, " +
                 stats[pIdx.BB] + " BB, " +
                 stats[pIdx.K] + " K\n";
      homeCount++;
    }
  }
  if (homeCount === 0) {
    message += "(No pitching stats yet)\n";
  }

  message += "\n" + "─".repeat(40) + "\n";
  message += "Format: IP, H, R, BB, K\n";
  message += "Order: Roster order (for W/L/SV tracking)";

  var ui = SpreadsheetApp.getUi();
  ui.alert('Pitcher Stats', message, ui.ButtonSet.OK);
}

/**
 * Show batter stats viewer - Baseball statline format, separated by team, in batting order
 * Reads stats directly from the sheet
 */
function showBatterStats() {
  var sheet = SpreadsheetApp.getActiveSheet();

  // Get rosters IN BATTING ORDER using config
  var hittingRange = BOX_SCORE_CONFIG.HITTING_RANGE;
  var hittingCols = BOX_SCORE_CONFIG.HITTING_STATS_COLUMNS;

  var awayRoster = sheet.getRange(hittingRange.awayStartRow, hittingRange.nameCol, hittingRange.numPlayers, 1).getValues();
  var homeRoster = sheet.getRange(hittingRange.homeStartRow, hittingRange.nameCol, hittingRange.numPlayers, 1).getValues();

  // Read hitting stats from sheet
  var awayStats = sheet.getRange(hittingRange.awayStartRow, hittingCols.AB, hittingRange.numPlayers, hittingRange.numStatCols).getValues();
  var homeStats = sheet.getRange(hittingRange.homeStartRow, hittingCols.AB, hittingRange.numPlayers, hittingRange.numStatCols).getValues();

  var hIdx = BOX_SCORE_CONFIG.HITTING_STATS_INDICES;

  var message = "╔═══════════════════════════════════╗\n";
  message += "║        BATTING STATS SUMMARY         ║\n";
  message += "╚═══════════════════════════════════╝\n\n";

  // Away team
  message += "──── AWAY TEAM ────\n";
  for (var i = 0; i < awayRoster.length; i++) {
    var name = awayRoster[i][0];
    var stats = awayStats[i];
    if (name && stats[hIdx.AB] > 0) {
      var paddedName = (name + "          ").substring(0, 10);
      var line = (i + 1) + ". " + paddedName + ": " + stats[hIdx.H] + "-" + stats[hIdx.AB];

      // HR
      if (stats[hIdx.HR] > 0) {
        line += ", " + stats[hIdx.HR] + "HR";
      }

      // Other XBH (approximate from TB)
      var otherXBH = stats[hIdx.TB] - stats[hIdx.H] - (stats[hIdx.HR] * 3);
      if (otherXBH > 0) {
        line += ", " + otherXBH + "XBH";
      }

      // RBI
      if (stats[hIdx.RBI] > 0) {
        line += ", " + stats[hIdx.RBI] + "RBI";
      }

      // Hits Stolen (ROB)
      if (stats[hIdx.ROB] > 0) {
        line += ", " + stats[hIdx.ROB] + " Stolen";
      }

      // BB and K
      if (stats[hIdx.BB] > 0 || stats[hIdx.K] > 0) {
        line += " (" + stats[hIdx.BB] + "BB, " + stats[hIdx.K] + "K)";
      }

      message += line + "\n";
    }
  }

  message += "\n──── HOME TEAM ────\n";
  for (var i = 0; i < homeRoster.length; i++) {
    var name = homeRoster[i][0];
    var stats = homeStats[i];
    if (name && stats[hIdx.AB] > 0) {
      var paddedName = (name + "          ").substring(0, 10);
      var line = (i + 1) + ". " + paddedName + ": " + stats[hIdx.H] + "-" + stats[hIdx.AB];

      // HR
      if (stats[hIdx.HR] > 0) {
        line += ", " + stats[hIdx.HR] + "HR";
      }

      // Other XBH (approximate from TB)
      var otherXBH = stats[hIdx.TB] - stats[hIdx.H] - (stats[hIdx.HR] * 3);
      if (otherXBH > 0) {
        line += ", " + otherXBH + "XBH";
      }

      // RBI
      if (stats[hIdx.RBI] > 0) {
        line += ", " + stats[hIdx.RBI] + "RBI";
      }

      // Hits Stolen (ROB)
      if (stats[hIdx.ROB] > 0) {
        line += ", " + stats[hIdx.ROB] + " Stolen";
      }

      // BB and K
      if (stats[hIdx.BB] > 0 || stats[hIdx.K] > 0) {
        line += " (" + stats[hIdx.BB] + "BB, " + stats[hIdx.K] + "K)";
      }

      message += line + "\n";
    }
  }

  message += "\n" + "─".repeat(40) + "\n";
  message += "Format: H-AB, XBH, RBI, Hits Stolen, BB, K\n";
  message += "Order: Batting order (1-9)";

  var ui = SpreadsheetApp.getUi();
  ui.alert('Batter Stats', message, ui.ButtonSet.OK);
}

// ===== RESET GAME =====

/**
 * Reset current game - clear all stats
 */
function resetCurrentGame() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Reset Game Stats',
    'This will clear all tracked stats for this game sheet.\n\n' +
    'The following will be reset:\n' +
    '• Pitcher stats (columns I-O)\n' +
    '• Defensive stats (columns P-R)\n' +
    '• Hitting stats (columns C-K)\n' +
    '• Pitcher dropdowns (D3, D4)\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;
  
  // Ask if they want to clear at-bats too
  var clearAtBats = ui.alert(
    'Clear At-Bats?',
    'Do you also want to clear all entered at-bat results?\n\n' +
    '(This will erase the game grid C7:H15 and C18:H26)',
    ui.ButtonSet.YES_NO
  );
  
  var sheet = SpreadsheetApp.getActiveSheet();

  try {
    clearPitcherStatsInSheet(sheet);
    clearHittingStatsInSheet(sheet);
    clearPitcherDropdowns(sheet);
    
    if (clearAtBats === ui.Button.YES) {
      clearAtBatGrid(sheet);
    }
    
    ui.alert(
      'Game Reset Complete',
      'All stats have been cleared.\n\n' +
      (clearAtBats === ui.Button.YES ? 'At-bat grid has been cleared.\n\n' : '') +
      'Ready for a new game!',
      ui.ButtonSet.OK
    );

    if (BOX_SCORE_CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("INFO [Menu]: Game reset completed for sheet: " + sheet.getName());
    }
  } catch (error) {
    ui.alert('Reset Error', 'Error: ' + error.toString(), ui.ButtonSet.OK);
    if (BOX_SCORE_CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Menu]: Reset failed: " + error.toString() + " (Entity: " + sheet.getName() + ")");
    }
  }
}

