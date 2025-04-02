import { useScores } from "@/hooks/use-scores";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type MedalDisplayProps = {
  type: "gold" | "silver" | "bronze";
  count: number;
};

const MedalDisplay = ({ type, count }: MedalDisplayProps) => {
  const colorMap = {
    gold: "bg-yellow-100 text-yellow-800",
    silver: "bg-gray-100 text-gray-800",
    bronze: "bg-orange-100 text-orange-800",
  };

  return (
    <span className={`inline-block ${colorMap[type]} font-medium rounded-full px-3 py-1`}>
      {count}
    </span>
  );
};

const OverallRankings = () => {
  const { data, isLoading } = useScores();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      {/* Scoreboard */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#000080] text-white text-left">
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Team</th>
                <th className="px-6 py-4 font-semibold text-center">
                  <span className="inline-flex items-center">
                    <span className="material-icons text-[#FFD700] mr-1" style={{ fontSize: '18px' }}>emoji_events</span>
                    Gold
                  </span>
                </th>
                <th className="px-6 py-4 font-semibold text-center">
                  <span className="inline-flex items-center">
                    <span className="material-icons text-[#C0C0C0] mr-1" style={{ fontSize: '18px' }}>emoji_events</span>
                    Silver
                  </span>
                </th>
                <th className="px-6 py-4 font-semibold text-center">
                  <span className="inline-flex items-center">
                    <span className="material-icons text-[#CD7F32] mr-1" style={{ fontSize: '18px' }}>emoji_events</span>
                    Bronze
                  </span>
                </th>
                <th className="px-6 py-4 font-semibold text-center">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {data?.teamScores.map((team) => (
                <tr key={team.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-poppins font-semibold">{team.rank}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full bg-${team.color || 'blue'}-100 flex items-center justify-center mr-3 overflow-hidden`}>
                        {team.icon ? (
                          <img src={team.icon} alt={team.name} className="h-10 w-10 object-cover" />
                        ) : (
                          <span className={`material-icons text-${team.color || 'blue'}-500`}>emoji_events</span>
                        )}
                      </div>
                      <span className="font-medium">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <MedalDisplay type="gold" count={team.goldCount} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <MedalDisplay type="silver" count={team.silverCount} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <MedalDisplay type="bronze" count={team.bronzeCount} />
                  </td>
                  <td className="px-6 py-4 text-center font-poppins font-semibold text-lg">{team.totalScore}</td>
                </tr>
              ))}
              {data?.teamScores.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No teams or scores available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Medal Summary and Point System Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Point System Legend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 font-montserrat text-[#000080]">Point System</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center mr-3">
                <span className="material-icons text-white text-sm">looks_one</span>
              </div>
              <span>Gold: 10 points</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#C0C0C0] flex items-center justify-center mr-3">
                <span className="material-icons text-white text-sm">looks_two</span>
              </div>
              <span>Silver: 7 points</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#CD7F32] flex items-center justify-center mr-3">
                <span className="material-icons text-white text-sm">looks_3</span>
              </div>
              <span>Bronze: 5 points</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <span className="material-icons text-gray-600 text-sm">sports_score</span>
              </div>
              <span>Non-winner: 1 point</span>
            </div>
            <div className="flex items-center col-span-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <span className="material-icons text-gray-400 text-sm">do_not_disturb</span>
              </div>
              <span>No Entry: 0 points</span>
            </div>
          </div>
        </div>
        
        {/* Medal Counts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 font-montserrat text-[#000080]">Total Medals Awarded</h3>
          <div className="flex flex-wrap justify-around">
            <div className="medal-animation text-center p-3">
              <div className="inline-block w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                <span className="material-icons text-[#FFD700] text-3xl">emoji_events</span>
              </div>
              <div className="text-2xl font-semibold font-poppins">{data?.medalSummary.goldCount || 0}</div>
              <div className="text-sm text-gray-500">Gold</div>
            </div>
            <div className="medal-animation text-center p-3">
              <div className="inline-block w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <span className="material-icons text-[#C0C0C0] text-3xl">emoji_events</span>
              </div>
              <div className="text-2xl font-semibold font-poppins">{data?.medalSummary.silverCount || 0}</div>
              <div className="text-sm text-gray-500">Silver</div>
            </div>
            <div className="medal-animation text-center p-3">
              <div className="inline-block w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <span className="material-icons text-[#CD7F32] text-3xl">emoji_events</span>
              </div>
              <div className="text-2xl font-semibold font-poppins">{data?.medalSummary.bronzeCount || 0}</div>
              <div className="text-sm text-gray-500">Bronze</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div>
    <Card className="mb-8">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="bg-[#000080] text-white px-6 py-4">
            <div className="grid grid-cols-6 gap-4">
              <Skeleton className="h-6 w-10 bg-white/20" />
              <Skeleton className="h-6 w-20 bg-white/20" />
              <Skeleton className="h-6 w-10 bg-white/20" />
              <Skeleton className="h-6 w-10 bg-white/20" />
              <Skeleton className="h-6 w-10 bg-white/20" />
              <Skeleton className="h-6 w-16 bg-white/20" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-6 w-28" />
                </div>
                <Skeleton className="h-8 w-8 mx-auto" />
                <Skeleton className="h-8 w-8 mx-auto" />
                <Skeleton className="h-8 w-8 mx-auto" />
                <Skeleton className="h-8 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex justify-around">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default OverallRankings;
