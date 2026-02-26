import React, { useCallback } from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useDispatch, useSelector } from "react-redux";
import { preview } from "../../state/deposit/actions";
import { useDepositFormAction } from "../../hooks";
import { DRAFT_PREVIEW_STARTED } from "@js/invenio_rdm_records/src/deposit/state/types";
import PropTypes from "prop-types";

export const PreviewButton = React.memo(({ ...uiProps }) => {
  const dispatch = useDispatch();
  const actionState = useSelector((state) => state.deposit.actionState);

  const previewAction = useCallback(
    (values, params) => dispatch(preview(values, params)),
    [dispatch]
  );

  const { handleAction: handlePreview, isSubmitting } = useDepositFormAction({
    action: previewAction,
  });

  return (
    <Button
      name="preview"
      disabled={isSubmitting}
      loading={isSubmitting && actionState === DRAFT_PREVIEW_STARTED}
      onClick={() => handlePreview()}
      icon="eye"
      labelPosition="left"
      content={i18next.t("Preview")}
      type="button"
      {...uiProps}
    />
  );
});

PreviewButton.displayName = "PreviewButton";
PreviewButton.propTypes = {};

export default PreviewButton;
