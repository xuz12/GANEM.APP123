import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, QrCode, Loader2, StopCircle, MapPin, X, Trophy, Zap, Check } from 'lucide-react';

export function QRScanner({ onSuccess }: { onSuccess?: () => void }) {
  const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scannedUser, setScannedUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isScanning) {
      html5QrCode = new Html5Qrcode("reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 25, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          setQrInput(decodedText);
          setIsScanning(false);
          handleVerify(decodedText);
        },
        () => {}
      ).catch(err => console.error("Camera error:", err));
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error(e));
      }
    };
  }, [isScanning]);

  const handleVerify = async (manualInput?: string) => {
    const finalInput = manualInput || qrInput;
    if (!finalInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const userIdValue = finalInput.includes(':') ? finalInput.split(':').pop()?.trim() : finalInput.trim();

      const { data: userData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userIdValue)
        .maybeSingle();

      if (fetchError || !userData) {
        throw new Error("عفواً، المشجع غير مسجل في النظام");
      }

      const { error: insertError } = await supabase
        .from('match_attendance')
        .insert([{
          user_id: userData.user_id,
          status: 'approved',
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw new Error("فشل تسجيل الحضور: " + insertError.message);
      }

      setScannedUser(userData);
      setShowSuccessModal(true);
      setQrInput('');
      
      if (onSuccess) onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#002b2a] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden font-almarai text-right" dir="rtl">
      
      {/* 🟢 شاشة النجاح الفخمة (Full Overlay) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] bg-[#05E59F] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150"></div>
          
          <button 
            onClick={() => setShowSuccessModal(false)} 
            className="absolute top-8 right-8 text-black/20 hover:text-black transition-colors"
          >
            <X size={40} />
          </button>
          
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-black/10 blur-[40px] rounded-full scale-150 animate-pulse"></div>
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                <Check className="w-16 h-16 text-[#05E59F] stroke-[4px]" />
            </div>
          </div>

          <h2 className="text-5xl font-black text-black mb-2 tracking-tighter">كفو يا بطل!</h2>
          <p className="text-black/60 text-xl font-bold mb-10 uppercase tracking-widest leading-none">Attendance Confirmed</p>
          
          <div className="bg-black text-white px-10 py-5 rounded-[2rem] border border-white/10 shadow-2xl mb-12">
            <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Authenticated User</p>
            <h3 className="text-2xl font-black">{scannedUser?.full_name}</h3>
            <div className="flex items-center justify-center gap-2 mt-4 text-[#05E59F]">
                <Zap size={16} fill="#05E59F" />
                <span className="font-black tracking-widest">+100 POINTS</span>
            </div>
          </div>

          <button 
            onClick={() => setShowSuccessModal(false)}
            className="px-16 py-5 bg-black text-white rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl group flex items-center gap-3"
          >
            المشجع التالي <Zap size={20} className="text-[#05E59F]" />
          </button>
        </div>
      )}

      {/* الهيدر */}
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#05E59F]/10 flex items-center justify-center border border-[#05E59F]/20 shadow-inner">
            <QrCode size={32} className="text-[#05E59F]" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white leading-tight">ماسح غانم</h3>
            <p className="text-[#05E59F] text-[9px] font-black tracking-[0.3em] uppercase mt-1">Live Validation Node</p>
          </div>
        </div>
        
        <button 
          onClick={() => { setIsScanning(!isScanning); setError(null); }}
          className={`p-5 rounded-2xl transition-all duration-500 shadow-xl ${isScanning ? 'bg-red-500/20 text-red-500' : 'bg-[#05E59F] text-black hover:shadow-[#05E59F]/20'}`}
        >
          {isScanning ? <StopCircle size={28} /> : <Camera size={28} />}
        </button>
      </div>

      <div className="space-y-8 relative z-10">
        {/* منطقة الكاميرا */}
        {isScanning && (
          <div className="relative overflow-hidden rounded-[3rem] border-4 border-[#05E59F]/20 bg-black aspect-square shadow-2xl">
            <div id="reader" className="w-full h-full"></div>
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40"></div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-[#05E59F] rounded-[3rem] animate-pulse shadow-[0_0_50px_rgba(5,229,159,0.2)]"></div>
            </div>
          </div>
        )}

        {/* حقل الإدخال اليدوي */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-[0.3em]">Manual Entry ID</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="00000000"
              className="flex-1 px-8 py-6 bg-[#003837] border border-white/10 rounded-3xl text-white text-center text-2xl font-mono outline-none focus:border-[#05E59F] transition-all shadow-inner placeholder:opacity-20"
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading || !qrInput.trim()}
              className="px-10 bg-[#05E59F] text-black rounded-3xl font-black text-lg transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] disabled:opacity-30"
            >
              {loading ? <Loader2 className="animate-spin w-8 h-8" /> : 'تحقق'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-400 text-sm animate-shake">
            <AlertCircle size={20} />
            <p className="font-bold">{error}</p>
          </div>
        )}
      </div>
      
      <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-600 font-black uppercase tracking-widest opacity-50">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-[#05E59F]" />
          <span>Active Venue Node</span>
        </div>
        <span>Core V4.5.1</span>
      </div>

      <style>{`
        #reader video { object-fit: cover !important; border-radius: 40px; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
      `}</style>
    </div>
  );
}