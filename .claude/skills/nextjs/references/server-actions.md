# Server Actions and Forms

Server Actions enable server-side form handling and data mutations in Next.js without requiring API routes.

## What are Server Actions?

Server Actions are asynchronous functions that run on the server. They can be:
- Called from Client or Server Components
- Used with forms for progressive enhancement
- Invoked programmatically

## Basic Server Action

```tsx
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  
  // Validate data
  if (!title || !content) {
    return { error: 'Title and content are required' }
  }
  
  // Save to database
  const post = await db.posts.create({
    data: { title, content }
  })
  
  // Revalidate cache
  revalidatePath('/posts')
  
  return { success: true, post }
}
```

## Form with Server Action

```tsx
// app/posts/new/page.tsx
import { createPost } from '@/app/actions'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

## Progressive Enhancement with useFormState

```tsx
'use client'

import { useFormState } from 'react-dom'
import { createPost } from '@/app/actions'

export function PostForm() {
  const [state, formAction] = useFormState(createPost, { error: null })
  
  return (
    <form action={formAction}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit">Create Post</button>
    </form>
  )
}
```

## Using useFormStatus for Pending State

```tsx
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
    </button>
  )
}

export function PostForm() {
  return (
    <form action={createPost}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      <SubmitButton />
    </form>
  )
}
```

## Inline Server Actions

```tsx
export default function Page() {
  async function create(formData: FormData) {
    'use server'
    
    const title = formData.get('title')
    await db.posts.create({ data: { title } })
    revalidatePath('/posts')
  }
  
  return (
    <form action={create}>
      <input type="text" name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

## Calling Server Actions Programmatically

```tsx
'use client'

import { deletePost } from '@/app/actions'

export function DeleteButton({ postId }: { postId: string }) {
  async function handleDelete() {
    const result = await deletePost(postId)
    if (result.success) {
      alert('Post deleted')
    }
  }
  
  return (
    <button onClick={handleDelete}>
      Delete
    </button>
  )
}
```

## Server Action in API Route

```tsx
// app/api/posts/route.ts
import { NextResponse } from 'next/server'
import { createPost } from '@/app/actions'

export async function POST(request: Request) {
  const formData = await request.formData()
  const result = await createPost(formData)
  
  return NextResponse.json(result)
}
```

## Validation with Zod

```tsx
'use server'

import { z } from 'zod'

const postSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
})

export async function createPost(formData: FormData) {
  const validatedFields = postSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  
  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  const { title, content } = validatedFields.data
  
  await db.posts.create({
    data: { title, content }
  })
  
  revalidatePath('/posts')
  redirect('/posts')
}
```

## Error Handling

```tsx
'use server'

export async function createPost(formData: FormData) {
  try {
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    
    const post = await db.posts.create({
      data: { title, content }
    })
    
    revalidatePath('/posts')
    return { success: true, post }
    
  } catch (error) {
    console.error('Failed to create post:', error)
    return { 
      success: false, 
      error: 'Failed to create post. Please try again.' 
    }
  }
}
```

## Optimistic Updates

```tsx
'use client'

import { useOptimistic } from 'react'
import { createPost } from '@/app/actions'

export function PostList({ posts }: { posts: Post[] }) {
  const [optimisticPosts, addOptimisticPost] = useOptimistic(
    posts,
    (state, newPost: Post) => [...state, newPost]
  )
  
  async function handleSubmit(formData: FormData) {
    const title = formData.get('title') as string
    
    // Add optimistically
    addOptimisticPost({ id: 'temp', title })
    
    // Submit to server
    await createPost(formData)
  }
  
  return (
    <>
      <form action={handleSubmit}>
        <input type="text" name="title" />
        <button type="submit">Add</button>
      </form>
      
      <ul>
        {optimisticPosts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </>
  )
}
```

## Security Best Practices

1. **Always validate input** on the server
2. **Check authentication** before mutations
3. **Use TypeScript** for type safety
4. **Rate limit** sensitive operations
5. **Sanitize user input** before database operations

```tsx
'use server'

import { auth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function createPost(formData: FormData) {
  // Check authentication
  const session = await auth()
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  // Rate limiting
  const { success } = await rateLimit(session.user.id)
  if (!success) {
    throw new Error('Rate limit exceeded')
  }
  
  // Validate and process...
}
```

## Revalidation and Redirection

```tsx
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  // ... create post
  
  // Revalidate specific path
  revalidatePath('/posts')
  
  // Revalidate by tag
  revalidateTag('posts')
  
  // Redirect after success
  redirect('/posts')
}
```

## Cookies and Headers

```tsx
'use server'

import { cookies, headers } from 'next/headers'

export async function updatePreferences(theme: string) {
  const cookieStore = await cookies()
  cookieStore.set('theme', theme)
  
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')
  
  // ... update preferences
}
```

## Common Patterns

### File Upload

```tsx
'use server'

import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File
  
  if (!file) {
    return { error: 'No file provided' }
  }
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const path = join(process.cwd(), 'public', 'uploads', file.name)
  await writeFile(path, buffer)
  
  return { success: true, path: `/uploads/${file.name}` }
}
```

### Multi-Step Form

```tsx
'use server'

export async function submitStep1(formData: FormData) {
  const data = Object.fromEntries(formData)
  
  // Store in session or database
  await saveFormData('step1', data)
  
  return { nextStep: 'step2' }
}

export async function submitStep2(formData: FormData) {
  const data = Object.fromEntries(formData)
  
  // Get previous data
  const step1Data = await getFormData('step1')
  
  // Combine and process
  await processCompleteForm({ ...step1Data, ...data })
  
  revalidatePath('/dashboard')
  redirect('/success')
}
```

## Testing Server Actions

```tsx
import { createPost } from '@/app/actions'

describe('createPost', () => {
  it('creates a post with valid data', async () => {
    const formData = new FormData()
    formData.append('title', 'Test Post')
    formData.append('content', 'Test content')
    
    const result = await createPost(formData)
    
    expect(result.success).toBe(true)
    expect(result.post).toBeDefined()
  })
  
  it('returns error with invalid data', async () => {
    const formData = new FormData()
    formData.append('title', '')
    
    const result = await createPost(formData)
    
    expect(result.error).toBeDefined()
  })
})
```
