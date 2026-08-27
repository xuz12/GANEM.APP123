import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { QrCode, Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function GhanemAttendancePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const handleVerifyAttendance = async () => {
    if (!qrData.trim() || !user) {
      setMessage({ type: 'error', text: 'الرجاء إدخال كود QR' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-attendance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            qrData: qrData.trim(),
            userId: user.id,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          text: `تم تأكيد الحضور! حصلت على ${result.pointsEarned} غنيمة`,
        });
        setQrData('');
        await refreshProfile();
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'فشل تأكيد الحضور',
        });
      }
    } catch (error) {
      console.error('Attendance verification error:', error);
      setMessage({
        type: 'error',
        text: 'حدث خطأ أثناء تأكيد الحضور',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 bg-ghanem-dark min-h-screen" dir="rtl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-ghanem-accent flex items-center justify-center">
            <QrCode className="w-5 h-5 text-ghanem-dark" />
          </div>
          <h1 className="text-2xl font-almarai font-bold text-ghanem-primary">
            إثبات الحضور
          </h1>
        </div>

        <div className="bg-ghanem-card rounded-2xl p-6 border border-ghanem-accent mb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-32 h-32 bg-ghanem-dark rounded-2xl flex items-center justify-center border-2 border-ghanem-accent">
              <Camera className="w-16 h-16 text-ghanem-accent" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-ghanem-secondary mb-2">
                امسح QR Code من الملعب
              </label>
              <input
                type="text"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="أدخل الكود هنا"
                className="w-full bg-ghanem-dark border border-ghanem-accent rounded-xl px-4 py-3 text-ghanem-primary placeholder-ghanem-secondary/50 focus:outline-none focus:ring-2 focus:ring-ghanem-accent"
              />
            </div>

            {message && (
              <div
                className={`rounded-xl p-4 flex items-start gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : message.type === 'error'
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-blue-500/10 border border-blue-500/30'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : message.type === 'error' ? (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    message.type === 'success'
                      ? 'text-green-400'
                      : message.type === 'error'
                      ? 'text-red-400'
                      : 'text-blue-400'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}

            <button
              onClick={handleVerifyAttendance}
              disabled={loading || !qrData.trim()}
              className="w-full bg-ghanem-accent text-ghanem-dark font-bold py-4 rounded-xl transition-all hover:bg-ghanem-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ghanem-dark"></div>
                  جاري التحقق...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  تأكيد الحضور
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-ghanem-card rounded-xl p-5 border border-ghanem-accent">
          <h3 className="font-bold text-ghanem-primary mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-ghanem-accent" />
            كيف تحصل على الغنائم؟
          </h3>
          <div className="space-y-2 text-sm text-ghanem-secondary">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-ghanem-accent rounded-full mt-2 flex-shrink-0"></div>
              <p>احضر إلى الملعب قبل بداية المباراة</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-ghanem-accent rounded-full mt-2 flex-shrink-0"></div>
              <p>ابحث عن QR Code في مكان ظاهر في الملعب</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-ghanem-accent rounded-full mt-2 flex-shrink-0"></div>
              <p>امسح الكود أو أدخله يدوياً</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-ghanem-accent rounded-full mt-2 flex-shrink-0"></div>
              <p>احصل على غنائمك فوراً!</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-ghanem-accent/10 rounded-xl p-4 border border-ghanem-accent">
          <p className="text-center text-sm text-ghanem-accent">
            رصيدك الحالي: <span className="font-bold text-lg">{profile?.points || 0}</span> غنيمة
          </p>
        </div>
      </div>
    </div>
  );
}
