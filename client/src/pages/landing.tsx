import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import arcuDaysLogo from "@assets/Copy of Copy of ARCU BANNER (50 x 50 mm).png";
import arcuDaysBg from "@assets/arcu days 2025.png";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Landing Page Section */}
      <div className="min-h-screen flex flex-col relative">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${arcuDaysBg})`,
            backgroundColor: "#000080", // Midnight Blue
          }}
        />
        
        <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="text-center max-w-4xl">
            <div className="flex justify-center mb-6">
              <img 
                src={arcuDaysLogo} 
                alt="ArCu Days 2025 Logo" 
                className="h-40 md:h-52"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white font-montserrat mb-4">USTP Claveria</h1>
            <h2 className="text-5xl md:text-7xl font-extrabold text-white font-montserrat mb-6">
              ArCu Days <span className="text-[#FF9800]">2025</span>
            </h2>
            <p className="text-xl text-white font-roboto mb-8">
              University of Science and Technology of Southern Philippines Claveria<br/>
              Arts and Culture Festival
            </p>
            
            <div className="mt-8">
              <Link href="/scoreboard">
                <Button 
                  size="lg" 
                  className="bg-[#000080] hover:bg-opacity-90 text-white px-8 py-3 rounded-full text-lg font-semibold inline-flex items-center shadow-lg transition-all duration-300 font-montserrat mr-4"
                >
                  <span>Live Scores</span>
                  <span className="material-icons ml-2">leaderboard</span>
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:bg-opacity-20 px-8 py-3 rounded-full text-lg font-semibold inline-flex items-center shadow-lg transition-all duration-300 font-montserrat"
                >
                  <span>Admin Login</span>
                  <span className="material-icons ml-2">login</span>
                </Button>
              </Link>
            </div>
            
            <div className="mt-16 text-white">
              <p className="text-lg">April 3-4, 2025</p>
              <p>USTP Claveria Campus</p>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-6 left-0 right-0 flex justify-center animate-bounce">
          <Link href="/scoreboard">
            <Button 
              variant="ghost" 
              className="text-white"
            >
              <span className="material-icons text-4xl">keyboard_arrow_down</span>
            </Button>
          </Link>
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

export default LandingPage;
