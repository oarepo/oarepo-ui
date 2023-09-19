from flask_webpackext import current_manifest


def test_vite_manifest(app, fake_manifest):
    manifest = current_manifest._get_current_object()
    assert str(manifest["blah"]) == (
        '<script src="https://127.0.0.1:5173/entrypoints/blah.js"></script>'
        '<link rel="stylesheet" href="https://127.0.0.1:5173/entrypoints/blah.css" />'
    )
    assert manifest["previewer_theme"]._paths == [
        "assets/modulepreload-polyfill-3cfb730f.js",
        "assets/lodash-e693fe4d.js",
        "assets/jquery-9393c8e7.js",
        "assets/semantic-892187a7.js",
        "assets/previewer_theme-e6c22360.js",
    ]
