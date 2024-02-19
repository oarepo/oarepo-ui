import base64

from flask_login import login_required, current_user
from flask_resources import request_parser, from_conf, resource_requestctx
from invenio_cache import current_cache
from invenio_db import db
from invenio_oauth2server.models import Token, Client
from nacl import pwhash, utils, secret

from oarepo_ui.resources.config import TemplatePageUIResourceConfig
from oarepo_ui.resources.resource import TemplatePageUIResource

import marshmallow as ma

class TokenUIResourceConfig(TemplatePageUIResourceConfig):
    pages = {
        'retrieve/': 'tokens.RetrieveToken',
    }
    url_prefix = '/account/settings/applications/tokens'
    blueprint_name = "oarepo_ui_tokens"

    retrieve_args = {
        "name": ma.fields.Str()
    }


retrieve_args = request_parser(from_conf("retrieve_args"), location="args")


class TokenUIResource(TemplatePageUIResource):
    """Token UI resource."""

    @login_required
    @retrieve_args
    def render_retrieve_token(self, **kwargs):
        """
            Render retrieve token page.
        """

        name = resource_requestctx.args['name']

        user_id = current_user.get_id()

        # remove the previous token(s) for the same client name
        for tok in db.session.query(Token).join(Client).filter(
            Token.client_id == Client.client_id,
            Client.name == name,
            Client.user_id == user_id,
            Token.user_id == user_id
        ).all():
            db.session.delete(tok)
            db.session.commit()

        token = Token.create_personal(
            name, user_id, scopes=[]
        )
        db.session.commit()

        return self.render(page="tokens.RetrieveToken", **kwargs,
                           name=name,
                           token=token)


def create_blueprint(app):
    """Register blueprint for this resource."""
    return TokenUIResource(TokenUIResourceConfig()).as_blueprint()
