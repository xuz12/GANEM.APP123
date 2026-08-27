import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapPin, QrCode, Nfc, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Match = Database['public']['Tables']['matches']['Row'] & {
  home_club: Database['public']['Tables']['clubs']['Row'];
  away_club: Database['public']['Tables']['clubs']['Row'];
};

type RoundMatches = {
  round: number;
  matches: Match[];
  attendedCount: number;
};

export function AttendancePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [rounds, setRounds] = useState<RoundMatches[]>([]);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'geofence' | 'qr' | 'nfc' | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [nfcSupported, setNfcSupported] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<'saudi_league' | 'kings_cup'>('saudi_league');

  useEffect(() => {
    fetchMatches();
    checkNFCSupport();
  }, [user, selectedCompetition, profile]);

  const fetchMatches = async () => {
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        *,
        home_club:clubs!matches_home_club_id_fkey(*),
        away_club:clubs!matches_away_club_id_fkey(*)
      `)
      .eq('competition_type', selectedCompetition)
      .in('status', ['upcoming', 'live', 'finished'])
      .not('round_number', 'is', null)
      .order('round_number', { ascending: true })
      .order('match_date', { ascending: true });

    const { data: attendanceData } = user ? await supabase
      .from('attendance_records')
      .select('match_id')
      .eq('user_id', user.id)
      : { data: null };

    const attendedMatchIds = new Set(attendanceData?.map(a => a.match_id) || []);

    const matchesByRound: Record<number, Match[]> = {};
    (matchesData || []).forEach((match) => {
      const round = match.round_number!;
      if (!matchesByRound[round]) {
        matchesByRound[round] = [];
      }
      matchesByRound[round].push(match);
    });

    const roundsData = Object.entries(matchesByRound)
      .map(([round, matches]) => ({
        round: parseInt(round),
        matches,
        attendedCount: matches.filter(m => attendedMatchIds.has(m.id)).length,
      }))
      .sort((a, b) => a.round - b.round);

    setRounds(roundsData);
  };

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const newSet = new Set();
      if (!prev.has(round)) {
        newSet.add(round);
      }
      return newSet;
    });
  };

  const expandAllRounds = () => {
    setExpandedRounds(new Set(rounds.map(r => r.round)));
  };

  const collapseAllRounds = () => {
    setExpandedRounds(new Set());
  };

  const checkNFCSupport = () => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
  };

  const verifyGeofence = async () => {
    if (!selectedMatch || !user) return;

    setLoading(true);
    setMessage(null);

    try {
      const matchDate = new Date(selectedMatch.match_date);
      const now = new Date();
      const fortyFiveMinBefore = new Date(matchDate.getTime() - 45 * 60 * 1000);
      const earlyArrival = now < fortyFiveMinBefore;

      const matchType = selectedMatch.match_type || 'regular';
      let pointsEarned = selectedMatch.attendance_points || 1000;

      if (matchType === 'derby') pointsEarned = 1500;
      else if (matchType === 'final') pointsEarned = 2000;
      else if (matchType === 'afc') pointsEarned = 2500;

      const bonusPoints = earlyArrival ? 200 : 0;
      const totalPoints = pointsEarned + bonusPoints;

      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          user_id: user.id,
          match_id: selectedMatch.id,
          verification_method: 'geofence',
          points_earned: totalPoints,
          early_arrival_bonus: earlyArrival,
          lat: selectedMatch.stadium_lat,
          lng: selectedMatch.stadium_lng,
          verification_data: { demo_mode: true },
        });

      if (attendanceError) {
        if (attendanceError.code === '23505') {
          setMessage({ type: 'error', text: 'لقد سجلت حضورك لهذه المباراة مسبقاً' });
        } else {
          throw attendanceError;
        }
      } else {
        const { data: currentProfile } = await supabase
          .from('user_profiles')
          .select('points, total_points_earned, matches_attended')
          .eq('id', user.id)
          .maybeSingle();

        await supabase.from('points_transactions').insert({
          user_id: user.id,
          points: totalPoints,
          transaction_type: 'match_attendance',
          reference_id: selectedMatch.id,
          description: `حضور مباراة ${selectedMatch.home_club.name_ar} ضد ${selectedMatch.away_club.name_ar}`,
        });

        await supabase
          .from('user_profiles')
          .update({
            points: (currentProfile?.points || 0) + totalPoints,
            total_points_earned: (currentProfile?.total_points_earned || 0) + totalPoints,
            matches_attended: (currentProfile?.matches_attended || 0) + 1,
          })
          .eq('id', user.id);

        await refreshProfile();
        await fetchMatches();

        setMessage({
          type: 'success',
          text: `تم تسجيل حضورك بنجاح! حصلت على ${totalPoints} نقطة${earlyArrival ? ' (مع مكافأة الحضور المبكر)' : ''}`,
        });
      }
    } catch (error) {
      console.error('Attendance error:', error);
      setMessage({
        type: 'error',
        text: 'حدث خطأ أثناء تسجيل الحضور. يرجى المحاولة مرة أخرى',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyQRCode = async () => {
    if (!selectedMatch || !user) return;

    setLoading(true);
    setMessage(null);

    try {
      const matchType = selectedMatch.match_type || 'regular';
      let pointsEarned = selectedMatch.attendance_points || 1000;

      if (matchType === 'derby') pointsEarned = 1500;
      else if (matchType === 'final') pointsEarned = 2000;
      else if (matchType === 'afc') pointsEarned = 2500;

      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          user_id: user.id,
          match_id: selectedMatch.id,
          verification_method: 'qr',
          points_earned: pointsEarned,
          verification_data: { demo_mode: true },
        });

      if (attendanceError) {
        if (attendanceError.code === '23505') {
          setMessage({ type: 'error', text: 'لقد سجلت حضورك لهذه المباراة مسبقاً' });
        } else {
          throw attendanceError;
        }
      } else {
        const { data: currentProfile } = await supabase
          .from('user_profiles')
          .select('points, total_points_earned, matches_attended')
          .eq('id', user.id)
          .maybeSingle();

        await supabase.from('points_transactions').insert({
          user_id: user.id,
          points: pointsEarned,
          transaction_type: 'match_attendance',
          reference_id: selectedMatch.id,
          description: `حضور مباراة ${selectedMatch.home_club.name_ar} ضد ${selectedMatch.away_club.name_ar}`,
        });

        await supabase
          .from('user_profiles')
          .update({
            points: (currentProfile?.points || 0) + pointsEarned,
            total_points_earned: (currentProfile?.total_points_earned || 0) + pointsEarned,
            matches_attended: (currentProfile?.matches_attended || 0) + 1,
          })
          .eq('id', user.id);

        await refreshProfile();
        await fetchMatches();

        setMessage({
          type: 'success',
          text: `تم تسجيل حضورك بنجاح! حصلت على ${pointsEarned} نقطة`,
        });
        setQrInput('');
      }
    } catch (error) {
      console.error('QR verification error:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء التحقق من رمز QR' });
    } finally {
      setLoading(false);
    }
  };

  const verifyNFC = async () => {
    if (!selectedMatch || !user) return;

    setLoading(true);
    setMessage(null);

    try {
      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();

        ndef.addEventListener('reading', async ({ serialNumber }: any) => {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-nfc-attendance`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  encrypted_uid: serialNumber,
                  match_id: selectedMatch.id,
                  reader_id: 'web-reader-demo',
                }),
              }
            );

            const result = await response.json();

            if (result.success) {
              await refreshProfile();
              await fetchMatches();

              setMessage({
                type: 'success',
                text: `تم تسجيل حضورك ✓  +${result.points_breakdown.attendance} غنيمة | وزارة +${result.points_breakdown.ministry_grant} | إجمالي +${result.points_breakdown.total}`,
              });
            } else {
              setMessage({ type: 'error', text: result.error || 'فشل التحقق من NFC' });
            }
          } catch (error) {
            console.error('NFC API error:', error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء قراءة علامة NFC' });
          } finally {
            setLoading(false);
          }
        });
      } else {
        setMessage({
          type: 'error',
          text: 'متصفحك لا يدعم Web NFC API. يرجى استخدام Chrome على Android.',
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('NFC verification error:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء بدء قراءة NFC' });
      setLoading(false);
    }
  };

  const getCompetitionName = (type: string) => {
    switch (type) {
      case 'saudi_league': return 'دوري روشن السعودي';
      case 'kings_cup': return 'كأس الملك';
      default: return 'دوري روشن السعودي';
    }
  };

  const getRoundName = (roundNumber: number) => {
    if (selectedCompetition === 'kings_cup') {
      switch (roundNumber) {
        case 1: return 'دور الـ 32';
        case 2: return 'دور الـ 16';
        case 3: return 'ربع النهائي';
        case 4: return 'نصف النهائي';
        case 5: return 'النهائي';
        default: return `الدور ${roundNumber}`;
      }
    }
    return `الجولة ${roundNumber}`;
  };

  return (
    <div className="pb-20 p-4" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">تسجيل الحضور</h2>

      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedCompetition('saudi_league')}
            className={`py-3 px-4 rounded-lg font-bold text-sm transition-all ${
              selectedCompetition === 'saudi_league'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
            }`}
          >
            دوري روشن السعودي
          </button>
          <button
            onClick={() => setSelectedCompetition('kings_cup')}
            className={`py-3 px-4 rounded-lg font-bold text-sm transition-all ${
              selectedCompetition === 'kings_cup'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
            }`}
          >
            كأس الملك
          </button>
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد مباريات في {getCompetitionName(selectedCompetition)}</p>
          <p className="text-sm text-gray-400 mt-2">وضع تجريبي - يمكنك تسجيل الحضور لأي مباراة</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">
              {selectedCompetition === 'kings_cup' ? 'الأدوار' : 'الجولات'}
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {rounds.map((roundData) => (
                <button
                  key={roundData.round}
                  onClick={() => toggleRound(roundData.round)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                    expandedRounds.has(roundData.round)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{getRoundName(roundData.round)}</span>
                  <span className={`text-xs ${expandedRounds.has(roundData.round) ? 'text-white/80' : 'text-gray-500'}`}>
                    ({roundData.attendedCount}/{roundData.matches.length})
                  </span>
                  {roundData.attendedCount === roundData.matches.length && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {rounds.map((roundData) => (
              expandedRounds.has(roundData.round) && (
                roundData.matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => {
                      setSelectedMatch(match);
                      setVerificationMethod(null);
                      setMessage(null);
                    }}
                    className={`w-full bg-white rounded-lg p-3 border-2 transition-all shadow-sm ${
                      selectedMatch?.id === match.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        <img
                          src={match.home_club.logo_url || ''}
                          alt={match.home_club.name_ar}
                          className="w-10 h-10 mx-auto mb-1 object-contain"
                        />
                        <p className="font-bold text-xs">{match.home_club.name_ar}</p>
                      </div>

                      <div className="flex-1 text-center px-2">
                        <div className="bg-green-100 text-green-700 rounded-lg px-2 py-1 font-bold text-xs mb-1">
                          VS
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(match.match_date).toLocaleDateString('ar-SA', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(match.match_date).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {match.status === 'finished' && (
                          <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            انتهت
                          </span>
                        )}
                        {match.status === 'live' && (
                          <span className="inline-block mt-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">
                            مباشر
                          </span>
                        )}
                      </div>

                      <div className="flex-1 text-center">
                        <img
                          src={match.away_club.logo_url || ''}
                          alt={match.away_club.name_ar}
                          className="w-10 h-10 mx-auto mb-1 object-contain"
                        />
                        <p className="font-bold text-xs">{match.away_club.name_ar}</p>
                      </div>
                    </div>
                  </button>
                ))
              )
            ))}
          </div>

          {selectedMatch && (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-4">اختر طريقة التحقق</h3>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setVerificationMethod('geofence')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    verificationMethod === 'geofence'
                      ? 'bg-green-50 border-green-500'
                      : 'bg-white border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center">
                    <MapPin className="w-8 h-8 text-green-600 ml-4" />
                    <div className="text-right flex-1">
                      <h4 className="font-bold text-gray-900">السياج الجغرافي</h4>
                      <p className="text-sm text-gray-600">تحقق تلقائي من موقعك</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setVerificationMethod('qr')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    verificationMethod === 'qr'
                      ? 'bg-green-50 border-green-500'
                      : 'bg-white border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center">
                    <QrCode className="w-8 h-8 text-green-600 ml-4" />
                    <div className="text-right flex-1">
                      <h4 className="font-bold text-gray-900">رمز QR</h4>
                      <p className="text-sm text-gray-600">امسح رمز QR في الملعب</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setVerificationMethod('nfc')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    verificationMethod === 'nfc'
                      ? 'bg-green-50 border-green-500'
                      : 'bg-white border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Nfc className="w-8 h-8 text-green-600 ml-4" />
                    <div className="text-right flex-1">
                      <h4 className="font-bold text-gray-900">علامة NFC</h4>
                      <p className="text-sm text-gray-600">اضغط على علامة NFC</p>
                    </div>
                  </div>
                </button>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-xl mb-6 flex items-start ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 ml-3 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`text-sm ${
                      message.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              {verificationMethod === 'geofence' && (
                <button
                  onClick={verifyGeofence}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري التحقق...' : 'تحقق من موقعي'}
                </button>
              )}

              {verificationMethod === 'qr' && (
                <button
                  onClick={verifyQRCode}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري التحقق...' : 'تأكيد الحضور'}
                </button>
              )}

              {verificationMethod === 'nfc' && (
                <button
                  onClick={verifyNFC}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري التحقق...' : 'تأكيد الحضور بـ NFC'}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
