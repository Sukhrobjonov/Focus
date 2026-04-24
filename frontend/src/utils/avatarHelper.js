/**
 * Constructs the full URL for a user's avatar.
 * Supports external URLs (like Dicebear) and local uploaded filenames.
 * 
 * @param {string} avatar - The avatar filename or full URL.
 * @returns {string} The resolved avatar URL or a default placeholder.
 */
export const getAvatarUrl = (avatar) => {
  // Return null if no avatar, allowing UI to show unified placeholders
  if (!avatar) return null;

  // 2. If it's an external URL, return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
    return avatar;
  }

  // 3. Otherwise, construct the local URL with a strict versioning cache buster
  const BACKEND_URL = 'http://192.168.31.64:3001';
  const version = new Date().getTime();
  return `${BACKEND_URL}/uploads/avatars/${avatar}?v=${version}`;
};
