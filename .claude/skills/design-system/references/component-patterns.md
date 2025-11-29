# Component Patterns Reference

Reusable component patterns for consistent UI. All patterns use semantic tokens.

## Table of Contents

- [Button Patterns](#button-patterns)
- [Card Patterns](#card-patterns)
- [Form Patterns](#form-patterns)
- [Navigation Patterns](#navigation-patterns)
- [Modal & Dialog Patterns](#modal--dialog-patterns)
- [Data Display Patterns](#data-display-patterns)
- [Feedback Patterns](#feedback-patterns)
- [Layout Patterns](#layout-patterns)

## Button Patterns

### Standard Variants

```tsx
import { Button } from "@/components/ui/button"

// Primary - Main actions
<Button>Submit</Button>

// Secondary - Supporting actions
<Button variant="secondary">Save Draft</Button>

// Destructive - Dangerous actions
<Button variant="destructive">Delete</Button>

// Outline - Subtle actions
<Button variant="outline">Cancel</Button>

// Ghost - Minimal emphasis
<Button variant="ghost">Back</Button>

// Link - Text-only
<Button variant="link">Learn more</Button>
```

### Size Variants

```tsx
<Button size="sm">Small</Button>    {/* px-3 py-1.5 */}
<Button size="default">Default</Button>  {/* px-4 py-2 */}
<Button size="lg">Large</Button>    {/* px-6 py-3 */}
<Button size="icon">             {/* Square icon button */}
  <Plus className="h-4 w-4" />
</Button>
```

### Button with Icon

```tsx
import { Plus, Loader2 } from "lucide-react"

// Leading icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  New Item
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>
```

### Button Group

```tsx
<div className="flex gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Confirm</Button>
</div>

// Right-aligned
<div className="flex justify-end gap-2">
  <Button variant="ghost">Cancel</Button>
  <Button>Save Changes</Button>
</div>
```

## Card Patterns

### Basic Card

```tsx
<div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-4">
  <h3 className="font-semibold">Title</h3>
  <p className="text-sm text-muted-foreground mt-2">Description</p>
</div>
```

### Card with Header and Footer

```tsx
<div className="rounded-2xl border bg-card overflow-hidden">
  {/* Header */}
  <div className="border-b bg-muted/50 px-4 py-3">
    <h3 className="font-semibold">Card Title</h3>
  </div>
  
  {/* Content */}
  <div className="p-4 space-y-3">
    <p className="text-sm">Card content here</p>
  </div>
  
  {/* Footer */}
  <div className="border-t bg-muted/50 px-4 py-3 flex justify-end gap-2">
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Save</Button>
  </div>
</div>
```

### Interactive Card

```tsx
<div className="rounded-2xl border bg-card p-4 transition-all 
                hover:shadow-md hover:border-primary/50 cursor-pointer">
  <h3 className="font-semibold">Clickable Card</h3>
  <p className="text-sm text-muted-foreground mt-1">Click to expand</p>
</div>
```

### Metric/Stats Card

```tsx
<div className="rounded-2xl border bg-card p-4 space-y-1">
  <p className="text-sm text-muted-foreground">Revenue</p>
  <p className="text-3xl font-bold">€24,500</p>
  <p className="text-xs text-muted-foreground flex items-center gap-1">
    <span className="text-green-500">↑ 12%</span>
    from last month
  </p>
</div>
```

### Status Card

```tsx
<div className="rounded-2xl border bg-card p-4">
  <div className="flex items-center gap-2">
    <div className="h-2 w-2 rounded-full bg-green-500" />
    <span className="text-sm font-medium">Active</span>
  </div>
  <p className="text-sm text-muted-foreground mt-2">System operational</p>
</div>
```

## Form Patterns

### Basic Field

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

### Field with Helper Text

```tsx
<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input id="username" placeholder="johndoe" />
  <p className="text-sm text-muted-foreground">
    This will be your public display name
  </p>
</div>
```

### Field with Error

```tsx
<div className="space-y-2">
  <Label htmlFor="password" className="text-destructive">Password</Label>
  <Input 
    id="password" 
    type="password"
    className="border-destructive focus-visible:ring-destructive"
  />
  <p className="text-sm text-destructive">
    Password must be at least 8 characters
  </p>
</div>
```

### Select Field

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<div className="space-y-2">
  <Label>Priority</Label>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select priority" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="low">Low</SelectItem>
      <SelectItem value="medium">Medium</SelectItem>
      <SelectItem value="high">High</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Textarea Field

```tsx
import { Textarea } from "@/components/ui/textarea"

<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea 
    id="description" 
    placeholder="Enter description..."
    rows={4}
  />
</div>
```

### Checkbox Field

```tsx
import { Checkbox } from "@/components/ui/checkbox"

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
    I accept the terms and conditions
  </Label>
</div>
```

### Form Layout

```tsx
<form className="space-y-6">
  {/* Field groups */}
  <div className="space-y-4">
    {/* Individual fields */}
  </div>
  
  {/* Form actions */}
  <div className="flex justify-end gap-2 pt-4 border-t">
    <Button type="button" variant="outline">Cancel</Button>
    <Button type="submit">Submit</Button>
  </div>
</form>
```

## Navigation Patterns

### Top Navigation Bar

```tsx
<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
  <div className="container mx-auto flex h-16 items-center justify-between px-4">
    <div className="font-bold text-xl">Logo</div>
    
    <nav className="hidden md:flex items-center gap-6">
      <a href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
        Dashboard
      </a>
      <a href="/settings" className="text-sm font-medium hover:text-primary transition-colors">
        Settings
      </a>
    </nav>
    
    <Button size="sm">New Project</Button>
  </div>
</header>
```

### Sidebar Navigation

```tsx
<aside className="w-64 border-r bg-muted/30 min-h-screen">
  <div className="p-4 border-b">
    <h2 className="font-bold text-lg">App Name</h2>
  </div>
  
  <nav className="p-2 space-y-1">
    {/* Active item */}
    <a href="/dashboard" 
       className="flex items-center gap-2 px-3 py-2 rounded-lg 
                  bg-primary text-primary-foreground">
      <Home className="h-4 w-4" />
      <span className="text-sm font-medium">Dashboard</span>
    </a>
    
    {/* Inactive item */}
    <a href="/projects"
       className="flex items-center gap-2 px-3 py-2 rounded-lg 
                  text-foreground hover:bg-accent transition-colors">
      <Folder className="h-4 w-4" />
      <span className="text-sm font-medium">Projects</span>
    </a>
  </nav>
</aside>
```

### Breadcrumbs

```tsx
<nav className="flex items-center gap-2 text-sm">
  <a href="/" className="text-muted-foreground hover:text-foreground">Home</a>
  <span className="text-muted-foreground">/</span>
  <a href="/projects" className="text-muted-foreground hover:text-foreground">Projects</a>
  <span className="text-muted-foreground">/</span>
  <span className="text-foreground font-medium">Project-001</span>
</nav>
```

### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="overview" className="space-y-4">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="details">Details content</TabsContent>
  <TabsContent value="activity">Activity content</TabsContent>
</Tabs>
```

## Modal & Dialog Patterns

### Confirmation Dialog

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the item.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Form Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Create New</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Item</DialogTitle>
      <DialogDescription>Fill in the details below</DialogDescription>
    </DialogHeader>
    
    <form className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </div>
    </form>
    
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Data Display Patterns

### Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<div className="rounded-2xl border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="font-mono text-sm">001</TableCell>
        <TableCell>Item Name</TableCell>
        <TableCell>
          <span className="inline-flex items-center rounded-full 
                         bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600">
            Active
          </span>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">View</Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### List

```tsx
<ul className="space-y-2">
  {items.map((item) => (
    <li key={item.id} 
        className="flex items-center justify-between rounded-lg border bg-card p-4 
                   hover:bg-accent transition-colors">
      <div>
        <h4 className="font-medium">{item.title}</h4>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
      <Button variant="ghost" size="sm">→</Button>
    </li>
  ))}
</ul>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-3 mb-4">
    <FileText className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">No items yet</h3>
  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
    Get started by creating your first item
  </p>
  <Button>Create Item</Button>
</div>
```

### Status Badge

```tsx
import { cn } from "@/lib/utils"

function StatusBadge({ status }: { status: 'active' | 'pending' | 'error' }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
      status === 'active' && "bg-green-500/10 text-green-600",
      status === 'pending' && "bg-yellow-500/10 text-yellow-600",
      status === 'error' && "bg-destructive/10 text-destructive"
    )}>
      {status}
    </span>
  )
}
```

## Feedback Patterns

### Toast Notification

```tsx
import { useToast } from "@/components/ui/use-toast"

function Component() {
  const { toast } = useToast()
  
  const handleSave = () => {
    toast({
      title: "Saved",
      description: "Your changes have been saved successfully.",
    })
  }
  
  return <Button onClick={handleSave}>Save</Button>
}
```

### Loading Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton"

<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-3/4" />
</div>
```

### Progress Indicator

```tsx
import { Progress } from "@/components/ui/progress"

<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Progress</span>
    <span className="text-muted-foreground">75%</span>
  </div>
  <Progress value={75} />
</div>
```

### Alert

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

// Info alert
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>Important information here.</AlertDescription>
</Alert>

// Destructive alert
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

## Layout Patterns

### Page Container

```tsx
<div className="min-h-screen bg-background">
  <header className="sticky top-0 z-50 border-b bg-background">
    {/* Navigation */}
  </header>
  
  <main className="container mx-auto px-4 py-8">
    {/* Page content */}
  </main>
  
  <footer className="border-t bg-muted mt-12">
    {/* Footer */}
  </footer>
</div>
```

### Two-Column Layout

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Main content */}
    <div className="lg:col-span-8 space-y-6">
      {/* Primary content */}
    </div>
    
    {/* Sidebar */}
    <aside className="lg:col-span-4 space-y-6">
      {/* Secondary content */}
    </aside>
  </div>
</div>
```

### Dashboard Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Metric cards */}
  <div className="rounded-2xl border bg-card p-4">Metric 1</div>
  <div className="rounded-2xl border bg-card p-4">Metric 2</div>
  <div className="rounded-2xl border bg-card p-4">Metric 3</div>
  <div className="rounded-2xl border bg-card p-4">Metric 4</div>
</div>
```

## The cn() Utility

Always use `cn()` for conditional class merging:

```tsx
import { cn } from "@/lib/utils"

// Basic usage
<div className={cn("base-class", isActive && "active-class")}>

// With variants
<div className={cn(
  "rounded-lg border p-4",
  variant === "filled" && "bg-primary text-primary-foreground",
  variant === "outline" && "bg-transparent border-primary",
  className // User overrides last
)}>
```

### cn() Implementation

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
