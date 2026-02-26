import React, { useCallback } from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useDispatch, useSelector } from "react-redux";
import { save } from "../../state/deposit/actions";
import { useDepositFormAction } from "../../hooks";
import { DRAFT_SAVE_STARTED } from "@js/invenio_rdm_records/src/deposit/state/types";
import PropTypes from "prop-types";

export const SaveButton = React.memo(({ ...uiProps }) => {
  const dispatch = useDispatch();
  const actionState = useSelector((state) => state.deposit.actionState);

  const saveAction = useCallback(
    (values, params) => dispatch(save(values, params)),
    [dispatch]
  );

  const { handleAction: handleSave, isSubmitting } = useDepositFormAction({
    action: saveAction,
  });

  return (
    <Button
      name="save"
      disabled={isSubmitting}
      loading={isSubmitting && actionState === DRAFT_SAVE_STARTED}
      color="grey"
      onClick={() => handleSave()}
      icon="save"
      labelPosition="left"
      content={i18next.t("Save")}
      type="submit"
      {...uiProps}
    />
  );
});

SaveButton.displayName = "SaveButton";
SaveButton.propTypes = {};

export default SaveButton;
