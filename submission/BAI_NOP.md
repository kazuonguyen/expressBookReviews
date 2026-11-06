# Final Project — Nội dung để sao chép nộp bài

Repository: https://github.com/kazuonguyen/expressBookReviews

Mỗi phần dưới đây tương ứng với một ô trả lời. Sao chép lệnh và kết quả trong khối văn bản; dấu `$` là ký hiệu terminal.

## Task 1 — githubrepo

Xác nhận kho GitHub là fork của IBM.

```text
$ curl --silent --show-error --fail-with-body https://api.github.com/repos/kazuonguyen/expressBookReviews | python3 -c 'import json,sys; r=json.load(sys.stdin); print(json.dumps({k:r[k] for k in ('"'"'full_name'"'"','"'"'html_url'"'"','"'"'fork'"'"')} | {'"'"'parent'"'"':r['"'"'parent'"'"']['"'"'full_name'"'"'],'"'"'source'"'"':r['"'"'source'"'"']['"'"'full_name'"'"']},indent=2))'

{
  "full_name": "kazuonguyen/expressBookReviews",
  "html_url": "https://github.com/kazuonguyen/expressBookReviews",
  "fork": true,
  "parent": "ibm-developer-skills-network/expressBookReviews",
  "source": "ibm-developer-skills-network/expressBookReviews"
}
```

## Task 2 — getallbooks

Lấy toàn bộ sách.

```text
$ curl --silent --show-error --fail-with-body http://127.0.0.1:56664/ --write-out '
HTTP_STATUS:%{http_code}
'

{"1":{"author":"Chinua Achebe","title":"Things Fall Apart","reviews":{}},"2":{"author":"Hans Christian Andersen","title":"Fairy tales","reviews":{}},"3":{"author":"Dante Alighieri","title":"The Divine Comedy","reviews":{}},"4":{"author":"Unknown","title":"The Epic Of Gilgamesh","reviews":{}},"5":{"author":"Unknown","title":"The Book Of Job","reviews":{}},"6":{"author":"Unknown","title":"One Thousand and One Nights","reviews":{}},"7":{"author":"Unknown","title":"Njál's Saga","reviews":{}},"8":{"author":"Jane Austen","title":"Pride and Prejudice","reviews":{}},"9":{"author":"Honoré de Balzac","title":"Le Père Goriot","reviews":{}},"10":{"author":"Samuel Beckett","title":"Molloy, Malone Dies, The Unnamable, the trilogy","reviews":{}}}
HTTP_STATUS:200
```

## Task 3 — getbooksbyISBN

Tìm sách theo ISBN.

```text
$ curl --silent --show-error --fail-with-body http://127.0.0.1:56664/isbn/1 --write-out '
HTTP_STATUS:%{http_code}
'

{"author":"Chinua Achebe","title":"Things Fall Apart","reviews":{}}
HTTP_STATUS:200
```

## Task 4 — getbooksbyauthor

Tìm sách theo tác giả.

```text
$ curl --silent --show-error --fail-with-body http://127.0.0.1:56664/author/Unknown --write-out '
HTTP_STATUS:%{http_code}
'

{"4":{"author":"Unknown","title":"The Epic Of Gilgamesh","reviews":{}},"5":{"author":"Unknown","title":"The Book Of Job","reviews":{}},"6":{"author":"Unknown","title":"One Thousand and One Nights","reviews":{}},"7":{"author":"Unknown","title":"Njál's Saga","reviews":{}}}
HTTP_STATUS:200
```

## Task 5 — getbooksbytitle

Tìm sách theo tiêu đề.

```text
$ curl --silent --show-error --fail-with-body http://127.0.0.1:56664/title/Things%20Fall%20Apart --write-out '
HTTP_STATUS:%{http_code}
'

{"1":{"author":"Chinua Achebe","title":"Things Fall Apart","reviews":{}}}
HTTP_STATUS:200
```

## Task 6 — getbookreview

Lấy đánh giá ban đầu.

```text
$ curl --silent --show-error --fail-with-body http://127.0.0.1:56664/review/1 --write-out '
HTTP_STATUS:%{http_code}
'

{}
HTTP_STATUS:200
```

## Task 7 — register

Đăng ký người dùng.

```text
$ curl --silent --show-error --fail-with-body -X POST http://127.0.0.1:56664/register -H 'Content-Type: application/json' -d '{"username":"bookstore_student","password":"BookstoreDemo123!"}' --write-out '
HTTP_STATUS:%{http_code}
'

{"message":"User successfully registered. You may now log in."}
HTTP_STATUS:201
```

## Task 8 — login

Đăng nhập.

```text
$ curl --silent --show-error --fail-with-body -X POST http://127.0.0.1:56664/customer/login -H 'Content-Type: application/json' -d '{"username":"bookstore_student","password":"BookstoreDemo123!"}' -c cookies.txt --write-out '
HTTP_STATUS:%{http_code}
'

{"message":"User successfully logged in.","username":"bookstore_student","accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3OTM5MzI5NjIsImV4cCI6MTc5MzkzNjU2Miwic3ViIjoiYm9va3N0b3JlX3N0dWRlbnQifQ.MCMKsDQfIuBBE0r0xwMv5hlKiXYzbjAdZjI5_tNtg3M","expiresIn":"1h"}
HTTP_STATUS:200
```

## Task 9 — reviewadded

Thêm hoặc sửa đánh giá.

```text
$ curl --silent --show-error --fail-with-body -X PUT http://127.0.0.1:56664/customer/auth/review/1 -b cookies.txt -H 'Content-Type: application/json' -d '{"review":"An engaging novel with rich characters and cultural insights."}' --write-out '
HTTP_STATUS:%{http_code}
'

{"message":"Review successfully added.","isbn":"1","reviews":{"bookstore_student":"An engaging novel with rich characters and cultural insights."}}
HTTP_STATUS:200
```

Bằng chứng sửa đánh giá sau khi thêm:

```text
$ curl --silent --show-error --fail-with-body -X PUT http://127.0.0.1:56664/customer/auth/review/1 -b cookies.txt -H 'Content-Type: application/json' -d '{"review":"Updated review: a compelling exploration of tradition and change."}' --write-out '
HTTP_STATUS:%{http_code}
'

{"message":"Review successfully modified.","isbn":"1","reviews":{"bookstore_student":"Updated review: a compelling exploration of tradition and change."}}
HTTP_STATUS:200
```

## Task 10 — deletereview

Xóa đánh giá.

```text
$ curl --silent --show-error --fail-with-body -X DELETE http://127.0.0.1:56664/customer/auth/review/1 -b cookies.txt --write-out '
HTTP_STATUS:%{http_code}
'

{"message":"Review successfully deleted.","isbn":"1","reviews":{}}
HTTP_STATUS:200
```

## Task 11 — URL general.js

https://github.com/kazuonguyen/expressBookReviews/blob/main/final_project/router/general.js
