function config = supabase_config_template()
% Copy this file to supabase_config.m and fill in your real Supabase values.
% Keep supabase_config.m private. It is ignored by Git.

config.url = "https://YOUR_PROJECT_REF.supabase.co";
config.key = "YOUR_SUPABASE_PUBLISHABLE_KEY";
config.deviceId = "vehicle_001";
config.pollSeconds = 1.5;
config.maxSamples = 120;
end
