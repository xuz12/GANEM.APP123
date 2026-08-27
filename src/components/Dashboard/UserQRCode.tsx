import QRCode from "react-qr-code";
import { useState } from 'react';
import { QrCode, Copy, CheckCircle, ShieldAlert } from 'lucide-react';

interface UserQRCodeProps {
  qrCode: string; // User ID
  userName: string;
}

export function UserQRCode({ qrCode, userName }: UserQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    /* ✅ تحديث الخلفية للون الهوية الجديد #002b2a (درجة أغمق قليلاً للتباين) */
    <div className="bg-[#002b2a] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl font-almarai text-right relative overflow-hidden" dir="rtl">
      
      {/* لمسة توهج خلفية بلون الهوية الجديد */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#05E59F]/10 blur-[80px] rounded-full"></div>

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-[#05E59F]/10 flex items-center justify-center border border-[#05E59F]/20 shadow-lg shadow-[#05E59F]/5">
          <QrCode className="w-6 h-6 text-[#05E59F]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">بطاقة غنيمة الرقمية</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Ghanem Member ID</p>
        </div>
      </div>

      <div className="flex justify-center mb-8 relative z-10">
        {/* ✅ حاوية الباركود بيضاء صريحة لضمان سرعة المسح في الملاعب */}
        <div className="p-6 bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(5,229,159,0.15)] transition-transform hover:scale-105 duration-500">
          <QRCode
            value={qrCode}
            size={200}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
            fgColor="#000000" // لون النقاط أسود
            bgColor="#FFFFFF" // لون الخلفية أبيض
          />
        </div>
      </div>

      <div className="text-center mb-8 relative z-10">
        <h3 className="text-2xl font-black text-white mb-1 uppercase italic">{userName}</h3>
        <p className="text-[10px] text-[#05E59F]/60 font-mono font-bold tracking-[0.2em] uppercase">
            {qrCode.substring(0, 18).toUpperCase()}...
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 relative z-10">
        <button
          onClick={copyId}
          /* ✅ تحديث زر النسخ للون المتوهج الجديد #05E59F */
          className="w-full flex items-center justify-center gap-2 bg-[#05E59F] text-black py-5 rounded-[1.5rem] font-black hover:opacity-90 transition-all shadow-lg shadow-[#05E59F]/20 active:scale-95"
        >
          {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
          {copied ? 'تم نسخ المعرف' : 'نسخ معرف المشجع'}
        </button>
      </div>

      <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3 relative z-10">
        <ShieldAlert className="text-orange-500 w-5 h-5 mt-0.5 flex-shrink-0 opacity-70" />
        <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
          هذه البطاقة مخصصة للاستخدام داخل منشآت غانم المعتمدة. لا تشارك الباركود مع جهات مجهولة لضمان أمان حسابك.
        </p>
      </div>
    </div>
  );
}