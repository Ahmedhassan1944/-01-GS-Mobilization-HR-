Act as a Senior Frontend and Google Apps Script Developer working on the "EDECS HR Mobilization Management System". I need to fix the folder path clipboard-copy logic in `Script.html` for the "Copy Local Path" action button in the Candidates table.

### Problem Diagnosis
1. The existing function copies the full multi-part name (e.g., "Ahmed Tawfik Elsdeq") instead of strictly the first two names ("Ahmed Tawfik").
2. The copied string contains over-escaped double backslashes (`\\\\`), resulting in an invalid path like `U:\\\\HR\\\\06. Employee Database\\\\...` when pasted into Windows File Explorer.

---

### Specifications & Requirements

1. **First Two Names Extraction**:
   - Extract strictly the first two names from the candidate's full name string (e.g., `"Ahmed Tawfik Elsdeq"` ➔ `"Ahmed Tawfik"`).
   - Trim extra spaces and handle single-word names gracefully.

2. **Clean Windows Path Format**:
   - Construct the path using raw single backslashes for a valid Windows directory:
     `U:\HR\06. Employee Database\06.1 Employee Personal Files\[First Two Names]`
   - Target Output Example: `U:\HR\06. Employee Database\06.1 Employee Personal Files\Ahmed Tawfik`

3. **Clipboard Copying**:
   - Primary method: `navigator.clipboard.writeText(path)`.
   - Fallback method: `document.execCommand('copy')` via an off-screen `<textarea>` for older browsers or non-secure origins.

4. **Visual UI Feedback**:
   - On click, trigger `Toast.success('Local path copied to clipboard.')`.
   - Flash the button icon temporarily to `✅` for 1.2 seconds, then restore the original `🗂️` icon.

---

### Updated Function Implementation (`Script.html`)

Please update `Views._copyCandidateLocalPath(btnEl, candidateName)` in `Script.html` with the following implementation:

```javascript
_copyCandidateLocalPath(btnEl, candidateName) {
  // 1. Extract strictly the first two names
  const nameParts = (candidateName || '').trim().split(/\s+/).slice(0, 2);
  const shortName = nameParts.join(' ');

  // 2. Construct clean Windows path with single backslashes
  const path = 'U:\\HR\\06. Employee Database\\06.1 Employee Personal Files\\' + shortName;
  const originalHtml = btnEl.innerHTML;

  const onSuccess = () => {
    btnEl.innerHTML = '✅';
    Toast.success('Local path copied to clipboard.');
    setTimeout(() => { btnEl.innerHTML = originalHtml; }, 1200);
  };

  // 3. Copy to clipboard with fallback
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(path).then(onSuccess).catch(err => {
      console.error('Failed to copy local path:', err);
      Toast.error('Failed to copy local path.');
    });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = path;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      onSuccess();
    } catch (err) {
      console.error('Fallback copy failed:', err);
      Toast.error('Failed to copy local path.');
    }
    document.body.removeChild(textArea);
  }
}