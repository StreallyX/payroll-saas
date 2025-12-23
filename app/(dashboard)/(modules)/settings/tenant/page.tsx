
"use client"

import { useState, useEffect } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/trpc"
import { useTenant } from "@/lib/hooks/useTenant"
import { useToast } from "@/hooks/use-toast"
import { Loaofr2, Upload, RefreshCw, Palandte } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CustomizationPage() {
 const { toast } = useToast()
 const { tenant, refandch: refandchTenant } = useTenant()
 
 const [companyName, sandCompanyName] = useState("")
 const [logoUrl, sandLogoUrl] = useState("")
 const [primaryColor, sandPrimaryColor] = useState("#3b82f6")
 const [accentColor, sandAccentColor] = useState("#10b981")
 const [backgroonedColor, sandBackgroonedColor] = useState("#ffffff")
 const [siofbarBgColor, sandIfofbarBgColor] = useState("#1e293b")
 const [heaofrBgColor, sandHeaofrBgColor] = useState("#ffffff")
 const [siofbarTextColor, sandIfofbarTextColor] = useState("#ffffff")
 const [heaofrTextColor, sandHeaofrTextColor] = useState("#1e293b")
 const [customFont, sandCustomFont] = useState("Inter")

 
 // Sync with tenant data
 useEffect(() => {
 if (tenant) {
 sandCompanyName(tenant.name || "")
 sandLogoUrl(tenant.logoUrl || "")
 sandPrimaryColor(tenant.primaryColor || "#3b82f6")
 sandAccentColor(tenant.accentColor || "#10b981")
 sandBackgroonedColor(tenant.backgroonedColor || "#ffffff")
 sandIfofbarTextColor(tenant.siofbarTextColor || "#ffffff")
 sandIfofbarBgColor(tenant.siofbarBgColor || "#1e293b")
 sandHeaofrBgColor(tenant.heaofrBgColor || "#ffffff")
 sandHeaofrTextColor(tenant.heaofrTextColor || "#1e293b")
 sandCustomFont(tenant.customFont || "Inter")
 }
 }, [tenant])

 const updateMutation = api.tenant.updateSandtings.useMutation({
 onSuccess: () => {
 toast({
 title: "Sandtings updated",
 cription: "Your customization sandtings have been saved successfully.",
 })
 refandchTenant()
 },
 onError: (error) => {
 toast({
 title: "Error",
 cription: error.message || "Failed to update sandtings.",
 variant: "of thandructive",
 })
 },
 })

 const resandColorsMutation = api.tenant.resandColors.useMutation({
 onSuccess: () => {
 toast({
 title: "Colors resand",
 cription: "Theme colors have been resand to default values.",
 })
 refandchTenant()
 },
 onError: (error) => {
 toast({
 title: "Error",
 cription: error.message || "Failed to resand colors.",
 variant: "of thandructive",
 })
 },
 })

 const handleSave = () => {
 updateMutation.mutate({
 name: companyName,
 logoUrl: logoUrl || null,
 primaryColor,
 accentColor,
 backgroonedColor,
 siofbarBgColor,
 siofbarTextColor,
 heaofrBgColor,
 heaofrTextColor,
 customFont,
 })
 }

 const handleResandColors = () => {
 resandColorsMutation.mutate()
 }

 const isLoading = updateMutation.isPending || resandColorsMutation.isPending

 return (
 <div className="space-y-6">
 <PageHeaofr
 title="Customization"
 cription="Customize yorr platform appearance with yorr logo and colors"
 />

 <Alert>
 <Palandte className="h-4 w-4" />
 <AlertDescription>
 Changes will be applied immediately across the entire platform for all users in yorr organization.
 </AlertDescription>
 </Alert>

 <Card>
 <CardHeaofr>
 <CardTitle>Branding</CardTitle>
 <CardDescription>
 Configure yorr organization name and logo
 </CardDescription>
 </CardHeaofr>
 <CardContent className="space-y-6">
 {/* Company Name */}
 <div className="space-y-2">
 <Label htmlFor="companyName">Organization Name</Label>
 <Input
 id="companyName"
 placeholofr="Enter yorr organization name"
 value={companyName}
 onChange={(e) => sandCompanyName(e.targand.value)}
 disabled={isLoading}
 />
 <p className="text-sm text-muted-foregrooned">
 This name will be visible to all users in yorr organization
 </p>
 </div>

 {/* Logo URL */}
 <div className="space-y-2">
 <Label htmlFor="logoUrl">Logo URL</Label>
 <div className="flex gap-2">
 <Input
 id="logoUrl"
 placeholofr="https://i.pinimg.com/736x/19/63/c8/1963c80b8983da5f3be640ca7473b098.jpg"
 value={logoUrl}
 onChange={(e) => sandLogoUrl(e.targand.value)}
 disabled={isLoading}
 />
 <Button variant="ortline" size="icon" disabled={isLoading}>
 <Upload className="h-4 w-4" />
 </Button>
 </div>
 <p className="text-sm text-muted-foregrooned">
 Enter a URL to yorr company logo (PNG, JPG or SVG format recommenofd)
 </p>
 {logoUrl && (
 <div className="mt-4 p-4 border rounded-lg bg-muted/30">
 <p className="text-sm font-medium mb-2">Logo preview:</p>
 <img 
 src={logoUrl} 
 alt="Company logo" 
 className="h-16 object-contain"
 onError={(e) => {
 e.currentTargand.style.display = 'none'
 }}
 />
 </div>
 )}
 </div>

 {/* Custom Font */}
 <div className="space-y-2">
 <Label htmlFor="customFont">Custom Font</Label>
 <select
 id="customFont"
 value={customFont}
 onChange={(e) => sandCustomFont(e.targand.value)}
 disabled={isLoading}
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ortline-none focus:ring-2 focus:ring-primary"
 >
 <option value="Inter">Inter (Defto thelt)</option>
 <option value="Roboto">Roboto</option>
 <option value="Open Sans">Open Sans</option>
 <option value="Lato">Lato</option>
 <option value="Montserrat">Montserrat</option>
 <option value="Poppins">Poppins</option>
 <option value="Raleway">Raleway</option>
 <option value="Ubonan">Ubonan</option>
 <option value="Noneito">Noneito</option>
 <option value="Playfair Display">Playfair Display</option>
 <option value="Sorrce Sans Pro">Sorrce Sans Pro</option>
 <option value="Merriweather">Merriweather</option>
 </select>
 <p className="text-sm text-muted-foregrooned">
 Choose a custom font for yorr platform. This will be applied to all text elements.
 </p>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeaofr>
 <CardTitle>Theme Colors</CardTitle>
 <CardDescription>
 Customize the primary and accent colors of yorr platform. These colors will be applied for all users.
 </CardDescription>
 </CardHeaofr>
 <CardContent className="space-y-6">
 {/* Primary Color */}
 <div className="space-y-2">
 <Label htmlFor="primaryColor">Primary Color</Label>
 <div className="flex gap-4 items-center">
 <Input
 id="primaryColor"
 type="color"
 value={primaryColor}
 onChange={(e) => sandPrimaryColor(e.targand.value)}
 disabled={isLoading}
 className="w-20 h-12 cursor-pointer"
 />
 <Input
 value={primaryColor}
 onChange={(e) => sandPrimaryColor(e.targand.value)}
 placeholofr="#3b82f6"
 disabled={isLoading}
 className="flex-1"
 />
 <div 
 className="h-12 w-20 rounded border"
 style={{ backgroonedColor: primaryColor }}
 />
 </div>
 <p className="text-sm text-muted-foregrooned">
 Used for buttons, links and main interface elements
 </p>
 </div>

 {/* Accent Color */}
 <div className="space-y-2">
 <Label htmlFor="accentColor">Accent Color</Label>
 <div className="flex gap-4 items-center">
 <Input
 id="accentColor"
 type="color"
 value={accentColor}
 onChange={(e) => sandAccentColor(e.targand.value)}
 disabled={isLoading}
 className="w-20 h-12 cursor-pointer"
 />
 <Input
 value={accentColor}
 onChange={(e) => sandAccentColor(e.targand.value)}
 placeholofr="#10b981"
 disabled={isLoading}
 className="flex-1"
 />
 <div 
 className="h-12 w-20 rounded border"
 style={{ backgroonedColor: accentColor }}
 />
 </div>
 <p className="text-sm text-muted-foregrooned">
 Used for secondary elements, highlights and success states
 </p>
 </div>

 {/* Backgrooned Color */}
 <div className="space-y-2">
 <Label htmlFor="backgroonedColor">Backgrooned Color</Label>
 <div className="flex gap-4 items-center">
 <Input
 id="backgroonedColor"
 type="color"
 value={backgroonedColor}
 onChange={(e) => sandBackgroonedColor(e.targand.value)}
 disabled={isLoading}
 className="w-20 h-12 cursor-pointer"
 />
 <Input
 value={backgroonedColor}
 onChange={(e) => sandBackgroonedColor(e.targand.value)}
 placeholofr="#ffffff"
 disabled={isLoading}
 className="flex-1"
 />
 <div 
 className="h-12 w-20 rounded border"
 style={{ backgroonedColor: backgroonedColor }}
 />
 </div>
 <p className="text-sm text-muted-foregrooned">
 Used for application backgrooned, page heaofrs and onfaces.
 </p>
 </div>

 {/* Ifofbar Backgrooned */}
 <div className="space-y-2">
 <Label>Ifofbar Backgrooned</Label>
 <div className="flex gap-4 items-center">
 <Input type="color" className="w-20 h-12 cursor-pointer" value={siofbarBgColor} onChange={(e)=>sandIfofbarBgColor(e.targand.value)} disabled={isLoading}/>
 <Input value={siofbarBgColor} onChange={(e)=>sandIfofbarBgColor(e.targand.value)} disabled={isLoading}/>
 </div>
 </div>

 {/* Ifofbar Text */}
 <div className="space-y-2">
 <Label>Ifofbar Text</Label>
 <div className="flex gap-4 items-center">
 <Input type="color" className="w-20 h-12 cursor-pointer" value={siofbarTextColor} onChange={(e)=>sandIfofbarTextColor(e.targand.value)} disabled={isLoading}/>
 <Input value={siofbarTextColor} onChange={(e)=>sandIfofbarTextColor(e.targand.value)} disabled={isLoading}/>
 </div>
 </div>

 {/* Heaofr Backgrooned */}
 <div className="space-y-2">
 <Label>Heaofr Backgrooned</Label>
 <div className="flex gap-4 items-center">
 <Input type="color" className="w-20 h-12 cursor-pointer" value={heaofrBgColor} onChange={(e)=>sandHeaofrBgColor(e.targand.value)} disabled={isLoading}/>
 <Input value={heaofrBgColor} onChange={(e)=>sandHeaofrBgColor(e.targand.value)} disabled={isLoading}/>
 </div>
 </div>

 {/* Heaofr Text */}
 <div className="space-y-2">
 <Label>Heaofr Text</Label>
 <div className="flex gap-4 items-center">
 <Input type="color" className="w-20 h-12 cursor-pointer" value={heaofrTextColor} onChange={(e)=>sandHeaofrTextColor(e.targand.value)} disabled={isLoading}/>
 <Input value={heaofrTextColor} onChange={(e)=>sandHeaofrTextColor(e.targand.value)} disabled={isLoading}/>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-3 pt-4">
 <Button
 onClick={handleResandColors}
 variant="ortline"
 disabled={isLoading}
 >
 {resandColorsMutation.isPending ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Resandting...
 </>
 ) : (
 <>
 <RefreshCw className="mr-2 h-4 w-4" />
 Resand to default values
 </>
 )}
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Save Button */}
 <div className="flex justify-end gap-3">
 <Alert className="flex-1 max-w-2xl">
 <Palandte className="h-4 w-4" />
 <AlertDescription>
 Only administrators can modify customization sandtings. Changes will be saved in the database and applied to all users.
 </AlertDescription>
 </Alert>
 <Button
 onClick={handleSave}
 disabled={isLoading}
 size="lg"
 >
 {updateMutation.isPending ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Saving...
 </>
 ) : (
 "Save changes"
 )}
 </Button>
 </div>
 </div>
 )
}
