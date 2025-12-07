import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from './components/HeroSection'
import FeaturesSection from './components/FeaturesSection'
import BenefitsSection from './components/BenefitsSection'
import PricingSection from './components/PricingSection'
import Header from './components/Header'
import './styles/landing.css'

const LandingPage = () => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/login')
  }

  return (
    <div className="landing-page">
      <Header onGetStarted={handleGetStarted} />
      <HeroSection onGetStarted={handleGetStarted} />
      <FeaturesSection />
      <BenefitsSection />
      <PricingSection onGetStarted={handleGetStarted} />
    </div>
  )
}

export default LandingPage
