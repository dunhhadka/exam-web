import { useState } from 'react'
import { Tabs } from 'antd'

const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('1')

  const features = [
    {
      key: '1',
      title: 'Xác minh danh tính (AI)',
      icon: '/icon3/35x351active-35x35.png',
      description: 'Công nghệ giám sát hàng đầu khi thi trực tuyến',
      details: [
        'So sánh ảnh chụp cận cước công dân và ảnh chụp tại chỗ bằng webcam',
        'Cảnh báo nhiều khuôn mặt khi ghi hình',
        'Cảnh báo không thấy mặt khi ghi hình',
        'Cảnh báo khuôn mặt khác với ID khi ghi hình',
      ],
      demoImage: '/xacminhdanhtinh.jpg',
    },
    {
      key: '2',
      title: 'Bảo mật ghi hình',
      icon: '/icon3/35x352active-35x35.png',
      description: 'Ghi hình toàn bộ quá trình làm bài thi',
      details: [
        'Không cho phép học viên ghi hình hoặc chụp ảnh màn hình',
        'Buộc học sinh chia sẻ màn hình máy tính khi đang làm bài',
        'Ghi lại audio trên máy học sinh',
        'Ghi lại audio của môi trường vật lý mà học sinh đang ngồi để làm kiểm tra',
        'Ghi hình trình duyệt web',
        'Không cho phép thu nhỏ màn hình',
      ],
      demoImage: '/xacminhdanhtinh.jpg',
    },
    {
      key: '3',
      title: 'Cơ cấu kiểm tra an toàn',
      icon: '/icon3/35x353active-35x35.png',
      description: 'Đảm bảo môi trường thi cử công bằng',
      details: [
        'Ngân hàng câu hỏi',
        'Ngẫu nhiên câu hỏi',
        'Ngẫu nhiên thứ tự câu trả lời',
        'Hạn chế thời gian làm bài trên toàn bài kiểm tra',
        'Học viên đang nhập làm bài bằng mật mã do đơn vị thi cung cấp',
        'Mã hóa truyền tải dữ liệu',
      ],
      demoImage: '/xacminhdanhtinh.jpg',
    },
    {
      key: '4',
      title: 'Khóa trình duyệt web',
      icon: '/icon3/35x354active-35x35.png',
      description: 'Ngăn chặn truy cập website ngoài',
      details: [
        'Khóa copy-paste',
        'Khóa mở tab mới trên trình duyệt',
        'Không cho phép học viên ghi hình hoặc chụp ảnh trình duyệt',
        'Cảnh báo khi học viên ra khỏi tab đang làm bài',
      ],
      demoImage: '/xacminhdanhtinh.jpg',
    },
  ]

  return (
    <section className="features-section" id="features">
      <div className="landing-container">
        <div className="section-header">
          <h2 className="section-title">
            Công nghệ giám sát hàng đầu
            <br />
            <span className="gradient-text">khi thi trực tuyến</span>
          </h2>
        </div>

        <div className="features-content">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={features.map((feature) => ({
              key: feature.key,
              label: (
                <div className="tab-label">
                  <img src={feature.icon} alt={feature.title} className="tab-icon" />
                  <span>{feature.title}</span>
                </div>
              ),
              children: (
                <div className="feature-details">
                  <div className="feature-text">
                    {feature.details.map((detail, index) => (
                      <div key={index} className="detail-item">
                        <div className="check-box">✓</div>
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                  <div className="feature-image">
                    <img 
                      src={feature.demoImage} 
                      alt="Feature demo"
                      className="demo-image"
                    />
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
