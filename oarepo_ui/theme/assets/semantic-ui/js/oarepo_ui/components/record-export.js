import React from "react";
import ReactDOM from "react-dom";
import { ExportDropdown } from "./ExportDropdown";

const recordExportDownloadDiv = document.getElementById("recordExportDownload");
if (recordExportDownloadDiv) {
  ReactDOM.render(
    <ExportDropdown
      recordExportInfo={JSON.parse(recordExportDownloadDiv.dataset.formats)}
    />,
    recordExportDownloadDiv
  );
}
