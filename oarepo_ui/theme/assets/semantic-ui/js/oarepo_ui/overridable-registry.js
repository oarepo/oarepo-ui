import React, { lazy } from 'react';
import { overrideStore } from "react-overridable";
import { getInputFromDOM } from "./util";
import { importTemplate } from "@js/invenio_theme/templates";
import PropTypes from 'prop-types'

function parseImportString (importString) {
    if (importString.includes(':')) {
        const [moduleName, exportName] = importString.split(':')
        return { importType: 'module', moduleName, exportName }
    } else {
        const path = !(importString.endsWith('jsx') || importString.endsWith('js'))
            ? `${importString}.jsx`
            : importString
        return { importType: 'template', path: importString }
    }
}

function lazyOverridable (importString) {
    function LazyOverride ({ children, ...props }) {
        const { importType, ...importSpec } = parseImportString(importString)
        const [OverrideComponent, setOverrideComponent] = React.useState(() => () => null);

        // Lazily load a Component on mount, thanks to: https://stackoverflow.com/a/77028157
        // TODO: try if React.lazy could be somehow used in this scenario where we load either template or
        // dynamic import (which React.lazy is supposed to only support)
        React.useEffect(() => {
            async function loadOverrideComponent () {
                let Component;

                if (importType === 'module') {
                    const { moduleName, exportName } = importSpec
                    //     TODO: call dynamic webpack import here
                } else if (importType === 'template') {
                    const { path } = importSpec
                    Component = await importTemplate(path);
                    console.log('Imported ', {Component})
                } else {
                    throw new Error(`Import type not supported for ${importString}`)
                }

                if (Component) {
                    const name = Component.displayName || Component.name;
                    Component.displayName = `LazyOverride(${name})`;
                    Component.propTypes = {
                        children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
                    };
                    Component.defaultProps = {
                        children: null,
                    };

                    setOverrideComponent(() => Component)
                    return Component
                }
            }

            loadOverrideComponent().catch(err => console.error(err))
        }, [])

        return OverrideComponent && <OverrideComponent {...props}>{children}</OverrideComponent> || <span>Loading...</span>
    }

    LazyOverride.displayName = `LazyOverridable(${importString})`;

    return LazyOverride
}


const reactOverrides = getInputFromDOM("react-overrides");
Object.entries(reactOverrides).forEach(
    ([overridableId, importString]) => overrideStore.add(
        overridableId, lazyOverridable(importString)
    ));

console.debug("Global React component overrides:", overrideStore.getAll())
