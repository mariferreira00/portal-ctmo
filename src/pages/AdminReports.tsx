import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell 
} from "recharts";
import { 
  DollarSign, TrendingUp, TrendingDown, Users, 
  AlertCircle, CheckCircle2, ArrowLeft, Calendar 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBrasiliaTime } from "@/lib/timezone";

interface FinancialSummary {
  total_monthly_revenue: number;
  active_students: number;
  potential_defaulters: number;
  avg_monthly_fee: number;
}

interface ClassPerformance {
  class_name: string;
  total_students: number;
  avg_attendance_rate: number;
  weekly_attendance_rate: number;
  total_checkins: number;
  weekly_checkins: number;
  instructor_name: string;
}

interface RetentionData {
  month: string;
  new_students: number;
  active_students: number;
  inactive_students: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const AdminReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    total_monthly_revenue: 0,
    active_students: 0,
    potential_defaulters: 0,
    avg_monthly_fee: 0
  });
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionData[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminReports();
  }, []);

  async function fetchAdminReports() {
    try {
      // Financial Summary - excluir alunos em turmas gratuitas
      const { data: students } = await supabase
        .from("students")
        .select("id, monthly_fee, payment_due_day, created_at")
        .eq("active", true);

      // Buscar turmas gratuitas
      const { data: freeClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("is_free", true);

      const freeClassIds = freeClasses?.map(c => c.id) || [];

      // Buscar matrículas em turmas gratuitas
      const { data: freeEnrollments } = await supabase
        .from("class_enrollments")
        .select("student_id")
        .in("class_id", freeClassIds);

      const freeStudentIds = new Set(freeEnrollments?.map(e => e.student_id) || []);

      // Filtrar apenas alunos que não estão em turmas gratuitas
      const paidStudents = students?.filter(s => !freeStudentIds.has(s.id)) || [];

      if (paidStudents.length > 0) {
        const totalRevenue = paidStudents.reduce((sum, s) => sum + Number(s.monthly_fee), 0);
        const avgFee = totalRevenue / paidStudents.length;
        
        // Calculate potential defaulters (students with payment due in next 7 days) - excluir turmas gratuitas
        const today = getBrasiliaTime().getDate();
        const potentialDefaulters = paidStudents.filter(s => {
          if (!s.payment_due_day) return false;
          const daysUntilDue = s.payment_due_day - today;
          return daysUntilDue >= 0 && daysUntilDue <= 7;
        }).length;

        setFinancialSummary({
          total_monthly_revenue: totalRevenue,
          active_students: paidStudents.length,
          potential_defaulters: potentialDefaulters,
          avg_monthly_fee: avgFee
        });
      } else {
        setFinancialSummary({
          total_monthly_revenue: 0,
          active_students: 0,
          potential_defaulters: 0,
          avg_monthly_fee: 0
        });
      }

      // Class Performance
      const { data: classes } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          teacher_id,
          teachers (
            full_name
          )
        `)
        .eq("active", true);

      if (classes) {
        const performanceData: ClassPerformance[] = [];
        
        for (const classItem of classes) {
          // Get enrollments
          const { data: enrollments } = await supabase
            .from("class_enrollments")
            .select("student_id")
            .eq("class_id", classItem.id);

          const totalStudents = enrollments?.length || 0;

          // Get check-ins for last 30 days (monthly)
          const thirtyDaysAgo = getBrasiliaTime();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: checkinsMonthly } = await supabase
            .from("attendance")
            .select("student_id")
            .eq("class_id", classItem.id)
            .gte("checked_in_at", thirtyDaysAgo.toISOString());

          const totalCheckinsMonthly = checkinsMonthly?.length || 0;
          
          // Get check-ins for last 7 days (weekly)
          const sevenDaysAgo = getBrasiliaTime();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: checkinsWeekly } = await supabase
            .from("attendance")
            .select("student_id")
            .eq("class_id", classItem.id)
            .gte("checked_in_at", sevenDaysAgo.toISOString());

          const totalCheckinsWeekly = checkinsWeekly?.length || 0;
          
          // Calculate attendance rates based on enrolled students only
          // Monthly: 10 treinos esperados por aluno/mês
          // Weekly: 2.5 treinos esperados por aluno/semana (10/4)
          const expectedCheckinsMonthly = totalStudents * 10;
          const expectedCheckinsWeekly = totalStudents * 2.5;
          
          const monthlyAttendanceRate = expectedCheckinsMonthly > 0 
            ? (totalCheckinsMonthly / expectedCheckinsMonthly) * 100 
            : 0;
            
          const weeklyAttendanceRate = expectedCheckinsWeekly > 0 
            ? (totalCheckinsWeekly / expectedCheckinsWeekly) * 100 
            : 0;

          performanceData.push({
            class_name: classItem.name,
            total_students: totalStudents,
            avg_attendance_rate: Math.round(monthlyAttendanceRate),
            weekly_attendance_rate: Math.round(weeklyAttendanceRate),
            total_checkins: totalCheckinsMonthly,
            weekly_checkins: totalCheckinsWeekly,
            instructor_name: (classItem.teachers as any)?.full_name || "N/A"
          });
        }

        setClassPerformance(performanceData.sort((a, b) => b.total_checkins - a.total_checkins));
      }

      // Retention Data (last 6 months)
      const retentionDataArray: RetentionData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = getBrasiliaTime();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        // New students this month
        const { data: newStudents } = await supabase
          .from("students")
          .select("id")
          .gte("created_at", monthStart.toISOString())
          .lt("created_at", monthEnd.toISOString());

        // Active students (checked in at least once this month)
        const { data: activeStudents } = await supabase
          .from("attendance")
          .select("student_id")
          .gte("checked_in_at", monthStart.toISOString())
          .lt("checked_in_at", monthEnd.toISOString());

        const uniqueActive = new Set(activeStudents?.map(a => a.student_id)).size;

        // Total students at end of month
        const { data: totalStudents } = await supabase
          .from("students")
          .select("id")
          .eq("active", true)
          .lt("created_at", monthEnd.toISOString());

        const inactiveStudents = (totalStudents?.length || 0) - uniqueActive;

        retentionDataArray.push({
          month: monthStart.toLocaleDateString("pt-BR", { month: "short" }),
          new_students: newStudents?.length || 0,
          active_students: uniqueActive,
          inactive_students: inactiveStudents
        });
      }

      setRetentionData(retentionDataArray);

      // Engagement distribution
      const { data: allStudents } = await supabase
        .from("students")
        .select("id")
        .eq("active", true);

      const thirtyDaysAgo = getBrasiliaTime();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let veryActive = 0;
      let active = 0;
      let moderate = 0;
      let lowActivity = 0;

      for (const student of allStudents || []) {
        const { data: checkins } = await supabase
          .from("attendance")
          .select("id")
          .eq("student_id", student.id)
          .gte("checked_in_at", thirtyDaysAgo.toISOString());

        const count = checkins?.length || 0;
        if (count >= 12) veryActive++;
        else if (count >= 8) active++;
        else if (count >= 4) moderate++;
        else lowActivity++;
      }

      setEngagementData([
        { name: "Muito Ativo (12+)", value: veryActive, color: COLORS[0] },
        { name: "Ativo (8-11)", value: active, color: COLORS[1] },
        { name: "Moderado (4-7)", value: moderate, color: COLORS[2] },
        { name: "Baixo (<4)", value: lowActivity, color: COLORS[3] }
      ]);

    } catch (error) {
      console.error("Error fetching admin reports:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Relatórios Administrativos</h1>
          <p className="text-muted-foreground">Visão completa de finanças, desempenho e retenção</p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita Mensal</p>
              <h3 className="text-2xl font-bold">
                R$ {financialSummary.total_monthly_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alunos Ativos</p>
              <h3 className="text-2xl font-bold">{financialSummary.active_students}</h3>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mensalidade Média</p>
              <h3 className="text-2xl font-bold">
                R$ {financialSummary.avg_monthly_fee.toFixed(2)}
              </h3>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 border-amber-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vencimentos (7 dias)</p>
              <h3 className="text-2xl font-bold text-amber-500">
                {financialSummary.potential_defaulters}
              </h3>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </Card>
      </div>

      {/* Retention Trend */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Tendência de Retenção (6 meses)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="new_students" 
              stroke="hsl(var(--chart-1))" 
              name="Novos Alunos"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="active_students" 
              stroke="hsl(var(--chart-2))" 
              name="Alunos Ativos"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="inactive_students" 
              stroke="hsl(var(--chart-3))" 
              name="Inativos"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Distribuição de Engajamento (30 dias)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {engagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total de Alunos:</span>
              <span className="font-semibold">
                {engagementData.reduce((sum, e) => sum + e.value, 0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Class Performance Ranking */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance por Turma</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {classPerformance.map((cls, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{cls.class_name}</h3>
                  <div className="flex gap-2">
                    <Badge variant={cls.weekly_attendance_rate >= 70 ? 'default' : 'secondary'}>
                      Sem: {cls.weekly_attendance_rate}%
                    </Badge>
                    <Badge variant={cls.avg_attendance_rate >= 70 ? 'default' : 'secondary'}>
                      Mês: {cls.avg_attendance_rate}%
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Instrutor: {cls.instructor_name}</p>
                  <p>Alunos: {cls.total_students}</p>
                  <p>Check-ins: {cls.weekly_checkins} (7d) • {cls.total_checkins} (30d)</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-primary mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Insights e Recomendações</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Receita mensal:</strong> R$ {financialSummary.total_monthly_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} com {financialSummary.active_students} alunos ativos</li>
              <li>• <strong>Atenção:</strong> {financialSummary.potential_defaulters} pagamentos vencem nos próximos 7 dias - considere enviar lembretes</li>
              <li>• <strong>Top turma:</strong> {classPerformance[0]?.class_name} com {classPerformance[0]?.total_checkins} check-ins</li>
              <li>• <strong>Retenção:</strong> {retentionData[retentionData.length - 1]?.new_students} novos alunos no último mês</li>
              <li>• <strong>Engajamento:</strong> {engagementData[3]?.value} alunos com baixa atividade - podem precisar de incentivo</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminReports;
