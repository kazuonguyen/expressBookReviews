# Hướng dẫn nộp Final Project

Mã nguồn: https://github.com/kazuonguyen/expressBookReviews

1. Chọn **Begin / Begin the Assignment** trên trang khóa học.
2. Với Task 1–10, mở file tương ứng trong bảng bên dưới và sao chép toàn bộ lệnh cURL cùng kết quả vào ô trả lời. Bạn cũng có thể dùng bản `BAI_NOP.md` đã gộp đầy đủ các câu trả lời.
3. Với Task 11, dán đúng URL `general.js` bên dưới.
4. Kiểm tra các câu trả lời rồi chọn **Submit assignment**.

| Task | File | Nội dung |
| --- | --- | --- |
| 1 | [githubrepo.txt](githubrepo.txt) | Xác nhận kho GitHub là fork của IBM |
| 2 | [getallbooks.txt](getallbooks.txt) | Lấy toàn bộ sách |
| 3 | [getbooksbyISBN.txt](getbooksbyISBN.txt) | Tìm sách theo ISBN |
| 4 | [getbooksbyauthor.txt](getbooksbyauthor.txt) | Tìm sách theo tác giả |
| 5 | [getbooksbytitle.txt](getbooksbytitle.txt) | Tìm sách theo tiêu đề |
| 6 | [getbookreview.txt](getbookreview.txt) | Lấy đánh giá ban đầu |
| 7 | [register.txt](register.txt) | Đăng ký người dùng |
| 8 | [login.txt](login.txt) | Đăng nhập |
| 9 | [reviewadded.txt](reviewadded.txt) | Thêm hoặc sửa đánh giá |
| 10 | [deletereview.txt](deletereview.txt) | Xóa đánh giá |
| 11 | [task11_general_url.txt](task11_general_url.txt) | URL mã nguồn của bốn hàm Axios |

URL để dán cho Task 11:

https://github.com/kazuonguyen/expressBookReviews/blob/main/final_project/router/general.js

Task 9 có thêm bằng chứng sửa đánh giá trong `reviewmodified.txt`. Nếu ô trả lời cho phép, bạn có thể dán cả `reviewadded.txt` và `reviewmodified.txt`.

Lưu ý:

- Tên kho mẫu thực tế là `expressBookReviews`, có chữ **s** ở cuối. File `githubrepo.txt` chứa kết quả API GitHub với `fork: true` và `parent` trỏ về kho IBM.
- Đánh giá ban đầu là `{}` vì toàn bộ sách trong dữ liệu gốc chưa có đánh giá. Đây là kết quả đúng của Task 6.
- Các lệnh đã được chạy trên máy cục bộ với một cổng trống tự chọn. Server ghi bằng chứng đã dừng sau khi thu thập kết quả; đây không phải URL dịch vụ công khai.
- Tài khoản trong bằng chứng chỉ là tài khoản thử nghiệm của ứng dụng. Mã đăng nhập được tạo trên server tạm thời đã dừng.
- `general.js` có đủ bốn hàm: callback lấy toàn bộ sách, Promise tìm ISBN, async/await tìm tác giả, async/await tìm tiêu đề. Tất cả đều dùng Axios và đã được kiểm thử bằng HTTP thực tế.
- Kiểm thử: 4 nhóm kiểm thử đạt, 0 thất bại; `npm audit` báo 0 lỗ hổng tại thời điểm kiểm tra. Chi tiết trong `validation.txt` và `axios-results.txt`.
- Bài chưa được gửi trên trang khóa học. Không có điểm số chính thức cho đến khi hệ thống chấm bài.
