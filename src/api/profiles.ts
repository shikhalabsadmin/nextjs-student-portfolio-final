import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { User } from "@supabase/supabase-js";

export const getProfileInfo = async (profileId: string, fields?: string[]) => {
  logger.info(`Fetching profile info for profileId: ${profileId}`);

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(fields?.length ? fields.join(", ") : "*")
      .eq("id", profileId)
      .single();

    if (error) {
      logger.error(`Error fetching profile info`, { profileId, error });
      return {
        error: true,
        message: `Failed to fetch profile: ${error.message}`,
      };
    }

    return data;
  } catch (error: unknown) {
    logger.error(`Error fetching profile info`, { profileId, error });
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error fetching profile info";
    return { error: true, message: errorMessage };
  }
};
