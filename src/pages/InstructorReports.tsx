import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, Cell 
} from "recharts";
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Users, Activity, ArrowLeft 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudentStats {
  id: string;
  name: string;
  avatar_url: string | null;
  total_checkins: number;
  total_posts: number;
  last_checkin: string | null;
  days_since_checkin: number | null;
  attendance_rate: number;
  risk_level: 'low' | 'medium' | 'high';
}

interface ClassStats {
  class_name: string;
  total_students: number;
  avg_attendance: number;
  active_students: number;
}

const InstructorReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  async function fetchReports() {
    try {
      // Get teacher ID
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!teacherData) {
        setLoading(false);
        return;
      }

      // Get instructor's classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", teacherData.id)
        .eq("active", true);

      if (!classes || classes.length === 0) {
        setLoading(false);
        return;
      }

      const classIds = classes.map(c => c.id);

      // Get all students enrolled in instructor's classes
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select(`
          student_id,
          class_id,
          students (
            id,
            full_name,
            avatar_url
          )
        `)
        .in("class_id", classIds);

      // Calculate stats for each student
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats: StudentStats[] = [];
      const classStatsMap = new Map<string, { total: number; attendances: number[] }>();

      for (const enrollment of enrollments || []) {
        const studentId = enrollment.student_id;
        const student = enrollment.students as any;

        // Get check-ins for last 30 days
        const { data: checkins } = await supabase
          .from("attendance")
          .select("checked_in_at, class_id")
          .eq("student_id", studentId)
          .in("class_id", classIds)
          .gte("checked_in_at", thirtyDaysAgo.toISOString())
          .order("checked_in_at", { ascending: false });

        // Get training posts
        const { data: posts } = await supabase
          .from("training_posts")
          .select("id")
          .eq("student_id", studentId)
          .gte("training_date", thirtyDaysAgo.toISOString().split('T')[0]);

        const totalCheckins = checkins?.length || 0;
        const totalPosts = posts?.length || 0;
        const lastCheckin = checkins?.[0]?.checked_in_at || null;
        
        let daysSinceCheckin = null;
        if (lastCheckin) {
          const diffTime = Math.abs(new Date().getTime() - new Date(lastCheckin).getTime());
          daysSinceCheckin = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Calculate attendance rate (assuming 12 possible training days in 30 days)
        const attendanceRate = (totalCheckins / 12) * 100;

        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (daysSinceCheckin === null || daysSinceCheckin > 14) {
          riskLevel = 'high';
        } else if (daysSinceCheckin > 7 || attendanceRate < 50) {
          riskLevel = 'medium';
        }

        stats.push({
          id: student.id,
          name: student.full_name,
          avatar_url: student.avatar_url,
          total_checkins: totalCheckins,
          total_posts: totalPosts,
          last_checkin: lastCheckin,
          days_since_checkin: daysSinceCheckin,
          attendance_rate: Math.round(attendanceRate),
          risk_level: riskLevel
        });

        // Update class stats
        const className = classes.find(c => c.id === enrollment.class_id)?.name || '';
        if (!classStatsMap.has(className)) {
          classStatsMap.set(className, { total: 0, attendances: [] });
        }
        const classData = classStatsMap.get(className)!;
        classData.total++;
        classData.attendances.push(totalCheckins);
      }

      // Calculate class statistics
      const classStatsArray: ClassStats[] = [];
      classStatsMap.forEach((data, className) => {
        const avgAttendance = data.attendances.reduce((a, b) => a + b, 0) / data.total;
        const activeStudents = data.attendances.filter(a => a >= 6).length;
        classStatsArray.push({
          class_name: className,
          total_students: data.total,
          avg_attendance: Math.round(avgAttendance * 10) / 10,
          active_students: activeStudents
        });
      });

      // Get weekly trend (last 8 weeks)
      const weeklyData = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { data: weekCheckins } = await supabase
          .from("attendance")
          .select("id")
          .in("class_id", classIds)
          .gte("checked_in_at", weekStart.toISOString())
          .lt("checked_in_at", weekEnd.toISOString());

        weeklyData.push({
          week: `Sem ${8 - i}`,
          checkins: weekCheckins?.length || 0
        });
      }

      setStudentStats(stats.sort((a, b) => b.total_checkins - a.total_checkins));
      setClassStats(classStatsArray);
      setWeeklyTrend(weeklyData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando relatórios...</div>;
  }

  const atRiskStudents = studentStats.filter(s => s.risk_level === 'high');
  const activeStudents = studentStats.filter(s => s.risk_level === 'low');
  const avgAttendanceRate = Math.round(
    studentStats.reduce((sum, s) => sum + s.attendance_rate, 0) / studentStats.length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/instructor-dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Insights</h1>
          <p className="text-muted-foreground">Análise detalhada do desempenho dos alunos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Alunos</p>
              <h3 className="text-3xl font-bold">{studentStats.length}</h3>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa Média de Frequência</p>
              <h3 className="text-3xl font-bold">{avgAttendanceRate}%</h3>
            </div>
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alunos Ativos</p>
              <h3 className="text-3xl font-bold text-green-500">{activeStudents.length}</h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alunos em Risco</p>
              <h3 className="text-3xl font-bold text-destructive">{atRiskStudents.length}</h3>
            </div>
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Tendência de Check-ins (8 semanas)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="checkins" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Check-ins"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Class Comparison */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Comparação entre Turmas</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="class_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_students" fill="hsl(var(--primary))" name="Total de Alunos" />
            <Bar dataKey="active_students" fill="hsl(var(--chart-2))" name="Alunos Ativos" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* At-Risk Students Alert */}
      {atRiskStudents.length > 0 && (
        <Card className="p-6 border-destructive">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <h2 className="text-xl font-semibold">Alunos que Precisam de Atenção</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Estes alunos têm baixa frequência ou não comparecem há mais de 14 dias. Considere entrar em contato.
          </p>
          <div className="space-y-3">
            {atRiskStudents.map(student => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt={student.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-primary font-bold">{student.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.days_since_checkin 
                        ? `Último check-in: ${student.days_since_checkin} dias atrás`
                        : 'Nunca fez check-in'}
                    </p>
                  </div>
                </div>
                <Badge variant="destructive">
                  {student.attendance_rate}% frequência
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Performers */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-green-500" />
          <h2 className="text-xl font-semibold">Melhores Desempenhos (30 dias)</h2>
        </div>
        <div className="space-y-3">
          {studentStats.slice(0, 10).map((student, index) => (
            <div key={student.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {index + 1}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {student.avatar_url ? (
                    <img src={student.avatar_url} alt={student.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-primary font-bold">{student.name[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.total_checkins} check-ins • {student.total_posts} posts
                  </p>
                </div>
              </div>
              <Badge variant={student.risk_level === 'low' ? 'default' : 'secondary'}>
                {student.attendance_rate}%
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default InstructorReports;
