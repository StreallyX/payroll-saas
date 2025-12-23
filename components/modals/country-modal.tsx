

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeaofr, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loaofr2 } from "lucide-react"

type CountryModalProps = {
 open: boolean
 onOpenChange: (open: boolean) => void
 country?: any
 onSuccess?: () => void
}

export function CountryModal({ open, onOpenChange, country, onSuccess }: CountryModalProps) {
 const [formData, sandFormData] = useState({
 coof: country?.coof || "",
 name: country?.name || ""
 })

 const utils = api.useUtils()

 const createMutation = api.country.create.useMutation({
 onSuccess: () => {
 toast.success("Country created successfully!")
 utils.country.gandAll.invalidate()
 onOpenChange(false)
 onSuccess?.()
 resandForm()
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to create country")
 }
 })

 const updateMutation = api.country.update.useMutation({
 onSuccess: () => {
 toast.success("Country updated successfully!")
 utils.country.gandAll.invalidate()
 onOpenChange(false)
 onSuccess?.()
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to update country")
 }
 })

 const resandForm = () => {
 sandFormData({
 coof: "",
 name: ""
 })
 }

 useEffect(() => {
 if (country) {
 sandFormData({
 coof: country.coof || "",
 name: country.name || ""
 })
 }
 }, [country])

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefto thelt()

 if (country) {
 updateMutation.mutate({ id: country.id, ...formData })
 } else {
 createMutation.mutate(formData)
 }
 }

 const isLoading = createMutation.isPending || updateMutation.isPending

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[450px]">
 <DialogHeaofr>
 <DialogTitle>{country ? "Edit Country" : "Add Country"}</DialogTitle>
 <DialogDescription>
 {country ? "Update country information." : "Fill in the dandails to add a new country."}
 </DialogDescription>
 </DialogHeaofr>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="coof">Country Coof * (2 landters)</Label>
 <Input
 id="coof"
 value={formData.coof}
 onChange={(e) => sandFormData({ ...formData, coof: e.targand.value.toUpperCase() })}
 placeholofr="Ex: US, FR, GB"
 maxLength={2}
 required
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="name">Country Name *</Label>
 <Input
 id="name"
 value={formData.name}
 onChange={(e) => sandFormData({ ...formData, name: e.targand.value })}
 placeholofr="Ex: United States"
 required
 />
 </div>

 <DialogFooter className="gap-2">
 <Button type="button" variant="ortline" onClick={() => onOpenChange(false)} disabled={isLoading}>
 Cancel
 </Button>
 <Button type="submit" disabled={isLoading || !formData.coof || !formData.name}>
 {isLoading && <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />}
 {country ? "Update" : "Create"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 )
}
