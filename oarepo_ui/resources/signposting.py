from functools import wraps


def response_header_signposting(f):
    """Add signposting link to view's reponse headers.

    :param headers: response headers
    :type headers: dict
    :return: updated response headers
    :rtype: dict
    """

    @wraps(f)
    def inner(*args, **kwargs):
        response = f(*args, **kwargs)
        if response.status_code != 200:
            return response
        if not hasattr(response, "_api_record"):
            return response

        signposting_link = response._api_record.links["self"]
        response.headers.update(
            {
                "Link": f'<{signposting_link}> ; rel="linkset" ; type="application/linkset+json"',  # noqa
            }
        )

        return response

    return inner
