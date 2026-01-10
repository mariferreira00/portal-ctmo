import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o assistente virtual da academia de artes marciais. Seu nome é Sensei AI.

Você ajuda alunos com dúvidas sobre:
- Horários de aulas e treinos
- Turmas disponíveis e matrículas
- Técnicas e fundamentos de artes marciais
- Preparação física e aquecimento
- Dicas de nutrição para praticantes
- Regras de competições
- Graduações e faixas
- Dicas para iniciantes
- Recuperação pós-treino

IMPORTANTE: Você tem acesso a informações reais da academia que serão fornecidas no contexto.
Use essas informações para responder perguntas sobre turmas, horários e matrículas.
Se o aluno perguntar sobre turmas ou horários, consulte os dados fornecidos no contexto.

Seja sempre educado, motivador e use terminologia adequada de artes marciais.
Responda em português brasileiro de forma clara e objetiva.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, studentId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client with service role to bypass RLS
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch academy data for context
    let academyContext = "";

    try {
      // Fetch all active classes with schedules
      const { data: classes, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          schedule,
          max_students,
          is_free,
          teachers (
            full_name
          ),
          subclasses (
            name,
            schedule,
            days_of_week,
            active
          )
        `)
        .eq("active", true)
        .order("name");

      if (classesError) {
        console.error("Error fetching classes:", classesError);
      }

      // Format classes info
      if (classes && classes.length > 0) {
        academyContext += "\n\n📋 TURMAS DISPONÍVEIS NA ACADEMIA:\n";
        
        for (const cls of classes) {
          const teachers = cls.teachers as any;
          const teacherName = Array.isArray(teachers) 
            ? (teachers[0]?.full_name || "Não definido")
            : (teachers?.full_name || "Não definido");
          academyContext += `\n🥋 ${cls.name}\n`;
          academyContext += `   Instrutor: ${teacherName}\n`;
          academyContext += `   Capacidade máxima: ${cls.max_students} alunos\n`;
          
          if (cls.is_free) {
            academyContext += `   ⭐ Turma gratuita (aula experimental)\n`;
          }
          
          // Add subclasses/schedules
          const activeSubclasses = cls.subclasses?.filter((s: any) => s.active) || [];
          if (activeSubclasses.length > 0) {
            academyContext += `   Horários:\n`;
            for (const sub of activeSubclasses) {
              const dayNames: Record<string, string> = {
                'monday': 'Segunda',
                'tuesday': 'Terça', 
                'wednesday': 'Quarta',
                'thursday': 'Quinta',
                'friday': 'Sexta',
                'saturday': 'Sábado',
                'sunday': 'Domingo',
                'segunda': 'Segunda',
                'terça': 'Terça',
                'quarta': 'Quarta',
                'quinta': 'Quinta',
                'sexta': 'Sexta',
                'sábado': 'Sábado',
                'domingo': 'Domingo'
              };
              const days = sub.days_of_week?.map((d: string) => dayNames[d.toLowerCase()] || d).join(', ') || '';
              academyContext += `     - ${sub.name}: ${days} às ${sub.schedule}\n`;
            }
          } else if (cls.schedule) {
            academyContext += `   Horário: ${cls.schedule}\n`;
          }
        }
      }

      // If we have a student ID, fetch their specific info
      if (studentId) {
        const { data: student } = await supabase
          .from("students")
          .select("full_name, weekly_goal")
          .eq("id", studentId)
          .single();

        if (student) {
          academyContext += `\n\n👤 INFORMAÇÕES DO ALUNO:\n`;
          academyContext += `Nome: ${student.full_name}\n`;
          academyContext += `Meta semanal: ${student.weekly_goal} treinos\n`;
        }

        // Fetch student enrollments
        const { data: enrollments } = await supabase
          .from("class_enrollments")
          .select(`
            classes (
              name,
              schedule,
              teachers (full_name)
            )
          `)
          .eq("student_id", studentId);

        if (enrollments && enrollments.length > 0) {
          academyContext += `\n📚 TURMAS MATRICULADAS:\n`;
          for (const enr of enrollments) {
            if (enr.classes) {
              const cls = enr.classes as any;
              academyContext += `- ${cls.name} (${cls.schedule || 'Horário não definido'})\n`;
            }
          }
        }

        // Fetch recent attendance count
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: attendance, count } = await supabase
          .from("attendance")
          .select("*", { count: "exact" })
          .eq("student_id", studentId)
          .gte("checked_in_at", sevenDaysAgo.toISOString());

        if (count !== null) {
          academyContext += `\n📊 Check-ins nos últimos 7 dias: ${count}\n`;
        }
      }

      // Fetch recent announcements
      const { data: announcements } = await supabase
        .from("announcements")
        .select("title, content, announcement_date")
        .eq("is_system", true)
        .order("announcement_date", { ascending: false })
        .limit(3);

      if (announcements && announcements.length > 0) {
        academyContext += `\n\n📢 AVISOS RECENTES:\n`;
        for (const ann of announcements) {
          academyContext += `- ${ann.title}: ${ann.content.substring(0, 100)}${ann.content.length > 100 ? '...' : ''}\n`;
        }
      }

    } catch (dbError) {
      console.error("Error fetching academy data:", dbError);
      academyContext = "\n\n(Não foi possível carregar dados da academia neste momento)";
    }

    // Build system prompt with context
    const fullSystemPrompt = SYSTEM_PROMPT + academyContext;

    console.log("Academy context loaded:", academyContext.length, "chars");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Por favor, aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
