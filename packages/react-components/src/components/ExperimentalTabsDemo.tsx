"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/ExperimentalTabs";

export function ExperimentalTabsDemo() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Experimental Tabs Demo
        </h1>
        <p className="text-muted-foreground">
          Демонстрация двух вариантов табов: Pills и Dashit
        </p>
      </div>

      {/* Pills Variant */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Pills Variant
          </h2>
          <p className="text-muted-foreground">
            Классический стиль с фоном и закругленными краями
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList variant="pills">
            <TabsTrigger variant="pills" value="overview">
              Обзор
            </TabsTrigger>
            <TabsTrigger variant="pills" value="analytics">
              Аналитика
            </TabsTrigger>
            <TabsTrigger variant="pills" value="reports">
              Отчеты
            </TabsTrigger>
            <TabsTrigger variant="pills" value="notifications">
              Уведомления
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-2">Обзор системы</h3>
              <p className="text-muted-foreground">
                Здесь отображается общая информация о состоянии системы,
                ключевые метрики и быстрый доступ к основным функциям.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-2xl font-bold">1,234</div>
                  <div className="text-sm text-muted-foreground">
                    Активные пользователи
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-2xl font-bold">567</div>
                  <div className="text-sm text-muted-foreground">
                    Новые заявки
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-2xl font-bold">89%</div>
                  <div className="text-sm text-muted-foreground">
                    Производительность
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-2">Аналитика</h3>
              <p className="text-muted-foreground">
                Детальная аналитика использования системы, графики и диаграммы
                для анализа данных.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-2">Отчеты</h3>
              <p className="text-muted-foreground">
                Генерация и просмотр различных отчетов по работе системы.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-2">Уведомления</h3>
              <p className="text-muted-foreground">
                Управление уведомлениями и настройка оповещений.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dashit Variant */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Dashit Variant
          </h2>
          <p className="text-muted-foreground">
            Минималистичный стиль с подчеркиванием активной вкладки
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList variant="dashit">
            <TabsTrigger variant="dashit" value="profile">
              Tab active
            </TabsTrigger>
            <TabsTrigger variant="dashit" value="settings">
              Tab2
            </TabsTrigger>
            <TabsTrigger variant="dashit" value="security">
              Tab3
            </TabsTrigger>
            <TabsTrigger variant="dashit" value="billing">
              Tab4
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-2">Профиль пользователя</h3>
              <p className="text-muted-foreground mb-4">
                Управление персональной информацией и настройками профиля.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold">ИП</span>
                  </div>
                  <div>
                    <div className="font-medium">Иван Петров</div>
                    <div className="text-sm text-muted-foreground">
                      ivan.petrov@example.com
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-2">Настройки</h3>
              <p className="text-muted-foreground">
                Общие настройки приложения и предпочтения пользователя.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-2">Безопасность</h3>
              <p className="text-muted-foreground">
                Настройки безопасности, двухфакторная аутентификация и пароли.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-2">Биллинг</h3>
              <p className="text-muted-foreground">
                Информация о подписке, способы оплаты и история транзакций.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Comparison */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Сравнение</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Pills Variant</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Фон контейнера с закругленными краями</li>
              <li>• Активная вкладка с белым фоном и тенью</li>
              <li>• Более традиционный внешний вид</li>
              <li>• Подходит для компактных интерфейсов</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Dashit Variant</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Без фона контейнера</li>
              <li>• Активная вкладка с нижним подчеркиванием</li>
              <li>• Минималистичный дизайн</li>
              <li>• Подходит для современных интерфейсов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
