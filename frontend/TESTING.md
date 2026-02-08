# Todo App MVP - Testing Guide

## Overview
This guide provides step-by-step instructions to test User Story 1 (View Task List) and User Story 2 (Add New Task).

## Prerequisites
1. Backend API running at `http://localhost:8000`
2. Frontend development server running at `http://localhost:3000`
3. User account created (use signup page)

## Test Plan

### Setup

1. **Start Backend API**
   ```bash
   cd backend
   # Start your FastAPI server
   ```

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Create Test User**
   - Navigate to http://localhost:3000/signup
   - Create a test account with email and password
   - You should be automatically redirected to /dashboard after signup

---

## User Story 1: View Task List

### Test Case 1.1: Access Dashboard (Protected Route)
**Expected Behavior:** Only authenticated users can access the dashboard

**Steps:**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3000/dashboard`
3. Verify you are redirected to `/signin`
4. Sign in with valid credentials
5. Verify you are redirected back to `/dashboard`

**Pass Criteria:**
- [ ] Unauthenticated users are redirected to `/signin`
- [ ] Authenticated users can access `/dashboard`
- [ ] Loading spinner shows during authentication check

---

### Test Case 1.2: View Empty Task List
**Expected Behavior:** Empty state is displayed when no tasks exist

**Steps:**
1. Sign in to dashboard with a new account (no tasks)
2. Observe the task list area

**Pass Criteria:**
- [ ] Empty state message displays: "No tasks yet. Add your first task!"
- [ ] Clipboard icon is visible
- [ ] No error messages are shown
- [ ] Task creation form is visible above empty state

---

### Test Case 1.3: View Task List with Tasks
**Expected Behavior:** Tasks are displayed in a list with proper formatting

**Steps:**
1. Add 3-5 tasks using the "Add Task" form
2. Observe the task list

**Pass Criteria:**
- [ ] All tasks are displayed in the list
- [ ] Each task shows a checkbox and title
- [ ] Tasks are displayed in reverse chronological order (newest first)
- [ ] Tasks have proper spacing and borders
- [ ] Hover effect shows on task items

---

### Test Case 1.4: Toggle Task Completion
**Expected Behavior:** Tasks can be marked as complete/incomplete

**Steps:**
1. Create a new task
2. Click the checkbox to mark it complete
3. Observe the visual changes
4. Click the checkbox again to mark it incomplete

**Pass Criteria:**
- [ ] Clicking checkbox toggles completion status
- [ ] Completed tasks show strikethrough text
- [ ] Completed tasks show reduced opacity (gray text)
- [ ] Completed tasks display green checkmark icon with "Completed" label
- [ ] Changes persist after page refresh
- [ ] Optimistic UI update (immediate visual feedback)

---

### Test Case 1.5: Loading State
**Expected Behavior:** Loading spinner shows while fetching tasks

**Steps:**
1. Open browser DevTools Network tab
2. Throttle network to "Slow 3G"
3. Refresh the dashboard page
4. Observe loading state

**Pass Criteria:**
- [ ] Spinner displays while tasks are loading
- [ ] Loading spinner is centered on page
- [ ] No error messages during loading
- [ ] Task list appears after loading completes

---

### Test Case 1.6: Error Handling
**Expected Behavior:** Error state with retry option when fetch fails

**Steps:**
1. Stop the backend API server
2. Refresh the dashboard page
3. Observe error state
4. Restart backend API
5. Click "Retry" button

**Pass Criteria:**
- [ ] Error message displays clearly
- [ ] Red error icon and styling shown
- [ ] "Retry" button is present and clickable
- [ ] Clicking retry re-fetches tasks successfully
- [ ] Error message describes the problem (e.g., "Failed to Load Tasks")

---

### Test Case 1.7: Responsive Design
**Expected Behavior:** Dashboard works on mobile, tablet, and desktop

**Steps:**
1. Open browser DevTools
2. Toggle device toolbar
3. Test at different viewport sizes:
   - Mobile: 320px width
   - Tablet: 768px width
   - Desktop: 1440px width

**Pass Criteria:**
- [ ] Layout adjusts properly at all breakpoints
- [ ] Task list is readable on mobile (no horizontal scroll)
- [ ] Task creation form stacks vertically on mobile
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Text is readable without zooming

---

## User Story 2: Add New Task

### Test Case 2.1: Create Task - Valid Input
**Expected Behavior:** Task is created and added to the list

**Steps:**
1. Navigate to dashboard
2. Enter "Buy groceries" in task title input
3. Click "Add Task" button
4. Observe the result

**Pass Criteria:**
- [ ] Task appears at the top of the list
- [ ] Input field is cleared after submission
- [ ] New task has unchecked checkbox
- [ ] New task persists after page refresh
- [ ] "Add Task" button shows loading state during creation

---

### Test Case 2.2: Create Task - Empty Title Validation
**Expected Behavior:** Error message prevents empty task creation

**Steps:**
1. Leave task title input empty
2. Click "Add Task" button
3. Observe validation error

**Pass Criteria:**
- [ ] Error message displays: "Task title is required"
- [ ] Error appears below input field in red
- [ ] Task is NOT created
- [ ] Input field shows red border
- [ ] Focus remains on input field

---

### Test Case 2.3: Create Task - Character Limit Validation
**Expected Behavior:** Tasks cannot exceed 500 characters

**Steps:**
1. Enter a title with 501+ characters
2. Click "Add Task" button
3. Observe validation error

**Pass Criteria:**
- [ ] Error message displays: "Task title must not exceed 500 characters"
- [ ] Task is NOT created
- [ ] Error styling applied to input

---

### Test Case 2.4: Create Task - Minimum Length
**Expected Behavior:** Tasks must be at least 1 character

**Steps:**
1. Enter a single character task title
2. Click "Add Task" button

**Pass Criteria:**
- [ ] Task is created successfully
- [ ] Single character title is displayed correctly

---

### Test Case 2.5: Create Task - Special Characters
**Expected Behavior:** Special characters are allowed in task titles

**Steps:**
1. Create tasks with various special characters:
   - "Buy @groceries #important"
   - "Task with emoji 🎉"
   - "Task with symbols: $100 & more"
2. Observe the results

**Pass Criteria:**
- [ ] All special characters are preserved
- [ ] Emojis display correctly
- [ ] No character encoding issues

---

### Test Case 2.6: Create Task - Loading State
**Expected Behavior:** Button shows loading state during API request

**Steps:**
1. Open DevTools Network tab
2. Throttle network to "Slow 3G"
3. Enter a task title
4. Click "Add Task" button
5. Observe button state

**Pass Criteria:**
- [ ] Button shows spinner icon while loading
- [ ] Button text remains visible
- [ ] Button is disabled during request (cannot double-submit)
- [ ] Input field is disabled during request

---

### Test Case 2.7: Create Task - Network Error Handling
**Expected Behavior:** Error message displayed when creation fails

**Steps:**
1. Stop backend API server
2. Enter a task title
3. Click "Add Task" button
4. Observe error handling

**Pass Criteria:**
- [ ] Error message displays in red box
- [ ] Error describes the problem (network error, validation error, etc.)
- [ ] Input field retains entered text
- [ ] User can dismiss error message
- [ ] After dismissing, user can retry

---

### Test Case 2.8: Create Multiple Tasks Quickly
**Expected Behavior:** Multiple tasks can be created in succession

**Steps:**
1. Create 5 tasks rapidly:
   - "Task 1"
   - "Task 2"
   - "Task 3"
   - "Task 4"
   - "Task 5"
2. Observe the results

**Pass Criteria:**
- [ ] All 5 tasks appear in the list
- [ ] Tasks appear in correct order (Task 5 at top, Task 1 at bottom)
- [ ] No duplicate tasks
- [ ] No tasks are lost
- [ ] No race conditions or UI glitches

---

### Test Case 2.9: Create Task and Toggle Completion
**Expected Behavior:** Newly created tasks can be immediately toggled

**Steps:**
1. Create a new task
2. Immediately click the checkbox to mark complete
3. Observe the result

**Pass Criteria:**
- [ ] Task can be toggled immediately after creation
- [ ] Completion status persists

---

### Test Case 2.10: Responsive Form Behavior
**Expected Behavior:** Form works on all screen sizes

**Steps:**
1. Test form on mobile (320px), tablet (768px), and desktop (1440px)

**Pass Criteria:**
- [ ] Mobile: Input and button stack vertically
- [ ] Tablet/Desktop: Input and button are side-by-side
- [ ] Input field uses full available width
- [ ] Button is appropriately sized for touch on mobile

---

## Integration Tests

### Test Case I.1: Full User Flow
**Expected Behavior:** Complete user journey works end-to-end

**Steps:**
1. Sign up with new account
2. Redirected to dashboard with empty state
3. Create 3 tasks
4. Mark 2 tasks as complete
5. Refresh page
6. Verify all tasks and states persist
7. Log out
8. Log back in
9. Verify tasks are still present

**Pass Criteria:**
- [ ] All steps complete without errors
- [ ] Data persists across page refreshes
- [ ] Data persists across login/logout cycles
- [ ] User cannot access other users' tasks

---

### Test Case I.2: Concurrent User Sessions
**Expected Behavior:** Multiple users can use the app simultaneously

**Steps:**
1. Sign in with User A in Chrome
2. Sign in with User B in Firefox (or incognito)
3. Create tasks for both users
4. Verify each user only sees their own tasks

**Pass Criteria:**
- [ ] User A sees only their tasks
- [ ] User B sees only their tasks
- [ ] No cross-user data leakage

---

## Performance Tests

### Test Case P.1: Large Task List
**Expected Behavior:** Dashboard handles 50+ tasks efficiently

**Steps:**
1. Create 50+ tasks
2. Scroll through the list
3. Toggle several tasks
4. Observe performance

**Pass Criteria:**
- [ ] Page loads in under 3 seconds
- [ ] Scrolling is smooth (no lag)
- [ ] Toggling tasks is instant (optimistic UI)
- [ ] No memory leaks or performance degradation

---

## Accessibility Tests

### Test Case A.1: Keyboard Navigation
**Expected Behavior:** All functionality accessible via keyboard

**Steps:**
1. Navigate dashboard using only keyboard (Tab, Enter, Space)
2. Create a task using keyboard
3. Toggle task completion using keyboard

**Pass Criteria:**
- [ ] Can navigate all interactive elements with Tab
- [ ] Can submit form with Enter
- [ ] Can toggle checkbox with Space
- [ ] Focus indicators are visible
- [ ] Tab order is logical

---

### Test Case A.2: Screen Reader Compatibility
**Expected Behavior:** Screen readers can interpret all UI elements

**Steps:**
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate dashboard
3. Create a task
4. Toggle task completion

**Pass Criteria:**
- [ ] All text is read correctly
- [ ] Form labels are associated with inputs
- [ ] Button purposes are clear
- [ ] Error messages are announced
- [ ] Loading states are announced

---

## Browser Compatibility

Test all functionality in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Summary Checklist

**User Story 1 - View Task List:**
- [ ] Protected route authentication works
- [ ] Empty state displays correctly
- [ ] Tasks display in list format
- [ ] Task completion toggle works
- [ ] Loading state displays
- [ ] Error handling with retry works
- [ ] Responsive design on all screen sizes

**User Story 2 - Add New Task:**
- [ ] Task creation with valid input works
- [ ] Form validation (required, min/max length) works
- [ ] Input field clears after submission
- [ ] Loading state during creation works
- [ ] Error handling for failed creation works
- [ ] Multiple tasks can be created rapidly
- [ ] Responsive form behavior works

**Integration:**
- [ ] Full user flow works end-to-end
- [ ] Data persists across sessions
- [ ] Multi-user isolation works

**Performance:**
- [ ] Handles 50+ tasks efficiently

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

**Browser Compatibility:**
- [ ] Works in all major browsers

---

## Known Issues / Limitations

(Document any known issues discovered during testing)

---

## Test Results

| Test Case | Status | Notes | Date |
|-----------|--------|-------|------|
| 1.1 | ⬜ Pending | | |
| 1.2 | ⬜ Pending | | |
| ... | | | |

---

## Contact

For issues or questions, please contact the development team.
