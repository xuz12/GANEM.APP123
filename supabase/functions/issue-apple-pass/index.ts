import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IssuePassRequest {
  user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id }: IssuePassRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "معرف المستخدم مفقود" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, full_name, points, level, qr_code")
      .eq("id", user_id)
      .maybeSingle();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: "ملف المستخدم غير موجود" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingNFC } = await supabase
      .from("nfc_identifiers")
      .select("nfc_uid, pass_id")
      .eq("user_id", user_id)
      .eq("wallet_type", "apple")
      .eq("is_active", true)
      .maybeSingle();

    let nfc_uid: string;
    let pass_id: string;

    if (existingNFC) {
      nfc_uid = existingNFC.nfc_uid;
      pass_id = existingNFC.pass_id;
    } else {
      nfc_uid = crypto.randomUUID();
      pass_id = `pass.app.ghanem.${user_id}`;

      await supabase.from("nfc_identifiers").insert({
        user_id,
        nfc_uid,
        wallet_type: "apple",
        pass_id,
        is_active: true,
      });
    }

    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.app.ghanem.membership",
      teamIdentifier: "GHANEM_TEAM_ID",
      organizationName: "غانم",
      serialNumber: pass_id,
      description: "بطاقة عضوية غانم",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(10, 10, 10)",
      labelColor: "rgb(255, 255, 255)",
      generic: {
        primaryFields: [
          {
            key: "name",
            label: "المشجع",
            value: userProfile.full_name || "مشجع غانم",
          },
        ],
        secondaryFields: [
          {
            key: "points",
            label: "الغنائم",
            value: `${userProfile.points || 0}`,
          },
        ],
        auxiliaryFields: [
          {
            key: "level",
            label: "المستوى",
            value: userProfile.level || "برونز",
          },
        ],
        backFields: [
          {
            key: "qr_code",
            label: "رمز QR",
            value: userProfile.qr_code || "",
          },
          {
            key: "user_id",
            label: "معرف المستخدم",
            value: user_id,
          },
        ],
      },
      barcode: {
        message: userProfile.qr_code || user_id,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
      },
      nfc: {
        message: nfc_uid,
        encryptionPublicKey: "",
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم إنشاء بطاقة Apple Wallet بنجاح",
        pass_data: passData,
        nfc_uid,
        pass_id,
        note: "ملاحظة: هذه نسخة تجريبية. للحصول على بطاقة Apple Wallet حقيقية، يجب توقيع البطاقة باستخدام شهادة Apple Developer وتوفير ملفات الصور المطلوبة.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Apple Pass issuance error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء إنشاء البطاقة", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});