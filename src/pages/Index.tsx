import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STORAGE_KEY = 'ai_advisor_data';

const getInitialData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  return {
    dialogs: [
      { id: 1, user: 'Алексей М.', username: 'alexey', telegram_id: 123456, date: '07.11.2025 14:32', tokens: 1250, model: 'GPT-4', status: 'Активный', premium: true, user_message: 'Как настроить аналитику?', assistant_message: 'Для настройки аналитики вам нужно...', interaction_type: 'question' },
      { id: 2, user: 'Мария К.', username: 'maria_k', telegram_id: 234567, date: '07.11.2025 13:15', tokens: 890, model: 'GPT-3.5', status: 'Активный', premium: false, user_message: 'Помоги с кодом', assistant_message: 'Конечно, вот пример...', interaction_type: 'code' },
      { id: 3, user: 'Дмитрий Л.', username: 'dmitry', telegram_id: 345678, date: '07.11.2025 12:08', tokens: 2340, model: 'GPT-4', status: 'Активный', premium: true, user_message: 'Объясни архитектуру', assistant_message: 'Архитектура состоит из...', interaction_type: 'explanation' },
      { id: 4, user: 'Елена В.', username: 'elena_v', telegram_id: 456789, date: '06.11.2025 18:45', tokens: 670, model: 'GPT-3.5', status: 'Завершён', premium: false, user_message: 'Простой вопрос', assistant_message: 'Ответ на ваш вопрос...', interaction_type: 'question' },
      { id: 5, user: 'Иван П.', username: 'ivan_p', telegram_id: 567890, date: '06.11.2025 16:22', tokens: 1890, model: 'GPT-4', status: 'Завершён', premium: true, user_message: 'Нужна помощь с проектом', assistant_message: 'Давайте разберем...', interaction_type: 'project' },
    ],
    users: [
      { id: 1, name: 'Алексей М.', username: 'alexey', telegram_id: 123456, email: 'alexey@example.com', total_tokens: 45600, dialogs_count: 23, premium: true, lastActive: '07.11.2025' },
      { id: 2, name: 'Мария К.', username: 'maria_k', telegram_id: 234567, email: 'maria@example.com', total_tokens: 12400, dialogs_count: 8, premium: false, lastActive: '07.11.2025' },
      { id: 3, name: 'Дмитрий Л.', username: 'dmitry', telegram_id: 345678, email: 'dmitry@example.com', total_tokens: 67800, dialogs_count: 34, premium: true, lastActive: '07.11.2025' },
      { id: 4, name: 'Елена В.', username: 'elena_v', telegram_id: 456789, email: 'elena@example.com', total_tokens: 8900, dialogs_count: 6, premium: false, lastActive: '06.11.2025' },
    ],
    tokenStats: [
      { date: '01.11', total_tokens: 45000, active_users: 120 },
      { date: '02.11', total_tokens: 52000, active_users: 135 },
      { date: '03.11', total_tokens: 48000, active_users: 128 },
      { date: '04.11', total_tokens: 61000, active_users: 145 },
      { date: '05.11', total_tokens: 58000, active_users: 142 },
      { date: '06.11', total_tokens: 67000, active_users: 158 },
      { date: '07.11', total_tokens: 73000, active_users: 165 },
    ],
    modelDistribution: [
      { name: 'GPT-4', value: 65, count: 850, color: '#8B5CF6' },
      { name: 'GPT-3.5', value: 35, count: 450, color: '#D946EF' },
    ],
    summary: {
      totalUsers: 4,
      premiumUsers: 2,
      activeDialogs: 3,
      totalTokens: 134700
    }
  };
};

const Index = () => {
  const [data, setData] = useState(getInitialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModel, setFilterModel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDialog, setSelectedDialog] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userHistoryOpen, setUserHistoryOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const filteredDialogs = data.dialogs.filter((dialog: any) => {
    const matchesSearch = dialog.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (dialog.username && dialog.username.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesModel = filterModel === 'all' || dialog.model === filterModel;
    const matchesStatus = filterStatus === 'all' || dialog.status === filterStatus;
    return matchesSearch && matchesModel && matchesStatus;
  });

  const exportToCSV = () => {
    const csv = [
      ['Пользователь', 'Username', 'Дата', 'Токены', 'Модель', 'Статус', 'Премиум', 'Вопрос', 'Ответ'],
      ...filteredDialogs.map(d => [
        d.user, 
        d.username || '', 
        d.date, 
        d.tokens, 
        d.model, 
        d.status, 
        d.premium ? 'Да' : 'Нет',
        d.user_message || '',
        d.assistant_message || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dialogs_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const openDialogDetails = (dialog: any) => {
    setSelectedDialog(dialog);
    setDialogOpen(true);
  };

  const openUserHistory = (user: any) => {
    setSelectedUser(user);
    setUserHistoryOpen(true);
  };

  const getUserHistory = () => {
    if (!selectedUser) return [];
    return data.dialogs.filter((d: any) => d.telegram_id === selectedUser.telegram_id);
  };

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
            <Badge variant="secondary" className="w-fit">
              <Icon name="Database" className="h-3 w-3 mr-1" />
              Локальное хранилище
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-8">
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium opacity-90">Всего пользователей</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{data.summary.totalUsers}</p>
              </div>
              <Icon name="Users" className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium opacity-90">Премиум</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{data.summary.premiumUsers}</p>
              </div>
              <Icon name="Crown" className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium opacity-90">Активных диалогов</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{data.summary.activeDialogs}</p>
              </div>
              <Icon name="MessageSquare" className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium opacity-90">Всего токенов</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{(data.summary.totalTokens / 1000).toFixed(1)}K</p>
              </div>
              <Icon name="Zap" className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <Icon name="BarChart3" className="h-4 w-4 mr-2" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="dialogs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <Icon name="MessageSquare" className="h-4 w-4 mr-2" />
              Диалоги
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <Icon name="Users" className="h-4 w-4 mr-2" />
              Пользователи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <Card className="p-4 sm:p-6 bg-white/50 backdrop-blur border-purple-200">
                <h3 className="text-base sm:text-lg font-semibold mb-4">Динамика токенов</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.tokenStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="total_tokens" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4 sm:p-6 bg-white/50 backdrop-blur border-pink-200">
                <h3 className="text-base sm:text-lg font-semibold mb-4">Активные пользователи</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.tokenStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Bar dataKey="active_users" fill="#D946EF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-4 sm:p-6 bg-white/50 backdrop-blur border-blue-200">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Распределение по моделям</h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.modelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.modelDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {data.modelDistribution.map((model: any) => (
                    <div key={model.name} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: model.color }} />
                      <span className="font-medium">{model.name}</span>
                      <Badge variant="secondary">{model.value}%</Badge>
                      <span className="text-sm text-muted-foreground">({model.count} диалогов)</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="dialogs" className="space-y-4">
            <Card className="p-4 sm:p-6 bg-white/50 backdrop-blur">
              <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
                <div className="relative flex-1">
                  <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени или username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterModel} onValueChange={setFilterModel}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Модель" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все модели</SelectItem>
                    <SelectItem value="GPT-4">GPT-4</SelectItem>
                    <SelectItem value="GPT-3.5">GPT-3.5</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="Активный">Активный</SelectItem>
                    <SelectItem value="Завершён">Завершён</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto">
                  <Icon name="Download" className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead className="hidden sm:table-cell">Username</TableHead>
                      <TableHead className="hidden md:table-cell">Дата</TableHead>
                      <TableHead>Токены</TableHead>
                      <TableHead className="hidden lg:table-cell">Модель</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="hidden xl:table-cell">Премиум</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDialogs.map((dialog: any) => (
                      <TableRow key={dialog.id} className="hover:bg-purple-50/50">
                        <TableCell className="font-medium">{dialog.user}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">@{dialog.username}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{dialog.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50">
                            <Icon name="Zap" className="h-3 w-3 mr-1" />
                            {dialog.tokens}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={dialog.model === 'GPT-4' ? 'default' : 'secondary'}>
                            {dialog.model}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={dialog.status === 'Активный' ? 'default' : 'secondary'}>
                            {dialog.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {dialog.premium && <Icon name="Crown" className="h-4 w-4 text-yellow-500" />}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialogDetails(dialog)}
                          >
                            <Icon name="Eye" className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="p-4 sm:p-6 bg-white/50 backdrop-blur">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead className="hidden sm:table-cell">Username</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Токены</TableHead>
                      <TableHead className="hidden lg:table-cell">Диалоги</TableHead>
                      <TableHead className="hidden xl:table-cell">Последняя активность</TableHead>
                      <TableHead>Премиум</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user: any) => (
                      <TableRow key={user.id} className="hover:bg-pink-50/50">
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">@{user.username}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50">
                            <Icon name="Zap" className="h-3 w-3 mr-1" />
                            {(user.total_tokens / 1000).toFixed(1)}K
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{user.dialogs_count}</TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{user.lastActive}</TableCell>
                        <TableCell>
                          {user.premium && <Icon name="Crown" className="h-5 w-5 text-yellow-500" />}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUserHistory(user)}
                          >
                            <Icon name="History" className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали диалога</DialogTitle>
            <DialogDescription>
              Информация о взаимодействии с пользователем
            </DialogDescription>
          </DialogHeader>
          {selectedDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Пользователь</p>
                  <p className="text-base font-semibold">{selectedDialog.user}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-base">@{selectedDialog.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата</p>
                  <p className="text-base">{selectedDialog.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Токены</p>
                  <Badge variant="outline" className="mt-1">
                    <Icon name="Zap" className="h-3 w-3 mr-1" />
                    {selectedDialog.tokens}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Модель</p>
                  <Badge className="mt-1">{selectedDialog.model}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Статус</p>
                  <Badge variant="secondary" className="mt-1">{selectedDialog.status}</Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Сообщение пользователя</p>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm">{selectedDialog.user_message}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Ответ ассистента</p>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm">{selectedDialog.assistant_message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={userHistoryOpen} onOpenChange={setUserHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>История диалогов пользователя</DialogTitle>
            <DialogDescription>
              {selectedUser && `Все диалоги пользователя ${selectedUser.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Всего токенов</p>
                    <p className="text-2xl font-bold">{(selectedUser.total_tokens / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Диалогов</p>
                    <p className="text-2xl font-bold">{selectedUser.dialogs_count}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Премиум</p>
                    <p className="text-2xl">{selectedUser.premium ? '👑' : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Последняя активность</p>
                    <p className="text-sm font-semibold mt-1">{selectedUser.lastActive}</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                {getUserHistory().map((dialog: any) => (
                  <Card key={dialog.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={dialog.model === 'GPT-4' ? 'default' : 'secondary'}>
                            {dialog.model}
                          </Badge>
                          <Badge variant="outline">
                            <Icon name="Zap" className="h-3 w-3 mr-1" />
                            {dialog.tokens}
                          </Badge>
                          <Badge variant={dialog.status === 'Активный' ? 'default' : 'secondary'}>
                            {dialog.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{dialog.date}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-sm font-medium text-blue-900 mb-1">Вопрос:</p>
                        <p className="text-sm">{dialog.user_message}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <p className="text-sm font-medium text-purple-900 mb-1">Ответ:</p>
                        <p className="text-sm">{dialog.assistant_message}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
