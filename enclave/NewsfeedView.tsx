import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Plus } from 'lucide-react';
import styles from './NewsfeedView.module.css';

export default function NewsfeedView() {
  const mockPosts = [
    {
      id: 1,
      author: 'NeonDreamer',
      avatar: '🎸',
      content: 'Just dropped a new track! Check out our latest cyberpunk anthem.',
      likes: 234,
      comments: 45,
      timestamp: '2h ago',
    },
    {
      id: 2,
      author: 'SynthWave_Band',
      avatar: '🎹',
      content: 'Live performance tonight at 9 PM PST. Join us in the virtual venue!',
      likes: 512,
      comments: 89,
      timestamp: '5h ago',
    },
    {
      id: 3,
      author: 'BasslineRebel',
      avatar: '🎵',
      content: 'Looking for collaborators for an experimental electronic project.',
      likes: 156,
      comments: 67,
      timestamp: '1d ago',
    },
  ];

  return (
    <div className={styles.feed}>
      {/* Create post button */}
      <motion.button
        className={styles.createPost}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus size={20} />
        <span>Create New Post</span>
      </motion.button>

      {/* Posts */}
      {mockPosts.map((post, index) => (
        <motion.div
          key={post.id}
          className={styles.post}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {/* Header */}
          <div className={styles.postHeader}>
            <div className={styles.avatar}>{post.avatar}</div>
            <div className={styles.authorInfo}>
              <div className={styles.author}>{post.author}</div>
              <div className={styles.timestamp}>{post.timestamp}</div>
            </div>
          </div>

          {/* Content */}
          <div className={styles.postContent}>
            {post.content}
          </div>

          {/* Actions */}
          <div className={styles.postActions}>
            <motion.button
              className={styles.actionBtn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart size={18} />
              <span>{post.likes}</span>
            </motion.button>
            <motion.button
              className={styles.actionBtn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle size={18} />
              <span>{post.comments}</span>
            </motion.button>
            <motion.button
              className={styles.actionBtn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share2 size={18} />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
