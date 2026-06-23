import React from "react";
import PropTypes from "prop-types";
import _get from "lodash/get";
import { useDispatch, useSelector } from "react-redux";
import { useFormikContext } from "formik";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { PublishButton as InvenioPublishButton } from "@js/invenio_rdm_records";
import { DRAFT_PUBLISH_REQUEST_STARTED } from "../../state/deposit/types";
import { createPublishRequest } from "../../state/deposit/actions";
import { useDepositFormAction } from "../../hooks";
import { PUBLISH_DRAFT_REQUEST_TYPE } from "../../constants";

const isDisabledByFiles = (values, filesState) => {
  const filesEnabled = _get(values, "files.enabled", false);
  const filesArray = Object.values(filesState?.entries ?? {});
  if (filesEnabled && filesArray.length === 0) return true;
  return !filesArray.every((file) => file.status === "finished");
};

// TODO: this needs to be in oarepo-requests in reality
export const PublishButton = ({ record: _recordProp, ...props }) => {
  const dispatch = useDispatch();
  const { values, isSubmitting } = useFormikContext();
  const record = useSelector((state) => state.deposit.record);
  const selectedCommunity = useSelector(
    (state) => state.deposit.editorState?.selectedCommunity
  );
  const filesState = useSelector((state) => state.files);
  const actionState = useSelector((state) => state.deposit.actionState);
  const canPublish = useSelector(
    (state) => state.deposit.permissions?.can_publish
  );
  // True when upstream would render "Submit for review" — that variant goes
  // through review, so it must remain available even when can_publish is false.
  const isReviewSubmissionVariant = useSelector(
    (state) =>
      !!state.deposit.editorState?.ui?.showSubmitForReviewButton &&
      !state.deposit.editorState?.ui?.showDirectPublishButton
  );

  const hasPublishDraftRequestType = !!record?.expanded?.request_types?.find(
    (rt) =>
      rt.type_id === PUBLISH_DRAFT_REQUEST_TYPE && rt.links?.actions?.create
  );
  const shouldUseRequestFlow = !selectedCommunity && hasPublishDraftRequestType;

  const publishAction = React.useCallback(
    (formValues) => dispatch(createPublishRequest(formValues)),
    [dispatch]
  );
  const { handleAction } = useDepositFormAction({ action: publishAction });
  // TODO: hacky way to remove publish button from the flow under certain conditions
  // IMHO we will need to combine our own publishbutton component (we can use invenio pieces)
  if (!canPublish && !shouldUseRequestFlow && !isReviewSubmissionVariant) {
    return null;
  }

  if (!shouldUseRequestFlow) {
    return <InvenioPublishButton record={_recordProp} {...props} />;
  }

  return (
    <Button
      name="publish"
      positive
      icon="upload"
      labelPosition="left"
      type="button"
      disabled={isSubmitting || isDisabledByFiles(values, filesState)}
      loading={isSubmitting && actionState === DRAFT_PUBLISH_REQUEST_STARTED}
      content={i18next.t("Submit publish request")}
      onClick={handleAction}
      {...props}
    />
  );
};

PublishButton.propTypes = {
  record: PropTypes.object,
};
