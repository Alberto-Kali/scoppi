# Scoppi - Система оркестрации соревнований по спортивному программированию

## Введение

Scoppi - это веб-приложение на базе Next.js, предназначенное для организации и управления соревнованиями по спортивному программированию. Система предоставляет инструменты для создания соревнований, формирования команд, регистрации участников и анализа результатов.

## Начало работы

Сначала запустите сервер разработки:

```bash
npm run dev
# или
yarn dev
# или
pnpm dev
# или
bun dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере, чтобы увидеть результат.

## Функциональные сценарии

### 1. Создание открытого соревнования
- Представитель ФСП создает соревнование с обязательными полями:
  - Название
  - Тип (открытое)
  - Дисциплина
  - Даты (регистрация/проведение)
  - Описание
  - Ограничения (регион, максимальное количество участников)
- После публикации соревнование отображается в общей ленте и списке активных событий
- Капитан команды находит соревнование через фильтры (дата, формат, дисциплина, регион)
- Создает команду и вводит идентификаторы участников

### 2. Регистрация команды в полном составе
- Участники получают приглашения в личном кабинете
- Подтверждение участия автоматически заполняет данные в заявке
- Капитан отправляет заявку на модерацию
- Система присваивает статус "На модерации"
- Организатор подтверждает или отклоняет заявку

### 3. Регистрация команды с частичным составом
- Капитан создает команду с незаполненными местами
- Устанавливает статус "Требуются спортсмены"
- Указывает требуемые роли в описании
- Команда отображается в списке формирующихся составов

### 4. Присоединение к команде
- Спортсмен просматривает списки команд на соревновании
- Отправляет запрос капитану на присоединение
- Капитан принимает или отклоняет заявку
- Утвержденный спортсмен добавляется в команду

### 5. Федеральные соревнования с заявками от регионов
- Всероссийская Федерация создает федеральное соревнование
- Региональные представители подают заявки через раздел федеральных событий
- ФСП проверяет и утверждает заявки
- Утвержденные команды включаются в список участников

### 6. Региональные соревнования
- Региональный представитель создает соревнование с типом "Региональное"
- Система автоматически определяет регион организатора
- Возможность создания межрегиональных соревнований
- Автоматическая проверка региона участников

### 7. Индивидуальная регистрация
- Спортсмен выбирает событие с индивидуальным зачетом
- Заполняет необходимые данные
- Подает заявку на участие

### 8. Подведение итогов
- Организатор распределяет места и вносит баллы
- Система автоматически обновляет профили участников
- Результаты публикуются на странице события

### 9. Личный профиль
- Просмотр и редактирование личных данных
- История участия в соревнованиях
- Подтверждение участия в командах

### 10. Аналитика достижений
- Фильтрация данных по дисциплине, региону, дате и статусу
- Выгрузка данных в файлы для анализа
- Статистика по соревнованиям и участникам

## Техническая реализация

### Структура проекта

```
/scoppi
  /app
    /api - API endpoints
    /competitions - Страницы соревнований
    /dashboard - Личные кабинеты
    /profile - Профили пользователей
    /teams - Управление командами
  /components - UI компоненты
  /lib - Вспомогательные функции
  /models - Модели данных
  /styles - Стили
```

### Основные модели данных

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  region: string;
  fspId?: string;
  achievements: Achievement[];
  teams: TeamMember[];
}

interface Competition {
  id: string;
  name: string;
  type: 'open' | 'regional' | 'federal';
  discipline: string;
  registrationStart: Date;
  registrationEnd: Date;
  eventStart: Date;
  eventEnd: Date;
  description: string;
  region?: string;
  maxParticipants?: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  organizerId: string;
}

interface Team {
  id: string;
  name: string;
  competitionId: string;
  captainId: string;
  members: TeamMember[];
  status: 'forming' | 'pending' | 'approved' | 'rejected';
  requiredRoles?: string[];
}

interface TeamMember {
  userId: string;
  teamId: string;
  role?: string;
  status: 'invited' | 'joined' | 'rejected';
}
```

## Дополнительные функции

1. **Система уведомлений**:
   - Почтовые уведомления о приглашениях
   - Внутренние оповещения о статусе заявок

2. **Интеграции**:
   - API для подключения внешних систем
   - Экспорт данных в CSV/Excel

3. **Безопасность**:
   - Ролевая модель доступа
   - Верификация пользователей
   - Защита персональных данных

4. **Мобильная адаптация**:
   - Responsive дизайн
   - PWA-версия для мобильных устройств

## Развитие проекта

1. Добавление системы рейтингов
2. Интеграция с платформами для проведения соревнований
3. Развитие аналитического модуля
4. Поддержка международных соревнований

Для начала разработки клонируйте репозиторий и установите зависимости:

```bash
git clone https://github.com/hackathonsrus/PP_blackit_140.git
cd scoppi
npm install
```