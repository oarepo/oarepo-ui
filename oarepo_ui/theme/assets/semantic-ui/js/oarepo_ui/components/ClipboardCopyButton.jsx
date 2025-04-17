import React, { useEffect, useRef } from "react";
import { initCopyButtons, deinitializeCopyButtons } from "./clipboard";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";

export const ClipboardCopyButton = ({ copyText, ...rest }) => {
  const copyBtnRef = useRef(null);
  useEffect(() => {
    const copyBtn = copyBtnRef.current;
    if (copyBtn) {
      initCopyButtons(copyBtn);
    }
    return () => {
      deinitializeCopyButtons(copyBtn);
    };
  }, []);

  return (
    <button
      ref={copyBtnRef}
      className="ui button transparent copy outline link icon copy-button"
      aria-label={`${i18next.t("Click to copy")}: ${copyText}`}
      data-clipboard-text={copyText}
      {...rest}
    >
      <i className="copy outline icon" />
    </button>
  );
};

ClipboardCopyButton.propTypes = {
  copyText: PropTypes.string.isRequired,
};

export default ClipboardCopyButton;
