# Патч для Frontend - Отображение Username и Переписки

## Изменения в src/pages/Index.tsx

### 1. Добавьте состояние для модального окна (после строки 52)

```tsx
const [selectedDialog, setSelectedDialog] = useState<any>(null);
const [dialogOpen, setDialogOpen] = useState(false);
```

### 2. Обновите фильтрацию диалогов (строка 86-91)

```tsx
const filteredDialogs = dialogs.filter((dialog: any) => {
  const matchesSearch = dialog.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (dialog.username && dialog.username.toLowerCase().includes(searchQuery.toLowerCase()));
  const matchesModel = filterModel === 'all' || dialog.model === filterModel;
  const matchesStatus = filterStatus === 'all' || dialog.status === filterStatus;
  return matchesSearch && matchesModel && matchesStatus;
});
```

### 3. Обновите функцию exportToCSV (строка 93-105)

```tsx
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
```

### 4. Добавьте функцию открытия деталей (после exportToCSV)

```tsx
const openDialogDetails = (dialog: any) => {
  setSelectedDialog(dialog);
  setDialogOpen(true);
};
```

### 5. Добавьте импорт Dialog (строка 9)

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

### 6. Обновите таблицу диалогов (TabsContent value="dialogs")

Замените весь блок TableHeader и TableBody на:

```tsx
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
```

### 7. Добавьте модальное окно (в конце компонента, перед закрывающим </div>)

```tsx
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
```

## Что добавлено

✅ **Колонка Username** - отображается с иконкой @ в синем бейдже
✅ **Кнопка "Просмотр"** - открывает модальное окно с деталями
✅ **Модальное окно** - показывает:
  - Username пользователя
  - Вопрос пользователя (в синем блоке)
  - Ответ AI (в фиолетовом блоке)
  - Кнопка "Копировать" для быстрого копирования всего диалога
✅ **Улучшенный поиск** - теперь ищет и по username
✅ **Экспорт CSV** - включает username и полную переписку

## Дизайн

- Username отображается в синем бейдже с префиксом @
- Вопросы пользователя в голубом блоке с иконкой User
- Ответы AI в фиолетовом блоке с иконкой Bot
- Модальное окно с прокруткой для длинных диалогов
- Адаптивный дизайн для мобильных устройств

