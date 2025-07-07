import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Users,
  MessageSquare,
  Brain,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Globe,
  Smartphone,
  Cloud,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Personas",
      description:
        "Create intelligent digital versions of yourself that learn and adapt to your personality, memories, and communication style.",
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description:
        "Engage in meaningful conversations with your personas using advanced natural language processing.",
    },
    {
      icon: Users,
      title: "Multiple Personas",
      description:
        "Build different personas for various aspects of your life - professional, personal, creative, and more.",
    },
    {
      icon: Zap,
      title: "Real-time Learning",
      description:
        "Your personas continuously learn from your interactions, becoming more accurate representations over time.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "Your data is encrypted and secure. You maintain full control over your personas and conversations.",
    },
    {
      icon: Globe,
      title: "Cross-Platform",
      description:
        "Access your personas from anywhere - web, mobile, and soon desktop applications.",
    },
  ];

  const benefits = [
    "Preserve your memories and experiences",
    "Create digital companions that understand you",
    "Build a legacy for future generations",
    "Enhance communication and self-reflection",
    "Secure and private data handling",
    "Continuous AI learning and improvement",
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Digital Creator",
      content:
        "This platform has transformed how I think about digital legacy. My AI persona captures my creative process perfectly.",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Business Executive",
      content:
        "The ability to create professional personas has been invaluable for my team's knowledge management.",
      rating: 5,
    },
    {
      name: "Dr. Emily Watson",
      role: "Research Scientist",
      content:
        "As a researcher, I appreciate the scientific approach to personality modeling. The results are impressive.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Hibiji</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-white/70 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-white/70 hover:text-white transition-colors"
              >
                Benefits
              </a>
              <a
                href="#testimonials"
                className="text-white/70 hover:text-white transition-colors"
              >
                Testimonials
              </a>
              <Link
                to="/login"
                className="text-white/70 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/70 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20">
            <div className="px-4 py-6 space-y-4">
              <a
                href="#features"
                className="block text-white/70 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="block text-white/70 hover:text-white transition-colors"
              >
                Benefits
              </a>
              <a
                href="#testimonials"
                className="block text-white/70 hover:text-white transition-colors"
              >
                Testimonials
              </a>
              <Link
                to="/login"
                className="block text-white/70 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium text-center transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Create Your
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                Digital Self
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Build intelligent AI personas that capture your personality,
              memories, and unique characteristics. Your digital legacy,
              preserved and enhanced with cutting-edge artificial intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex items-center justify-center"
              >
                Start Creating Your Digital Self
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-white/20 flex items-center justify-center"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for Your Digital Legacy
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Our platform combines advanced AI technology with intuitive design
              to help you create meaningful digital representations of yourself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Why Choose Hibiji?
              </h2>
              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                Our platform offers unique advantages that make creating and
                managing your personas both powerful and accessible.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-400 mr-4 flex-shrink-0" />
                    <span className="text-white/80 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        Personalized AI
                      </h3>
                      <p className="text-white/60 text-sm">
                        Learns your unique patterns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        Secure & Private
                      </h3>
                      <p className="text-white/60 text-sm">
                        Your data stays protected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        Real-time Learning
                      </h3>
                      <p className="text-white/60 text-sm">
                        Continuously improves
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Join thousands of users who are already creating their digital
              legacies with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-white/60 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Create Your Digital Legacy?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Start building your AI-powered personas today and preserve your
            unique personality for future generations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex items-center justify-center"
            >
              Get Started Free
              <ArrowUpRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-white/20 flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Hibiji</span>
              </div>
              <p className="text-white/70 mb-4 max-w-md">
                Creating intelligent digital representations of yourself with
                cutting-edge AI technology.
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Visit our website"
                >
                  <Globe className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Mobile app"
                >
                  <Smartphone className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Cloud services"
                >
                  <Cloud className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Benefits
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-white/60">© 2024 Hibiji. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
