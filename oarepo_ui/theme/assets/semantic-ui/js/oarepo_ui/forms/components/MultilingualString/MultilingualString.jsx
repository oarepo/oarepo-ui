import * as React from 'react'
import PropTypes from "prop-types";
import {i18next} from '@translations/oarepo_ui/i18next'

export const MultilingualString = ({value}) => {
    const localizedValue =
      value[i18next.language] ||
      value[i18next.options.fallbackLng] ||
      Object.values(value).shift();

    return <>{localizedValue}</>;
};

MultilingualString.propTypes = {
  value: PropTypes.object
};

MultilingualString.defaultProps = {};
