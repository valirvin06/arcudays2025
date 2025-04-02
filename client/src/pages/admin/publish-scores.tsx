import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTeams } from '@/hooks/use-teams';
import { useEvents } from '@/hooks/use-events';
import { Medal, Publication, ScoreSettings } from '@shared/schema';

const PublishScores = () => {
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { data: teams } = useTeams();
  const { data: events } = useEvents();
  
  const { data: scoreSettings = { lastUpdated: null, isPublished: false }, isLoading: settingsLoading } = useQuery<ScoreSettings>({
    queryKey: ['/api/score-settings'],
  });
  
  const { data: unpublishedChanges = [], isLoading: changesLoading } = useQuery<Medal[]>({
    queryKey: ['/api/unpublished-changes'],
  });
  
  const { data: publications = [], isLoading: publicationsLoading } = useQuery<Publication[]>({
    queryKey: ['/api/publications'],
  });
  
  const getTeamName = (teamId: number) => {
    if (!teams) return 'Unknown Team';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };
  
  const getEventName = (eventId: number) => {
    if (!events) return 'Unknown Event';
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Unknown Event';
  };
  
  const getMedalLabel = (medalType: string) => {
    switch (medalType) {
      case 'GOLD': return 'Gold';
      case 'SILVER': return 'Silver';
      case 'BRONZE': return 'Bronze';
      case 'NON_WINNER': return 'Non-Winner';
      case 'NO_ENTRY': return 'No Entry';
      default: return medalType;
    }
  };
  
  const getMedalColor = (medalType: string) => {
    switch (medalType) {
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'BRONZE': return 'bg-orange-100 text-orange-800';
      case 'NON_WINNER': return 'bg-blue-100 text-blue-800';
      case 'NO_ENTRY': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handlePublishScores = async () => {
    setIsPublishing(true);
    
    try {
      await apiRequest('POST', '/api/publish-scores');
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/score-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/publications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/unpublished-changes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scoreboard'] });
      
      toast({
        title: "Success",
        description: "Scores published successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to publish scores",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  const isLoading = settingsLoading || changesLoading || publicationsLoading;
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-montserrat font-semibold mb-6 text-[#000080]">Publish Scores</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 text-[#000080] animate-spin" />
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Current Scoreboard Status</h3>
                <p className="text-sm text-gray-500">
                  Last updated: {scoreSettings?.lastUpdated ? new Date(scoreSettings.lastUpdated).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${scoreSettings?.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  <span className="material-icons text-sm mr-1">{scoreSettings?.isPublished ? 'public' : 'visibility_off'}</span>
                  {scoreSettings?.isPublished ? 'Published' : 'Unpublished'}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 className="font-medium mb-4">Score Changes Since Last Publication</h4>
              
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Medal</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpublishedChanges && unpublishedChanges.length > 0 ? (
                      unpublishedChanges.map((medal) => (
                        <TableRow key={medal.id}>
                          <TableCell className="font-medium">{getTeamName(medal.teamId)}</TableCell>
                          <TableCell>{getEventName(medal.eventId)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMedalColor(medal.medalType)}`}>
                              {getMedalLabel(medal.medalType)}
                            </span>
                          </TableCell>
                          <TableCell>+{medal.points}</TableCell>
                          <TableCell>{new Date(medal.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No unpublished changes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                className="px-8 py-3 bg-[#000080] hover:bg-opacity-90 text-white rounded-lg font-medium inline-flex items-center"
                disabled={isPublishing || unpublishedChanges?.length === 0}
                onClick={handlePublishScores}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">publish</span>
                    Publish Latest Scores
                  </>
                )}
              </Button>
            </div>
            
            <div className="border-t pt-6 mt-8">
              <h3 className="text-lg font-semibold mb-4">Publication History</h3>
              
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Published By</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publications && publications.length > 0 ? (
                      publications.map((pub) => (
                        <TableRow key={pub.id}>
                          <TableCell>{new Date(pub.publishedAt).toLocaleString()}</TableCell>
                          <TableCell>{pub.publishedBy}</TableCell>
                          <TableCell>{pub.description || `${pub.medalCount} medal awards`}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                          No publication history
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PublishScores;
