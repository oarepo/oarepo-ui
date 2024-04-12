import React from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useDepositApiClient } from "@js/oarepo_ui";

export const PreviewButton = React.memo(({ ...uiProps }) => {
  const { preview, isSubmitting } = useDepositApiClient();
  return (
    <Button
      name="preview"
      disabled={isSubmitting}
      loading={isSubmitting}
      onClick={() => preview()}
      icon="eye"
      labelPosition="left"
      content={i18next.t("Preview")}
      type="button"
      {...uiProps}
    />
  );
});

export default PreviewButton;
