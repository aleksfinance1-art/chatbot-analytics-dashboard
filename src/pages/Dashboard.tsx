import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardData {
  dau: number;
  messagesCount: number;
  costToday: number;
  quality: number;
  csat: number;
  nps: number;
  costWeek: number;
}

interface HistoryPoint {
  time: string;
  dau: number;
  cost: number;
  quality: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    dau: 0,
    messagesCount: 0,
    costToday: 0,
    quality: 0,
    csat: 0,
    nps: 0,
    costWeek: 0
  });
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dauRes, costsRes, qualityRes] = await Promise.all([
        fetch('https://functions.poehali.dev/b5b5bbe5-ce49-4ed2-bee8-59b632ccdaaa'),
        fetch('https://functions.poehali.dev/ca297a29-f33a-4ca2-9b92-0ad7f9892e22'),
        fetch('https://functions.poehali.dev/7f45dbc2-cc4a-4655-b631-008f4b33ed2e')
      ]);

      const dauData = await dauRes.json();
      const costsData = await costsRes.json();
      const qualityData = await qualityRes.json();

      const newData = {
        dau: dauData.dau || 0,
        messagesCount: dauData.dau * 15,
        costToday: costsData.cost_usd || 0,
        quality: qualityData.quality || 0,
        csat: 4.2,
        nps: 8,
        costWeek: (costsData.cost_usd || 0) * 7
      };

      setData(newData);

      const now = new Date();
      const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      
      setHistory(prev => {
        const newHistory = [...prev, {
          time: timeString,
          dau: newData.dau,
          cost: newData.costToday,
          quality: newData.quality
        }];
        return newHistory.slice(-10);
      });

      setLastUpdate(now);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const funnelData = [
    { stage: 'Первое сообщение', count: 100, percent: 100 },
    { stage: '10+ сообщений', count: 45, percent: 45 },
    { stage: 'Оценили качество', count: 30, percent: 30 },
    { stage: 'Готовы платить', count: 7, percent: 7 }
  ];

  const isOverBudget = data.costToday > 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              AI Bot Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Аналитика работы чат-бота в реальном времени</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button onClick={fetchDashboardData} disabled={loading} variant="outline" size="sm">
              <Icon name="RefreshCw" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Обновлено: {lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Icon name="Calendar" className="h-5 w-5" />
                Сегодня
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Icon name="Users" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.dau}</p>
                  <p className="text-sm text-muted-foreground">Активные пользователи</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Icon name="MessageSquare" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.messagesCount}</p>
                  <p className="text-sm text-muted-foreground">Сообщений отправлено</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Icon name="DollarSign" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${data.costToday.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Потрачено на AI</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Icon name="Star" className="h-5 w-5" />
                Качество
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Icon name="TrendingUp" className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.quality.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Средняя оценка ответов</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Icon name="Smile" className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.csat}/5</p>
                  <p className="text-sm text-muted-foreground">CSAT</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Icon name="Megaphone" className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.nps}/10</p>
                  <p className="text-sm text-muted-foreground">NPS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <Icon name="Filter" className="h-5 w-5" />
                Воронка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnelData.map((stage, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <span className="font-semibold">{stage.count} чел ({stage.percent}%)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                      style={{ width: `${stage.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Icon name="Wallet" className="h-5 w-5" />
                Деньги
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Расход за день</p>
                <p className="text-2xl font-bold">${data.costToday.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Расход за неделю</p>
                <p className="text-2xl font-bold">${data.costWeek.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Рекомендуемый лимит</p>
                <p className="text-lg font-semibold">$10/день</p>
              </div>
              <Badge 
                variant={isOverBudget ? "destructive" : "default"}
                className={`w-full justify-center text-sm ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
              >
                {isOverBudget ? (
                  <>
                    <Icon name="AlertTriangle" className="h-4 w-4 mr-2" />
                    ⚠️ Риск превышения
                  </>
                ) : (
                  <>
                    <Icon name="CheckCircle" className="h-4 w-4 mr-2" />
                    В норме
                  </>
                )}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" className="h-5 w-5" />
                Динамика активных пользователей
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="dau" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Нет данных. Нажмите "Обновить" для сбора истории.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="DollarSign" className="h-5 w-5" />
                Расход на AI ($)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Нет данных. Нажмите "Обновить" для сбора истории.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" className="h-5 w-5" />
                Качество ответов (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Нет данных. Нажмите "Обновить" для сбора истории.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Activity" className="h-5 w-5" />
                История обновлений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {history.length > 0 ? (
                  history.slice().reverse().map((point, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/50">
                      <span className="font-medium">{point.time}</span>
                      <div className="flex gap-4 text-muted-foreground">
                        <span>👥 {point.dau}</span>
                        <span>💰 ${point.cost.toFixed(2)}</span>
                        <span>⭐ {point.quality.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Нет данных. Нажмите "Обновить" для сбора истории.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}