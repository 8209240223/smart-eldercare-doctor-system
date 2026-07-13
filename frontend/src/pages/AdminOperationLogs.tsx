import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminOperationLogs } from "@/hooks/useApi";

const emptyFilters = { username: "", module: "", operationType: "", status: undefined as number | undefined, startTime: "", endTime: "" };

export default function AdminOperationLogs() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const logs = useAdminOperationLogs(page, 20, filters);
  const records = logs.data?.records || [];
  const totalPages = Math.max(1, Number(logs.data?.pages || 1));

  return (
    <PageShell title="操作审计" subtitle="查看全站关键操作、请求结果、执行耗时和失败原因">
      <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="grid gap-3 border-b border-border/50 pb-4 md:grid-cols-2 xl:grid-cols-7">
            <Input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} placeholder="操作账号" />
            <Input value={draft.module} onChange={(event) => setDraft({ ...draft, module: event.target.value })} placeholder="业务模块" />
            <Input value={draft.operationType} onChange={(event) => setDraft({ ...draft, operationType: event.target.value })} placeholder="操作类型" />
            <select value={draft.status ?? ""} onChange={(event) => setDraft({ ...draft, status: event.target.value === "" ? undefined : Number(event.target.value) })} className="h-10 rounded-md border border-input bg-white px-3 text-sm"><option value="">全部结果</option><option value={1}>成功</option><option value={0}>失败</option></select>
            <Input type="date" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} />
            <Input type="date" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} />
            <Button onClick={() => { setFilters(draft); setPage(1); }}><Search className="mr-2 h-4 w-4" />查询</Button>
          </div>

          <div className="mt-4">
            {logs.isLoading ? <Skeleton className="h-80 w-full" /> : !records.length ? <EmptyState title="暂无操作日志" description="调整筛选条件后重新查询" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>时间</TableHead><TableHead>操作人</TableHead><TableHead>模块</TableHead><TableHead>操作</TableHead><TableHead>结果</TableHead><TableHead>请求与耗时</TableHead><TableHead className="min-w-[240px]">说明</TableHead></TableRow></TableHeader>
                <TableBody>
                  {records.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-xs">{item.createTime || "-"}</TableCell>
                      <TableCell><div className="font-medium">{item.username || "系统"}</div><div className="text-xs text-muted-foreground">用户ID {item.userId || "-"}</div></TableCell>
                      <TableCell>{item.module || "-"}</TableCell>
                      <TableCell>{item.operationType || item.type || "-"}</TableCell>
                      <TableCell><Badge variant="outline" className={item.status === 0 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{item.status === 0 ? "失败" : "成功"}</Badge></TableCell>
                      <TableCell><div className="max-w-[260px] truncate text-xs">{item.method || "-"} {item.requestUrl || "-"}</div><div className="text-xs text-muted-foreground">{item.requestIp || "-"} · {item.duration ?? 0} ms</div></TableCell>
                      <TableCell><div className="max-w-sm break-words text-sm">{item.description || item.desc || "-"}</div>{item.errorMsg && <div className="mt-1 break-words text-xs text-rose-600">{item.errorMsg}</div>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-medical-500" />共 {Number(logs.data?.total || 0)} 条审计记录</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button><span>第 {page} / {totalPages} 页</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>下一页</Button></div></div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
