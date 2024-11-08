import * as React from 'react';
import { overrideStore } from "react-overridable";
import { getInputFromDOM } from "./util";
import { importTemplate } from "@js/invenio_theme/templates";

const LazyOverriddenComponent = ({ importString }) => {
    //     TODO: try to import and render component module once rendered
    const Component = importTemplate(importString);
    console.log({Component})
}

const reactOverrides = getInputFromDOM("react-overrides");
Object.entries(reactOverrides).forEach(
    ([overridableId, importString]) => overrideStore.add(
        overridableId, <LazyOverriddenComponent importString={importString} />
    ));
console.debug("Global React component overrides:", overrideStore.getAll())
