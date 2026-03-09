'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function FollowButton({ creatorId }: { creatorId: string }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function checkFollowStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('creator_id', creatorId)
        .maybeSingle()

      setIsFollowing(!!data)
      setLoading(false)
    }

    checkFollowStatus()
  }, [creatorId])

  async function toggleFollow() {
    if (!userId) {
      router.push('/login')
      return
    }

    const supabase = createClient()
    setLoading(true)

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('creator_id', creatorId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({
        follower_id: userId,
        creator_id: creatorId,
      })
      setIsFollowing(true)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="h-9 w-24 rounded-lg bg-accent animate-pulse" />
    )
  }

  return (
    <button
      onClick={toggleFollow}
      className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
        isFollowing
          ? 'border border-border text-foreground hover:border-destructive/40 hover:text-destructive'
          : 'bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20'
      }`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
