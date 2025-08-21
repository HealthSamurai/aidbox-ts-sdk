import { Button } from "#shadcn/components/ui/button.js";
import { Separator } from "#shadcn/components/ui/separator.js";
import { Tabs, TabsList, TabsTrigger } from "#shadcn/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "#shadcn/components/ui/tooltip.js";
import { X } from "lucide-react";
import * as React from "react";
import { requestMethodVariants } from "./request-line-editor.js";
import { cn } from "#shadcn/lib/utils";

export type Tab = {
    id: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
}


export const RestConsoleTabs = ({ tabs, selectedTabId, onSelectTab, onCloseTab }: { tabs: Tab[], selectedTabId: string, onSelectTab: (val: string) => void, onCloseTab: (val: string) => void }) => {
    return (
        <Tabs defaultValue={selectedTabId} className="overflow-x-auto overflow-y-hidden h-10">
            <TabsList className="w-full">
                {tabs.map((tab, index) => (
                    <React.Fragment key={tab.id}>
                        <TabsTrigger
                            value={tab.id}
                            className="max-w-80 w-50 min-w-30"
                            onClick={() => onSelectTab(tab.id)}
                        >
                            <Tooltip delayDuration={400}>
                                <TooltipTrigger asChild>
                                    <span className="w-full flex items-center justify-between">
                                        <span className="truncate">
                                            <span
                                                className={cn(requestMethodVariants({ method: tab.method }), "mr-1")}
                                            >
                                                {tab.method}
                                            </span>
                                            {tab.path || "New request"}
                                        </span>
                                        <Button
                                            variant="link"
                                            className="p-0 ml-2"
                                            asChild
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onCloseTab(tab.id)
                                            }}
                                        >
                                            <span>
                                                <X size={16} />
                                            </span>
                                        </Button>
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
    )
}