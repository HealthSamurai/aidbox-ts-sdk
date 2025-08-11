// Импортируем типы для Storybook
import type { Meta, StoryObj } from "@storybook/react-vite";
// Импортируем компонент Button
import { Button } from "@/components/ui/button";
// Импортируем иконки из lucide-react (ChevronRight и Trash не используются - можно удалить)
import { ChevronRight, Trash, Trash2 } from "lucide-react";
// Импортируем React
import * as React from "react";

// Создаем мета-конфигурацию для Storybook
const meta = {
  // Заголовок в навигации Storybook
  title: "Components/Button",
  // Компонент для документации
  component: Button,
  // Параметры отображения - центрированный layout
  parameters: {
    layout: "centered",
  },
  // Автоматическая генерация документации
  tags: ["autodocs"],
  // Конфигурация контролов в Storybook UI
  argTypes: {
    // Контрол для disabled состояния - чекбокс
    disabled: {
      control: "boolean",
    },
    // Контрол для варианта кнопки - выпадающий список
    variant: {
      control: "select",
      // Доступные варианты
      options: [
        "primary",
        "critical",
        "outline",
        "tertiary",
        "toolbar",
        "toolbarCritical",
      ],
    },
    // Контрол для размера кнопки - выпадающий список
    size: {
      control: "select",
      options: ["small", "regular"],
    },
  },
} satisfies Meta<typeof Button>;

// Экспортируем мета-конфигурацию как default
export default meta;
// Тип для историй
type Story = StoryObj<typeof meta>;

// Компонент для отображения ряда кнопок с разными состояниями

// Основная история - показывает кнопку с настраиваемыми параметрами
export const Default: Story = {
  // Аргументы по умолчанию
  args: {
    variant: "primary",
    size: "regular",
    disabled: false,
  },
  // Кастомная функция рендера
  render: (args) => (
    <div
      className={`p-6 ${args.variant === "toolbarCritical" ? "bg-red-500" : "bg-white"} flex justify-center items-center rounded-lg h-44 w-128 shadow-sm gap-4`}
    >
      {/* Кнопка только с текстом */}
      <Button {...args}>Save</Button>
      {/* Кнопка с иконкой и текстом */}
      <Button {...args}>
        <Trash2 />
        Save
      </Button>
    </div>
  ),
  // Параметры для этой конкретной истории
  parameters: {
    layout: "centered",
  },
};
