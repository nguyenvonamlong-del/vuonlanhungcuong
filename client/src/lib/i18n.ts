export type Language = 'vi' | 'en';

export const translations = {
  // Navigation
  nav: {
    home: { vi: 'Trang chủ', en: 'Home' },
    shop: { vi: 'Cửa hàng', en: 'Shop' },
    about: { vi: 'Giới thiệu', en: 'About' },
    contact: { vi: 'Liên hệ', en: 'Contact' },
    login: { vi: 'Đăng nhập', en: 'Login' },
    logout: { vi: 'Đăng xuất', en: 'Logout' },
    dashboard: { vi: 'Bảng điều khiển', en: 'Dashboard' },
    catalog: { vi: 'Danh mục', en: 'Catalog' },
    orders: { vi: 'Đơn hàng', en: 'Orders' },
    customers: { vi: 'Khách hàng', en: 'Customers' },
    technicians: { vi: 'Kỹ thuật viên', en: 'Technicians' },
    settings: { vi: 'Cài đặt', en: 'Settings' },
    trackOrder: { vi: 'Theo dõi đơn hàng', en: 'Track Order' },
    premadePots: { vi: 'Chậu có sẵn', en: 'Pre-made Pots' },
  },
  
  // Landing Page
  landing: {
    heroTitle: { 
      vi: 'Vườn Lan Hùng Cường', 
      en: 'Orchid Garden' 
    },
    heroSubtitle: { 
      vi: 'Chuyên cung cấp lan hồ điệp cao cấp', 
      en: 'Premium Phalaenopsis Orchids' 
    },
    heroCta: { 
      vi: 'Chậu Hoa Có Sẵn', 
      en: 'Premade Products' 
    },
    featuresTitle: { vi: 'Tại sao chọn chúng tôi', en: 'Why Choose Us' },
    feature1Title: { vi: 'Chất lượng cao', en: 'Premium Quality' },
    feature1Desc: { vi: 'Lan được chọn lọc kỹ càng từ các vườn uy tín', en: 'Carefully selected orchids from reputable gardens' },
    feature2Title: { vi: 'Giao hàng nhanh', en: 'Fast Delivery' },
    feature2Desc: { vi: 'Giao hàng toàn quốc trong 2-5 ngày', en: 'Nationwide delivery in 2-5 days' },
    feature3Title: { vi: 'Đảm bảo tươi', en: 'Fresh Guarantee' },
    feature3Desc: { vi: 'Đổi trả nếu lan không đạt chất lượng', en: 'Return if orchids don\'t meet quality standards' },
    feature4Title: { vi: 'Hỗ trợ 24/7', en: '24/7 Support' },
    feature4Desc: { vi: 'Tư vấn chăm sóc lan miễn phí', en: 'Free orchid care consultation' },
    aboutTitle: { vi: 'Về chúng tôi', en: 'About Us' },
    aboutDesc: { 
      vi: 'Với hơn 10 năm kinh nghiệm trong ngành lan, chúng tôi tự hào mang đến những chậu lan đẹp nhất cho khách hàng.', 
      en: 'With over 10 years of experience in the orchid industry, we pride ourselves on delivering the most beautiful orchids to our customers.' 
    },
    testimonialsTitle: { vi: 'Khách hàng nói gì', en: 'What Customers Say' },
    contactTitle: { vi: 'Liên hệ', en: 'Contact Us' },
  },
  
  // Login
  login: {
    title: { vi: 'Đăng nhập', en: 'Login' },
    username: { vi: 'Tên đăng nhập', en: 'Username' },
    password: { vi: 'Mật khẩu', en: 'Password' },
    submit: { vi: 'Đăng nhập', en: 'Sign In' },
    error: { vi: 'Sai tên đăng nhập hoặc mật khẩu', en: 'Invalid username or password' },
  },
  
  // Dashboard
  dashboard: {
    title: { vi: 'Bảng điều khiển', en: 'Dashboard' },
    totalRevenue: { vi: 'Tổng doanh thu', en: 'Total Revenue' },
    totalOrders: { vi: 'Tổng đơn hàng', en: 'Total Orders' },
    activeTechnicians: { vi: 'Kỹ thuật viên', en: 'Active Technicians' },
    lowStock: { vi: 'Hết hàng sắp', en: 'Low Stock Items' },
    recentOrders: { vi: 'Đơn hàng gần đây', en: 'Recent Orders' },
    revenueChart: { vi: 'Doanh thu 7 ngày', en: '7-Day Revenue' },
    ordersByStatus: { vi: 'Đơn hàng theo trạng thái', en: 'Orders by Status' },
  },
  
  // Catalog
  catalog: {
    title: { vi: 'Danh mục lan', en: 'Orchid Catalog' },
    addNew: { vi: 'Thêm mới', en: 'Add New' },
    edit: { vi: 'Sửa', en: 'Edit' },
    delete: { vi: 'Xóa', en: 'Delete' },
    species: { vi: 'Giống lan', en: 'Species' },
    color: { vi: 'Màu sắc', en: 'Color' },
    height: { vi: 'Chiều cao', en: 'Height' },
    price: { vi: 'Giá', en: 'Price' },
    stock: { vi: 'Tồn kho', en: 'Stock' },
    status: { vi: 'Trạng thái', en: 'Status' },
    actions: { vi: 'Thao tác', en: 'Actions' },
    active: { vi: 'Hoạt động', en: 'Active' },
    inactive: { vi: 'Ngưng', en: 'Inactive' },
    discontinued: { vi: 'Ngừng kinh doanh', en: 'Discontinued' },
    noItems: { vi: 'Chưa có sản phẩm nào', en: 'No items yet' },
  },
  
  // Orders
  orders: {
    title: { vi: 'Quản lý đơn hàng', en: 'Order Management' },
    orderNumber: { vi: 'Mã đơn', en: 'Order #' },
    customer: { vi: 'Khách hàng', en: 'Customer' },
    total: { vi: 'Tổng tiền', en: 'Total' },
    status: { vi: 'Trạng thái', en: 'Status' },
    date: { vi: 'Ngày tạo', en: 'Date' },
    actions: { vi: 'Thao tác', en: 'Actions' },
    viewDetails: { vi: 'Xem chi tiết', en: 'View Details' },
    updateStatus: { vi: 'Cập nhật trạng thái', en: 'Update Status' },
    assignTechnician: { vi: 'Phân công KTV', en: 'Assign Technician' },
    markDeposit: { vi: 'Xác nhận cọc', en: 'Confirm Deposit' },
    markPaid: { vi: 'Xác nhận thanh toán', en: 'Confirm Payment' },
    cancel: { vi: 'Hủy đơn', en: 'Cancel Order' },
    noOrders: { vi: 'Chưa có đơn hàng nào', en: 'No orders yet' },
  },
  
  // Order Status
  status: {
    PENDING: { vi: 'Chờ xử lý', en: 'Pending' },
    CONFIRMED: { vi: 'Đã xác nhận', en: 'Confirmed' },
    PREPARING: { vi: 'Đang chuẩn bị', en: 'Preparing' },
    READY: { vi: 'Sẵn sàng', en: 'Ready' },
    SHIPPING: { vi: 'Đang giao', en: 'Shipping' },
    DELIVERED: { vi: 'Đã giao', en: 'Delivered' },
    CANCELLED: { vi: 'Đã hủy', en: 'Cancelled' },
  },
  
  // Checkout
  checkout: {
    title: { vi: 'Thanh toán', en: 'Checkout' },
    step1: { vi: 'Tạo chậu', en: 'Create Pot' },
    step2: { vi: 'Thông tin', en: 'Information' },
    step3: { vi: 'Vận chuyển', en: 'Shipping' },
    step4: { vi: 'Xem lại', en: 'Review' },
    step5: { vi: 'Thanh toán', en: 'Payment' },
    addPot: { vi: 'Thêm chậu', en: 'Add Pot' },
    removePot: { vi: 'Xóa chậu', en: 'Remove Pot' },
    potName: { vi: 'Tên chậu', en: 'Pot Name' },
    selectOrchid: { vi: 'Chọn lan', en: 'Select Orchid' },
    quantity: { vi: 'Số lượng', en: 'Quantity' },
    minQuantity: { vi: 'Tối thiểu 5 cây', en: 'Minimum 5 stems' },
    subtotal: { vi: 'Tạm tính', en: 'Subtotal' },
    shipping: { vi: 'Phí vận chuyển', en: 'Shipping' },
    total: { vi: 'Tổng cộng', en: 'Total' },
    deposit: { vi: 'Tiền cọc (50%)', en: 'Deposit (50%)' },
    remaining: { vi: 'Còn lại', en: 'Remaining' },
    next: { vi: 'Tiếp tục', en: 'Next' },
    back: { vi: 'Quay lại', en: 'Back' },
    placeOrder: { vi: 'Đặt hàng', en: 'Place Order' },
    orderSuccess: { vi: 'Đặt hàng thành công!', en: 'Order placed successfully!' },
    trackingToken: { vi: 'Mã theo dõi', en: 'Tracking Code' },
  },
  
  // Shop
  shop: {
    title: { vi: 'Cửa hàng', en: 'Shop' },
    filter: { vi: 'Lọc', en: 'Filter' },
    search: { vi: 'Tìm kiếm', en: 'Search' },
    sortBy: { vi: 'Sắp xếp', en: 'Sort By' },
    featured: { vi: 'Nổi bật', en: 'Featured' },
    priceLowHigh: { vi: 'Giá thấp - cao', en: 'Price: Low to High' },
    priceHighLow: { vi: 'Giá cao - thấp', en: 'Price: High to Low' },
    addToCart: { vi: 'Thêm vào giỏ', en: 'Add to Cart' },
    viewDetails: { vi: 'Xem chi tiết', en: 'View Details' },
    cart: { vi: 'Giỏ hàng', en: 'Cart' },
    emptyCart: { vi: 'Giỏ hàng trống', en: 'Cart is empty' },
    checkout: { vi: 'Thanh toán', en: 'Checkout' },
    inStock: { vi: 'Còn hàng', en: 'In Stock' },
    outOfStock: { vi: 'Hết hàng', en: 'Out of Stock' },
    size: { vi: 'Kích thước', en: 'Size' },
    difficulty: { vi: 'Độ khó', en: 'Difficulty' },
    easy: { vi: 'Dễ', en: 'Easy' },
    medium: { vi: 'Trung bình', en: 'Medium' },
    hard: { vi: 'Khó', en: 'Hard' },
    small: { vi: 'Nhỏ', en: 'Small' },
    large: { vi: 'Lớn', en: 'Large' },
    xlarge: { vi: 'Rất lớn', en: 'X-Large' },
  },
  
  // Order Tracking
  tracking: {
    title: { vi: 'Theo dõi đơn hàng', en: 'Track Your Order' },
    enterCode: { vi: 'Nhập mã theo dõi', en: 'Enter tracking code' },
    track: { vi: 'Theo dõi', en: 'Track' },
    orderDetails: { vi: 'Chi tiết đơn hàng', en: 'Order Details' },
    timeline: { vi: 'Tiến trình', en: 'Timeline' },
    notFound: { vi: 'Không tìm thấy đơn hàng', en: 'Order not found' },
  },
  
  // Payment
  payment: {
    title: { vi: 'Thanh toán', en: 'Payment' },
    scanQR: { vi: 'Quét mã QR để thanh toán', en: 'Scan QR code to pay' },
    bankInfo: { vi: 'Thông tin chuyển khoản', en: 'Bank Transfer Info' },
    bankName: { vi: 'Ngân hàng', en: 'Bank' },
    accountNumber: { vi: 'Số tài khoản', en: 'Account Number' },
    accountHolder: { vi: 'Chủ tài khoản', en: 'Account Holder' },
    amount: { vi: 'Số tiền', en: 'Amount' },
    description: { vi: 'Nội dung', en: 'Description' },
    copied: { vi: 'Đã sao chép!', en: 'Copied!' },
  },
  
  // Common
  common: {
    save: { vi: 'Lưu', en: 'Save' },
    cancel: { vi: 'Hủy', en: 'Cancel' },
    confirm: { vi: 'Xác nhận', en: 'Confirm' },
    delete: { vi: 'Xóa', en: 'Delete' },
    edit: { vi: 'Sửa', en: 'Edit' },
    add: { vi: 'Thêm', en: 'Add' },
    search: { vi: 'Tìm kiếm', en: 'Search' },
    loading: { vi: 'Đang tải...', en: 'Loading...' },
    error: { vi: 'Có lỗi xảy ra', en: 'An error occurred' },
    success: { vi: 'Thành công', en: 'Success' },
    required: { vi: 'Bắt buộc', en: 'Required' },
    optional: { vi: 'Tùy chọn', en: 'Optional' },
    vnd: { vi: '₫', en: 'VND' },
    cm: { vi: 'cm', en: 'cm' },
    stems: { vi: 'cây', en: 'stems' },
    copy: { vi: 'Sao chép', en: 'Copy' },
    noData: { vi: 'Không có dữ liệu', en: 'No data' },
  },
  
  // Form Fields
  form: {
    fullName: { vi: 'Họ tên', en: 'Full Name' },
    phone: { vi: 'Số điện thoại', en: 'Phone Number' },
    email: { vi: 'Email', en: 'Email' },
    province: { vi: 'Tỉnh/Thành phố', en: 'Province/City' },
    district: { vi: 'Quận/Huyện', en: 'District' },
    ward: { vi: 'Phường/Xã', en: 'Ward' },
    address: { vi: 'Địa chỉ', en: 'Street Address' },
    notes: { vi: 'Ghi chú', en: 'Notes' },
  },
};

export function t(key: string, lang: Language): string {
  const keys = key.split('.');
  let value: any = translations;
  for (const k of keys) {
    value = value?.[k];
    if (!value) return key;
  }
  return value[lang] || value.en || key;
}

export function formatCurrency(amount: number | string, lang: Language = 'vi'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') + (lang === 'vi' ? '₫' : ' VND');
}
