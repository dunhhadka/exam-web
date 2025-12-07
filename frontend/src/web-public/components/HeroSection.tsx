import { Button } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'

interface HeroSectionProps {
  onGetStarted: () => void
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="hero-section">
      <div className="landing-container">
        <div className="hero-content">
          <div className="hero-image-wrapper">
            <img 
              src="/image.png" 
              alt="Exam.vn - Công cụ đặc lực hỗ trợ tổ chức thi trực tuyến hiệu quả" 
              className="hero-main-image"
            />
          </div>
          
          <div className="hero-cta">
            <Button 
              type="primary" 
              size="large" 
              className="hero-cta-button"
              onClick={onGetStarted}
            >
              Bắt đầu ngay - Miễn phí
            </Button>
            <p className="hero-cta-text">
              Không cần cài đặt • Dùng thử miễn phí • Hỗ trợ 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Messenger and Zalo buttons */}
      <div className="floating-buttons">
        <button className="messenger-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.15 2 11.25c0 2.9 1.45 5.48 3.72 7.16v4.09l3.95-2.17c1.05.29 2.16.44 3.33.44 5.52 0 10-4.15 10-9.25S17.52 2 12 2zm1.05 12.45l-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z"/>
          </svg>
        </button>
        <button className="zalo-btn">
          <span className="zalo-text">Zalo</span>
        </button>
      </div>
    </section>
  )
}

export default HeroSection
