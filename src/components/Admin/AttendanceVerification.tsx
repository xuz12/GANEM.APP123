import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Calendar, MapPin, Users, Search, Filter, Zap, Loader2, QrCode } from 'lucide-react';
import { QRScanner } from './QRScanner';

type AttendanceRequest = {
  id: string;
  user_id: string;
  match_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_full_name?: string;
  match_home_team?: string;
  match_away_team?: string;
  match_date?: string;
  match_venue?: string;
};

type Match = {
  id: string;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  venue: string;
};

export function AttendanceVerification() {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedMatch, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matchesRes, clubsRes, usersRes] = await Promise.all([
        supabase.from('matches').select('id, match_date, stadium_name, home_club_id, away_club_id').order('match_date', { ascending: false }),
        supabase.from('clubs').select('id, name_ar'),
        supabase.from('user_profiles').select('user_id, full_name')
      ]);

      const clubsMap = new Map(clubsRes.data?.map(c => [c.id, c.name_ar]));
      const usersMap = new Map(usersRes.data?.map(u => [u.user_id, u.full_name]));

      const formattedMatches: Match[] = matchesRes.data?.map((match: any) => ({
        id: match.id,
        home_team_name: clubsMap.get(match.home_club_id) || 'نادي محلي',
        away_team_name: clubsMap.get(match.away_club_id) || 'نادي محلي',
        match_date: match.match_date,
        venue: match.stadium_name || 'ملعب المباراة',
      })) || [];

      setMatches(formattedMatches);

      let query = supabase.from('match_attendance').select('*').order('created_at', { ascending: false });
      if (selectedMatch !== 'all') query = query.eq('match_id', selectedMatch);
      if (selectedStatus !== 'all') query = query.eq('status', selectedStatus);

      const { data: requestsData, error: reqError } = await query;
      if (reqError) throw reqError;

      const formattedRequests: AttendanceRequest[] = requestsData?.map((req: any) => {
        const matchInfo = formattedMatches.find(m => m.id === req.match_id);
        return {
          id: req.id,
          user_id: req.user_id,
          match_id: req.match_id,
          status: req.status,
          created_at: req.created_at,
          user_full_name: usersMap.get(req.user_id) || 'مشجع غانم',
          match_home_team: matchInfo?.home_team_name || 'النادي المستضيف',
          match_away_team: matchInfo?.away_team_name || 'النادي الضيف',
          match_date: matchInfo?.match_date,
          match_venue: matchInfo?.venue || 'ملعب المباراة',
        };
      }) || [];

      setRequests(formattedRequests);
    } catch (err) {
      console.error('Attendance Safe Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, userId: string, matchId: string) => {
    setProcessing(requestId);
    try {
      const { error: updateError } = await supabase
        .from('match_attendance')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { data: profile } = await supabase.from('user_profiles').select('points, matches_attended').eq('user_id', userId).single();
      
      if (profile) {
        await supabase.from('user_profiles').update({
          points: (profile.points || 0) + 100,
          matches_attended: (profile.matches_attended || 0) + 1
        }).eq('user_id', userId);
      }

      await fetchData();
      alert('تم إثبات الحضور بنجاح ✅');
    } catch (err) {
      alert('حدث خطأ أثناء المعالجة');
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter(request =>
    request.user_full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-[#003837] min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#05E59F] animate-spin mb-4" />
      <p className="font-almarai font-black text-white uppercase tracking-widest text-sm">جاري جلب سجلات الحضور...</p>
    </div>
  );

  return (
    <div dir="rtl" className="p-6 bg-[#003837] min-h-screen text-right font-almarai">
      {/* رأس الصفحة */}
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">التحقق من الحضور</h2>
          <div className="flex items-center gap-2 mt-2">
            <QrCode className="w-4 h-4 text-[#05E59F]" />
            <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Field Attendance Verification</p>
          </div>
        </div>
      </div>

      {/* منطقة الماسح الضوئي */}
      <div className="mb-10 overflow-hidden rounded-[2.5rem] border border-[#05E59F]/20 bg-[#002b2a] p-4 shadow-2xl relative">
        <div className="absolute top-4 right-6 flex items-center gap-2 z-10">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Scanner Active</span>
        </div>
        <QRScanner onSuccess={fetchData} />
      </div>

      {/* فلاتر التحكم */}
      <div className="bg-[#002b2a] rounded-[2rem] border border-white/5 mb-10 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-2xl">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">البحث عن مشجع</label>
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#05E59F] transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="اسم المشجع..."
              className="w-full bg-[#003837] border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white font-bold outline-none focus:border-[#05E59F]/50 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">تصفية حسب المباراة</label>
          <select
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            className="w-full bg-[#003837] border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner appearance-none"
          >
            <option value="all">جميع مباريات الموسم</option>
            {matches.map((match) => (
              <option key={match.id} value={match.id}>{match.home_team_name} × {match.away_team_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">حالة التحقق</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-[#003837] border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner appearance-none"
          >
            <option value="all">كل السجلات</option>
            <option value="pending">بانتظار المعالجة</option>
            <option value="approved">تم التحقق بنجاح</option>
            <option value="rejected">مرفوض / غير مكتمل</option>
          </select>
        </div>
      </div>

      {/* قائمة الطلبات */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-[#002b2a] rounded-[2.5rem] p-20 text-center border border-white/5 shadow-inner">
            <Users className="w-16 h-16 text-gray-800 mx-auto mb-6 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-sm">No Attendance Logs Found</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-[#002b2a] rounded-[2rem] border border-white/5 p-6 hover:border-[#05E59F]/30 transition-all shadow-xl group overflow-hidden relative">
              <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
                
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6 text-[#05E59F]" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg leading-tight">{request.user_full_name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase mt-1">ID: {request.user_id.slice(0, 12)}...</p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Target Match</div>
                    <div className="text-sm text-white font-bold">{request.match_home_team} × {request.match_away_team}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Check-in Date</div>
                    <div className="text-sm text-[#05E59F] font-black">{new Date(request.created_at).toLocaleDateString('ar-SA')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {request.status === 'pending' ? (
                    <button
                      onClick={() => handleApprove(request.id, request.user_id, request.match_id)}
                      disabled={!!processing}
                      className="bg-[#05E59F] hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] text-black px-8 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap size={16} fill="black" />}
                      {processing === request.id ? 'معالجة...' : 'إثبات حضور (+100)'}
                    </button>
                  ) : (
                    <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${request.status === 'approved' ? 'bg-[#05E59F]/10 text-[#05E59F] border-[#05E59F]/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {request.status === 'approved' ? '✓ Verified Success' : '✕ Request Rejected'}
                    </div>
                  )}
                </div>
              </div>
              
              {/* تأثير خلفية الكرت */}
              <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-[#05E59F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 text-center opacity-20">
        <p className="text-[9px] text-gray-500 font-black tracking-[0.5em] uppercase">Attendance Validation Matrix V2.0</p>
      </div>
    </div>
  );
}