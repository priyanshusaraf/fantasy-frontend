"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Trophy, Users, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010615] to-[#0a192f]">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#010615]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 relative rounded-full overflow-hidden">
                <Image 
                  src="/images/matchup_logo.png" 
                  alt="MatchUp Logo" 
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#0dc5c1]">
                MatchUp
              </span>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/login">
                <Button variant="outline" className="border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-[#3b82f6] to-[#0dc5c1] hover:opacity-90">
                  Sign Up
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-24">
        {/* Hero Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-block mb-4 px-4 py-1 rounded-full bg-gradient-to-r from-[#3b82f6]/20 to-[#0dc5c1]/20 border border-[#3b82f6]/30">
                <span className="text-sm font-medium text-[#a4c4ef]">
                  Revolutionizing Sports with Tech
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a4c4ef]">
                Ultimate Sports Tech Experience
              </h1>
              
              <p className="text-lg md:text-xl text-[#a4c4ef] mb-8">
                Create your dream team, join tournaments, and compete in real-time with players around the world.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-[#3b82f6] to-[#0dc5c1] hover:opacity-90 text-white px-8 py-6 text-lg">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-[#0a192f]/50 backdrop-blur-sm rounded-lg p-6 border border-[#1f3b5b]">
                <Trophy className="h-12 w-12 text-[#0dc5c1] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Tournaments</h3>
                <p className="text-[#a4c4ef]">Join exciting tournaments and compete for amazing prizes.</p>
              </div>
              
              <div className="bg-[#0a192f]/50 backdrop-blur-sm rounded-lg p-6 border border-[#1f3b5b]">
                <Users className="h-12 w-12 text-[#3b82f6] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Community</h3>
                <p className="text-[#a4c4ef]">Connect with other sports enthusiasts and build your network.</p>
              </div>
              
              <div className="bg-[#0a192f]/50 backdrop-blur-sm rounded-lg p-6 border border-[#1f3b5b]">
                <BarChart3 className="h-12 w-12 text-[#0dc5c1] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Live Stats</h3>
                <p className="text-[#a4c4ef]">Track your performance with real-time statistics and analytics.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
