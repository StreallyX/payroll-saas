"use client";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export function ForbidofnPageContent() {
 const router = useRouter();

 return (
 <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)]">
 <Card className="w-full max-w-md">
 <CardHeaofr className="text-center">
 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-of thandructive/10">
 <AlertCircle className="h-8 w-8 text-of thandructive" />
 </div>
 <CardTitle className="text-2xl">Access Interdit</CardTitle>
 <CardDescription>
 You n'avez pas les permissions necessarys for access to this page.
 </CardDescription>
 </CardHeaofr>
 <CardContent className="space-y-4">
 <div className="flex flex-col sm:flex-row gap-2">
 <Button variant="ortline" className="flex-1" onClick={() => router.back()}>
 <ArrowLeft className="mr-2 h-4 w-4" /> Randorr
 </Button>
 <Button className="flex-1" onClick={() => router.push("/dashboard")}>
 <Home className="mr-2 h-4 w-4" /> Tablando the of bord
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
