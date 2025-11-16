
"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/trpc"
import { useTenant } from "@/lib/hooks/useTenant"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, RefreshCw, Palette } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CustomizationPage() {
  const { toast } = useToast()
  const { tenant, refetch: refetchTenant } = useTenant()
  
  const [companyName, setCompanyName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [accentColor, setAccentColor] = useState("#10b981")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [sidebarBgColor, setSidebarBgColor] = useState("#1e293b")
  const [headerBgColor, setHeaderBgColor] = useState("#ffffff")
  const [sidebarTextColor, setSidebarTextColor] = useState("#ffffff")
  const [headerTextColor, setHeaderTextColor] = useState("#1e293b")
  const [customFont, setCustomFont] = useState("Inter")

  
  // Sync with tenant data
  useEffect(() => {
    if (tenant) {
      setCompanyName(tenant.name || "")
      setLogoUrl(tenant.logoUrl || "")
      setPrimaryColor(tenant.primaryColor || "#3b82f6")
      setAccentColor(tenant.accentColor || "#10b981")
      setBackgroundColor(tenant.backgroundColor || "#ffffff")
      setSidebarTextColor(tenant.sidebarTextColor || "#ffffff")
      setSidebarBgColor(tenant.sidebarBgColor || "#1e293b")
      setHeaderBgColor(tenant.headerBgColor || "#ffffff")
      setHeaderTextColor(tenant.headerTextColor || "#1e293b")
      setCustomFont(tenant.customFont || "Inter")
    }
  }, [tenant])

  const updateMutation = api.tenant.updateSettings.useMutation({
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your customization settings have been saved successfully.",
      })
      refetchTenant()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      })
    },
  })

  const resetColorsMutation = api.tenant.resetColors.useMutation({
    onSuccess: () => {
      toast({
        title: "Colors reset",
        description: "Theme colors have been reset to default values.",
      })
      refetchTenant()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset colors.",
        variant: "destructive",
      })
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      name: companyName,
      logoUrl: logoUrl || null,
      primaryColor,
      accentColor,
      backgroundColor,
      sidebarBgColor,
      sidebarTextColor,
      headerBgColor,
      headerTextColor,
      customFont,
    })
  }

  const handleResetColors = () => {
    resetColorsMutation.mutate()
  }

  const isLoading = updateMutation.isPending || resetColorsMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customization"
        description="Customize your platform appearance with your logo and colors"
      />

      <Alert>
        <Palette className="h-4 w-4" />
        <AlertDescription>
          Changes will be applied immediately across the entire platform for all users in your organization.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Configure your organization name and logo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Organization Name</Label>
            <Input
              id="companyName"
              placeholder="Enter your organization name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              This name will be visible to all users in your organization
            </p>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="logoUrl"
                placeholder="https://i.pinimg.com/736x/19/63/c8/1963c80b8983da5f3be640ca7473b098.jpg"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button variant="outline" size="icon" disabled={isLoading}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter a URL to your company logo (PNG, JPG or SVG format recommended)
            </p>
            {logoUrl && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">Logo preview:</p>
                <img 
                  src={logoUrl} 
                  alt="Company logo" 
                  className="h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
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
              onChange={(e) => setCustomFont(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Inter">Inter (Default)</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Poppins">Poppins</option>
              <option value="Raleway">Raleway</option>
              <option value="Ubuntu">Ubuntu</option>
              <option value="Nunito">Nunito</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="Merriweather">Merriweather</option>
            </select>
            <p className="text-sm text-muted-foreground">
              Choose a custom font for your platform. This will be applied to all text elements.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme Colors</CardTitle>
          <CardDescription>
            Customize the primary and accent colors of your platform. These colors will be applied for all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-4 items-center">
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={isLoading}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#3b82f6"
                disabled={isLoading}
                className="flex-1"
              />
              <div 
                className="h-12 w-20 rounded border"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
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
                onChange={(e) => setAccentColor(e.target.value)}
                disabled={isLoading}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#10b981"
                disabled={isLoading}
                className="flex-1"
              />
              <div 
                className="h-12 w-20 rounded border"
                style={{ backgroundColor: accentColor }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Used for secondary elements, highlights and success states
            </p>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex gap-4 items-center">
              <Input
                id="backgroundColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                disabled={isLoading}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#ffffff"
                disabled={isLoading}
                className="flex-1"
              />
              <div 
                className="h-12 w-20 rounded border"
                style={{ backgroundColor: backgroundColor }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Used for application background, page headers and surfaces.
            </p>
          </div>

          {/* Sidebar Background */}
          <div className="space-y-2">
            <Label>Sidebar Background</Label>
            <div className="flex gap-4 items-center">
              <Input type="color" className="w-20 h-12 cursor-pointer" value={sidebarBgColor} onChange={(e)=>setSidebarBgColor(e.target.value)} disabled={isLoading}/>
              <Input value={sidebarBgColor} onChange={(e)=>setSidebarBgColor(e.target.value)} disabled={isLoading}/>
            </div>
          </div>

          {/* Sidebar Text */}
          <div className="space-y-2">
            <Label>Sidebar Text</Label>
            <div className="flex gap-4 items-center">
              <Input type="color" className="w-20 h-12 cursor-pointer" value={sidebarTextColor} onChange={(e)=>setSidebarTextColor(e.target.value)} disabled={isLoading}/>
              <Input value={sidebarTextColor} onChange={(e)=>setSidebarTextColor(e.target.value)} disabled={isLoading}/>
            </div>
          </div>

          {/* Header Background */}
          <div className="space-y-2">
            <Label>Header Background</Label>
            <div className="flex gap-4 items-center">
              <Input type="color" className="w-20 h-12 cursor-pointer" value={headerBgColor} onChange={(e)=>setHeaderBgColor(e.target.value)} disabled={isLoading}/>
              <Input value={headerBgColor} onChange={(e)=>setHeaderBgColor(e.target.value)} disabled={isLoading}/>
            </div>
          </div>

          {/* Header Text */}
          <div className="space-y-2">
            <Label>Header Text</Label>
            <div className="flex gap-4 items-center">
              <Input type="color" className="w-20 h-12 cursor-pointer" value={headerTextColor} onChange={(e)=>setHeaderTextColor(e.target.value)} disabled={isLoading}/>
              <Input value={headerTextColor} onChange={(e)=>setHeaderTextColor(e.target.value)} disabled={isLoading}/>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleResetColors}
              variant="outline"
              disabled={isLoading}
            >
              {resetColorsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to default values
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Alert className="flex-1 max-w-2xl">
          <Palette className="h-4 w-4" />
          <AlertDescription>
            Only administrators can modify customization settings. Changes will be saved in the database and applied to all users.
          </AlertDescription>
        </Alert>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          size="lg"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
