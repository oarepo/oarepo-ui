import React, { Component } from "react";
import PropTypes from "prop-types";
import { i18next } from "@translations/invenio_app_rdm/i18next";
import { withCancel, http } from "react-invenio-forms";
import {
  Placeholder,
  Divider,
  Container,
  Header,
  Item,
  Button,
  Message,
} from "semantic-ui-react";
import isEmpty from "lodash/isEmpty";
import Overridable from "react-overridable";
import { buildUID } from "react-searchkit";
import { DynamicResultsListItem } from "./DynamicResultsListItem";

export class RecordsList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: { hits: [] },
      isLoading: false,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillUnmount() {
    this.cancellableFetch?.cancel();
  }

  fetchData = async () => {
    const { fetchUrl } = this.props;
    this.setState({ isLoading: true });

    this.cancellableFetch = withCancel(
      http.get(fetchUrl, {
        headers: {
          Accept: "application/vnd.inveniordm.v1+json",
        },
      })
    );

    try {
      const response = await this.cancellableFetch.promise;
      this.setState({ data: response.data.hits, isLoading: false });
    } catch (error) {
      console.error(error);
      this.setState({ error: error.response.data.message, isLoading: false });
    }
  };

  renderPlaceHolder = () => {
    const { title } = this.props;

    return (
      <Container>
        <Header as="h2">{title}</Header>
        {Array.from(new Array(10)).map((item, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index}>
            <Placeholder fluid className="rel-mt-3">
              <Placeholder.Header>
                <Placeholder.Line />
              </Placeholder.Header>

              <Placeholder.Paragraph>
                <Placeholder.Line />
              </Placeholder.Paragraph>

              <Placeholder.Paragraph>
                <Placeholder.Line />
                <Placeholder.Line />
                <Placeholder.Line />
              </Placeholder.Paragraph>
            </Placeholder>

            {index < 9 && <Divider className="rel-mt-2 rel-mb-2" />}
          </div>
        ))}
      </Container>
    );
  };

  render() {
    const { isLoading, data, error } = this.state;
    const { title, appName } = this.props;

    const listItems = data.hits?.map((record) => {
      return (
        <Overridable
          key={record.id}
          id={buildUID("ResultsList.item", "", appName)}
          title={title}
          appName={appName}
        >
          <DynamicResultsListItem
            result={record}
            key={record.id}
            appName={appName}
          />
        </Overridable>
      );
    });

    return (
      <>
        {isLoading && this.renderPlaceHolder()}

        {!isLoading && (
          <Container>
            {error ? (
              <Message content={error} error icon="warning sign" />
            ) : !isEmpty(listItems) ? (
              <>
                <Header as="h2">{title}</Header>

                <Item.Group relaxed link divided>
                  {listItems}
                </Item.Group>

                <Container textAlign="center">
                  <Button href="/search">{i18next.t("More")}</Button>
                </Container>
              </>
            ) : null}
          </Container>
        )}
      </>
    );
  }
}

RecordsList.propTypes = {
  title: PropTypes.string.isRequired,
  fetchUrl: PropTypes.string.isRequired,
  appName: PropTypes.string,
};

RecordsList.defaultProps = {
  appName: "",
};
