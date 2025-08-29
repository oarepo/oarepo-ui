import React from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { connect } from "react-redux";
import { preview } from "../../state/deposit/actions";
import { useDepositFormAction } from "../../hooks";
import { DRAFT_PREVIEW_STARTED } from "@js/invenio_rdm_records/src/deposit/state/types";
import PropTypes from "prop-types";

const PreviewButtonComponent = React.memo(
  ({ previewAction, actionState, ...uiProps }) => {
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
  }
);

PreviewButtonComponent.displayName = "PreviewButtonComponent";
PreviewButtonComponent.propTypes = {
  previewAction: PropTypes.func.isRequired,
  actionState: PropTypes.string,
};

const mapDispatchToProps = (dispatch) => ({
  previewAction: (values, params) => dispatch(preview(values, params)),
});

const mapStateToProps = (state) => ({
  actionState: state.deposit.actionState,
});

export const PreviewButton = connect(
  mapStateToProps,
  mapDispatchToProps
)(PreviewButtonComponent);

export default PreviewButton;
