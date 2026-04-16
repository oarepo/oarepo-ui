import React from "react";
import PropTypes from "prop-types";
import { Popup } from "semantic-ui-react";
import { useFormikContext } from "formik";
import { useSelector } from "react-redux";
import { i18next } from "@translations/oarepo_ui/i18next";
import { computeSectionFilled } from "../../util";

const DEFAULT_FILLED_THRESHOLD = 0.8;

export const SectionFilledBar = ({
  includesPaths,
  sectionFilled,
  filledThreshold = DEFAULT_FILLED_THRESHOLD,
}) => {
  const { values } = useFormikContext();
  const reduxState = useSelector((state) => state);

  const filledRatio =
    typeof sectionFilled === "function"
      ? sectionFilled({ formikValues: values, reduxState, includesPaths })
      : computeSectionFilled({
          formikValues: values,
          reduxState,
          includesPaths,
        });

  const percentage = Math.round(filledRatio * 100);
  const color = filledRatio < filledThreshold ? "orange" : "green";

  return (
    <Popup
      trigger={
        <div className="section-filled-bar">
          <div
            className={`section-filled-bar-fill ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      }
      content={i18next.t("{{percentage}}% of this section is filled", {
        percentage,
      })}
      size="mini"
      position="bottom center"
    />
  );
};

SectionFilledBar.propTypes = {
  includesPaths: PropTypes.array.isRequired,
  sectionFilled: PropTypes.func,
  filledThreshold: PropTypes.number,
};

export default SectionFilledBar;
