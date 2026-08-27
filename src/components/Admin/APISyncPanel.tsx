import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Loader, Zap, Calendar, Database, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SyncLog {
  sync_type: 'matches' | 'teams' | 'live_scores';
  synced_at: string;
  records_updated: number;
  status: 'success' | 'error';
  error_message: string | null;
}

export default function APISyncPanel() {
  const [syncLogs, setSyncLogs] = useState<Record<string, SyncLog>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [apiUsage, setApiUsage] = useState({ used: 0, limit: 100 });

  useEffect(() => {
    fetchSyncLogs();
    const interval = setInterval(fetchSyncLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSyncLogs = async () => {
    const syncTypes = ['matches', 'teams', 'live_scores'];
    for (const syncType of syncTypes) {
      const { data } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('sync_type', syncType)
        .order('synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSyncLogs((prev) => ({ ...prev, [syncType]: data }));
      }
    }
  };

  const triggerSync = async (syncType: 'matches' | 'teams' | 'live_scores' | 'club_logos') => {
    setLoading((prev) => ({ ...prev, [syncType]: true }));

    try {
      const functionName =
        syncType === 'matches' ? 'sync-matches' : 
        syncType === 'teams' ? 'sync-teams' : 
        syncType === 'club_logos' ? 'sync-club-logos' : 'sync-live-scores';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        if (syncType === 'club_logos') {
           alert(`تم تحديث ${result.updated} شعار بنجاح ✅`);
        } else {
           await fetchSyncLogs();
           setApiUsage((prev) => ({ ...prev, used: prev.used + 1 }));
        }
      }
    } catch (error) {
      console.error(`Error syncing ${syncType}:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [syncType]: false }));
    }
  };

  const usagePercentage = (apiUsage.used / apiUsage.limit) * 100;

  return (
    <div className="space-y-6 text-right font-almarai" dir="rtl">
      {/* بطاقة استهلاك الـ API */}
      <div className="bg-[#141414] rounded-3xl border border-white/5 p-6 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
             <div className="bg-green-600/10 p-2 rounded-xl text-green-500"><Zap size={18} /></div>
             <h3 className="text-lg font-black text-white">استهلاك API-Football</h3>
          </div>
          <span className="text-sm font-mono font-bold text-gray-500 tracking-tighter">
            {apiUsage.used} <span className="text-green-500">/ {apiUsage.limit}</span>
          </span>
        </div>

        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.3)] ${
              usagePercentage >= 80 ? 'bg-red-500' : usagePercentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>

        {usagePercentage >= 80 && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-xs text-red-500 font-bold">تحذير: لقد قاربت على استهلاك الحد اليومي المجاني!</p>
          </div>
        )}
      </div>

      {/* زر مزامنة الشعارات */}
      <div className="group">
        <button
          onClick={() => triggerSync('club_logos')}
          disabled={loading.club_logos}
          className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white px-6 py-4 rounded-2xl font-black transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
        >
          {loading.club_logos ? <Loader className="animate-spin" /> : <RefreshCw size={20} />}
          مزامنة شعارات الأندية الرسمية
        </button>
        <p className="text-[10px] text-gray-600 mt-2 text-center italic">تحديث صور الشعارات في قاعدة بيانات الأندية من المصدر</p>
      </div>

      {/* بطاقات المزامنة التفصيلية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'matches', label: 'المباريات', icon: Calendar },
          { id: 'teams', label: 'الفرق', icon: Database },
          { id: 'live_scores', label: 'النتائج المباشرة', icon: Activity },
        ].map((item) => {
          const log = syncLogs[item.id];
          const isLoading = loading[item.id];

          return (
            <div key={item.id} className="bg-[#141414] rounded-[2rem] border border-white/5 p-6 hover:border-green-500/20 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-6">
                 <div className="bg-white/5 p-2 rounded-xl text-gray-400"><item.icon size={20}/></div>
                 <button
                    onClick={() => triggerSync(item.id as any)}
                    disabled={isLoading}
                    className="p-2 bg-green-600/10 text-green-500 rounded-xl hover:bg-green-600 hover:text-white transition-all disabled:opacity-30"
                 >
                    {isLoading ? <Loader className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                 </button>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-1">{item.label}</h4>
                {log ? (
                  <>
                    <p className="text-[10px] text-gray-500 mb-4 font-light">آخر تحديث: {new Date(log.synced_at).toLocaleTimeString('ar-SA')}</p>
                    <div className="flex items-center gap-2">
                       {log.status === 'success' ? <CheckCircle size={14} className="text-green-500"/> : <XCircle size={14} className="text-red-500"/>}
                       <span className={`text-[10px] font-bold ${log.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                         {log.status === 'success' ? `تم تحديث ${log.records_updated}` : 'فشلت العملية'}
                       </span>
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-600 italic">لا يوجد سجلات مزامنة</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* قسم الملاحظات الفني */}
      <div className="bg-green-600/5 border border-green-600/10 rounded-3xl p-6">
        <h4 className="font-black text-green-500 text-xs mb-4 flex items-center gap-2">
          <AlertTriangle size={14} /> جدول المزامنة الآلي (Cron Jobs)
        </h4>
        <div className="space-y-3">
           <div className="flex items-center justify-between text-[11px] border-b border-white/5 pb-2">
              <span className="text-gray-500">مزامنة المباريات</span>
              <span className="text-white font-bold">يومياً - 06:00 ص</span>
           </div>
           <div className="flex items-center justify-between text-[11px] border-b border-white/5 pb-2">
              <span className="text-gray-500">تحديث الفرق</span>
              <span className="text-white font-bold">أسبوعياً - الاثنين</span>
           </div>
           <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">النتائج الحية</span>
              <span className="text-white font-bold">كل 5 دقائق (أيام المباريات)</span>
           </div>
        </div>
      </div>
    </div>
  );
}