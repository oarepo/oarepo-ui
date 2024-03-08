import React, { useEffect, useState } from "react";
import { Grid, Button, Icon, Header, Form } from "semantic-ui-react";
import { useFormikContext, getIn } from "formik";
import { importTemplate } from "./ComplexWidget";
import PropTypes from "prop-types";
import { GroupField } from "react-invenio-forms";

export const ArrayWidget = ({
  item_widget,
  item_props,
  item_initial_value,
  fieldPath,
  label,
}) => {
  const { values, setFieldValue } = useFormikContext();

  const existingValues = getIn(values, fieldPath, []);

  const [importedComponent, setImportedComponent] = useState(null);

  // import nested widget
  useEffect(() => {
    const importComponent = async () => {
      const ItemWidgetComponent = await importTemplate(item_widget);
      setImportedComponent({
        // can not return function here as it would be interpreted by the setter immediatelly
        component: (idx) => (
          <ItemWidgetComponent
            fieldPath={`${fieldPath}[${idx}]`}
            {...item_props}
          />
        ),
      });
    };
    importComponent().catch((e) => {
      console.error(e);
    });
  }, []);

  const handleRemove = (indexToRemove) => {
    const updatedValues = [...existingValues];
    updatedValues.splice(indexToRemove.value, 1);
    setFieldValue(fieldPath, updatedValues);
  };

  const handleAdd = () => {
    const newIndex = existingValues.length;
    const newFieldPath = `${fieldPath}[${newIndex}]`;
    setFieldValue(newFieldPath, item_initial_value ?? "");
  };

  if (!importedComponent) {
    return <></>;
  }

  return (
    <>
      <Header as="h3">{label}</Header>
      <Grid>
       {existingValues.length>0 && <Grid.Column width={16} className="pb-0">
          {existingValues.map((value, index) => (
            <GroupField width={16} key={index}>
              <Form.Field width={15}>
                {importedComponent.component(index)}
              </Form.Field>
              <Form.Field>
                <Button
                  aria-label={"Remove field"}
                  className={`close-btn ${item_props.label ? "mt-25" : "mt-5"}`}
                  icon
                  onClick={() => handleRemove({ value: index })}
                  type="button"
                >
                  <Icon name="close" />
                </Button>
              </Form.Field>
            </GroupField>
          ))}
        </Grid.Column>}
        <Grid.Row className={existingValues.length>0 ? "pt-0" : ""}>
          <Grid.Column>
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
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
};

ArrayWidget.propTypes = {
  item_widget: PropTypes.string.isRequired,
  item_props: PropTypes.object,
  item_initial_value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string,
};
