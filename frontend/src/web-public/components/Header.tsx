import { Button } from 'antd'

interface HeaderProps {
  onGetStarted: () => void
}

const Header = ({ onGetStarted }: HeaderProps) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="landing-header">
      <div className="landing-container">
        <div className="header-content">
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M8 12L20 4L32 12V28L20 36L8 28V12Z"
                fill="#1890ff"
              />
              <path
                d="M20 16L26 20V28L20 32L14 28V20L20 16Z"
                fill="#fff"
              />
            </svg>
            <span className="logo-text">exam.vn</span>
          </div>

          <nav className="nav-menu">
            <a onClick={() => scrollToSection('about')}>Về chúng tôi</a>
            <a onClick={() => scrollToSection('features')}>Tính năng</a>
            <a onClick={() => scrollToSection('pricing')}>Bảng giá</a>
            <a onClick={() => scrollToSection('news')}>Tin tức</a>
            <a onClick={() => scrollToSection('guide')}>Hướng dẫn</a>
            <a onClick={() => scrollToSection('contact')}>Liên hệ</a>
          </nav>

          <div className="header-actions">
            <Button type="primary" size="large" onClick={onGetStarted}>
              Đăng ký miễn phí
            </Button>
            <Button size="large" onClick={onGetStarted}>
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
