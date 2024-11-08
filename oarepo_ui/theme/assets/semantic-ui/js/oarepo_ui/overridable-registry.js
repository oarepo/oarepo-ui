import * as React from 'react';
import { overrideStore } from "react-overridable";
import { getInputFromDOM } from "./util";
import { importTemplate } from "@js/invenio_theme/templates";
import PropTypes from 'prop-types'

function lazyOverridable (importString) {
    function LazyOverride ({children, ...props}) {
        const Override = importTemplate(importString);

        const name = Override.displayName || Override.name;
        Override.displayName = `LazyOverride(${name})`;

        Override.propTypes = {
            children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
        };
        Override.defaultProps = {
            children: null,
        };

        return <Override {...props}>{children}</Override>
    }

    return LazyOverride
}


const reactOverrides = getInputFromDOM("react-overrides");
Object.entries(reactOverrides).forEach(
    ([overridableId, importString]) => overrideStore.add(
        overridableId, lazyOverridable(importString)
    ));
console.debug("Global React component overrides:", overrideStore.getAll())
