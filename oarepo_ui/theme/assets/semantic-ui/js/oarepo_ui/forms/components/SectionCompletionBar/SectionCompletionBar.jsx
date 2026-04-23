import React from "react";
import PropTypes from "prop-types";
import { Popup } from "semantic-ui-react";
import { useFormikContext } from "formik";
import { useSelector } from "react-redux";
import { i18next } from "@translations/oarepo_ui/i18next";
import { computeSectionCompletion } from "../../util";

const DEFAULT_COMPLETION_THRESHOLD = 0.8;

export const SectionCompletionBar = ({
  includesPaths,
  sectionCompletion,
  sectionCompletionThreshold = DEFAULT_COMPLETION_THRESHOLD,
}) => {
  const { values } = useFormikContext();
  const reduxState = useSelector((state) => state);

  const filledRatio =
    typeof sectionCompletion === "function"
      ? sectionCompletion({ formikValues: values, reduxState, includesPaths })
      : computeSectionCompletion({
          formikValues: values,
          reduxState,
          includesPaths,
        });

  const percentage = Math.round(filledRatio * 100);
  const color = filledRatio < sectionCompletionThreshold ? "orange" : "green";
  const filledText = i18next.t("{{percentage}}% of this section is filled", {
    percentage,
  });

  return (
    <Popup
      trigger={
        <div
          className="section-completion-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label={i18next.t("Section completion")}
          aria-valuetext={filledText}
        >
          <div
            className={`section-completion-bar-fill ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      }
      content={filledText}
      size="mini"
      position="bottom center"
    />
  );
};

SectionCompletionBar.propTypes = {
  includesPaths: PropTypes.array.isRequired,
  sectionCompletion: PropTypes.func,
  sectionCompletionThreshold: PropTypes.number,
};

export default SectionCompletionBar;
