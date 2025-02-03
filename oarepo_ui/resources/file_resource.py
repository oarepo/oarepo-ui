from invenio_records_resources.resources import FileResource


class S3RedirectFileResource(FileResource):
    """
    A workaround for the fact that the file resource with S3 backend does not
    return HTTP 302 for pre-signed URLs.
    """

    def read_content(self):
        ret = super().read_content()
        if isinstance(ret, (tuple, list)) and ret:
            if ret[0].status_code == 302:
                return ret[0], 302
            else:
                return ret
        else:
            return ret
