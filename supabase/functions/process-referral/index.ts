import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, referral_code } = await req.json()

    if (!referral_code) {
      return new Response(JSON.stringify({ error: 'كود الإحالة مفقود' }), { status: 400, headers: corsHeaders })
    }

    // 1. البحث عن صاحب الكود (المُحيل)
    const { data: referrer, error: referrerError } = await supabaseClient
      .from('user_profiles')
      .select('id, points')
      .eq('referral_code', referral_code.toUpperCase())
      .single()

    if (referrerError || !referrer) {
      throw new Error('كود الإحالة غير صحيح أو غير موجود')
    }

    // 2. منع الإحالة الذاتية
    if (referrer.id === user_id) {
      throw new Error('لا يمكنك استخدام كودك الشخصي')
    }

    // 3. تحديث نقاط المُحيل (+100)
    await supabaseClient
      .from('user_profiles')
      .update({ points: (referrer.points || 0) + 100 })
      .eq('id', referrer.id)

    // 4. تحديث نقاط المستخدم الجديد (+500)
    const { data: newUser } = await supabaseClient
      .from('user_profiles')
      .select('points')
      .eq('id', user_id)
      .single()

    await supabaseClient
      .from('user_profiles')
      .update({ points: (newUser?.points || 0) + 500 })
      .eq('id', user_id)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})