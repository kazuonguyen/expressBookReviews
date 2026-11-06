#!/usr/bin/env python3
"""Run real cURL commands against a fresh server; save commands and actual output."""
import json
import os
from pathlib import Path
import shlex
import subprocess
import tempfile

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
DEST = ROOT / 'submission'
DEST.mkdir(exist_ok=True)
OWNER = 'kazuonguyen'
REPO = 'expressBookReviews'
server = subprocess.Popen(
    ['node', '-e', "const app=require('./index.js');const s=app.listen(0,'127.0.0.1',()=>console.log(s.address().port));"],
    cwd=PROJECT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
)
try:
    port = server.stdout.readline().strip()
    if not port.isdigit():
        raise RuntimeError('Server failed to start: ' + server.stderr.read())
    base = f'http://127.0.0.1:{port}'
    # An isolated cookie jar never enters the repository or submission ZIP.
    with tempfile.TemporaryDirectory(prefix='bookstore-evidence-') as temporary:
        def capture(name, args, expected=200, projection=None):
            command = ['curl', '--silent', '--show-error', '--fail-with-body', *args, '--write-out', '\nHTTP_STATUS:%{http_code}\n']
            completed = subprocess.run(command, cwd=temporary, capture_output=True, text=True, check=True)
            raw, status = completed.stdout.rsplit('\nHTTP_STATUS:', 1)
            assert int(status.strip()) == expected, (name, completed.stdout)
            data = json.loads(raw)
            if projection:
                # Execute the displayed pipeline; this is a projection of the
                # actual API response, not a hand-written replacement result.
                formatted = subprocess.run(['python3', '-c', projection], input=raw, capture_output=True, text=True, check=True).stdout.strip()
                shown = shlex.join(command[:-2]) + ' | ' + shlex.join(['python3', '-c', projection])
                body = formatted
            else:
                shown = shlex.join(command)
                body = raw + f'\nHTTP_STATUS:{status.strip()}'
            (DEST / f'{name}.txt').write_text('$ ' + shown + '\n\n' + body + '\n', encoding='utf-8')
            print(f'{name}: HTTP {status.strip()}', flush=True)
            return data

        repo = capture('githubrepo', ['https://api.github.com/repos/' + OWNER + '/' + REPO], projection="import json,sys; r=json.load(sys.stdin); print(json.dumps({k:r[k] for k in ('full_name','html_url','fork')} | {'parent':r['parent']['full_name'],'source':r['source']['full_name']},indent=2))")
        assert repo['fork'] and repo['parent']['full_name'] == 'ibm-developer-skills-network/expressBookReviews'
        all_books = capture('getallbooks', [base + '/'])
        assert len(all_books) == 10
        capture('getbooksbyISBN', [base + '/isbn/1'])
        author = capture('getbooksbyauthor', [base + '/author/Unknown'])
        assert len(author) == 4
        capture('getbooksbytitle', [base + '/title/Things%20Fall%20Apart'])
        initial = capture('getbookreview', [base + '/review/1'])
        assert initial == {}
        credentials = json.dumps({'username': 'bookstore_student', 'password': 'BookstoreDemo123!'}, separators=(',', ':'))
        capture('register', ['-X', 'POST', base + '/register', '-H', 'Content-Type: application/json', '-d', credentials], expected=201)
        capture('login', ['-X', 'POST', base + '/customer/login', '-H', 'Content-Type: application/json', '-d', credentials, '-c', 'cookies.txt'])
        added = capture('reviewadded', ['-X', 'PUT', base + '/customer/auth/review/1', '-b', 'cookies.txt', '-H', 'Content-Type: application/json', '-d', '{"review":"An engaging novel with rich characters and cultural insights."}'])
        assert 'bookstore_student' in added['reviews']
        updated = capture('reviewmodified', ['-X', 'PUT', base + '/customer/auth/review/1', '-b', 'cookies.txt', '-H', 'Content-Type: application/json', '-d', '{"review":"Updated review: a compelling exploration of tradition and change."}'])
        assert updated['message'] == 'Review successfully modified.'
        deleted = capture('deletereview', ['-X', 'DELETE', base + '/customer/auth/review/1', '-b', 'cookies.txt'])
        assert deleted['reviews'] == {}
        axios = subprocess.run(['npm', 'run', 'client'], cwd=PROJECT, env={**os.environ, 'BOOK_API_URL': base}, capture_output=True, text=True, check=True)
        (DEST / 'axios-results.txt').write_text('$ BOOK_API_URL=' + base + ' npm run client\n\n' + axios.stdout, encoding='utf-8')
    url = f'https://github.com/{OWNER}/{REPO}/blob/main/final_project/router/general.js'
    (DEST / 'task11_general_url.txt').write_text(url + '\n', encoding='utf-8')
    (DEST / 'general.js').write_text((PROJECT / 'router/general.js').read_text(), encoding='utf-8')
    print('Evidence saved to ' + str(DEST))
finally:
    server.terminate()
    try:
        server.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()
        server.wait()
