import React from "react";
import ReactDOM from "react-dom";
import { ShareButton } from "./ShareOptions/ShareButton";

const recordSharingDiv = document.getElementById("recordSharing");
if (recordSharingDiv) {
  const record = JSON.parse(recordSharingDiv.dataset.record);
  const permissions = JSON.parse(recordSharingDiv.dataset.permissions);
  const groupsEnabled = JSON.parse(recordSharingDiv.dataset.groupsEnabled);

  console.log("record", record);
  console.log("permissions", permissions);
  console.log("groupsEnabled", groupsEnabled);

  ReactDOM.render(
    <ShareButton
      record={record}
      disabled={!permissions.can_update_draft}
      permissions={permissions}
      groupsEnabled={groupsEnabled}
    />,
    recordSharingDiv
  );
}
