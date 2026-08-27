import { useState, useEffect, useRef } from 'react';

import { supabase } from '../../lib/supabase';

import { useAuth } from '../../contexts/AuthContext';

import { Html5QrcodeScanner } from 'html5-qrcode';

import { QrCode, Calendar, CheckCircle2, AlertCircle, Loader2, LogOut, ChevronDown } from 'lucide-react';

import logo1 from '../../assets/logo3.svg';



export function StaffCheckIn() {

  const { user } = useAuth();

  const [matches, setMatches] = useState<any[]>([]);

  const [selectedMatch, setSelectedMatch] = useState<string>('');

  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  

  // ✅ نظام القفل لمنع تكرار المسح في نفس اللحظة

  const isProcessing = useRef(false);



  useEffect(() => {

    fetchUpcomingMatches();

  }, []);



  useEffect(() => {

    let scanner: Html5QrcodeScanner | null = null;



    if (selectedMatch) {

      scanner = new Html5QrcodeScanner(

        "reader", 

        { 

          fps: 10, 

          qrbox: { width: 250, height: 250 },

          rememberLastUsedCamera: true

        }, 

        false

      );

      scanner.render(onScanSuccess, onScanFailure);

    }



    return () => {

      if (scanner) {

        scanner.clear().catch(error => console.error("Scanner clear failed", error));

      }

    };

  }, [selectedMatch]);



  const fetchUpcomingMatches = async () => {

    try {

      const { data } = await supabase

        .from('matches')

        .select(`id, team_home:clubs!home_club_id(name_ar), team_away:clubs!away_club_id(name_ar)`)

        .eq('status', 'upcoming')

        .order('match_date', { ascending: true });



      if (data) setMatches(data);

    } catch (err) {

      console.error('Error fetching matches:', err);

    } finally {

      setLoading(false);

    }

  };



  const onScanSuccess = async (decodedText: string) => {

    // 1. القفل البرمجي

    if (isProcessing.current || status.type === 'success' || !selectedMatch) return;

    

    isProcessing.current = true; 



    try {

      // 2. التحقق الفوري من قاعدة البيانات (هل سجل حضور لهذه المباراة تحديداً؟)

      const { data: existingAttendance, error: checkError } = await supabase

        .from('match_attendance')

        .select('id')

        .eq('match_id', selectedMatch)

        .eq('user_id', decodedText)

        .maybeSingle();



      if (checkError) throw checkError;



      // 🛑 إذا وجد سجل، نوقف العملية وننبه الستاف

      if (existingAttendance) {

        setStatus({ type: 'error', message: 'هذا المشجع مسجل مسبقاً في هذه المباراة' });

        // ننتظر 3 ثواني ونفتح القفل لمسح باركود مشجع آخر

        setTimeout(() => { 

            isProcessing.current = false; 

            setStatus({ type: null, message: '' });

        }, 3000);

        return;

      }



      // 3. جلب النقاط

      const { data: settings } = await supabase

        .from('system_settings')

        .select('attendance_points')

        .single();



      const pointsToAdd = settings?.attendance_points || 1000;



      // 4. تنفيذ عملية التحضير (بما أنه غير مسجل مسبقاً)

      const { error: insertError } = await supabase.from('match_attendance').insert([

        { 

          match_id: selectedMatch, 

          user_id: decodedText, 

          points_earned: pointsToAdd,

          status: 'approved' 

        }

      ]);



      if (insertError) throw insertError;



      // نجاح العملية

      setStatus({ type: 'success', message: `تم التحضير بنجاح +${pointsToAdd} ✅` });

      if (navigator.vibrate) navigator.vibrate(200);



    } catch (err: any) {

      console.error('Check-in error:', err);

      setStatus({ type: 'error', message: 'مسجل مسبقا' });

    }



    // إعادة تعيين القفل بعد فترة بسيطة للسماح بمسح مشجع جديد

    setTimeout(() => {

      isProcessing.current = false;

      setStatus({ type: null, message: '' });

    }, 3000);

  };



  const onScanFailure = () => {};



  if (loading) return (

    <div className="min-h-screen bg-[#003837] flex items-center justify-center">

      <Loader2 className="animate-spin text-[#05E59F] w-12 h-12" />

    </div>

  );



  return (

    <div dir="rtl" className="min-h-screen bg-[#003837] font-almarai flex flex-col p-6 overflow-hidden">

      

      <div className="flex items-center justify-between mb-8 shrink-0 px-2">

        <img src={logo1} className="w-12 h-auto" alt="Ghanem" />

        <div className="text-left">

          <p className="text-[10px] text-[#05E59F] font-black uppercase tracking-widest">Staff Portal</p>

          <p className="text-white font-bold text-[10px] opacity-40 uppercase tracking-tighter">Match Verification</p>

        </div>

      </div>



      <div className="bg-[#002b2a] border border-white/5 rounded-[2.5rem] p-6 mb-6 shadow-2xl shrink-0">

        <div className="flex items-center gap-2 mb-4 text-white font-black text-xs opacity-70 uppercase">

          <Calendar size={14} className="text-[#05E59F]" /> تحديد المباراة الحالية

        </div>

        

        <div className="relative">

          <select 

            value={selectedMatch} 

            onChange={(e) => setSelectedMatch(e.target.value)}

            className="w-full bg-[#003837] border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-[#05E59F] appearance-none text-sm relative z-10 cursor-pointer"

          >

            <option value="">-- اختر المباراة --</option>

            {matches.map(m => (

              <option key={m.id} value={m.id}>

                {m.team_home?.name_ar} vs {m.team_away?.name_ar}

              </option>

            ))}

          </select>

          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#05E59F] z-20">

            <ChevronDown size={20} />

          </div>

        </div>

      </div>



      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">

        {!selectedMatch ? (

          <div className="text-center text-gray-500">

            <QrCode size={40} className="opacity-20 mx-auto mb-4 text-[#05E59F]" />

            <p className="font-bold text-sm">اختر المباراة لتفعيل الكاميرا</p>

          </div>

        ) : (

          <div className="w-full max-w-sm overflow-hidden rounded-[3.5rem] border-4 border-white/5 relative bg-black shadow-3xl aspect-square flex items-center justify-center">

            <div id="reader" className="w-full h-full"></div>

            

            {status.type && (

              <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-xl animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-[#05E59F]/20' : 'bg-red-500/20'}`}>

                {status.type === 'success' ? (

                    <CheckCircle2 size={100} className="text-[#05E59F] mb-4" />

                ) : (

                    <AlertCircle size={100} className="text-red-500 mb-4" />

                )}

                <p className={`text-2xl font-black px-8 text-center leading-tight ${status.type === 'success' ? 'text-[#05E59F]' : 'text-red-500'}`}>

                    {status.message}

                </p>

              </div>

            )}

          </div>

        )}

      </div>



      <button 

        onClick={() => supabase.auth.signOut().then(() => window.location.reload())} 

        className="mt-8 p-5 bg-white/5 text-gray-500 rounded-3xl font-black text-xs hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2 shrink-0"

      >

        <LogOut size={16} /> تسجيل خروج الستاف

      </button>



      <style>{`

        #reader { border: none !important; position: relative; }

        #reader__scan_region video { object-fit: cover !important; border-radius: 3rem !important; }

        #reader__dashboard_section_csr button {

          background: #05E59F !important;

          color: #000 !important;

          border-radius: 1.2rem !important;

          font-weight: 900 !important;

          padding: 12px 24px !important;

          border: none !important;

        }

      `}</style>

    </div>

  );

}