import React from "react";
import ReactDOM from "react-dom";
import { ExportDropdown } from "./ExportDropdown";
import { getInputFromDOM } from "@js/oarepo_ui";
import { jdd } from "./differ";

const recordExportDownloadDiv = document.getElementById("recordExportDownload");
if (recordExportDownloadDiv) {
  ReactDOM.render(
    <ExportDropdown
      recordExportInfo={JSON.parse(recordExportDownloadDiv.dataset.formats)}
    />,
    recordExportDownloadDiv
  );
}

let jsons = getInputFromDOM("differ");
const createConfig = function () {
  return {
    out: "",
    indent: -1,
    currentPath: [],
    paths: [],
    line: 1,
  };
};

let config = createConfig();
let config2 = createConfig();

const left = jsons["previous_version_json"];
const right = jsons["current_version_json"];
