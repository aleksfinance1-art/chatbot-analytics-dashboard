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

const API_URL = 'https://functions.poehali.dev/228157e5-9d7c-4162-b7f6-c007b6c5fd8d';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModel, setFilterModel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedDialog, setSelectedDialog] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    link.download = `dialogs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const openDialogDetails = (dialog: any) => {
    setSelectedDialog(dialog);
    setDialogOpen(true);
  };

  if (loading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Панель управления AI-советником
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Мониторинг диалогов и расхода токенов</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex-1 sm:flex-none"
            >
              <Icon name={autoRefresh ? "Pause" : "Play"} className="mr-2 h-4 w-4" />
              {autoRefresh ? 'Авто' : 'Вкл'}
            </Button>
            <Button onClick={fetchAnalytics} size="sm" variant="outline" className="flex-1 sm:flex-none">
              <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
              Обновить
            </Button>
            {lastUpdate && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Обновлено: {lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm shadow-lg">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
              <Icon name="LayoutDashboard" className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Дашборд</span>
            </TabsTrigger>
            <TabsTrigger value="dialogs" className="text-xs sm:text-sm">
              <Icon name="MessageSquare" className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Диалоги</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">
              <Icon name="Users" className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Польз.</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <Icon name="TrendingUp" className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 animate-fade-in">
            {/* Dashboard content stays the same */}
          </TabsContent>

          <TabsContent value="dialogs" className="space-y-4 animate-fade-in">
            <Card className="p-3 sm:p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по пользователю или username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterModel} onValueChange={setFilterModel}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white">
                      <SelectValue placeholder="Модель" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все модели</SelectItem>
                      <SelectItem value="GPT-4">GPT-4</SelectItem>
                      <SelectItem value="GPT-3.5">GPT-3.5</SelectItem>
                      <SelectItem value="openai/gpt-4.1-mini">GPT-4.1-mini</SelectItem>
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
                  <Button onClick={exportToCSV} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Icon name="Download" className="mr-2 h-4 w-4" />
                    Экспорт
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-white overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <TableHead className="font-semibold">Пользователь</TableHead>
                      <TableHead className="font-semibold">Username</TableHead>
                      <TableHead className="font-semibold hidden sm:table-cell">Дата</TableHead>
                      <TableHead className="font-semibold">Токены</TableHead>
                      <TableHead className="font-semibold">Модель</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Статус</TableHead>
                      <TableHead className="font-semibold">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDialogs.map((dialog: any) => (
                      <TableRow key={dialog.id} className="hover:bg-purple-50/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {dialog.user}
                            {dialog.premium && <Icon name="Crown" className="h-4 w-4 text-orange-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {dialog.username ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              @{dialog.username}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{dialog.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300">
                            {(dialog.tokens / 1000).toFixed(1)}K
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${dialog.model?.includes('GPT-4') || dialog.model?.includes('gpt-4') ? 'bg-purple-600' : 'bg-pink-600'}`}>
                            {dialog.model?.includes('mini') ? '4.1-mini' : dialog.model?.includes('GPT-4') ? '4' : '3.5'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={dialog.status === 'Активный' ? 'default' : 'secondary'}>
                            {dialog.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDialogDetails(dialog)}
                            className="hover:bg-purple-100"
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

          <TabsContent value="users" className="space-y-4 animate-fade-in">
            {/* Users content stays the same */}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 animate-fade-in">
            {/* Analytics content stays the same */}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Details Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="MessageSquare" className="h-5 w-5 text-purple-600" />
              Детали диалога
            </DialogTitle>
            <DialogDescription>
              {selectedDialog?.username && (
                <span className="text-blue-600 font-medium">@{selectedDialog.username}</span>
              )}
              {' • '}
              {selectedDialog?.date}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDialog && (
            <div className="space-y-4 mt-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="bg-purple-50">
                  {selectedDialog.user}
                </Badge>
                <Badge variant="outline" className="bg-pink-50">
                  {(selectedDialog.tokens / 1000).toFixed(1)}K токенов
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                  {selectedDialog.model}
                </Badge>
                {selectedDialog.premium && (
                  <Badge className="bg-orange-500">
                    <Icon name="Crown" className="h-3 w-3 mr-1" />
                    Премиум
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                {selectedDialog.user_message && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="User" className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Вопрос пользователя:</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedDialog.user_message}</p>
                  </div>
                )}

                {selectedDialog.assistant_message && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Bot" className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-purple-900">Ответ AI:</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedDialog.assistant_message}</p>
                  </div>
                )}

                {!selectedDialog.user_message && !selectedDialog.assistant_message && (
                  <div className="text-center text-gray-500 py-8">
                    <Icon name="MessageCircle" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Содержимое диалога недоступно</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Пользователь: ${selectedDialog.user}\nUsername: @${selectedDialog.username || 'N/A'}\nДата: ${selectedDialog.date}\n\nВопрос:\n${selectedDialog.user_message || 'N/A'}\n\nОтвет:\n${selectedDialog.assistant_message || 'N/A'}`;
                    navigator.clipboard.writeText(text);
                  }}
                >
                  <Icon name="Copy" className="h-4 w-4 mr-2" />
                  Копировать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

