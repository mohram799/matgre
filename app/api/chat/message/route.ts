import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/chat/message
 * Insert a new message into a chat room, and execute auto-reply logics
 */
export async function POST(req: NextRequest) {
  try {
    const { chatId, senderType, senderId, text } = await req.json();

    if (!chatId || !senderType || !text) {
      return NextResponse.json({ error: 'البيانات المرسلة غير مكتملة' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // 1. Insert message
      const msgRes = await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          chat_id: chatId,
          sender_type: senderType,
          sender_id: senderId || chatId, // Fallback to chatId reference
          message_text: text,
          is_read: senderType === 'admin'
        })
      });

      if (msgRes.ok) {
        // 2. Update Chat session
        await fetch(`${supabaseUrl}/rest/v1/chats?id=eq.${chatId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            last_message_at: new Date().toISOString()
          })
        });

        // 3. Mark user messages as read if admin replied
        if (senderType === 'admin') {
          await fetch(`${supabaseUrl}/rest/v1/chat_messages?chat_id=eq.${chatId}&sender_type=eq.user`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ is_read: true })
          });
        }

        // 4. Simulated AI Support Assistant Trigger (Concierge Auto-Reply)
        if (senderType === 'user') {
          const lowerText = text.toLowerCase();
          let botReply = '';

          if (lowerText.includes('سعر') || lowerText.includes('بكم') || lowerText.includes('السعر')) {
            botReply = 'أهلاً بك يا فندم! أسعار منتجاتنا الفاخرة تبدأ من 1,200 ريال عطوراً وحقائب يدوية. يمكنك تخصيص ونقش عباراتك المفضلة مجاناً.';
          } else if (lowerText.includes('شحن') || lowerText.includes('توصيل') || lowerText.includes('متى يصل')) {
            botReply = 'نوفر توصيلاً ملكياً سريعاً وخاصاً لجميع مدن الرياض ودبي والمنامة. التوصيل مجاني للعضويات من الفئة الذهبية والماسية.';
          } else if (lowerText.includes('مرحبا') || lowerText.includes('السلام')) {
            botReply = 'وعليكم السلام والرحمة! مرحباً بك في بوابة شامخ للدعم الفاخر الحصري. كيف يمكنني خدمتك اليوم يا كابتن؟';
          }

          if (botReply) {
            // Write bot reply after a small timeout simulator
            await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                chat_id: chatId,
                sender_type: 'bot',
                sender_id: chatId,
                message_text: botReply,
                is_read: false
              })
            });
          }
        }

        return NextResponse.json({ success: true, mode: 'supabase' });
      }
    }

    return NextResponse.json({ success: true, mode: 'mock' });

  } catch (err: any) {
    console.error('[SHAMIKH CHAT MSG] Send error:', err.message);
    return NextResponse.json({ error: 'فشل إرسال الرسالة السحابية', detail: err.message }, { status: 500 });
  }
}
