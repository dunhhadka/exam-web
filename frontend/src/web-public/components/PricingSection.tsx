import { Button } from 'antd'
import { CheckOutlined } from '@ant-design/icons'

interface PricingSectionProps {
  onGetStarted: () => void
}

const PricingSection = ({ onGetStarted }: PricingSectionProps) => {
  const pricingPlans = [
    {
      icon: '/icon/free.png',
      title: 'FREE',
      subtitle: 'Miễn phí',
      price: 'Miễn phí',
      features: [
        'Miễn phí',
        'Nhận diện ID: 100 lượt',
        'Nhận diện giọng nói: 1000 lượt',
        'Dung lượng lưu trữ: 500MB',
        'Giới hạn tạo đề: 5 đề',
        'Giới hạn số lượng câu hỏi: 20 câu hỏi cho 1 đề',
        'Giới hạn giao bài test trên 1 đề (giới hạn số lần sử dụng của 1 đề): 25 lượt nộp bài cho 1 đề',
        'Giới hạn nhận viên: 0',
        'Xóa dung lượng: tự động xóa sau 30 ngày',
      ],
      buttonText: 'ĐĂNG KÝ',
      buttonVariant: 'default',
    },
    {
      icon: '/icon/plus.png',
      title: 'PLUS',
      subtitle: '390.000 đ/tháng',
      price: '390.000 đ/tháng',
      features: [
        'Nhận diện ID: 1000 lượt',
        'Nhận diện giọng nói: Không giới hạn',
        'Dung lượng lưu trữ: 50 GB',
        'Giới hạn tạo đề: Không giới hạn',
        'Giới hạn số lượng câu hỏi: Không giới hạn',
        'Giới hạn người làm bài: Không giới hạn',
        'Giới hạn giao bài test trên 1 đề (giới hạn số lần sử dụng của 1 đề): Không giới hạn',
        'Giới hạn nhận viên: 1',
        'Xóa dung lượng: User tự xóa',
      ],
      buttonText: 'ĐĂNG KÝ',
      buttonVariant: 'primary',
      featured: true,
    },
    {
      icon: '/icon/premium.png',
      title: 'PREMIUM',
      subtitle: '1.390.000 đ/tháng',
      price: '1.390.000 đ/tháng',
      features: [
        'Nhận diện ID: 5000 lượt',
        'Nhận diện giọng nói: Không giới hạn',
        'Dung lượng lưu trữ: 150 GB',
        'Giới hạn tạo đề: Không giới hạn',
        'Giới hạn số lượng câu hỏi: Không giới hạn',
        'Giới hạn người làm bài: Không giới hạn',
        'Giới hạn giao bài test trên 1 đề (giới hạn số lần sử dụng của 1 đề): Không giới hạn',
        'Giới hạn nhận viên: 5',
        'Xóa dung lượng: User tự xóa',
      ],
      buttonText: 'ĐĂNG KÝ',
      buttonVariant: 'success',
    },
    {
      icon: '/icon/enterprice.png',
      title: 'ENTERPRISE',
      subtitle: 'Giá liên hệ',
      price: 'Giá liên hệ',
      features: [
        'Giá KM: Liên hệ',
        'Nhận diện ID: Liên hệ',
        'Nhận diện giọng nói: Không giới hạn',
        'Dung lượng lưu trữ: Liên hệ',
        'Giới hạn tạo đề: Không giới hạn',
        'Giới hạn số lượng câu hỏi: Không giới hạn',
        'Giới hạn người làm bài: Không giới hạn',
        'Giới hạn giao bài test trên 1 đề (giới hạn số lần sử dụng của 1 đề): Không giới hạn',
        'Giới hạn nhận viên: 10',
        'Xóa dung lượng: User tự xóa',
      ],
      buttonText: 'ĐĂNG KÝ',
      buttonVariant: 'warning',
    },
  ]

  return (
    <section className="pricing-section" id="pricing">
      <div className="landing-container">
        <div className="section-header">
          <h2 className="section-title">
            <span className="gradient-text">Bảng giá</span>
          </h2>
          <p className="section-subtitle">
            Có chính sách hấp dẫn khi đăng ký theo năm
          </p>
        </div>

        <div className="pricing-cards">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-card ${plan.featured ? 'featured' : ''} plan-${plan.title.toLowerCase()}`}
            >
              <div className="card-icon">
                <img src={plan.icon} alt={plan.title} />
              </div>
              
              <div className="card-header">
                <h3 className="plan-title">{plan.title}</h3>
                <div className="plan-price">{plan.subtitle}</div>
              </div>

              <ul className="features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <CheckOutlined className="check-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                type={plan.buttonVariant === 'default' ? 'default' : 'primary'}
                size="large"
                block
                className={`pricing-button btn-${plan.buttonVariant}`}
                onClick={onGetStarted}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection
