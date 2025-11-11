import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const mockTokenData = [
  { date: '01.11', tokens: 45000, users: 120 },
  { date: '02.11', tokens: 52000, users: 135 },
  { date: '03.11', tokens: 48000, users: 128 },
  { date: '04.11', tokens: 61000, users: 145 },
  { date: '05.11', tokens: 58000, users: 142 },
  { date: '06.11', tokens: 67000, users: 158 },
  { date: '07.11', tokens: 73000, users: 165 },
];

const mockDialogs = [
  { id: 1, user: 'Алексей М.', date: '07.11.2025 14:32', tokens: 1250, model: 'GPT-4', status: 'Активный', premium: true },
  { id: 2, user: 'Мария К.', date: '07.11.2025 13:15', tokens: 890, model: 'GPT-3.5', status: 'Активный', premium: false },
  { id: 3, user: 'Дмитрий Л.', date: '07.11.2025 12:08', tokens: 2340, model: 'GPT-4', status: 'Активный', premium: true },
  { id: 4, user: 'Елена В.', date: '06.11.2025 18:45', tokens: 670, model: 'GPT-3.5', status: 'Завершён', premium: false },
  { id: 5, user: 'Иван П.', date: '06.11.2025 16:22', tokens: 1890, model: 'GPT-4', status: 'Завершён', premium: true },
  { id: 6, user: 'Ольга Н.', date: '06.11.2025 15:10', tokens: 540, model: 'GPT-3.5', status: 'Завершён', premium: false },
];

const mockUsers = [
  { id: 1, name: 'Алексей М.', email: 'alexey@example.com', totalTokens: 45600, dialogs: 23, premium: true, lastActive: '07.11.2025' },
  { id: 2, name: 'Мария К.', email: 'maria@example.com', totalTokens: 12400, dialogs: 8, premium: false, lastActive: '07.11.2025' },
  { id: 3, name: 'Дмитрий Л.', email: 'dmitry@example.com', totalTokens: 67800, dialogs: 34, premium: true, lastActive: '07.11.2025' },
  { id: 4, name: 'Елена В.', email: 'elena@example.com', totalTokens: 8900, dialogs: 6, premium: false, lastActive: '06.11.2025' },
];

const modelDistribution = [
  { name: 'GPT-4', value: 65, color: '#8B5CF6' },
  { name: 'GPT-3.5', value: 35, color: '#D946EF' },
];

const API_URL = 'https://functions.poehali.dev/228157e5-9d7c-4162-b7f6-c007b6c5fd8d';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModel, setFilterModel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalytics();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAnalytics();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchAnalytics = async () => {
    try {
      if (!analyticsData) setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      setAnalyticsData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const dialogs = analyticsData?.dialogs || [];
  const users = analyticsData?.users || [];
  const tokenStats = analyticsData?.tokenStats || [];
  const modelDistribution = analyticsData?.modelDistribution || [];
  const summary = analyticsData?.summary || { totalUsers: 0, premiumUsers: 0, activeDialogs: 0, totalTokens: 0 };

  const filteredDialogs = dialogs.filter((dialog: any) => {
    const matchesSearch = dialog.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModel = filterModel === 'all' || dialog.model === filterModel;
    const matchesStatus = filterStatus === 'all' || dialog.status === filterStatus;
    return matchesSearch && matchesModel && matchesStatus;
  });

  const exportToCSV = () => {
    const csv = [
      ['Пользователь', 'Дата', 'Токены', 'Модель', 'Статус', 'Премиум'],
      ...filteredDialogs.map(d => [d.user, d.date, d.tokens, d.model, d.status, d.premium ? 'Да' : 'Нет'])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dialogs_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
        <div className="mb-4 sm:mb-8 animate-fade-in">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Панель управления AI-советником
              </h1>
              <p className="text-muted-foreground text-sm sm:text-lg">Мониторинг диалогов и расхода токенов</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex-1 sm:flex-none ${autoRefresh ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}
                >
                  <Icon name={autoRefresh ? 'Pause' : 'Play'} className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{autoRefresh ? 'Авто' : 'Пауза'}</span>
                  <Icon name={autoRefresh ? 'Pause' : 'Play'} className="h-4 w-4 sm:hidden" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAnalytics}
                  className="flex-1 sm:flex-none"
                >
                  <Icon name="RefreshCw" className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Обновить</span>
                </Button>
              </div>
              {lastUpdate && (
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-1 shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4">
              <Icon name="LayoutDashboard" className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Дашборд</span>
            </TabsTrigger>
            <TabsTrigger value="dialogs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4">
              <Icon name="MessageSquare" className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Диалоги</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4">
              <Icon name="Users" className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Польз.</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4">
              <Icon name="TrendingUp" className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 animate-fade-in">
              <Card className="p-3 sm:p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-lg hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <p className="text-xs sm:text-sm font-medium opacity-90">Токенов</p>
                  <Icon name="Zap" className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </div>
                <div className="text-xl sm:text-3xl font-bold">{(summary.totalTokens / 1000).toFixed(0)}K</div>
                <p className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">использовано</p>
              </Card>

              <Card className="p-3 sm:p-6 bg-gradient-to-br from-pink-500 to-pink-700 text-white border-0 shadow-lg hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <p className="text-xs sm:text-sm font-medium opacity-90">Диалогов</p>
                  <Icon name="MessageCircle" className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </div>
                <div className="text-xl sm:text-3xl font-bold">{summary.activeDialogs}</div>
                <p className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">активных</p>
              </Card>

              <Card className="p-3 sm:p-6 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-lg hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <p className="text-xs sm:text-sm font-medium opacity-90">Пользов.</p>
                  <Icon name="Users" className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </div>
                <div className="text-xl sm:text-3xl font-bold">{summary.totalUsers}</div>
                <p className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">всего</p>
              </Card>

              <Card className="p-3 sm:p-6 bg-gradient-to-br from-orange-500 to-orange-700 text-white border-0 shadow-lg hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <p className="text-xs sm:text-sm font-medium opacity-90">Премиум</p>
                  <Icon name="Crown" className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </div>
                <div className="text-xl sm:text-3xl font-bold">{summary.premiumUsers}</div>
                <p className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">{summary.totalUsers > 0 ? Math.round((summary.premiumUsers / summary.totalUsers) * 100) : 0}%</p>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4 sm:p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
                <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                  <Icon name="TrendingUp" className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  Расход токенов
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={tokenStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Line type="monotone" dataKey="total_tokens" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4 sm:p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
                <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                  <Icon name="Users" className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                  Активность
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tokenStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Bar dataKey="active_users" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D946EF" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dialogs" className="space-y-4 animate-fade-in">
            <Card className="p-3 sm:p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по пользователю..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <Select value={filterModel} onValueChange={setFilterModel}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-white">
                    <SelectValue placeholder="Модель" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все модели</SelectItem>
                    <SelectItem value="GPT-4">GPT-4</SelectItem>
                    <SelectItem value="GPT-3.5">GPT-3.5</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-white">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="Активный">Активный</SelectItem>
                    <SelectItem value="Завершён">Завершён</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportToCSV} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto">
                  <Icon name="Download" className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Экспорт</span>
                  <Icon name="Download" className="h-4 w-4 sm:hidden" />
                </Button>
              </div>

              <div className="rounded-lg border bg-white overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <TableHead className="font-semibold text-xs sm:text-sm">Польз.</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Дата</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Ток.</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Мод.</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Статус</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDialogs.map((dialog: any) => (
                      <TableRow key={dialog.id} className="hover:bg-purple-50/50 transition-colors">
                        <TableCell className="font-medium text-xs sm:text-sm">{dialog.user}</TableCell>
                        <TableCell className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">{dialog.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 text-xs">
                            {(dialog.tokens / 1000).toFixed(1)}K
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${dialog.model === 'GPT-4' ? 'bg-purple-600' : 'bg-pink-600'}`}>
                            {dialog.model === 'GPT-4' ? '4' : '3.5'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={dialog.status === 'Активный' ? 'default' : 'secondary'} className="text-xs">
                            {dialog.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {dialog.premium && <Icon name="Crown" className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 animate-fade-in">
            <Card className="p-3 sm:p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">Список пользователей</h3>
              <div className="rounded-lg border bg-white overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <TableHead className="font-semibold text-xs sm:text-sm">Имя</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">Email</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Ток.</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Диал.</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Статус</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Активн.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id} className="hover:bg-purple-50/50 transition-colors">
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="truncate max-w-[80px] sm:max-w-none">{user.name}</span>
                            {user.premium && <Icon name="Crown" className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">{user.email || 'Не указан'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 text-xs">
                            {(user.total_tokens / 1000).toFixed(0)}K
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{user.dialogs_count}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={`text-xs ${user.premium ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gray-500'}`}>
                            {user.premium ? 'Прем.' : 'Баз.'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">{user.lastActive}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4 sm:p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                  <Icon name="PieChart" className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Модели
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={modelDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {modelDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'GPT-4' ? '#8B5CF6' : '#D946EF'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4 sm:p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                  <Icon name="BarChart3" className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Топ пользователей
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {[...users].sort((a: any, b: any) => b.total_tokens - a.total_tokens).slice(0, 5).map((user: any, index: number) => (
                    <div key={user.id} className="flex items-center gap-2 sm:gap-4">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-base ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        'bg-gradient-to-r from-purple-400 to-pink-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-medium text-xs sm:text-sm truncate">{user.name}</span>
                          {user.premium && <Icon name="Crown" className="h-3 w-3 text-orange-500 flex-shrink-0" />}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5 sm:h-2 rounded-full transition-all"
                            style={{ width: `${users.length > 0 ? Math.min((user.total_tokens / Math.max(...users.map((u: any) => u.total_tokens), 1)) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-semibold text-purple-600 text-xs sm:text-base whitespace-nowrap">{(user.total_tokens / 1000).toFixed(0)}K</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;