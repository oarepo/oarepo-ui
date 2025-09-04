import React from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { connect } from "react-redux";
import { save } from "../../state/deposit/actions";
import { useDepositFormAction } from "../../hooks";
import { DRAFT_SAVE_STARTED } from "@js/invenio_rdm_records/src/deposit/state/types";
import PropTypes from "prop-types";

const SaveButtonComponent = React.memo(
  ({ saveAction, actionState, ...uiProps }) => {
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
  }
);

SaveButtonComponent.displayName = "SaveButtonComponent";
SaveButtonComponent.propTypes = {
  saveAction: PropTypes.func.isRequired,
  actionState: PropTypes.string,
};

const mapDispatchToProps = (dispatch) => ({
  saveAction: (values, params) => dispatch(save(values, params)),
});

const mapStateToProps = (state) => ({
  actionState: state.deposit.actionState,
});

export const SaveButton = connect(
  mapStateToProps,
  mapDispatchToProps
)(SaveButtonComponent);

export default SaveButton;
