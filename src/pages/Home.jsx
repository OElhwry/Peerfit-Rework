// src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase-config'
import RecommendedFollows from '../components/RecommendedFollows'

/** Single reply node with nested children */
function ReplyNode({ reply, postId, currentUser, depth }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const handleReply = async () => {
    if (!text.trim()) return
    await addDoc(collection(db, 'posts', postId, 'replies'), {
      authorId: currentUser.uid,
      authorUsername: currentUser.username,
      content: text.trim(),
      createdAt: serverTimestamp(),
      parentId: reply.id,
    })
    setText('')
    setOpen(false)
  }

  return (
    <div style={{ marginLeft: depth * 16 }} className="space-y-1">
      <div className="flex items-center space-x-2">
        <Link
          to={`/profile/${reply.authorId}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          @{reply.authorUsername}
        </Link>
        <span className="text-xs text-gray-400">
          {reply.createdAt
            ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true })
            : ''}
        </span>
      </div>
      <p className="text-sm leading-snug">{reply.content}</p>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-indigo-600 hover:underline"
      >
        {open ? 'Cancel' : 'Reply'}
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          <textarea
            rows={2}
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring"
            placeholder="Your reply…"
          />
          <button
            onClick={handleReply}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Post Reply
          </button>
        </div>
      )}
      {reply.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {reply.children.map(child => (
            <ReplyNode
              key={child.id}
              reply={child}
              postId={postId}
              currentUser={currentUser}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Builds and renders nested replies tree */
function ReplyList({ postId, currentUser, repliesRaw }) {
  const tree = useMemo(() => {
    const map = {}
    repliesRaw.forEach(r => (map[r.id] = { ...r, children: [] }))
    const roots = []
    repliesRaw.forEach(r => {
      if (r.parentId && map[r.parentId]) {
        map[r.parentId].children.push(map[r.id])
      } else {
        roots.push(map[r.id])
      }
    })
    return roots
  }, [repliesRaw])

  return (
    <div className="space-y-4">
      {tree.map(r => (
        <ReplyNode
          key={r.id}
          reply={r}
          postId={postId}
          currentUser={currentUser}
          depth={0}
        />
      ))}
    </div>
  )
}

/** Post card with likes & nested replies */
function PostCard({ post, currentUser }) {
  const [userLiked, setUserLiked] = useState(
    Array.isArray(post.likedBy) && post.likedBy.includes(currentUser.uid)
  )
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [repliesRaw, setRepliesRaw] = useState([])

  // subscribe to replies
  useEffect(() => {
    const q = query(
      collection(db, 'posts', post.id, 'replies'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, snap =>
      setRepliesRaw(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [post.id])

  // toggle like/unlike
  const toggleLike = async () => {
    const ref = doc(db, 'posts', post.id)
    if (userLiked) {
      await updateDoc(ref, {
        likedBy: arrayRemove(currentUser.uid),
        likeCount: increment(-1),
      })
      setLikeCount(c => c - 1)
    } else {
      await updateDoc(ref, {
        likedBy: arrayUnion(currentUser.uid),
        likeCount: increment(1),
      })
      setLikeCount(c => c + 1)
    }
    setUserLiked(u => !u)
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
      <div className="flex justify-between items-center">
        <Link
          to={`/profile/${post.authorId}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          @{post.authorUsername}
        </Link>
        <span className="text-xs text-gray-400">
          {post.createdAt
            ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
            : ''}
        </span>
      </div>
      <p className="leading-relaxed">{post.content}</p>
      <div className="flex items-center space-x-8">
        <button
          onClick={toggleLike}
          className="flex items-center space-x-1 text-sm"
        >
          <span
            className={`text-xl ${
              userLiked ? 'text-indigo-600' : 'text-gray-300'
            }`}
          >
            👍
          </span>
          <span>{likeCount}</span>
        </button>
        <button
          onClick={() => {}}
          className="text-sm text-indigo-600 hover:underline"
        >
          Reply ({repliesRaw.length})
        </button>
      </div>
      <ReplyList
        postId={post.id}
        currentUser={currentUser}
        repliesRaw={repliesRaw}
      />
    </div>
  )
}

/** Main feed page */
export default function Home() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState([])
  const [following, setFollowing] = useState([])
  const [filter, setFilter] = useState('latest')
  const [myUsername, setMyUsername] = useState('')
  const [newContent, setNewContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)

  // 1) load my profile (to get username & following list)
  useEffect(() => {
    if (!currentUser) return
    getDoc(doc(db, 'users', currentUser.uid)).then(u => {
      const data = u.data() || {}
      setMyUsername(data.username || '')
      setFollowing(data.following || [])
    })
  }, [currentUser])

  // 2) subscribe to all public posts
  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoadingPosts(false)
    })
    return unsub
  }, [])

  // 3) post creation handler
  const handlePost = async () => {
    if (!newContent.trim()) return
    setPosting(true)
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: currentUser.uid,
        authorUsername: myUsername || currentUser.email,
        content: newContent.trim(),
        visibility: 'public',
        createdAt: serverTimestamp(),
        likeCount: 0,
        likedBy: [],
      })
      setNewContent('')
    } catch (err) {
      console.error(err)
    } finally {
      setPosting(false)
    }
  }

  // 4) apply filter/sort
  const displayed = useMemo(() => {
    let arr = [...posts]
    if (filter === 'top') {
      arr.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    } else if (filter === 'following') {
      arr = arr.filter(p => following.includes(p.authorId))
    }
    return arr
  }, [posts, filter, following])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Hello, {currentUser.displayName || myUsername || currentUser.email}!
        </h1>

        {/* New Post */}
        <section className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
          <textarea
            rows={3}
            placeholder="What's on your mind?"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring"
          />
          <div className="flex justify-between items-center">
            <select
              disabled
              className="px-3 py-1 border rounded-lg bg-gray-100 text-sm"
            >
              <option>Public</option>
            </select>
            <button
              onClick={handlePost}
              disabled={posting}
              className={`px-6 py-2 rounded-lg text-white font-medium ${
                posting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </section>

        {/* Filters */}
        <div className="flex justify-center space-x-3">
          {['latest', 'top', 'following'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'latest'
                ? 'Latest'
                : f === 'top'
                ? 'Most Liked'
                : 'Following'}
            </button>
          ))}
        </div>


      {/* Recommended to follow */}
      <RecommendedFollows />

        {/* Posts Feed */}
        {loadingPosts ? (
          <p className="text-center text-gray-500">Loading posts…</p>
        ) : displayed.length > 0 ? (
          <div className="space-y-8">
            {displayed.map(p => (
              <PostCard
                key={p.id}
                post={p}
                currentUser={{ ...currentUser, username: myUsername }}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            No posts to show. Try another filter or come back later.
          </p>
        )}
      </div>
    </div>
  )
}
