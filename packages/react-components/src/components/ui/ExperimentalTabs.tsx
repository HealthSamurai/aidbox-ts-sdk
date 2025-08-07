// Импортируем React для создания компонентов
import * as React from "react";
// Импортируем готовые примитивы табов от Radix UI - это unstyled компоненты с логикой
import * as TabsPrimitive from "@radix-ui/react-tabs";
// cva - функция для создания вариантов стилей, VariantProps - тип для пропсов вариантов
import { cva, type VariantProps } from "class-variance-authority";

// Утилита для объединения CSS классов (обычно это clsx + tailwind-merge)
import { cn } from "@/lib/utils";

// Корневой компонент табов - обертка над Radix Root
function Tabs({
  className, // Дополнительные CSS классы от пользователя
  ...props // Все остальные пропсы (spread оператор)
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  // Тип берем из Radix UI Root компонента
  return (
    <TabsPrimitive.Root // Используем готовый корневой компонент от Radix
      data-slot="tabs" // HTML атрибут для идентификации в тестах/стилях
      className={cn("flex flex-col gap-2", className)} // Объединяем базовые стили с пользовательскими
      {...props} // Передаем все остальные пропсы в Radix компонент
    />
  );
}

// Создаем функцию для генерации CSS классов с вариантами для списка табов
const tabsListVariants = cva("inline-flex w-fit items-center justify-center", {
  // cva создает функцию для генерации классов
  // Первый параметр - базовые стили, которые всегда применяются:
  // inline-flex - инлайн флекс контейнер
  // w-fit - ширина по содержимому
  // items-center - выравнивание по центру по вертикали
  // justify-center - выравнивание по центру по горизонтали
  variants: {
    // Объект с вариантами стилей
    variant: {
      // Название пропа для выбора варианта
      pills: "bg-muted text-muted-foreground/70 rounded-md p-0.5 ", // Стиль "таблетки" - скругленный фон с отступами
      dashit: "gap-0", // Стиль "черточки" - убираем gap между элементами
    },
  },
  defaultVariants: {
    // Значения по умолчанию
    variant: "pills", // Если variant не передан, используем "pills"
  },
});

// Компонент для списка табов (контейнер для кнопок табов)
function TabsList({
  className, // Дополнительные CSS классы
  variant, // Пропс для выбора варианта стиля
  ...props // Остальные пропсы
}: React.ComponentProps<typeof TabsPrimitive.List> & // Типы от Radix List компонента
  VariantProps<typeof tabsListVariants>) {
  // ПЛЮС типы для variant пропса из нашей cva функции
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      // Вызываем функцию tabsListVariants с переданным variant
      // Она вернет строку с CSS классами для выбранного варианта + базовые стили
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

// Создаем функцию для генерации CSS классов с вариантами для кнопок табов
const tabsTriggerVariants = cva(
  // Базовые стили для всех вариантов (применяются всегда):
  "inline-flex items-center justify-center py-1.5 text-sm font-normal whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  // inline-flex - инлайн флекс
  // items-center justify-center - центрирование

  // text-sm font-medium - размер и жирность текста
  // whitespace-nowrap - запрет переноса строк
  // transition-all - плавные переходы
  // outline-none - убираем outline
  // disabled:pointer-events-none disabled:opacity-50 - стили для disabled состояния
  // [&_svg]:shrink-0 - SVG иконки не сжимаются
  {
    variants: {
      variant: {
        // Стиль "таблетки"
        pills:
          "px-3 hover:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-sm focus-visible:ring-[3px] data-[state=active]:shadow-xs",
        // px-3 - горизонтальные отступы
        // hover:text-muted-foreground - цвет при наведении
        // data-[state=active] - стили для активной вкладки (Radix автоматически добавляет этот атрибут)
        // focus-visible - стили для фокуса с клавиатуры
        // rounded-sm - скругление углов
        // shadow-xs - тень для активного состояния
        // Стиль "черточки"
        dashit:
          "px-2 py-3 text-gray-400 hover:gray-800 border-b-2 border-transparent data-[state=active]:text-gray-900 data-[state=active]:border-red-500 rounded-none",
        // px-2 py-4 - отступы
        // text-gray-500 - серый цвет текста по умолчанию
        // hover:gray-800 - темнее при наведении
        // border-b-2 - нижняя граница толщиной 2px
        // border-transparent - прозрачная граница по умолчанию
        // data-[state=active]:border-red-500 - красная граница для активной вкладки
        // rounded-none - без скругления
      },
    },
    defaultVariants: {
      variant: "pills", // По умолчанию используем стиль "таблетки"
    },
  }
);

// Компонент для кнопки таба (триггер для переключения вкладок)
function TabsTrigger({
  className,
  variant, // Пропс для выбора варианта стиля
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & // Типы от Radix Trigger
  VariantProps<typeof tabsTriggerVariants>) {
  // Типы для variant из cva функции
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      // Применяем стили варианта: вызываем функцию с переданным variant
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
}

// Компонент для содержимого вкладок (то что показывается при выборе таба)
function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  // Только типы от Radix, без variants
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      // Простые базовые стили без вариантов:
      // flex-1 - занимает всё доступное пространство
      // outline-none - убираем outline при фокусе
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

// Экспортируем все компоненты для использования
export { Tabs, TabsContent, TabsList, TabsTrigger };
