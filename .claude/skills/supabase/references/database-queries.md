# Database Queries Reference

Complete guide to querying PostgreSQL databases through Supabase with JavaScript/TypeScript and Python.

## Table of Contents

- Basic CRUD Operations
- Filtering and Searching
- Joins and Relations
- Aggregations and Functions
- Pagination
- RPC (Remote Procedure Calls)
- Transactions
- Upserts

## Basic CRUD Operations

### Select (Read)

**Select all columns:**

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
```

```python
data = supabase.table('users').select('*').execute()
```

**Select specific columns:**

```typescript
const { data, error } = await supabase
  .from('users')
  .select('id, email, full_name')
```

```python
data = supabase.table('users').select('id, email, full_name').execute()
```

**Select with count:**

```typescript
const { data, count, error } = await supabase
  .from('users')
  .select('*', { count: 'exact' })
```

### Insert (Create)

**Insert single row:**

```typescript
const { data, error } = await supabase
  .from('users')
  .insert({
    email: 'new@example.com',
    full_name: 'New User',
    age: 25
  })
  .select()  // Return inserted data
```

```python
data = supabase.table('users').insert({
    'email': 'new@example.com',
    'full_name': 'New User',
    'age': 25
}).execute()
```

**Insert multiple rows:**

```typescript
const { data, error } = await supabase
  .from('users')
  .insert([
    { email: 'user1@example.com', full_name: 'User One' },
    { email: 'user2@example.com', full_name: 'User Two' }
  ])
  .select()
```

```python
data = supabase.table('users').insert([
    {'email': 'user1@example.com', 'full_name': 'User One'},
    {'email': 'user2@example.com', 'full_name': 'User Two'}
]).execute()
```

### Update

**Update with condition:**

```typescript
const { data, error } = await supabase
  .from('users')
  .update({ status: 'active' })
  .eq('id', user_id)
  .select()
```

```python
data = supabase.table('users').update({
    'status': 'active'
}).eq('id', user_id).execute()
```

**Update multiple rows:**

```typescript
const { data, error } = await supabase
  .from('users')
  .update({ verified: true })
  .gte('created_at', '2024-01-01')
```

### Delete

**Delete with condition:**

```typescript
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', user_id)
```

```python
data = supabase.table('users').delete().eq('id', user_id).execute()
```

**Delete multiple rows:**

```typescript
const { data, error } = await supabase
  .from('users')
  .delete()
  .lt('last_login', '2023-01-01')
```

## Filtering and Searching

### Equality Filters

```typescript
// Equal to
.eq('status', 'active')

// Not equal to
.neq('status', 'deleted')

// Greater than
.gt('age', 18)

// Greater than or equal to
.gte('age', 21)

// Less than
.lt('price', 100)

// Less than or equal to
.lte('price', 50)
```

```python
# Python equivalents
.eq('status', 'active')
.neq('status', 'deleted')
.gt('age', 18)
.gte('age', 21)
.lt('price', 100)
.lte('price', 50)
```

### Pattern Matching

```typescript
// Case-insensitive match
.ilike('name', '%john%')

// Case-sensitive match
.like('name', 'John%')

// Match any of
.in('status', ['active', 'pending'])

// Is null
.is('deleted_at', null)
```

### Text Search

```typescript
// Full text search
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'javascript typescript', {
    type: 'websearch',
    config: 'english'
  })
```

### Range Filters

```typescript
// Within range
.range('age', 18, 65)

// Array contains
.contains('tags', ['javascript', 'typescript'])

// Array contained by
.containedBy('permissions', ['read', 'write', 'delete'])

// Array overlaps
.overlaps('skills', ['python', 'javascript'])
```

### Logical Operators

```typescript
// OR conditions
const { data, error } = await supabase
  .from('users')
  .select('*')
  .or('status.eq.active,role.eq.admin')

// Complex OR
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .or('status.eq.featured,priority.gte.5')
```

```python
# Python OR
data = supabase.table('users').select('*').or_('status.eq.active,role.eq.admin').execute()
```

### NOT Operator

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .not('status', 'eq', 'deleted')
```

## Joins and Relations

### Basic Join (Foreign Key)

```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    content,
    author:users(id, email, full_name)
  `)
```

```python
data = supabase.table('posts').select('''
    id,
    title,
    content,
    author:users(id, email, full_name)
''').execute()
```

### Multiple Joins

```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:users(id, full_name),
    comments(id, content, user:users(full_name)),
    tags(name)
  `)
```

### Nested Filtering

```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    comments!inner(*)
  `)
  .eq('comments.status', 'approved')
```

### Count Relations

```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    comments(count)
  `)
```

## Aggregations and Functions

### Count

```typescript
const { count, error } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
```

### Sum, Average, Min, Max

These require RPC functions or views in your database:

```sql
-- Create a view in your database
CREATE VIEW user_stats AS
SELECT 
  COUNT(*) as total_users,
  AVG(age) as average_age,
  MIN(age) as min_age,
  MAX(age) as max_age
FROM users;
```

```typescript
const { data, error } = await supabase
  .from('user_stats')
  .select('*')
  .single()
```

## Ordering and Sorting

```typescript
// Order by single column
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })

// Order by multiple columns
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('priority', { ascending: false })
  .order('created_at', { ascending: false })

// Order by foreign table column
const { data, error } = await supabase
  .from('posts')
  .select('*, author:users(full_name)')
  .order('full_name', { foreignTable: 'users' })
```

```python
# Python ordering
data = supabase.table('posts').select('*').order('created_at', desc=True).execute()
```

## Pagination

### Limit and Offset

```typescript
// Get first 10 records
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .limit(10)

// Skip first 20, get next 10
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .range(20, 29)
```

```python
# Python pagination
data = supabase.table('posts').select('*').range(20, 29).execute()
```

### Cursor-Based Pagination

```typescript
// First page
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('id')
  .limit(10)

// Next page (using last ID from previous page)
const lastId = data[data.length - 1].id
const { data: nextPage, error } = await supabase
  .from('posts')
  .select('*')
  .gt('id', lastId)
  .order('id')
  .limit(10)
```

## RPC (Remote Procedure Calls)

Call PostgreSQL functions directly:

### Simple RPC

```typescript
const { data, error } = await supabase
  .rpc('hello_world')
```

```python
data = supabase.rpc('hello_world').execute()
```

### RPC with Parameters

```typescript
const { data, error } = await supabase
  .rpc('calculate_user_stats', {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    include_archived: false
  })
```

```python
data = supabase.rpc('calculate_user_stats', {
    'user_id': '123e4567-e89b-12d3-a456-426614174000',
    'include_archived': False
}).execute()
```

### Example PostgreSQL Functions

```sql
-- Simple function
CREATE FUNCTION hello_world() 
RETURNS text 
LANGUAGE sql 
AS $$
  SELECT 'Hello, World!';
$$;

-- Function with parameters
CREATE FUNCTION get_posts_by_author(author_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  created_at timestamptz
)
LANGUAGE sql
AS $$
  SELECT id, title, created_at
  FROM posts
  WHERE author_id = $1
  ORDER BY created_at DESC;
$$;

-- Function with complex logic
CREATE FUNCTION increment_view_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$;
```

## Upsert Operations

Insert or update based on unique constraint:

```typescript
const { data, error } = await supabase
  .from('users')
  .upsert({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    full_name: 'Updated Name'
  }, {
    onConflict: 'email'  // Column with unique constraint
  })
  .select()
```

```python
data = supabase.table('users').upsert({
    'id': '123e4567-e89b-12d3-a456-426614174000',
    'email': 'user@example.com',
    'full_name': 'Updated Name'
}, on_conflict='email').execute()
```

## Complex Query Examples

### Posts with Author and Comment Count

```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    content,
    created_at,
    author:users!author_id(id, email, full_name),
    comments(count),
    tags(name)
  `)
  .eq('published', true)
  .gte('created_at', '2024-01-01')
  .order('created_at', { ascending: false })
  .range(0, 9)
```

### Search with Multiple Filters

```typescript
const { data, error } = await supabase
  .from('products')
  .select(`
    id,
    name,
    price,
    category:categories(name),
    inventory(quantity)
  `)
  .ilike('name', '%laptop%')
  .gte('price', 500)
  .lte('price', 2000)
  .eq('in_stock', true)
  .order('price', { ascending: true })
```

### User Activity Dashboard

```typescript
const { data, error } = await supabase
  .from('users')
  .select(`
    id,
    full_name,
    posts(count),
    comments(count),
    last_login
  `)
  .gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  .order('last_login', { ascending: false })
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')

if (error) {
  console.error('Query error:', error.message)
  console.error('Details:', error.details)
  console.error('Hint:', error.hint)
  // Handle error appropriately
}

// Always check for data before using
if (data) {
  console.log('Results:', data)
}
```

## Performance Tips

1. **Select only needed columns**: Don't use `select('*')` unless necessary
2. **Use indexes**: Create indexes on frequently queried columns
3. **Limit results**: Always use pagination for large datasets
4. **Use views**: Create database views for complex, repeated queries
5. **Batch operations**: Use bulk inserts/updates when possible
6. **RLS optimization**: Keep Row Level Security policies efficient
7. **Connection pooling**: Supabase handles this automatically

## Common Patterns

### Search with Debounce

```typescript
import { debounce } from 'lodash'

const searchUsers = debounce(async (query: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .ilike('full_name', `%${query}%`)
    .limit(10)
  
  return data
}, 300)
```

### Infinite Scroll

```typescript
const PAGE_SIZE = 20

async function loadMore(offset: number) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)
  
  return data
}
```

### Soft Delete Pattern

```typescript
// Mark as deleted instead of removing
const { error } = await supabase
  .from('users')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', user_id)

// Query non-deleted records
const { data, error } = await supabase
  .from('users')
  .select('*')
  .is('deleted_at', null)
```

## Troubleshooting

**Issue**: "No rows returned"
- Check filters are correct
- Verify data exists in table
- Check RLS policies allow read access

**Issue**: "Column not found"
- Verify column name spelling
- Check table schema
- Ensure column exists in database

**Issue**: Query timeout
- Reduce dataset size with filters
- Add database indexes
- Optimize RLS policies
- Consider using RPC functions

**Issue**: "Could not find the public.table relation"
- Verify table exists
- Check schema permissions
- Ensure RLS is properly configured
