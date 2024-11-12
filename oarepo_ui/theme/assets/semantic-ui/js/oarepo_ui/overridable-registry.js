import { overrideStore } from "react-overridable";

const getInputFromDOM = (elementName) => {
  const element = document.getElementsByName(elementName);
  if (element.length > 0 && element[0].hasAttribute("value")) {
    return JSON.parse(element[0].value);
  }
  return null;
};
// get all files below /templates/overridableRegistry that end with mapping.js.
// The files shall be in a subfolder, in order to prevent clashing between mapping.js
// from different libraries. each mapping.js file shall have a default export
// that is an object with signature {"component-id": Component} the files
// will be prioritized by leading prefix (e.g. 10-mapping.js will be processed
// before 20-mapping.js). mapping.js without prefix will have lowest priority.
const endpointName = getInputFromDOM("overridable-registry-name");
console.log(endpointName);
const parsedUrl = new URL(window.location.href);
console.log(parsedUrl.pathname);
const urlStart = parsedUrl.pathname.split("/")[1];
console.log(urlStart);
console.log(Boolean(urlStart));
const requireMappingFiles = require.context(
  "/templates/overridableRegistry/",
  true,
  /mapping.js$/,
  "lazy"
);
console.log(requireMappingFiles.keys());
const fillOverridableStore = async () => {
  const mappingFiles = requireMappingFiles
    .keys()
    .filter((fileName) => fileName.includes(endpointName))
    .map((fileName) => {
      const match = fileName.match(/\/(\d+)-mapping.js$/);
      const priority = match ? parseInt(match[1], 10) : 0;
      return { fileName, priority };
    })
    .sort((a, b) => a.priority - b.priority);

  for (let { fileName } of mappingFiles) {
    const module = await requireMappingFiles(fileName);
    if (!module.default) {
      console.error(`Mapping file ${fileName} does not have a default export.`);
    } else {
      for (const [key, value] of Object.entries(module.default)) {
        overrideStore.add(key, value);
      }
    }
  }
};
fillOverridableStore();

// .forEach(({ fileName }) => {
//   const module = requireMappingFiles(fileName);
//   if (!module.default) {
//     console.error(`Mapping file ${fileName} does not have a default export.`);
//   } else {
//     for (const [key, value] of Object.entries(module.default)) {
//       overrideStore.add(key, value);
//     }
//   }
// });
