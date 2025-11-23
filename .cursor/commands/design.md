# Design System Guide

Universal design guide for building modern, accessible, and responsive desktop applications using shadcn/ui 3.5.0, Tailwind CSS v4.1.17, Vite 7.2.4, and React 19.

## Core Principle

**Use shadcn registry MCP for all the design.** Always leverage the MCP (Model Context Protocol) integration for accessing shadcn/ui components and patterns.

## Tech Stack

- **shadcn/ui**: 3.5.0 (Neutral style)
- **Tailwind CSS**: v4.1.17
- **React**: 19
- **Vite**: 7.2.4
- **Target Platform**: Desktop (non-mobile)

---

## shadcn/ui Components Reference

### Complete Component List

The following components are available in shadcn/ui. Use shadcn registry MCP to add and configure these components.

#### Navigation & Layout
- **Breadcrumb**: Display hierarchical navigation paths, use for deep navigation structures
- **Menubar**: Horizontal menu bar for primary actions, ideal for desktop applications
- **Navigation Menu**: Multi-level navigation with dropdowns, use for main site navigation
- **Sidebar**: Persistent side navigation panel, essential for desktop app layouts
- **Separator**: Visual divider between content sections

#### Content Display
- **Accordion**: Collapsible content sections, perfect for FAQs and nested information
- **Alert**: Display important messages (info, warning, error, success)
- **Alert Dialog**: Modal confirmation dialogs for critical actions
- **Aspect Ratio**: Maintain consistent image/video ratios across viewports
- **Avatar**: User profile images with fallback support
- **Badge**: Small status indicators and labels
- **Card**: Flexible content container with header, body, and footer sections
- **Carousel**: Image/content sliders with navigation controls
- **Chart**: Data visualization components for dashboards
- **Empty**: Placeholder state for empty data sets
- **Hover Card**: Contextual information on hover, use sparingly
- **Typography**: Consistent text styling (headings, paragraphs, lists)

#### Forms & Input
- **Button**: Primary interactive elements, use variants (default, destructive, outline, secondary, ghost, link)
- **Button Group**: Related action clustering
- **Calendar**: Date selection interface
- **Checkbox**: Multi-select options with indeterminate state support
- **Combobox**: Searchable select dropdown
- **Command**: Command palette for keyboard shortcuts
- **Date Picker**: Calendar-based date input
- **Field**: Form field wrapper with label and error handling
- **Form**: Form validation and state management wrapper
- **Input**: Text input fields with validation
- **Input Group**: Related input clustering with addons
- **Input Mask**: Formatted input (phone, credit card, etc.)
- **Input OTP**: One-time password input
- **Label**: Accessible form labels
- **Native Select**: Standard HTML select dropdown
- **Radio Group**: Single-select from multiple options
- **Select**: Enhanced dropdown selection
- **Slider**: Range input for numeric values
- **Switch**: Toggle between two states (on/off)
- **Textarea**: Multi-line text input with auto-resize support

#### Overlays & Dialogs
- **Context Menu**: Right-click contextual actions
- **Dialog**: Modal dialogs for focused tasks
- **Drawer**: Slide-in panel from screen edge
- **Dropdown Menu**: Contextual action menus
- **Popover**: Floating content panel triggered by interaction
- **Sheet**: Similar to drawer, use for side panels
- **Toast**: Temporary notifications (non-blocking)
- **Tooltip**: Brief explanatory text on hover

#### Data & Tables
- **Data Table**: Feature-rich tables with sorting, filtering, pagination
- **Table**: Basic table structure
- **Pagination**: Navigate through paginated content

#### Feedback & Progress
- **Progress**: Linear progress indicator for loading states
- **Skeleton**: Loading placeholder that mimics content structure
- **Spinner**: Circular loading indicator
- **Sonner**: Enhanced toast notification system

#### Interaction
- **Collapsible**: Show/hide content sections
- **Item**: List item component
- **Kbd**: Keyboard shortcut display
- **Resizable**: User-adjustable panel sizes
- **Scroll Area**: Custom scrollbar styling
- **Tabs**: Organize content into switchable views
- **Toggle**: Single button toggle state
- **Toggle Group**: Multiple related toggle buttons

---

## Tailwind CSS v4 Best Practices

### Core Principles

1. **Utility-First Approach**: Build interfaces directly in markup using utility classes
2. **Component Extraction**: Extract repeated patterns into reusable components
3. **CSS Variables**: Leverage Tailwind v4's theme variables for dynamic values
4. **Modern CSS Features**: Take advantage of cascade layers, registered properties, color-mix()

### Configuration (CSS-First)

Tailwind v4 uses CSS-first configuration. Define customizations in your CSS file:

```css
@import "tailwindcss";

@theme {
  --font-display: "Inter", sans-serif;
  --breakpoint-3xl: 1920px;

  /* Custom colors */
  --color-brand-50: oklch(0.98 0.02 250);
  --color-brand-500: oklch(0.55 0.20 250);
  --color-brand-900: oklch(0.25 0.08 250);

  /* Custom spacing */
  --spacing: 0.25rem;

  /* Custom easing */
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
}
```

### Essential Utility Classes

#### Layout
- **Container Queries**: `@container`, `@sm:grid-cols-3`, `@max-md:grid-cols-1`
- **Flexbox**: `flex`, `flex-col`, `flex-row`, `items-center`, `justify-between`, `gap-4`
- **Grid**: `grid`, `grid-cols-3`, `grid-cols-[200px_1fr]`, `gap-6`
- **Spacing**: `p-4`, `px-6`, `py-3`, `m-4`, `mx-auto`, `space-y-4`
- **Sizing**: `w-full`, `w-1/2`, `h-screen`, `min-h-0`, `max-w-7xl`

#### Typography
- **Font Size**: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- **Font Weight**: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- **Line Height**: `leading-tight`, `leading-normal`, `leading-relaxed`
- **Text Color**: `text-foreground`, `text-muted-foreground`, `text-destructive`
- **Text Align**: `text-left`, `text-center`, `text-right`

#### Colors & Backgrounds
- **Background**: `bg-background`, `bg-card`, `bg-primary`, `bg-muted`
- **Borders**: `border`, `border-2`, `border-input`, `rounded-md`, `rounded-lg`
- **Opacity**: `opacity-50`, `bg-primary/50` (50% opacity)
- **Gradients**: `bg-linear-to-r`, `bg-radial-at-center`, `bg-conic-from-0deg`
- **Color Interpolation**: `bg-linear-to-r/oklch` (vivid gradients)

#### Interactive States
- **Hover**: `hover:bg-primary/90`, `hover:scale-105`
- **Focus**: `focus:outline-none`, `focus-visible:ring-2`, `focus-visible:ring-ring`
- **Active**: `active:scale-95`
- **Disabled**: `disabled:opacity-50`, `disabled:pointer-events-none`
- **Group Hover**: `group-hover:opacity-100`
- **Not Variant**: `not-hover:opacity-75`, `not-focus:border-transparent`

#### Responsive Design
- **Breakpoints**: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Single Breakpoint**: `md:max-lg:text-xl` (target only md)
- **Container Queries**: `@md:`, `@lg:`, `@min-md:@max-xl:hidden`

#### Effects & Transforms
- **Shadow**: `shadow-sm`, `shadow-md`, `shadow-lg`, `inset-shadow-sm`
- **Transitions**: `transition-colors`, `duration-200`, `ease-fluid`
- **3D Transforms**: `rotate-x-45`, `rotate-y-90`, `translate-z-4`, `scale-z-110`
- **Animations**: `animate-spin`, `animate-pulse`, `@starting-style:opacity-0`

#### Accessibility
- **Screen Readers**: `sr-only`, `not-sr-only`
- **Focus Indicators**: `focus-visible:ring-2`, `focus-visible:ring-offset-2`
- **Contrast**: Use color contrast checking tools
- **ARIA**: Combine with proper ARIA attributes in JSX

### Dynamic Values

Tailwind v4 supports dynamic values without arbitrary syntax:

```html
<!-- Grid columns -->
<div class="grid grid-cols-15">

<!-- Custom spacing -->
<div class="mt-17 w-29 pr-42">

<!-- Data attributes -->
<div data-active class="opacity-75 data-active:opacity-100">
```

### Performance Optimization

- **Purging**: Automatic in v4 with improved content detection
- **JIT Compiler**: Built-in, compiles only used utilities
- **Class Sorting**: Use `prettier-plugin-tailwindcss` for consistent ordering
- **Avoid @apply**: Prefer utility classes directly in markup for better performance

---

## Design Principles

### Modern & Clean Interface

1. **Whitespace**: Use generous spacing (`space-y-6`, `gap-8`) for breathing room
2. **Hierarchy**: Clear visual hierarchy with typography scale and color contrast
3. **Minimalism**: Remove unnecessary elements, focus on content
4. **Consistency**: Use design tokens from theme variables consistently

### Responsive Design (Desktop-First)

Since this is a desktop application:

1. **Base Design**: Optimize for desktop viewports (1280px - 1920px)
2. **Fluid Layouts**: Use percentage-based widths and max-widths
3. **Flexible Grids**: Prefer CSS Grid for complex layouts
4. **Container Queries**: Use `@container` for component-level responsiveness

```html
<div class="@container">
  <div class="grid grid-cols-1 @lg:grid-cols-3 @2xl:grid-cols-4 gap-6">
    <!-- Content -->
  </div>
</div>
```

### Intuitive User Experience

1. **Predictable Interactions**: Hover states, active states, focus indicators
2. **Visual Feedback**: Loading states (skeleton, spinner), success/error messages
3. **Keyboard Navigation**: Full keyboard support with visible focus indicators
4. **Contextual Actions**: Use context menus and dropdown menus appropriately

### Color System

#### Using shadcn/ui Neutral Style

The neutral color palette provides excellent contrast and works well for both light and dark modes.

**Key Color Variables:**
- `--background`: Page background
- `--foreground`: Primary text color
- `--card`: Card backgrounds
- `--card-foreground`: Card text
- `--popover`: Popover backgrounds
- `--primary`: Primary action color
- `--primary-foreground`: Primary text on primary background
- `--secondary`: Secondary action color
- `--muted`: Muted backgrounds
- `--muted-foreground`: Muted text
- `--accent`: Accent color for highlights
- `--destructive`: Error/danger actions
- `--border`: Border color
- `--input`: Input border color
- `--ring`: Focus ring color

**Usage:**
```html
<div class="bg-card text-card-foreground border-border">
  <button class="bg-primary text-primary-foreground hover:bg-primary/90">
    Action
  </button>
</div>
```

#### P3 Color Palette (Tailwind v4)

Tailwind v4 uses OKLCH color space for more vivid colors:

```css
@theme {
  /* Custom brand colors in OKLCH */
  --color-brand-500: oklch(0.55 0.20 250);
  --color-brand-600: oklch(0.45 0.18 250);
}
```

Use `color-mix()` for opacity adjustments:
```html
<div class="bg-primary/50"><!-- 50% opacity --></div>
```

---

## Dark Mode / Light Mode Implementation

### System Preference Detection

Use `prefers-color-scheme` media query and provide manual toggle:

```tsx
// React 19 example
import { useEffect, useState } from 'react';

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return { theme, setTheme };
}
```

### Best Practices

1. **User Choice**: Always provide a toggle to override system preference
2. **Avoid Pure Black/White**: Use `#121212` (dark) and `#FAFAFA` (light) for softer appearance
3. **Contrast Standards**: Maintain 4.5:1 for normal text, 3:1 for large text
4. **State Visibility**: Ensure button/input states are distinguishable in both modes
5. **Elevation in Dark Mode**: Use lighter shades for elevated surfaces
6. **Image Handling**: Use muted colors for images in dark mode, avoid bright saturated colors
7. **Icon Contrast**: Use light/white icons on dark backgrounds
8. **Store Preference**: Save user's choice in localStorage

### Implementation with Tailwind

```html
<!-- Using dark: variant -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <button class="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700">
    Button
  </button>
</div>
```

### Color Scheme Utility

Tailwind v4 includes `color-scheme` utilities:

```html
<html class="color-scheme-light dark:color-scheme-dark">
```

This adjusts native browser UI elements (scrollbars, form controls) to match your theme.

---

## Accessibility Guidelines (WCAG 2.1)

### Four Core Principles (POUR)

1. **Perceivable**
   - Text alternatives for images (`alt` attributes)
   - Captions for media
   - Strong color contrast (4.5:1 minimum)
   - Logical content structure

2. **Operable**
   - Full keyboard accessibility
   - Visible focus indicators
   - No time limits unless necessary
   - Clear navigation structure

3. **Understandable**
   - Plain, clear language
   - Predictable interface behavior
   - Well-labeled forms with error messages
   - Consistent navigation

4. **Robust**
   - Semantic HTML
   - ARIA attributes when needed
   - Screen reader compatibility
   - Forward-compatible code

### Conformance Levels

- **Level A**: Minimum (must have)
- **Level AA**: Mid-range (should have) - **Target this level**
- **Level AAA**: Highest (nice to have)

### Implementation Checklist

#### Color & Contrast
```html
<!-- Good contrast -->
<button class="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
  Click Me
</button>
```

#### Keyboard Navigation
```html
<!-- Focusable and keyboard accessible -->
<div 
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
  Custom Button
</div>
```

#### ARIA Attributes
```html
<!-- Close button with aria-label -->
<button 
  aria-label="Close dialog"
  className="focus:outline-none focus-visible:ring-2"
>
  <XIcon />
</button>

<!-- Form with proper labels -->
<div>
  <Label htmlFor="email">Email Address</Label>
  <Input 
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <p id="email-error" role="alert" className="text-destructive text-sm">
      Please enter a valid email
    </p>
  )}
</div>
```

#### Semantic HTML
```html
<!-- Use semantic elements -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</main>

<aside aria-label="Related links">
  <!-- Sidebar content -->
</aside>
```

#### Headings Structure
```html
<!-- Logical nested structure -->
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
  <h2>Another Section</h2>
```

#### Skip Links
```html
<!-- Allow keyboard users to skip navigation -->
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground">
  Skip to main content
</a>

<main id="main-content">
  <!-- Page content -->
</main>
```

---

## React 19 Best Practices

### Automatic Memoization

React 19's compiler handles memoization automatically. Remove unnecessary optimizations:

```tsx
// ❌ Avoid (unnecessary in React 19)
const MemoizedComponent = React.memo(Component);
const memoizedValue = useMemo(() => computeValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => handleClick(), []);

// ✅ Prefer (let React 19 handle it)
function Component() {
  const value = computeValue(a, b);
  const handleClick = () => { /* ... */ };
  return <div onClick={handleClick}>{value}</div>;
}
```

### Keep Components Small

Small, focused components maximize compiler optimizations:

```tsx
// ✅ Good - focused components
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <UserAvatar user={user} />
        <UserName name={user.name} />
      </CardHeader>
      <CardContent>
        <UserDetails user={user} />
      </CardContent>
    </Card>
  );
}
```

### Optimize Asset Loading

```tsx
// ✅ Lazy load heavy components
const Chart = React.lazy(() => import('./Chart'));

function Dashboard() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Chart data={data} />
    </Suspense>
  );
}
```

### Local State Management

Keep state as local as possible:

```tsx
// ✅ Custom hooks for reusable logic
function useToggle(initial = false) {
  const [state, setState] = useState(initial);
  const toggle = () => setState(prev => !prev);
  return [state, toggle] as const;
}

function Component() {
  const [isOpen, toggleOpen] = useToggle(false);
  return <Dialog open={isOpen} onOpenChange={toggleOpen}>...</Dialog>;
}
```

### Form Handling

Use React 19's improved form features with shadcn/ui Form component:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## Layout Patterns

### Sidebar Layout

```tsx
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div class="flex h-screen">
      <Sidebar className="w-64 border-r">
        <SidebarContent />
      </Sidebar>
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
```

### Dashboard Grid

```tsx
function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Metric 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,234</p>
          </CardContent>
        </Card>
        {/* More cards */}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Activity list */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Modal Dialog

```tsx
function ActionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Data Table

```tsx
function UsersTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge>{user.role}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

---

## Component Composition Patterns

### Compound Components

```tsx
// Use shadcn components' compound pattern
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Polymorphic Components

```tsx
// Button as different elements
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

### Controlled vs Uncontrolled

```tsx
// Controlled (for forms with validation)
<Input 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// Uncontrolled (for simple forms)
<Input defaultValue="default" />
```

---

## Performance Optimization

### Code Splitting

```tsx
// Route-based splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### Loading States

```tsx
function DataView() {
  const { data, isLoading } = useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return <DataTable data={data} />;
}
```

### Progressive Enhancement

```tsx
// Show low-quality placeholder, then full image
<img
  src={thumbnailUrl}
  data-src={fullUrl}
  className="transition-opacity duration-300"
  onLoad={handleFullImageLoad}
/>
```

---

## Error Handling

### Form Errors

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input 
          type="email" 
          {...field}
          className={fieldState.error ? "border-destructive" : ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Toast Notifications

```tsx
import { toast } from "sonner";

function handleSubmit() {
  try {
    await submitData();
    toast.success("Data saved successfully");
  } catch (error) {
    toast.error("Failed to save data", {
      description: error.message,
    });
  }
}
```

### Error Boundaries

```tsx
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button onClick={resetErrorBoundary} variant="outline" size="sm">
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <MyComponent />
</ErrorBoundary>
```

---

## Animation & Transitions

### Using Tailwind Transitions

```html
<!-- Smooth hover effect -->
<button class="transition-all duration-200 hover:scale-105 active:scale-95">
  Hover me
</button>

<!-- Color transition -->
<div class="bg-primary transition-colors duration-300 hover:bg-primary/90">
  Content
</div>

<!-- @starting-style for enter animations -->
<div class="opacity-100 starting:opacity-0 transition-opacity duration-500">
  Animated content
</div>
```

### Component Animations

```tsx
// Use shadcn's built-in animations
<Dialog>
  <DialogContent className="data-[state=open]:animate-in data-[state=closed]:animate-out">
    {/* Content with smooth enter/exit */}
  </DialogContent>
</Dialog>
```

---

## Testing Considerations

### Accessibility Testing
- Use keyboard-only navigation
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Check color contrast with tools
- Validate HTML semantics

### Visual Testing
- Test both light and dark modes
- Check at various viewport sizes
- Verify hover/focus/active states
- Test with different zoom levels (125%, 150%)

### Component Testing
- Test form validation
- Test error states
- Test loading states
- Test empty states

---

## Quick Reference

### Common Patterns

```tsx
// Loading state with skeleton
{isLoading ? <Skeleton className="h-32 w-full" /> : <Content />}

// Empty state
{items.length === 0 && (
  <Empty 
    title="No items found"
    description="Get started by creating a new item"
    action={<Button>Create Item</Button>}
  />
)}

// Confirmation dialog
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// Context menu
<ContextMenu>
  <ContextMenuTrigger>Right click me</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Edit</ContextMenuItem>
    <ContextMenuItem>Duplicate</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem className="text-destructive">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

## Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com
- **Tailwind CSS v4 Documentation**: https://tailwindcss.com
- **React 19 Documentation**: https://react.dev
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/

---

## Final Notes

1. **Always use shadcn registry MCP** for component management
2. **Maintain neutral style** across all shadcn components
3. **Follow Tailwind best practices**: utility-first, avoid @apply unless necessary
4. **Ensure WCAG AA compliance** minimum
5. **Test in both light and dark modes**
6. **Keep components small and focused** for React 19 optimizations
7. **Use semantic HTML** and proper ARIA attributes
8. **Provide clear visual feedback** for all user interactions
9. **Optimize for desktop viewports** (1280px - 1920px primary range)
10. **Leverage modern CSS features** available in Tailwind v4

This guide should serve as a comprehensive reference for building consistent, accessible, and modern desktop applications.
