// ===== BOX SCORE TRIGGERS MODULE =====
// Orchestrates all automation via onEdit trigger
// Handles pitcher changes and at-bat entries
// NOW WITH LOCKSERVICE FOR RAPID EDIT SAFETY

/**
 * Main onEdit trigger - entry point for all automation
 * @param {Event} e - Edit event object
 */
function onEdit(e) {
  if (!e || !e.range) return;
  
  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  
  // Only run on game sheets (sheets starting with #)
  if (!sheetName.startsWith("#")) return;
  
  var cell = e.range.getA1Notation();
  var row = e.range.getRow();
  var col = e.range.getColumn();
  var newValue = e.value || "";
  
  // ===== ACQUIRE LOCK FOR SEQUENTIAL PROCESSING =====
  var lock = LockService.getScriptLock();
  var lockAcquired = false;
  
  try {
    // Wait for lock (timeout from config)
    lockAcquired = lock.tryLock(BOX_SCORE_CONFIG.LOCK_TIMEOUT_MS);
    
    if (!lockAcquired) {
      // Lock timeout - very rare, only if script hung
      var ui = SpreadsheetApp.getUi();
      ui.alert(
        'Box Score Busy',
        'Another edit is processing. Please wait and try again.',
        ui.ButtonSet.OK
      );
      logWarning("Triggers", "Lock timeout for cell: " + cell, sheetName);
      return;
    }
    
    // ===== PROCESS EDIT (WITHIN LOCK) =====
    processEdit(sheet, cell, row, col, newValue, e.oldValue, e.range);
    
  } catch (error) {
    logError("Triggers", error.toString(), sheetName + "!" + cell);
    
    // Show user-friendly error
    var ui = SpreadsheetApp.getUi();
    ui.alert(
      'Box Score Automation Error',
      'An error occurred while processing your entry.\n\n' +
      'Cell: ' + cell + '\n' +
      'Error: ' + error.toString() + '\n\n' +
      'Please check the Apps Script logs for details.',
      ui.ButtonSet.OK
    );
    
  } finally {
    // ===== ALWAYS RELEASE LOCK =====
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

/**
 * Process edit (extracted from onEdit for lock management)
 * @param {Sheet} sheet - The game sheet
 * @param {string} cell - Cell address
 * @param {number} row - Row number
 * @param {number} col - Column number
 * @param {string} newValue - New cell value
 * @param {string} oldValue - Old cell value (from event)
 * @param {Range} range - The range object from event
 */
function processEdit(sheet, cell, row, col, newValue, oldValue, range) {
  // ============================================
  // Handle pitcher dropdown changes with position swaps
  // ============================================
  if (cell === BOX_SCORE_CONFIG.AWAY_PITCHER_CELL || 
      cell === BOX_SCORE_CONFIG.HOME_PITCHER_CELL) {
    
    // Get old value for position swap
    oldValue = oldValue || "";
    
    // Handle position swap when pitcher changes
    if (oldValue && newValue && oldValue !== newValue) {
      handlePositionSwap(sheet, oldValue, newValue);
    }
    return;
  }
  
  // At-bat entries are no longer processed in onEdit
  // They will be processed by the bulk processor menu function
  if (isAtBatCell(row, col)) {
    return;
  }
}

// ============================================
// Handle Position Swaps
// ============================================

/**
 * Handle position swap when pitcher changes
 * @param {Sheet} sheet - The game sheet
 * @param {string} oldPitcher - Previous pitcher name
 * @param {string} newPitcher - New pitcher name
 */
function handlePositionSwap(sheet, oldPitcher, newPitcher) {
  if (!oldPitcher || !newPitcher || oldPitcher === newPitcher) {
    return;
  }
  
  // Find both players in roster
  var newPitcherRow = findPlayerRowByName(sheet, newPitcher);
  var oldPitcherRow = findPlayerRowByName(sheet, oldPitcher);
  
  // Edge case: New pitcher not found
  if (newPitcherRow === -1) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '⚠️ ' + newPitcher + ' not found in roster',
      'Position Swap',
      5
    );
    return;
  }
  
  // Edge case: Old pitcher not found (shouldn't happen in CLB)
  if (oldPitcherRow === -1) {
    // Just move new pitcher to P
    var posCol = BOX_SCORE_CONFIG.AWAY_PITCHER_RANGE.positionCol;
    var newPitcherPosition = sheet.getRange(newPitcherRow, posCol).getValue();
    var updatedPosition = appendPosition(newPitcherPosition, 'P');
    sheet.getRange(newPitcherRow, posCol).setValue(updatedPosition);
    
    SpreadsheetApp.getActiveSpreadsheet().toast(
      newPitcher + ' moved to P',
      'Position Swap',
      3
    );
    return;
  }
  
  // Get current positions
  var posCol = BOX_SCORE_CONFIG.AWAY_PITCHER_RANGE.positionCol;
  var newPitcherPositionCell = sheet.getRange(newPitcherRow, posCol).getValue();
  var oldPitcherPositionCell = sheet.getRange(oldPitcherRow, posCol).getValue();
  
  var newPitcherCurrentPos = getCurrentPosition(newPitcherPositionCell);
  var oldPitcherCurrentPos = getCurrentPosition(oldPitcherPositionCell);
  
  // Check if new pitcher already pitched (re-entry warning)
  var newPitcherHistory = getPositionHistory(newPitcherPositionCell);
  if (newPitcherHistory.indexOf('P') !== -1) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '⚠️ ' + newPitcher + ' already pitched this game (was at P). Allowing swap...',
      'Pitcher Re-Entry',
      5
    );
  }
  
  // Perform position swap
  var newPitcherUpdated = appendPosition(newPitcherPositionCell, 'P');
  var oldPitcherUpdated = appendPosition(oldPitcherPositionCell, newPitcherCurrentPos);
  
  sheet.getRange(newPitcherRow, posCol).setValue(newPitcherUpdated);
  sheet.getRange(oldPitcherRow, posCol).setValue(oldPitcherUpdated);
  
  // Success toast
  SpreadsheetApp.getActiveSpreadsheet().toast(
    newPitcher + ' moved to P, ' + oldPitcher + ' moved to ' + newPitcherCurrentPos,
    'Position Swap',
    3
  );
}

/**
 * Install onEdit trigger (run this once manually if needed)
 * Note: Simple onEdit triggers install automatically, but this is here for reference
 */
function installTriggers() {
  var triggers = ScriptApp.getProjectTriggers();

  // Check if onEdit trigger already exists
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onEdit') {
      logInfo("Triggers", "onEdit trigger already installed");
      return;
    }
  }

  // Simple triggers (like onEdit) don't need manual installation
  // They work automatically when the function is named "onEdit"
  logInfo("Triggers", "onEdit trigger uses simple trigger (automatic)");
}