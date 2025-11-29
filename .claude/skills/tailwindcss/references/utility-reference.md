# Utility Class Reference

Quick reference for commonly used Tailwind CSS v4 utilities, organized by category.

## Layout

### Display

- `block` - Display block
- `inline-block` - Display inline-block
- `inline` - Display inline
- `flex` - Display flex
- `inline-flex` - Display inline-flex
- `grid` - Display grid
- `inline-grid` - Display inline-grid
- `hidden` - Display none
- `table` - Display table
- `flow-root` - Display flow-root

### Position

- `static` - Position static
- `fixed` - Position fixed
- `absolute` - Position absolute
- `relative` - Position relative
- `sticky` - Position sticky

### Top/Right/Bottom/Left

- `inset-0` - All sides 0
- `inset-x-4` - Left and right 1rem
- `inset-y-4` - Top and bottom 1rem
- `top-4`, `right-4`, `bottom-4`, `left-4` - Individual sides

### Z-Index

- `z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-50`
- `z-auto`

## Flexbox

### Direction

- `flex-row` - Horizontal (default)
- `flex-row-reverse` - Horizontal reversed
- `flex-col` - Vertical
- `flex-col-reverse` - Vertical reversed

### Wrap

- `flex-wrap` - Allow wrapping
- `flex-wrap-reverse` - Wrap reversed
- `flex-nowrap` - No wrapping (default)

### Justify Content

- `justify-start` - Pack items to start
- `justify-end` - Pack items to end
- `justify-center` - Center items
- `justify-between` - Space between items
- `justify-around` - Space around items
- `justify-evenly` - Space evenly

### Align Items

- `items-start` - Align to start
- `items-end` - Align to end
- `items-center` - Center items
- `items-baseline` - Align to baseline
- `items-stretch` - Stretch (default)

### Align Self

- `self-auto` - Inherit from parent
- `self-start`, `self-end`, `self-center`
- `self-stretch`, `self-baseline`

### Gap

- `gap-0`, `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`
- `gap-x-4` - Horizontal gap
- `gap-y-4` - Vertical gap

### Flex Grow/Shrink

- `flex-1` - Grow and shrink
- `flex-auto` - Auto flex
- `flex-initial` - Initial flex
- `flex-none` - No flex
- `grow` - Allow growing
- `grow-0` - No growing
- `shrink` - Allow shrinking
- `shrink-0` - No shrinking

## Grid

### Template Columns

- `grid-cols-1` to `grid-cols-12` - Number of columns
- `grid-cols-none` - No columns defined

### Template Rows

- `grid-rows-1` to `grid-rows-6` - Number of rows
- `grid-rows-none` - No rows defined

### Column/Row Span

- `col-span-1` to `col-span-12` - Column span
- `col-auto` - Auto span
- `col-span-full` - Span all columns
- `row-span-1` to `row-span-6` - Row span
- `row-auto`, `row-span-full`

### Grid Flow

- `grid-flow-row` - Fill by row
- `grid-flow-col` - Fill by column
- `grid-flow-dense` - Dense packing

### Auto Columns/Rows

- `auto-cols-auto`, `auto-cols-min`, `auto-cols-max`, `auto-cols-fr`
- `auto-rows-auto`, `auto-rows-min`, `auto-rows-max`, `auto-rows-fr`

## Spacing

### Padding

- `p-0` to `p-96` - All sides (p-4 = 1rem)
- `px-4` - Horizontal padding
- `py-4` - Vertical padding
- `pt-4`, `pr-4`, `pb-4`, `pl-4` - Individual sides

### Margin

- `m-0` to `m-96` - All sides
- `mx-4` - Horizontal margin
- `my-4` - Vertical margin
- `mt-4`, `mr-4`, `mb-4`, `ml-4` - Individual sides
- `m-auto` - Auto margin (centering)
- `-m-4` - Negative margin

### Space Between

- `space-x-4` - Horizontal space between children
- `space-y-4` - Vertical space between children

## Sizing

### Width

- `w-0` to `w-96` - Fixed widths
- `w-auto` - Auto width
- `w-full` - 100%
- `w-screen` - 100vw
- `w-1/2`, `w-1/3`, `w-2/3`, `w-1/4`, `w-3/4` - Fractions
- `w-fit`, `w-min`, `w-max` - Content sizing

### Height

- `h-0` to `h-96` - Fixed heights
- `h-auto` - Auto height
- `h-full` - 100%
- `h-screen` - 100vh
- `h-fit`, `h-min`, `h-max` - Content sizing

### Size (v4 new)

- `size-4` - Width and height (replaces w-4 h-4)
- `size-full` - 100% width and height

### Min/Max Width

- `min-w-0`, `min-w-full`, `min-w-fit`
- `max-w-xs`, `max-w-sm`, `max-w-md`, `max-w-lg`, `max-w-xl`, `max-w-2xl`
- `max-w-screen-sm`, `max-w-screen-md`, `max-w-screen-lg`

### Min/Max Height

- `min-h-0`, `min-h-full`, `min-h-screen`
- `max-h-0` to `max-h-96`, `max-h-screen`

## Typography

### Font Family

- `font-sans` - Sans serif
- `font-serif` - Serif
- `font-mono` - Monospace

### Font Size

- `text-xs` - 0.75rem
- `text-sm` - 0.875rem
- `text-base` - 1rem
- `text-lg` - 1.125rem
- `text-xl` - 1.25rem
- `text-2xl` - 1.5rem
- `text-3xl` - 1.875rem
- `text-4xl` - 2.25rem
- `text-5xl` - 3rem
- `text-6xl` - 3.75rem

### Font Weight

- `font-thin` - 100
- `font-extralight` - 200
- `font-light` - 300
- `font-normal` - 400
- `font-medium` - 500
- `font-semibold` - 600
- `font-bold` - 700
- `font-extrabold` - 800
- `font-black` - 900

### Text Align

- `text-left`, `text-center`, `text-right`, `text-justify`

### Text Color

- `text-gray-900` - Dark gray
- `text-red-500` - Red
- `text-blue-500` - Blue
- `text-white` - White
- Colors: gray, red, yellow, green, blue, indigo, purple, pink (100-900)

### Text Decoration

- `underline` - Text underlined
- `line-through` - Text struck through
- `no-underline` - Remove underline

### Text Transform

- `uppercase` - UPPERCASE
- `lowercase` - lowercase
- `capitalize` - Capitalize
- `normal-case` - Normal

### Line Height

- `leading-none` - 1
- `leading-tight` - 1.25
- `leading-snug` - 1.375
- `leading-normal` - 1.5
- `leading-relaxed` - 1.625
- `leading-loose` - 2

### Letter Spacing

- `tracking-tighter` - -0.05em
- `tracking-tight` - -0.025em
- `tracking-normal` - 0
- `tracking-wide` - 0.025em
- `tracking-wider` - 0.05em
- `tracking-widest` - 0.1em

## Backgrounds

### Background Color

Same palette as text colors:
- `bg-white`, `bg-black`
- `bg-gray-100` to `bg-gray-900`
- `bg-red-500`, `bg-blue-500`, etc.

### Background Opacity

- `bg-opacity-0` to `bg-opacity-100` (steps of 5)
- Or use slash notation: `bg-blue-500/50` (50% opacity)

### Background Image

- `bg-none` - No background
- `bg-gradient-to-r` - Gradient to right
- `bg-gradient-to-l` - Gradient to left
- `bg-gradient-to-t` - Gradient to top
- `bg-gradient-to-b` - Gradient to bottom
- `bg-linear-45` (v4) - Linear gradient at 45deg

### Gradient Colors

- `from-blue-500` - Gradient start color
- `via-purple-500` - Gradient middle color
- `to-pink-500` - Gradient end color

## Borders

### Border Width

- `border` - 1px all sides
- `border-0` - No border
- `border-2`, `border-4`, `border-8` - Thicker borders
- `border-t`, `border-r`, `border-b`, `border-l` - Individual sides

### Border Color

- `border-gray-300`, `border-blue-500`, etc.
- Same color palette as text/background

### Border Style

- `border-solid`, `border-dashed`, `border-dotted`
- `border-double`, `border-none`

### Border Radius

- `rounded-none` - No rounding
- `rounded-sm` - 0.125rem
- `rounded` - 0.25rem
- `rounded-md` - 0.375rem
- `rounded-lg` - 0.5rem
- `rounded-xl` - 0.75rem
- `rounded-2xl` - 1rem
- `rounded-3xl` - 1.5rem
- `rounded-full` - 9999px (circle)
- `rounded-t-lg` - Top corners
- `rounded-r-lg` - Right corners
- `rounded-b-lg` - Bottom corners
- `rounded-l-lg` - Left corners

### Divide

- `divide-x` - Vertical dividers
- `divide-y` - Horizontal dividers
- `divide-gray-200` - Divider color

## Effects

### Box Shadow

- `shadow-sm` - Small shadow
- `shadow` - Default shadow
- `shadow-md` - Medium shadow
- `shadow-lg` - Large shadow
- `shadow-xl` - Extra large shadow
- `shadow-2xl` - 2XL shadow
- `shadow-inner` - Inner shadow
- `shadow-none` - No shadow

### Opacity

- `opacity-0` - Fully transparent
- `opacity-25`, `opacity-50`, `opacity-75` - Partial opacity
- `opacity-100` - Fully opaque

### Mix Blend Mode

- `mix-blend-normal`, `mix-blend-multiply`, `mix-blend-screen`
- `mix-blend-overlay`, `mix-blend-darken`, `mix-blend-lighten`

## Filters

### Blur

- `blur-none`, `blur-sm`, `blur`, `blur-md`, `blur-lg`, `blur-xl`

### Brightness

- `brightness-0` to `brightness-200`

### Contrast

- `contrast-0` to `contrast-200`

### Grayscale

- `grayscale-0` - No grayscale
- `grayscale` - Full grayscale

### Saturate

- `saturate-0` to `saturate-200`

## Transitions

### Transition Property

- `transition-none` - No transition
- `transition-all` - All properties
- `transition` - Common properties
- `transition-colors` - Color properties
- `transition-opacity` - Opacity
- `transition-shadow` - Shadow
- `transition-transform` - Transform

### Duration

- `duration-75`, `duration-100`, `duration-150`
- `duration-200`, `duration-300`, `duration-500`
- `duration-700`, `duration-1000`

### Timing Function

- `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`

### Delay

- `delay-75`, `delay-100`, `delay-150`
- `delay-200`, `delay-300`, `delay-500`
- `delay-700`, `delay-1000`

## Transforms

### Scale

- `scale-0` to `scale-150` - Uniform scaling
- `scale-x-50`, `scale-y-50` - Axis-specific

### Rotate

- `rotate-0`, `rotate-45`, `rotate-90`, `rotate-180`
- `-rotate-45` - Negative rotation

### Translate

- `translate-x-0` to `translate-x-96`
- `translate-y-0` to `translate-y-96`
- `-translate-x-4` - Negative translation

### Skew

- `skew-x-0` to `skew-x-12`
- `skew-y-0` to `skew-y-12`
- `-skew-x-6` - Negative skew

### 3D Transforms (v4 new)

- `rotate-x-12`, `rotate-y-12`, `rotate-z-12` - 3D rotation
- `perspective-none`, `perspective-dramatic`
- `transform-3d` - Enable 3D transforms

## Interactivity

### Cursor

- `cursor-auto`, `cursor-default`, `cursor-pointer`
- `cursor-wait`, `cursor-text`, `cursor-move`
- `cursor-not-allowed`, `cursor-none`

### Pointer Events

- `pointer-events-none` - Ignore events
- `pointer-events-auto` - Receive events

### Resize

- `resize-none`, `resize`, `resize-x`, `resize-y`

### User Select

- `select-none` - Cannot select
- `select-text` - Can select text
- `select-all` - Select all on click
- `select-auto` - Browser default

### Appearance

- `appearance-none` - Remove native styling

## Overflow

- `overflow-auto` - Auto scrollbars
- `overflow-hidden` - Hide overflow
- `overflow-visible` - Show overflow
- `overflow-scroll` - Always scrollbars
- `overflow-x-auto`, `overflow-y-auto` - Axis-specific

## Arbitrary Values

Use square brackets for one-off custom values:

- `w-[347px]` - Custom width
- `top-[117px]` - Custom position
- `bg-[#1da1f2]` - Custom color
- `text-[14px]` - Custom font size
- `m-[3.23rem]` - Custom margin
- `grid-cols-[200px_1fr_1fr]` - Custom grid

## State Variants

Combine utilities with state prefixes:

- `hover:bg-blue-600` - On hover
- `focus:ring-2` - On focus
- `active:bg-blue-700` - When active
- `disabled:opacity-50` - When disabled
- `group-hover:text-blue-600` - When parent is hovered
- `peer-focus:text-blue-600` - When peer is focused

## Responsive Variants

- `sm:text-lg` - Small screens and up (640px)
- `md:flex` - Medium screens and up (768px)
- `lg:grid-cols-3` - Large screens and up (1024px)
- `xl:w-1/2` - Extra large screens and up (1280px)
- `2xl:text-6xl` - 2XL screens and up (1536px)

## Container Queries (v4)

- `@sm:grid-cols-2` - Container small (320px)
- `@md:grid-cols-3` - Container medium (384px)
- `@lg:grid-cols-4` - Container large (768px)
- `@xl:grid-cols-5` - Container XL (1024px)
- `@max-md:grid-cols-1` - Max container medium

## Dark Mode

- `dark:bg-gray-900` - Dark mode background
- `dark:text-white` - Dark mode text
- Works with any utility

## Quick Reference Patterns

### Centered Container

```jsx
<div className="max-w-7xl mx-auto px-4">
  Content
</div>
```

### Flex Center

```jsx
<div className="flex items-center justify-center min-h-screen">
  Centered
</div>
```

### Card

```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  Card content
</div>
```

### Button

```jsx
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  Button
</button>
```

### Input

```jsx
<input 
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
```
