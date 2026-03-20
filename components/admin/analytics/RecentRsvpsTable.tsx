import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RsvpEntry {
  id: string;
  guestName: string;
  attending: boolean;
  submittedAt: string;
}

interface RecentRsvpsTableProps {
  rsvps: RsvpEntry[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function RecentRsvpsTable({ rsvps }: RecentRsvpsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas Confirmações</CardTitle>
        <CardDescription>As 10 respostas mais recentes</CardDescription>
      </CardHeader>
      <CardContent>
        {rsvps.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            Nenhuma confirmação recebida ainda
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Presença</TableHead>
                <TableHead className="text-right">Enviado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rsvps.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.guestName}</TableCell>
                  <TableCell>
                    {r.attending ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                        Confirmado
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Não vai
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {timeAgo(r.submittedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
