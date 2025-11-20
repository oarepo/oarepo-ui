import React from "react";
import ReactDOM from "react-dom";

import { RecordActionButtons } from "./RecordActionButtons";

const recordActionsDiv = document.getElementById("record-actions");
if (recordActionsDiv) {
  const record = JSON.parse(recordActionsDiv.dataset.record);
  const permissions = JSON.parse(recordActionsDiv.dataset.permissions);
  const groupsEnabled = JSON.parse(recordActionsDiv.dataset.groupsEnabled);

  ReactDOM.render(
    <RecordActionButtons
      record={record}
      permissions={permissions}
      groupsEnabled={groupsEnabled}
    />,
    recordActionsDiv
  );
}
