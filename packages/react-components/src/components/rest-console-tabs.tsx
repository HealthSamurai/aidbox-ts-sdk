import { X } from "lucide-react";
import * as React from "react";
import { Separator } from "#shadcn/components/ui/separator.js";
import { Tabs, TabsList, TabsTrigger } from "#shadcn/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#shadcn/components/ui/tooltip.js";
import { cn } from "#shadcn/lib/utils";
import { requestMethodVariants } from "./request-line-editor.js";

// Стили для компонентов
const tabTriggerStyles = "max-w-80 w-50 min-w-30 hover:bg-bg-secondary/60";
const pathStyles = "truncate typo-body";
const closeButtonStyles = "p-0 ml-2";
const closeIconStyles = "text-text-disabled";

export type Tab = {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
};

export const RestConsoleTabs = ({
  tabs,
  selectedTabId,
  onSelectTab,
  onCloseTab,
}: {
  tabs: Tab[];
  selectedTabId: string;
  onSelectTab: (val: string) => void;
  onCloseTab: (val: string) => void;
}) => {
  return (
    <Tabs
      defaultValue={selectedTabId}
      className="overflow-x-auto overflow-y-hidden h-10"
    >
      <TabsList className="w-full">
        {tabs.map((tab, index) => (
          <React.Fragment key={tab.id}>
            <TabsTrigger
              value={tab.id}
              className={tabTriggerStyles}
              onClick={() => onSelectTab(tab.id)}
            >
              <Tooltip delayDuration={400}>
                <TooltipTrigger asChild>
                  <span className="w-full flex items-center typo-label justify-between">
                    <span className={pathStyles}>
                      {/* HTTP метод с цветовым стилем */}
                      <span
                        className={cn(
                          requestMethodVariants({ method: tab.method }),
                          "mr-1"
                        )}
                      >
                        {tab.method}
                      </span>
                      {/* Путь запроса */}
                      {tab.path || "New request"}
                    </span>
                    {/* Кнопка закрытия */}
                    <span
                      className={closeButtonStyles}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                      }}
                    >
                      <X size={16} className={closeIconStyles} />
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-60">
                  {tab.method} {tab.path}
                </TooltipContent>
              </Tooltip>
            </TabsTrigger>
            {index < tabs.length - 1 && <Separator orientation="vertical" />}
          </React.Fragment>
        ))}
      </TabsList>
    </Tabs>
  );
};
