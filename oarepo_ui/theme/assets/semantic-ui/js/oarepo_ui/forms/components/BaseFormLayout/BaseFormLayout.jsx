import React from "react";
import PropTypes from "prop-types";
import { Grid, Ref, Sticky, Header } from "semantic-ui-react";
import { connect } from "react-redux";
import { getLocalizedValue } from "../../../util";
import { buildUID } from "react-searchkit";
import Overridable from "react-overridable";
import { getIn, useFormikContext } from "formik";
import { useSanitizeInput, useFormConfig } from "../../hooks";
import { save } from "../../state/deposit/actions";
import { TabForm } from "../TabForm";

export const FormTitle = () => {
  const { values } = useFormikContext();
  const { sanitizeInput } = useSanitizeInput();

  const recordTitle =
    getIn(values, "metadata.title", "") ||
    getLocalizedValue(getIn(values, "title", "")) ||
    "";

  const sanitizedTitle = sanitizeInput(recordTitle);

  return (
    sanitizedTitle && (
      <Header as="h1">
        {/* cannot set dangerously html to SUI header directly, I think it is some internal
        implementation quirk (it says you cannot have both children and dangerouslySethtml even though
        there is no children given to the component) */}
        <span dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
      </Header>
    )
  );
};

const BaseFormLayoutComponent = ({ sections, record }) => {
  const { overridableIdPrefix } = useFormConfig();
  const formFeedbackRef = React.useRef(null);

  return (
    <Grid>
      <Ref innerRef={formFeedbackRef}>
        <Grid.Column id="main-content" mobile={16} tablet={16} computer={16}>
          <FormTitle />
          <Sticky context={formFeedbackRef} offset={20}>
            <Overridable id={buildUID(overridableIdPrefix, "Errors.container")}>
              {/* <FormFeedback /> */}
            </Overridable>
          </Sticky>
          <Overridable
            id={buildUID(overridableIdPrefix, "FormFields.container")}
            record={record}
          >
            <TabForm sections={sections} record={record} />
          </Overridable>
        </Grid.Column>
      </Ref>
    </Grid>
  );
};

const mapStateToProps = (state) => {
  return {
    record: state.deposit.record,
    errors: state.deposit.errors,
  };
};

const mapDispatchToProps = {
  saveAction: (values, params) => save(values, params),
};

export const BaseFormLayout = connect(
  mapStateToProps,
  mapDispatchToProps
)(BaseFormLayoutComponent);

BaseFormLayoutComponent.propTypes = {
  record: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props

  sections: PropTypes.arrayOf(PropTypes.object),
};

export default BaseFormLayout;
