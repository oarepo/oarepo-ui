import React, { useEffect, useState } from "react";
import { Grid, Header } from "semantic-ui-react";
import PropTypes from "prop-types";

export async function importTemplate(widget) {
  let error;
  try {
    const module = await import(`/templates/custom_fields/${widget}.js`);
    return module.default;
  } catch (e) {
    error = e;
  }

  const module = await import(`react-invenio-forms`);
  if (module[widget]) {
    return module[widget];
  }
  throw new Error(`Widget ${widget} not found. First error ${error}`);
}

const ComplexWidget = ({ fieldPath, nested, label }) => {
  const [importedComponents, setImportedComponents] = useState([]);

  useEffect(() => {
    async function loadImportedComponents() {
      const importComponent = async ({
        field: nestedField,
        ui_widget: nestedWidget,
        props: nestedProps,
      }) => {
        const NestedWidgetComponent = await importTemplate(nestedWidget);
        const p = {
          ...nestedProps,
          fieldPath: fieldPath + "." + nestedField,
        };
        return {
          nestedId: nestedField,
          nestedConstructor: () => <NestedWidgetComponent {...p} />,
        };
      };

      setImportedComponents(await Promise.all(nested.map(importComponent)));
    }
    loadImportedComponents();
  }, []);

  return (
    <>
      <Header as="h3">{label}</Header>
      <Grid>
        <Grid.Column>
          {importedComponents.map(
            ({ nestedId, nestedConstructor }, index, array) => {
              return (
                <Grid.Row
                  key={nestedId}
                  className={array.length !== index + 1 ? "rel-mb-2" : ""}
                >
                  {nestedConstructor()}
                </Grid.Row>
              );
            }
          )}
        </Grid.Column>
      </Grid>
    </>
  );
};
ComplexWidget.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  nested: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
};
export default ComplexWidget;
