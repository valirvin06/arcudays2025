import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTeams } from '@/hooks/use-teams';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ICON_COLORS = [
  'blue', 'green', 'yellow', 'orange', 'purple', 'red', 'teal', 'indigo'
];

const ICON_SYMBOLS = [
  'emoji_events', 'park', 'auto_awesome', 'local_fire_department', 
  'psychology', 'pets', 'stars', 'bolt', 'spa', 'fitness_center',
  'military_tech', 'whatshot', 'heart_broken'
];

const TeamManagement = () => {
  const { toast } = useToast();
  const { data: teams, isLoading } = useTeams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [teamName, setTeamName] = useState('');
  const [teamIcon, setTeamIcon] = useState<File | null>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const [symbolIndex, setSymbolIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);
  
  const getIconColor = (index: number) => {
    const colorName = ICON_COLORS[index % ICON_COLORS.length];
    return {
      bg: `bg-${colorName}-100`,
      text: `text-${colorName}-500`
    };
  };
  
  const handleColorChange = () => {
    setColorIndex((colorIndex + 1) % ICON_COLORS.length);
  };
  
  const handleSymbolChange = () => {
    setSymbolIndex((symbolIndex + 1) % ICON_SYMBOLS.length);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTeamIcon(e.target.files[0]);
    }
  };
  
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Prepare team data
      const teamData = {
        name: teamName,
        color: ICON_COLORS[colorIndex % ICON_COLORS.length]
      };
      
      formData.append('data', JSON.stringify(teamData));
      
      if (teamIcon) {
        formData.append('icon', teamIcon);
      }
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create team');
      }
      
      // Reset form
      setTeamName('');
      setTeamIcon(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh teams data
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      
      toast({
        title: "Success",
        description: "Team created successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteTeam = async () => {
    if (teamToDelete === null) return;
    
    try {
      await apiRequest('DELETE', `/api/teams/${teamToDelete}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      
      toast({
        title: "Success",
        description: "Team deleted successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete team. It may have associated medals.",
        variant: "destructive"
      });
    } finally {
      setTeamToDelete(null);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-montserrat font-semibold mb-6 text-[#000080]">Team Management</h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Add New Team */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Add New Team</h3>
              
              <form onSubmit={handleCreateTeam}>
                <div className="mb-4">
                  <Label htmlFor="team-name" className="block mb-2">Team Name</Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <Label className="block mb-2">Team Icon</Label>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="block mb-2 text-sm">Upload Custom Icon</Label>
                      <div className="flex items-center justify-center w-full">
                        <Label
                          htmlFor="team-icon"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-6 w-6 mb-2 text-gray-500" />
                            <p className="mb-1 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span>
                            </p>
                            <p className="text-xs text-gray-500">SVG, PNG or JPG (max. 1MB)</p>
                          </div>
                          <Input
                            id="team-icon"
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/svg+xml,image/png,image/jpeg"
                            onChange={handleFileChange}
                          />
                        </Label>
                      </div>
                      {teamIcon && (
                        <p className="mt-2 text-xs text-gray-500">
                          Selected: {teamIcon.name}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="block mb-2 text-sm">Or Use Symbol</Label>
                      <div className="flex flex-col items-center">
                        <div className={`h-24 w-24 rounded-full flex items-center justify-center mb-2 ${getIconColor(colorIndex).bg}`}>
                          <span className={`material-icons text-4xl ${getIconColor(colorIndex).text}`}>
                            {ICON_SYMBOLS[symbolIndex]}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline" 
                            onClick={handleColorChange}
                          >
                            Change Color
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline" 
                            onClick={handleSymbolChange}
                          >
                            Change Icon
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#000080] hover:bg-opacity-90" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Team"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Teams List */}
          <div className="w-full md:w-2/3">
            <h3 className="text-lg font-semibold mb-4">Current Teams</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 text-[#000080] animate-spin" />
              </div>
            ) : teams && teams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="bg-gray-50 rounded-lg p-4 flex items-center">
                    <div className={`flex-shrink-0 h-12 w-12 ${team.color ? `bg-${team.color}-100` : 'bg-blue-100'} rounded-full flex items-center justify-center mr-4 overflow-hidden`}>
                      {team.icon ? (
                        <img src={team.icon} alt={team.name} className="h-12 w-12 object-cover" />
                      ) : (
                        <span className={`material-icons ${team.color ? `text-${team.color}-500` : 'text-blue-500'}`}>
                          emoji_events
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{team.name}</h4>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                          onClick={() => setTeamToDelete(team.id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Team</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this team? This action cannot be undone.
                            Note: Teams with assigned medals cannot be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteTeam} 
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-500">No teams have been added yet.</p>
                <p className="text-sm text-gray-400 mt-1">Add your first team using the form.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamManagement;
