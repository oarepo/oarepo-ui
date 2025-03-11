import React, { useEffect, useRef } from "react";
import { initCopyButtons, deinitializeCopyButtons } from "./clipboard";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";

export const ClipboardCopyButton = ({ copyText, ...rest }) => {
  const copyBtnRef = useRef(null);

  useEffect(() => {
    const copyBtn = copyBtnRef.current;
    if (copyBtn) {
      initCopyButtons(copyBtnRef.current);
    }
    return () => {
      deinitializeCopyButtons(copyBtn);
    };
  }, [copyText]);

  return (
    <i
      ref={copyBtnRef}
      title={`${i18next.t("Click to copy")}: ${copyText}`}
      type="button"
      className="copy outline link icon copy-button"
      data-clipboard-text={copyText}
      {...rest}
    />
  );
};

ClipboardCopyButton.propTypes = {
  copyText: PropTypes.string.isRequired,
};

export default ClipboardCopyButton;
