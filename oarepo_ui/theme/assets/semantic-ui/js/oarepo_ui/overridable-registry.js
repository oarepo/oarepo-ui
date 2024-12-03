import { overrideStore } from "react-overridable";
import { getInputFromDOM } from "@js/oarepo_ui/util";

// get the flask endpoint name from dom (as a unique identifier of each individual page)
const endpointName = getInputFromDOM("overridable-registry-name");

const fillOverridableStore = async (endpointName) => {
  let libraryMapping;
  let applicationMapping;

  try {
    libraryMapping = await import(`/templates/${endpointName}/mapping.js`);
  } catch (error) {
    console.warn(`Could not load library mapping for ${endpointName}:`, error);
  }

  if (libraryMapping) {
    console.warn(
      "This page has a mapping file in the library. If you wish to override the same component, you should create 1-mapping.js file in the application folder."
    );
  }

  try {
    applicationMapping = await import(
      `/templates/${endpointName}/1-mapping.js`
    );
  } catch (error) {
    console.warn(
      `Could not load application mapping for ${endpointName}:`,
      error
    );
  }

  const componentStore = {
    ...libraryMapping.default,
    ...applicationMapping.default,
  };

  if (Object.keys(componentStore).length === 0) {
    return;
  }

  for (const [key, value] of Object.entries(componentStore)) {
    overrideStore.add(key, value);
  }
};

fillOverridableStore(endpointName);
