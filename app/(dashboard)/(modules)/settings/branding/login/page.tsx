"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Palette, RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function LoginBrandingPage() {
  const { toast } = useToast()
  
  const [backgroundImage, setBackgroundImage] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [customCss, setCustomCss] = useState("")
  const [showLogo, setShowLogo] = useState(true)
  const [logoPosition, setLogoPosition] = useState<"top" | "center" | "left">("top")

  const { data: loginBranding, refetch, isLoading } = api.tenant.getLoginBranding.useQuery()

  useEffect(() => {
    if (loginBranding) {
      const config = loginBranding as any
      setBackgroundImage(config.backgroundImage || "")
      setWelcomeMessage(config.welcomeMessage || "")
      setCustomCss(config.customCss || "")
      setShowLogo(config.showLogo !== false)
      setLogoPosition(config.logoPosition || "top")
    }
  }, [loginBranding])

  const updateMutation = api.tenant.updateLoginBranding.useMutation({
    onSuccess: () => {
      toast({
        title: "Login Branding Updated",
        description: "Your login page branding has been saved successfully.",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update login branding.",
        variant: "destructive",
      })
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      backgroundImage: backgroundImage || null,
      welcomeMessage: welcomeMessage || null,
      customCss: customCss || null,
      showLogo,
      logoPosition,
    })
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset login branding to defaults?")) {
      setBackgroundImage("")
      setWelcomeMessage("")
      setCustomCss("")
      setShowLogo(true)
      setLogoPosition("top")
      updateMutation.mutate({
        backgroundImage: null,
        welcomeMessage: null,
        customCss: null,
        showLogo: true,
        logoPosition: "top",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Login Page Branding"
        description="Customize the appearance of your login page for a white-label experience"
      />

      <Card>
        <CardHeader>
          <CardTitle>Logo Configuration</CardTitle>
          <CardDescription>
            Control how your logo appears on the login page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showLogo">Show Logo</Label>
              <p className="text-sm text-muted-foreground">
                Display your organization's logo on the login page
              </p>
            </div>
            <Switch
              id="showLogo"
              checked={showLogo}
              onCheckedChange={setShowLogo}
            />
          </div>

          {showLogo && (
            <div className="space-y-2">
              <Label htmlFor="logoPosition">Logo Position</Label>
              <select
                id="logoPosition"
                value={logoPosition}
                onChange={(e) => setLogoPosition(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="top">Top Center</option>
                <option value="center">Center</option>
                <option value="left">Top Left</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Choose where to display the logo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background & Welcome Message</CardTitle>
          <CardDescription>
            Customize the background and welcome text for your login page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="backgroundImage">Background Image URL</Label>
            <Input
              id="backgroundImage"
              value={backgroundImage}
              onChange={(e) => setBackgroundImage(e.target.value)}
              placeholder="https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
              type="url"
            />
            <p className="text-sm text-muted-foreground">
              URL to a background image for the login page. Leave empty for default gradient.
            </p>
            {backgroundImage && (
              <div className="mt-4 relative w-full h-40 border rounded-lg overflow-hidden">
                <img
                  src={backgroundImage}
                  alt="Background preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome back! Sign in to continue to your dashboard."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Custom welcome text displayed on the login page
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
          <CardDescription>
            Add custom CSS to further customize the login page appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customCss">CSS Styles</Label>
            <Textarea
              id="customCss"
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              placeholder={`.login-container {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n}\n\n.login-card {\n  box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n}`}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Advanced: Add custom CSS to override default styles. Be careful with this option.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">
              ⚠️ Advanced Feature
            </h4>
            <p className="text-sm text-yellow-800">
              Custom CSS can significantly alter the appearance of your login page. Test
              thoroughly before deploying to production. Invalid CSS may break the layout.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Visual preview of your login page customizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="relative w-full h-80 border rounded-lg overflow-hidden"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
                {showLogo && logoPosition === "top" && (
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-gray-800">Logo</div>
                  </div>
                )}
                {showLogo && logoPosition === "left" && (
                  <div className="mb-6">
                    <div className="text-xl font-bold text-gray-800">Logo</div>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  {showLogo && logoPosition === "center" ? "Logo" : "Sign In"}
                </h2>
                <p className="text-gray-600 text-center mb-6 text-sm">
                  {welcomeMessage || "Welcome back! Sign in to continue."}
                </p>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-blue-500 rounded" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={updateMutation.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Palette className="mr-2 h-4 w-4" />
              Save Branding
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
