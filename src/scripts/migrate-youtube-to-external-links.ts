import { supabase } from "@/integrations/supabase/client";
import { createDebugService } from "@/lib/utils/debug.service";

const debug = createDebugService("MigrationScript");

/**
 * Script to migrate all existing YouTube links to the new external links format
 */
export async function migrateYoutubeLinksToExternalLinks() {
  debug.log("Starting migration of YouTube links to external links...");
  
  try {
    // Fetch all assignments that have YouTube links
    const { data: assignments, error } = await supabase
      .from("assignments")
      .select("id, youtubelinks, externalLinks")
      .not("youtubelinks", "is", null);
      
    if (error) {
      debug.error("Error fetching assignments:", error);
      return { success: false, error: error.message };
    }
    
    debug.log(`Found ${assignments?.length || 0} assignments with YouTube links`);
    
    // Process each assignment
    const updates = [];
    for (const assignment of assignments || []) {
      // Skip if no YouTube links or already has external links
      if (!Array.isArray(assignment.youtubelinks) || assignment.youtubelinks.length === 0) {
        continue;
      }
      
      const hasExistingExternalLinks = Array.isArray(assignment.externalLinks) && 
        assignment.externalLinks.some(link => link?.url && link.url.trim() !== "");
      
      if (hasExistingExternalLinks) {
        debug.log(`Assignment ${assignment.id} already has external links, skipping`);
        continue;
      }
      
      // Convert YouTube links to external links format
      const externalLinks = assignment.youtubelinks.map(link => ({
        url: link.url,
        title: link.title,
        type: 'youtube'
      }));
      
      // Update the assignment
      updates.push({
        id: assignment.id,
        externalLinks
      });
    }
    
    debug.log(`Updating ${updates.length} assignments...`);
    
    // Update all assignments in a batch (if there are any updates)
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from("assignments")
        .upsert(updates);
        
      if (updateError) {
        debug.error("Error updating assignments:", updateError);
        return { success: false, error: updateError.message };
      }
    }
    
    debug.log("Migration completed successfully");
    return { 
      success: true, 
      message: `Updated ${updates.length} assignments` 
    };
  } catch (error) {
    debug.error("Migration failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Run the migration if this script is executed directly
if (typeof window !== 'undefined') {
  // Only show the migration UI in development mode
  if (process.env.NODE_ENV === 'development') {
    const runMigration = () => {
      const migrationButton = document.createElement('button');
      migrationButton.innerText = 'Run YouTube Links Migration';
      migrationButton.style.position = 'fixed';
      migrationButton.style.bottom = '20px';
      migrationButton.style.right = '20px';
      migrationButton.style.zIndex = '9999';
      migrationButton.style.padding = '10px';
      migrationButton.style.backgroundColor = '#3b82f6';
      migrationButton.style.color = 'white';
      migrationButton.style.borderRadius = '4px';
      migrationButton.style.border = 'none';
      migrationButton.style.cursor = 'pointer';
      
      migrationButton.onclick = async () => {
        migrationButton.innerText = 'Running Migration...';
        migrationButton.disabled = true;
        
        try {
          const result = await migrateYoutubeLinksToExternalLinks();
          
          if (result.success) {
            migrationButton.innerText = `Success: ${result.message}`;
            migrationButton.style.backgroundColor = '#10b981';
          } else {
            migrationButton.innerText = `Failed: ${result.error}`;
            migrationButton.style.backgroundColor = '#ef4444';
          }
          
          setTimeout(() => {
            document.body.removeChild(migrationButton);
          }, 5000);
        } catch (error) {
          migrationButton.innerText = `Error: ${error instanceof Error ? error.message : String(error)}`;
          migrationButton.style.backgroundColor = '#ef4444';
        }
      };
      
      document.body.appendChild(migrationButton);
    };
    
    // Run after DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runMigration);
    } else {
      runMigration();
    }
  }
} 