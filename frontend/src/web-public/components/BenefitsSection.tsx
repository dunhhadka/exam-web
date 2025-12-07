import { Button } from 'antd'

const BenefitsSection = () => {
  const benefits = [
    {
      icon: '/icon2/1.png',
      title: 'Đơn giản, dễ sử dụng',
      bgColor: '#fff4e6',
    },
    {
      icon: '/icon2/2.png',
      title: 'Đa dạng các loại câu hỏi kiểm tra',
      bgColor: '#e6f7ff',
    },
    {
      icon: '/icon2/3.png',
      title: 'Tổ chức thi với quy mô lớn',
      bgColor: '#fff7e6',
      description: 'Hỗ trợ tổ chức kỳ thi với số lượng thí sinh lớn, đảm bảo hệ thống ổn định, mượt mà trong suốt quá trình diễn ra kỳ thi',
    },
    {
      icon: '/icon2/4-30x30.png',
      title: 'Giám sát chống gian lận bằng công nghệ AI',
      bgColor: '#e6f7ff',
      description: 'Tích hợp công nghệ chống gian lận hàng đầu hiện nay, đảm bảo kỳ thi được diễn ra công bằng, minh bạch, chất lượng',
    },
    {
      icon: '/icon2/5-30x30.png',
      title: 'Báo cáo, thống kê kết quả trực quan',
      bgColor: '#f0ffe6',
    },
    {
      icon: '/icon2/6-30x30.png',
      title: 'Tối ưu chi phí nhân sự',
      bgColor: '#fff7e6',
    },
  ]

  return (
    <section className="benefits-section">
      <div className="landing-container">
        <h2 className="section-title">
          Exam.vn, hệ thống thi trực tuyến,
          <br />
          <span className="gradient-text">hỗ trợ toàn diện hoạt động</span>
          <br />
          kiểm tra, đánh giá
        </h2>

        <div className="benefits-content">
          <div className="benefits-demo">
            <img 
              src="/baitap.gif" 
              alt="Demo system"
              className="demo-image-full"
            />
          </div>

          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className={`benefit-item ${benefit.description ? 'benefit-expanded' : ''}`}
                style={{ backgroundColor: benefit.bgColor }}
              >
                <div className="benefit-icon-wrapper">
                  <img src={benefit.icon} alt={benefit.title} className="benefit-icon-img" />
                </div>
                <div className="benefit-content">
                  <h4 className="benefit-title">{benefit.title}</h4>
                  {benefit.description && (
                    <p className="benefit-description">{benefit.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cta-section">
          <Button type="primary" size="large" className="cta-button">
            Đăng ký miễn phí
          </Button>
        </div>
      </div>
    </section>
  )
}

export default BenefitsSection
