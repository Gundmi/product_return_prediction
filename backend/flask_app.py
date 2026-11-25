import os
from flask import Flask, send_from_directory, request, Response
import requests

# Path to the built frontend assets
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
STATIC_FOLDER = os.path.join(BASE_DIR, '..', 'frontend', 'dist')

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path='/__static__')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # If the requested file exists in the static folder, serve it directly
    file_path = os.path.join(app.static_folder, path)
    if path != '' and os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    # Otherwise, serve the index.html (React router fallback)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def proxy_api(path):
    # Forward the request to the FastAPI backend
    url = f'http://127.0.0.1:8000/api/{path}'
    resp = requests.request(
        method=request.method,
        url=url,
        headers={key: value for key, value in request.headers if key.lower() != 'host'},
        params=request.args,
        json=request.get_json(silent=True),
        data=request.form,
        files=request.files,
    )
    excluded_headers = {'content-encoding', 'content-length', 'transfer-encoding', 'connection'}
    headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded_headers}
    return Response(resp.content, status=resp.status_code, headers=headers)

if __name__ == '__main__':
    # Run on port 5000 (default Flask)
    app.run(host='127.0.0.1', port=5000, debug=True)

