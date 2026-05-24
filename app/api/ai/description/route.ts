import { NextRequest, NextResponse } from 'next/server';
import { services } from '@/lib/service-registry';
import { logger } from '@/lib/logger';

/**
 * POST /api/ai/description
 * AI-powered luxury product description copy generator.
 *
 * Mode 1: OpenAI GPT-4o (if OPENAI_API_KEY is configured) — protected by circuit breaker.
 * Mode 2: Heuristic luxury Arabic copy engine (deterministic fallback).
 *
 * Circuit breaker ensures heuristic mode activates instantly when OpenAI is degraded,
 * preventing latency spikes from propagating into product import pipelines.
 */
export async function POST(req: NextRequest) {
  const traceId = req.headers.get('x-trace-id') ?? `trace-${Date.now()}`;

  try {
    const { title, category, keywords = [] } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'اسم المنتج مطلوب لتوليد الوصف' }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;

    // ── Mode 1: OpenAI GPT-4o (circuit-breaker protected) ────────────────────
    if (openAiKey && !openAiKey.includes('placeholder')) {
      const result = await services.openai.execute(
        async () => {
          const prompt = buildOpenAiPrompt(title, category, keywords);

          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'أنت كاتب محتوى فاخر متخصص في أوصاف المنتجات الراقية للسوق العربي. اكتب بأسلوب مفخم وجذاب يلامس المشاعر.',
                },
                { role: 'user', content: prompt },
              ],
              max_tokens: 600,
              temperature: 0.82,
            }),
          });

          if (!res.ok) {
            throw new Error(`OpenAI API returned status ${res.status}`);
          }

          const completion = await res.json();
          const description = completion.choices?.[0]?.message?.content ?? '';
          
          logger.info('[AI-DESCRIPTION] OpenAI description generated', { traceId, model: 'gpt-4o-mini', title });

          return NextResponse.json({
            description,
            title,
            category,
            engine: 'SHAMIKH-AI-GPT4o',
            mode: 'openai',
            circuitState: services.openai.getState(),
          });
        },
        async () => {
          // Circuit OPEN — instant heuristic fallback
          logger.warn('[AI-DESCRIPTION] OpenAI circuit OPEN — heuristic fallback', { traceId });
          const description = generateHeuristicDescription(title, keywords);
          return NextResponse.json({
            description,
            title,
            category,
            engine: 'SHAMIKH-AI-HEURISTIC',
            mode: 'heuristic_fallback',
            fallbackReason: 'circuit_open',
            circuitState: services.openai.getState(),
          });
        }
      );

      return result;
    }

    // ── Mode 2: Pure heuristic (no OpenAI key configured) ────────────────────
    logger.info('[AI-DESCRIPTION] Heuristic mode — no OpenAI key', { traceId, title });
    const description = generateHeuristicDescription(title, keywords);

    return NextResponse.json({
      description,
      title,
      category,
      engine: 'SHAMIKH-AI-V2',
      mode: 'heuristic_luxury_copywriting',
      circuitState: services.openai.getState(),
    });

  } catch (err: any) {
    logger.error('[AI-DESCRIPTION] Unhandled error', err, { traceId });
    return NextResponse.json({ error: 'فشل توليد الوصف الذكي', detail: err.message }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOpenAiPrompt(title: string, category: string | undefined, keywords: string[]): string {
  const kwLine = keywords.length > 0 ? `\nالكلمات المفتاحية: ${keywords.join('، ')}` : '';
  return `اكتب وصفاً فاخراً لمنتج اسمه: "${title}"${category ? `\nالفئة: ${category}` : ''}${kwLine}\n\nالوصف يجب أن:\n- يبدأ بجملة تشويقية قوية\n- يذكر المواد الفاخرة والحرفية\n- يتضمن مزايا المنتج بشكل شعري\n- ينتهي بدعوة للاقتناء\n- لا يتجاوز 250 كلمة`;
}

function generateHeuristicDescription(title: string, keywords: string[]): string {
  const introTemplates = [
    `نقدم لكم تحفة فنية تجسد الأناقة والجاذبية في أسمى صورها: ${title}. صُمم هذا الإصدار الفريد خصيصاً لصفوة المجتمع والباحثين عن الرقي المطلق.`,
    `تفرد بحضورك الاستثنائي مع ${title}. تجربة حسية فريدة تأخذك إلى عالم الفخامة التي لا تضاهى، بلمسات فنية متقنة وصياغة ملكية تناسب تطلعاتك.`,
    `لكل تفصيل قصة تروي الفخامة؛ نكشف اليوم عن ${title}. التوليفة المثالية بين الأصالة التاريخية والحداثة الراقية لتمنحك تميزاً غير مسبوق.`,
  ];

  const bodyTemplates = [
    `تم انتقاء المواد الخام المكونة لهذا المنتج بعناية فائقة من أندر المصادر العالمية لضمان أعلى مستويات الجودة والاستدامة. يُظهر التصميم الخارجي براعة يدوية متناهية تنعكس في أدق المنحنيات والتفاصيل الفاخرة.`,
    `يأتي هذا المنتج الاستثنائي ليعيد تعريف الجمال في فئته. صياغة دقيقة تمنحك إحساساً دائماً بالثقة والتميز، مما يجعله الخيار الأمثل للإهداء أو لضمّه لمجموعتك الشخصية الفاخرة.`,
  ];

  const specsTemplates = [
    `• خامات حصرية منتقاة بعناية ملكية فائقة.\n• صناعة يدوية وتصميم حصري محدود الإصدار.\n• ضمان ذهبي ممتد للمشتري الأصلي.\n• تغليف ملكي فاخر مخملي مناسب للإهداء الفخم.`,
    `• توليفة حصرية تضمن التفرد والتميز.\n• لمسات يدوية دقيقة بأيدي خبراء الفئة الأولى.\n• متانة واستدامة استثنائية لجميع الظروف.\n• يأتي مع شهادة أصالة ورقم تسلسلي فريد.`,
  ];

  const hash = title.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const intro = introTemplates[hash % introTemplates.length];
  const body = bodyTemplates[hash % bodyTemplates.length];
  const specs = specsTemplates[hash % specsTemplates.length];

  const kwLine = keywords.length > 0
    ? `\n\n**مزايا إضافية:**\n` + keywords.map((k: string) => `• ${k}`).join('\n')
    : '';

  return `${intro}\n\n${body}\n\n**المواصفات الفاخرة:**\n${specs}${kwLine}`;
}
