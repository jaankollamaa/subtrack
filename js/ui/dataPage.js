import { getAllSubscriptions, replaceAllSubscriptions } from "../subscriptions.js";
import { createBackup, parseBackup, MAX_BACKUP_BYTES } from "../backup.js";
import { formatISODate } from "../dates.js";
import { el, createButton, downloadTextFile } from "./dom.js";

function countText(count) {
  return `${count} subscription${count === 1 ? "" : "s"}`;
}

export function renderDataPage(container) {
  // ----- Messages (the page shows these instead of alert()) -----

  const errorBox = el("p", "form-error");
  errorBox.setAttribute("role", "alert"); // announced by screen readers
  errorBox.hidden = true;

  const successBox = el("p", "form-success");
  successBox.setAttribute("role", "status");
  successBox.hidden = true;

  function clearMessages() {
    errorBox.hidden = true;
    successBox.hidden = true;
  }

  function showError(message) {
    successBox.hidden = true;
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function showSuccess(message) {
    errorBox.hidden = true;
    successBox.textContent = message;
    successBox.hidden = false;
  }

  // ----- Export -----

  const exportSummary = el("p", "card-text");

  function refreshExportSummary() {
    exportSummary.textContent =
      `Download all ${countText(getAllSubscriptions().length)} as a file. ` +
      "Keep it somewhere safe: it is the only copy that does not depend on this browser.";
  }
  refreshExportSummary();

  const exportButton = createButton("Export to file", "btn btn-primary", () => {
    clearMessages();

    const subscriptions = getAllSubscriptions();
    if (subscriptions.length === 0) {
      showError("There is nothing to export yet.");
      return;
    }

    const now = new Date();
    downloadTextFile(
      `subtrack-backup-${formatISODate(now)}.json`,
      JSON.stringify(createBackup(subscriptions, now), null, 2),
      "application/json"
    );
    showSuccess(`Exported ${countText(subscriptions.length)}. Check your downloads folder.`);
  });

  const exportCard = el("section", "card");
  exportCard.append(el("h2", "card-title", "Export"), exportSummary, exportButton);

  // ----- Import -----

  async function importFile(file) {
    if (file.size > MAX_BACKUP_BYTES) {
      throw new Error("That file is too large to be a SubTrack backup.");
    }

    const incoming = parseBackup(await file.text()); // throws if invalid
    const currentCount = getAllSubscriptions().length;

    const confirmed = confirm(
      `Replace your ${countText(currentCount)} with the ${countText(incoming.length)} ` +
        "from this file?\n\n" +
        "This cannot be undone. Export your current data first if you might need it."
    );
    if (!confirmed) {
      return;
    }

    replaceAllSubscriptions(incoming);
    refreshExportSummary();
    showSuccess(`Imported ${countText(incoming.length)}.`);
  }

  const fileInput = el("input", "control");
  fileInput.type = "file";
  fileInput.id = "import-file";
  fileInput.accept = ".json,application/json";

  const fileLabel = el("label", "field-label", "Backup file");
  fileLabel.htmlFor = fileInput.id;

  fileInput.addEventListener("change", async () => {
    clearMessages();
    const file = fileInput.files[0];
    if (!file) {
      return;
    }

    try {
      await importFile(file);
    } catch (error) {
      showError(error.message);
    } finally {
      // Clearing the input lets the same file be chosen again afterwards.
      fileInput.value = "";
    }
  });

  const importField = el("div", "field");
  importField.append(fileLabel, fileInput);

  const importCard = el("section", "card");
  importCard.append(
    el("h2", "card-title", "Import"),
    el(
      "p",
      "card-text",
      "Restore from a SubTrack backup file. This replaces everything currently " +
        "in SubTrack with the contents of the file."
    ),
    importField
  );

  // ----- Page -----

  const header = el("div", "page-header");
  header.append(el("h2", "page-title", "Your data"));

  const grid = el("div", "data-grid");
  grid.append(errorBox, successBox, exportCard, importCard);

  container.replaceChildren(header, grid);
}