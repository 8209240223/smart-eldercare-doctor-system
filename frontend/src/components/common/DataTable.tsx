import { motion } from "motion/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("rounded-xl border border-border/40 bg-white/80 backdrop-blur-sm overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="border-border/40 hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{ width: col.width }}
                className="text-xs font-semibold text-muted-foreground"
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <motion.tr
              key={keyExtractor(row)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="border-border/40 transition-colors hover:bg-medical-50/30"
            >
              {columns.map((col) => (
                <TableCell key={col.key} className="py-3.5 text-sm">
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
