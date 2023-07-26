import React from "react";
import PropTypes from "prop-types";
import { Message, Grid, Button } from "semantic-ui-react";

export const NoResultsMessage = ({ noResultsMessage, handleModal }) => {
  return (
    <Message>
      <Message.Content>
        <Grid columns={2} verticalAlign="middle">
          <Grid.Column>
            <p>{noResultsMessage}</p>
          </Grid.Column>
          <Grid.Column textAlign="right">
            <Button
              as="a"
              color="green"
              icon="search"
              labelPosition="left"
              content="Search External Database"
              type="button"
              onClick={handleModal}
            />
          </Grid.Column>
        </Grid>
      </Message.Content>
    </Message>
  );
};

NoResultsMessage.propTypes = {
  noResultsMessage: PropTypes.node,
  handleModal: PropTypes.func.isRequired,
};

NoResultsMessage.defaultProps = {
  noResultsMessage: "No results found",
};
