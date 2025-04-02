import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import OverallRankings from "@/components/scoreboard/overall-rankings";
import EventsSummary from "@/components/scoreboard/events-summary";
import { useScores } from "@/hooks/use-scores";
import { Skeleton } from "@/components/ui/skeleton";

const ScoreboardPage = () => {
  const [activeTab, setActiveTab] = useState<'overall' | 'events'>('overall');
  const { data, isLoading } = useScores();

  return (
    <div className="min-h-screen flex flex-col">
      <div id="live-scores" className="py-10 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-montserrat text-[#000080] text-center md:text-left">
                  Live Scoreboard
                </h2>
                {isLoading ? (
                  <Skeleton className="h-6 w-48 mt-2" />
                ) : (
                  <p className="text-center md:text-left text-gray-600 mt-2">
                    Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}
                  </p>
                )}
              </div>
              <div className="mt-4 md:mt-0">
                <Link href="/">
                  <Button 
                    variant="outline" 
                    className="bg-transparent border-[#000080] text-[#000080] hover:bg-[#000080] hover:text-white"
                  >
                    <span className="material-icons mr-2 text-sm">home</span>
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <Button 
                className={`px-5 py-3 text-sm font-medium rounded-l-lg ${
                  activeTab === 'overall' 
                    ? 'bg-[#000080] text-white' 
                    : 'bg-white text-[#000080] hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('overall')}
              >
                Overall Rankings
              </Button>
              <Button 
                className={`px-5 py-3 text-sm font-medium rounded-r-lg ${
                  activeTab === 'events' 
                    ? 'bg-[#000080] text-white' 
                    : 'bg-white text-[#000080] hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('events')}
              >
                Events Summary
              </Button>
            </div>
          </div>
          
          {/* Content Tabs */}
          <div className={activeTab === 'overall' ? 'block' : 'hidden'}>
            <OverallRankings />
          </div>
          
          <div className={activeTab === 'events' ? 'block' : 'hidden'}>
            <EventsSummary />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#000080] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-semibold font-montserrat">USTP Claveria ArCu Days 2025</h3>
              <p className="text-sm opacity-75">University of Science and Technology of Southern Philippines Claveria</p>
              <p className="text-sm opacity-75 mt-1">April 3-4, 2025</p>
            </div>
            <div className="text-sm opacity-75">
              &copy; 2025 USTP Claveria. All rights reserved.<br />
              Created on Replit by Val Irvin F. Mabayo
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ScoreboardPage;
