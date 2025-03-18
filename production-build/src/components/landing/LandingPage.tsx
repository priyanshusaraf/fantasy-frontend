import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import ThreeScene from './ThreeScene';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  Trophy,
  Users,
  BarChart3,
  Play,
  Menu,
  X
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Handle scroll animations
  useEffect(() => {
    // Header animation (shrink on scroll)
    if (headerRef.current) {
      ScrollTrigger.create({
        trigger: headerRef.current,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          const progress = Math.min(self.progress * 2, 1);
          gsap.to(headerRef.current, {
            backgroundColor: `rgba(1, 6, 21, ${0.7 + progress * 0.3})`,
            backdropFilter: `blur(${progress * 10}px)`,
            padding: `${16 - progress * 6}px 0`,
            duration: 0.3,
          });
        },
      });
    }
    
    // Fade in animations for hero content
    if (heroContentRef.current) {
      gsap.from(heroContentRef.current.children, {
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
      });
    }
    
    // Animate feature sections on scroll
    featureRefs.current.forEach((ref, index) => {
      if (!ref) return;
      
      gsap.from(ref, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
          trigger: ref,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
        delay: index * 0.1,
      });
    });
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010615] to-[#0a0f2d] text-white overflow-hidden">
      {/* Three.js Scene (Fixed in background) */}
      <div className="fixed inset-0 z-0 opacity-80">
        <ThreeScene />
      </div>
      
      {/* Header/Navigation */}
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-[#010615] bg-opacity-70 backdrop-blur-sm transition-all duration-300"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 relative">
                <Image 
                  src="/images/matchup-logo.svg" 
                  alt="MatchUp Logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4f46e5] to-[#8452d8]">
                MatchUp
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="hover:text-[#4f46e5] transition-colors">
                Features
              </Link>
              <Link href="#tournaments" className="hover:text-[#4f46e5] transition-colors">
                Tournaments
              </Link>
              <Link href="#testimonials" className="hover:text-[#4f46e5] transition-colors">
                Testimonials
              </Link>
              <Link href="#pricing" className="hover:text-[#4f46e5] transition-colors">
                Pricing
              </Link>
              <div className="flex space-x-4">
                <Link href="/login">
                  <Button variant="outline" className="border-[#4f46e5] text-[#4f46e5] hover:bg-[#4f46e5] hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-[#4f46e5] to-[#8452d8] hover:opacity-90">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0f2d] border-t border-[#1f2b5b]"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="#features" 
                  className="py-2 hover:text-[#4f46e5] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#tournaments" 
                  className="py-2 hover:text-[#4f46e5] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tournaments
                </Link>
                <Link 
                  href="#testimonials" 
                  className="py-2 hover:text-[#4f46e5] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <Link 
                  href="#pricing" 
                  className="py-2 hover:text-[#4f46e5] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <div className="flex flex-col space-y-2 pt-2 border-t border-[#1f2b5b]">
                  <Link href="/login">
                    <Button variant="outline" className="w-full border-[#4f46e5] text-[#4f46e5] hover:bg-[#4f46e5] hover:text-white">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-[#4f46e5] to-[#8452d8] hover:opacity-90">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center pt-20">
          <div className="container mx-auto px-4">
            <div 
              ref={heroContentRef}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-block mb-4 px-4 py-1 rounded-full bg-gradient-to-r from-[#4f46e5]/20 to-[#8452d8]/20 backdrop-blur-sm border border-[#4f46e5]/30"
              >
                <span className="text-sm font-medium text-[#a4b4ef]">
                  Revolutionizing Fantasy Sports
                </span>
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a4b4ef]">
                Ultimate Fantasy Sports Experience for Racket Enthusiasts
              </h1>
              
              <p className="text-lg md:text-xl text-[#a4b4ef] mb-8 max-w-2xl mx-auto">
                Create your dream team, join tournaments, and compete in real-time with players around the world. Experience fantasy sports like never before.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button className="bg-gradient-to-r from-[#4f46e5] to-[#8452d8] hover:opacity-90 text-white px-8 py-6 text-lg">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button variant="outline" className="border-[#4f46e5]/50 hover:border-[#4f46e5] text-white hover:bg-[#4f46e5]/10 px-8 py-6 text-lg">
                  <Play className="mr-2 h-5 w-5" /> Watch Demo
                </Button>
              </div>
              
              <div className="mt-16 grid grid-cols-3 gap-4 max-w-xl mx-auto">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4f46e5] to-[#8452d8]">50+</div>
                  <div className="text-sm text-[#a4b4ef]">Tournaments</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4f46e5] to-[#8452d8]">10k+</div>
                  <div className="text-sm text-[#a4b4ef]">Active Users</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4f46e5] to-[#8452d8]">₹5M+</div>
                  <div className="text-sm text-[#a4b4ef]">Prize Pool</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a4b4ef]">
                Cutting-Edge Features
              </h2>
              <p className="text-lg text-[#a4b4ef] max-w-2xl mx-auto">
                Our platform offers everything you need to create, manage, and participate in fantasy sports competitions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Trophy className="h-12 w-12 text-[#4f46e5]" />,
                  title: "Dynamic Tournaments",
                  description: "Create and join tournaments with customizable rules, scoring systems, and prize pools."
                },
                {
                  icon: <BarChart3 className="h-12 w-12 text-[#4f46e5]" />,
                  title: "Real-time Analytics",
                  description: "Track your team's performance with detailed stats and analytics updated in real-time."
                },
                {
                  icon: <Users className="h-12 w-12 text-[#4f46e5]" />,
                  title: "Community Engagement",
                  description: "Connect with other players, form leagues, and share strategies within our community."
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  ref={el => { featureRefs.current[index] = el; }}
                  className="bg-[#0a0f2d]/80 backdrop-blur-sm border border-[#1f2b5b] rounded-xl p-6 hover:transform hover:translate-y-[-5px] transition-all duration-300"
                >
                  <div className="bg-[#0c123a] rounded-lg inline-block p-3 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-[#a4b4ef]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Gradient overlay for depth */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#010615] to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#010615] to-transparent"></div>
        </section>
        
        {/* Call to Action */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-[#4f46e5]/20 to-[#8452d8]/20 backdrop-blur-lg border border-[#4f46e5]/30 rounded-2xl p-8 md:p-12 relative overflow-hidden">
              {/* Background glow effect */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#4f46e5] rounded-full filter blur-[100px] opacity-30"></div>
              
              <div className="relative z-10 max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a4b4ef]">
                  Ready to Join the Ultimate Fantasy Sports Platform?
                </h2>
                <p className="text-lg text-[#a4b4ef] mb-8">
                  Create your account now and start building your dream team. Experience the thrill of fantasy sports like never before.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button className="bg-gradient-to-r from-[#4f46e5] to-[#8452d8] hover:opacity-90 text-white px-8 py-6 text-lg">
                    Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Link href="/tournaments">
                    <Button variant="outline" className="border-[#4f46e5]/50 hover:border-[#4f46e5] text-white hover:bg-[#4f46e5]/10 px-8 py-6 text-lg">
                      Explore Tournaments
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 bg-[#010615] border-t border-[#1f2b5b] py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 relative">
                  <Image 
                    src="/images/matchup-logo.svg" 
                    alt="MatchUp Logo" 
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4f46e5] to-[#8452d8]">
                  MatchUp
                </span>
              </div>
              <p className="text-sm text-[#a4b4ef]">
                The ultimate fantasy sports platform for racket sports enthusiasts.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-[#a4b4ef]">
                <li><Link href="#" className="hover:text-[#4f46e5]">Features</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">Tournaments</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">Leaderboards</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-[#a4b4ef]">
                <li><Link href="#" className="hover:text-[#4f46e5]">Documentation</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">API</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">Blog</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-[#a4b4ef]">
                <li><Link href="#" className="hover:text-[#4f46e5]">About</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">Careers</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">Privacy</Link></li>
                <li><Link href="#" className="hover:text-[#4f46e5]">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#1f2b5b] pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-[#a4b4ef] mb-4 md:mb-0">
              © 2024 MatchUp. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-[#a4b4ef] hover:text-[#4f46e5]">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-[#a4b4ef] hover:text-[#4f46e5]">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858-.182-.466-.398-.8-.748-1.15-.35-.35-.683-.566-1.15-.748-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="#" className="text-[#a4b4ef] hover:text-[#4f46e5]">
                <span className="sr-only">Discord</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M9.172 16.172a3 3 0 10.657-4.485l-2.829-2.829m0 0a9 9 0 010-12.728m0 0l2.829 2.829M7.188 12l5.657-5.657" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 