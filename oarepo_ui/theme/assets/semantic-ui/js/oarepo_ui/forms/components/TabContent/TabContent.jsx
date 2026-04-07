import React, { useRef, useEffect } from "react";
import { Segment, Button, Icon, Message } from "semantic-ui-react";
import {
  PublishButton,
  SaveButton,
  PreviewButton,
  DeleteButton,
} from "@js/invenio_rdm_records";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { i18next } from "@translations/oarepo_ui/i18next";
import Overridable from "react-overridable";
import { ErrorBoundary } from "react-error-boundary";
import { useFormikContext } from "formik";
import { useInitialRecord, useFormConfig } from "../../hooks";
import { buildUID } from "react-searchkit";

const TabErrorFallback = ({ error, resetErrorBoundary }) => (
  <Message negative icon data-testid="tab-error-fallback">
    <Icon name="exclamation triangle" />
    <Message.Content>
      <Message.Header>
        {i18next.t("Something went wrong in this section")}
      </Message.Header>
      <p>{error?.message}</p>
      <Button
        basic
        color="red"
        size="small"
        onClick={resetErrorBoundary}
        data-testid="tab-error-retry-button"
      >
        <Icon name="refresh" />
        {i18next.t("Try again")}
      </Button>
    </Message.Content>
  </Message>
);

TabErrorFallback.propTypes = {
  error: PropTypes.object,
  resetErrorBoundary: PropTypes.func.isRequired,
};

export const TabContent = ({ activeStep, sections, next, back }) => {
  const record = useSelector((state) => state.deposit.record);
  const formConfig = useFormConfig();
  const { overridableIdPrefix, permissions } = formConfig;
  const section = sections[activeStep];
  const contentRef = useRef(null);

  const { dirty } = useFormikContext();
  const { initialRecord } = useInitialRecord();

  useEffect(() => {
    const segment = contentRef.current?.closest(".tab-content");
    const footer = document.querySelector("footer");
    if (!segment || !footer) return;
    const segmentTop = segment.getBoundingClientRect().top + window.scrollY;
    const footerTop = footer.getBoundingClientRect().top + window.scrollY;
    segment.style.minHeight = `${footerTop - segmentTop}px`;
  }, []);

  // Move focus to first focusable element in content when tab changes
  // When first input in a tab, is a dropdown, the behavior is not ideal i.e. it focuses and the dropdown extends
  // even when it has value. TODO: To discuss if this is really needed generally speaking.
  useEffect(() => {
    const focusableSelector =
      'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]';
    const firstFocusable = contentRef.current?.querySelector(focusableSelector);
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      // Fallback to container if no focusable elements
      contentRef.current?.focus();
    }
  }, [activeStep]);

  return (
    <React.Fragment>
      <Segment
        className="tab-content borderless shadowless mb-0"
        data-testid="tab-content"
      >
        {dirty && (
          <Message info data-testid="unsaved-changes-message">
            <Message.Content>
              <Icon name="info circle" />
              {i18next.t("Your draft contains unsaved changes.")}
            </Message.Content>
          </Message>
        )}
        <ErrorBoundary
          FallbackComponent={TabErrorFallback}
          resetKeys={[section?.key]}
        >
          <div
            className="tab-content-body"
            ref={contentRef}
            tabIndex={-1}
            role="tabpanel"
            aria-labelledby={section?.key}
            data-testid={`tab-content-body-${section?.key}`}
          >
            {section?.render({
              record,
              formConfig,
              activeStep,
              next,
              back,
              initialRecord,
            })}
          </div>
          <Overridable
            id={buildUID(
              formConfig?.overridableIdPrefix,
              `TabForm.TabContent.${section?.key}`,
            )}
            activeStep={activeStep}
            section={section}
            next={next}
            back={back}
          />
        </ErrorBoundary>
      </Segment>
      <Overridable id={buildUID(overridableIdPrefix, "TabForm.actions")}>
        <div className="flex form-actions-row">
          <div className="form-actions-filler" />
          <div className="flex form-actions-buttons">
            <Overridable
              id={buildUID(overridableIdPrefix, "TabForm.PreviewButton")}
            >
              <div>
                <PreviewButton content="" labelPosition={null} />
              </div>
            </Overridable>
            <Overridable
              id={buildUID(overridableIdPrefix, "TabForm.DeleteButton")}
              permissions={permissions}
            >
              <div>
                {permissions?.can_delete_draft && record?.id && (
                  <DeleteButton />
                )}
              </div>
            </Overridable>
            <Overridable
              id={buildUID(overridableIdPrefix, "TabForm.SaveButton")}
            >
              <div>
                <SaveButton />
              </div>
            </Overridable>
            <Overridable
              id={buildUID(overridableIdPrefix, "TabForm.PublishButton")}
              record={record}
            >
              <div>
                <PublishButton record={record} />
              </div>
            </Overridable>
          </div>
        </div>
      </Overridable>
    </React.Fragment>
  );
};

TabContent.propTypes = {
  activeStep: PropTypes.number.isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      includesPaths: PropTypes.array,
      /** render({ record, formConfig, activeStep }) => ReactNode */
      render: PropTypes.func.isRequired,
    }),
  ).isRequired,
  next: PropTypes.func.isRequired,
  back: PropTypes.func.isRequired,
};

export default TabContent;
