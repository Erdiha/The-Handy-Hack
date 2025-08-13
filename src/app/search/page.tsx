'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
interface Handyman {
  id: number;
  name: string;
  bio: string;
  hourlyRate: string;
  neighborhood: string;
  services: string[];
  isAvailable: boolean;
  distance: number;
  rating: number;
  reviewCount: number;
  responseTime: string;
}

export default function SearchPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('All Services');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [handymen, setHandymen] = useState<Handyman[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const services = [
    'All Services',
    'Plumbing',
    'Electrical',
    'Painting',
    'Carpentry',
    'Appliance Repair',
    'Furniture Assembly',
    'Home Cleaning',
    'Landscaping',
    'Tile Work',
    'Drywall Repair'
  ];

  useEffect(() => {
    fetchHandymen();
  }, [selectedService, availableOnly]);
  
  
  const fetchHandymen = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (selectedService !== 'All Services') {
        params.append('service', selectedService);
      }
      if (availableOnly) {
        params.append('availableOnly', 'true');
      }
      
      const response = await fetch(`/api/handymen?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setHandymen(data.handymen);
      } else {
        setError('Failed to load handymen');
      }
    } catch (error) {
      setError('Something went wrong');
      console.error('Error fetching handymen:', error);
    } finally {
      setLoading(false);
    }
  };


  const filteredHandymen = handymen.filter(handyman => {
    const matchesSearch = searchQuery === '' ||
      handyman.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      handyman.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesService = selectedService === 'All Services' ||
      handyman.services.includes(selectedService);
    
    const matchesAvailability = !availableOnly || handyman.isAvailable;
    
    return matchesSearch && matchesService && matchesAvailability;
  });

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-orange-50">
      {/* Header Section */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
                Find Your Perfect
                <span className="block text-orange-600">Neighborhood Pro</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                {session?.user ? `Hey ${session.user.name}! ` : ''}
                Connect with trusted local handymen in your area. Real neighbors, real skills.
              </p>
            </div>

            {/* Search Controls */}
            <div className="max-w-4xl mx-auto">
              {/* Main Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-xl">🔍</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What needs fixing? Try 'leaky faucet' or 'electrician'"
                    className="block w-full pl-12 pr-4 py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Service Filter */}
                <div className="sm:col-span-2">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white text-slate-700"
                  >
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Now Toggle */}
                <div>
                  <button
                    onClick={() => setAvailableOnly(!availableOnly)}
                    className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${availableOnly
                        ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-green-300 hover:text-green-600'
                      }`}
                  >
                    {availableOnly ? '🟢 Available Now' : '⭕ All Pros'}
                  </button>
                </div>

                {/* Emergency Button */}
                <div>
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg">
                    🚨 Emergency
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Results List */}
          <div className="lg:col-span-2">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {loading ? 'Searching...' : `${filteredHandymen.length} Pros Found`}
                </h2>
                <p className="text-slate-600">Highland Park • Available today</p>
              </div>
              
              {/* View Toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${viewMode === 'list'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${viewMode === 'map'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                  🗺️ Map
                </button>
              </div>
            </div>

            {/* Handyman Cards */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Finding the best pros in your area...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">😕</div>
                  <p className="text-slate-600 mb-4">{error}</p>
                  <button
                    onClick={fetchHandymen}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredHandymen.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-slate-600 mb-2">No handymen found</p>
                  <p className="text-slate-500">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredHandymen.map((handyman, index) => (
                    <HandymanCard key={handyman.id} handyman={handyman} index={index} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">🤳 Show Us What&apos;s Wrong</h3>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-orange-400 transition-all duration-200 cursor-pointer group">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">📸</div>
                  <p className="font-semibold text-slate-700">Upload a Photo</p>
                  <p className="text-sm text-slate-500 mt-1">AI will find the perfect pro</p>
                </div>
              </div>

              {/* Community Stats */}
              <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">🏘️ Your Neighborhood</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Jobs this week</span>
                    <span className="font-bold text-green-600">12 completed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Average rate</span>
                    <span className="font-bold text-slate-800">$68/hour</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Response time</span>
                    <span className="font-bold text-blue-600">18 minutes</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Your savings vs TaskRabbit</span>
                      <span className="font-bold text-orange-600">~$25/job</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-2">🚨 Need Help Now?</h3>
                <p className="text-red-100 text-sm mb-4 leading-relaxed">
                  Alert all available pros in your area for emergency repairs
                </p>
                <button className="w-full bg-white text-red-600 hover:bg-red-50 font-bold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg">
                  Send Emergency Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Perfect Handyman Card Component
function HandymanCard({ handyman, index }: { handyman: Handyman; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-3xl shadow-lg hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Profile Section */}
          <div className="flex items-start space-x-4 flex-1">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {handyman.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name & Status */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-slate-800">{handyman.name}</h3>
                {handyman.isAvailable && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    🟢 Available Now
                  </span>
                )}
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold">{handyman.rating}</span>
                  <span>({handyman.reviewCount} reviews)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{handyman.distance} mi • {handyman.neighborhood}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>Responds in {handyman.responseTime}</span>
                </span>
              </div>
              
              {/* Bio */}
              <p className="text-slate-700 leading-relaxed mb-4">
                {handyman.bio}
              </p>
              
              {/* Services */}
              <div className="flex flex-wrap gap-2">
                {handyman.services.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Action Section */}
          <div className="lg:text-right flex-shrink-0">
            <div className="mb-4">
              <div className="text-3xl font-bold text-slate-800">
                ${handyman.hourlyRate}
                <span className="text-lg font-normal text-slate-500">/hr</span>
              </div>
              <div className="text-sm text-slate-500">
                Fair local pricing
              </div>
            </div>
            
            <div className="flex lg:flex-col gap-2">
              <Button 
                size="lg"
                className="flex-1 lg:w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                💬 Contact Now
              </Button>
              <Link href={`/handyman/${handyman.id}`}>
  <Button 
    variant="outline" 
    size="lg"
    className="flex-1 lg:w-full border-2 border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600 font-semibold px-6 py-3 rounded-xl transition-all duration-200"
  >
    👤 View Profile
  </Button>
</Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}