import * as React from 'react'
import PropTypes from "prop-types";
import {i18next} from '@translations/oarepo_ui/i18next'
import {
  TextField,
  GroupField,
  FieldLabel,
  SelectField,
  RichInputField,
} from "react-invenio-forms";
import PropTypes from 'prop-types'

export const I18nTextInputField = ({value}) => {
    const localizedValue =
      value[i18next.language] ||
      value[i18next.options.fallbackLng] ||
      Object.values(value).shift();

    return (
      <GroupField optimized>
        <Form.Field width={3}>
          <SelectField
            // necessary because otherwise other inputs are not rerendered and keep the previous state i.e. I could potentially choose two same languages in some scenarios
            key={availableOptions}
            clearable
            fieldPath={`${fieldPathPrefix}.language`}
            label="Language"
            optimized
            options={availableOptions}
            required={required}
            selectOnBlur={false}
          />
          {indexPath > 0 && hasRichInput && (
            <PopupComponent
              content={i18next.t("Remove description")}
              trigger={
                <Button
                  aria-label="remove field"
                  className="rel-mt-1"
                  icon
                  onClick={() => arrayHelpers.remove(indexPath)}
                  fluid
                >
                  <Icon name="close" />
                </Button>
              }
            />
          )}
        </Form.Field>

        {hasRichInput ? (
          <Form.Field width={13}>
            <RichInputField
              fieldPath={`${fieldPathPrefix}.name`}
              label={i18next.t("Description")}
              editorConfig={editorConfig}
              optimized
              required={required}
            />
          </Form.Field>
        ) : (
          <TextField
            fieldPath={`${fieldPathPrefix}.name`}
            label="Name"
            required={required}
            width={13}
            icon={
              indexPath > 0 ? (
                <PopupComponent
                  content={i18next.t("Remove field")}
                  trigger={
                    <Icon
                      as="button"
                      onClick={() => arrayHelpers.remove(indexPath)}
                    >
                      <Icon name="close" />
                    </Icon>
                  }
                />
              ) : null
            }
          />
        )}
      </GroupField>
    );
};

I18nTextInputField.propTypes = {
  value: PropTypes.object.isRequired
};

I18nTextInputField.defaultProps = {};
