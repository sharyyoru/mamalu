"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SupabaseTest() {
  const [status, setStatus] = useState<string>("Testing...");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Check environment variables
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        console.log('Environment check:', { hasUrl, hasKey });
        
        if (!hasUrl || !hasKey) {
          setStatus("❌ Missing environment variables");
          setDetails({ hasUrl, hasKey });
          return;
        }

        // Create client
        const supabase = createClient();
        
        if (!supabase) {
          setStatus("❌ Failed to create Supabase client");
          return;
        }

        setStatus("✅ Supabase client created");

        // Test storage access
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          setStatus(`❌ Error listing buckets: ${bucketsError.message}`);
          setDetails(bucketsError);
          return;
        }

        console.log('Buckets:', buckets);

        // Check if videos bucket exists
        const videosBucket = buckets?.find(b => b.name === 'videos');
        
        if (!videosBucket) {
          setStatus("❌ Videos bucket not found");
          setDetails({ availableBuckets: buckets?.map(b => b.name) });
          return;
        }

        setStatus("✅ Videos bucket found");

        // List files in videos bucket (root)
        const { data: files, error: filesError } = await supabase.storage
          .from('videos')
          .list('', { 
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (filesError) {
          setStatus(`❌ Error listing files: ${filesError.message}`);
          setDetails(filesError);
          return;
        }

        console.log('Files in videos bucket (root):', files);

        // Also try listing with search
        const { data: allFiles, error: searchError } = await supabase.storage
          .from('videos')
          .list('', { 
            limit: 1000,
            search: '.mp4'
          });

        console.log('Search for .mp4 files:', allFiles);

        const fileCount = files?.length || 0;
        const searchCount = allFiles?.length || 0;

        setStatus(`✅ Found ${fileCount} files (root), ${searchCount} files (search)`);
        setDetails({ 
          rootFiles: files?.map(f => ({ name: f.name, id: f.id })),
          searchFiles: allFiles?.map(f => ({ name: f.name, id: f.id }))
        });

      } catch (err: any) {
        setStatus(`❌ Error: ${err.message}`);
        setDetails(err);
        console.error('Supabase test error:', err);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">Supabase Connection Test</h3>
      <p className="text-sm mb-2">{status}</p>
      {details && (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  );
}
