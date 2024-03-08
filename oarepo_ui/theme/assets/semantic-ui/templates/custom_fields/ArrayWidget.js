import React, { useEffect, useState } from "react";
import { Grid, Form, Button, Icon, Header } from "semantic-ui-react";
import { useFormikContext, getIn, setIn } from "formik";
import { importTemplate } from "./ComplexWidget";

export const ArrayWidget = ({ item_widget, item_props, item_initial_value, fieldPath, label }) => {
  const formik = useFormikContext();

  const existingValues = getIn(formik.values, fieldPath, []);

  const [importedComponent, setImportedComponent] = useState(null);

  // import nested widget
  useEffect(() => {
    const importComponent = async () => {
      const ItemWidgetComponent = await importTemplate(item_widget);
      setImportedComponent({
        // can not return function here as it would be interpreted by the setter immediatelly
        component: (idx) => <ItemWidgetComponent fieldPath={`${fieldPath}[${idx}]`} {...item_props} />
      });
    };
    importComponent().catch((e) => { console.error(e); });
  }, []);


  const handleRemove = (indexToRemove) => {
    const updatedValues = [...existingValues];
    updatedValues.splice(indexToRemove.value, 1);
    formik.setFieldValue(fieldPath, updatedValues);
  };

  const handleAdd = () => {
    const newIndex = existingValues.length;
    const newFieldPath = `${fieldPath}[${newIndex}]`;
    formik.setFieldValue(newFieldPath, item_initial_value !== undefined ? item_initial_value : null);
  };

  if (!importedComponent) {
    return <></>;
  }

  return (
    <>
    <Header as="h3">{label}</Header>
    <Grid>
      {existingValues.map((value, index) =>
        <Grid.Row key={index}>
          <Grid.Column width="1">
            <Button
              aria-label={"Remove field"}
              className="close-btn"
              icon
              onClick={() => handleRemove({ value: index })}
              type="button"
            >
              <Icon name="close" />
            </Button>
          </Grid.Column>
          <Grid.Column width="15">
            {importedComponent.component(index)}
          </Grid.Column>
        </Grid.Row>
        )}
        <Grid.Row>
          <Button
            primary
            icon
            onClick={(e) => {
              e.preventDefault();
              handleAdd();
            }}
          >
            <Icon name="plus" />
          </Button>
        </Grid.Row>
    </Grid>
    </>
  );
};
