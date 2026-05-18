import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// ⚠️ PASTE YOUR KEYS HERE (DO NOT COMMIT THIS FILE TO GIT)
const SUPABASE_URL = 'https://grovuxsoyynyloyuyxqy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb3Z1eHNveXlueWxveXV5eHF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUxODY0OSwiZXhwIjoyMDkwMDk0NjQ5fQ.BwA70urEexGKVnk3l4_BZDxjZ5jJoLF_se2Zj9SXAZ0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET_NAME = 'kafes';

async function runBackfill() {
  console.log('Fetching file list from Supabase...');
  
  // 1. Get all files in the bucket
  const { data: files, error: listError } = await supabase.storage.from(BUCKET_NAME).list();
  
  if (listError) {
    console.error('Error listing files:', listError);
    return;
  }

  console.log(`Found ${files.length} files. Starting processing...`);

  for (const file of files) {
    // Skip hidden files or empty directory placeholders
    if (!file.id || file.name === '.emptyFolderPlaceholder') continue;

    console.log(`\nProcessing: ${file.name} (Original size: ${(file.metadata.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // 2. Download the original raw file
      const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET_NAME).download(file.name);
      if (downloadError) throw downloadError;

      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 3. Compress the image using Sharp
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 1024, withoutEnlargement: true }) // Cap width at 1024px
        .jpeg({ quality: 80 }) // Compress to 80% quality JPEG
        .toBuffer();

      console.log(`  -> Compressed to: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // 4. Overwrite the file in Supabase WITH the cache control header
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(file.name, compressedBuffer, {
        upsert: true, // Overwrites the existing file
        cacheControl: '31536000', // 🚀 1-year cache header
        contentType: 'image/jpeg'
      });

      if (uploadError) throw uploadError;
      
      console.log(`  -> Successfully re-uploaded with 1-year cache header.`);

    } catch (err) {
      console.error(`  -> Failed to process ${file.name}:`, err.message);
    }
  }
  
  console.log('\n✅ Backfill complete! Your bucket is fully optimized.');
}

runBackfill();