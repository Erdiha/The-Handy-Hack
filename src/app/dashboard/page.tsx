'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface UserProfile {
  hasCompletedOnboarding: boolean;
  neighborhood?: string;
  phone?: string | null;
  bio?: string | null;
  services?: string[];
  hourlyRate?: string | null;
}
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
const [profile, setProfile] = useState<UserProfile | null>(null);
const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
     if (status === 'authenticated') {
    checkOnboardingStatus();
  }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
const checkOnboardingStatus = async () => {
  try {
    const response = await fetch('/api/profile');
    if (response.ok) {
      const data = await response.json();
      console.log('Profile API response:', data); // Debug line
      setProfile(data);
      
      // Redirect to onboarding if not completed
      if (!data.hasCompletedOnboarding) {
        router.push('/onboarding');
      }
    }
  } catch (error) {
    console.error('Failed to check profile:', error);
  } finally {
    setLoading(false);
  }
};
  if (!session) return null;

  return (
    <div className="h-[calc(100vh-5rem)] bg-orange-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl">👋</span>
              </div>
              <h1 className="text-4xl font-bold text-slate-800 mb-4">
                Welcome, {session.user.name}!
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                {session.user.role === 'handyman' 
                  ? 'Ready to help your neighbors?' 
                  : 'What can we help you fix today?'
                }
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Your Role</h3>
                 <Link href="/search">
  <Button 
    size="lg"
    className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-8 py-4"
  >
    Find Help Now
  </Button>
                  </Link>
                  <Link href="/search">
  <Button 
    variant="outline"
    className="border-orange-300 text-orange-600 hover:bg-orange-50"
  >
    Browse Services
  </Button>
</Link>
                  <p className="text-slate-600 capitalize">{session.user.role}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Email</h3>
                  <p className="text-slate-600">{session.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}