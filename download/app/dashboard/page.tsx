"use client";

import { useState, useTransition, useMemo, FormEvent } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, Search, TrendingUp, Users, Loader2, QrCode } from "lucide-react";
import {
  ChartContainer,
} from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, LabelList } from "recharts";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sub, isWithinInterval, startOfYear, endOfYear } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { User, Visit, College } from "@/lib/types";
import { COLLEGES } from "@/lib/placeholder-data";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeDisplay } from "@/components/dashboard/qr-code-display";

type DashboardRange = "day" | "week" | "month" | "year";

// Define an interface extending jsPDF to include the autoTable method
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("week");
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, startTransition] = useTransition();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const firestore = useFirestore();

  const visitsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "visitLogs") : null),
    [firestore]
  );
  const { data: visits, isLoading: visitsLoading } =
    useCollection<Omit<Visit, "id">>(visitsQuery);

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "users") : null),
    [firestore]
  );
  const { data: users, isLoading: usersLoading } = useCollection<User>(
    usersQuery
  );

  const collegesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "colleges") : null),
    [firestore]
  );
  const { data: collegesData, isLoading: collegesLoading } = useCollection<College>(collegesQuery);

  const colleges = useMemo(() => (collegesData && collegesData.length > 0 ? collegesData : COLLEGES), [collegesData]);

  const collegeMap = useMemo(() => {
    return colleges.reduce((acc, college) => {
      acc[college.id] = college.name;
      return acc;
    }, {} as Record<string, string>);
  }, [colleges]);

  const handleRangeChange = (newRange: DashboardRange) => {
    setRange(newRange);
  };

  const dashboardData = useMemo(() => {
    const fallbackData = {
      collegeChartData: [],
      totalVisits: 0,
      uniqueVisitors: 0,
      visitsByCollegeTable: [],
    };
    if (!visits) {
      return fallbackData;
    }

    const now = new Date();
    let interval;

    switch (range) {
      case "day":
        interval = { start: sub(now, { days: 1 }), end: now };
        break;
      case "week":
        interval = { start: sub(now, { weeks: 1 }), end: now };
        break;
      case "month":
        interval = { start: sub(now, { months: 1 }), end: now };
        break;
      case "year":
        interval = { start: startOfYear(now), end: endOfYear(now) };
        break;
    }

    const filteredVisits = visits.filter((visit) =>
      isWithinInterval(new Date(visit.timestamp), interval)
    );
    
    const totalVisits = filteredVisits.length;
    const uniqueVisitors = new Set(filteredVisits.map(v => v.userId)).size;


    const visitsByCollege = filteredVisits.reduce((acc, visit) => {
      const collegeName = collegeMap[visit.collegeId] || "Unknown";
      if (collegeName !== 'Unknown') {
        acc[collegeName] = (acc[collegeName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const collegeChartData = Object.entries(visitsByCollege)
      .map(([college, count]) => ({ college, visits: count }))
      .sort((a, b) => b.visits - a.visits);

    return {
      collegeChartData,
      totalVisits,
      uniqueVisitors,
      visitsByCollegeTable: collegeChartData,
    };
  }, [visits, range, collegeMap]);

  const handleBlockToggle = (userId: string, currentStatus: boolean) => {
    startTransition(() => {
      if (!firestore) return;
      const userRef = doc(firestore, "users", userId);
      updateDocumentNonBlocking(userRef, { isBlocked: !currentStatus });

      const updatedUser = users?.find((u) => u.id === userId);
      if (updatedUser) {
        toast({
          title: `User ${currentStatus ? "Unblocked" : "Blocked"}`,
          description: `${updatedUser.displayName} status has been updated.`,
        });
      }
    });
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchTerm(searchValue);
  };

  const handleDownloadPdf = () => {
    if (!dashboardData || dashboardData.visitsByCollegeTable.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no visit statistics to include in the report.",
      });
      return;
    }

    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    const timeRangeText = range.charAt(0).toUpperCase() + range.slice(1);
    const title = `NEU Library Visitor Report - This ${timeRangeText}`;
    const generatedDate = new Date();

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Report generated on: ${generatedDate.toLocaleString()}`, 14, 30);
    doc.text(`Total Visits: ${dashboardData.totalVisits}`, 14, 40);
    doc.text(`Unique Visitors: ${dashboardData.uniqueVisitors}`, 14, 46);

    const tableColumn = ["College / Department", "Number of Visits"];
    const tableRows: (string | number)[][] = [];

    dashboardData.visitsByCollegeTable.forEach(item => {
      const rowData = [
        item.college,
        item.visits
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
    });
    
    doc.save(`library-stats-report-${generatedDate.toISOString().split('T')[0]}.pdf`);
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const chartConfig = {
    visits: { label: "Visits", color: "hsl(var(--chart-green))" },
  };

  const isLoading = visitsLoading || usersLoading || collegesLoading;
  
  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading Dashboard Data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 animate-in fade-in">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="dashboard-title text-3xl tracking-tight">
          Library Analytics Overview
        </h2>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="bg-white text-card-foreground hover:bg-white/90">
                <QrCode className="mr-2 h-4 w-4" />
                Show QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card">
              <QRCodeDisplay />
            </DialogContent>
          </Dialog>
          <Button onClick={handleDownloadPdf} variant="secondary" className="bg-white text-card-foreground hover:bg-white/90">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-wrap">
        <Button
          variant={range === "day" ? "default" : "secondary"}
          className={range === "day" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-white text-card-foreground hover:bg-white/90"}
          onClick={() => handleRangeChange("day")}
        >
          Today
        </Button>
        <Button
          variant={range === "week" ? "default" : "secondary"}
          className={range === "week" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-white text-card-foreground hover:bg-white/90"}
          onClick={() => handleRangeChange("week")}
        >
          This Week
        </Button>
        <Button
          variant={range === "month" ? "default" : "secondary"}
          className={range === "month" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-white text-card-foreground hover:bg-white/90"}
          onClick={() => handleRangeChange("month")}
        >
          This Month
        </Button>
        <Button
          variant={range === "year" ? "default" : "secondary"}
          className={range === "year" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-white text-card-foreground hover:bg-white/90"}
          onClick={() => handleRangeChange("year")}
        >
          This Year
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Total Visits</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{dashboardData.totalVisits}</div>
                <p className="text-xs text-muted-foreground">
                    in this {range}
                </p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{dashboardData.uniqueVisitors}</div>
                <p className="text-xs text-muted-foreground">
                    in this {range}
                </p>
            </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <Card className="lg:col-span-4 bg-white">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Visits by College ({range === "day" ? "Today" : `This ${range.charAt(0).toUpperCase() + range.slice(1)}`})
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <RechartsBarChart data={dashboardData.collegeChartData} layout="vertical" margin={{ left: 20, right: 20 }} >
                <YAxis dataKey="college" type="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--card-foreground))", fontSize: 12 }} dx={-5} width={120} />
                <XAxis dataKey="visits" type="number" hide />
                <Bar dataKey="visits" fill="var(--color-visits)" radius={4}>
                  <LabelList dataKey="visits" position="insideRight" style={{ fill: 'hsl(var(--primary-foreground))' }} />
                </Bar>
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-white">
          <CardHeader>
            <CardTitle className="text-card-foreground">User Administration</CardTitle>
            <CardDescription>Search for users and manage their access status.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-users"
                        placeholder="Search by name or email..."
                        className="pl-10 bg-secondary text-secondary-foreground"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </div>
            </form>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                     <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className={isUpdating ? "opacity-50" : ""} >
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isBlocked ? "destructive" : "secondary"}>
                            {user.isBlocked ? "Blocked" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant={user.isBlocked ? "secondary" : "destructive"} size="sm" onClick={() => handleBlockToggle(user.id, user.isBlocked)} disabled={isUpdating || user.id === currentUser?.uid} >
                            {user.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
