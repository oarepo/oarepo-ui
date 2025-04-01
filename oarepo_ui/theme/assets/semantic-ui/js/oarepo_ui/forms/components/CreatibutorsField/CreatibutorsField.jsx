// This file is part of Invenio-RDM-Records
// Copyright (C) 2020-2023 CERN.
// Copyright (C) 2020-2022 Northwestern University.
// Copyright (C) 2021 Graz University of Technology.
//
// Invenio-RDM-Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import React, { Component } from "react";
import PropTypes from "prop-types";
import { getIn, FieldArray } from "formik";
import { Form, Label, List, Icon } from "semantic-ui-react";
import { FieldLabel } from "react-invenio-forms";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { CreatibutorsModal } from "./CreatibutorsModal";
import { CreatibutorsFieldItem } from "./CreatibutorsFieldItem";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFieldData, useFormConfig } from "../../hooks";
import { creatibutorNameDisplay } from "./util";

function sortOptions(options) {
  return options.sort((o1, o2) => o1.text.localeCompare(o2.text));
}

class CreatibutorsFieldForm extends Component {
  handleOnContributorChange = (selectedCreatibutor) => {
    const { push: formikArrayPush } = this.props;
    formikArrayPush(selectedCreatibutor);
  };

  render() {
    const {
      form: { values, errors, initialErrors, initialValues },
      remove: formikArrayRemove,
      replace: formikArrayReplace,
      move: formikArrayMove,
      name: fieldPath,
      label,
      icon,
      roleOptions,
      schema,
      modal,
      autocompleteNames,
      addButtonLabel,
      required,
      showRoleField,
    } = this.props;

    const creatibutorsList = getIn(values, fieldPath, []);
    const formikInitialValues = getIn(initialValues, fieldPath, []);

    const error = getIn(errors, fieldPath, null);
    const initialError = getIn(initialErrors, fieldPath, null);
    const creatibutorsError =
      error || (creatibutorsList === formikInitialValues && initialError);
    const arrayAddButtonLabel =
      addButtonLabel || schema === "creators"
        ? i18next.t("Add creator")
        : i18next.t("Add contributor");

    const modalHeader =
      modal || schema === "creators"
        ? {
            addLabel: i18next.t("Add creator"),
            editLabel: i18next.t("Edit creator"),
          }
        : {
            addLabel: i18next.t("Add contributor"),
            editLabel: i18next.t("Edit contributor"),
          };
    return (
      <DndProvider backend={HTML5Backend}>
        <Form.Field
          required={required}
          className={creatibutorsError ? "error" : ""}
        >
          <FieldLabel htmlFor={fieldPath} label={label} icon={icon} />
          <List>
            {creatibutorsList.map((value, index) => {
              const key = `${fieldPath}.${index}`;
              const identifiersError =
                creatibutorsError?.[index]?.person_or_org?.identifiers;
              const displayName = creatibutorNameDisplay(value);

              return (
                <CreatibutorsFieldItem
                  key={key}
                  identifiersError={identifiersError}
                  {...{
                    displayName,
                    index,
                    roleOptions,
                    schema,
                    compKey: key,
                    initialCreatibutor: value,
                    removeCreatibutor: formikArrayRemove,
                    replaceCreatibutor: formikArrayReplace,
                    moveCreatibutor: formikArrayMove,
                    addLabel: modalHeader.addLabel,
                    editLabel: modalHeader.editLabel,
                    autocompleteNames: autocompleteNames,
                    showRoleField,
                  }}
                />
              );
            })}
          </List>
          <CreatibutorsModal
            onCreatibutorChange={this.handleOnContributorChange}
            action="add"
            addLabel={modalHeader.addLabel}
            editLabel={modalHeader.editLabel}
            roleOptions={sortOptions(roleOptions)}
            schema={schema}
            autocompleteNames={autocompleteNames}
            trigger={
              <Form.Button
                className="array-field-add-button inline-block"
                type="button"
                icon
                labelPosition="left"
              >
                <Icon name="add" />
                {arrayAddButtonLabel}
              </Form.Button>
            }
            showRoleField={showRoleField}
          />
          {creatibutorsError && typeof creatibutorsError == "string" && (
            <Label pointing="left" prompt>
              {creatibutorsError}
            </Label>
          )}
        </Form.Field>
      </DndProvider>
    );
  }
}

export class CreatibutorsFieldComponent extends Component {
  render() {
    const { fieldPath } = this.props;

    return (
      <FieldArray
        name={fieldPath}
        render={(formikProps) => (
          <CreatibutorsFieldForm {...formikProps} {...this.props} />
        )}
      />
    );
  }
}

CreatibutorsFieldForm.propTypes = {
  showRoleField: PropTypes.bool,
  required: PropTypes.bool,
  addButtonLabel: PropTypes.string,
  modal: PropTypes.shape({
    addLabel: PropTypes.string.isRequired,
    editLabel: PropTypes.string.isRequired,
  }),
  schema: PropTypes.oneOf(["creators", "contributors"]).isRequired,
  autocompleteNames: PropTypes.oneOf(["search", "search_only", "off"]),
  label: PropTypes.string,
  icon: PropTypes.string,
  roleOptions: PropTypes.array.isRequired,
  form: PropTypes.object.isRequired,
  remove: PropTypes.func.isRequired,
  replace: PropTypes.func.isRequired,
  move: PropTypes.func.isRequired,
  push: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
};

CreatibutorsFieldForm.defaultProps = {
  autocompleteNames: "search",
  label: i18next.t("Creators"),
  icon: "user",
};

CreatibutorsFieldComponent.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  showRoleField: PropTypes.bool,
  required: PropTypes.bool,
  addButtonLabel: PropTypes.string,
  modal: PropTypes.shape({
    addLabel: PropTypes.string.isRequired,
    editLabel: PropTypes.string.isRequired,
  }),
  schema: PropTypes.oneOf(["creators", "contributors"]).isRequired,
  autocompleteNames: PropTypes.oneOf(["search", "search_only", "off"]),
  label: PropTypes.string,
  icon: PropTypes.string,
  roleOptions: PropTypes.array,
};

CreatibutorsFieldComponent.defaultProps = {
  autocompleteNames: "search",
  label: undefined,
  icon: undefined,
  roleOptions: undefined,
};

export const CreatibutorsField = ({
  overrides,
  icon = "user",
  label,
  fieldPath,
  ...props
}) => {
  const { getFieldData } = useFieldData();
  const fieldData = {
    ...getFieldData({ fieldPath, icon, fieldRepresentation: "text" }),
    ...(label && { label }),
  };

  const { formConfig } = useFormConfig();
  const roleOptions =
    formConfig?.vocabularies?.["contributor-types"]?.all || [];
  return (
    <CreatibutorsFieldComponent
      fieldPath={fieldPath}
      roleOptions={roleOptions}
      {...fieldData}
      {...props}
    />
  );
};

CreatibutorsField.propTypes = {
  label: PropTypes.string,
  overrides: PropTypes.object,
  icon: PropTypes.string,
  fieldPath: PropTypes.string.isRequired,
};
