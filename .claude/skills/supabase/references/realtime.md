# Realtime Subscriptions Reference

Guide to implementing real-time features with Supabase Realtime including database changes, presence, and broadcast.

## Table of Contents

- Database Changes (CDC)
- Presence
- Broadcast
- Channel Management
- Error Handling

## Database Changes (Change Data Capture)

Listen to INSERT, UPDATE, and DELETE events on your PostgreSQL tables.

### Basic Subscription

```typescript
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'messages'
    },
    (payload) => {
      console.log('Change received:', payload)
    }
  )
  .subscribe()
```

### Event Types

```typescript
// Listen to all events
.on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handler)

// Listen to INSERT only
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handler)

// Listen to UPDATE only
.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, handler)

// Listen to DELETE only
.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, handler)
```

### Filtered Subscriptions

```typescript
// Filter by column value
const channel = supabase
  .channel('user-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: 'user_id=eq.123e4567-e89b-12d3-a456-426614174000'
    },
    (payload) => {
      console.log('New message for user:', payload.new)
    }
  )
  .subscribe()
```

### Payload Structure

```typescript
interface RealtimePayload {
  schema: string          // 'public'
  table: string           // 'messages'
  commit_timestamp: string // ISO timestamp
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, any>  // New row data (INSERT, UPDATE)
  old: Record<string, any>  // Old row data (UPDATE, DELETE)
  errors: string[]
}
```

### Complete Example

```typescript
const channel = supabase
  .channel('messages-channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    },
    (payload) => {
      console.log('New message:', payload.new)
      // Add message to UI
      addMessageToChat(payload.new)
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages'
    },
    (payload) => {
      console.log('Message updated:', payload.new)
      // Update message in UI
      updateMessageInChat(payload.new)
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'messages'
    },
    (payload) => {
      console.log('Message deleted:', payload.old)
      // Remove message from UI
      removeMessageFromChat(payload.old.id)
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Listening for database changes')
    }
  })
```

### React Hook Pattern

```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }

    fetchMessages()

    // Subscribe to changes
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return messages
}
```

## Presence

Track and sync state of users connected to a channel.

### Join Presence

```typescript
const channel = supabase.channel('room:123')

// Send presence state
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', state)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key, newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key, leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // Track presence
      await channel.track({
        user_id: currentUser.id,
        username: currentUser.username,
        online_at: new Date().toISOString()
      })
    }
  })
```

### Presence State

```typescript
// Get current presence state
const state = channel.presenceState()
console.log(state)
// {
//   'user-1': [{ user_id: '1', username: 'Alice', online_at: '...' }],
//   'user-2': [{ user_id: '2', username: 'Bob', online_at: '...' }]
// }
```

### Online Users Component

```typescript
import { useEffect, useState } from 'react'

export function OnlineUsers({ roomId }: { roomId: string }) {
  const [users, setUsers] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const usersArray = Object.values(state).flat()
        setUsers(usersArray)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            username: currentUser.username
          })
        }
      })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return (
    <div>
      <h3>Online ({users.length})</h3>
      <ul>
        {users.map((user) => (
          <li key={user.user_id}>{user.username}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Broadcast

Send ephemeral messages between connected clients.

### Send Broadcast Message

```typescript
const channel = supabase.channel('game:123')

// Listen for broadcast messages
channel
  .on('broadcast', { event: 'move' }, (payload) => {
    console.log('Player moved:', payload)
    updatePlayerPosition(payload.payload)
  })
  .subscribe()

// Send broadcast message
await channel.send({
  type: 'broadcast',
  event: 'move',
  payload: {
    player_id: '1',
    x: 100,
    y: 200
  }
})
```

### Typing Indicator Example

```typescript
const channel = supabase.channel('chat:123')

// Listen for typing events
channel
  .on('broadcast', { event: 'typing' }, ({ payload }) => {
    showTypingIndicator(payload.user_id)
  })
  .subscribe()

// Send typing notification
const handleTyping = debounce(() => {
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { user_id: currentUser.id }
  })
}, 300)
```

### Cursor Sharing Example

```typescript
const channel = supabase.channel('document:123')

channel
  .on('broadcast', { event: 'cursor' }, ({ payload }) => {
    updateCursor(payload.user_id, payload.position)
  })
  .subscribe()

// Send cursor position
document.addEventListener('mousemove', (e) => {
  channel.send({
    type: 'broadcast',
    event: 'cursor',
    payload: {
      user_id: currentUser.id,
      position: { x: e.clientX, y: e.clientY }
    }
  })
})
```

## Channel Management

### Create and Subscribe

```typescript
const channel = supabase.channel('my-channel')

channel.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected to channel')
  }
  if (status === 'CHANNEL_ERROR') {
    console.error('Channel error:', err)
  }
  if (status === 'TIMED_OUT') {
    console.error('Channel timeout')
  }
})
```

### Unsubscribe

```typescript
// Unsubscribe from channel
await channel.unsubscribe()

// Remove channel completely
await supabase.removeChannel(channel)
```

### Remove All Channels

```typescript
await supabase.removeAllChannels()
```

### Channel Status

```typescript
channel.subscribe((status) => {
  switch (status) {
    case 'SUBSCRIBED':
      console.log('Ready to send and receive messages')
      break
    case 'CHANNEL_ERROR':
      console.log('Channel encountered an error')
      break
    case 'TIMED_OUT':
      console.log('Connection timed out')
      break
    case 'CLOSED':
      console.log('Channel closed')
      break
  }
})
```

## Complete Chat Example

```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Message {
  id: string
  content: string
  user_id: string
  created_at: string
}

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }

    fetchMessages()

    // Create channel with multiple features
    const channel = supabase
      .channel(`room:${roomId}`)
      // Database changes
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        }
      )
      // Presence tracking
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers(Object.values(state).flat())
      })
      // Typing indicators
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers((current) => new Set(current).add(payload.user_id))
        setTimeout(() => {
          setTypingUsers((current) => {
            const next = new Set(current)
            next.delete(payload.user_id)
            return next
          })
        }, 3000)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            username: currentUser.username
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const sendMessage = async (content: string) => {
    await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        content,
        user_id: currentUser.id
      })
  }

  return (
    <div>
      <div>Online: {onlineUsers.length}</div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
      {typingUsers.size > 0 && <div>Someone is typing...</div>}
    </div>
  )
}
```

## Database Setup for Realtime

### Enable Realtime

```sql
-- Enable realtime for specific table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable for all events (INSERT, UPDATE, DELETE)
ALTER TABLE messages REPLICA IDENTITY FULL;
```

### RLS for Realtime

```sql
-- Allow users to subscribe to their own messages
CREATE POLICY "Users can subscribe to own messages"
  ON messages
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Error Handling

```typescript
const channel = supabase.channel('my-channel')

channel
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => {
      if (payload.errors && payload.errors.length > 0) {
        console.error('Realtime errors:', payload.errors)
      } else {
        console.log('Change:', payload)
      }
    }
  )
  .subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('Channel error:', err)
      // Attempt reconnection
      setTimeout(() => channel.subscribe(), 5000)
    }
  })
```

## Performance Tips

1. **Limit subscriptions**: Only subscribe to tables/filters you need
2. **Use filters**: Narrow subscriptions with column filters
3. **Cleanup**: Always unsubscribe when component unmounts
4. **Batch updates**: Use database triggers for complex logic
5. **Connection pooling**: Supabase handles this automatically

## Troubleshooting

**Issue**: Not receiving realtime updates
- Check realtime is enabled in dashboard
- Verify table has `supabase_realtime` publication
- Check RLS policies allow SELECT
- Verify filter syntax is correct

**Issue**: Connection keeps dropping
- Check network stability
- Implement reconnection logic
- Monitor connection status

**Issue**: High latency
- Use filters to reduce payload size
- Check database load
- Consider geographic proximity to Supabase region

**Issue**: Duplicate events
- Check for multiple subscriptions to same channel
- Implement idempotent event handlers
- Use message IDs for deduplication
