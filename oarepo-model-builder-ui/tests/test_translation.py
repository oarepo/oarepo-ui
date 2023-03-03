from flask_babel import force_locale, gettext


def test_translations_registered(app):
    with app.test_request_context():
        with force_locale("cs"):
            print("text: ", gettext("prov"))
            assert "Seznam" in gettext("prov")
        with force_locale("en"):
            print("text: ", gettext("lowest_price.hint"))
            assert "Enter" in gettext("lowest_price.hint")
