# Testing Guide for UI Race Condition Fix

## Overview
This guide helps you verify the fix for the UI race condition where multiple receivers would get stuck in transfer screens.

## Test Scenario: Multiple Receivers

### Setup
1. Open GopherDrop in 3 different browser windows/tabs (or different devices)
   - Window 1: Sender
   - Window 2: Receiver 1
   - Window 3: Receiver 2

### Test Steps

#### Before the Fix (Expected Bug Behavior)
1. Sender selects files and chooses 2 receivers
2. Receiver 1 accepts → transfer UI shows → files download → complete screen shows ✅
3. Receiver 2 accepts → gets stuck on transfer progress screen ❌
   - Files still download successfully
   - But UI never transitions to complete screen
   - User is stuck and must manually reload

#### After the Fix (Expected Correct Behavior)
1. Sender selects files and chooses 2 receivers
2. Receiver 1 accepts → transfer UI shows → files download → complete screen shows ✅
3. Receiver 2 accepts → transfer UI shows independently → files download → complete screen shows ✅
   - Each receiver has their own UI state
   - Both complete successfully
   - No stuck screens

### What to Verify

#### For Each Receiver:
- [ ] Transfer progress overlay appears when accepting transfer
- [ ] Progress bar updates in real-time
- [ ] File list shows with progress indicators
- [ ] Network speed displays correctly
- [ ] When complete, transitions to success screen (not stuck)
- [ ] Success screen shows correct file list and stats
- [ ] Can return to home or send again

#### For the Sender:
- [ ] Can send to multiple receivers simultaneously
- [ ] Progress tracking works for all receivers
- [ ] Complete screen shows after all transfers finish

## Test Scenario: Sequential Transfers

### Test Steps
1. Complete a transfer (sender → receiver)
2. Immediately start another transfer (same sender → same receiver)
3. Verify:
   - [ ] New transfer UI initializes correctly
   - [ ] Previous transfer state doesn't interfere
   - [ ] Progress resets to 0%
   - [ ] Completes successfully

## Test Scenario: Transfer Count Accuracy

### Verify Real-time Counts
1. During transfer, check that:
   - [ ] Sender shows correct "X of Y files sent"
   - [ ] Receiver shows correct "X of Y files received"
   - [ ] Progress percentages are accurate
   - [ ] Network speed displays realistic values

## Browser Testing

### Recommended Browsers
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

### Test on Different Network Conditions
- [ ] Same device (localhost)
- [ ] LAN network
- [ ] Different network (if supported)

## Known Limitations
- This fix addresses **frontend UI race conditions only**
- Backend connection management is unchanged
- WebRTC peer connection logic is unchanged

## Debugging

If issues occur:
1. Open browser DevTools (F12)
2. Check Console for:
   - "Transfer UI already active for transaction: [id]" → Shows duplicate prevention working
   - Any errors related to overlay management
3. Check Network tab for WebSocket messages
4. Verify transaction IDs are unique in WebSocket messages

## Success Criteria
✅ Multiple receivers can accept transfers simultaneously without UI getting stuck
✅ Each receiver properly transitions through: accept → progress → complete
✅ Transfer counts are accurate throughout the process
✅ No console errors related to UI state management
✅ Overlays don't stack on top of each other
