# SweetSpot Cowork - Design System

## 🎨 Design Philosophy

**Inspired by the Opportunities module**, our design system emphasizes:
- **Modern gradients** with purple-to-indigo transitions
- **Clean shadows** for depth and elevation
- **Consistent spacing** and typography
- **Smooth animations** and hover effects
- **Professional CRM aesthetics**

---

## 🌈 Color System

### Primary Brand Colors
```css
/* Using shadcn/ui CSS variables */
--brand-purple: 262 83% 58%;     /* #8B5CF6 - Primary purple */
--brand-blue: 217 91% 60%;       /* #3B82F6 - Primary blue */
--brand-green: 142 76% 36%;      /* #10B981 - Success green */
```

### Theme-specific Applications
```css
/* CRM Module Colors */
.opportunities-theme {
  --primary: var(--brand-purple);
  --secondary: 262 50% 95%;      /* Light purple background */
  --accent: 262 100% 98%;        /* Very light purple accent */
}

.leads-theme {
  --primary: var(--brand-blue);
  --secondary: 217 50% 95%;      /* Light blue background */
  --accent: 217 100% 98%;        /* Very light blue accent */
}

.activities-theme {
  --primary: var(--brand-green);
  --secondary: 142 50% 95%;      /* Light green background */
  --accent: 142 100% 98%;        /* Very light green accent */
}
```

---

## 🎭 Component Patterns

### 1. Stats Cards
```jsx
// Standard stats card with gradient background
<Card className="hover-lift transition-theme">
  <CardContent className="p-6">
    <div className="flex items-center">
      <Icon className="h-8 w-8 text-brand-purple" />
      <div className="ml-4">
        <p className="text-sm font-medium text-muted-foreground">Label</p>
        <p className="text-2xl font-bold text-foreground">Value</p>
        <p className="text-xs text-success flex items-center mt-1">
          <TrendingUp className="h-3 w-3 mr-1" />
          Change indicator
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. Section Headers
```jsx
// Consistent section header with gradient background
<div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <Icon className="h-6 w-6 text-brand-purple" />
      <div>
        <h3 className="text-lg font-semibold text-foreground">Section Title</h3>
        <p className="text-sm text-muted-foreground">Section description</p>
      </div>
    </div>
    <Button className="bg-brand-purple hover:bg-brand-purple/90">
      <Icon className="h-4 w-4 mr-2" />
      Action
    </Button>
  </div>
</div>
```

### 3. Action Buttons
```jsx
// Primary action button
<Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple">
  <Icon className="h-4 w-4 mr-2" />
  Primary Action
</Button>

// Secondary action button
<Button variant="outline" className="border-brand-purple text-brand-purple hover:bg-brand-purple/10">
  <Icon className="h-4 w-4 mr-2" />
  Secondary Action
</Button>
```

### 4. Modal Headers
```jsx
// Consistent modal header with gradient
<div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 border-b">
  <DialogHeader>
    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
      <div className="h-10 w-10 rounded-full bg-brand-purple flex items-center justify-center">
        <Icon className="h-5 w-5 text-white" />
      </div>
      Modal Title
    </DialogTitle>
    <DialogDescription className="text-muted-foreground mt-2">
      Modal description text
    </DialogDescription>
  </DialogHeader>
</div>
```

---

## 🎪 Animation & Effects

### Hover Effects
```css
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
}
```

### Gradient Backgrounds
```css
/* Section backgrounds */
.bg-gradient-purple {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.bg-gradient-purple-light {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
}

/* Button gradients */
.btn-gradient-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}
```

### Shadow System
```css
.shadow-soft {
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
}

.shadow-purple {
  box-shadow: 0 4px 16px 0 rgba(139, 92, 246, 0.15);
}

.shadow-strong {
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
}
```

---

## 📐 Spacing & Layout

### Standard Spacing
```css
/* Section padding */
.section-padding { padding: 1.5rem; }      /* 24px */
.section-margin { margin-bottom: 2rem; }   /* 32px */

/* Card spacing */
.card-padding { padding: 1.5rem; }         /* 24px */
.card-gap { gap: 1.5rem; }                 /* 24px */

/* Grid spacing */
.grid-gap { gap: 1.5rem; }                 /* 24px */
```

### Responsive Breakpoints
```css
/* Mobile First */
.grid-responsive {
  grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 🔤 Typography

### Headings
```css
.heading-xl {
  font-size: 2rem;          /* 32px */
  font-weight: 700;
  line-height: 1.2;
}

.heading-lg {
  font-size: 1.5rem;        /* 24px */
  font-weight: 600;
  line-height: 1.3;
}

.heading-md {
  font-size: 1.25rem;       /* 20px */
  font-weight: 600;
  line-height: 1.4;
}
```

### Body Text
```css
.text-body {
  font-size: 0.875rem;      /* 14px */
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem;       /* 12px */
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
}
```

---

## 🧩 Component Library

### Page Structure
```jsx
// Standard page layout
<div className="min-h-screen bg-background">
  <AppHeader 
    currentPage="Page Title"
    showBreadcrumb={true}
    breadcrumbItems={[{ label: 'Page Title' }]}
  />
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </main>
</div>
```

### Stats Grid
```jsx
// Responsive stats grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {/* Stats cards */}
</div>
```

### Section Layout
```jsx
// Standard section with header and content
<div className="mb-8">
  <Card className="shadow-soft">
    {/* Section header with gradient */}
    <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
      {/* Header content */}
    </div>
    {/* Section content */}
    <div className="p-6">
      {/* Content */}
    </div>
  </Card>
</div>
```

---

## 🎯 Implementation Guidelines

### 1. Always Use Theme Variables
```jsx
// ✅ Good - Uses theme variables
<Button className="bg-brand-purple">Action</Button>

// ❌ Bad - Hardcoded colors
<Button className="bg-purple-600">Action</Button>
```

### 2. Consistent Spacing
```jsx
// ✅ Good - Consistent spacing
<div className="p-6 space-y-6">

// ❌ Bad - Inconsistent spacing
<div className="p-4 space-y-8">
```

### 3. Proper Shadow Usage
```jsx
// ✅ Good - Appropriate shadow
<Card className="shadow-soft hover:shadow-medium">

// ❌ Bad - Too strong shadow
<Card className="shadow-2xl">
```

### 4. Animation Consistency
```jsx
// ✅ Good - Smooth transitions
<Button className="transition-all duration-200 hover-lift">

// ❌ Bad - Jarring animations
<Button className="transition-all duration-1000">
```

---

## 🚀 Quick Start Checklist

When creating a new page or component:

- [ ] Use `bg-background` for main background
- [ ] Apply `shadow-soft` for cards
- [ ] Use gradient backgrounds for section headers
- [ ] Include hover effects with `hover-lift`
- [ ] Apply consistent spacing (`p-6`, `space-y-6`)
- [ ] Use theme variables for colors
- [ ] Add appropriate transitions
- [ ] Test in both light and dark modes
- [ ] Ensure responsive design
- [ ] Validate accessibility

---

## 📱 Mobile Considerations

### Touch Targets
- Minimum 44px touch targets
- Adequate spacing between interactive elements
- Clear visual feedback for interactions

### Layout Adjustments
- Stack components vertically on mobile
- Reduce padding on smaller screens
- Ensure text remains readable

### Performance
- Optimize images and animations
- Use CSS transforms for smooth animations
- Minimize layout shifts

This design system ensures consistency across all SweetSpot Cowork modules while maintaining the professional, modern aesthetic established by the opportunities module.