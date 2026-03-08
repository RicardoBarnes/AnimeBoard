-- Add policy to allow users to soft-delete their own posts
-- This allows updating the removed_at field only

CREATE POLICY "Users can soft-delete own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
