Act as a Senior Frontend and Google Apps Script Developer working on the "EDECS HR Mobilization Management System". I need to enhance the Candidates Table in our Single Page Application (SPA) by adding a compact Quick Actions Toolbar column.

---

### 1. Requirements Overview

#### A. New Table Column
- Add a new column titled **"Buttons"** at the far right of the Candidates Table (immediately following the existing "Actions" column).
- Update both `<thead>` header structure and `<tbody>` row rendering logic in `Script.html` (`Views._candidateTableHtml`).

#### B. Quick Actions Toolbar (5 Icon Buttons)
Render a horizontal flex group of 5 compact icon buttons with hover tooltips for each candidate row:

1. **[Add Event]**
   - **Icon**: Calendar Plus (`📅⁺` or `calendar-plus` SVG/icon)
   - **Tooltip**: "Schedule Calendar Event"
   - **Action**: Invoke `Views._openEventModal(candidateId)` to schedule an operational follow-up / reminder in Google Calendar.

2. **[Update Status]**
   - **Icon**: Dual Rotating Arrows / Sync (`🔄`)
   - **Tooltip**: "Update Mobilization Status"
   - **Action**: Invoke `Views._openStatusModal(candidateId, candidateName)` to transition the candidate stage.

3. **[Edit Profile]**
   - **Icon**: Pen / User Edit (`✏️`)
   - **Tooltip**: "Edit Candidate Profile"
   - **Action**: Invoke `Views._openEditProfileModal(candidateId)` to launch the profile editing modal.

4. **[Upload Document]**
   - **Icon**: Cloud Upload / File Upload (`📤`)
   - **Tooltip**: "Upload Candidate Document"
   - **Action**: Invoke `Views._openUploadModal(candidateId, driveFolderId)` to attach files directly to the candidate's Google Drive folder.

5. **[Copy Local Path]**
   - **Icon**: Directory Clipboard / Folder (`🗂️` or `📋`)
   - **Tooltip**: "Copy Local File Path"
   - **Action**: On click, construct and copy the candidate's network archive path to the clipboard:
     `U:\HR\06. Employee Database\06.1 Employee Personal Files\[Candidate Name]`
   - **Behavior**:
     - Properly handle character escaping and double backslashes (`\\`).
     - Use `navigator.clipboard.writeText` with an `execCommand('copy')` fallback for browser compatibility.
     - Provide visual feedback (temporary icon change to `✅` for 1.2s and `Toast.success('Local path copied to clipboard.')`).

---

### 2. Files & Modifications Required

#### A. Table Renderer (`Script.html`)
- Update `Views._candidateTableHtml(rows)`:
  - Add `<th scope="col">Buttons</th>` at the end of the `<thead>` row.
  - Add a corresponding `<td>` cell at the end of each `<tr>` containing a `.quick-action-toolbar` container.
- Implement `Views._copyCandidateLocalPath(btnEl, candidateName)`:
  - Construct string: `'U:\\HR\\06. Employee Database\\06.1 Employee Personal Files\\' + candidateName`.
  - Perform async clipboard copy with fallback and UI feedback.

#### B. CSS Styling System (`Styles.html`)
- Add `.quick-action-toolbar` flex layout with tight gap (`4px`).
- Style `.quick-action-btn` icon buttons:
  - Dimensions: `28px x 28px` compact icon button.
  - Border radius: `var(--radius-sm)`.
  - Subtle hover background transitions (`var(--bg-hover)`) and active scale state.
- Add CSS tooltips or standard `title` attributes for clear hover guidance.
- Ensure seamless contrast and layout balance in dark mode (`body.dark-mode`).

---

### 3. Execution Constraints
- Ensure table row height remains balanced, compact, and aligned across all viewports.
- Do not modify existing candidate data bindings, column indexes, or backend API call signatures in `Code.gs` or `Database.gs`.
- Maintain full responsiveness across desktop and tablet screens.