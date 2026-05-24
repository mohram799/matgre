import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat
 * Fetch all chat rooms with their messages and user VIP statuses
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Fetch chats joined with user details
      const chatsRes = await fetch(`${supabaseUrl}/rest/v1/chats?select=*,users(*),chat_messages(*)&order=last_message_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();

        // Format properly for high-end UI ingestion
        const formatted = chatsData.map((chat: any) => {
          const user = chat.users;
          const messages = chat.chat_messages || [];
          
          return {
            id: chat.id,
            customerName: user?.name || 'عميل غير مسجل',
            customerPhone: user?.phone || 'مجهول',
            vipTier: user?.vip_tier_id ? 'الشامخ' : 'الكفو', // Simplified mapping or details
            status: chat.chat_status,
            lastMessage: messages[messages.length - 1]?.message_text || 'لا توجد رسائل بعد',
            lastTime: chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: messages.filter((m: any) => !m.is_read && m.sender_type === 'user').length,
            messages: messages.map((m: any) => ({
              id: m.id,
              senderType: m.sender_type,
              senderName: m.sender_type === 'admin' ? 'الدعم الفني' : (user?.name || 'العميل'),
              text: m.message_text,
              time: new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
              isRead: m.is_read
            }))
          };
        });

        return NextResponse.json({ success: true, chats: formatted, mode: 'supabase' });
      }
    }

    // Return empty success structure if offline
    return NextResponse.json({ success: true, chats: [], mode: 'mock' });

  } catch (err: any) {
    console.error('[SHAMIKH CHAT API] Fetch error:', err.message);
    return NextResponse.json({ error: 'فشل جلب غرف الدعم الفني', detail: err.message }, { status: 500 });
  }
}
