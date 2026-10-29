import { EthereumDocItem } from './ethereum-docs-data';

// Localized prose only; routes, examples, and responses remain unchanged.
const categories: Record<string, string> = {
  "Ethereum basics": "Kiến thức cơ bản về Ethereum",
  "Basics": "Cơ bản",
  "Gas and fees": "Gas và phí",
  "Fees": "Phí",
  "Transaction status": "Trạng thái giao dịch",
  "Transactions": "Giao dịch",
  "Accounts, contracts, and tokens": "Tài khoản, hợp đồng và token",
  "Accounts": "Tài khoản",
  "Tokens": "Token",
  "Explorer": "Trình khám phá",
  "Support": "Hỗ trợ",
  "Using the API": "Sử dụng API",
  "Overview": "Tổng quan",
  "Network and pending sample": "Mạng và mẫu đang chờ",
  "Network": "Mạng",
  "Blocks": "Khối",
  "Accounts and tokens": "Tài khoản và token",
  "Connection": "Kết nối",
  "Actions": "Hành động",
  "Subscriptions": "Đăng ký theo dõi"
};
type Translation = { title: string; description: string };
const entries: Record<string, Translation> = {
  "how-ethereum-transactions-work": {
    "title": "Giao dịch Ethereum hoạt động như thế nào?",
    "description": "<p>Giao dịch Ethereum là chỉ thị được ký từ tài khoản do bên ngoài sở hữu. Giao dịch có thể chuyển ETH, gọi hoặc tạo hợp đồng thông minh, hoặc mang dữ liệu mà không có giá trị ETH. Nonce của người gửi sắp xếp các giao dịch của tài khoản, nên nonce sau không thể được đưa vào khi nonce trước chưa được giải quyết.</p><p>Trình khám phá phân biệt ETH được chuyển với phí. Lệnh gọi hợp đồng có thể chuyển token hoặc thay đổi trạng thái ngay cả khi giá trị ETH bằng không.</p><p class=\"mt-3\">Thông tin về giao thức: <a href=\"https://ethereum.org/developers/docs/transactions/\" target=\"_blank\" rel=\"noopener\">giao dịch</a>, <a href=\"https://ethereum.org/developers/docs/gas/\" target=\"_blank\" rel=\"noopener\">gas và phí</a>, và <a href=\"https://ethereum.org/developers/docs/accounts/\" target=\"_blank\" rel=\"noopener\">tài khoản</a>.</p>"
  },
  "accounts-and-contracts": {
    "title": "Tài khoản và hợp đồng khác nhau thế nào?",
    "description": "<p>Địa chỉ xác định tài khoản do bên ngoài sở hữu và tài khoản hợp đồng. Khóa riêng kiểm soát tài khoản do bên ngoài sở hữu và khởi tạo giao dịch; hợp đồng chứa mã và chạy khi được gọi. Trạng thái, tên, nhãn và thông tin xác minh hợp đồng là siêu dữ liệu của nhà cung cấp và có thể không khả dụng.</p><p>Trình khám phá không thể xác định quyền sở hữu địa chỉ.</p>"
  },
  "blocks-confirmations-finality": {
    "title": "Khối, xác nhận và tính chung kết nghĩa là gì?",
    "description": "<p>Mạng chính Ethereum sử dụng bằng chứng cổ phần. Giao dịch được xác nhận sau khi được đưa vào khối thực thi. Số xác nhận là độ sâu khối của tầng thực thi được quan sát khi các khối sau nối tiếp khối đó.</p><p>Độ sâu xác nhận là thông tin hữu ích, không phải bằng chứng về tính chung kết của đồng thuận. Trình khám phá này không cung cấp các điểm kiểm tra chung kết của beacon chain hoặc API chung kết, vì vậy không coi bất kỳ số xác nhận nào được chọn là tính chung kết của giao thức.</p>"
  },
  "what-is-gas": {
    "title": "Gas, wei và gwei là gì?",
    "description": "<p>Gas đo lượng công việc tính toán của EVM. Wei là đơn vị ETH nhỏ nhất: 1 ETH bằng 10<sup>18</sup> wei. Giá gas thường được hiển thị bằng gwei: 1 gwei bằng 10<sup>9</sup> wei, hay 0.000000001 ETH.</p><p><code>gasLimit</code> là gas tối đa được cho phép; <code>gasUsed</code> là lượng công việc mà giao dịch đã được đưa vào tiêu thụ. Phí thực thi bằng gas đã dùng nhân với giá gas thực tế. Các trường phí blob được hiển thị riêng khi có.</p>"
  },
  "base-and-priority-fees": {
    "title": "Phí cơ sở, phí ưu tiên và phí tối đa hoạt động thế nào?",
    "description": "<p>Với giao dịch EIP-1559, <code>maxFeePerGas</code> giới hạn giá được cho phép và <code>maxPriorityFeePerGas</code> giới hạn tiền thưởng. Giá thực tế được quyết định bởi phí cơ sở của khối cộng với phí ưu tiên áp dụng, trong các giới hạn đó. Phần phí cơ sở bị đốt; phí ưu tiên là phần khuyến khích trình xác thực.</p><p>Phí tối đa là mức trần, không nhất thiết là số tiền đã trả. Giao dịch cũ hiển thị trường giá gas thay thế.</p>"
  },
  "fee-estimates": {
    "title": "Nên sử dụng khuyến nghị giá gas thế nào?",
    "description": "<p>Các giá trị chậm, trung bình và nhanh là quan sát từ nhà cung cấp, được REST API trả về bằng wei. Chúng không phải báo giá hoặc cam kết được đưa vào khối. Ví có thể chọn cài đặt dựa trên độ khẩn cấp, các phụ thuộc nonce và phí cơ sở mới nhất.</p><p>Với giao dịch đã được đưa vào khối, hãy dùng giá gas thực tế và gas đã dùng để hiểu số tiền đã trả. Với giao dịch đang chờ, có thể chỉ biết mức phí tối đa có thể phải trả.</p>"
  },
  "execution-status-and-confirmations": {
    "title": "Vì sao giao dịch đã xác nhận vẫn có thể thất bại?",
    "description": "<p>Việc được đưa vào khối và việc thực thi là hai điều khác nhau. Một giao dịch có thể được xác nhận trong khối nhưng vẫn hoàn tác hoặc báo lỗi do thực thi EVM thất bại; giao dịch vẫn có thể tiêu thụ gas. Kết quả thành công nghĩa là lần thực thi được ghi nhận đã hoàn tất, không có nghĩa tương tác hợp đồng đạt kết quả nghiệp vụ người dùng mong đợi.</p><p>Hãy xem đồng thời <code>status.confirmed</code>, Ethereum <code>status</code>/<code>result</code>, cờ lỗi và lý do hoàn tác nếu có.</p>"
  },
  "why-pending": {
    "title": "Vì sao giao dịch đang chờ hoặc không xuất hiện?",
    "description": "<p>Giao dịch đang chờ có thể có giá quá thấp, bị chặn bởi nonce nhỏ hơn của người gửi, chưa được nhà cung cấp nhìn thấy, bị thay thế bằng cùng nonce, hoặc bị ví hay nút gửi loại bỏ. Chỉ xem trạng thái đang chờ không đủ để xác định trường hợp nào đã xảy ra.</p><p>Ethereum không có một mempool toàn cầu duy nhất. Các nhà cung cấp có thể quan sát những giao dịch và thứ tự khác nhau. Hãy kiểm tra ví hoặc dịch vụ đã gửi trước khi thay thế hay hủy giao dịch.</p>"
  },
  "pending-sample": {
    "title": "Chế độ xem hoạt động đang chờ thể hiện điều gì?",
    "description": "<p>Phần hiển thị đang chờ là mẫu có giới hạn từ nhà cung cấp được kết nối. Nó ước tính lượt trình xác thực tiếp theo từ các giao dịch và dữ liệu gas đã quan sát. Đây không phải toàn bộ mempool mạng, sổ đấu giá hay dự báo nhiều khối có tính quyết định.</p><p>Không có trong mẫu không có nghĩa giao dịch không hợp lệ; việc xuất hiện cũng không bảo đảm được đưa vào khối tiếp theo.</p>"
  },
  "transaction-fields": {
    "title": "Những trường giao dịch nào dành riêng cho Ethereum?",
    "description": "<p>Siêu dữ liệu Ethereum gồm danh tính người gửi và nhận, nonce, loại, dữ liệu đầu vào, thông tin phương thức được giải mã khi có, các trường gas, chi tiết phí, độ sâu xác nhận, kết quả thực thi, thông tin hợp đồng được tạo và bản ghi chuyển token. Số tiền cần độ chính xác là chuỗi thập phân; hãy dùng số nguyên có độ chính xác tùy ý.</p><p>Việc giải mã đầu vào, nhãn, danh sách chuyển và lý do hoàn tác phụ thuộc dữ liệu thượng nguồn. Thiếu những thông tin này không chứng minh giao dịch không có tương tác hợp đồng hay nhật ký.</p>"
  },
  "address-page": {
    "title": "Trang địa chỉ hiển thị gì?",
    "description": "<p>Tóm tắt tài khoản hiển thị số dư ETH hiện tại, danh tính tài khoản hoặc hợp đồng, một số số dư token và bộ đếm khi có dữ liệu đã lập chỉ mục. Các trường riêng của Ethereum nằm trong thuộc tính <code>ethereum</code>. Số dư phản ánh trạng thái mới nhất của nhà cung cấp và có thể chưa gồm ảnh hưởng của giao dịch đang chờ.</p>"
  },
  "history-availability": {
    "title": "Vì sao lịch sử tài khoản hoặc token không đầy đủ?",
    "description": "<p>JSON-RPC có thể cung cấp trạng thái như số dư và mã hợp đồng, nhưng lịch sử địa chỉ và token đầy đủ cần một bộ lập chỉ mục. Khi dùng nguồn dự phòng, trình khám phá cung cấp chi tiết tài khoản dựa trên RPC và đánh dấu lịch sử bằng <code>historyUnavailable</code>.</p><p>Nguồn dự phòng chuyển token được đánh dấu <code>recentOnly</code>. Đây là lượt quét có giới hạn các nhật ký chuyển tiêu chuẩn gần đây và không được dùng làm sổ sách lịch sử đầy đủ.</p>"
  },
  "tokens-and-contracts": {
    "title": "Chi tiết token và hợp đồng được lấy như thế nào?",
    "description": "<p>Trang token được xác định bằng địa chỉ hợp đồng. Siêu dữ liệu đã lập chỉ mục có thể gồm tên, ký hiệu, số chữ số thập phân, nguồn cung, người nắm giữ và lượt chuyển. Nếu không khả dụng, bộ điều hợp có thể gọi các phương thức ERC-20 tiêu chuẩn để lấy trường cơ bản. Tên hoặc ký hiệu trả về là siêu dữ liệu không đáng tin cậy, không phải kiểm tra tính hợp pháp.</p><p>Trình khám phá này không cung cấp truy vết thực thi tổng quát, lịch sử giao dịch nội bộ, API hạn mức hoặc API danh mục/kế toán.</p>"
  },
  "searching": {
    "title": "Có thể tìm kiếm gì?",
    "description": "<p>Tìm kiếm hỗ trợ hàm băm giao dịch, địa chỉ 40 ký tự thập lục phân có tiền tố 0x, số khối thập phân và hàm băm khối. Địa chỉ hợp đồng token có thể mở chế độ xem token khi siêu dữ liệu khả dụng. Hàm băm và địa chỉ chính xác cho kết quả đáng tin cậy nhất.</p>"
  },
  "support-disclaimer": {
    "title": "Trình khám phá có thể khôi phục tiền hoặc hoàn tác giao dịch không?",
    "description": "<p>Không. eth.tx.taxi hiển thị dữ liệu Ethereum công khai. Trang không thể truy cập ví, hoàn tác giao dịch, lấy khóa riêng hoặc khôi phục tiền. Để được hỗ trợ riêng cho tài khoản, hãy liên hệ ví, sàn giao dịch, cầu nối hoặc ứng dụng đã gửi giao dịch.</p>"
  },
  "rest-overview": {
    "title": "Quy ước và giới hạn",
    "description": "<p>Các tuyến được mô tả là điểm cuối <code>GET</code> công khai và trả về JSON trừ khi có ghi chú khác. Tham số hàm băm và địa chỉ là giá trị thập lục phân có tiền tố 0x. Số tiền và số lượng cần độ chính xác là chuỗi thập phân; không phân tích bằng JavaScript <code>Number</code>.</p><p>Đây là API đọc dữ liệu. Nó không phát giao dịch, ước tính gas cho dữ liệu lệnh gọi tùy ý, cung cấp truy vết thực thi hay byte giao dịch thô, hoặc bảo đảm lịch sử tài khoản đầy đủ khi nguồn dự phòng của bộ lập chỉ mục đang hoạt động.</p>"
  },
  "get-init-data": {
    "title": "Ảnh chụp trạng thái trình khám phá",
    "description": "<p>Trả về các khối gần đây, mẫu đang chờ có giới hạn, khuyến nghị gas, chỉ số mẫu đang chờ và trạng thái hiện tại của trình khám phá. Đây là dữ liệu bảng điều khiển; tên trường tương thích sử dụng ngữ nghĩa gas của Ethereum.</p>"
  },
  "get-network-info": {
    "title": "Trạng thái mạng",
    "description": "<p>Trả về độ cao tầng thực thi được quan sát, trạng thái đồng bộ, tên mạng và khoảng thời gian khối mục tiêu tính bằng mili giây. Không báo cáo tính chung kết của beacon chain.</p>"
  },
  "get-gas-estimates": {
    "title": "Giá gas khuyến nghị",
    "description": "<p>Trả về ước tính tương thích nhanh, trung bình và chậm dưới dạng số nguyên wei. Chia cho 1,000,000,000 để đổi sang gwei. Đây là giá trị quan sát hiện tại, không bảo đảm giá được đưa vào khối.</p>"
  },
  "get-pending-summary": {
    "title": "Tóm tắt mẫu đang chờ",
    "description": "<p>Trả về chỉ số của mẫu đang chờ được quan sát, gồm số lượng, gas lấy mẫu và tổng phí. Dù tên tuyến dùng để tương thích, đây không phải toàn bộ mempool Ethereum hay bản xuất txpool của một nút.</p>"
  },
  "get-recent-blocks": {
    "title": "Khối gần đây",
    "description": "<p>Trả về cửa sổ các khối gần đây hiện tại đã chuẩn hóa cho trình khám phá.</p>"
  },
  "get-blocks-at-height": {
    "title": "Các khối kết thúc ở một độ cao",
    "description": "<p>Trả về cửa sổ khối gần đây khả dụng kết thúc tại độ cao khối thực thi thập phân <code>:height</code>.</p>"
  },
  "get-block-height": {
    "title": "Hàm băm khối tại một độ cao",
    "description": "<p>Trả về hàm băm khối có tiền tố 0x dưới dạng văn bản thuần cho độ cao khối thập phân.</p>"
  },
  "get-block": {
    "title": "Tìm khối theo hàm băm",
    "description": "<p>Trả về chi tiết đã chuẩn hóa cho hàm băm khối Ethereum. Đây là dữ liệu tầng thực thi; thông tin trình xác thực và tính chung kết đồng thuận nằm ngoài phạm vi API này.</p>"
  },
  "get-block-transactions": {
    "title": "Giao dịch của khối",
    "description": "<p>Trả về tối đa 25 giao dịch đã chuẩn hóa từ một khối tại độ lệch bắt đầu từ 0 là <code>:start</code>. Sử dụng dữ liệu đã lập chỉ mục khi có, nếu không sẽ dùng giao dịch khối RPC.</p>"
  },
  "get-transaction": {
    "title": "Tìm giao dịch theo hàm băm",
    "description": "<p>Trả về giao dịch trình khám phá đã chuẩn hóa cùng <code>status.confirmed</code> và một đối tượng siêu dữ liệu <code>ethereum</code>.</p>"
  },
  "get-transaction-status": {
    "title": "Trạng thái đưa giao dịch vào khối",
    "description": "<p>Trả về trạng thái được đưa vào khối và, khi đã xác nhận, độ cao khối thực thi, hàm băm và thời gian nếu có. Điểm cuối không cho biết hợp đồng thực thi thành công hay không; hãy dùng siêu dữ liệu giao dịch để phân biệt.</p>"
  },
  "get-ethereum-transaction": {
    "title": "Siêu dữ liệu giao dịch Ethereum",
    "description": "<p>Trả về trạng thái và kết quả thực thi, số xác nhận, người gửi/người nhận hoặc hợp đồng được tạo, giá trị wei, các trường gas và phí, nonce, đầu vào và phương thức giải mã khi có, chuyển token, cùng siêu dữ liệu lỗi hoặc hoàn tác nếu được cung cấp. Đây không phải điểm cuối truy vết.</p>"
  },
  "get-address": {
    "title": "Tóm tắt tài khoản",
    "description": "<p>Trả về tóm tắt địa chỉ đã chuẩn hóa. Số dư, danh tính, bộ đếm, số dư token và khả năng xem lịch sử của Ethereum nằm trong <code>ethereum</code>. Nguồn dự phòng có thể đặt <code>ethereum.historyUnavailable</code>.</p>"
  },
  "get-address-transactions": {
    "title": "Giao dịch tài khoản",
    "description": "<p>Trả về các giao dịch đã lập chỉ mục của một địa chỉ. Thêm <code>?after_txid=0x…</code> để tiếp tục sau giao dịch được trả về. Nguồn dự phòng RPC trả về danh sách rỗng, không khẳng định lịch sử trên chuỗi trống.</p>"
  },
  "get-address-metadata": {
    "title": "Siêu dữ liệu tài khoản Ethereum",
    "description": "<p>Trả về danh tính tài khoản hoặc hợp đồng, số dư ETH hiện tại tính bằng wei, siêu dữ liệu tạo nếu có, bộ đếm, một số số dư token và <code>historyUnavailable</code>.</p>"
  },
  "get-token": {
    "title": "Siêu dữ liệu token",
    "description": "<p>Trả về siêu dữ liệu của hợp đồng token. Ưu tiên siêu dữ liệu bộ lập chỉ mục; các trường ERC-20 cơ bản có thể dự phòng bằng lệnh gọi hợp đồng trực tiếp. Hãy coi trường thiếu là không khả dụng và tên hoặc ký hiệu là không đáng tin cậy.</p>"
  },
  "get-token-transfers": {
    "title": "Chuyển token",
    "description": "<p>Trả về các lượt chuyển và siêu dữ liệu phân trang. Yêu cầu đã lập chỉ mục nhận <code>block_number</code>, <code>index</code> và <code>items_count</code> dạng số. Nguồn dự phòng đặt <code>historyUnavailable: true</code> và <code>recentOnly: true</code>: đây là lượt quét có giới hạn các nhật ký chuyển tiêu chuẩn gần đây, không phải toàn bộ lịch sử.</p>"
  },
  "websocket-connect": {
    "title": "Kết nối và nhận ảnh chụp trực tiếp",
    "description": "<p>Kết nối đến <code>/api/v1/ws</code>. Máy chủ gửi ảnh chụp trình khám phá ban đầu và các ảnh chụp sau khi đầu chuỗi hoặc mẫu đang chờ được quan sát thay đổi, cùng tín hiệu duy trì định kỳ. Các trường ảnh chụp theo <code>/api/v1/init-data</code>.</p><p>Đây là chế độ xem của bộ điều hợp dựa trên nhà cung cấp, không phải đăng ký máy khách thực thi thô hay luồng mempool toàn cầu.</p>"
  },
  "websocket-init": {
    "title": "Yêu cầu ảnh chụp mới",
    "description": "<p>Gửi ngay ảnh chụp trình khám phá hiện tại, hữu ích sau khi kết nối lại.</p>"
  },
  "websocket-ping": {
    "title": "Ping duy trì kết nối",
    "description": "<p>Kiểm tra kết nối có phản hồi hay không.</p>"
  },
  "websocket-track-transaction": {
    "title": "Theo dõi một giao dịch",
    "description": "<p>Theo dõi một hàm băm 32 byte có tiền tố 0x. Máy chủ trước tiên gửi ước tính tương thích <code>txPosition</code>, sau đó gửi <code>{ \"tx\": … }</code> khi trạng thái đã chuẩn hóa thay đổi. Hàm băm mới thay thế đăng ký trước đó. Vị trí lượt tiếp theo là ước tính từ mẫu quan sát, không bảo đảm được đưa vào khối.</p>"
  },
  "websocket-track-address": {
    "title": "Theo dõi một tài khoản",
    "description": "<p>Theo dõi một địa chỉ bằng lịch sử đã lập chỉ mục khả dụng. Giao dịch đang chờ mới quan sát được gửi dưới dạng <code>address-transactions</code>; giao dịch mới xác nhận hoặc thay đổi được gửi dưới dạng <code>block-transactions</code>. Địa chỉ mới thay thế đăng ký trước đó. Không tạo sự kiện giả khi lập chỉ mục lịch sử không khả dụng.</p>"
  },
  "websocket-track-pending": {
    "title": "Theo dõi ước tính đang chờ cho lượt tiếp theo",
    "description": "<p>Chỉ số <code>0</code> trả về ước tính mẫu đang chờ được quan sát dưới dạng <code>projected-block-transactions</code>. Ethereum không có dự báo gói nhiều khối mang tính quyết định, nên các chỉ số cao hơn không có giao dịch dự kiến. Gửi <code>-1</code> để xóa đăng ký.</p>"
  },
  "websocket-reconnect": {
    "title": "Kết nối lại an toàn",
    "description": "<p>Sau khi kết nối đóng, hãy kết nối lại với thời gian chờ tăng dần, gửi <code>{ \"action\": \"init\" }</code>, rồi tạo lại các đăng ký. Thông điệp đăng ký sai định dạng hoặc không được hỗ trợ sẽ bị bỏ qua; hãy xác thực dữ liệu máy khách và không suy ra rằng yêu cầu được chấp nhận chỉ vì không có phản hồi.</p>"
  }
};

export function localizeEthereumDocsVietnamese(items: EthereumDocItem[], locale: string): EthereumDocItem[] {
  if (!locale.toLowerCase().startsWith('vi')) { return items; }
  return items.map(item => {
    if (item.type === 'category') { return { ...item, title: categories[item.title] || item.title }; }
    const translation = entries[item.fragment];
    return { ...item, ...translation, category: categories[item.category] || item.category };
  });
}
