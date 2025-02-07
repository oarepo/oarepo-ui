import React from "react";
import ReactDOM from "react-dom";
import { RecordVersionsList } from "./RecordVersionsList";

const recordVersionsDiv = document.getElementById("recordVersions");
if (recordVersionsDiv) {
  ReactDOM.render(
    <RecordVersionsList
      initialRecord={JSON.parse(recordVersionsDiv.dataset.record)}
      isPreview={JSON.parse(recordVersionsDiv.dataset.preview)}
    />,
    recordVersionsDiv
  );
}
