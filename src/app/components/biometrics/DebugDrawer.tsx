"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Code2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DebugDrawerProps {
  enrollResponse: unknown;
  verifyResponse: unknown;
}

export function DebugDrawer({ enrollResponse, verifyResponse }: DebugDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasData = (enrollResponse !== null && enrollResponse !== undefined) || 
                  (verifyResponse !== null && verifyResponse !== undefined);

  if (!hasData) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="bg-gray-900/40 border-gray-800 lg:bg-gray-900/40">
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-white/50" />
                <CardTitle className="text-sm lg:text-base">Developer / Debug</CardTitle>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/50" />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Enroll Response */}
            {enrollResponse !== null && enrollResponse !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-white/50">
                    Enroll Response
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(enrollResponse, null, 2)
                      );
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/60 p-3 overflow-x-auto">
                  <pre className="text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap wrap-break-word">
                    {JSON.stringify(enrollResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Verify Response */}
            {verifyResponse !== null && verifyResponse !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-white/50">
                    Verify Response
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(verifyResponse, null, 2)
                      );
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/60 p-3 overflow-x-auto">
                  <pre className="text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap wrap-break-word">
                    {JSON.stringify(verifyResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
