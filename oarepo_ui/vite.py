# parts taken from https://github.com/abilian/flask-vite/


def add_vite_tags(response):
    if response.status_code != 200:
        return response

    mimetype = response.mimetype or ""
    if not mimetype.startswith("text/html"):
        return response

    if not isinstance(response.response, list):
        return response

    body = b"".join(response.response).decode()
    tag = make_tag()
    body = body.replace("</head>", f"{tag}\n</head>")
    response.response = [body.encode("utf8")]
    response.content_length = len(response.response[0])
    return response


def make_tag():
    return (
        """         
            <!-- REACT_VITE_HEADER -->
            <script type="module">
              import RefreshRuntime from 'http://localhost:5000/@react-refresh'
              RefreshRuntime.injectIntoGlobalHook(window)
              window.$RefreshReg$ = () => {}
              window.$RefreshSig$ = () => (type) => type
              window.__vite_plugin_react_preamble_installed__ = true
            </script>
            
            <!-- FLASK_VITE_HEADER -->
            <script type="module" src="http://localhost:5000/@vite/client"></script>
        """
    ).strip()


# TODO: images, fonts and other assets
