
"use client"

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ListTodo, 
  BrainCircuit, 
  User, 
  Bell, 
  Plus, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Circle,
  MoreVertical,
  Trash2,
  LayoutDashboard,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

import { Task, Appointment, UserProfile, Priority, TaskStatus, ScheduleEvent } from '@/types/dashboard';
import { aiPoweredTaskPrioritization } from '@/ai/flows/ai-powered-task-prioritization';
import { generateOptimizedSchedule } from '@/ai/flows/intelligent-schedule-generation';
import { smartRemindersAndNotifications } from '@/ai/flows/smart-reminders-and-notifications';

const INITIAL_TASKS: Task[] = [
  { id: '1', name: 'Design System Update', description: 'Update tokens for ChronoMind brand refresh', deadline: '2025-06-15', priority: 'high', status: 'in_progress', category: 'Design' },
  { id: '2', name: 'Security Audit', description: 'Review authentication flows', deadline: '2025-06-12', priority: 'critical', status: 'todo', category: 'Dev' },
  { id: '3', name: 'Team Sync', description: 'Weekly alignment meeting', deadline: '2025-06-11', priority: 'medium', status: 'completed', category: 'Admin' },
  { id: '4', name: 'Content Strategy', description: 'Draft blog posts for Q3', deadline: '2025-06-20', priority: 'low', status: 'todo', category: 'Marketing' },
];

const INITIAL_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  email: 'alex@chronomind.ai',
  avatar: 'https://picsum.photos/seed/user88/200/200',
  goals: ['Optimize daily workflow', 'Improve deep work consistency', 'Reduce meeting overload'],
  preferences: {
    focusOnHighImpact: true,
    workHoursPerDay: 8,
    avoidOverwhelm: true,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    breakDurationMinutes: 15,
  }
};

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'a1', description: 'Investor Pitch', startTime: '10:00', endTime: '11:00', date: '2025-06-11' },
  { id: 'a2', description: 'Lunch Break', startTime: '12:00', endTime: '13:00', date: '2025-06-11' },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [appointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const { toast } = useToast();

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      deadline: formData.get('deadline') as string,
      priority: formData.get('priority') as Priority,
      status: 'todo',
      category: formData.get('category') as string,
    };
    setTasks([...tasks, newTask]);
    toast({ title: "Task added", description: `${newTask.name} has been created.` });
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'todo' : 'completed' } : t));
  };

  const runAiPrioritization = async () => {
    setIsAiProcessing(true);
    try {
      const result = await aiPoweredTaskPrioritization({
        tasks: tasks.map(t => ({ 
          id: t.id, 
          name: t.name, 
          description: t.description, 
          deadline: t.deadline, 
          currentPriority: t.priority as any, 
          category: t.category 
        })),
        goals: profile.goals,
        userPreferences: {
          focusOnHighImpact: profile.preferences.focusOnHighImpact,
          workHoursPerDay: profile.preferences.workHoursPerDay,
          avoidOverwhelm: profile.preferences.avoidOverwhelm
        }
      });

      const prioritized = [...tasks].sort((a, b) => {
        return result.prioritizedTaskIds.indexOf(a.id) - result.prioritizedTaskIds.indexOf(b.id);
      });

      setTasks(prioritized);
      toast({ title: "AI Prioritization Complete", description: result.reasoning });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to prioritize tasks." });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const runScheduleGeneration = async () => {
    setIsAiProcessing(true);
    try {
      const result = await generateOptimizedSchedule({
        currentDate: new Date().toISOString().split('T')[0],
        tasks: tasks.filter(t => t.status !== 'completed').map(t => ({
          description: t.name,
          durationMinutes: 60, // Default estimate
          deadline: t.deadline
        })),
        appointments: appointments.map(a => ({
          description: a.description,
          startTime: a.startTime,
          endTime: a.endTime
        })),
        preferences: {
          workingHoursStart: profile.preferences.workingHoursStart,
          workingHoursEnd: profile.preferences.workingHoursEnd,
          breakDurationMinutes: profile.preferences.breakDurationMinutes,
          importanceRanking: tasks.reduce((acc, t, idx) => ({ ...acc, [t.name]: idx + 1 }), {})
        }
      });
      setSchedule(result.schedule);
      toast({ title: "Schedule Generated", description: result.notes });
      setActiveTab('calendar');
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate schedule." });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const runNotifications = async () => {
    try {
      const result = await smartRemindersAndNotifications({
        tasks: tasks.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          deadline: new Date(t.deadline).toISOString(),
          priority: (t.priority === 'critical' ? 'high' : t.priority) as any,
          status: t.status === 'in_progress' ? 'in_progress' : t.status === 'completed' ? 'completed' : 'todo'
        })),
        schedule: appointments.map(a => ({
          id: a.id,
          title: a.description,
          start: `${a.date}T${a.startTime}:00Z`,
          end: `${a.date}T${a.endTime}:00Z`,
          allDay: false
        })),
        userPreferences: {
          notificationTimeBeforeDeadlineHours: 24,
          conflictWarningThresholdMinutes: 15,
          preferredNotificationStyle: 'detailed',
          goals: profile.goals
        }
      });
      setNotifications(result.notifications);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    runNotifications();
  }, [tasks]);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'critical': return 'text-destructive border-destructive bg-destructive/10';
      case 'high': return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'medium': return 'text-primary border-primary bg-primary/10';
      case 'low': return 'text-muted-foreground border-muted-foreground bg-muted/10';
      default: return '';
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-body">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
            <div className="p-1.5 bg-primary rounded-lg text-primary-foreground">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span>ChronoMind AI</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <Button variant={activeTab === 'tasks' ? 'secondary' : 'ghost'} className="w-full justify-start gap-3" onClick={() => setActiveTab('tasks')}>
            <ListTodo className="w-4 h-4" /> Tasks
          </Button>
          <Button variant={activeTab === 'calendar' ? 'secondary' : 'ghost'} className="w-full justify-start gap-3" onClick={() => setActiveTab('calendar')}>
            <CalendarIcon className="w-4 h-4" /> Calendar
          </Button>
          <Button variant={activeTab === 'profile' ? 'secondary' : 'ghost'} className="w-full justify-start gap-3" onClick={() => setActiveTab('profile')}>
            <User className="w-4 h-4" /> Profile
          </Button>
        </nav>

        <div className="p-4 mt-auto">
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-4 relative">
              <Sparkles className="absolute top-2 right-2 w-4 h-4 opacity-50" />
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">AI Usage</p>
              <p className="text-sm font-medium mb-3">85% Productivity Score</p>
              <Progress value={85} className="h-1 bg-white/20" />
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold capitalize">{activeTab}</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search everything..." className="pl-9 w-64 h-9" />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-card" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  <div className="space-y-4">
                    {notifications.length > 0 ? notifications.map((n, i) => (
                      <div key={i} className="flex gap-4 p-3 rounded-lg border bg-muted/30">
                        <div className="mt-1">
                          {n.type === 'conflict' ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <ShieldCheck className="w-4 h-4 text-accent" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No new notifications
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Avatar className="h-9 w-9 border">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{profile.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto">
          {activeTab === 'tasks' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Your Tasks</h2>
                  <p className="text-muted-foreground">Manage and prioritize your daily work with AI support.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> New Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleAddTask}>
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Task Name</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="deadline">Deadline</Label>
                              <Input id="deadline" name="deadline" type="date" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="priority">Priority</Label>
                              <select id="priority" name="priority" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Task</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5" onClick={runAiPrioritization} disabled={isAiProcessing}>
                    <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} /> AI Prioritize
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold">Active Tasks</CardTitle>
                    <Badge variant="secondary">{tasks.filter(t => t.status !== 'completed').length} Pending</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <div className="divide-y">
                        {tasks.map((task) => (
                          <div key={task.id} className="group flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                            <button 
                              onClick={() => toggleTaskStatus(task.id)}
                              className="mt-1 transition-transform active:scale-90"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-accent fill-accent/10" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-medium text-sm leading-none truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.name}
                                </h4>
                                <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 font-normal ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                  <Clock className="w-3 h-3" /> Due {new Date(task.deadline).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{task.category}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-primary text-primary-foreground border-none">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5" /> Smart Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-white/10 rounded-lg text-sm">
                        <p className="opacity-90">Based on your focus goals, you should tackle <span className="font-bold underline">Security Audit</span> first today.</p>
                      </div>
                      <Button variant="secondary" className="w-full gap-2" onClick={runScheduleGeneration} disabled={isAiProcessing}>
                        <Clock className="w-4 h-4" /> Generate Schedule
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Productivity Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Weekly Completion Rate</span>
                        <span className="font-bold">72%</span>
                      </div>
                      <Progress value={72} className="h-2" />
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 rounded-lg bg-muted/50 border">
                          <p className="text-2xl font-bold">14</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Completed</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50 border">
                          <p className="text-2xl font-bold">4</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Overdue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Your Schedule</h2>
                  <p className="text-muted-foreground">AI-optimized planning for your day.</p>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="outline" className="gap-2" onClick={runScheduleGeneration} disabled={isAiProcessing}>
                    <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} /> Regnerate Day
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <Card className="lg:col-span-3">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle>Daily Timeline</CardTitle>
                      <div className="flex items-center gap-1 border rounded-md p-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Day</Button>
                        <Button variant="secondary" size="sm" className="h-7 px-2 text-xs">Week</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Month</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative h-[600px] overflow-auto">
                      <div className="absolute left-0 top-0 bottom-0 w-16 border-r bg-muted/20 flex flex-col pt-4">
                        {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => (
                          <div key={hour} className="h-20 text-[10px] text-center font-bold text-muted-foreground border-b flex items-center justify-center">
                            {hour}:00
                          </div>
                        ))}
                      </div>
                      <div className="ml-16 relative min-h-full p-4 space-y-2">
                        {schedule.length > 0 ? schedule.map((item, idx) => {
                          const startHour = parseInt(item.startTime.split(':')[0]);
                          const startMin = parseInt(item.startTime.split(':')[1]);
                          const top = (startHour - 8) * 80 + (startMin / 60) * 80;
                          
                          return (
                            <div 
                              key={idx} 
                              className="bg-accent/20 border-l-4 border-accent p-3 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-sm">{item.description}</h4>
                                <span className="text-[10px] font-bold text-accent-foreground/60">{item.startTime} - {item.endTime}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 opacity-80 group-hover:opacity-100">AI Planned Slot</p>
                            </div>
                          );
                        }) : (
                          <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                            <div className="p-4 bg-muted rounded-full">
                              <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold">No schedule generated yet</p>
                              <p className="text-sm text-muted-foreground">Click regenerate to have AI plan your day</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fixed Appointments</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {appointments.map(a => (
                          <div key={a.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <div>
                                <h5 className="text-sm font-semibold">{a.description}</h5>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">{a.startTime} • Today</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex items-end gap-6 pb-6 border-b">
                <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>{profile.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-1">
                  <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
                <Button>Edit Profile</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Goals</h3>
                    <div className="space-y-3">
                      {profile.goals.map((goal, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium">{goal}</span>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full border-dashed border-2 hover:bg-muted/50">
                        <Plus className="w-4 h-4 mr-2" /> Add Goal
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">AI Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>High Impact Focus</Label>
                        <p className="text-xs text-muted-foreground">AI prioritizes tasks with higher ROI.</p>
                      </div>
                      <Switch 
                        checked={profile.preferences.focusOnHighImpact} 
                        onCheckedChange={(val) => setProfile({ ...profile, preferences: { ...profile.preferences, focusOnHighImpact: val } })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Avoid Overwhelm</Label>
                        <p className="text-xs text-muted-foreground">Spread high-stress tasks across the week.</p>
                      </div>
                      <Switch 
                        checked={profile.preferences.avoidOverwhelm}
                        onCheckedChange={(val) => setProfile({ ...profile, preferences: { ...profile.preferences, avoidOverwhelm: val } })}
                      />
                    </div>
                    <Separator />
                    <div className="grid gap-2">
                      <Label>Preferred Working Hours</Label>
                      <div className="flex items-center gap-2">
                        <Input type="time" value={profile.preferences.workingHoursStart} className="w-32" />
                        <span className="text-muted-foreground">to</span>
                        <Input type="time" value={profile.preferences.workingHoursEnd} className="w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl">
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-4 z-50">
        <Button variant="ghost" size="icon" onClick={() => setActiveTab('tasks')} className={activeTab === 'tasks' ? 'text-primary' : ''}>
          <ListTodo className="w-6 h-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveTab('calendar')} className={activeTab === 'calendar' ? 'text-primary' : ''}>
          <CalendarIcon className="w-6 h-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-primary' : ''}>
          <User className="w-6 h-6" />
        </Button>
      </nav>
    </div>
  );
}
