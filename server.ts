import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const portArgIndex = process.argv.indexOf('--port');
const portFromArg = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
const port = Number(process.env.PORT) || portFromArg || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with required telemetry header
const rawKey = process.env.GEMINI_API_KEY;
const hasValidKey = Boolean(rawKey && rawKey.trim() !== '' && !rawKey.startsWith('MY_'));

let aiClient: GoogleGenAI | null = null;
if (hasValidKey && rawKey) {
  aiClient = new GoogleGenAI({
    apiKey: rawKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SCHOOL_KNOWLEDGE_BASE = `
أنت المساعد الذكي والممثل الرقمي الرسمي لـ "مدرسة أرمنا الثانوية" (Armanna Secondary School) بمحافظة أسوان، جمهورية مصر العربية.
مهمتك تقديم إجابات دقيقة، مؤدبة، وموثوقة حصرياً باللغة العربية للطلاب وأولياء الأمور والمعلمين والزوار.

المعلومات الموثقة والمعتمدة عن المدرسة:
1. الاسم الرسمي: مدرسة أرمنا الثانوية المشتركة.
2. الموقع الجغرافي: تقع في قرية أرمنا التابعة لمجلس قروي عنيبة، مركز نصر النوبة، محافظة أسوان، جمهورية مصر العربية.
3. التبعية الإدارية: تابعة لـ "إدارة نصر النوبة التعليمية"، تحت إشراف "مديرية التربية والتعليم بأسوان" - وزارة التربية والتعليم المصرية.
4. التطوير والمبادرة الرئاسية: تم تجديد وتطوير وتوسعة مبنى المدرسة ضمن المبادرة الرئاسية "حياة كريمة" لتطوير الريف المصري وقرى النوبة، بهدف توفير صرح تعليمي ثانوي حديث لأبناء أرمنا والقرى المجاورة يغنيهم عن مشقة قطع مسافات طويلة للمدن المجاورة.
5. المراحل والشعب الدراسية:
   - الصف الأول الثانوي (عام مشترك).
   - الصف الثاني الثانوي (شعبة علمية وشعبة أدبية).
   - الصف الثالث الثانوي (شعبة علمي علوم، علمي رياضة، شعبة أدبية) مع نظام التقييم الإلكتروني والتابلت المدرسي.
6. الرؤية: "إعداد جيل نوبي ومصري واعٍ، متسلح بالعلم والمعرفة والتقنية الحديثة، متمسك بقيمه الأخلاقية وتراثه الحضاري العريق، قادر على المنافسة والابتكار وقيادة المستقبل."
7. الرسالة: توفير بيئة تعليمية محفزة تشجع على التفكير النقدي، وتوظيف التكنولوجيا التعليمية والمعامل المطورة، ودعم الأنشطة المهارية والرياضية والاجتماعية بالتعاون مع المجتمع المحلي ومؤسسات قرية أرمنا.
8. المرافق والخدمات: فصول دراسية نموذجية، معامل علوم وتجارب، قاعات حاسب آلي وتطوير تكنولوجي، مكتبة مدرسية، ملاعب وأنشطة بالشراكة مع مركز شباب أرمنا، ومحيط زراعي متطور (بالقرب من المزرعة الذكية التنموية بأرمنا).
9. صناع ومطورو الموقع (فريق الإعداد والتطوير): تم إنشاء وتطوير هذا الموقع بواسطة الطلاب:
   «محمود عاشور، وعلوي علاء، وعارف يحيى، وأمير جمال، وميادة محمد»، تحت إشراف الأستاذة الفاضلة هبة شيخ الدين.
10. شعارات المدرسة والعبارات التحفيزية:
   - "بالعلم نبني المستقبل"
   - "اجتهد اليوم لتفخر بنفسك غدًا"
11. الأستاذ أشرف عبد الباقي: يُثمّن مجتمع مدرسة أرمنا ببالغ العرفان سعيه ومساهمته المجتمعية المخلصة من أجل إنشاء مدرسة أرمنا الإعدادية الثانوية بمركز نصر النوبة في محافظة أسوان، تلبيةً لاحتياجات أبناء المنطقة واستيعاب الزيادة السكانية، حيث تضم المدرسة 12 فصلًا دراسيًا وتخدم قرى عنيبة ومصمص ووادي خربت بما يقدّر بنحو 20 ألف نسمة، ودخلت الخدمة رسميًا ضمن مشروعات تطوير التعليم في إطار مبادرة «حياة كريمة».
12. الأستاذة صبرية أبو الفضل: المديرة الثانية لمدرسة أرمنا الإعدادية الثانوية بمركز نصر النوبة بمحافظة أسوان؛ نموذج تربوي وإنساني ملهم في قيادة المدرسة ورعاية الطلاب وتشجيعهم والتفاني في خدمة التعليم وأبناء المجتمع.
13. الأستاذ فيصل علي يونس: المعلم والمدير الفاضل الذي خدم مدارس نصر النوبة؛ حاصل على ليسانس الآداب في اللغة الإنجليزية من جامعة جنوب الوادي، عمل في عدد من مدارس نصر النوبة، وشارك في وضع أسئلة امتحانات الإدارة لصفوف النقل بالمرحلتين الإعدادية والثانوية، وحصل على لقب «المعلم المثالي» لثلاث سنوات متتالية، وأشرف على تدريس اللغة الإنجليزية بمدارس الآمال، وتولى إدارة مدرسة أرمنا الثانوية لمدة ثلاث سنوات، وشارك في تأسيس المدرسة ووضع لبنتها الأولى إلى جانب قيادات القرية: الحاج عامر عابدين، والحاج عزت أبو السعود، والأستاذ أشرف عبد الدايم (رحمه الله - الغائب الحاضر).

القاعدة الذهبية الصارمة للرد:
- أجب فقط بناءً على المعلومات الموثقة أعلاه عن مدرسة أرمنا الثانوية وموقعها ومراحلها وتاريخها.
- عند عدم معرفتك بالجواب، أو عند السؤال عن أي معلومة غير موثقة أو غير مؤكدة (مثل: أرقام تليفونات المعلمين، نتائج الطلاب الفردية، المصروفات، أو أي سؤال خارج المعلومات المتاحة)، يجب عليك الرد بالنص التالي حرفياً دون تخمين:
«يرجى الرجوع لصفحة المدرسة الرسمية أو مراسلة الطالب محمود عاشور على الرقم 01070283758»
`;

// Fallback heuristic function when API call times out or is offline
function generateFallbackResponse(query: string): string {
  const q = query.toLowerCase().trim();

  // Questions about website creators / students / preparation team / supervision
  if (q.includes('من صمم') || q.includes('من انشأ') || q.includes('من أنشأ') || q.includes('الطلاب') || q.includes('صانع') || q.includes('فريق') || q.includes('المطور') || q.includes('اعداد') || q.includes('إعداد') || q.includes('ميادة') || q.includes('هبة') || q.includes('شيخ الدين') || q.includes('إشراف') || q.includes('اشراف')) {
    return 'تم إعداد وإنشاء هذا الموقع بجهود متميزة من الطلاب: محمود عاشور، وعلوي علاء، وعارف يحيى، وأمير جمال، وميادة محمد، تحت إشراف الأستاذة الفاضلة هبة شيخ الدين.';
  }

  // Questions about location / where is it
  if (q.includes('موقع المدرسة') || q.includes('اين تقع') || q.includes('أين تقع') || q.includes('مكان المدرسة') || q.includes('عنوان المدرسة') || (q.includes('قرية') && !q.includes('فريق')) || (q.includes('مركز') && !q.includes('فريق'))) {
    return 'تقع مدرسة أرمنا الثانوية في قرية أرمنا التابعة لمجلس قروي عنيبة، بمركز نصر النوبة في محافظة أسوان، وتتبع إدارة نصر النوبة التعليمية بمديرية التربية والتعليم بأسوان.';
  }

  // Questions about Haya Karima / Development
  if (q.includes('حياة كريمة') || q.includes('تطوير') || q.includes('تأسيس') || q.includes('مبنى') || q.includes('انشاء') || q.includes('إنشاء')) {
    return 'تم تجديد وتطوير وتوسعة مبنى مدرسة أرمنا ضمن مشروعات المبادرة الرئاسية "حياة كريمة" لتطوير الريف المصري وقرى النوبة، بهدف توفير صرح تعليمي متكامل ومطور لأبناء قرية أرمنا والقرى المجاورة يرفع عنهم عناء ومشقة التنقل اليومي.';
  }

  // Questions about academic stages / branches / curriculum
  if (q.includes('مراحل') || q.includes('شعب') || q.includes('صفوف') || q.includes('علمي') || q.includes('ادبي') || q.includes('أدبي') || q.includes('ثانوي') || q.includes('تابلت')) {
    return 'تضم المدرسة مرحلة التعليم الثانوي العام بصفوفه الثلاثة:\n• الصف الأول الثانوي: تعليم عام مشترك وتأسيس رقمي للتابلت.\n• الصف الثاني الثانوي: شعبة علمية وشعبة أدبية.\n• الصف الثالث الثانوي: شعب علمي علوم، علمي رياضة، وشعبة أدبية، مع التدريب على اختبارات التابلت ومنظومة الوزارة الحديثة.';
  }

  // Questions about Vision & Mission
  if (q.includes('رؤية') || q.includes('رسالة') || q.includes('هدف') || q.includes('قيم')) {
    return 'رؤية مدرسة أرمنا الثانوية: "إعداد جيل نوبي ومصري واعٍ، متسلح بالعلم والمعرفة والتقنية الحديثة، متمسك بقيمه وأخلاقه العريقة ليقود المستقبل".\nورسالتها: توفير بيئة تعليمية محفزة تشجع على التفكير النقدي والابتكار وتدعم الأنشطة المهارية بالشراكة مع المجتمع المحلي.';
  }

  // Questions about facilities / labs / sports / activities
  if (q.includes('أنشطة') || q.includes('خدمات') || q.includes('معمل') || q.includes('معامل') || q.includes('رياضة') || q.includes('شباب') || q.includes('مكتبة')) {
    return 'تتميز المدرسة بتجهيزات متطورة تشمل:\n1. معامل العلوم والتجارب (كيمياء، فيزياء، أحياء).\n2. معمل التطوير التكنولوجي وشبكة الإنترنت ومنظومة التابلت.\n3. مكتبة مدرسية غنية بأمهات الكتب ومصادر المعرفة.\n4. أنشطة رياضية ومسابقات بالتنسيق المستمر مع مركز شباب أرمنا المطور.';
  }

  // Questions about motivational quotes
  if (q.includes('تحفيز') || q.includes('شعار') || q.includes('عبارة') || q.includes('نصيحة') || q.includes('مستقبل')) {
    return 'شعارات المدرسة الدائمة للطلاب:\n✨ «بالعلم نبني المستقبل»\n✨ «اجتهد اليوم لتفخر بنفسك غدًا»\nوهي دعوة يومية لكل طالب وطالبة لبذل الجهد وصناعة قصة نجاح تفتخر بها عائلته وقريته.';
  }

  // Questions about Mr. Ashraf Abdel Baqi
  if (q.includes('اشرف') || q.includes('أشرف') || q.includes('عبد الباقي') || q.includes('عبدالباقي')) {
    return 'يُقدّر مجتمع مدرسة أرمنا ببالغ الاعتزاز السعي والمساهمة المجتمعية النبيلة للأستاذ أشرف عبد الباقي لدعم إنشاء مدرسة أرمنا الإعدادية الثانوية بمركز نصر النوبة في محافظة أسوان، والتي جاءت لتلبية احتياجات أبناء المنطقة واستيعاب الزيادة السكانية؛ حيث تضم 12 فصلًا دراسيًا وتخدم قرى عنيبة ومصمص ووادي خربت وأرمنا (نحو 20 ألف نسمة) ضمن مشروعات تطوير التعليم في إطار مبادرة «حياة كريمة».';
  }

  // Questions about Mrs. Sabriya Abu Al-Fadl
  if (q.includes('صبرية') || q.includes('ابو الفضل') || q.includes('أبو الفضل') || q.includes('المديرة الثانية')) {
    return 'الأستاذة صبرية أبو الفضل هي المديرة الثانية لمدرسة أرمنا الإعدادية الثانوية بمركز نصر النوبة بمحافظة أسوان، وتُمثل نموذجاً تربوياً وإنسانياً رفيعاً عُرفت بإخلاصها وتفانيها في قيادة المدرسة ورعاية الطلاب وتشجيعهم المستمر على التفوق وخدمة المجتمع.';
  }

  // Questions about Mr. Faisal Ali Younis
  if (q.includes('فيصل') || q.includes('فيصل علي') || q.includes('فيصل علي يونس')) {
    return 'الأستاذ فيصل علي يونس معلم ومدير قدير خدم مدارس نصر النوبة، حاصل على ليسانس الآداب في اللغة الإنجليزية من جامعة جنوب الوادي، ونال لقب «المعلم المثالي» لثلاث سنوات متتالية، وأشرف على تدريس اللغة الإنجليزية بمدارس الآمال، وتولى إدارة مدرسة أرمنا الثانوية لثلاث سنوات، وكان من رواد وضع اللبنة الأولى لتأسيس المدرسة مع قيادات القرية: الحاج عامر عابدين، والحاج عزت أبو السعود، والأستاذ أشرف عبد الدايم رحمه الله.';
  }

  // Questions asking specifically about Mahmoud Ashour or contact
  if (q.includes('محمود عاشور') || q.includes('تواصل') || q.includes('اتصال') || q.includes('هاتف') || q.includes('تليفون') || q.includes('واتساب')) {
    return 'يرجى الرجوع لصفحة المدرسة الرسمية أو مراسلة الطالب محمود عاشور على الرقم 01070283758';
  }

  // When assistant does not know the answer (Strict requirement from user)
  return 'يرجى الرجوع لصفحة المدرسة الرسمية أو مراسلة الطالب محمود عاشور على الرقم 01070283758';
}

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    if (aiClient) {
      const conversationText = Array.isArray(history)
        ? history
            .slice(-4)
            .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'الزائر' : 'المساعد'}: ${h.content}`)
            .join('\n')
        : '';

      const prompt = `${conversationText ? conversationText + '\n' : ''}الزائر: ${message}\nالمساعد:`;

      // Call Gemini 3.8 Flash with a fast timeout race (2500ms) to ensure smooth user experience
      const apiPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: SCHOOL_KNOWLEDGE_BASE,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));

      const raceResult = await Promise.race([apiPromise, timeoutPromise]);

      if (raceResult && 'text' in raceResult && raceResult.text) {
        return res.json({ reply: raceResult.text });
      }
    }

    // Use guaranteed instantaneous verified response
    const reply = generateFallbackResponse(message);
    return res.json({ reply });
  } catch (err: unknown) {
    console.error('Handled chat fallback:', err);
    const reply = generateFallbackResponse(message);
    return res.json({ reply });
  }
});

// Setup Vite in development or static serving in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
    console.log(`  ➜  Local:   http://localhost:${port}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${port}/`);
  });
}

startServer();
